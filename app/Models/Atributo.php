<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Atributo extends Model
{
    protected $table = 'atributos';

    protected $primaryKey = 'id_atributo';

    public $timestamps = false;

    protected $fillable = [
        'nombre_atributo',
        'tipo_atributo',
        'estado_atributo',
    ];

    protected $casts = [
        'estado_atributo' => 'boolean',
    ];

    public function valores()
    {
        return $this->hasMany(AtributoValor::class, 'id_atributo', 'id_atributo')
            ->orderBy('orden_valor');
    }

    public function categorias()
    {
        return $this->hasMany(CategoriaAtributo::class, 'id_atributo', 'id_atributo');
    }
}
