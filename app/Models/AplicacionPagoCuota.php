<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AplicacionPagoCuota extends Model
{
    protected $table = 'aplicaciones_pago_cuota';
    protected $primaryKey = 'id_aplicacion_pago_cuota';
    public $timestamps = false;

    protected $fillable = ['id_pago_venta', 'id_cuota', 'monto_aplicado'];

    public function pago()
    {
        return $this->belongsTo(PagoVenta::class, 'id_pago_venta', 'id_pago_venta');
    }

    public function cuota()
    {
        return $this->belongsTo(CuotaVenta::class, 'id_cuota', 'id_cuota');
    }
}