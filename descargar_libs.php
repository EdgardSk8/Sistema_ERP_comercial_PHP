<?php

/**
 * Descarga las librerias de front-end usadas en resources/views/principal/links.blade.php
 * a public/libs/<libreria>/<version>/ para poder trabajar sin internet.
 *
 * Uso: php descargar_libs.php
 */

$destinoBase = __DIR__.'/public/libs';

$recursos = [
    // Bootstrap
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css' => 'bootstrap/5.3.3/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js' => 'bootstrap/5.3.3/bootstrap.bundle.min.js',

    // jQuery
    'https://code.jquery.com/jquery-3.7.1.min.js' => 'jquery/3.7.1/jquery.min.js',

    // DataTables
    'https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js' => 'datatables/1.13.8/jquery.dataTables.min.js',
    'https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js' => 'datatables/1.13.8/dataTables.bootstrap5.min.js',
    'https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css' => 'datatables/1.13.8/dataTables.bootstrap5.min.css',

    // DataTables Buttons
    'https://cdn.datatables.net/buttons/2.4.2/js/dataTables.buttons.min.js' => 'datatables-buttons/2.4.2/dataTables.buttons.min.js',
    'https://cdn.datatables.net/buttons/2.4.2/js/buttons.html5.min.js' => 'datatables-buttons/2.4.2/buttons.html5.min.js',
    'https://cdn.datatables.net/buttons/2.4.2/js/buttons.print.min.js' => 'datatables-buttons/2.4.2/buttons.print.min.js',
    'https://cdn.datatables.net/buttons/2.4.2/css/buttons.dataTables.min.css' => 'datatables-buttons/2.4.2/buttons.dataTables.min.css',

    // Exportacion
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js' => 'jszip/3.10.1/jszip.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js' => 'pdfmake/0.2.7/pdfmake.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js' => 'pdfmake/0.2.7/vfs_fonts.js',

    // Select2
    'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js' => 'select2/4.1.0-rc.0/select2.min.js',
    'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css' => 'select2/4.1.0-rc.0/select2.min.css',

    // Turbo
    'https://unpkg.com/@hotwired/turbo@7.3.0/dist/turbo.es2017-umd.js' => 'turbo/7.3.0/turbo.es2017-umd.js',

    // Flatpickr (version fijada segun lo que sirve el CDN hoy)
    'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js' => 'flatpickr/4.6.13/flatpickr.min.js',
    'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.css' => 'flatpickr/4.6.13/flatpickr.min.css',
    'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/l10n/es.js' => 'flatpickr/4.6.13/es.js',

    // Chart.js + plugin
    'https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js' => 'chartjs/4.5.1/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0/dist/chartjs-plugin-datalabels.min.js' => 'chartjs-plugin-datalabels/2.0.0/chartjs-plugin-datalabels.min.js',

    // Phosphor (el CSS referencia Phosphor.woff2 en la misma carpeta)
    'https://unpkg.com/@phosphor-icons/web@2.0.3/src/regular/style.css' => 'phosphor/2.0.3/style.css',
    'https://unpkg.com/@phosphor-icons/web@2.0.3/src/regular/Phosphor.woff2' => 'phosphor/2.0.3/Phosphor.woff2',
];

$contexto = stream_context_create([
    'http' => [
        'timeout' => 30,
        'ignore_errors' => true,
        'user_agent' => 'Mozilla/5.0 (compatible; ERP-Tellez)',
    ],
]);

$ok = 0;
$fallos = [];

foreach ($recursos as $url => $rutaRelativa) {
    $destino = $destinoBase.'/'.$rutaRelativa;
    $carpeta = dirname($destino);

    if (! is_dir($carpeta)) {
        mkdir($carpeta, 0777, true);
    }

    $contenido = @file_get_contents($url, false, $contexto);

    if ($contenido === false || strlen($contenido) < 100) {
        $fallos[] = $url;
        echo 'FALLO   '.$rutaRelativa."\n";

        continue;
    }

    file_put_contents($destino, $contenido);
    $ok++;
    echo str_pad(round(strlen($contenido) / 1024, 1).' KB', 10).$rutaRelativa."\n";
}

echo "\nDescargados: {$ok} / ".count($recursos)."\n";

if ($fallos) {
    echo "\nFallos:\n";

    foreach ($fallos as $url) {
        echo '  '.$url."\n";
    }
}

/* ══════════ Verifica dependencias internas de los CSS (url(...)) ══════════ */

echo "\n-- Referencias url() dentro de los CSS descargados --\n";

$cssDescargados = glob($destinoBase.'/*/*/*.css');

foreach ($cssDescargados as $css) {
    $texto = file_get_contents($css);

    if (preg_match_all('/url\(\s*[\'"]?([^\'")]+)[\'"]?\s*\)/i', $texto, $coincidencias)) {
        $referencias = array_unique($coincidencias[1]);

        echo basename($css).': ';

        foreach ($referencias as $referencia) {
            if (str_starts_with($referencia, 'data:')) {
                continue;
            }

            $rutaArchivo = dirname($css).'/'.$referencia;
            echo $referencia.(file_exists($rutaArchivo) ? ' [ok]' : ' [FALTA]').'  ';
        }

        echo "\n";
    }
}
