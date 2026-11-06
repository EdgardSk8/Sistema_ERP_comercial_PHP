<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AtributoValor extends Model
{
    protected $table = 'atributo_valores';

    protected $primaryKey = 'id_valor';

    public $timestamps = false;

    protected $fillable = [
        'id_atributo',
        'valor_atributo',
        'orden_valor',
        'estado_valor',
    ];

    protected $casts = [
        'estado_valor' => 'boolean',
    ];

    public function atributo()
    {
        return $this->belongsTo(Atributo::class, 'id_atributo', 'id_atributo');
    }
}
