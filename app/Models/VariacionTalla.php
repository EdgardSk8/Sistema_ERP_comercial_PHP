<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VariacionTalla extends Model
{
    protected $table = 'variacion_tallas';

    protected $primaryKey = 'id_variacion_talla';

    public $timestamps = false;

    protected $fillable = [
        'id_variacion',
        'id_talla',
        'stock',
        'sku',
        'precio_compra',
        'precio_venta',
    ];

    public function variacion(): BelongsTo
    {
        return $this->belongsTo(
            ProductoVariacion::class,
            'id_variacion',
            'id_variacion'
        );
    }

    public function talla(): BelongsTo
    {
        return $this->belongsTo(
            Talla::class,
            'id_talla',
            'id_talla'
        );
    }
}
