<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class rolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('roles')->insert([
            [
                'nombre_rol' => 'Administrador',
                'descripcion_rol' => 'Acceso total al sistema, configuración, usuarios, reportes y control general.',
            ],

            /*
            [
                'nombre_rol' => 'Cajero',
                'descripcion_rol' => 'Encargado de realizar ventas, cobros, apertura y cierre de caja.'
            ],
            [
                'nombre_rol' => 'Bodeguero',
                'descripcion_rol' => 'Responsable del inventario, entradas, salidas y control de productos.'
            ],
            [
                'nombre_rol' => 'Supervisor',
                'descripcion_rol' => 'Supervisa operaciones, revisa movimientos y valida procesos del sistema.'
            ],
            [
                'nombre_rol' => 'Contador',
                'descripcion_rol' => 'Gestiona gastos, cuentas, reportes financieros e información contable.'
            ],
            */
        ]);

    }
}
