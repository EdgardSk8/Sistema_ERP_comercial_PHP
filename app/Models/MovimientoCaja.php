<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimientoCaja extends Model
{
    protected $table = 'movimientos_caja';
    protected $primaryKey = 'id_movimiento_caja';
    public $timestamps = false;

    protected $fillable = [
        'id_caja',
        'tipo_movimiento_caja',
        'concepto_movimiento_caja',
        'monto_movimiento_caja',
        'fecha_movimiento_caja',
        'id_usuario',
        'id_referencia',
        'id_cuenta_destino',
        'id_transferencia',
        'id_pago_venta'
    ];

    // 🔹 Relación: pertenece a una caja
    public function caja()
    {
        return $this->belongsTo(Caja::class, 'id_caja', 'id_caja');
    }

    // 🔹 Relación: pertenece a un usuario
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    // 🔹 Relación opcional: cuenta destino (para transferencias)
    public function cuentaDestino()
    {
        return $this->belongsTo(Cuenta::class, 'id_cuenta_destino', 'id_cuenta');
    }

    public function transferencia()
    {
        return $this->belongsTo(TransferenciaCajaCuenta::class, 'id_transferencia', 'id_transferencia');
    }

    public function pagoVenta()
    {
        return $this->belongsTo(PagoVenta::class, 'id_pago_venta', 'id_pago_venta');
    }

}

/* ══════════════════════════════════════════════════════════════════════════

La tabla movimientos_caja se usa para registrar entradas y salidas de dinero en caja.

Cada registro representa un movimiento, donde se guarda:

- La caja a la que pertenece
- El tipo de movimiento (ingreso o salida)
- El concepto del movimiento (Apertura de caja, Pago de proveedor, Gasto operativo etc )
- El monto del movimiento
- La fecha y hora
- El usuario que lo realizó
- Referencias opcionales (ej: venta, gasto)
- La cuenta destino (si aplica)

La función de la tabla movimientos_caja es llevar un control detallado del flujo
de dinero dentro de la caja durante un turno.

══════════════════════════════════════════════════════════════════════════ */
