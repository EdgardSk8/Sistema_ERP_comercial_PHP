<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductoAtributo extends Model
{
    protected $table = 'producto_atributos';

    protected $primaryKey = 'id_producto_atributo';

    public $timestamps = false;

    protected $fillable = [
        'id_producto',
        'id_atributo',
        'id_valor',
    ];

    public function atributo()
    {
        return $this->belongsTo(Atributo::class, 'id_atributo', 'id_atributo');
    }

    public function valor()
    {
        return $this->belongsTo(AtributoValor::class, 'id_valor', 'id_valor');
    }
}
