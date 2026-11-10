<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class tipo_gastoSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('tipo_gasto')->insert([

            [
                'nombre_tipo_gasto' => 'Servicios Públicos',
                'descripcion_tipo_gasto' => 'Pago de luz, agua, internet, teléfono',
                'estado_tipo_gasto' => true,
            ],
            [
                'nombre_tipo_gasto' => 'Mantenimiento',
                'descripcion_tipo_gasto' => 'Reparaciones, limpieza y mantenimiento del local',
                'estado_tipo_gasto' => true,
            ],
            [
                'nombre_tipo_gasto' => 'Sueldos',
                'descripcion_tipo_gasto' => 'Pago de salarios al personal',
                'estado_tipo_gasto' => true,
            ],
            [
                'nombre_tipo_gasto' => 'Impuestos',
                'descripcion_tipo_gasto' => 'Pagos de impuestos locales y nacionales',
                'estado_tipo_gasto' => true,
            ],
            [
                'nombre_tipo_gasto' => 'Otros',
                'descripcion_tipo_gasto' => 'Gastos varios no contemplados en otras categorías',
                'estado_tipo_gasto' => true,
            ],

            // 🔥 nuevos realistas para licorería

            [
                'nombre_tipo_gasto' => 'Transporte y Distribución',
                'descripcion_tipo_gasto' => 'Fletes, entregas y transporte de mercadería',
                'estado_tipo_gasto' => true,
            ],
            [
                'nombre_tipo_gasto' => 'Comida y Viáticos',
                'descripcion_tipo_gasto' => 'Alimentación y viáticos durante compras o entregas',
                'estado_tipo_gasto' => true,
            ],
            [
                'nombre_tipo_gasto' => 'Compras de Inventario',
                'descripcion_tipo_gasto' => 'Compra de productos para reventa',
                'estado_tipo_gasto' => true,
            ],
            [
                'nombre_tipo_gasto' => 'Publicidad y Marketing',
                'descripcion_tipo_gasto' => 'Anuncios, promociones y redes sociales',
                'estado_tipo_gasto' => true,
            ],
            [
                'nombre_tipo_gasto' => 'Empaques y Desechables',
                'descripcion_tipo_gasto' => 'Bolsas, vasos, hielo, servilletas',
                'estado_tipo_gasto' => true,
            ],
            [
                'nombre_tipo_gasto' => 'Seguridad',
                'descripcion_tipo_gasto' => 'Guardas de seguridad, cámaras y vigilancia',
                'estado_tipo_gasto' => true,
            ],
            [
                'nombre_tipo_gasto' => 'Comisiones Bancarias',
                'descripcion_tipo_gasto' => 'Cobros por uso de POS y transferencias',
                'estado_tipo_gasto' => true,
            ],
            [
                'nombre_tipo_gasto' => 'Alquiler del Local',
                'descripcion_tipo_gasto' => 'Pago mensual del establecimiento',
                'estado_tipo_gasto' => true,
            ],
            [
                'nombre_tipo_gasto' => 'Equipos y Mobiliario',
                'descripcion_tipo_gasto' => 'Compra de estanterías, refrigeradores, etc.',
                'estado_tipo_gasto' => true,
            ],

        ]);
    }
}
