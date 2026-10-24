<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class CargaVistaController extends Controller
{
    
    public function cargarpermisosUsuario()
    {
        try {

            $usuario = session('usuario');

            if (!$usuario) {
                return response()->json([
                    'status' => false,
                    'message' => 'No autenticado'
                ], 401);
            }

            $permisos = DB::table('rol_permiso')
                ->join('permisos', 'rol_permiso.id_permiso', '=', 'permisos.id_permiso')
                ->where('rol_permiso.id_rol', $usuario['id_rol'])
                ->where('permisos.estado_permiso', 1)
                ->orderBy('rol_permiso.id_rol_permiso')
                ->select('permisos.nombre_permiso')
                ->get();

            return response()->json([
                'status' => true,
                'permisos' => $permisos,
                'primer' => $permisos[0]->nombre_permiso ?? null
            ]);

        } catch (\Throwable $e) {

            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

}