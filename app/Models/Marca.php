<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Marca extends Model
{
    protected $table = 'marcas';

    protected $primaryKey = 'id_marca';

    public $timestamps = false;

    protected $fillable = [
        'nombre_marca',
        'slug_marca',
        'logo_marca',
        'estado_marca',
    ];

    protected $casts = [
        'estado_marca' => 'boolean',
    ];

    public function productos()
    {
        return $this->hasMany(Producto::class, 'id_marca', 'id_marca');
    }
}
