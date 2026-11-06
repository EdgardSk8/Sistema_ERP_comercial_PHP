<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            // Nullable: los productos existentes siguen funcionando sin marca.
            $table->unsignedInteger('id_marca')->nullable();

            $table->foreign('id_marca')
                ->references('id_marca')
                ->on('marcas')
                ->onDelete('set null');

            $table->index('id_marca');
        });
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropForeign(['id_marca']);
            $table->dropIndex(['id_marca']);
            $table->dropColumn('id_marca');
        });
    }
};
