<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Forzar archivos locales
    |--------------------------------------------------------------------------
    |
    | Con true el sistema nunca usa el CDN y carga todo desde public/libs.
    | Util para trabajar sin internet o para probar el modo offline.
    | Se controla con ASSETS_LOCAL en el .env.
    |
    */

    'forzar_local' => env('ASSETS_LOCAL', false),

    /*
    |--------------------------------------------------------------------------
    | Duracion de la comprobacion de conexion (minutos)
    |--------------------------------------------------------------------------
    |
    | Comprobar internet en cada peticion es costoso, asi que el resultado se
    | recuerda: mas tiempo cuando hay conexion, menos cuando no la hay para
    | detectar antes que el wifi volvio.
    |
    */

    'cache_con_conexion' => 30,
    'cache_sin_conexion' => 2,

    /*
    |--------------------------------------------------------------------------
    | Recursos de front-end
    |--------------------------------------------------------------------------
    |
    | cdn   -> URL publica (se usa cuando hay internet, es mas rapido)
    | local -> ruta dentro de public/ (se usa cuando no hay internet)
    |
    | Las versiones viven aqui: al actualizar una libreria se cambia solo esta
    | lista y se vuelve a ejecutar `php descargar_libs.php`.
    |
    */

    'recursos' => [

        'bootstrap_css' => [
            'cdn' => 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
            'local' => 'libs/bootstrap/5.3.3/bootstrap.min.css',
        ],

        'datatables_css' => [
            'cdn' => 'https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css',
            'local' => 'libs/datatables/1.13.8/dataTables.bootstrap5.min.css',
        ],

        'jquery' => [
            'cdn' => 'https://code.jquery.com/jquery-3.7.1.min.js',
            'local' => 'libs/jquery/3.7.1/jquery.min.js',
        ],

        'datatables_js' => [
            'cdn' => 'https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js',
            'local' => 'libs/datatables/1.13.8/jquery.dataTables.min.js',
        ],

        'datatables_bs5_js' => [
            'cdn' => 'https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js',
            'local' => 'libs/datatables/1.13.8/dataTables.bootstrap5.min.js',
        ],

        'bootstrap_js' => [
            'cdn' => 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
            'local' => 'libs/bootstrap/5.3.3/bootstrap.bundle.min.js',
        ],

        'select2_js' => [
            'cdn' => 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js',
            'local' => 'libs/select2/4.1.0-rc.0/select2.min.js',
        ],

        'select2_css' => [
            'cdn' => 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css',
            'local' => 'libs/select2/4.1.0-rc.0/select2.min.css',
        ],

        'turbo' => [
            'cdn' => 'https://unpkg.com/@hotwired/turbo@7.3.0/dist/turbo.es2017-umd.js',
            'local' => 'libs/turbo/7.3.0/turbo.es2017-umd.js',
        ],

        'flatpickr_js' => [
            'cdn' => 'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js',
            'local' => 'libs/flatpickr/4.6.13/flatpickr.min.js',
        ],

        'flatpickr_es' => [
            'cdn' => 'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/l10n/es.js',
            'local' => 'libs/flatpickr/4.6.13/es.js',
        ],

        'flatpickr_css' => [
            'cdn' => 'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.css',
            'local' => 'libs/flatpickr/4.6.13/flatpickr.min.css',
        ],

        'chartjs' => [
            'cdn' => 'https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js',
            'local' => 'libs/chartjs/4.5.1/chart.umd.min.js',
        ],

        'chartjs_datalabels' => [
            'cdn' => 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0/dist/chartjs-plugin-datalabels.min.js',
            'local' => 'libs/chartjs-plugin-datalabels/2.0.0/chartjs-plugin-datalabels.min.js',
        ],

        'buttons_css' => [
            'cdn' => 'https://cdn.datatables.net/buttons/2.4.2/css/buttons.dataTables.min.css',
            'local' => 'libs/datatables-buttons/2.4.2/buttons.dataTables.min.css',
        ],

        'buttons_js' => [
            'cdn' => 'https://cdn.datatables.net/buttons/2.4.2/js/dataTables.buttons.min.js',
            'local' => 'libs/datatables-buttons/2.4.2/dataTables.buttons.min.js',
        ],

        'jszip' => [
            'cdn' => 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
            'local' => 'libs/jszip/3.10.1/jszip.min.js',
        ],

        'pdfmake' => [
            'cdn' => 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js',
            'local' => 'libs/pdfmake/0.2.7/pdfmake.min.js',
        ],

        'pdfmake_fonts' => [
            'cdn' => 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js',
            'local' => 'libs/pdfmake/0.2.7/vfs_fonts.js',
        ],

        'buttons_html5_js' => [
            'cdn' => 'https://cdn.datatables.net/buttons/2.4.2/js/buttons.html5.min.js',
            'local' => 'libs/datatables-buttons/2.4.2/buttons.html5.min.js',
        ],

        'buttons_print_js' => [
            'cdn' => 'https://cdn.datatables.net/buttons/2.4.2/js/buttons.print.min.js',
            'local' => 'libs/datatables-buttons/2.4.2/buttons.print.min.js',
        ],

        'phosphor_css' => [
            'cdn' => 'https://unpkg.com/@phosphor-icons/web@2.0.3/src/regular/style.css',
            'local' => 'libs/phosphor/2.0.3/style.css',
        ],

    ],

];
