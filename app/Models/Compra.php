<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Compra extends Model
{
    protected $table = 'compras';

    protected $primaryKey = 'id_compra';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'numero_factura_compra',
        'id_proveedor',
        'id_usuario',
        'fecha_compra',
        'subtotal_compra',
        'descuento_compra',
        'impuesto_compra',
        'gastos_compra',
        'total_compra',
        'estado_compra',
        'id_caja',
        'id_cuenta',
        'id_metodo_pago',
        'id_tipo_factura',
    ];

    // 🔹 Relación: compra pertenece a proveedor
    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'id_proveedor', 'id_proveedor');
    }

    // 🔹 Relación: compra pertenece a usuario
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    // 🔹 Relación: compra pertenece a caja
    public function caja()
    {
        return $this->belongsTo(Caja::class, 'id_caja', 'id_caja');
    }

    // 🔹 Relación: compra pertenece a cuenta
    public function cuenta()
    {
        return $this->belongsTo(Cuenta::class, 'id_cuenta', 'id_cuenta');
    }

    // 🔹 Relación: una compra tiene muchos detalles
    public function detalles()
    {
        return $this->hasMany(DetalleCompra::class, 'id_compra', 'id_compra');
    }

    // 🔹 Relación: gastos adicionales de la compra (transporte, comida, etc.)
    public function gastosAdicionales()
    {
        return $this->hasMany(GastoCompra::class, 'id_compra', 'id_compra');
    }

    public function metodoPago()
    {
        return $this->belongsTo(MetodoPago::class, 'id_metodo_pago', 'id_metodo_pago');
    }

    public function tipoFactura()
    {
        return $this->belongsTo(TipoFactura::class, 'id_tipo_factura', 'id_tipo_factura');
    }
}

/* ══════════════════════════════════════════════════════════════════════════

La tabla compras se usa para registrar las adquisiciones de productos a proveedores.

Cada registro representa una compra, donde se guarda:

- El número de factura de la compra
- El proveedor que emitio la venta y el usuario que realizó la compra
- La fecha y hora de la compra
- El subtotal, descuento, impuesto y total de la compra
- El método de pago, cuenta o caja utilizada (si aplica)
- El tipo de factura
- Su estado (activa o anulada)

La función de la tabla compras es llevar control de las entradas de productos al
inventario y el dinero que sale por dichas adquisiciones.

══════════════════════════════════════════════════════════════════════════ */
