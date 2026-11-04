<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $permisos = [
        ['nombre_permiso' => 'vista_promociones', 'descripcion_permiso' => 'Ver vista de promociones', 'modulo_permiso' => 'promociones'],
        ['nombre_permiso' => 'mostrar_promociones', 'descripcion_permiso' => 'Listar promociones', 'modulo_permiso' => 'promociones'],
        ['nombre_permiso' => 'crear_promociones', 'descripcion_permiso' => 'Crear promociones', 'modulo_permiso' => 'promociones'],
        ['nombre_permiso' => 'editar_promociones', 'descripcion_permiso' => 'Ver datos para editar promociones', 'modulo_permiso' => 'promociones'],
        ['nombre_permiso' => 'actualizar_promociones', 'descripcion_permiso' => 'Actualizar promociones', 'modulo_permiso' => 'promociones'],
        ['nombre_permiso' => 'cambiar_estado_promociones', 'descripcion_permiso' => 'Activar o desactivar promociones', 'modulo_permiso' => 'promociones'],
    ];

    public function up(): void
    {
        foreach ($this->permisos as $permiso) {
            DB::table('permisos')->insertOrIgnore([
                ...$permiso,
                'estado_permiso' => true,
                'fecha_creacion_permiso' => now(),
            ]);
        }

        $ids = DB::table('permisos')
            ->whereIn('nombre_permiso', array_column($this->permisos, 'nombre_permiso'))
            ->pluck('id_permiso');

        $idRol = DB::table('roles')->where('nombre_rol', 'Administrador')->value('id_rol') ?? 1;

        foreach ($ids as $idPermiso) {
            DB::table('rol_permiso')->insertOrIgnore([
                'id_rol' => $idRol,
                'id_permiso' => $idPermiso,
                'fecha_asignacion_rol_permiso' => now(),
            ]);
        }
    }

    public function down(): void
    {
        $ids = DB::table('permisos')
            ->whereIn('nombre_permiso', array_column($this->permisos, 'nombre_permiso'))
            ->pluck('id_permiso');

        DB::table('rol_permiso')->whereIn('id_permiso', $ids)->delete();
        DB::table('permisos')->whereIn('id_permiso', $ids)->delete();
    }
};
