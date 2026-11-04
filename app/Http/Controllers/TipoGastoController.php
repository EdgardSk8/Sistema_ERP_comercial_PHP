<?php

namespace App\Http\Controllers;

use App\Models\TipoGasto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TipoGastoController extends Controller
{
    /*  ╔═════════════ Crear Tipo Gasto ══════════════╗
        ╚═════════════════════════════════════════════╝ */

    public function CrearTipoGasto(Request $request)
    {
        try {
            $validator = Validator::make(
                [
                    'nombre_tipo_gasto' => $request->nombre_tipo_gasto,
                    'descripcion_tipo_gasto' => $request->descripcion_tipo_gasto,
                ],
                [
                    'nombre_tipo_gasto' => [
                        'required',
                        'unique:tipo_gasto,nombre_tipo_gasto',
                        'max:100',
                    ],
                    'descripcion_tipo_gasto' => [
                        'nullable',
                        'max:150',
                    ],
                ],
                [
                    'nombre_tipo_gasto.unique' => 'Ya existe un tipo de gasto con este nombre.',
                    'nombre_tipo_gasto.required' => 'El nombre del tipo de gasto es obligatorio.',
                    'nombre_tipo_gasto.max' => 'El nombre no puede exceder 100 caracteres.',
                    'descripcion_tipo_gasto.max' => 'La descripción no puede exceder 150 caracteres.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            TipoGasto::create([
                'nombre_tipo_gasto' => $request->nombre_tipo_gasto,
                'descripcion_tipo_gasto' => $request->descripcion_tipo_gasto,
                'estado_tipo_gasto' => true,
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Tipo de gasto creado correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear tipo de gasto',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═════════════ Editar Tipo Gasto ══════════════╗
        ╚══════════════════════════════════════════════╝ */

    public function EditarTipoGasto($id)
    {
        try {
            $tipo_gasto = TipoGasto::find($id);

            if (! $tipo_gasto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Tipo de gasto no encontrado',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'tipo_gasto' => $tipo_gasto,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener tipo de gasto',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Actualizar Tipo Gasto ═══════════╗
        ╚═════════════════════════════════════════════╝ */

    public function ActualizarTipoGasto(Request $request, $id)
    {
        try {
            $tipo_gasto = TipoGasto::find($id);

            if (! $tipo_gasto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Tipo de gasto no encontrado',
                ], 404);
            }

            $validator = Validator::make(
                [
                    'nombre_tipo_gasto' => $request->nombre_tipo_gasto,
                    'descripcion_tipo_gasto' => $request->descripcion_tipo_gasto,
                    'estado_tipo_gasto' => $request->estado_tipo_gasto,
                ],
                [
                    'nombre_tipo_gasto' => [
                        'required',
                        "unique:tipo_gasto,nombre_tipo_gasto,$id,id_tipo_gasto",
                        'max:100',
                    ],
                    'descripcion_tipo_gasto' => [
                        'nullable',
                        'max:150',
                    ],
                    'estado_tipo_gasto' => [
                        'required',
                        'boolean',
                    ],
                ],
                [
                    'nombre_tipo_gasto.unique' => 'Ya existe un tipo de gasto con este nombre.',
                    'nombre_tipo_gasto.required' => 'El nombre es obligatorio.',
                    'nombre_tipo_gasto.max' => 'El nombre no puede exceder 100 caracteres.',
                    'descripcion_tipo_gasto.max' => 'La descripción no puede exceder 150 caracteres.',
                    'estado_tipo_gasto.boolean' => 'El estado debe ser verdadero o falso.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $tipo_gasto->nombre_tipo_gasto = $request->nombre_tipo_gasto;
            $tipo_gasto->descripcion_tipo_gasto = $request->descripcion_tipo_gasto;
            $tipo_gasto->estado_tipo_gasto = $request->estado_tipo_gasto;
            $tipo_gasto->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Tipo de gasto actualizado correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar tipo de gasto',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Cambiar Estado Tipo Gasto ═════════╗
        ╚═══════════════════════════════════════════════╝ */

    public function CambiarEstadoTipoGasto($id)
    {
        try {
            $tipo_gasto = TipoGasto::find($id);

            if (! $tipo_gasto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Tipo de gasto no encontrado',
                ], 404);
            }

            $tipo_gasto->estado_tipo_gasto = ! $tipo_gasto->estado_tipo_gasto;
            $tipo_gasto->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado del tipo de gasto actualizado',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado del tipo de gasto',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Mostrar Tipo Gasto ════════════╗
        ╚═══════════════════════════════════════════╝ */

    public function MostrarTipoGasto()
    {
        try {

            $tipos_gasto = TipoGasto::all();

            return response()->json([
                'success' => true,
                'tipos_gasto' => $tipos_gasto,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener tipos de gasto',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }
} // Fin de controlador
