<?php

use Illuminate\Support\Facades\DB;

/*
 * Crea 10 clientes de prueba y sus reseñas en Adidas Sambas (id_producto = 5).
 * Es idempotente: si se vuelve a ejecutar, actualiza los mismos registros.
 *
 * Ejecutar:
 *   php artisan tinker scripts/crear_resenas_adidas.php
 */

$producto = DB::table('productos')
    ->where('nombre_producto', 'ilike', '%adidas%')
    ->where('nombre_producto', 'ilike', '%samba%')
    ->first(['id_producto', 'nombre_producto']);

if (!$producto) {
    throw new RuntimeException('No se encontró el producto Adidas Sambas.');
}

$resenas = [
    [
        'nombre' => 'Carlos Méndez',
        'usuario' => 'prueba_adidas_01',
        'correo' => 'prueba.adidas01@telleztest.local',
        'telefono' => '8888-1001',
        'calificacion' => 5,
        'fecha' => '2026-11-01 18:20:00',
        'comentario' => 'Excelentes zapatos, muy cómodos desde el primer día. El color combina con todo y se sienten de buena calidad.',
    ],
    [
        'nombre' => 'María López',
        'usuario' => 'prueba_adidas_02',
        'correo' => 'prueba.adidas02@telleztest.local',
        'telefono' => '8888-1002',
        'calificacion' => 5,
        'fecha' => '2026-11-01 11:05:00',
        'comentario' => 'Me encantaron. La talla es fiel y el material se siente resistente. Llegaron muy bien empacados.',
    ],
    [
        'nombre' => 'José Ramírez',
        'usuario' => 'prueba_adidas_03',
        'correo' => 'prueba.adidas03@telleztest.local',
        'telefono' => '8888-1003',
        'calificacion' => 4,
        'fecha' => '2026-10-31 09:40:00',
        'comentario' => 'Muy bonitos y cómodos. Solo tardaron un poco en llegar, pero valió la pena la espera.',
    ],
    [
        'nombre' => 'Ana Torres',
        'usuario' => 'prueba_adidas_04',
        'correo' => 'prueba.adidas04@telleztest.local',
        'telefono' => '8888-1004',
        'calificacion' => 5,
        'fecha' => '2026-10-30 16:15:00',
        'comentario' => 'Los uso para caminar todo el día y no me cansan. Son ligeros, cómodos y combinan con cualquier outfit.',
    ],
    [
        'nombre' => 'Luis Castillo',
        'usuario' => 'prueba_adidas_05',
        'correo' => 'prueba.adidas05@telleztest.local',
        'telefono' => '8888-1005',
        'calificacion' => 4,
        'fecha' => '2026-10-29 13:10:00',
        'comentario' => 'Buena compra. El diseño es clásico y combina con jeans o shorts. La atención al cliente fue muy amable.',
    ],
    [
        'nombre' => 'Karla Jiménez',
        'usuario' => 'prueba_adidas_06',
        'correo' => 'prueba.adidas06@telleztest.local',
        'telefono' => '8888-1006',
        'calificacion' => 5,
        'fecha' => '2026-10-28 19:35:00',
        'comentario' => 'La mejor compra del mes. Se ven increíbles puestos y la atención fue excelente de principio a fin.',
    ],
    [
        'nombre' => 'Pedro Álvarez',
        'usuario' => 'prueba_adidas_07',
        'correo' => 'prueba.adidas07@telleztest.local',
        'telefono' => '8888-1007',
        'calificacion' => 3,
        'fecha' => '2026-10-27 10:25:00',
        'comentario' => 'Están bien, aunque los esperaba un poco más suaves. La talla quedó perfecta y el diseño me gustó.',
    ],
    [
        'nombre' => 'Sofía Rojas',
        'usuario' => 'prueba_adidas_08',
        'correo' => 'prueba.adidas08@telleztest.local',
        'telefono' => '8888-1008',
        'calificacion' => 5,
        'fecha' => '2026-10-26 15:50:00',
        'comentario' => 'Muy satisfecha. Llegaron bien empacados y tal como se ven en las fotos. Los volvería a comprar.',
    ],
    [
        'nombre' => 'Miguel Herrera',
        'usuario' => 'prueba_adidas_09',
        'correo' => 'prueba.adidas09@telleztest.local',
        'telefono' => '8888-1009',
        'calificacion' => 4,
        'fecha' => '2026-10-25 12:30:00',
        'comentario' => 'Cómodos y con buen agarre. Los recomiendo para uso diario, aunque el envío pudo ser un poco más rápido.',
    ],
    [
        'nombre' => 'Valeria Cruz',
        'usuario' => 'prueba_adidas_10',
        'correo' => 'prueba.adidas10@telleztest.local',
        'telefono' => '8888-1010',
        'calificacion' => 5,
        'fecha' => '2026-10-24 08:45:00',
        'comentario' => 'Hermosos, ligeros y muy cómodos. Definitivamente volvería a comprarlos y los recomendaría a mis amigas.',
    ],
];

$creados = 0;
$actualizados = 0;

DB::transaction(function () use ($producto, $resenas, &$creados, &$actualizados) {
    foreach ($resenas as $fila) {
        $cliente = DB::table('clientes')
            ->where('usuario_cliente', $fila['usuario'])
            ->first(['id_cliente']);

        $datosCliente = [
            'nombre_cliente' => $fila['nombre'],
            'correo_cliente' => $fila['correo'],
            'telefono_cliente' => $fila['telefono'],
            'direccion_cliente' => 'Managua, Nicaragua',
            'descuento_valor_cliente' => 0,
            'estado_cliente' => true,
        ];

        if ($cliente) {
            DB::table('clientes')->where('id_cliente', $cliente->id_cliente)->update($datosCliente);
            $idCliente = $cliente->id_cliente;
            $actualizados++;
        } else {
            $idCliente = DB::table('clientes')->insertGetId($datosCliente + [
                'usuario_cliente' => $fila['usuario'],
                'password_hash_cliente' => null,
                'fecha_creacion_cliente' => now(),
            ], 'id_cliente');
            $creados++;
        }

        DB::table('resenias_productos')->updateOrInsert(
            [
                'id_cliente' => $idCliente,
                'id_producto' => $producto->id_producto,
            ],
            [
                'calificacion_resenia' => $fila['calificacion'],
                'comentario_resenia' => $fila['comentario'],
                'estado_resenia' => true,
                'fecha_creacion_resenia' => $fila['fecha'],
                'fecha_actualizacion_resenia' => null,
            ]
        );
    }
});

$total = DB::table('resenias_productos')
    ->where('id_producto', $producto->id_producto)
    ->where('estado_resenia', true)
    ->count();

printf(
    "Producto: %s (ID %d) | Clientes creados: %d | actualizados: %d | Reseñas visibles: %d\n",
    $producto->nombre_producto,
    $producto->id_producto,
    $creados,
    $actualizados,
    $total
);

exit;
