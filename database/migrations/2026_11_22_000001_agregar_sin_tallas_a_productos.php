<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Marca a nivel de producto los artículos que no usan tallas (llantas,
 * rodamientos, accesorios, tecnología...). Todos sus colores se manejan
 * como talla única: el ERP fuerza las filas sin talla y la tienda oculta
 * el selector de tallas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->boolean('sin_tallas')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropColumn('sin_tallas');
        });
    }
};
