<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Permite varios valores para un mismo atributo de un producto.
 * Ejemplo: Tipo = Zapatos y también Skate. Antes el índice único
 * (id_producto, id_atributo) obligaba a un solo valor por atributo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producto_atributos', function (Blueprint $table) {
            $table->dropUnique(['id_producto', 'id_atributo']);
            $table->unique(['id_producto', 'id_atributo', 'id_valor']);
        });
    }

    public function down(): void
    {
        Schema::table('producto_atributos', function (Blueprint $table) {
            $table->dropUnique(['id_producto', 'id_atributo', 'id_valor']);
            $table->unique(['id_producto', 'id_atributo']);
        });
    }
};
