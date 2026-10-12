<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimientoCuenta extends Model
{
    protected $table = 'movimientos_cuentas';
    protected $primaryKey = 'id_movimiento_cuenta';
    public $timestamps = false;

    protected $fillable = [
        'id_cuenta',
        'tipo_movimiento',
        'descripcion',
        'monto',
        'fecha',
        'id_usuario',
        'id_transferencia',
        'id_pago_venta'
    ];

    // 🔹 Relación: pertenece a una cuenta
    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class, 'id_cuenta', 'id_cuenta');
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    public function transferencia()
    {
        return $this->belongsTo(TransferenciaCajaCuenta::class, 'id_transferencia', 'id_transferencia');
    }

    public function pagoVenta()
    {
        return $this->belongsTo(PagoVenta::class, 'id_pago_venta', 'id_pago_venta');
    }
    
    public function movimientos()
    {
        return $this->hasMany(MovimientoCuenta::class, 'id_cuenta', 'id_cuenta');
    }

}

/* ══════════════════════════════════════════════════════════════════════════

La tabla movimientos_cuentas se usa para registrar los movimientos de dinero en las cuentas.

Cada registro representa un movimiento, donde se guarda:

- La cuenta afectada
- El tipo de movimiento (ingreso o salida)
- El monto del movimiento
- Una descripción opcional
- La fecha y hora
- El usuario que lo realizó

La función de la tabla movimientos_cuentas es controlar el dinero que entra y sale
de las cuentas, manteniendo actualizado el saldo.

══════════════════════════════════════════════════════════════════════════ */