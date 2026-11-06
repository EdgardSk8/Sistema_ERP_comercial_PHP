<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marcas', function (Blueprint $table) {
            $table->increments('id_marca');
            $table->string('nombre_marca', 100);
            $table->string('slug_marca', 120)->nullable();
            $table->string('logo_marca', 255)->nullable();
            $table->boolean('estado_marca')->default(true);
            $table->dateTime('fecha_creacion_marca')->useCurrent();

            $table->unique('nombre_marca');
            $table->index('estado_marca');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marcas');
    }
};
