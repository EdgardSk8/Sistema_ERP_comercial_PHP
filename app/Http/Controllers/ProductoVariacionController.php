<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\ProductoVariacion;
use App\Models\Producto;


class ProductoVariacionController extends Controller
{

/*  ╔════════════ Crear Variación Producto ════════════╗
    ╚══════════════════════════════════════════════════╝ */

    public function CrearProductoVariacion(Request $request)
    {
        try {

            $validator = Validator::make(
                [
                    'id_producto' => $request->id_producto,
                    'color' => $request->color,
                ],
                [
                    'id_producto' => [
                        'required',
                        'exists:productos,id_producto'
                    ],
                    'color' => [
                        'required',
                        'max:50'
                    ]
                ],
                [
                    'id_producto.required' => 'El producto es obligatorio.',
                    'id_producto.exists' => 'El producto seleccionado no existe.',
                    'color.required' => 'El color es obligatorio.',
                    'color.max' => 'El color no puede exceder 50 caracteres.'
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            ProductoVariacion::create([
                'id_producto' => $request->id_producto,
                'color' => $request->color,
                'estado_variacion' => true
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Variación creada correctamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear variación',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


/*  ╔═════════════ Editar Variación Producto ═════════════╗
    ╚═════════════════════════════════════════════════════╝ */

    public function EditarProductoVariacion($id)
    {
        try {

            $variacion = ProductoVariacion::find($id);

            if (!$variacion) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Variación no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'variacion' => $variacion
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener variación',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


/*  ╔════════════ Actualizar Variación Producto ═══════════╗
    ╚══════════════════════════════════════════════════════╝ */

    public function ActualizarProductoVariacion(Request $request, $id)
    {
        try {

            $variacion = ProductoVariacion::find($id);

            if (!$variacion) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Variación no encontrada'
                ], 404);
            }

            $validator = Validator::make(
                [
                    'color' => $request->color,
                    'estado_variacion' => $request->estado_variacion
                ],
                [
                    'color' => [
                        'required',
                        'max:50'
                    ],
                    'estado_variacion' => [
                        'required',
                        'boolean'
                    ]
                ],
                [
                    'color.required' => 'El color es obligatorio.',
                    'color.max' => 'El color no puede exceder 50 caracteres.',
                    'estado_variacion.boolean' => 'El estado debe ser verdadero o falso.'
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $variacion->color = $request->color;
            $variacion->estado_variacion = $request->estado_variacion;
            $variacion->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Variación actualizada correctamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar variación',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


/*  ╔════════════ Cambiar Estado Variación ════════════╗
    ╚══════════════════════════════════════════════════╝ */

    public function CambiarEstadoProductoVariacion($id)
    {
        try {

            $variacion = ProductoVariacion::find($id);

            if (!$variacion) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Variación no encontrada'
                ], 404);
            }

            $variacion->estado_variacion = !$variacion->estado_variacion;
            $variacion->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado de la variación actualizado'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado de la variación',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function EliminarProductoVariacion($id)
    {
        try {
            $variacion = ProductoVariacion::find($id);

            if (!$variacion) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Variación no encontrada'
                ], 404);
            }

            $variacion->delete();

            return response()->json([
                'success' => true,
                'mensaje' => 'Variación eliminada correctamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al eliminar la variación',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


/*  ╔════════════ Mostrar Variaciones ════════════╗
    ╚═════════════════════════════════════════════╝ */

    public function MostrarProductoVariacion()
    {
        try {

            $variaciones = ProductoVariacion::with('producto')->get();

            return response()->json([
                'success' => true,
                'variaciones' => $variaciones
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener variaciones',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function MostrarProductosSelect()
    {
        try {

            $productos = Producto::select('id_producto', 'nombre_producto')
                ->where('estado_producto', 1)
                ->orderBy('nombre_producto')
                ->get();

            return response()->json([
                'success' => true,
                'productos' => $productos
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener productos',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

} // Fin de controlador
