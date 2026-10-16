<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Amplía la precisión del precio de venta (base sin IVA).
     *
     * Motivo: el precio FINAL que paga el cliente es base × (1 + IVA). Si la base
     * se guardaba redondeada a 2 decimales, el precio final quedaba con centavos
     * fantasma: 1,000 con IVA 15 % → base 869.57 → 869.57 × 1.15 = 1,000.01.
     * Con 6 decimales la base exacta (869.565217) devuelve el final exacto.
     */
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->decimal('precio_venta', 12, 6)->change();
        });

        Schema::table('variacion_tallas', function (Blueprint $table) {
            $table->decimal('precio_venta', 12, 6)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->decimal('precio_venta', 10, 2)->change();
        });

        Schema::table('variacion_tallas', function (Blueprint $table) {
            $table->decimal('precio_venta', 10, 2)->nullable()->change();
        });
    }
};
