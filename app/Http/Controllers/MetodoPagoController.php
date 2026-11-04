<?php

namespace App\Http\Controllers;

use App\Models\MetodoPago;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MetodoPagoController extends Controller
{
    /*  ╔════════════ Crear Método de Pago ═════════════╗
        ╚═══════════════════════════════════════════════╝ */

    public function CrearMetodoPago(Request $request)
    {
        try {
            $validator = Validator::make(
                [
                    'nombre_metodo_pago' => $request->nombre_metodo_pago,
                    'descripcion_metodo_pago' => $request->descripcion_metodo_pago,
                ],
                [
                    'nombre_metodo_pago' => [
                        'required',
                        'unique:metodos_pago,nombre_metodo_pago',
                        'max:100',
                    ],
                    'descripcion_metodo_pago' => [
                        'nullable',
                        'max:150',
                    ],
                ],
                [
                    'nombre_metodo_pago.unique' => 'Ya existe un método de pago con este nombre.',
                    'nombre_metodo_pago.required' => 'El nombre del método de pago es obligatorio.',
                    'nombre_metodo_pago.max' => 'El nombre no puede exceder 100 caracteres.',
                    'descripcion_metodo_pago.max' => 'La descripción no puede exceder 150 caracteres.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            MetodoPago::create([
                'nombre_metodo_pago' => $request->nombre_metodo_pago,
                'descripcion_metodo_pago' => $request->descripcion_metodo_pago,
                'estado_metodo_pago' => true,
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Método de pago creado correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear método de pago',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═════════════ Editar Método de Pago ══════════════╗
        ╚══════════════════════════════════════════════════╝ */

    public function EditarMetodoPago($id)
    {
        try {

            $metodo = MetodoPago::find($id);

            if (! $metodo) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Método de pago no encontrado',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'metodo_pago' => $metodo,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener método de pago',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Actualizar Método de Pago ═══════════╗
        ╚═════════════════════════════════════════════════╝ */

    public function ActualizarMetodoPago(Request $request, $id)
    {
        try {

            $metodo = MetodoPago::find($id);

            if (! $metodo) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Método de pago no encontrado',
                ], 404);
            }

            $validator = Validator::make(
                [
                    'nombre_metodo_pago' => $request->nombre_metodo_pago,
                    'descripcion_metodo_pago' => $request->descripcion_metodo_pago,
                    'estado_metodo_pago' => $request->estado_metodo_pago,
                ],
                [
                    'nombre_metodo_pago' => [
                        'required',
                        "unique:metodos_pago,nombre_metodo_pago,$id,id_metodo_pago",
                        'max:100',
                    ],
                    'descripcion_metodo_pago' => [
                        'nullable',
                        'max:150',
                    ],
                    'estado_metodo_pago' => [
                        'required',
                        'boolean',
                    ],
                ],
                [
                    'nombre_metodo_pago.unique' => 'Ya existe un método de pago con este nombre.',
                    'nombre_metodo_pago.required' => 'El nombre es obligatorio.',
                    'nombre_metodo_pago.max' => 'El nombre no puede exceder 100 caracteres.',
                    'descripcion_metodo_pago.max' => 'La descripción no puede exceder 150 caracteres.',
                    'estado_metodo_pago.boolean' => 'El estado debe ser verdadero o falso.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $metodo->nombre_metodo_pago = $request->nombre_metodo_pago;
            $metodo->descripcion_metodo_pago = $request->descripcion_metodo_pago;
            $metodo->estado_metodo_pago = $request->estado_metodo_pago;
            $metodo->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Método de pago actualizado correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar método de pago',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Cambiar Estado Método de Pago ═════════╗
        ╚═══════════════════════════════════════════════════╝ */

    public function CambiarEstadoMetodoPago($id)
    {
        try {

            $metodo = MetodoPago::find($id);

            if (! $metodo) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Método de pago no encontrado',
                ], 404);
            }

            $metodo->estado_metodo_pago = ! $metodo->estado_metodo_pago;
            $metodo->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado del método de pago actualizado',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado del método de pago',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Mostrar Métodos de Pago ════════════╗
        ╚════════════════════════════════════════════════╝ */

    public function MostrarMetodosPago()
    {
        try {

            $metodos = MetodoPago::all();

            return response()->json([
                'success' => true,
                'metodos_pago' => $metodos,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener métodos de pago',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }
} // Fin de controlador
