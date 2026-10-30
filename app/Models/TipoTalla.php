<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoTalla extends Model
{
    protected $table = 'tipos_talla';

    protected $primaryKey = 'id_tipo_talla';

    public $timestamps = false;

    protected $fillable = [
        'nombre_tipo_talla',
        'descripcion_tipo_talla',
        'estado_tipo_talla',
    ];

    public function tallas(): HasMany
    {
        return $this->hasMany(Talla::class, 'id_tipo_talla', 'id_tipo_talla');
    }
}
