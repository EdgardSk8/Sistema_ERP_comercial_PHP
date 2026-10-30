<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resenias_productos', function (Blueprint $table) {
            $table->increments('id_resenia');
            $table->unsignedInteger('id_cliente');
            $table->unsignedInteger('id_producto');
            $table->unsignedSmallInteger('calificacion_resenia');
            $table->text('comentario_resenia')->nullable();
            $table->boolean('estado_resenia')->default(true);
            $table->dateTime('fecha_creacion_resenia')->useCurrent();
            $table->dateTime('fecha_actualizacion_resenia')->nullable();

            $table->foreign('id_cliente')
                ->references('id_cliente')
                ->on('clientes')
                ->onDelete('cascade');

            $table->foreign('id_producto')
                ->references('id_producto')
                ->on('productos')
                ->onDelete('cascade');

            // Un cliente solo puede tener una reseña por producto.
            $table->unique(['id_cliente', 'id_producto']);
            $table->index(['id_producto', 'estado_resenia']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resenias_productos');
    }
};
