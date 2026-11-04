<?php

namespace App\Http\Controllers;

use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RolController extends Controller
{
    /*  ╔════════════ Crear Rol ═════════════╗
        ╚════════════════════════════════════╝ */
    public function CrearRol(Request $request)
    {
        try {
            $validator = Validator::make(
                [
                    'nombre_rol' => $request->nombre_rol,
                    'descripcion_rol' => $request->descripcion_rol,
                ],
                [
                    'nombre_rol' => [
                        'required',
                        'unique:roles,nombre_rol',
                        'max:50',
                    ],
                    'descripcion_rol' => [
                        'nullable',
                        'max:150',
                    ],
                ],
                [
                    'nombre_rol.unique' => 'Ya existe un rol con este nombre.',
                    'nombre_rol.required' => 'El nombre del rol es obligatorio.',
                    'nombre_rol.max' => 'El nombre del rol no puede exceder 50 caracteres.',
                    'descripcion_rol.max' => 'La descripción no puede exceder 150 caracteres.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            Rol::create([
                'nombre_rol' => $request->nombre_rol,
                'descripcion_rol' => $request->descripcion_rol,
                'estado_rol' => true,
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Rol creado correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear rol',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═════════════ Editar Rol ══════════════╗
        ╚═══════════════════════════════════════╝ */

    public function EditarRol($id)
    {
        try {
            $rol = Rol::find($id);

            if (! $rol) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Rol no encontrado',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'rol' => $rol,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener rol',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Actualizar Rol ═══════════╗
        ╚══════════════════════════════════════╝ */
    public function ActualizarRol(Request $request, $id)
    {
        try {
            $rol = Rol::find($id);

            if (! $rol) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Rol no encontrado',
                ], 404);
            }

            $validator = Validator::make(
                [
                    'nombre_rol' => $request->nombre_rol,
                    'descripcion_rol' => $request->descripcion_rol,
                    'estado_rol' => $request->estado_rol,
                ],
                [
                    'nombre_rol' => [
                        'required',
                        "unique:roles,nombre_rol,$id,id_rol",
                        'max:50',
                    ],
                    'descripcion_rol' => [
                        'nullable',
                        'max:150',
                    ],
                    'estado_rol' => [
                        'required',
                        'boolean',
                    ],
                ],
                [
                    'nombre_rol.unique' => 'Ya existe un rol con este nombre.',
                    'nombre_rol.required' => 'El nombre del rol es obligatorio.',
                    'nombre_rol.max' => 'El nombre del rol no puede exceder 50 caracteres.',
                    'descripcion_rol.max' => 'La descripción no puede exceder 150 caracteres.',
                    'estado_rol.boolean' => 'El estado debe ser verdadero o falso.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $rol->nombre_rol = $request->nombre_rol;
            $rol->descripcion_rol = $request->descripcion_rol;
            $rol->estado_rol = $request->estado_rol;
            $rol->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Rol actualizado correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar rol',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Cambiar Estado Rol ═════════╗
        ╚════════════════════════════════════════╝ */
    public function CambiarEstadoRol($id)
    {
        try {
            $rol = Rol::find($id);

            if (! $rol) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Rol no encontrado',
                ], 404);
            }

            $rol->estado_rol = ! $rol->estado_rol;
            $rol->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado del rol actualizado',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado del rol',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Mostrar Rol ════════════╗
        ╚════════════════════════════════════╝ */

    public function MostrarRoles()
    {
        try {

            $roles = Rol::all();

            return response()->json([
                'success' => true,
                'roles' => $roles,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener roles',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }
} // Fin controlador
