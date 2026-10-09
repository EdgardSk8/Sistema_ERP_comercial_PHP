<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\DB;

use App\Models\Usuario;
use App\Models\Credenciales;

class LoginController extends Controller
{
    public function mostrarLogin()
    {
        $nombreEmpresa = Credenciales::query()->value('nombre_empresa');
        $logoEmpresa = Credenciales::query()->value('logo_empresa');
        if ($logoEmpresa && !filter_var($logoEmpresa, FILTER_VALIDATE_URL)) {
            $logoEmpresa = asset($logoEmpresa);
        }

        return view('login.Login', compact('nombreEmpresa', 'logoEmpresa'));
    }

    public function login(Request $request)
    {
        try {

            // VALIDACIÓN
            $validator = Validator::make($request->all(), [
                'nombre_usuario' => 'required',
                'password' => 'required'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // BUSCAR USUARIO
            $usuario = Usuario::select(
                    'usuarios.*',
                    'roles.nombre_rol'
                )
                ->join('roles', 'usuarios.id_rol_usuario', '=', 'roles.id_rol')
                ->where('nombre_usuario', $request->nombre_usuario)
                ->first();

            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Usuario no existe'
                ], 401);
            }

            if (!$usuario->estado_usuario) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Usuario inactivo'
                ], 403);
            }

            if (!Hash::check($request->password, $usuario->password_hash_usuario)) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Credenciales incorrectas'
                ], 401);
            }

            // SESIÓN USUARIO
            Session::put('usuario', [
                'id' => $usuario->id_usuario,
                'nombre' => $usuario->nombre_usuario,
                'id_rol' => $usuario->id_rol_usuario,
                'rol' => $usuario->nombre_rol
            ]);

            // 🔥 PERMISOS (IMPORTANTE)
            $permisos = DB::table('rol_permiso')
                ->join('permisos', 'rol_permiso.id_permiso', '=', 'permisos.id_permiso')
                ->where('rol_permiso.id_rol', $usuario->id_rol_usuario)
                ->where('permisos.estado_permiso', 1)
                ->pluck('permisos.nombre_permiso')
                ->toArray();

            Session::put('permisos', $permisos);

            return response()->json([
                'success' => true,
                'mensaje' => '¡Bienvenido, ' . $usuario->nombre_usuario . '!'
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'mensaje' => 'Error en login'
            ], 500);
        }
    }

    public function logout()
    {
        Session::forget('usuario');
        Session::forget('permisos');
        Session::flush();

        return response()->json([
            'success' => true,
            'mensaje' => 'Sesión cerrada'
        ]);
    }

    public function me()
    {
        $usuario = session('usuario');

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $usuario['id'] ?? null,
                'nombre' => $usuario['nombre'] ?? null,
                'id_rol' => $usuario['id_rol'] ?? null,
                'rol' => $usuario['rol'] ?? null,
            ]
        ]);
    }

}
