<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class metodos_pagoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('metodos_pago')->insert([
            [
                'nombre_metodo_pago' => 'Efectivo',
                'descripcion_metodo_pago' => 'Pago físico con papel moneda o monedas',
                'estado_metodo_pago' => true,
            ],

            /*
            [
                'nombre_metodo_pago' => 'Tarjeta de Débito/Crédito',
                'descripcion_metodo_pago' => 'Pagos procesados por terminal bancaria (POS)',
                'estado_metodo_pago' => true,
            ],
            [
                'nombre_metodo_pago' => 'Transferencia Bancaria',
                'descripcion_metodo_pago' => 'Depósitos directos a cuenta corriente o ahorros',
                'estado_metodo_pago' => true,
            ],
            [
                'nombre_metodo_pago' => 'Pago móvil (Billetera Movil)',
                'descripcion_metodo_pago' => 'Pago desde aplicación móvil o banca digital',
                'estado_metodo_pago' => true,
            ],
            */
        ]);
    }
}
