<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cliente_direcciones', function (Blueprint $table) {
            $table->increments('id_direccion_cliente');
            $table->unsignedInteger('id_cliente');

            $table->string('nombre_direccion', 80);
            $table->string('ubicacion_maps', 500)->nullable();
            $table->text('referencia_direccion')->nullable();
            $table->text('direccion_manual')->nullable();

            $table->boolean('predeterminada_direccion')->default(false);
            $table->boolean('estado_direccion')->default(true);
            $table->dateTime('fecha_creacion_direccion')->useCurrent();

            $table->foreign('id_cliente')
                ->references('id_cliente')
                ->on('clientes')
                ->onDelete('cascade');

            $table->index(['id_cliente', 'predeterminada_direccion'], 'idx_cliente_direccion_predeterminada');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cliente_direcciones');
    }
};
