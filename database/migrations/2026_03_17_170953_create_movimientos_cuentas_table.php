<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('movimientos_cuentas', function (Blueprint $table) {

            $table->increments('id_movimiento_cuenta');

            $table->unsignedInteger('id_cuenta');

            $table->enum('tipo_movimiento', ['INGRESO', 'SALIDA']);

            $table->decimal('monto', 10, 2);

            $table->string('descripcion', 150)->nullable();

            $table->dateTime('fecha')->useCurrent();

            $table->unsignedInteger('id_usuario');

            $table->unsignedInteger('id_transferencia')->nullable();

            // relaciones
            $table->foreign('id_cuenta')
                ->references('id_cuenta')
                ->on('cuentas')
                ->onDelete('cascade');

            $table->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
                ->onDelete('cascade');

            $table->foreign('id_transferencia')
                ->references('id_transferencia')
                ->on('transferencias_caja_cuenta')
                ->onDelete('cascade');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos_cuentas');
    }
};
