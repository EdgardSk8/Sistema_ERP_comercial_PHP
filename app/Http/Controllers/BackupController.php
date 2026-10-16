<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\BackupExcelExport;

class BackupController extends Controller
{
    /* ╔══════════════════════════════════════╗
       ║          ENDPOINT PRINCIPAL          ║
       ╚══════════════════════════════════════╝ */

    public function exportar(Request $request)
    {
        $formato = $request->formato ?? 'sql';
        $tipo    = $request->tipo ?? 'datos';

        return match ($formato) {

            'sql'   => $this->exportarSQL($tipo),
            'csv'   => $this->exportarCSV(),
            'excel' => $this->exportarExcel(),
            'pdf'   => $this->exportarPDF(),

            default => response()->json([
                'success' => false,
                'message' => 'Formato no válido',
                'debug'   => $formato
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

    private function exportarSQL($tipo)
    {
        $db = DB::connection()->getDatabaseName();
        $nombre = $this->generarNombreArchivo('sql', $db);
        $ruta = storage_path("app/backups/{$nombre}");

        if (!File::exists(storage_path('app/backups'))) {
            File::makeDirectory(storage_path('app/backups'), 0777, true);
        }

        $mysqldump = config('backup.mysqldump_path');

        $config = DB::connection()->getConfig();

        $host = $config['host'] ?? '127.0.0.1';
        $port = $config['port'] ?? '3306';
        $user = $config['username'] ?? '';
        $pass = $config['password'] ?? '';

        putenv("MYSQL_PWD={$pass}");

        $opciones = match ($tipo) {
            'estructura' => '--no-data',
            'datos'      => '--no-create-info',
            default      => ''
        };

        $cmd = "\"{$mysqldump}\" --host={$host} --port={$port} --user={$user} {$opciones} {$db} > \"{$ruta}\"";

        exec($cmd, $out, $status);

        if ($status !== 0) {
            return response()->json([
                'success' => false,
                'message' => 'Error generando backup SQL',
                'debug'   => $cmd
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

                fputcsv($file, array_keys((array)$data->first()));

                foreach ($data as $row) {
                    fputcsv($file, (array)$row);
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

        $html = "<h1>Backup del Sistema</h1>";

        foreach ($tablas as $tabla) {

            $html .= "<h2>{$tabla}</h2>";

            $data = DB::table($tabla)->limit(100)->get();

            $html .= "<table border='1' width='100%' cellpadding='5'>";

            if ($data->count() > 0) {

                $html .= "<tr>";

                foreach (array_keys((array)$data->first()) as $col) {
                    $html .= "<th>{$col}</th>";
                }

                $html .= "</tr>";

                foreach ($data as $row) {

                    $html .= "<tr>";

                    foreach ((array)$row as $val) {
                        $html .= "<td>{$val}</td>";
                    }

                    $html .= "</tr>";
                }
            }

            $html .= "</table><br>";
        }

        $pdf = app('dompdf.wrapper');
        $pdf->loadHTML($html);

        return $pdf->download($this->generarNombreArchivo('pdf'));
    }

    /* ╔══════════════════════════════════════╗
       ║        OBTENER TABLAS MYSQL          ║
       ╚══════════════════════════════════════╝ */

    private function obtenerTablas()
    {
        return collect(DB::select('SHOW TABLES'))
            ->map(fn($row) => array_values((array)$row)[0])
            ->toArray();
    }

    /* ╔══════════════════════════════════════╗
       ║        GENERAR NOMBRE ARCHIVO        ║
       ╚══════════════════════════════════════╝ */

    private function generarNombreArchivo($ext, ?string $nombreBase = null)
    {
        $prefijo = $nombreBase
            ? Str::slug($nombreBase, '_')
            : 'Licoreria';

        return ($prefijo ?: 'respaldo') . '_' . now()->format('Ymd_His') . ".{$ext}";
    }


/* ╔══════════════════════════════════════╗
   ║           IMPORTAR SQL               ║
   ╚══════════════════════════════════════╝ */

 public function importarSQL(Request $request)
{
    $request->validate([
        'archivo' => 'required|file|mimes:sql,txt'
    ]);

    try {

        $sql = file_get_contents($request->file('archivo')->getRealPath());

        $queries = array_filter(
            array_map('trim', explode(';', $sql))
        );

        // =========================
        // DESACTIVAR FK
        // =========================
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // =========================
        // LIMPIAR TABLAS (SIN TRANSACTION)
        // =========================
        $tablas = DB::select('SHOW TABLES');

        foreach ($tablas as $t) {
            $tabla = array_values((array)$t)[0];
            DB::table($tabla)->truncate();
        }

        // =========================
        // IMPORTAR SQL
        // =========================
        foreach ($queries as $query) {
            if (!empty($query)) {
                DB::statement($query);
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        return response()->json([
            'success' => true,
            'message' => 'Base de datos restaurada correctamente'
        ]);

    } catch (\Throwable $e) {

        // IMPORTANTE: NO rollback aquí porque no hay transaction

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        return response()->json([
            'success' => false,
            'message' => $e->getMessage()
        ], 500);
    }
}

    
}