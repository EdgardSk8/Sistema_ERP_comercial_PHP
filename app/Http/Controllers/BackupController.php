<?php

namespace App\Http\Controllers;

use App\Exports\BackupExcelExport;
use App\Support\EsquemaBaseDatos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class BackupController extends Controller
{
    /* ╔══════════════════════════════════════╗
       ║          ENDPOINT PRINCIPAL          ║
       ╚══════════════════════════════════════╝ */

    public function exportar(Request $request)
    {
        $formato = $request->formato ?? 'sql';
        $tipo = $request->tipo ?? 'datos';

        return match ($formato) {

            'sql' => $this->exportarSQL($tipo),
            'csv' => $this->exportarCSV(),
            'excel' => $this->exportarExcel(),
            'pdf' => $this->exportarPDF(),

            default => response()->json([
                'success' => false,
                'message' => 'Formato no válido',
                'debug' => $formato,
            ], 400)
        };
    }

    /* ╔══════════════════════════════════════╗
       ║              EXCEL REAL              ║
       ╚══════════════════════════════════════╝ */

    private function exportarExcel()
    {
        return Excel::download(
            new BackupExcelExport,
            $this->generarNombreArchivo('xlsx')
        );
    }

    /* ╔══════════════════════════════════════╗
       ║              SQL DUMP                ║
       ╚══════════════════════════════════════╝ */

    private function exportarSQL(string $tipo)
    {
        $db = DB::connection()->getDatabaseName();
        $nombre = $this->generarNombreArchivo('sql', $db);
        $ruta = storage_path("app/backups/{$nombre}");

        if (! File::exists(storage_path('app/backups'))) {
            File::makeDirectory(storage_path('app/backups'), 0777, true);
        }

        $mysqldump = config('backup.mysqldump_path');

        // Supabase / PostgreSQL: el volcado se genera desde la conexión PDO
        // (no requiere mysqldump ni binarios instalados en el servidor).
        if (EsquemaBaseDatos::esPostgres()) {
            $this->generarVolcadoPostgres($ruta, $tipo);

            return response()->download($ruta)->deleteFileAfterSend(true);
        }

        $config = DB::connection()->getConfig();

        $host = $config['host'] ?? '127.0.0.1';
        $port = $config['port'] ?? '3306';
        $user = $config['username'] ?? '';
        $pass = $config['password'] ?? '';

        putenv("MYSQL_PWD={$pass}");

        $opciones = match ($tipo) {
            'estructura' => '--no-data',
            'datos' => '--no-create-info',
            default => ''
        };

        $cmd = "\"{$mysqldump}\" --host={$host} --port={$port} --user={$user} {$opciones} {$db} > \"{$ruta}\"";

        exec($cmd, $out, $status);

        if ($status !== 0) {
            return response()->json([
                'success' => false,
                'message' => 'Error generando backup SQL',
                'debug' => $cmd,
            ], 500);
        }

        return response()->download($ruta)->deleteFileAfterSend(true);
    }

    /* ╔══════════════════════════════════════╗
       ║              CSV EXPORT              ║
       ╚══════════════════════════════════════╝ */

    private function exportarCSV()
    {
        $tablas = $this->obtenerTablas();

        $nombre = $this->generarNombreArchivo('csv');
        $ruta = storage_path("app/backups/{$nombre}");

        $file = fopen($ruta, 'w');

        foreach ($tablas as $tabla) {

            $data = DB::table($tabla)->get();

            fputcsv($file, ["=== TABLA: {$tabla} ==="]);

            if ($data->count() > 0) {

                fputcsv($file, array_keys((array) $data->first()));

                foreach ($data as $row) {
                    fputcsv($file, array_map([$this, 'valorTexto'], (array) $row));
                }
            }

            fputcsv($file, []);
        }

        fclose($file);

        return response()->download($ruta)->deleteFileAfterSend(true);
    }

    /* ╔══════════════════════════════════════╗
       ║              PDF EXPORT              ║
       ╚══════════════════════════════════════╝ */

    private function exportarPDF()
    {
        $tablas = $this->obtenerTablas();

        $html = '<h1>Backup del Sistema</h1>';

        foreach ($tablas as $tabla) {

            $html .= "<h2>{$tabla}</h2>";

            $data = DB::table($tabla)->limit(100)->get();

            $html .= "<table border='1' width='100%' cellpadding='5'>";

            if ($data->count() > 0) {

                $html .= '<tr>';

                foreach (array_keys((array) $data->first()) as $col) {
                    $html .= "<th>{$col}</th>";
                }

                $html .= '</tr>';

                foreach ($data as $row) {

                    $html .= '<tr>';

                    foreach ((array) $row as $val) {
                        $html .= '<td>'.e($this->valorTexto($val)).'</td>';
                    }

                    $html .= '</tr>';
                }
            }

            $html .= '</table><br>';
        }

        $pdf = app('dompdf.wrapper');
        $pdf->loadHTML($html);

        return $pdf->download($this->generarNombreArchivo('pdf'));
    }

    /* ╔══════════════════════════════════════╗
       ║     VOLCADO POSTGRESQL (SUPABASE)    ║
       ╚══════════════════════════════════════╝ */

    /**
     * Genera el respaldo SQL sin depender de pg_dump/mysqldump.
     * $tipo: datos (default) | estructura | completo.
     */
    private function generarVolcadoPostgres(string $ruta, string $tipo): void
    {
        $pdo = DB::connection()->getPdo();
        $salida = fopen($ruta, 'w');

        fwrite($salida, "-- Respaldo ERP (PostgreSQL)\n");
        fwrite($salida, '-- Generado: '.now()->toDateTimeString()."\n");
        fwrite($salida, "SET client_encoding = 'UTF8';\n");
        fwrite($salida, "SET standard_conforming_strings = on;\n\n");

        $tablas = $this->obtenerTablas();

        if ($tipo !== 'datos') {
            foreach ($tablas as $tabla) {
                fwrite($salida, $this->ddlTablaPostgres($tabla)."\n");
            }
        }

        if ($tipo !== 'estructura') {
            fwrite($salida, "BEGIN;\n\n");

            foreach ($tablas as $tabla) {
                $this->volcarDatosTabla($salida, $tabla, $pdo);
            }

            foreach ($tablas as $tabla) {
                $this->volcarSecuencias($salida, $tabla);
            }

            fwrite($salida, "COMMIT;\n");
        }

        fclose($salida);
    }

    /**
     * @param  resource  $salida  Archivo abierto con fopen()
     */
    private function volcarDatosTabla($salida, string $tabla, \PDO $pdo): void
    {
        $tipos = EsquemaBaseDatos::tiposColumnas($tabla);

        if ($tipos === []) {
            return;
        }

        $columnas = array_keys($tipos);
        $lista = implode(', ', array_map(fn ($columna) => '"'.$columna.'"', $columnas));

        fwrite($salida, "-- Tabla: {$tabla}\n");

        foreach (DB::table($tabla)->cursor() as $fila) {
            $valores = [];

            foreach ($columnas as $columna) {
                $valores[] = $this->valorPostgres($fila->{$columna} ?? null, $tipos[$columna], $pdo);
            }

            fwrite($salida, 'INSERT INTO "'.$tabla.'" ('.$lista.') VALUES ('.implode(', ', $valores).");\n");
        }

        fwrite($salida, "\n");
    }

    private function valorPostgres(mixed $valor, string $tipo, \PDO $pdo): string
    {
        if ($valor === null) {
            return 'NULL';
        }

        if (is_bool($valor)) {
            return $valor ? 'TRUE' : 'FALSE';
        }

        if ($tipo === 'boolean') {
            return in_array($valor, [1, '1', 't', 'true', 'TRUE'], true) ? 'TRUE' : 'FALSE';
        }

        if ($tipo === 'bytea') {
            return "'\\x".bin2hex((string) $valor)."'::bytea";
        }

        if (is_int($valor) || is_float($valor)) {
            return (string) $valor;
        }

        if (is_array($valor)) {
            $valor = json_encode($valor, JSON_UNESCAPED_UNICODE);
        }

        return $pdo->quote((string) $valor);
    }

    private function ddlTablaPostgres(string $tabla): string
    {
        $columnas = DB::select(
            'SELECT column_name, data_type, udt_name, character_maximum_length,
                    numeric_precision, numeric_scale, is_nullable, column_default, is_identity
             FROM information_schema.columns
             WHERE table_schema = current_schema() AND table_name = ?
             ORDER BY ordinal_position',
            [$tabla]
        );

        if ($columnas === []) {
            return '';
        }

        $lineas = [];

        foreach ($columnas as $columna) {
            $definicion = '    "'.$columna->column_name.'" '.$this->tipoPostgres($columna);

            if ($columna->is_identity === 'YES') {
                $definicion .= ' GENERATED BY DEFAULT AS IDENTITY';
            } elseif ($columna->column_default !== null && ! str_contains((string) $columna->column_default, 'nextval(')) {
                $definicion .= ' DEFAULT '.$columna->column_default;
            }

            if ($columna->is_nullable === 'NO') {
                $definicion .= ' NOT NULL';
            }

            $lineas[] = $definicion;
        }

        $restricciones = DB::select(
            "SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
             FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu
               ON kcu.constraint_name = tc.constraint_name
              AND kcu.table_schema = tc.table_schema
             WHERE tc.table_schema = current_schema()
               AND tc.table_name = ?
               AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
             ORDER BY tc.constraint_name, kcu.ordinal_position",
            [$tabla]
        );

        $agrupadas = [];

        foreach ($restricciones as $restriccion) {
            $agrupadas[$restriccion->constraint_name]['tipo'] = $restriccion->constraint_type;
            $agrupadas[$restriccion->constraint_name]['columnas'][] = '"'.$restriccion->column_name.'"';
        }

        foreach ($agrupadas as $nombre => $datos) {
            $lineas[] = '    CONSTRAINT "'.$nombre.'" '.$datos['tipo'].' ('.implode(', ', $datos['columnas']).')';
        }

        $foraneas = DB::select(
            "SELECT tc.constraint_name, kcu.column_name,
                    ccu.table_name AS tabla_referenciada, ccu.column_name AS columna_referenciada
             FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu
               ON kcu.constraint_name = tc.constraint_name
              AND kcu.table_schema = tc.table_schema
             JOIN information_schema.constraint_column_usage ccu
               ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
             WHERE tc.constraint_type = 'FOREIGN KEY'
               AND tc.table_schema = current_schema()
               AND tc.table_name = ?
             ORDER BY tc.constraint_name, kcu.ordinal_position",
            [$tabla]
        );

        $foraneasAgrupadas = [];

        foreach ($foraneas as $foranea) {
            $foraneasAgrupadas[$foranea->constraint_name]['columnas'][] = '"'.$foranea->column_name.'"';
            $foraneasAgrupadas[$foranea->constraint_name]['tabla'] = $foranea->tabla_referenciada;
            $foraneasAgrupadas[$foranea->constraint_name]['referenciada'][] = '"'.$foranea->columna_referenciada.'"';
        }

        foreach ($foraneasAgrupadas as $nombre => $foranea) {
            $lineas[] = '    CONSTRAINT "'.$nombre.'" FOREIGN KEY ('.implode(', ', $foranea['columnas']).')'
                .' REFERENCES "'.$foranea['tabla'].'" ('.implode(', ', $foranea['referenciada']).')';
        }

        $ddl = "-- Estructura: {$tabla}\n";
        $ddl .= 'CREATE TABLE IF NOT EXISTS "'.$tabla.'" ('.PHP_EOL.implode(','.PHP_EOL, $lineas).PHP_EOL.');'.PHP_EOL;

        // Los índices que soportan restricciones ya se crean con ellas.
        $nombresRestricciones = array_keys($agrupadas);

        foreach (DB::select('SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = current_schema() AND tablename = ?', [$tabla]) as $indice) {
            if (in_array($indice->indexname, $nombresRestricciones, true)) {
                continue;
            }

            $ddl .= $indice->indexdef.';'.PHP_EOL;
        }

        return $ddl;
    }

    private function tipoPostgres(object $columna): string
    {
        $tipo = strtolower($columna->data_type);
        $udt = strtolower($columna->udt_name);

        if (str_contains((string) $columna->column_default, 'nextval(')) {
            return $tipo === 'bigint' ? 'bigserial' : 'serial';
        }

        if ($tipo === 'character varying') {
            return $columna->character_maximum_length ? 'varchar('.$columna->character_maximum_length.')' : 'varchar';
        }

        if ($tipo === 'character') {
            return $columna->character_maximum_length ? 'char('.$columna->character_maximum_length.')' : 'char';
        }

        if ($tipo === 'numeric' && $columna->numeric_precision) {
            return $columna->numeric_scale !== null
                ? 'numeric('.$columna->numeric_precision.','.$columna->numeric_scale.')'
                : 'numeric('.$columna->numeric_precision.')';
        }

        if ($tipo === 'array') {
            $base = ltrim($udt, '_');

            return match ($base) {
                'int2' => 'smallint[]',
                'int4' => 'integer[]',
                'int8' => 'bigint[]',
                'float4' => 'real[]',
                'float8' => 'double precision[]',
                'bool' => 'boolean[]',
                default => $base.'[]',
            };
        }

        return match ($tipo) {
            'timestamp without time zone' => 'timestamp',
            'timestamp with time zone' => 'timestamptz',
            'time without time zone' => 'time',
            'time with time zone' => 'timetz',
            'user-defined' => $udt,
            default => $tipo,
        };
    }

    /**
     * @param  resource  $salida  Archivo abierto con fopen()
     */
    private function volcarSecuencias($salida, string $tabla): void
    {
        $columnas = DB::select(
            "SELECT column_name FROM information_schema.columns
             WHERE table_schema = current_schema() AND table_name = ?
               AND (column_default LIKE 'nextval(%' OR is_identity = 'YES')",
            [$tabla]
        );

        foreach ($columnas as $columna) {
            $columnaSql = '"'.$columna->column_name.'"';
            $tablaSql = '"'.$tabla.'"';

            fwrite($salida, "SELECT setval(pg_get_serial_sequence('{$tablaSql}', '{$columna->column_name}'), "
                ."COALESCE((SELECT MAX({$columnaSql}) FROM {$tablaSql}), 1), "
                ."(SELECT MAX({$columnaSql}) FROM {$tablaSql}) IS NOT NULL);\n");
        }
    }

    /* ╔══════════════════════════════════════╗
       ║        OBTENER TABLAS MYSQL          ║
       ╚══════════════════════════════════════╝ */

    private function obtenerTablas()
    {
        return EsquemaBaseDatos::tablas();
    }

    /* ╔══════════════════════════════════════╗
       ║        GENERAR NOMBRE ARCHIVO        ║
       ╚══════════════════════════════════════╝ */

    private function generarNombreArchivo(string $ext, ?string $nombreBase = null)
    {
        $prefijo = $nombreBase
            ? Str::slug($nombreBase, '_')
            : 'Licoreria';

        return ($prefijo ?: 'respaldo').'_'.now()->format('Ymd_His').".{$ext}";
    }

    /** Convierte cualquier valor de BD a texto plano (array/json/booleano/nulo). */
    private function valorTexto(mixed $valor): string
    {
        if ($valor === null) {
            return '';
        }

        if (is_bool($valor)) {
            return $valor ? '1' : '0';
        }

        if (is_array($valor)) {
            return (string) json_encode($valor, JSON_UNESCAPED_UNICODE);
        }

        return (string) $valor;
    }

    /* ╔══════════════════════════════════════╗
       ║           IMPORTAR SQL               ║
       ╚══════════════════════════════════════╝ */

    public function importarSQL(Request $request)
    {
        $request->validate([
            'archivo' => 'required|file|mimes:sql,txt',
        ]);

        $sentencias = EsquemaBaseDatos::dividirSQL(
            file_get_contents($request->file('archivo')->getRealPath())
        );

        try {
            if (EsquemaBaseDatos::esPostgres()) {
                $this->restaurarPostgres($sentencias);
            } else {
                $this->restaurarMySQL($sentencias);
            }

            return response()->json([
                'success' => true,
                'message' => 'Base de datos restaurada correctamente',
            ]);
        } catch (\Throwable $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /** Restaura en PostgreSQL/Supabase vaciando tablas con CASCADE. */
    private function restaurarPostgres(array $sentencias): void
    {
        $tablas = $this->obtenerTablas();

        if ($tablas !== []) {
            $lista = implode(', ', array_map(fn ($tabla) => '"'.$tabla.'"', $tablas));
            DB::statement("TRUNCATE TABLE {$lista} RESTART IDENTITY CASCADE");
        }

        foreach ($sentencias as $sentencia) {
            if ($this->esControlTransaccion($sentencia)) {
                continue;
            }

            DB::statement($sentencia);
        }
    }

    /** Restaura en MySQL/MariaDB (comportamiento anterior). */
    private function restaurarMySQL(array $sentencias): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        try {
            foreach ($this->obtenerTablas() as $tabla) {
                DB::table($tabla)->truncate();
            }

            foreach ($sentencias as $sentencia) {
                if ($this->esControlTransaccion($sentencia)) {
                    continue;
                }

                DB::statement($sentencia);
            }
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    /** BEGIN/COMMIT del archivo se ignoran: la importación controla la transacción. */
    private function esControlTransaccion(string $sentencia): bool
    {
        return (bool) preg_match('/^(begin|start\s+transaction|commit|rollback)\b/i', trim($sentencia));
    }
}
