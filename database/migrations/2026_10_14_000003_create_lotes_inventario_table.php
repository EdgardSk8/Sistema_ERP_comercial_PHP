<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crea la tabla de lotes de inventario para el costeo FIFO/PEPS.
     *
     * Cada compra genera un "lote" con su cantidad y su costo real. Al vender,
     * se consumen primero los lotes más antiguos, de modo que la ganancia refleje
     * el costo verdadero de las unidades vendidas (y no un promedio).
     *
     * También agrega detalle_ventas.consumos_lotes, que guarda de qué lotes se
     * tomó cada venta para poder revertirla si se anula.
     */
    public function up(): void
    {
        Schema::create('lotes_inventario', function (Blueprint $table) {
            $table->increments('id_lote');

            $table->unsignedInteger('id_producto');
            $table->unsignedInteger('id_variacion_talla')->nullable();
            $table->unsignedInteger('id_detalle_compra')->nullable();

            $table->integer('cantidad_inicial');
            $table->integer('cantidad_disponible');
            $table->decimal('costo_unitario', 10, 2);

            $table->dateTime('fecha_ingreso')->useCurrent();
            $table->unsignedInteger('id_usuario')->nullable();

            $table->foreign('id_producto')
                ->references('id_producto')
                ->on('productos')
                ->onDelete('cascade');

            $table->foreign('id_variacion_talla')
                ->references('id_variacion_talla')
                ->on('variacion_tallas')
                ->nullOnDelete();

            $table->foreign('id_detalle_compra')
                ->references('id_detalle_compra')
                ->on('detalle_compras')
                ->nullOnDelete();

            // Índice para consumir lotes en orden FIFO por producto/variante.
            $table->index(['id_producto', 'id_variacion_talla', 'fecha_ingreso'], 'lotes_fifo_index');
        });

        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->json('consumos_lotes')->nullable()->after('costo_unitario_venta');
        });

        // ── Backfill: un lote inicial por cada existencia actual (saldo inicial) ──
        // Las compras previas a esta migración no tienen lotes; se crea uno por
        // cada producto/variante con stock, valuado al costo de compra del catálogo.
        $this->backfillSaldoInicial();
    }

    public function down(): void
    {
        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->dropColumn('consumos_lotes');
        });

        Schema::dropIfExists('lotes_inventario');
    }

    private function backfillSaldoInicial(): void
    {
        $ahora = now()->format('Y-m-d H:i:s');

        // Productos simples (sin variaciones): un lote por el stock actual.
        $simples = DB::table('productos as p')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('producto_variaciones as pv')
                    ->whereColumn('pv.id_producto', 'p.id_producto');
            })
            ->where('p.stock_actual', '>', 0)
            ->select('p.id_producto', 'p.stock_actual', 'p.precio_compra')
            ->get();

        foreach ($simples as $producto) {
            DB::table('lotes_inventario')->insert([
                'id_producto' => $producto->id_producto,
                'id_variacion_talla' => null,
                'id_detalle_compra' => null,
                'cantidad_inicial' => $producto->stock_actual,
                'cantidad_disponible' => $producto->stock_actual,
                'costo_unitario' => round((float) ($producto->precio_compra ?? 0), 2),
                'fecha_ingreso' => $ahora,
                'id_usuario' => null,
            ]);
        }

        // Productos con variaciones: un lote por cada variante con stock.
        $variantes = DB::table('variacion_tallas as vt')
            ->join('producto_variaciones as pv', 'pv.id_variacion', '=', 'vt.id_variacion')
            ->join('productos as p', 'p.id_producto', '=', 'pv.id_producto')
            ->where('vt.stock', '>', 0)
            ->select(
                'vt.id_variacion_talla',
                'pv.id_producto',
                'vt.stock',
                'vt.precio_compra',
                'p.precio_compra as producto_precio_compra'
            )
            ->get();

        foreach ($variantes as $variante) {
            DB::table('lotes_inventario')->insert([
                'id_producto' => $variante->id_producto,
                'id_variacion_talla' => $variante->id_variacion_talla,
                'id_detalle_compra' => null,
                'cantidad_inicial' => $variante->stock,
                'cantidad_disponible' => $variante->stock,
                'costo_unitario' => round((float) ($variante->precio_compra ?? $variante->producto_precio_compra ?? 0), 2),
                'fecha_ingreso' => $ahora,
                'id_usuario' => null,
            ]);
        }
    }
};
