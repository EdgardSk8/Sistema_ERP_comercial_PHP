<?php

namespace App\Http\Controllers;

use App\Models\Permiso;
use App\Models\Rol;
use Illuminate\Http\Request;

class RolPermisoController extends Controller
{
    /**
     * Devuelve TODO estructurado para la vista:
     * roles + permisos + permisos asignados por rol
     */
    public function obtenerRolesPermisos()
    {
        $roles = Rol::with('permisos')->get();
        $permisos = Permiso::all();

        return response()->json([
            'roles' => $roles,
            'permisos' => $permisos,
        ]);
    }

    /**
     * Alterna permiso por rol (asignar / quitar)
     */
    public function asignar(Request $request)
    {
        $request->validate([
            'id_rol' => 'required|exists:roles,id_rol',
            'id_permiso' => 'required|exists:permisos,id_permiso',
            'asignar' => 'required|boolean',
        ]);

        $rol = Rol::findOrFail($request->id_rol);

        // 🔥 PROTECCIÓN ADMINISTRADOR
        // Se responde 200 con success=false para que el front muestre un toast
        // y no aparezca un error de red en la consola del navegador.
        if ($rol->id_rol == 1 && ! $request->asignar) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No se pueden quitar permisos al rol Administrador',
            ]);
        }

        if ($request->asignar) {
            $rol->permisos()->syncWithoutDetaching([$request->id_permiso]);
        } else {
            $rol->permisos()->detach($request->id_permiso);
        }

        return response()->json([
            'success' => true,
            'mensaje' => 'Permiso actualizado correctamente',
        ]);
    }
}
