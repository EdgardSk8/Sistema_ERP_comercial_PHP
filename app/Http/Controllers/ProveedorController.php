<?php

namespace App\Http\Controllers;

use App\Models\Proveedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProveedorController extends Controller
{
    /*  ╔════════════ Crear Proveedor ═════════════╗
        ╚══════════════════════════════════════════╝ */

    public function CrearProveedor(Request $request)
    {
        try {

            $validator = Validator::make(
                [
                    'nombre_proveedor' => $request->nombre_proveedor,
                    'ruc_proveedor' => $request->ruc_proveedor,
                    'telefono_proveedor' => $request->telefono_proveedor,
                    'direccion_proveedor' => $request->direccion_proveedor,
                    'correo_proveedor' => $request->correo_proveedor,
                ],
                [
                    'nombre_proveedor' => [
                        'required',
                        'max:150',
                    ],
                    'ruc_proveedor' => [
                        'nullable',
                        'unique:proveedores,ruc_proveedor',
                        'max:15',
                    ],
                    'telefono_proveedor' => [
                        'nullable',
                        'max:20',
                    ],
                    'direccion_proveedor' => [
                        'nullable',
                        'max:200',
                    ],
                    'correo_proveedor' => [
                        'nullable',
                        'email',
                        'max:100',
                    ],
                ],
                [
                    'nombre_proveedor.required' => 'El nombre del proveedor es obligatorio.',
                    'nombre_proveedor.max' => 'El nombre no puede exceder 150 caracteres.',
                    'ruc_proveedor.unique' => 'Ya existe un proveedor con este RUC.',
                    'correo_proveedor.email' => 'El correo no es válido.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            Proveedor::create([
                'nombre_proveedor' => $request->nombre_proveedor,
                'ruc_proveedor' => $request->ruc_proveedor,
                'telefono_proveedor' => $request->telefono_proveedor,
                'direccion_proveedor' => $request->direccion_proveedor,
                'correo_proveedor' => $request->correo_proveedor,
                'estado_proveedor' => true,
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Proveedor creado correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear proveedor',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═════════════ Editar Proveedor ══════════════╗
        ╚═════════════════════════════════════════════╝ */

    public function EditarProveedor($id)
    {
        try {

            $proveedor = Proveedor::find($id);

            if (! $proveedor) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Proveedor no encontrado',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'proveedor' => $proveedor,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener proveedor',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═════════════ Actualizar Proveedor ══════════════╗
        ╚═════════════════════════════════════════════════╝ */

    public function ActualizarProveedor(Request $request, $id)
    {
        try {

            $proveedor = Proveedor::find($id);

            if (! $proveedor) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Proveedor no encontrado',
                ], 404);
            }

            $validator = Validator::make(
                [
                    'nombre_proveedor' => $request->nombre_proveedor,
                    'ruc_proveedor' => $request->ruc_proveedor,
                    'telefono_proveedor' => $request->telefono_proveedor,
                    'direccion_proveedor' => $request->direccion_proveedor,
                    'correo_proveedor' => $request->correo_proveedor,
                    'estado_proveedor' => $request->estado_proveedor,
                ],
                [
                    'nombre_proveedor' => [
                        'required',
                        'max:150',
                    ],
                    'ruc_proveedor' => [
                        'nullable',
                        "unique:proveedores,ruc_proveedor,$id,id_proveedor",
                        'max:15',
                    ],
                    'telefono_proveedor' => [
                        'nullable',
                        'max:20',
                    ],
                    'direccion_proveedor' => [
                        'nullable',
                        'max:200',
                    ],
                    'correo_proveedor' => [
                        'nullable',
                        'email',
                        'max:100',
                    ],
                    'estado_proveedor' => [
                        'required',
                        'boolean',
                    ],
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $proveedor->nombre_proveedor = $request->nombre_proveedor;
            $proveedor->ruc_proveedor = $request->ruc_proveedor;
            $proveedor->telefono_proveedor = $request->telefono_proveedor;
            $proveedor->direccion_proveedor = $request->direccion_proveedor;
            $proveedor->correo_proveedor = $request->correo_proveedor;
            $proveedor->estado_proveedor = $request->estado_proveedor;

            $proveedor->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Proveedor actualizado correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar proveedor',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Cambiar estado Proveedor ════════════╗
        ╚═════════════════════════════════════════════════╝ */

    public function CambiarEstadoProveedor($id)
    {
        try {

            $proveedor = Proveedor::find($id);

            if (! $proveedor) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Proveedor no encontrado',
                ], 404);
            }

            $proveedor->estado_proveedor = ! $proveedor->estado_proveedor;
            $proveedor->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado del proveedor actualizado',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado del proveedor',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Mostrar Proveedor ════════════╗
        ╚══════════════════════════════════════════╝ */

    public function MostrarProveedores()
    {
        try {

            $proveedores = Proveedor::all();

            return response()->json([
                'success' => true,
                'proveedores' => $proveedores,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener proveedores',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }
} // Fin controlador
