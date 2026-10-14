<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMovimientosCajaTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('movimientos_caja', function (Blueprint $table) {

            $table->increments('id_movimiento_caja');

            $table->unsignedInteger('id_caja');

            $table->enum('tipo_movimiento_caja', ['INGRESO', 'SALIDA']);

            $table->string('concepto_movimiento_caja', 150);

            $table->decimal('monto_movimiento_caja', 10, 2);

            $table->dateTime('fecha_movimiento_caja')->useCurrent();

            $table->unsignedInteger('id_usuario');

            $table->unsignedInteger('id_transferencia')->nullable();

            // 👇 referencia a venta, gasto, compra, etc.
            $table->integer('id_referencia')->nullable();

            // 👇 NUEVO (CLAVE para transferencias)
            $table->unsignedInteger('id_cuenta_destino')->nullable();

            // relaciones
            $table->foreign('id_caja')
                ->references('id_caja')
                ->on('cajas')
                ->onDelete('cascade');

            $table->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
                ->onDelete('cascade');

            $table->foreign('id_cuenta_destino')
                ->references('id_cuenta')
                ->on('cuentas')
                ->onDelete('cascade');

            $table->foreign('id_transferencia')
                ->references('id_transferencia')
                ->on('transferencias_caja_cuenta')
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
        Schema::dropIfExists('movimientos_caja');
    }
}
