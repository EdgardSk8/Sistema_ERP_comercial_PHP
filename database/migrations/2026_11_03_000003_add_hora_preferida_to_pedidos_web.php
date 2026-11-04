<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos_web', function (Blueprint $table) {
            $table->time('hora_entrega_preferida')->nullable()->after('fecha_entrega_estimada');
        });
    }

    public function down(): void
    {
        Schema::table('pedidos_web', function (Blueprint $table) {
            $table->dropColumn('hora_entrega_preferida');
        });
    }
};
