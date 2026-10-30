<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Talla extends Model
{
    protected $table = 'tallas';

    protected $primaryKey = 'id_talla';

    public $timestamps = false;

    protected $fillable = [
        'talla',
        'id_tipo_talla',
        'orden_talla',
        'estado_talla',
    ];

    public function tipoTalla(): BelongsTo
    {
        return $this->belongsTo(TipoTalla::class, 'id_tipo_talla', 'id_tipo_talla');
    }

    public function variaciones(): HasMany
    {
        return $this->hasMany(
            VariacionTalla::class,
            'id_talla',
            'id_talla'
        );
    }
}
