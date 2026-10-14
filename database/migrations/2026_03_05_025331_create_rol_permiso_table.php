<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRolPermisoTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('rol_permiso', function (Blueprint $table) {
            $table->increments('id_rol_permiso');

            $table->unsignedInteger('id_rol');
            $table->unsignedInteger('id_permiso');

            $table->dateTime('fecha_asignacion_rol_permiso')->useCurrent();

            $table->foreign('id_rol')->references('id_rol')->on('roles')->onDelete('cascade');
            $table->foreign('id_permiso')->references('id_permiso')->on('permisos')->onDelete('cascade');

            $table->unique(['id_rol', 'id_permiso']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('rol_permiso');
    }
}
