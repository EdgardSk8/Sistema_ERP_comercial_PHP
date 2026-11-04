<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promociones', function (Blueprint $table) {
            $table->decimal('valor_descuento_promocion', 12, 6)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('promociones', function (Blueprint $table) {
            $table->decimal('valor_descuento_promocion', 10, 2)->nullable()->change();
        });
    }
};
