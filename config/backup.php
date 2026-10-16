<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Ruta del ejecutable mysqldump
    |--------------------------------------------------------------------------
    |
    | Se define en config para que funcione con la configuracion cacheada
    | (php artisan config:cache). No usar env() fuera de los archivos de config.
    |
    */

    'mysqldump_path' => env('MYSQLDUMP_PATH', 'mysqldump'),

];
