<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Models\VariacionTalla;
use App\Models\Talla;


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
                    'stock' => $request->stock,
                    'sku' => $request->sku,
                    'precio_compra' => $request->precio_compra,
                    'precio_venta' => $request->precio_venta,
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
                    ],
                    'sku' => ['nullable', 'string', 'max:100', 'unique:variacion_tallas,sku'],
                    'precio_compra' => ['nullable', 'numeric', 'min:0'],
                    'precio_venta' => ['nullable', 'numeric', 'min:0']
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

            $variacion = \App\Models\ProductoVariacion::with('producto')->findOrFail($request->id_variacion);
            $talla = Talla::findOrFail($request->id_talla);
            $sku = $request->filled('sku')
                ? strtoupper(trim($request->sku))
                : $this->generarSku($variacion->producto->nombre_producto, $variacion->color, $talla->talla);

            $variacionTalla = VariacionTalla::create([
                'id_variacion' => $request->id_variacion,
                'id_talla' => $request->id_talla,
                'stock' => $request->stock,
                'sku' => $sku,
                'precio_compra' => $request->filled('precio_compra') ? $request->precio_compra : $variacion->producto->precio_compra,
                'precio_venta' => $request->filled('precio_venta') ? $request->precio_venta : $variacion->producto->precio_venta,
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Talla agregada correctamente',
                'variacion_talla' => $variacionTalla
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

            $variacion_talla = VariacionTalla::with(['variacion.producto', 'talla'])->find($id);

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
                    'stock' => $request->stock,
                    'sku' => $request->sku,
                    'precio_compra' => $request->precio_compra,
                    'precio_venta' => $request->precio_venta,
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
                    ],
                    'sku' => ['nullable', 'string', 'max:100', 'unique:variacion_tallas,sku,' . $variacion_talla->id_variacion_talla . ',id_variacion_talla'],
                    'precio_compra' => ['nullable', 'numeric', 'min:0'],
                    'precio_venta' => ['nullable', 'numeric', 'min:0']
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
            if ($request->has('sku')) {
                $variacion_talla->sku = $request->filled('sku')
                    ? strtoupper(trim($request->sku))
                    : ($variacion_talla->sku ?: $this->generarSku(
                        $variacion_talla->variacion->producto->nombre_producto,
                        $variacion_talla->variacion->color,
                        $variacion_talla->talla->talla
                    ));
            }
            if ($request->has('precio_compra')) $variacion_talla->precio_compra = $request->precio_compra;
            if ($request->has('precio_venta')) $variacion_talla->precio_venta = $request->precio_venta;
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

            $variaciones_tallas = VariacionTalla::query()
                ->select(
                    'id_variacion_talla',
                    'id_variacion',
                    'id_talla',
                    'stock',
                    'sku',
                    'precio_compra',
                    'precio_venta'
                )
                ->get();

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

    private function generarSku(string $producto, string $color, string $talla): string
    {
        $base = Str::upper(Str::slug($producto . '-' . $color . '-' . $talla));
        $base = substr($base ?: 'VARIANTE', 0, 85);
        $sku = $base;
        $sufijo = 1;

        while (VariacionTalla::where('sku', $sku)->exists()) {
            $sku = $base . '-' . $sufijo++;
        }

        return $sku;
    }

} // Fin de controlador
