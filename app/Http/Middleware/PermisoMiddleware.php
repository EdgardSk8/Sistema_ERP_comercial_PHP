<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;

class PermisoMiddleware
{
    public function handle(Request $request, Closure $next, $permiso): Response
    {
        $usuario = session('usuario');

        // Las peticiones AJAX/JSON reciben JSON con el motivo real. Antes se
        // devolvia una redireccion (HTML) y el front mostraba "error de conexion"
        // en lugar de "no estas autorizado".
        $esperaJson = $request->expectsJson() || $request->ajax();

        if (!$usuario) {

            if ($esperaJson) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Tu sesión expiró. Vuelve a iniciar sesión.',
                ], 401);
            }

            return response()->view('errors.sin_permiso', [], 401);
        }

        $tienePermiso = DB::table('rol_permiso')
            ->join('permisos', 'rol_permiso.id_permiso', '=', 'permisos.id_permiso')
            ->where('rol_permiso.id_rol', $usuario['id_rol'])
            ->where('permisos.nombre_permiso', $permiso)
            ->where('permisos.estado_permiso', 1)
            ->exists();

        if (!$tienePermiso) {

            if ($esperaJson) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'No estás autorizado para esta acción.',
                    'permiso' => $permiso,
                ], 403);
            }

            return redirect()->route('error');
        }

        return $next($request);
    }


}