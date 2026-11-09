<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos_web', function (Blueprint $table) {
            $table->unsignedInteger('id_trabajador')->nullable()->after('id_cliente');
            $table->timestamp('fecha_aceptado_trabajador')->nullable()->after('fecha_aceptado');

            $table->foreign('id_trabajador')
                ->references('id_trabajador')
                ->on('trabajadores')
                ->nullOnDelete();

            $table->index('id_trabajador', 'idx_pedidos_web_trabajador');
        });
    }

    public function down(): void
    {
        Schema::table('pedidos_web', function (Blueprint $table) {
            $table->dropForeign(['id_trabajador']);
            $table->dropIndex('idx_pedidos_web_trabajador');
            $table->dropColumn(['id_trabajador', 'fecha_aceptado_trabajador']);
        });
    }
};
