<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClienteFavorito extends Model
{
    protected $table = 'cliente_favoritos';

    protected $primaryKey = 'id_favorito';

    public $timestamps = false;

    protected $fillable = [
        'id_cliente',
        'id_producto',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente', 'id_cliente');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto', 'id_producto');
    }
}
