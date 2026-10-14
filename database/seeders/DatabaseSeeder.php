<?php

namespace Database\Seeders;

use App\Models\Credenciales;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {

        $this->call([
            rolesSeeder::class,
            permisosSeeder::class,
            rol_permisoSeeder::class,

            // 👤 Usuarios (depende de roles)
            usuariosSeeder::class,

            // 📦 Catálogos base
            //categoriaSeeder::class,
            impuestosSeeder::class,
            metodos_pagoSeeder::class,
            //tipo_gastoSeeder::class,

            // 👥 Terceros
            // proveedoresSeeder::class,
            //clientesSeeder::class,

            // 💰 Estructura financiera (ANTES de usarse)
            //cuentasSeeder::class,
            //cajasSeeder::class,

            // 🛒 Productos
            //productosSeeder::class,

            // 📥 Compras (usan proveedores + productos + cuentas/caja)
            //comprasSeeder::class,
            //detalle_comprasSeeder::class,

            // 📦 Inventario (depende de compras/productos)
            //movimientos_inventarioSeeder::class,

            // 📤 Ventas (usan clientes + usuarios + caja/cuenta)
            //ventasSeeder::class,
            //detalle_ventasSeeder::class,

            // 💸 Gastos (usan tipo_gasto + caja/cuenta)
            //gastosSeeder::class,
            //movimientos_gastosSeeder::class,

            // 💵 Movimientos financieros (al final)
            //movimientos_cajaSeeder::class,
            //movimientos_cuentasSeeder::class,
            //UbicacionesSeeder::class,
            credencialesSeeder::class,
            TiposFacturaSeeder::class
        ]);
    }
}
