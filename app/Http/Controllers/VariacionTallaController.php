<?php

namespace App\Http\Controllers;

use App\Models\Talla;
use App\Models\VariacionTalla;
use App\Support\CacheVariaciones;
use App\Support\SkuVariacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
                        'exists:producto_variaciones,id_variacion',
                    ],
                    'id_talla' => [
                        'nullable',
                        'exists:tallas,id_talla',
                    ],
                    'stock' => [
                        'required',
                        'integer',
                        'min:0',
                    ],
                    'sku' => ['nullable', 'string', 'max:100', 'unique:variacion_tallas,sku'],
                    'precio_compra' => ['nullable', 'numeric', 'min:0'],
                    'precio_venta' => ['nullable', 'numeric', 'min:0'],
                ],
                [
                    'id_variacion.required' => 'La variación es obligatoria.',
                    'id_variacion.exists' => 'La variación seleccionada no existe.',
                    'id_talla.exists' => 'La talla seleccionada no existe.',
                    'stock.required' => 'El stock es obligatorio.',
                    'stock.integer' => 'El stock debe ser un número entero.',
                    'stock.min' => 'El stock no puede ser negativo.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $variacion = \App\Models\ProductoVariacion::with('producto')->findOrFail($request->id_variacion);
            $idTalla = $request->filled('id_talla') ? (int) $request->id_talla : null;
            $talla = $idTalla ? Talla::findOrFail($idTalla) : null;
            $stockNuevo = (int) $request->stock;

            // Postgres no compara dos NULL en el índice único: se valida aquí.
            $duplicada = VariacionTalla::where('id_variacion', $request->id_variacion)
                ->when($idTalla === null,
                    fn ($query) => $query->whereNull('id_talla'),
                    fn ($query) => $query->where('id_talla', $idTalla))
                ->exists();

            if ($duplicada) {
                return response()->json([
                    'success' => false,
                    'mensaje' => $idTalla === null
                        ? 'Este color ya tiene una fila sin talla. Edita la existente.'
                        : 'Esa talla ya está asignada a este color.',
                ], 422);
            }

            $stockRealProducto = (int) ($variacion->producto->stock_actual ?? 0);
            $stockAsignadoProducto = (int) VariacionTalla::whereHas('variacion', function ($query) use ($variacion) {
                $query->where('id_producto', $variacion->id_producto);
            })->sum('stock');

            if (($stockAsignadoProducto + $stockNuevo) > $stockRealProducto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'El stock de todas las tallas y colores no puede exceder el stock real del producto.',
                ], 422);
            }

            $sku = $request->filled('sku')
                ? strtoupper(trim($request->sku))
                : $this->generarSku($variacion->producto->nombre_producto, $variacion->color, $talla->talla ?? SkuVariacion::TALLA_UNICA);

            $variacionTalla = VariacionTalla::create([
                'id_variacion' => $request->id_variacion,
                'id_talla' => $idTalla,
                'stock' => $stockNuevo,
                'sku' => $sku,
                'precio_compra' => $request->filled('precio_compra') ? $request->precio_compra : $variacion->producto->precio_compra,
                'precio_venta' => $request->filled('precio_venta') ? $request->precio_venta : $variacion->producto->precio_venta,
            ]);

            CacheVariaciones::olvidarDetalle();

            return response()->json([
                'success' => true,
                'mensaje' => 'Talla agregada correctamente',
                'variacion_talla' => $variacionTalla,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al agregar talla',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔══════════════ Editar Talla Variación ═════════════╗
        ╚═══════════════════════════════════════════════════╝ */

    public function EditarVariacionTalla($id)
    {
        try {

            $variacion_talla = VariacionTalla::with(['variacion.producto', 'talla'])->find($id);

            if (! $variacion_talla) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Talla de variación no encontrada',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'variacion_talla' => $variacion_talla,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener talla de variación',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔════════════ Actualizar Talla Variación ═══════════╗
        ╚══════════════════════════════════════════════════╝ */

    public function ActualizarVariacionTalla(Request $request, $id)
    {
        try {

            $variacion_talla = VariacionTalla::find($id);

            if (! $variacion_talla) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Talla de variación no encontrada',
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
                        'nullable',
                        'exists:tallas,id_talla',
                    ],
                    'stock' => [
                        'required',
                        'integer',
                        'min:0',
                    ],
                    'sku' => ['nullable', 'string', 'max:100', 'unique:variacion_tallas,sku,'.$variacion_talla->id_variacion_talla.',id_variacion_talla'],
                    'precio_compra' => ['nullable', 'numeric', 'min:0'],
                    'precio_venta' => ['nullable', 'numeric', 'min:0'],
                ],
                [
                    'id_talla.exists' => 'La talla seleccionada no existe.',
                    'stock.required' => 'El stock es obligatorio.',
                    'stock.integer' => 'El stock debe ser un número entero.',
                    'stock.min' => 'El stock no puede ser negativo.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $variacion_talla->load('variacion.producto', 'talla');
            $tallaAnterior = $variacion_talla->talla;
            $idTalla = $request->filled('id_talla') ? (int) $request->id_talla : null;
            $tallaNueva = $idTalla ? Talla::findOrFail($idTalla) : null;
            $producto = $variacion_talla->variacion->producto;

            // Postgres no compara dos NULL en el índice único: se valida aquí.
            $duplicada = VariacionTalla::where('id_variacion', $variacion_talla->id_variacion)
                ->where('id_variacion_talla', '!=', $variacion_talla->id_variacion_talla)
                ->when($idTalla === null,
                    fn ($query) => $query->whereNull('id_talla'),
                    fn ($query) => $query->where('id_talla', $idTalla))
                ->exists();

            if ($duplicada) {
                return response()->json([
                    'success' => false,
                    'mensaje' => $idTalla === null
                        ? 'Este color ya tiene otra fila sin talla.'
                        : 'Esa talla ya está asignada a este color.',
                ], 422);
            }

            $stockNuevo = (int) $request->stock;
            $stockRealProducto = (int) ($producto->stock_actual ?? 0);
            $stockEnOtrasTallas = (int) VariacionTalla::whereHas('variacion', function ($query) use ($producto) {
                $query->where('id_producto', $producto->id_producto);
            })
                ->where('id_variacion_talla', '!=', $variacion_talla->id_variacion_talla)
                ->sum('stock');

            if (($stockEnOtrasTallas + $stockNuevo) > $stockRealProducto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'El stock de todas las tallas y colores no puede exceder el stock real del producto.',
                ], 422);
            }

            $tallaCambio = (int) $variacion_talla->id_talla !== (int) $idTalla;
            $skuActual = (string) ($variacion_talla->sku ?? '');
            $skuEnviado = $request->input('sku');
            $skuAutogenerado = $this->skuCoincideConGenerado(
                $skuActual,
                $producto->nombre_producto,
                $variacion_talla->variacion->color,
                $tallaAnterior->talla ?? SkuVariacion::TALLA_UNICA
            );

            $variacion_talla->id_talla = $idTalla;
            $variacion_talla->stock = $stockNuevo;
            if ($request->has('sku') && ! $request->filled('sku')) {
                $variacion_talla->sku = $this->generarSku(
                    $producto->nombre_producto,
                    $variacion_talla->variacion->color,
                    $tallaNueva->talla ?? SkuVariacion::TALLA_UNICA,
                    $variacion_talla->id_variacion_talla
                );
            } elseif ($request->filled('sku') && strtoupper(trim($skuEnviado)) !== strtoupper(trim($skuActual))) {
                $variacion_talla->sku = strtoupper(trim($skuEnviado));
            } elseif ($tallaCambio && $skuAutogenerado) {
                $variacion_talla->sku = $this->generarSku(
                    $producto->nombre_producto,
                    $variacion_talla->variacion->color,
                    $tallaNueva->talla ?? SkuVariacion::TALLA_UNICA,
                    $variacion_talla->id_variacion_talla
                );
            }
            if ($request->filled('precio_compra')) {
                $variacion_talla->precio_compra = $request->precio_compra;
            }
            if ($request->filled('precio_venta')) {
                $variacion_talla->precio_venta = $request->precio_venta;
            }
            $variacion_talla->save();

            CacheVariaciones::olvidarDetalle();

            return response()->json([
                'success' => true,
                'mensaje' => 'Talla de variación actualizada correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar talla de variación',
                'detalle' => $e->getMessage(),
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
                'variaciones_tallas' => $variaciones_tallas,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener tallas de variación',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function EliminarVariacionTalla($id)
    {
        try {
            $variacion_talla = VariacionTalla::find($id);

            if (! $variacion_talla) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Talla de variación no encontrada',
                ], 404);
            }

            $variacion_talla->delete();

            CacheVariaciones::olvidarDetalle();

            return response()->json([
                'success' => true,
                'mensaje' => 'Talla quitada de la variación correctamente',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al quitar talla de la variación',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    private function skuCoincideConGenerado(string $sku, string $producto, string $color, string $talla): bool
    {
        return SkuVariacion::coincideConGenerado($sku, $producto, $color, $talla);
    }

    private function generarSku(string $producto, string $color, string $talla, ?int $idExcluir = null): string
    {
        return SkuVariacion::generar($producto, $color, $talla, $idExcluir);
    }
} // Fin de controlador
