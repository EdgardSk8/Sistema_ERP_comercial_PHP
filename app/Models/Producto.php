<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    protected $table = 'productos';
    protected $primaryKey = 'id_producto';
    public $timestamps = false;

    protected $fillable = [
        'nombre_producto',
        'descripcion_producto',
        'id_categoria',
        'id_medida',
        'id_impuesto',
        'id_ubicacion',
        'imagen_producto',
        'precio_compra',
        'precio_venta',
        'stock_actual',
        'estado_producto',
        'fecha_creacion_producto'
    ];

    // 🔗 Relaciones

    protected $appends = ['ganancia', 'porcentaje_ganancia', 'precio_venta_final', 'medida_nombre'];

    public function getGananciaAttribute()
    {
        return $this->precio_venta - $this->precio_compra;
    }

    public function getPorcentajeGananciaAttribute()
    {
        if ($this->precio_compra <= 0) { return 0; }
        return round( (($this->precio_venta - $this->precio_compra) / $this->precio_compra) * 100, 2 );
    }

    public function getPrecioVentaFinalAttribute()
    {
        $porcentaje = $this->impuesto?->porcentaje_impuesto ?? 0;
        return round( $this->precio_venta * (1 + ($porcentaje / 100)), 2 );
    }

    public function categoria()
    {
        return $this->belongsTo(Categoria::class,'id_categoria');
    }

    public function impuesto()
    {
        return $this->belongsTo(Impuesto::class,'id_impuesto');
    }

    public function variaciones()
    {
        return $this->hasMany(ProductoVariacion::class, 'id_producto', 'id_producto');
    }

    public function ubicacion() 
    {
        return $this->belongsTo(Ubicacion::class,'id_ubicacion');
    }

    public function impuestoProducto()
    {
        return $this->belongsTo(Impuesto::class, 'id_impuesto', 'id_impuesto');
    }

    public function medida()
    {
        return $this->belongsTo(Medida::class, 'id_medida', 'id_medida');
    }

    public function getMedidaNombreAttribute()
    {
        return $this->medida?->nombre_medida;
    }
    
}

/* ══════════════════════════════════════════════════════════════════════════

La tabla productos se usa para almacenar la información de los productos del negocio.

Cada registro representa un producto, donde se guarda:

- El nombre y descripción del producto
- La categoría, impuesto y ubicación
- Una imagen (opcional)
- El precio de compra y precio de venta
- El stock actual disponible
- Su estado (activo o inactivo)
- La fecha de creación

La función de la tabla productos es gestionar el inventario, permitiendo controlar
precios, stock y organización de los productos.

══════════════════════════════════════════════════════════════════════════ */
