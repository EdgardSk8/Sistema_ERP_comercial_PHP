<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CuotaVenta extends Model
{
    protected $table = 'cuotas_venta';
    protected $primaryKey = 'id_cuota';
    public $timestamps = false;

    protected $fillable = ['id_plan_pago', 'numero_cuota', 'fecha_vencimiento', 'monto_cuota'];

    protected $casts = ['fecha_vencimiento' => 'date'];

    public function plan()
    {
        return $this->belongsTo(PlanPago::class, 'id_plan_pago', 'id_plan_pago');
    }

    public function aplicaciones()
    {
        return $this->hasMany(AplicacionPagoCuota::class, 'id_cuota', 'id_cuota');
    }
}