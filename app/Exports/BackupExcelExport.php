<?php

namespace App\Exports;

use App\Support\EsquemaBaseDatos;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class BackupExcelExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        $sheets = [];

        foreach (EsquemaBaseDatos::tablas() as $nombre) {
            $sheets[] = new TablaSheetExport($nombre);
        }

        return $sheets;
    }
}
