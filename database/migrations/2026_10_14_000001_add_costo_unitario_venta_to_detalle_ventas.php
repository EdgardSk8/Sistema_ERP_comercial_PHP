<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega el costo histórico unitario al detalle de venta.
     *
     * Este campo guarda una "foto" del costo del producto (o variante) en el
     * momento exacto de la venta, para que la ganancia se calcule con el costo
     * histórico y no cambie retroactivamente cuando el costo del catálogo cambie.
     */
    public function up(): void
    {
        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->decimal('costo_unitario_venta', 10, 2)->nullable()->after('precio_unitario_venta');
        });

        // Backfill: rellena las ventas existentes con el costo vigente actual
        // (aproximación equivalente a lo que el dashboard calculaba antes).
        // Se hace en PHP para mantener compatibilidad con MySQL y SQLite.
        $detalles = DB::table('detalle_ventas as dv')
            ->join('productos as p', 'dv.id_producto', '=', 'p.id_producto')
            ->leftJoin('variacion_tallas as vt', 'dv.id_variacion_talla', '=', 'vt.id_variacion_talla')
            ->whereNull('dv.costo_unitario_venta')
            ->select(
                'dv.id_detalle_venta',
                DB::raw('COALESCE(vt.precio_compra, p.precio_compra, 0) as costo')
            )
            ->get();

        foreach ($detalles as $detalle) {
            DB::table('detalle_ventas')
                ->where('id_detalle_venta', $detalle->id_detalle_venta)
                ->update(['costo_unitario_venta' => round((float) $detalle->costo, 2)]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->dropColumn('costo_unitario_venta');
        });
    }
};
