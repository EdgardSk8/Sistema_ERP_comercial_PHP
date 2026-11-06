<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Claves de caché del módulo de variaciones.
 *
 * La vista de detalle carga variaciones + imágenes + tallas en una sola
 * petición; el resultado se guarda unos segundos porque cada consulta a la
 * base remota cuesta ~250 ms. Cualquier cambio en variaciones, tallas o
 * imágenes invalida la clave para que la vista se refresque al instante.
 */
class CacheVariaciones
{
    public const DETALLE = 'producto_variaciones.detalle';

    public const TALLAS = 'catalogo.tallas.variaciones';

    public static function olvidarDetalle(): void
    {
        Cache::forget(self::DETALLE);
    }
}
