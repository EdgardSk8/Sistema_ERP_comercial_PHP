<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDetalleComprasTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('detalle_compras', function (Blueprint $table) {
            $table->increments('id_detalle_compra');

            $table->unsignedInteger('id_compra');
            $table->unsignedInteger('id_producto');

            $table->integer('cantidad_compra');
            $table->decimal('precio_unitario_compra', 10, 2);
            $table->decimal('subtotal_detalle_compra', 10, 2);

            $table->foreign('id_compra')
                ->references('id_compra')
                ->on('compras')
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
        Schema::dropIfExists('detalle_compras');
    }
}
