<?php

namespace App\Http\Controllers;

use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UsuarioController extends Controller
{
    /*  ╔════════════ Crear Usuario ═════════════╗
        ╚════════════════════════════════════════╝ */

    public function CrearUsuario(Request $request)
    {

        try {

            // Convertir última letra de cédula a mayúscula
            $cedula = strtoupper($request->cedula_identidad_usuario);

            $validator = Validator::make( // Validación
                [
                    'nombre_completo_usuario' => $request->nombre_completo_usuario,
                    'cedula_identidad_usuario' => $cedula,
                    'nombre_usuario' => $request->nombre_usuario,
                    'password_hash_usuario' => $request->password_hash_usuario,
                    'id_rol_usuario' => $request->id_rol_usuario,
                ],
                [
                    'nombre_completo_usuario' => [
                        'required',
                        'regex:/^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/',
                    ],

                    'cedula_identidad_usuario' => [

                        'regex:/^[0-9]{3}-[0-9]{6}-[0-9]{4}[A-Z]{1}$/',
                        'unique:usuarios,cedula_identidad_usuario',
                    ],

                    'nombre_usuario' => [
                        'required',
                        'unique:usuarios,nombre_usuario',
                    ],

                    'password_hash_usuario' => [
                        'required',
                        'min:6',
                    ],

                    'id_rol_usuario' => [
                        'required',
                        'exists:roles,id_rol',
                    ],
                ],
                [
                    'nombre_completo_usuario.regex' => 'El nombre no puede contener números.',
                    'cedula_identidad_usuario.regex' => 'La cédula debe tener formato xxx-xxxxxx-xxxxX.',
                    'cedula_identidad_usuario.unique' => 'Ya existe un usuario con esta cédula.',
                    'nombre_usuario.unique' => 'Este nombre de usuario ya está en uso.',
                    'password_hash_usuario.min' => 'La contraseña debe tener al menos 6 caracteres.',
                ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            Usuario::create([// Crear usuario
                'nombre_completo_usuario' => $request->nombre_completo_usuario,
                'cedula_identidad_usuario' => $cedula,
                'nombre_usuario' => $request->nombre_usuario,
                'password_hash_usuario' => Hash::make($request->password_hash_usuario),
                'id_rol_usuario' => $request->id_rol_usuario,
                'estado_usuario' => true,
            ]);

            return response()->json(
                [
                    'success' => true,
                    'mensaje' => 'Usuario creado correctamente',
                ], 200);

        } catch (\Exception $e) {

            return response()->json([// Depuración de errores
                'error' => true,
                'mensaje' => 'Error al crear usuario',
                'detalle' => $e->getMessage(),
            ], 500);
        }

    }

    /*  ╔════════════ Editar Usuario ════════════╗
        ╚════════════════════════════════════════╝ */

    public function EditarUsuario($id)
    {
        try {

            $usuario = Usuario::where('id_usuario', $id)->first();

            if (! $usuario) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Usuario no encontrado',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'usuario' => $usuario,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener usuario',
                'detalle' => $e->getMessage(),
            ], 500);

        }
    }

    /*  ╔════════════ Actualizar Usuario ════════════╗
        ╚════════════════════════════════════════════╝ */

    public function ActualizarUsuario(Request $request, $id)
    {
        try {

            $usuario = Usuario::where('id_usuario', $id)->first();

            if (! $usuario) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Usuario no encontrado',
                ], 404);
            }

            // Convertir última letra de cédula a mayúscula
            $cedula = strtoupper($request->cedula_identidad_usuario);

            $validator = Validator::make(

                [
                    'nombre_completo_usuario' => $request->nombre_completo_usuario,
                    'cedula_identidad_usuario' => $cedula,
                    'nombre_usuario' => $request->nombre_usuario,
                    'password_hash_usuario' => $request->password_hash_usuario,
                    'id_rol_usuario' => $request->id_rol_usuario,
                    'estado_usuario' => $request->estado_usuario,
                ],

                [
                    'nombre_completo_usuario' => [
                        'required',
                        'regex:/^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/',
                    ],

                    'cedula_identidad_usuario' => [
                        'regex:/^[0-9]{3}-[0-9]{6}-[0-9]{4}[A-Z]{1}$/',
                        "unique:usuarios,cedula_identidad_usuario,$id,id_usuario",
                    ],

                    'nombre_usuario' => [
                        'required',
                        "unique:usuarios,nombre_usuario,$id,id_usuario",
                    ],

                    'password_hash_usuario' => [
                        'nullable',
                        'min:6',
                    ],

                    'id_rol_usuario' => [
                        'required',
                        'exists:roles,id_rol',
                    ],

                    'estado_usuario' => [
                        'required',
                        'boolean',
                    ],

                ],

                [
                    'nombre_completo_usuario.regex' => 'El nombre no puede contener números.',
                    'cedula_identidad_usuario.regex' => 'La cédula debe tener formato xxx-xxxxxx-xxxxX.',
                    'cedula_identidad_usuario.unique' => 'Ya existe un usuario con esta cédula.',
                    'nombre_usuario.unique' => 'Este nombre de usuario ya está en uso.',
                    'password_hash_usuario.min' => 'La contraseña debe tener al menos 6 caracteres.',
                ]

            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Actualizar datos
            $usuario->nombre_completo_usuario = $request->nombre_completo_usuario;
            $usuario->cedula_identidad_usuario = $cedula;
            $usuario->nombre_usuario = $request->nombre_usuario;
            $usuario->id_rol_usuario = $request->id_rol_usuario;
            $usuario->estado_usuario = $request->estado_usuario;

            // Actualizar contraseña solo si viene
            if ($request->filled('password_hash_usuario')) {
                $usuario->password_hash_usuario = Hash::make($request->password_hash_usuario);
            }

            $usuario->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Usuario actualizado correctamente',
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar usuario',
                'detalle' => $e->getMessage(),
            ], 500);

        }

    }

    /*  ╔══════════════ Mostrar Usuario ═════════════╗
        ╚════════════════════════════════════════════╝ */

    public function MostrarUsuarios()
    {
        try {

            $usuarios = Usuario::select(
                'usuarios.id_usuario',
                'usuarios.nombre_completo_usuario',
                'usuarios.cedula_identidad_usuario',
                'usuarios.nombre_usuario',
                'usuarios.id_rol_usuario',
                'usuarios.estado_usuario',
                'usuarios.fecha_creacion_usuario',
                'roles.nombre_rol'
            )
                ->join('roles', 'usuarios.id_rol_usuario', '=', 'roles.id_rol')
                ->get();

            return response()->json([
                'success' => true,
                'usuarios' => $usuarios,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener usuarios',
                'detalle' => $e->getMessage(),
            ], 500);

        } // Fin del try
    } // Fin de la funcion

    /*  ╔══════════════ Estado Usuario ══════════════╗
        ╚════════════════════════════════════════════╝ */

    public function cambiarEstadoUsuario($id)
    {
        $usuario = Usuario::findOrFail($id);
        $usuario->estado_usuario = ! $usuario->estado_usuario;
        $usuario->save();

        return response()->json(['success' => true]);
    }

    /*  ╔════════════ Mostrar Rol en Usuario ═══════════╗
        ╚═══════════════════════════════════════════════╝ */

    public function MostrarRolesUsuario(Request $request)
    {
        try {

            // Validar parámetros opcionales
            $validator = Validator::make($request->all(), [
                'estado' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensajes' => $validator->errors(),
                ], 400);
            }

            // Consulta base
            $query = Rol::query();

            // Filtrar por estado si se envía
            if ($request->has('estado')) {
                $query->where('estado_rol', $request->estado);
            }

            $roles = $query->orderBy('id_rol', 'asc')->get();

            return response()->json([
                'success' => true,
                'total' => $roles->count(),
                'data' => $roles,
            ], 200);

        } catch (\Exception $e) {

            // Depuración
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener los roles',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }
} // Fin del controlador
