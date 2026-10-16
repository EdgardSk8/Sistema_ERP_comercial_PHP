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

    /**
     * Saldo disponible de la caja.
     *
     * La tabla `cajas` no guarda saldo: se deriva de sus movimientos
     * (monto inicial + ingresos − salidas), igual que CajaController::calcularTotalesCaja.
     * Antes se leía como si existiera la columna, devolvía null y bloqueaba las
     * compras pagadas con caja (null < total siempre es verdadero).
     */
    public function getSaldoActualAttribute(): float
    {
        $ingresos = (float) $this->movimientos()
            ->where('tipo_movimiento_caja', 'INGRESO')
            ->sum('monto_movimiento_caja');

        $salidas = (float) $this->movimientos()
            ->where('tipo_movimiento_caja', 'SALIDA')
            ->sum('monto_movimiento_caja');

        return round((float) $this->monto_inicial + $ingresos - $salidas, 2);
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






