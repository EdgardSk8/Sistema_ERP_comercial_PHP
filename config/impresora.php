<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Impresora térmica ESC/POS
    |--------------------------------------------------------------------------
    |
    | Nombre exacto de la cola de impresión de Windows (Panel de control >
    | Dispositivos e impresoras). El ticket se envía en crudo (RAW) a esa
    | cola mediante el script de app/Support/ImpresoraRaw.ps1.
    |
    */

    'nombre' => env('IMPRESORA_TERMICA', 'POS80 Printer'),

    // Fuente de la impresora: A = normal (32 columnas), B = pequeña (42).
    'fuente' => env('IMPRESORA_TERMICA_FUENTE', 'B'),

    // Columnas reales del cabezal de 58 mm según la fuente.
    'columnas' => (int) env('IMPRESORA_TERMICA_COLUMNAS', 42),

    // Líneas de avance después del pie (ESC d n).
    'lineas_avance' => (int) env('IMPRESORA_TERMICA_AVANCE', 2),

    // Script que envía los bytes al spooler sin pasar por el driver.
    'script_raw' => base_path('app/Support/ImpresoraRaw.ps1'),

];
