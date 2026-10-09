<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->unsignedInteger('id_variacion_talla')->nullable()->after('id_producto');
            $table->string('descripcion_variacion', 120)->nullable()->after('id_variacion_talla');
            $table->foreign('id_variacion_talla')
                ->references('id_variacion_talla')
                ->on('variacion_tallas')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->dropForeign(['id_variacion_talla']);
            $table->dropColumn(['id_variacion_talla', 'descripcion_variacion']);
        });
    }
};
