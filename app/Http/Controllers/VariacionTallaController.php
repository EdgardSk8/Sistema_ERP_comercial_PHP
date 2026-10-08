<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\VariacionTalla;


class VariacionTallaController extends Controller
{

/*  ╔══════════════ Crear Talla Variación ══════════════╗
    ╚═══════════════════════════════════════════════════╝ */

    public function CrearVariacionTalla(Request $request)
    {
        try {

            $validator = Validator::make(
                [
                    'id_variacion' => $request->id_variacion,
                    'id_talla' => $request->id_talla,
                    'stock' => $request->stock
                ],
                [
                    'id_variacion' => [
                        'required',
                        'exists:producto_variaciones,id_variacion'
                    ],
                    'id_talla' => [
                        'required',
                        'exists:tallas,id_talla'
                    ],
                    'stock' => [
                        'required',
                        'integer',
                        'min:0'
                    ]
                ],
                [
                    'id_variacion.required' => 'La variación es obligatoria.',
                    'id_variacion.exists' => 'La variación seleccionada no existe.',
                    'id_talla.required' => 'La talla es obligatoria.',
                    'id_talla.exists' => 'La talla seleccionada no existe.',
                    'stock.required' => 'El stock es obligatorio.',
                    'stock.integer' => 'El stock debe ser un número entero.',
                    'stock.min' => 'El stock no puede ser negativo.'
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            VariacionTalla::create([
                'id_variacion' => $request->id_variacion,
                'id_talla' => $request->id_talla,
                'stock' => $request->stock
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Talla agregada correctamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al agregar talla',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


/*  ╔══════════════ Editar Talla Variación ═════════════╗
    ╚═══════════════════════════════════════════════════╝ */

    public function EditarVariacionTalla($id)
    {
        try {

            $variacion_talla = VariacionTalla::find($id);

            if (!$variacion_talla) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Talla de variación no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'variacion_talla' => $variacion_talla
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener talla de variación',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


/*  ╔════════════ Actualizar Talla Variación ═══════════╗
    ╚══════════════════════════════════════════════════╝ */

    public function ActualizarVariacionTalla(Request $request, $id)
    {
        try {

            $variacion_talla = VariacionTalla::find($id);

            if (!$variacion_talla) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Talla de variación no encontrada'
                ], 404);
            }

            $validator = Validator::make(
                [
                    'id_talla' => $request->id_talla,
                    'stock' => $request->stock
                ],
                [
                    'id_talla' => [
                        'required',
                        'exists:tallas,id_talla'
                    ],
                    'stock' => [
                        'required',
                        'integer',
                        'min:0'
                    ]
                ],
                [
                    'id_talla.required' => 'La talla es obligatoria.',
                    'id_talla.exists' => 'La talla seleccionada no existe.',
                    'stock.required' => 'El stock es obligatorio.',
                    'stock.integer' => 'El stock debe ser un número entero.',
                    'stock.min' => 'El stock no puede ser negativo.'
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $variacion_talla->id_talla = $request->id_talla;
            $variacion_talla->stock = $request->stock;
            $variacion_talla->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Talla de variación actualizada correctamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar talla de variación',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


/*  ╔════════════ Mostrar Tallas Variación ════════════╗
    ╚══════════════════════════════════════════════════╝ */

    public function MostrarVariacionTalla()
    {
        try {

            $variaciones_tallas = VariacionTalla::all();

            return response()->json([
                'success' => true,
                'variaciones_tallas' => $variaciones_tallas
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener tallas de variación',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function EliminarVariacionTalla($id)
    {
        try {
            $variacion_talla = VariacionTalla::find($id);

            if (!$variacion_talla) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Talla de variación no encontrada'
                ], 404);
            }

            $variacion_talla->delete();

            return response()->json([
                'success' => true,
                'mensaje' => 'Talla quitada de la variación correctamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al quitar talla de la variación',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

} // Fin de controlador
