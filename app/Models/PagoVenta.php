<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PagoVenta extends Model
{
    protected $table = 'pagos_venta';
    protected $primaryKey = 'id_pago_venta';
    public $timestamps = false;

    protected $fillable = [
        'id_venta',
        'id_metodo_pago',
        'id_caja',
        'id_cuenta',
        'id_usuario',
        'monto_pago',
        'fecha_pago',
        'referencia_pago'
    ];

    protected $casts = ['fecha_pago' => 'datetime'];

    public function venta()
    {
        return $this->belongsTo(Venta::class, 'id_venta', 'id_venta');
    }

    public function metodoPago()
    {
        return $this->belongsTo(MetodoPago::class, 'id_metodo_pago', 'id_metodo_pago');
    }

    public function caja()
    {
        return $this->belongsTo(Caja::class, 'id_caja', 'id_caja');
    }

    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class, 'id_cuenta', 'id_cuenta');
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    public function aplicaciones()
    {
        return $this->hasMany(AplicacionPagoCuota::class, 'id_pago_venta', 'id_pago_venta');
    }
}