<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClienteDireccion extends Model
{
    protected $table = 'cliente_direcciones';

    protected $primaryKey = 'id_direccion_cliente';

    public $timestamps = false;

    protected $fillable = [
        'id_cliente',
        'nombre_direccion',
        'ubicacion_maps',
        'referencia_direccion',
        'direccion_manual',
        'latitud_direccion',
        'longitud_direccion',
        'predeterminada_direccion',
        'estado_direccion',
    ];

    protected $casts = [
        'latitud_direccion' => 'float',
        'longitud_direccion' => 'float',
        'predeterminada_direccion' => 'boolean',
        'estado_direccion' => 'boolean',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente', 'id_cliente');
    }
}
