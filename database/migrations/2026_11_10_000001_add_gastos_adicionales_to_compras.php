<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Gastos adicionales de una compra (transporte, comida, fletes, etc.).
     *
     * El total de estos gastos se suma al total pagado de la compra y se
     * prorratea al costo unitario de cada producto, de modo que el lote FIFO
     * (y por tanto la ganancia al vender) refleje el costo real de adquisición.
     */
    public function up(): void
    {
        Schema::table('compras', function (Blueprint $table) {
            $table->decimal('gastos_compra', 10, 2)->default(0)->after('impuesto_compra');
        });

        Schema::table('detalle_compras', function (Blueprint $table) {
            $table->decimal('gastos_detalle_compra', 10, 2)->default(0)->after('subtotal_detalle_compra');
        });

        Schema::create('gastos_compra', function (Blueprint $table) {
            $table->increments('id_gasto_compra');

            $table->unsignedInteger('id_compra');
            $table->unsignedInteger('id_tipo_gasto')->nullable();
            $table->string('descripcion_gasto_compra', 200)->nullable();
            $table->decimal('monto_gasto_compra', 10, 2);

            $table->foreign('id_compra')
                ->references('id_compra')
                ->on('compras')
                ->onDelete('cascade');

            $table->foreign('id_tipo_gasto')
                ->references('id_tipo_gasto')
                ->on('tipo_gasto')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gastos_compra');

        Schema::table('detalle_compras', function (Blueprint $table) {
            $table->dropColumn('gastos_detalle_compra');
        });

        Schema::table('compras', function (Blueprint $table) {
            $table->dropColumn('gastos_compra');
        });
    }
};
