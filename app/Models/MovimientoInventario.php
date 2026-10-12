<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimientoInventario extends Model
{
    protected $table = 'movimientos_inventario';
    protected $primaryKey = 'id_movimiento_inventario';
    public $timestamps = false;

    protected $fillable = [
        'id_producto',
        'id_variacion_talla',
        'tipo_movimiento',        // ENTRADA, SALIDA, AJUSTE
        'cantidad_movimiento',    // siempre positivo
        'stock_resultante',       // stock después del movimiento
        'motivo_movimiento',      // opcional
        'id_referencia',          // id de venta, compra, etc.
        'tipo_referencia',        // VENTA, COMPRA, DEVOLUCION, TRASLADO, AJUSTE
        'precio_unitario',        // opcional, para kardex valorizado
        'fecha_movimiento',
        'id_usuario'
    ];

    // 🔗 Relación con Producto
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto', 'id_producto');
    }

    // 🔗 Relación con Usuario
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

}

/* ══════════════════════════════════════════════════════════════════════════

La tabla movimientos_inventario se usa para registrar los cambios en el stock de productos.

Cada registro representa un movimiento de inventario, donde se guarda:

- El producto afectado
- El tipo de movimiento (entrada, salida o ajuste)
- La cantidad movida
- El stock resultante después del movimiento
- El motivo del movimiento
- Referencias (ej: venta, compra, devolución)
- El precio unitario (si aplica)
- La fecha y hora
- El usuario que lo realizó

La función de la tabla movimientos_inventario es llevar un control detallado del
stock, permitiendo conocer el historial y estado actual de cada producto.

══════════════════════════════════════════════════════════════════════════ */