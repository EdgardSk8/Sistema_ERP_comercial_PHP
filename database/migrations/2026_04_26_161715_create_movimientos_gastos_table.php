<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('movimientos_gastos', function (Blueprint $table) {
            $table->increments('id_movimiento_gasto');

            $table->unsignedInteger('id_gasto');

            $table->decimal('monto', 10, 2);

            $table->enum('origen', ['CAJA', 'CUENTA']);

            $table->unsignedInteger('id_caja')->nullable();
            $table->unsignedInteger('id_cuenta')->nullable();

            $table->dateTime('fecha')->useCurrent();

            $table->unsignedInteger('id_usuario');

            $table->string('observacion', 200)->nullable();

            // 🔗 Relaciones
            $table->foreign('id_gasto')
                ->references('id_gasto')
                ->on('gastos')
                ->onDelete('cascade');

            $table->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
                ->onDelete('cascade');

            $table->foreign('id_caja')
                ->references('id_caja')
                ->on('cajas')
                ->onDelete('cascade');

            $table->foreign('id_cuenta')
                ->references('id_cuenta')
                ->on('cuentas')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos_gastos');
    }
};
