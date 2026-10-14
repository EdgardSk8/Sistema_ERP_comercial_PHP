<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Caja extends Model
{
    protected $table = 'cajas';

    protected $primaryKey = 'id_caja';

    public $incrementing = true;
    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'fecha_apertura',
        'fecha_cierre',
        'monto_inicial',
        'monto_final',
        'monto_teorico',
        'monto_real',
        'diferencia',
        'estado_caja',
        'id_usuario'
    ];

    // 🔹 Relación: una caja pertenece a un usuario
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    // 🔹 Relación: una caja tiene muchas ventas
    public function ventas()
    {
        return $this->hasMany(Venta::class, 'id_caja', 'id_caja');
    }

    // 🔹 Relación: una caja tiene muchas compras
    public function compras()
    {
        return $this->hasMany(Compra::class, 'id_caja', 'id_caja');
    }

    public function movimientos()
    {
        return $this->hasMany(
            MovimientoCaja::class,
            'id_caja',
            'id_caja'
        );
    }
    
}

/* ══════════════════════════════════════════════════════════════════════════

La tabla cajas se usa para controlar el dinero de cada turno de caja.

Cada registro representa una caja abierta por un usuario, donde se guarda:

- La fecha y hora de apertura y cierre
- El dinero inicial con el que se abre
- Las ventas, gastos y movimientos realizados
- El dinero esperado al cierre (teórico)
- El dinero contado realmente
- La diferencia entre ambos (para detectar faltantes o sobrantes)

La funcion de la tabla caja es saber con que caja se ha hecho una facturacion

══════════════════════════════════════════════════════════════════════════ */ 






