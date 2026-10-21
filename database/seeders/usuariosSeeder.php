<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class usuariosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('usuarios')->insert([

            [
                'nombre_completo_usuario' => 'Edgard Tellez',
                'cedula_identidad_usuario' => '281-151202-1003C',
                'nombre_usuario' => 'Edgard',
                'password_hash_usuario' => Hash::make('123456'),
                'id_rol_usuario' => 1,
                'estado_usuario' => true,
                'fecha_creacion_usuario' => now(),
            ],

            /*
            [
                'nombre_completo_usuario' => 'María José López',
                'cedula_identidad_usuario' => '001-240899-1023A',
                'nombre_usuario' => 'mlopez',
                'password_hash_usuario' => Hash::make('123456'),
                'id_rol_usuario' => 2,
                'estado_usuario' => true,
                'fecha_creacion_usuario' => now()
            ],

            // ═════════════ BODEGUERO (REAL) ═════════════
            [
                'nombre_completo_usuario' => 'Carlos Alberto Pérez',
                'cedula_identidad_usuario' => '002-120795-1045B',
                'nombre_usuario' => 'cperez',
                'password_hash_usuario' => Hash::make('123456'),
                'id_rol_usuario' => 3,
                'estado_usuario' => true,
                'fecha_creacion_usuario' => now()
            ],

            // ═════════════ SUPERVISOR (NUEVO) ═════════════
            [
                'nombre_completo_usuario' => 'Ana Sofía Martínez',
                'cedula_identidad_usuario' => '003-180690-1078C',
                'nombre_usuario' => 'asmartinez',
                'password_hash_usuario' => Hash::make('123456'),
                'id_rol_usuario' => 4,
                'estado_usuario' => true,
                'fecha_creacion_usuario' => now()
            ],

            // ═════════════ CONTADOR (NUEVO) ═════════════
            [
                'nombre_completo_usuario' => 'José Ramón Castillo',
                'cedula_identidad_usuario' => '004-050588-1099D',
                'nombre_usuario' => 'jcastillo',
                'password_hash_usuario' => Hash::make('123456'),
                'id_rol_usuario' => 5,
                'estado_usuario' => true,
                'fecha_creacion_usuario' => now()
            ],
            */

        ]);
    }
}
