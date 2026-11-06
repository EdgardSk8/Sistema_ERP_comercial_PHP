<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Permite variaciones sin talla (productos que no son ropa: audífonos,
 * accesorios, tecnología...). Cada color queda como una sola fila con
 * id_talla = null, conservando su propio stock, SKU y precios.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('variacion_tallas', function (Blueprint $table) {
            $table->unsignedInteger('id_talla')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('variacion_tallas', function (Blueprint $table) {
            $table->unsignedInteger('id_talla')->nullable(false)->change();
        });
    }
};
