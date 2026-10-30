<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->date('fecha_nacimiento_cliente')->nullable()->after('telefono_cliente');
            $table->string('usuario_cliente', 60)->nullable()->unique()->after('correo_cliente');
            $table->string('password_hash_cliente')->nullable()->after('usuario_cliente');
            $table->string('descuento_tipo_cliente', 20)->nullable()->after('password_hash_cliente');
            $table->decimal('descuento_valor_cliente', 10, 2)->default(0)->after('descuento_tipo_cliente');
        });
    }

    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropUnique(['usuario_cliente']);
            $table->dropColumn([
                'fecha_nacimiento_cliente',
                'usuario_cliente',
                'password_hash_cliente',
                'descuento_tipo_cliente',
                'descuento_valor_cliente',
            ]);
        });
    }
};
