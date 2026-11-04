<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos_web', function (Blueprint $table) {
            $table->boolean('uso_descuento_bienvenida')
                ->default(false)
                ->after('descuento_pedido');
        });
    }

    public function down(): void
    {
        Schema::table('pedidos_web', function (Blueprint $table) {
            $table->dropColumn('uso_descuento_bienvenida');
        });
    }
};
