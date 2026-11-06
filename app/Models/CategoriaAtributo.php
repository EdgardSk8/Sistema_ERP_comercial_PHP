<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoriaAtributo extends Model
{
    protected $table = 'categoria_atributos';

    protected $primaryKey = 'id_categoria_atributo';

    public $timestamps = false;

    protected $fillable = [
        'id_categoria',
        'id_atributo',
        'obligatorio_categoria_atributo',
    ];

    protected $casts = [
        'obligatorio_categoria_atributo' => 'boolean',
    ];

    public function atributo()
    {
        return $this->belongsTo(Atributo::class, 'id_atributo', 'id_atributo');
    }
}
