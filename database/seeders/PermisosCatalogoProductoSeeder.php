<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Permisos del módulo "Marcas y atributos" (catálogos de productos).
 *
 * Es idempotente: se puede ejecutar varias veces sin duplicar permisos ni
 * asignaciones al rol Administrador.
 */
class PermisosCatalogoProductoSeeder extends Seeder
{
    private const PERMISOS = [
        'vista_catalogos_producto' => 'Ver marcas y atributos',
        'mostrar_catalogos_producto' => 'Listar marcas y atributos',
        'crear_catalogos_producto' => 'Crear marcas y atributos',
        'actualizar_catalogos_producto' => 'Actualizar marcas y atributos',
        'cambiar_estado_catalogos_producto' => 'Cambiar estado de marcas y atributos',
    ];

    private const ROL_ADMINISTRADOR = 1;

    public function run(): void
    {
        foreach (self::PERMISOS as $nombre => $descripcion) {
            $idPermiso = DB::table('permisos')->where('nombre_permiso', $nombre)->value('id_permiso');

            if (! $idPermiso) {
                $idPermiso = DB::table('permisos')->insertGetId([
                    'nombre_permiso' => $nombre,
                    'descripcion_permiso' => $descripcion,
                    'modulo_permiso' => 'catalogos_producto',
                    'estado_permiso' => true,
                ], 'id_permiso');
            }

            $asignado = DB::table('rol_permiso')
                ->where('id_rol', self::ROL_ADMINISTRADOR)
                ->where('id_permiso', $idPermiso)
                ->exists();

            if (! $asignado) {
                DB::table('rol_permiso')->insert([
                    'id_rol' => self::ROL_ADMINISTRADOR,
                    'id_permiso' => $idPermiso,
                ]);
            }
        }
    }
}
