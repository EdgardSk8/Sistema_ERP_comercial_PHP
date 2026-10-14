<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoteInventario extends Model
{
    protected $table = 'lotes_inventario';

    protected $primaryKey = 'id_lote';

    public $timestamps = false;

    protected $fillable = [
        'id_producto',
        'id_variacion_talla',
        'id_detalle_compra',
        'cantidad_inicial',
        'cantidad_disponible',
        'costo_unitario',
        'fecha_ingreso',
        'id_usuario',
    ];

    protected $casts = [
        'cantidad_inicial' => 'integer',
        'cantidad_disponible' => 'integer',
        'costo_unitario' => 'decimal:2',
    ];

    // 🔹 Lote pertenece a un producto
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'id_producto', 'id_producto');
    }

    // 🔹 Lote pertenece a una variante (talla) cuando aplica
    public function variacionTalla(): BelongsTo
    {
        return $this->belongsTo(VariacionTalla::class, 'id_variacion_talla', 'id_variacion_talla');
    }

    // 🔹 Lote originado por un detalle de compra
    public function detalleCompra(): BelongsTo
    {
        return $this->belongsTo(DetalleCompra::class, 'id_detalle_compra', 'id_detalle_compra');
    }
}

/* ══════════════════════════════════════════════════════════════════════════

La tabla lotes_inventario implementa el costeo FIFO/PEPS (primero entra,
primero sale). Cada registro representa un lote de mercadería con:

- El producto y (si aplica) la variante/talla
- La cantidad con la que ingresó y la que queda disponible
- El costo unitario real de ese lote
- El detalle de compra que lo originó (para poder revertir una compra)

Al vender se consumen primero los lotes más antiguos, de modo que la ganancia
se calcule con el costo real de las unidades vendidas.

══════════════════════════════════════════════════════════════════════════ */
