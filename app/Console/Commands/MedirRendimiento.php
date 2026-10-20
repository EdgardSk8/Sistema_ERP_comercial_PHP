<?php

namespace App\Console\Commands;

use App\Http\Controllers\CompraController;
use App\Http\Controllers\CuentaPorCobrarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MovimientoInventarioController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\VentaController;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MedirRendimiento extends Command
{
    protected $signature = 'rendimiento:medir
                            {--r=3 : Repeticiones por endpoint}
                            {--solo= : Filtra por grupo (dashboard, ventas, productos, reportes, cartera)}
                            {--url= : URL base para medir el piso HTTP (default: http://127.0.0.1:8000)}
                            {--detalle : Muestra las consultas mas costosas}';

    protected $description = 'Mide tiempo, consultas y memoria de los endpoints principales del ERP';

    /** @var array<int, array<string, mixed>> */
    protected array $usuario = [];

    /** @var array<int, string> */
    protected array $permisos = [];

    public function handle(): int
    {
        $this->usuario = $this->obtenerUsuario();
        $this->permisos = DB::table('permisos')->pluck('nombre_permiso')->all();

        if (empty($this->usuario)) {
            $this->error('No hay usuarios en la base de datos para simular la sesion.');

            return self::FAILURE;
        }

        $repeticiones = max(1, (int) $this->option('r'));
        $filtro = $this->option('solo');
        $casos = $this->casos();

        if ($filtro) {
            $casos = array_filter($casos, fn ($caso) => str_starts_with($caso['grupo'], $filtro));
        }

        if (empty($casos)) {
            $this->error('No hay casos que coincidan con el filtro.');

            return self::FAILURE;
        }

        $this->info("Usuario simulado: {$this->usuario['nombre_completo_usuario']} (rol {$this->usuario['id_rol']})");
        $this->info('Repeticiones por endpoint: '.$repeticiones.(config('app.debug') ? ' | APP_DEBUG=ON (los tiempos estan inflados)' : ''));

        $piso = $this->medirPisoHttp(2);

        if ($piso) {
            $this->newLine();
            $this->line('Piso HTTP (rutas que no consultan datos): <options=bold>'.implode('  |  ', $piso).'</>');
        }

        $filas = [];
        $detalles = [];

        foreach ($casos as $caso) {
            $medicion = $this->medir($caso, $repeticiones);

            if ($medicion['error']) {
                $filas[] = [$caso['grupo'], $caso['nombre'], 'ERROR', '-', '-', '-', '-', '-', $medicion['error']];

                continue;
            }

            $filas[] = [
                $caso['grupo'],
                $caso['nombre'],
                $this->ms($medicion['total']),
                $this->ms($medicion['db']),
                $this->ms(max(0, $medicion['total'] - $medicion['db'])),
                $medicion['queries'],
                $medicion['filas'],
                $this->kb($medicion['payload']),
                $this->kb($medicion['memoria']),
            ];

            $detalles[$caso['nombre']] = $medicion['lentas'];
        }

        $this->newLine();
        $this->table(
            ['Grupo', 'Endpoint', 'Tiempo', 'En BD', 'En PHP', 'Consultas', 'Filas', 'Payload', 'Memoria'],
            $filas
        );

        if ($this->option('detalle')) {
            $this->mostrarDetalle($detalles);
        }

        $this->newLine();
        $this->line('Lectura: "En BD" es lo que gastan las consultas; si domina, el problema es SQL.');
        $this->line('Consultas: si crece muy por encima de los registros devueltos, hay N+1.');
        $this->line('Si el piso HTTP ya ronda los cientos de ms, el cuello de botella es el arranque del framework, no los endpoints.');

        return self::SUCCESS;
    }

    /**
     * Mide el costo fijo de la aplicacion (arranque + middlewares) con rutas sin datos.
     *
     * @return array<int, string>
     */
    protected function medirPisoHttp(int $repeticiones): array
    {
        $base = rtrim($this->option('url') ?: 'http://127.0.0.1:8000', '/');
        $contexto = stream_context_create(['http' => ['timeout' => 10, 'ignore_errors' => true]]);
        $resultados = [];

        foreach (['up', 'login'] as $ruta) {
            $tiempos = [];

            for ($i = 0; $i < $repeticiones; $i++) {
                $inicio = microtime(true);
                $contenido = @file_get_contents($base.'/'.$ruta, false, $contexto);

                if ($contenido === false) {
                    $tiempos = [];
                    break;
                }

                $tiempos[] = (microtime(true) - $inicio) * 1000;
            }

            if ($tiempos) {
                $resultados[] = '/'.$ruta.' '.$this->ms($this->promedio($tiempos));
            }
        }

        return $resultados;
    }

    /**
     * Casos medibles: grupo, nombre, controlador, metodo y parametros.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function casos(): array
    {
        $inicio = now()->startOfMonth()->subMonth()->toDateString();
        $fin = now()->toDateString();
        $periodo = ['tipo' => 'mes', 'inicio' => $inicio, 'fin' => $fin];
        $reporte = ['fecha_inicio' => $inicio, 'fecha_fin' => $fin, 'limite' => 100];

        return [
            ['grupo' => 'dashboard', 'nombre' => 'dashboard/ventas', 'controlador' => DashboardController::class, 'metodo' => 'Ventas', 'params' => $periodo],
            ['grupo' => 'dashboard', 'nombre' => 'dashboard/ganancias', 'controlador' => DashboardController::class, 'metodo' => 'Ganancias', 'params' => $periodo],
            ['grupo' => 'dashboard', 'nombre' => 'dashboard/compras', 'controlador' => DashboardController::class, 'metodo' => 'Compras', 'params' => $periodo],
            ['grupo' => 'dashboard', 'nombre' => 'dashboard/cajas', 'controlador' => DashboardController::class, 'metodo' => 'Cajas', 'params' => $periodo],
            ['grupo' => 'dashboard', 'nombre' => 'dashboard/tallas', 'controlador' => DashboardController::class, 'metodo' => 'Tallas', 'params' => $periodo],
            ['grupo' => 'dashboard', 'nombre' => 'dashboard/movimiento-inventario', 'controlador' => DashboardController::class, 'metodo' => 'Movimientoinventario', 'params' => $periodo],
            ['grupo' => 'ventas', 'nombre' => 'ventas (todo)', 'controlador' => VentaController::class, 'metodo' => 'MostrarVentas', 'params' => []],
            ['grupo' => 'ventas', 'nombre' => 'ventas (paginado)', 'controlador' => VentaController::class, 'metodo' => 'MostrarVentas', 'params' => [
                'draw' => 1, 'start' => 0, 'length' => 50,
                'search' => ['value' => ''],
                'order' => [['column' => 0, 'dir' => 'desc']],
                'columns' => [],
            ]],
            ['grupo' => 'productos', 'nombre' => 'productos (todo)', 'controlador' => ProductoController::class, 'metodo' => 'MostrarProductos', 'params' => []],
            ['grupo' => 'productos', 'nombre' => 'productos (paginado)', 'controlador' => ProductoController::class, 'metodo' => 'MostrarProductos', 'params' => [
                'draw' => 1, 'start' => 0, 'length' => 50,
                'search' => ['value' => ''],
                'order' => [['column' => 0, 'dir' => 'asc']],
                'columns' => [],
            ]],
            ['grupo' => 'kardex', 'nombre' => 'kardex (paginado)', 'controlador' => MovimientoInventarioController::class, 'metodo' => 'MostrarMovimientosInventario', 'params' => [
                'draw' => 1, 'start' => 0, 'length' => 50,
                'search' => ['value' => ''],
                'order' => [['column' => 0, 'dir' => 'desc']],
                'columns' => [],
            ]],
            ['grupo' => 'compras', 'nombre' => 'compras (paginado)', 'controlador' => CompraController::class, 'metodo' => 'MostrarCompras', 'params' => [
                'draw' => 1, 'start' => 0, 'length' => 50,
                'search' => ['value' => ''],
                'order' => [['column' => 0, 'dir' => 'desc']],
                'columns' => [],
            ]],
            ['grupo' => 'reportes', 'nombre' => 'reportes/ventas', 'controlador' => ReporteController::class, 'metodo' => 'ReporteVentas', 'params' => $reporte],
            ['grupo' => 'reportes', 'nombre' => 'reportes/clientes', 'controlador' => ReporteController::class, 'metodo' => 'ReporteClientes', 'params' => $reporte],
            ['grupo' => 'reportes', 'nombre' => 'reportes/inventario', 'controlador' => ReporteController::class, 'metodo' => 'ReporteInventario', 'params' => $reporte],
            ['grupo' => 'reportes', 'nombre' => 'reportes/movimiento-inventario', 'controlador' => ReporteController::class, 'metodo' => 'ReporteMovimientoInventario', 'params' => $reporte],
            ['grupo' => 'reportes', 'nombre' => 'reportes/cajas', 'controlador' => ReporteController::class, 'metodo' => 'ReporteCajas', 'params' => $reporte],
            ['grupo' => 'cartera', 'nombre' => 'cuentas-por-cobrar/mostrar', 'controlador' => CuentaPorCobrarController::class, 'metodo' => 'Mostrar', 'params' => ['estado' => 'todas']],
        ];
    }

    /**
     * Ejecuta el endpoint N veces y devuelve la medicion agregada.
     *
     * @param  array<string, mixed>  $caso
     * @return array<string, mixed>
     */
    protected function medir(array $caso, int $repeticiones): array
    {
        $tiempos = [];
        $tiemposDb = [];
        $consultas = [];
        $lentas = [];
        $payload = [];
        $filas = [];
        $error = null;

        for ($i = 0; $i < $repeticiones; $i++) {
            $request = $this->requestSimulado($caso);
            app()->instance('request', $request);

            DB::flushQueryLog();
            DB::enableQueryLog();
            gc_collect_cycles();
            $memoriaInicial = memory_get_usage();

            $inicio = microtime(true);

            try {
                $controlador = app($caso['controlador']);
                $respuesta = $controlador->{$caso['metodo']}($request);

                $contenido = method_exists($respuesta, 'getContent') ? $respuesta->getContent() : (string) json_encode($respuesta);
                $payload[] = strlen($contenido);
                $filas[] = $this->contarFilas($contenido);

                unset($respuesta, $contenido);
            } catch (\Throwable $e) {
                $error = get_class($e).': '.$e->getMessage();
            }

            $total = (microtime(true) - $inicio) * 1000;
            $log = DB::getQueryLog();
            DB::disableQueryLog();

            if ($error) {
                break;
            }

            $db = array_sum(array_column($log, 'time'));

            $tiempos[] = $total;
            $tiemposDb[] = $db;
            $consultas[] = count($log);
            $lentas[] = $this->lentas($log);
            $memoria = max(0, memory_get_peak_usage() - $memoriaInicial);
        }

        if ($error) {
            return ['error' => $error, 'total' => 0, 'db' => 0, 'queries' => 0, 'memoria' => 0, 'lentas' => [], 'payload' => 0, 'filas' => 0];
        }

        return [
            'error' => null,
            'total' => $this->promedio($tiempos),
            'db' => $this->promedio($tiemposDb),
            'queries' => (int) round($this->promedio($consultas)),
            'memoria' => $memoria ?? 0,
            'lentas' => $this->mergeLentas($lentas),
            'payload' => (int) round($this->promedio($payload)),
            'filas' => (int) round($this->promedio($filas)),
        ];
    }

    /**
     * Cuenta los registros devueltos por el endpoint (primer array de objetos del JSON).
     */
    protected function contarFilas(string $contenido): int
    {
        $datos = json_decode($contenido, true);

        if (! is_array($datos)) {
            return 0;
        }

        foreach ($datos as $valor) {
            if (is_array($valor) && $valor !== [] && array_is_list($valor) && is_array(reset($valor))) {
                return count($valor);
            }
        }

        return 0;
    }

    protected function requestSimulado(array $caso): Request
    {
        $request = Request::create('/'.$caso['nombre'], 'GET', $caso['params']);
        $request->setLaravelSession(app('session.store'));
        $request->session()->put('usuario', $this->usuario);
        $request->session()->put('permisos', $this->permisos);

        return $request;
    }

    /** @return array<string, mixed> */
    protected function obtenerUsuario(): array
    {
        $usuario = DB::table('usuarios')->orderBy('id_usuario')->first();

        if (! $usuario) {
            return [];
        }

        return [
            'id_usuario' => $usuario->id_usuario,
            'id_rol' => 1,
            'nombre_completo_usuario' => $usuario->nombre_completo_usuario ?? 'Tester',
        ];
    }

    /**
     * Normaliza y agrupa las consultas para detectar N+1.
     *
     * @param  array<int, array<string, mixed>>  $log
     * @return array<int, array<string, mixed>>
     */
    protected function lentas(array $log): array
    {
        $agrupadas = [];

        foreach ($log as $query) {
            $sql = preg_replace('/\s+/', ' ', trim($query['query']));
            $clave = preg_replace('/\b\d+(\.\d+)?\b/', '?', $sql);
            $clave = substr($clave, 0, 160);

            if (! isset($agrupadas[$clave])) {
                $agrupadas[$clave] = ['sql' => $sql, 'veces' => 0, 'total' => 0.0];
            }

            $agrupadas[$clave]['veces']++;
            $agrupadas[$clave]['total'] += $query['time'];
        }

        uasort($agrupadas, fn ($a, $b) => $b['total'] <=> $a['total']);

        return array_slice(array_values($agrupadas), 0, 5);
    }

    /**
     * @param  array<int, array<int, array<string, mixed>>>  $lentas
     * @return array<int, array<string, mixed>>
     */
    protected function mergeLentas(array $lentas): array
    {
        $acumulado = [];

        foreach ($lentas as $grupo) {
            foreach ($grupo as $item) {
                $clave = substr($item['sql'], 0, 160);

                if (! isset($acumulado[$clave])) {
                    $acumulado[$clave] = $item;
                    continue;
                }

                $acumulado[$clave]['veces'] += $item['veces'];
                $acumulado[$clave]['total'] += $item['total'];
            }
        }

        uasort($acumulado, fn ($a, $b) => $b['total'] <=> $a['total']);

        return array_slice(array_values($acumulado), 0, 5);
    }

    /**
     * @param  array<string, array<int, array<string, mixed>>>  $detalles
     */
    protected function mostrarDetalle(array $detalles): void
    {
        foreach ($detalles as $nombre => $queries) {
            if (empty($queries)) {
                continue;
            }

            $this->newLine();
            $this->line("Consultas mas costosas en <options=bold>{$nombre}</>");

            $filas = array_map(fn ($item) => [
                $this->ms($item['total']),
                $item['veces'].($item['veces'] > 20 ? '  <fg=red>N+1?</>' : ''),
                substr($item['sql'], 0, 110),
            ], $queries);

            $this->table(['Total', 'Veces', 'SQL'], $filas);
        }
    }

    /** @param array<int, float> $valores */
    protected function promedio(array $valores): float
    {
        return count($valores) > 0 ? array_sum($valores) / count($valores) : 0.0;
    }

    protected function ms(float $valor): string
    {
        return number_format($valor, 1).' ms';
    }

    protected function kb(int $bytes): string
    {
        return number_format($bytes / 1024, 0).' KB';
    }
}
