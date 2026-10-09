<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('credenciales', function (Blueprint $table) {
            $table->text('logo_empresa')->nullable()->after('correo_empresa');
        });
    }

    public function down(): void
    {
        Schema::table('credenciales', function (Blueprint $table) {
            $table->dropColumn('logo_empresa');
        });
    }
};
