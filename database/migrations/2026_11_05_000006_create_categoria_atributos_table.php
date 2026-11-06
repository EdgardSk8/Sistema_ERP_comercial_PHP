<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categoria_atributos', function (Blueprint $table) {
            $table->increments('id_categoria_atributo');
            $table->unsignedInteger('id_categoria');
            $table->unsignedInteger('id_atributo');
            $table->boolean('obligatorio_categoria_atributo')->default(false);

            $table->foreign('id_categoria')
                ->references('id_categoria')
                ->on('categoria')
                ->onDelete('cascade');

            $table->foreign('id_atributo')
                ->references('id_atributo')
                ->on('atributos')
                ->onDelete('cascade');

            $table->unique(['id_categoria', 'id_atributo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categoria_atributos');
    }
};
