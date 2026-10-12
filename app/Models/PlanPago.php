<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanPago extends Model
{
    protected $table = 'planes_pago';
    protected $primaryKey = 'id_plan_pago';
    public $timestamps = false;

    protected $fillable = ['id_venta', 'id_usuario'];

    public function venta()
    {
        return $this->belongsTo(Venta::class, 'id_venta', 'id_venta');
    }

    public function cuotas()
    {
        return $this->hasMany(CuotaVenta::class, 'id_plan_pago', 'id_plan_pago')
            ->orderBy('numero_cuota');
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }
}