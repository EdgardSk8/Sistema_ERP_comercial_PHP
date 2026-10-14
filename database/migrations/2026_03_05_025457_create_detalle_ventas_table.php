<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDetalleVentasTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('detalle_ventas', function (Blueprint $table) {
            $table->increments('id_detalle_venta');

            $table->unsignedInteger('id_venta');
            $table->unsignedInteger('id_producto');

            $table->integer('cantidad_venta');
            $table->decimal('precio_unitario_venta', 10, 2);
            $table->decimal('subtotal_detalle_venta', 10, 2);

            $table->decimal('porcentaje_impuesto', 5, 2);
            $table->decimal('monto_impuesto', 10, 2);

            $table->foreign('id_venta')
                ->references('id_venta')
                ->on('ventas')
                ->onDelete('cascade');

            $table->foreign('id_producto')
                ->references('id_producto')
                ->on('productos')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('detalle_ventas');
    }
}
