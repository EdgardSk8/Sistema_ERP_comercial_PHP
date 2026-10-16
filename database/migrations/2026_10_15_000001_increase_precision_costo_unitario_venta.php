<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Amplía la precisión de detalle_ventas.costo_unitario_venta y recalcula los
     * costos ya guardados a partir de sus consumos FIFO.
     *
     * Motivo: cuando una línea de venta consume VARIOS lotes, el costo unitario es
     * un promedio (p. ej. 4,800 / 7 = 685.7142857…). Guardado con 2 decimales
     * (685.71) el total de la línea se desviaba: 7 × 685.71 = 4,799.97 → la
     * ganancia salía 2,200.03 en lugar de 2,200.00. Con 6 decimales el residuo
     * desaparece al redondear el resultado a 2 decimales.
     */
    public function up(): void
    {
        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->decimal('costo_unitario_venta', 14, 6)->nullable()->change();
        });

        // Recalcula las ventas ya registradas con el costo exacto de sus lotes:
        // suma(cantidad × costo_unitario de cada consumo) / cantidad vendida.
        $detalles = DB::table('detalle_ventas')
            ->whereNotNull('consumos_lotes')
            ->select('id_detalle_venta', 'cantidad_venta', 'consumos_lotes')
            ->get();

        foreach ($detalles as $detalle) {
            $consumos = json_decode((string) $detalle->consumos_lotes, true) ?: [];
            $cantidad = (float) $detalle->cantidad_venta;

            if ($cantidad <= 0 || empty($consumos)) {
                continue;
            }

            $costoTotal = 0.0;

            foreach ($consumos as $consumo) {
                $costoTotal += (float) ($consumo['costo_unitario'] ?? 0) * (float) ($consumo['cantidad'] ?? 0);
            }

            DB::table('detalle_ventas')
                ->where('id_detalle_venta', $detalle->id_detalle_venta)
                ->update(['costo_unitario_venta' => round($costoTotal / $cantidad, 6)]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->decimal('costo_unitario_venta', 10, 2)->nullable()->change();
        });
    }
};
