<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PDOException;
use Throwable;

/**
 * Diagnóstico de la conexión a base de datos (Supabase / PostgreSQL).
 *
 * Traduce los errores más habituales a instrucciones concretas para que
 * cualquier fallo de conexión o de esquema se pueda resolver sin adivinar.
 *
 *   php artisan bd:diagnostico
 *   php artisan bd:diagnostico --tablas
 *   php artisan bd:diagnostico --sql="select count(*) from productos"
 */
class DiagnosticoBd extends Command
{
    protected $signature = 'bd:diagnostico
                            {--sql= : Ejecuta una consulta de prueba y muestra el resultado}
                            {--tablas : Muestra el conteo de filas de las tablas principales}';

    protected $description = 'Verifica la conexión a la base de datos y explica los errores más comunes';

    /** Tablas clave del ERP para validar que el esquema está cargado. */
    private array $tablasClave = [
        'productos', 'categoria', 'impuestos', 'tallas', 'variacion_tallas',
        'ventas', 'detalle_ventas', 'compras', 'detalle_compras',
        'cajas', 'cuentas', 'movimientos_caja', 'movimientos_cuentas',
        'usuarios', 'roles', 'permisos', 'clientes', 'proveedores',
        'lotes_inventario',
    ];

    public function handle(): int
    {
        $conexion = config('database.default');
        $config = config("database.connections.{$conexion}", []);

        $this->line('');
        $this->info('═══ Diagnóstico de base de datos — Tellez Store ═══');
        $this->line('');

        $this->table(['Parámetro', 'Valor'], [
            ['Conexión', $conexion],
            ['Driver', $config['driver'] ?? '—'],
            ['Host', $config['host'] ?? '—'],
            ['Puerto', $config['port'] ?? '—'],
            ['Base de datos', $config['database'] ?? '—'],
            ['Usuario', $config['username'] ?? '—'],
            ['Contraseña', blank($config['password'] ?? null) ? '(vacía)' : '********'],
            ['SSL', $config['sslmode'] ?? '—'],
            ['Esquema', $config['search_path'] ?? '—'],
            ['Conexión persistente', ! empty($config['options'][\PDO::ATTR_PERSISTENT] ?? false) ? 'sí' : 'no'],
            ['APP_ENV / APP_DEBUG', config('app.env').' / '.(config('app.debug') ? 'true' : 'false')],
        ]);

        if (! $this->verificarExtensiones((string) ($config['driver'] ?? ''))) {
            return self::FAILURE;
        }

        // ── 1. Conexión ───────────────────────────────────────────────────
        try {
            $inicio = microtime(true);
            $fila = DB::selectOne($this->consultaVersion((string) ($config['driver'] ?? '')));
            $ms = round((microtime(true) - $inicio) * 1000, 2);

            $this->info("OK  Conexión establecida en {$ms} ms");
            $this->line('    '.substr((string) $fila->version, 0, 90));
        } catch (Throwable $e) {
            return $this->reportarError($e);
        }

        // ── 2. Contexto de la sesión ──────────────────────────────────────
        if (($config['driver'] ?? '') === 'pgsql') {
            try {
                $ctx = DB::selectOne("
                    select current_database() as bd,
                           current_user    as usuario,
                           current_schema() as esquema,
                           (select ssl from pg_stat_ssl where pid = pg_backend_pid()) as ssl
                ");

                $this->line(sprintf(
                    '    base=%s | usuario=%s | esquema=%s | ssl=%s',
                    $ctx->bd,
                    $ctx->usuario,
                    $ctx->esquema,
                    $ctx->ssl ? 'sí' : 'no'
                ));
            } catch (Throwable $e) {
                $this->warn('    No se pudo leer el contexto de la sesión: '.$e->getMessage());
            }
        }

        // ── 3. Esquema del ERP ────────────────────────────────────────────
        $faltantes = [];

        try {
            foreach ($this->tablasClave as $tabla) {
                if (! Schema::hasTable($tabla)) {
                    $faltantes[] = $tabla;
                }
            }

            if ($faltantes !== []) {
                $this->warn('AVISO  Faltan tablas: '.implode(', ', $faltantes));
                $this->line('       Ejecuta tellez_store_nic_postgres.sql en el SQL Editor de Supabase.');
            } else {
                $this->info('OK  Las tablas principales del ERP existen.');
            }

            if (Schema::hasTable('migrations')) {
                $aplicadas = DB::table('migrations')->count();
                $this->line("    Migraciones registradas: {$aplicadas}");
            } else {
                $this->warn('AVISO  No existe la tabla migrations: `php artisan migrate` intentará crear todo de nuevo.');
            }
        } catch (Throwable $e) {
            $this->warn('AVISO  No se pudo verificar el esquema: '.$e->getMessage());
        }

        // ── 4. Conteos opcionales ─────────────────────────────────────────
        if ($this->option('tablas') && $faltantes === []) {
            $filas = [];

            foreach ($this->tablasClave as $tabla) {
                try {
                    $filas[] = [$tabla, DB::table($tabla)->count()];
                } catch (Throwable $e) {
                    $filas[] = [$tabla, 'ERROR: '.substr($e->getMessage(), 0, 60)];
                }
            }

            $this->line('');
            $this->table(['Tabla', 'Registros'], $filas);
        }

        // ── 5. Consulta libre ─────────────────────────────────────────────
        if ($sql = $this->option('sql')) {
            $this->line('');

            try {
                $inicio = microtime(true);
                $resultado = DB::select($sql);
                $ms = round((microtime(true) - $inicio) * 1000, 2);

                $this->info('OK  Consulta ejecutada: '.count($resultado)." fila(s) en {$ms} ms");

                if ($resultado !== []) {
                    $encabezados = array_keys((array) $resultado[0]);
                    $cuerpo = array_map(
                        fn ($fila) => array_map(
                            fn ($valor) => is_scalar($valor) || $valor === null
                                ? (string) ($valor ?? 'NULL')
                                : json_encode($valor, JSON_UNESCAPED_UNICODE),
                            (array) $fila
                        ),
                        array_slice($resultado, 0, 20)
                    );

                    $this->table($encabezados, $cuerpo);
                }
            } catch (Throwable $e) {
                return $this->reportarError($e);
            }
        }

        $this->line('');
        $this->info('Diagnóstico finalizado sin errores.');
        $this->line('');

        return self::SUCCESS;
    }

    /*  ╔════════ Extensiones de PHP ════════╗
        ╚════════════════════════════════════╝ */

    private function verificarExtensiones(string $driver): bool
    {
        $requeridas = match ($driver) {
            'pgsql' => ['pdo_pgsql', 'pgsql'],
            'mysql', 'mariadb' => ['pdo_mysql'],
            'sqlite' => ['pdo_sqlite'],
            default => [],
        };

        $faltan = array_values(array_filter($requeridas, fn ($ext) => ! extension_loaded($ext)));

        if ($faltan === []) {
            return true;
        }

        $this->error('ERROR  Faltan extensiones de PHP: '.implode(', ', $faltan));
        $this->line('       Abre '.(PHP_OS_FAMILY === 'Windows' ? 'C:\xampp\php\php.ini' : 'php.ini').' y quita el ";" de:');

        foreach ($faltan as $ext) {
            $this->line("       extension={$ext}");
        }

        $this->line('       Luego reinicia el servidor (php artisan serve / Apache).');

        return false;
    }

    private function consultaVersion(string $driver): string
    {
        return $driver === 'sqlite' ? 'select sqlite_version() as version' : 'select version() as version';
    }

    /*  ╔════════ Traducción de errores ════════╗
        ╚═══════════════════════════════════════╝ */

    private function reportarError(Throwable $e): int
    {
        $sqlState = $e instanceof PDOException
            ? (string) ($e->errorInfo[0] ?? $e->getCode())
            : null;

        $this->line('');
        $this->error('ERROR  No se pudo completar la operación con la base de datos.');
        $this->line('');

        $this->table(['Campo', 'Valor'], array_filter([
            ['Excepción', class_basename($e)],
            ['SQLSTATE', $sqlState ?: '—'],
            ['Código', (string) $e->getCode() ?: '—'],
            ['Mensaje', $e->getMessage()],
        ]));

        $pistas = $this->pistas($sqlState, $e->getMessage());

        if ($pistas !== []) {
            $this->line('Posibles causas y solución:');
            foreach ($pistas as $pista) {
                $this->line('  • '.$pista);
            }
        }

        $this->line('');
        $this->line('Comprobaciones rápidas:');
        $this->line('  • Tras cambiar .env: php artisan config:clear');
        $this->line('  • Si la contraseña tiene caracteres especiales, escríbela entre comillas dobles en DB_PASSWORD.');
        $this->line('  • Prueba la conexión con: php artisan bd:diagnostico --sql="select 1"');
        $this->line('');

        return self::FAILURE;
    }

    /**
     * @return array<int, string>
     */
    private function pistas(?string $sqlState, string $mensaje): array
    {
        $mensajeMin = strtolower($mensaje);

        $porEstado = [
            '28P01' => 'Contraseña incorrecta: revisa DB_PASSWORD (Supabase → Project Settings → Database → Reset database password).',
            '28000' => 'Usuario no autorizado. Con el Session Pooler el usuario debe ser postgres.<project_ref>.',
            '3D000' => 'La base de datos no existe: en Supabase el nombre es siempre "postgres".',
            '3F000' => 'El esquema de DB_SCHEMA no existe. Debe ser "public".',
            '42P01' => 'La tabla no existe: falta ejecutar tellez_store_nic_postgres.sql o el search_path es incorrecto.',
            '42501' => 'Permisos insuficientes (RLS): conecta con el rol "postgres" o revisa las políticas RLS de esa tabla.',
            '53300' => 'Demasiadas conexiones: usa el pooler (puerto 6543) o reduce conexiones persistentes.',
            '57P03' => 'El servidor no acepta conexiones todavía (arrancando o reiniciando). Espera unos segundos.',
            '08006' => 'No se pudo alcanzar el servidor: host/puerto incorrectos, firewall o red sin IPv6.',
            '08001' => 'No se pudo alcanzar el servidor: host/puerto incorrectos, firewall o red sin IPv6.',
        ];

        $pistas = [];

        if ($sqlState !== null && isset($porEstado[$sqlState])) {
            $pistas[] = $porEstado[$sqlState];
        }

        if (str_contains($mensajeMin, 'could not find driver')) {
            $pistas[] = 'La extensión pdo_pgsql no está habilitada: descomenta extension=pdo_pgsql en php.ini y reinicia PHP.';
        }

        if (str_contains($mensajeMin, 'tenant/user') || str_contains($mensajeMin, 'not found')) {
            $pistas[] = 'El pooler no reconoce el usuario: DB_USERNAME debe ser postgres.<project_ref> tal como aparece en Supabase → Connect.';
        }

        if (str_contains($mensajeMin, 'password authentication failed')) {
            $pistas[] = 'Contraseña incorrecta: cópiala de nuevo desde Supabase → Project Settings → Database.';
        }

        if (str_contains($mensajeMin, 'could not translate host name')
            || str_contains($mensajeMin, 'getaddrinfo')
            || str_contains($mensajeMin, 'name or service not known')) {
            $pistas[] = 'El host no resuelve. Copia la conexión exacta desde Supabase y, si no tienes IPv6, usa el Session Pooler (aws-0-<region>.pooler.supabase.com).';
        }

        if (str_contains($mensajeMin, 'connection refused')) {
            $pistas[] = 'Conexión rechazada: revisa el puerto (5432 directo/session pooler, 6543 transaction pooler) y que el proyecto esté activo.';
        }

        if (str_contains($mensajeMin, 'timed out') || str_contains($mensajeMin, 'timeout')) {
            $pistas[] = 'Tiempo de espera agotado: red bloqueada o conexión IPv6 no disponible. Usa el Session Pooler.';
        }

        if (str_contains($mensajeMin, 'ssl')) {
            $pistas[] = 'Problema de SSL: Supabase exige DB_SSLMODE=require.';
        }

        if (str_contains($mensajeMin, 'prepared statement') || str_contains($mensajeMin, 'cached plan')) {
            $pistas[] = 'Estás pasando por el Transaction Pooler (6543): no soporta sentencias preparadas. Usa el puerto 5432.';
        }

        if (str_contains($mensajeMin, 'no such table') || str_contains($mensajeMin, 'relation') && str_contains($mensajeMin, 'does not exist')) {
            $pistas[] = 'Falta el esquema: ejecuta tellez_store_nic_postgres.sql y luego tellez_store_nic_datos_postgres.sql en Supabase.';
        }

        return array_values(array_unique($pistas));
    }
}
