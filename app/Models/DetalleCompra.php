<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetalleCompra extends Model
{
    protected $table = 'detalle_compras';
    protected $primaryKey = 'id_detalle_compra';
    public $timestamps = false;

    protected $fillable = [
        'id_compra',
        'id_producto',
        'id_variacion_talla',
        'descripcion_variacion',
        'sku_variacion',
        'cantidad_compra',
        'precio_unitario_compra',
        'subtotal_detalle_compra'
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto', 'id_producto');
    }

    public function variacionTalla()
    {
        return $this->belongsTo(VariacionTalla::class, 'id_variacion_talla', 'id_variacion_talla');
    }

}

/* ══════════════════════════════════════════════════════════════════════════

La tabla detalle_compras se usa para desglosar los productos incluidos en una compra.

Cada registro representa un producto dentro de una compra, donde se guarda:

- La compra a la que pertenece
- El producto comprado
- La cantidad adquirida
- El precio unitario de compra
- El subtotal por ese producto

La función de la tabla detalle_compras es detallar cada producto comprado,
permitiendo calcular totales y controlar correctamente el ingreso al inventario.

══════════════════════════════════════════════════════════════════════════ */
