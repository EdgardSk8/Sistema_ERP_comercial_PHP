<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producto_atributos', function (Blueprint $table) {
            $table->increments('id_producto_atributo');
            $table->unsignedInteger('id_producto');
            $table->unsignedInteger('id_atributo');
            $table->unsignedInteger('id_valor');

            $table->foreign('id_producto')
                ->references('id_producto')
                ->on('productos')
                ->onDelete('cascade');

            $table->foreign('id_atributo')
                ->references('id_atributo')
                ->on('atributos')
                ->onDelete('cascade');

            $table->foreign('id_valor')
                ->references('id_valor')
                ->on('atributo_valores')
                ->onDelete('cascade');

            // Un producto tiene un solo valor por atributo (ej. un género).
            $table->unique(['id_producto', 'id_atributo']);
            $table->index('id_producto');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_atributos');
    }
};
