<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class RuletaClientesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        foreach (['clientes', 'rol_permiso', 'permisos'] as $tabla) {
            Schema::dropIfExists($tabla);
        }

        Schema::create('clientes', function (Blueprint $table) {
            $table->increments('id_cliente');
            $table->string('nombre_cliente', 150);
            $table->boolean('estado_cliente')->default(true);
        });

        Schema::create('permisos', function (Blueprint $table) {
            $table->increments('id_permiso');
            $table->string('nombre_permiso');
            $table->string('modulo_permiso');
            $table->boolean('estado_permiso')->default(true);
        });

        Schema::create('rol_permiso', function (Blueprint $table) {
            $table->unsignedInteger('id_rol');
            $table->unsignedInteger('id_permiso');
        });

        DB::table('permisos')->insert([
            ['id_permiso' => 1, 'nombre_permiso' => 'vista_clientes', 'modulo_permiso' => 'clientes', 'estado_permiso' => true],
            ['id_permiso' => 2, 'nombre_permiso' => 'mostrar_clientes', 'modulo_permiso' => 'clientes', 'estado_permiso' => true],
        ]);

        DB::table('rol_permiso')->insert([
            ['id_rol' => 1, 'id_permiso' => 1],
            ['id_rol' => 1, 'id_permiso' => 2],
        ]);

        DB::table('clientes')->insert([
            ['nombre_cliente' => 'María López', 'estado_cliente' => true],
            ['nombre_cliente' => 'Cliente Genérico', 'estado_cliente' => true],
            ['nombre_cliente' => 'Carlos Pérez', 'estado_cliente' => false],
        ]);
    }

    public function test_la_ruleta_exige_sesion_del_erp(): void
    {
        $this->getJson('/tienda/api/ruleta/clientes')
            ->assertStatus(401)
            ->assertJson(['success' => false]);
    }

    public function test_devuelve_solo_clientes_activos_y_sin_el_cliente_generico(): void
    {
        $respuesta = $this->withSession([
            'usuario' => ['id_usuario' => 1, 'id_rol' => 1],
        ])->getJson('/tienda/api/ruleta/clientes');

        $respuesta->assertOk()
            ->assertJson(['success' => true, 'total' => 1])
            ->assertJsonPath('clientes.0.nombre', 'María López');
    }

    public function test_rechaza_roles_sin_permiso_de_clientes(): void
    {
        DB::table('rol_permiso')->where('id_rol', 1)->delete();

        $this->withSession([
            'usuario' => ['id_usuario' => 1, 'id_rol' => 1],
        ])->getJson('/tienda/api/ruleta/clientes')
            ->assertStatus(403)
            ->assertJson(['success' => false]);
    }
}
