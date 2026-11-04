<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promocion extends Model
{
    protected $table = 'promociones';

    protected $primaryKey = 'id_promocion';

    public $timestamps = false;

    protected $fillable = [
        'id_producto',
        'imagen_promocion',
        'tipo_descuento_promocion',
        'valor_descuento_promocion',
        'fecha_inicio_promocion',
        'fecha_fin_promocion',
        'estado_promocion',
        'fecha_creacion_promocion',
        'fecha_actualizacion_promocion',
    ];

    protected $casts = [
        'estado_promocion' => 'boolean',
        'fecha_inicio_promocion' => 'date',
        'fecha_fin_promocion' => 'date',
        'fecha_creacion_promocion' => 'datetime',
        'fecha_actualizacion_promocion' => 'datetime',
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto', 'id_producto');
    }
}
