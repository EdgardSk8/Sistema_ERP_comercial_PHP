<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReseniaProducto extends Model
{
    protected $table = 'resenias_productos';

    protected $primaryKey = 'id_resenia';

    public $timestamps = false;

    protected $fillable = [
        'id_cliente',
        'id_producto',
        'calificacion_resenia',
        'comentario_resenia',
        'estado_resenia',
        'fecha_creacion_resenia',
        'fecha_actualizacion_resenia',
    ];

    protected $casts = [
        'calificacion_resenia' => 'integer',
        'estado_resenia' => 'boolean',
        'fecha_creacion_resenia' => 'datetime',
        'fecha_actualizacion_resenia' => 'datetime',
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

/* ══════════════════════════════════════════════════════════════════════════

La tabla resenias_productos guarda las opiniones de los clientes registrados
en la tienda sobre un producto.

Cada registro representa una reseña, donde se guarda:

- El cliente que la escribió
- El producto reseñado
- La calificación en estrellas (1 a 5)
- El comentario (opcional)
- Su estado (visible u oculta para moderación)
- Las fechas de creación y de última edición

Regla de negocio: un cliente solo puede tener UNA reseña por producto; si la
vuelve a enviar, se actualiza la existente.

══════════════════════════════════════════════════════════════════════════ */
