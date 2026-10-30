<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tarifa de envío por kilómetro y punto de origen para el cálculo de distancias.
     */
    public function up(): void
    {
        Schema::table('credenciales', function (Blueprint $table) {
            $table->decimal('tarifa_km', 10, 2)->nullable()->after('tipo_cambio');
            $table->decimal('latitud_empresa', 10, 7)->nullable()->after('tarifa_km');
            $table->decimal('longitud_empresa', 10, 7)->nullable()->after('latitud_empresa');
        });
    }

    public function down(): void
    {
        Schema::table('credenciales', function (Blueprint $table) {
            $table->dropColumn(['tarifa_km', 'latitud_empresa', 'longitud_empresa']);
        });
    }
};
