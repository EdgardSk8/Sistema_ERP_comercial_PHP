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
        Schema::create('transferencias_caja_cuenta', function (Blueprint $table) {
            $table->increments('id_transferencia');

            $table->unsignedInteger('id_caja_origen')->nullable();
            $table->unsignedInteger('id_cuenta_destino');

            $table->decimal('monto', 10, 2);
            $table->string('concepto', 150)->default('Transferencia caja a cuenta');

            $table->unsignedInteger('id_usuario');

            $table->dateTime('fecha')->useCurrent();

            // 🔗 Relaciones
            $table->foreign('id_caja_origen')
                ->references('id_caja')
                ->on('cajas')
                ->onDelete('set null');

            $table->foreign('id_cuenta_destino')
                ->references('id_cuenta')
                ->on('cuentas')
                ->onDelete('cascade');

            $table->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transferencias_caja_cuenta');
    }
};
