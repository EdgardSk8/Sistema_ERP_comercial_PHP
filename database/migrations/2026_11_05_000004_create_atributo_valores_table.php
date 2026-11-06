<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('atributo_valores', function (Blueprint $table) {
            $table->increments('id_valor');
            $table->unsignedInteger('id_atributo');
            $table->string('valor_atributo', 100);
            $table->integer('orden_valor')->default(0);
            $table->boolean('estado_valor')->default(true);

            $table->foreign('id_atributo')
                ->references('id_atributo')
                ->on('atributos')
                ->onDelete('cascade');

            $table->unique(['id_atributo', 'valor_atributo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('atributo_valores');
    }
};
