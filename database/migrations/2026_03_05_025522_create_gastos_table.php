<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateGastosTable extends Migration
{
    public function up()
    {
        Schema::create('gastos', function (Blueprint $table) {

            // 🔹 IDENTIDAD
            $table->increments('id_gasto');
            $table->unsignedInteger('id_tipo_gasto');

            $table->string('nombre_gasto', 150);
            $table->string('descripcion_gasto', 200)->nullable();
            $table->boolean('estado_gasto')->default(true);

            // 🔹 FECHAS SIMPLIFICADAS
            $table->date('fecha_inicio')->nullable();      // opcional: cuándo se creó
            $table->date('fecha_pago')->nullable();        // fecha programada de pago
            $table->date('proximo_pago')->nullable();      // próxima fecha real a pagar

            // 🔹 CONTROL DE PAGO
            $table->string('estado_pago', 20)->default('PENDIENTE');
            // PENDIENTE | PAGADO | ATRASADO

            $table->date('ultimo_pago')->nullable();

            // 🔹 RELACIÓN
            $table->foreign('id_tipo_gasto')
                ->references('id_tipo_gasto')
                ->on('tipo_gasto')
                ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('gastos');
    }
}
