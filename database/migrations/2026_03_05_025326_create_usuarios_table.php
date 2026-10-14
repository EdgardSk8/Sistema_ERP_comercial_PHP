<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUsuariosTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('usuarios', function (Blueprint $table) {
            $table->increments('id_usuario');
            $table->string('nombre_completo_usuario', 150);
            $table->string('cedula_identidad_usuario', 16)->unique();
            $table->string('nombre_usuario', 50)->unique();
            $table->string('password_hash_usuario', 255);

            $table->unsignedInteger('id_rol_usuario');

            $table->boolean('estado_usuario')->default(true);
            $table->dateTime('fecha_creacion_usuario')->useCurrent();

            $table->foreign('id_rol_usuario')
                ->references('id_rol')
                ->on('roles')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('usuarios');
    }
}
