<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promociones', function (Blueprint $table) {
            $table->string('tipo_descuento_promocion', 20)->nullable()->after('imagen_promocion');
            $table->decimal('valor_descuento_promocion', 10, 2)->nullable()->after('tipo_descuento_promocion');
        });
    }

    public function down(): void
    {
        Schema::table('promociones', function (Blueprint $table) {
            $table->dropColumn(['tipo_descuento_promocion', 'valor_descuento_promocion']);
        });
    }
};
