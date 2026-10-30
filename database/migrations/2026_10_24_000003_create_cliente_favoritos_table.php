<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cliente_favoritos', function (Blueprint $table) {
            $table->increments('id_favorito');
            $table->unsignedInteger('id_cliente');
            $table->unsignedInteger('id_producto');
            $table->dateTime('fecha_creacion_favorito')->useCurrent();

            $table->foreign('id_cliente')
                ->references('id_cliente')
                ->on('clientes')
                ->onDelete('cascade');

            $table->foreign('id_producto')
                ->references('id_producto')
                ->on('productos')
                ->onDelete('cascade');

            $table->unique(['id_cliente', 'id_producto']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cliente_favoritos');
    }
};
