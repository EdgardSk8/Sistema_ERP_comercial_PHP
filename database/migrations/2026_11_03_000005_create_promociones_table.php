<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promociones', function (Blueprint $table) {
            $table->increments('id_promocion');
            $table->unsignedInteger('id_producto');
            $table->string('imagen_promocion', 255)->nullable();
            $table->date('fecha_inicio_promocion');
            $table->date('fecha_fin_promocion')->nullable();
            $table->boolean('estado_promocion')->default(true);
            $table->dateTime('fecha_creacion_promocion')->useCurrent();
            $table->dateTime('fecha_actualizacion_promocion')->nullable();

            $table->foreign('id_producto')
                ->references('id_producto')
                ->on('productos')
                ->onDelete('cascade');

            $table->index('estado_promocion');
            $table->index(['fecha_inicio_promocion', 'fecha_fin_promocion'], 'idx_promociones_fechas');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promociones');
    }
};
