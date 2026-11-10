<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GastoCompra extends Model
{
    protected $table = 'gastos_compra';

    protected $primaryKey = 'id_gasto_compra';

    public $timestamps = false;

    protected $fillable = [
        'id_compra',
        'id_tipo_gasto',
        'descripcion_gasto_compra',
        'monto_gasto_compra',
    ];

    public function compra()
    {
        return $this->belongsTo(Compra::class, 'id_compra', 'id_compra');
    }

    public function tipoGasto()
    {
        return $this->belongsTo(TipoGasto::class, 'id_tipo_gasto', 'id_tipo_gasto');
    }
}

/* ══════════════════════════════════════════════════════════════════════════

La tabla gastos_compra guarda los gastos adicionales de una compra
(transporte, comida, fletes, etc.).

Cada registro representa un gasto de la compra, donde se guarda:

- La compra a la que pertenece
- El tipo de gasto (catálogo tipo_gasto)
- Una descripción opcional
- El monto del gasto

La función de la tabla gastos_compra es que el costo real de adquisición
incluya estos gastos al prorratearlos entre los productos comprados.

══════════════════════════════════════════════════════════════════════════ */
