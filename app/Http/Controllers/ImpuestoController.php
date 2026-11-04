<?php

namespace App\Http\Controllers;

use App\Models\Impuesto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ImpuestoController extends Controller
{
    /*  ╔════════════ Crear Impuesto ═════════════╗
        ╚═════════════════════════════════════════╝ */

    public function CrearImpuesto(Request $request)
    {
        try {

            $validator = Validator::make(
                [
                    'nombre_impuesto' => $request->nombre_impuesto,
                    'porcentaje_impuesto' => $request->porcentaje_impuesto,
                ],
                [
                    'nombre_impuesto' => [
                        'required',
                        'unique:impuestos,nombre_impuesto',
                        'max:100',
                    ],
                    'porcentaje_impuesto' => [
                        'required',
                        'numeric',
                        'between:0,100',
                    ],
                ],
                [
                    'nombre_impuesto.unique' => 'Ya existe un impuesto con este nombre.',
                    'nombre_impuesto.required' => 'El nombre del impuesto es obligatorio.',
                    'nombre_impuesto.max' => 'El nombre del impuesto no puede exceder 100 caracteres.',
                    'porcentaje_impuesto.required' => 'El porcentaje es obligatorio.',
                    'porcentaje_impuesto.numeric' => 'El porcentaje debe ser un número.',
                    'porcentaje_impuesto.between' => 'El porcentaje debe estar entre 0 y 100.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            Impuesto::create([
                'nombre_impuesto' => $request->nombre_impuesto,
                'porcentaje_impuesto' => $request->porcentaje_impuesto,
                'estado_impuesto' => true,
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Impuesto creado correctamente',
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear impuesto',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔════════════ Editar Impuesto ════════════╗
        ╚═════════════════════════════════════════╝ */

    public function EditarImpuesto($id)
    {
        try {

            $impuesto = Impuesto::find($id);

            if (! $impuesto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Impuesto no encontrado',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'impuesto' => $impuesto,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener impuesto',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═════════ Actualizar Impuesto ══════════╗
        ╚════════════════════════════════════════╝ */

    public function ActualizarImpuesto(Request $request, $id)
    {
        try {

            $impuesto = Impuesto::find($id);

            if (! $impuesto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Impuesto no encontrado',
                ], 404);
            }

            $validator = Validator::make(
                [
                    'nombre_impuesto' => $request->nombre_impuesto,
                    'porcentaje_impuesto' => $request->porcentaje_impuesto,
                    'estado_impuesto' => $request->estado_impuesto,
                ],
                [
                    'nombre_impuesto' => [
                        'required',
                        "unique:impuestos,nombre_impuesto,$id,id_impuesto",
                        'max:100',
                    ],
                    'porcentaje_impuesto' => [
                        'required',
                        'numeric',
                        'between:0,100',
                    ],
                    'estado_impuesto' => [
                        'required',
                        'boolean',
                    ],
                ],
                [
                    'nombre_impuesto.unique' => 'Ya existe un impuesto con este nombre.',
                    'nombre_impuesto.required' => 'El nombre del impuesto es obligatorio.',
                    'nombre_impuesto.max' => 'El nombre del impuesto no puede exceder 100 caracteres.',
                    'porcentaje_impuesto.required' => 'El porcentaje es obligatorio.',
                    'porcentaje_impuesto.numeric' => 'El porcentaje debe ser un número.',
                    'porcentaje_impuesto.between' => 'El porcentaje debe estar entre 0 y 100.',
                    'estado_impuesto.boolean' => 'El estado debe ser verdadero o falso.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $impuesto->nombre_impuesto = $request->nombre_impuesto;
            $impuesto->porcentaje_impuesto = $request->porcentaje_impuesto;
            $impuesto->estado_impuesto = $request->estado_impuesto;
            $impuesto->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Impuesto actualizado correctamente',
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar impuesto',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════ Cambiar Estado Impuesto ════════╗
        ╚════════════════════════════════════════╝ */

    public function CambiarEstadoImpuesto($id)
    {
        try {

            $impuesto = Impuesto::find($id);

            if (! $impuesto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Impuesto no encontrado',
                ], 404);
            }

            $impuesto->estado_impuesto = ! $impuesto->estado_impuesto;
            $impuesto->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado del impuesto actualizado',
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado del impuesto',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Mostrar Impuesto ═══════════╗
        ╚════════════════════════════════════════╝ */

    public function MostrarImpuestos()
    {
        try {

            $impuestos = Impuesto::all();

            return response()->json([
                'success' => true,
                'impuestos' => $impuestos,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener impuestos',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }
} // Fin de controlador
