<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Crea 5 clientes de prueba (usuario1…usuario5 / 123456) y una reseña
 * de cada uno en un producto, con calificaciones de 5 a 1 estrellas.
 *
 * Ejecutar con: php artisan db:seed --class=UsuariosPruebaSeeder
 */
class UsuariosPruebaSeeder extends Seeder
{
    public function run(): void
    {
        $comentarios = [
            5 => 'Excelente producto, superó mis expectativas.',
            4 => 'Muy buena calidad, lo recomiendo.',
            3 => 'Está bien, aunque esperaba un poco más.',
            2 => 'No era lo que esperaba, pero cumple.',
            1 => 'No me gustó, la calidad deja mucho que desear.',
        ];

        // Producto de prueba: el que tenga más reseñas, luego el que tenga
        // más variantes y, por último, el primero registrado.
        $idProducto = DB::table('resenias_productos')
            ->select('id_producto')
            ->groupBy('id_producto')
            ->orderByRaw('count(*) desc')
            ->value('id_producto')
            ?? DB::table('producto_variaciones')
                ->select('id_producto')
                ->groupBy('id_producto')
                ->orderByRaw('count(*) desc')
                ->value('id_producto')
            ?? DB::table('productos')->orderBy('id_producto')->value('id_producto');

        if (! $idProducto) {
            $this->command?->warn('No hay productos registrados; se crean solo los usuarios.');

            return;
        }

        foreach (range(1, 5) as $numero) {
            $usuario = "usuario{$numero}";
            $calificacion = 6 - $numero; // 5, 4, 3, 2, 1

            $idCliente = DB::table('clientes')->where('usuario_cliente', $usuario)->value('id_cliente');

            $datosCliente = [
                'nombre_cliente' => "Usuario Prueba {$numero}",
                'correo_cliente' => "{$usuario}@prueba.local",
                'usuario_cliente' => $usuario,
                'password_hash_cliente' => Hash::make('123456'),
                'estado_cliente' => true,
            ];

            if ($idCliente) {
                DB::table('clientes')->where('id_cliente', $idCliente)->update($datosCliente);
            } else {
                $datosCliente['fecha_creacion_cliente'] = now();
                $idCliente = DB::table('clientes')->insertGetId($datosCliente, 'id_cliente');
            }

            DB::table('resenias_productos')->updateOrInsert(
                ['id_cliente' => $idCliente, 'id_producto' => $idProducto],
                [
                    'calificacion_resenia' => $calificacion,
                    'comentario_resenia' => $comentarios[$calificacion],
                    'estado_resenia' => true,
                    'fecha_creacion_resenia' => now()->subDays($numero),
                    'fecha_actualizacion_resenia' => null,
                ]
            );
        }

        $this->command?->info("Usuarios usuario1…usuario5 creados con reseñas en el producto #{$idProducto}.");
    }
}
