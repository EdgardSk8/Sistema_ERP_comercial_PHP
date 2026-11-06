<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('atributos', function (Blueprint $table) {
            $table->increments('id_atributo');
            $table->string('nombre_atributo', 80);
            // lista = valor de atributo_valores | texto = valor libre
            $table->string('tipo_atributo', 20)->default('lista');
            $table->boolean('estado_atributo')->default(true);
            $table->dateTime('fecha_creacion_atributo')->useCurrent();

            $table->unique('nombre_atributo');
            $table->index('estado_atributo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('atributos');
    }
};
