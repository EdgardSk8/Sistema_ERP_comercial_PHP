<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class clientesSeeder extends Seeder
{
    public function run()
    {
        DB::table('clientes')->insert([

            [
                'nombre_cliente' => 'Cliente Generico',
                'cedula_cliente' => '',
                'ruc_cliente' => null,
                'telefono_cliente' => '',
                'direccion_cliente' => 'León',
                'correo_cliente' => '',
                'estado_cliente' => 1,
                'fecha_creacion_cliente' => now(),
            ],

            /*
            [
                'nombre_cliente' => 'Carlos Martínez',
                'cedula_cliente' => '001-030304-1002B',
                'ruc_cliente' => null,
                'telefono_cliente' => '88880003',
                'direccion_cliente' => 'Managua',
                'correo_cliente' => 'carlos.m@gmail.com',
                'estado_cliente' => 1,
                'fecha_creacion_cliente' => now(),
            ],

            [
                'nombre_cliente' => 'Ana Rodríguez',
                'cedula_cliente' => '001-040405-1003C',
                'ruc_cliente' => null,
                'telefono_cliente' => '88880004',
                'direccion_cliente' => 'Chinandega',
                'correo_cliente' => null,
                'estado_cliente' => 1,
                'fecha_creacion_cliente' => now(),
            ],

            [
                'nombre_cliente' => 'Luis García',
                'cedula_cliente' => '001-050506-1004D',
                'ruc_cliente' => null,
                'telefono_cliente' => '88880005',
                'direccion_cliente' => 'Estelí',
                'correo_cliente' => null,
                'estado_cliente' => 1,
                'fecha_creacion_cliente' => now(),
            ],

            [
                'nombre_cliente' => 'Pedro Sánchez',
                'cedula_cliente' => null,
                'ruc_cliente' => null,
                'telefono_cliente' => '88880006',
                'direccion_cliente' => 'Masaya',
                'correo_cliente' => null,
                'estado_cliente' => 1,
                'fecha_creacion_cliente' => now(),
            ],

            [
                'nombre_cliente' => 'Jorge Mendoza',
                'cedula_cliente' => null,
                'ruc_cliente' => null,
                'telefono_cliente' => '88880007',
                'direccion_cliente' => 'Granada',
                'correo_cliente' => null,
                'estado_cliente' => 1,
                'fecha_creacion_cliente' => now(),
            ],

            [
                'nombre_cliente' => 'José Castillo',
                'cedula_cliente' => null,
                'ruc_cliente' => null,
                'telefono_cliente' => '88880008',
                'direccion_cliente' => 'León',
                'correo_cliente' => null,
                'estado_cliente' => 1,
                'fecha_creacion_cliente' => now(),
            ],

            [
                'nombre_cliente' => 'Miguel Vargas',
                'cedula_cliente' => null,
                'ruc_cliente' => null,
                'telefono_cliente' => '88880009',
                'direccion_cliente' => 'Rivas',
                'correo_cliente' => null,
                'estado_cliente' => 1,
                'fecha_creacion_cliente' => now(),
            ],

            [
                'nombre_cliente' => 'Andrea Ruiz',
                'cedula_cliente' => null,
                'ruc_cliente' => null,
                'telefono_cliente' => '88880010',
                'direccion_cliente' => 'Managua',
                'correo_cliente' => 'andrea.ruiz@gmail.com',
                'estado_cliente' => 1,
                'fecha_creacion_cliente' => now(),
            ],
            */

        ]);
    }
}
