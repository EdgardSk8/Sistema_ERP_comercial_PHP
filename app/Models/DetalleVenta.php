<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetalleVenta extends Model
{
    protected $table = 'detalle_ventas';

    protected $primaryKey = 'id_detalle_venta';

    public $timestamps = false;

    protected $fillable = [
        'id_venta',
        'id_producto',
        'id_variacion_talla',
        'descripcion_variacion',
        'sku_variacion',
        'cantidad_venta',
        'precio_unitario_venta',
        'costo_unitario_venta',
        'consumos_lotes',
        'subtotal_detalle_venta',
        'porcentaje_impuesto',
        'monto_impuesto',
    ];

    protected $casts = [
        'consumos_lotes' => 'array',
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto', 'id_producto');
    }

    public function venta()
    {
        return $this->belongsTo(Venta::class, 'id_venta', 'id_venta');
    }

    public function variacionTalla()
    {
        return $this->belongsTo(VariacionTalla::class, 'id_variacion_talla', 'id_variacion_talla');
    }
}

/* ══════════════════════════════════════════════════════════════════════════

La tabla detalle_ventas se usa para desglosar los productos incluidos en una venta.

Cada registro representa un producto vendido dentro de una venta, donde se guarda:

- La venta a la que pertenece
- El producto vendido
- La cantidad vendida
- El precio unitario de venta
- El subtotal por ese producto
- El porcentaje de impuesto aplicado
- El monto de impuesto calculado

La función de la tabla detalle_ventas es detallar cada producto vendido,
permitiendo calcular correctamente los totales y los impuestos de la venta.

══════════════════════════════════════════════════════════════════════════ */
