<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Coordenadas GPS para las direcciones de entrega del cliente.
     */
    public function up(): void
    {
        Schema::table('cliente_direcciones', function (Blueprint $table) {
            $table->decimal('latitud_direccion', 10, 7)->nullable()->after('direccion_manual');
            $table->decimal('longitud_direccion', 10, 7)->nullable()->after('latitud_direccion');
        });
    }

    public function down(): void
    {
        Schema::table('cliente_direcciones', function (Blueprint $table) {
            $table->dropColumn(['latitud_direccion', 'longitud_direccion']);
        });
    }
};
