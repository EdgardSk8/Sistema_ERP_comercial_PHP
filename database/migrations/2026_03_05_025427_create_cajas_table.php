<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCajasTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('cajas', function (Blueprint $table) {
            $table->increments('id_caja');

            $table->dateTime('fecha_apertura')->useCurrent();
            $table->dateTime('fecha_cierre')->nullable();

            $table->decimal('monto_inicial', 10, 2);
            $table->decimal('monto_final', 10, 2)->nullable();

            $table->decimal('monto_teorico', 10, 2)->nullable();
            $table->decimal('monto_real', 10, 2)->nullable();
            $table->decimal('diferencia', 10, 2)->nullable();

            $table->boolean('estado_caja')->default(true);

            $table->unsignedInteger('id_usuario');

            $table->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
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
        Schema::dropIfExists('cajas');
    }
}
