<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TiposFacturaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('tipos_factura')->insert([
            [
                'nombre_tipo_factura' => 'CONTADO',
                'descripcion_tipo_factura' => 'Factura pagada al momento de la compra',
                'estado' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nombre_tipo_factura' => 'CREDITO',
                'descripcion_tipo_factura' => 'Factura a crédito, pago diferido',
                'estado' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

        ]);
    }
}
