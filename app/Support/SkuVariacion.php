<?php

namespace App\Support;

use App\Models\ProductoVariacion;
use App\Models\VariacionTalla;
use Illuminate\Support\Str;

/**
 * Generación y regeneración de SKU de las variaciones.
 *
 * El SKU se arma con producto + color + talla. Cuando alguna de esas partes
 * cambia, el SKU autogenerado debe actualizarse; los SKU escritos a mano se
 * respetan.
 */
class SkuVariacion
{
    /** Sufijo cuando la variación no lleva talla (productos que no son ropa). */
    public const TALLA_UNICA = 'UNICA';

    public static function base(string $producto, string $color, string $talla): string
    {
        $base = Str::upper(Str::slug($producto.'-'.$color.'-'.$talla));

        return substr($base ?: 'VARIANTE', 0, 85);
    }

    public static function coincideConGenerado(string $sku, string $producto, string $color, string $talla): bool
    {
        if ($sku === '') {
            return false;
        }

        $base = preg_quote(self::base($producto, $color, $talla), '/');

        return preg_match('/^'.$base.'(?:-\d+)?$/i', trim($sku)) === 1;
    }

    public static function generar(string $producto, string $color, string $talla, ?int $idExcluir = null): string
    {
        $base = self::base($producto, $color, $talla);
        $sku = $base;
        $sufijo = 1;

        while (VariacionTalla::where('sku', $sku)
            ->when($idExcluir !== null, function ($query) use ($idExcluir) {
                $query->where('id_variacion_talla', '!=', $idExcluir);
            })
            ->exists()) {
            $sku = $base.'-'.$sufijo++;
        }

        return $sku;
    }

    /**
     * Renombra los SKU autogenerados de una variación cuando cambia su color.
     */
    public static function regenerarPorCambioColor(ProductoVariacion $variacion, string $colorAnterior): void
    {
        $nombreProducto = $variacion->producto->nombre_producto ?? '';

        $variacion->tallas()->with('talla')->get()->each(function (VariacionTalla $variacionTalla) use ($nombreProducto, $variacion, $colorAnterior) {

            $talla = $variacionTalla->talla->talla ?? self::TALLA_UNICA;

            if (! self::coincideConGenerado((string) $variacionTalla->sku, $nombreProducto, $colorAnterior, $talla)) {
                return;
            }

            $variacionTalla->sku = self::generar(
                $nombreProducto,
                $variacion->color,
                $talla,
                $variacionTalla->id_variacion_talla
            );

            $variacionTalla->save();
        });
    }
}
