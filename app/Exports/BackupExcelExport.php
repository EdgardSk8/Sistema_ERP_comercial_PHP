<?php

namespace App\Exports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class BackupExcelExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        $tablas = DB::select('SHOW TABLES');

        $db = DB::connection()->getDatabaseName();
        $key = "Tables_in_{$db}";

        $sheets = [];

        foreach ($tablas as $tabla) {

            $nombre = $tabla->$key;

            $sheets[] = new TablaSheetExport($nombre);
        }

        return $sheets;
    }
}