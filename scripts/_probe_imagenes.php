<?php

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$problemas = [];
$total = 0;

foreach (DB::table('productos')->orderBy('id_producto')->get(['id_producto', 'nombre_producto', 'imagen_producto']) as $p) {
    $variaciones = DB::table('producto_variaciones')
        ->leftJoin('variacion_imagenes', 'variacion_imagenes.id_variacion', '=', 'producto_variaciones.id_variacion')
        ->where('producto_variaciones.id_producto', $p->id_producto)
        ->get(['producto_variaciones.color', 'variacion_imagenes.imagen']);

    $total++;

    if ($variaciones->isEmpty()) {
        $ruta = $p->imagen_producto;

        if (! $ruta) {
            $problemas[] = $p->id_producto.' '.$p->nombre_producto.' -> sin imagen de producto ni variaciones';

            continue;
        }

        $relativa = str_starts_with($ruta, 'imagenes/') ? $ruta : 'imagenes/productos/'.$ruta;

        if (! is_file(__DIR__.'/../website-supabase/'.$relativa)) {
            $problemas[] = $p->id_producto.' '.$p->nombre_producto.' -> falta en la tienda: '.$relativa;
        }

        continue;
    }

    foreach ($variaciones as $v) {
        if (! $v->imagen) {
            $problemas[] = $p->id_producto.' '.$p->nombre_producto.' ('.$v->color.') -> variación sin imagen';

            continue;
        }

        $relativa = str_starts_with($v->imagen, 'imagenes/') ? $v->imagen : 'imagenes/productosvariaciones/'.$v->imagen;

        if (! is_file(__DIR__.'/../website-supabase/'.$relativa)) {
            $problemas[] = $p->id_producto.' '.$p->nombre_producto.' ('.$v->color.') -> falta en la tienda: '.$relativa;
        }
    }
}

echo 'Productos: '.$total.' | Problemas: '.count($problemas).PHP_EOL;

foreach ($problemas as $problema) {
    echo '  - '.$problema.PHP_EOL;
}
