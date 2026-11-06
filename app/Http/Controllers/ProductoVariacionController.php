<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\ProductoVariacion;
use App\Models\VariacionImagen;
use App\Support\CacheVariaciones;
use App\Support\ImagenWeb;
use App\Support\SkuVariacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

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
                        'exists:productos,id_producto',
                    ],
                    'color' => [
                        'required',
                        'max:50',
                        Rule::unique('producto_variaciones', 'color')->where('id_producto', $request->id_producto),
                    ],
                ],
                [
                    'id_producto.required' => 'El producto es obligatorio.',
                    'id_producto.exists' => 'El producto seleccionado no existe.',
                    'color.required' => 'El color es obligatorio.',
                    'color.max' => 'El color no puede exceder 50 caracteres.',
                    'color.unique' => 'Ese color ya existe en este producto.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            ProductoVariacion::create([
                'id_producto' => $request->id_producto,
                'color' => $request->color,
                'estado_variacion' => true,
            ]);

            CacheVariaciones::olvidarDetalle();

            return response()->json([
                'success' => true,
                'mensaje' => 'Variación creada correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear variación',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═════════════ Editar Variación Producto ═════════════╗
        ╚═════════════════════════════════════════════════════╝ */

    public function EditarProductoVariacion($id)
    {
        try {

            $variacion = ProductoVariacion::find($id);

            if (! $variacion) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Variación no encontrada',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'variacion' => $variacion,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener variación',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔════════════ Actualizar Variación Producto ═══════════╗
        ╚══════════════════════════════════════════════════════╝ */

    public function ActualizarProductoVariacion(Request $request, $id)
    {
        try {

            $variacion = ProductoVariacion::find($id);

            if (! $variacion) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Variación no encontrada',
                ], 404);
            }

            $validator = Validator::make(
                [
                    'color' => $request->color,
                    'estado_variacion' => $request->estado_variacion,
                ],
                [
                    'color' => [
                        'required',
                        'max:50',
                        Rule::unique('producto_variaciones', 'color')
                            ->where('id_producto', $variacion->id_producto)
                            ->ignore($variacion->id_variacion, 'id_variacion'),
                    ],
                    'estado_variacion' => [
                        'required',
                        'boolean',
                    ],
                ],
                [
                    'color.required' => 'El color es obligatorio.',
                    'color.max' => 'El color no puede exceder 50 caracteres.',
                    'color.unique' => 'Ese color ya existe en este producto.',
                    'estado_variacion.boolean' => 'El estado debe ser verdadero o falso.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $colorAnterior = (string) $variacion->color;

            $variacion->color = $request->color;
            $variacion->estado_variacion = $request->estado_variacion;
            $variacion->save();

            CacheVariaciones::olvidarDetalle();

            // El SKU se arma con el color: si cambia, se renombran los autogenerados.
            if (strcasecmp(trim($colorAnterior), trim($variacion->color)) !== 0) {
                SkuVariacion::regenerarPorCambioColor($variacion, $colorAnterior);
            }

            return response()->json([
                'success' => true,
                'mensaje' => 'Variación actualizada correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar variación',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔════════════ Cambiar Estado Variación ════════════╗
        ╚══════════════════════════════════════════════════╝ */

    public function CambiarEstadoProductoVariacion($id)
    {
        try {

            $variacion = ProductoVariacion::find($id);

            if (! $variacion) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Variación no encontrada',
                ], 404);
            }

            $variacion->estado_variacion = ! $variacion->estado_variacion;
            $variacion->save();

            CacheVariaciones::olvidarDetalle();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado de la variación actualizado',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado de la variación',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function EliminarProductoVariacion($id)
    {
        try {
            $variacion = ProductoVariacion::find($id);

            if (! $variacion) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Variación no encontrada',
                ], 404);
            }

            // Se guardan para borrar también los archivos de imagen (no solo las filas).
            $imagenes = VariacionImagen::where('id_variacion', $variacion->id_variacion)->get(['id_imagen', 'imagen']);

            $variacion->delete();

            CacheVariaciones::olvidarDetalle();
            $this->eliminarArchivosImagenes($imagenes);

            return response()->json([
                'success' => true,
                'mensaje' => 'Variación eliminada correctamente',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al eliminar la variación',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔════════════ Mostrar Variaciones ════════════╗
        ╚═════════════════════════════════════════════╝ */

    public function MostrarProductoVariacion()
    {
        try {

            $variaciones = ProductoVariacion::with('producto.impuesto')->get();

            return response()->json([
                'success' => true,
                'variaciones' => $variaciones,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener variaciones',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════════ Detalle de Variaciones (una sola petición) ═══════════╗
        ╚═══════════════════════════════════════════════════════════════════╝ */

    /**
     * Devuelve variaciones, imágenes, tallas por variación y el catálogo de
     * tallas en una sola respuesta: la vista antes hacía 4 peticiones seguidas
     * (~2 s en total) porque el servidor las atiende una por una.
     */
    public function MostrarDetalleVariaciones()
    {
        try {

            $datos = Cache::remember(CacheVariaciones::DETALLE, now()->addSeconds(20), function () {

                $variaciones = DB::table('producto_variaciones as v')
                    ->join('productos as p', 'p.id_producto', '=', 'v.id_producto')
                    ->leftJoin('impuestos as i', 'i.id_impuesto', '=', 'p.id_impuesto')
                    ->select([
                        'v.id_variacion',
                        'v.id_producto',
                        'v.color',
                        'v.estado_variacion',
                        'p.nombre_producto',
                        'p.precio_compra',
                        'p.precio_venta',
                        'p.stock_actual',
                        'i.porcentaje_impuesto',
                    ])
                    ->orderBy('p.nombre_producto')
                    ->orderBy('v.id_variacion')
                    ->get()
                    ->map(fn ($fila) => [
                        'id_variacion' => (int) $fila->id_variacion,
                        'id_producto' => (int) $fila->id_producto,
                        'color' => $fila->color,
                        'estado_variacion' => (bool) $fila->estado_variacion,
                        'producto' => [
                            'id_producto' => (int) $fila->id_producto,
                            'nombre_producto' => $fila->nombre_producto,
                            'precio_compra' => $fila->precio_compra,
                            'precio_venta' => $fila->precio_venta,
                            'stock_actual' => (int) $fila->stock_actual,
                            'impuesto' => [
                                'porcentaje_impuesto' => (float) ($fila->porcentaje_impuesto ?? 0),
                            ],
                        ],
                    ])
                    ->values()
                    ->all();

                $imagenes = DB::table('variacion_imagenes')
                    ->select('id_imagen', 'id_variacion', 'imagen', 'orden')
                    ->orderBy('id_variacion')
                    ->orderBy('orden')
                    ->get()
                    ->all();

                $variacionesTallas = DB::table('variacion_tallas')
                    ->select('id_variacion_talla', 'id_variacion', 'id_talla', 'stock', 'sku', 'precio_compra', 'precio_venta')
                    ->orderBy('id_variacion')
                    ->orderBy('id_variacion_talla')
                    ->get()
                    ->all();

                $tallas = Cache::remember(CacheVariaciones::TALLAS, now()->addMinutes(30), function () {

                    return DB::table('tallas as t')
                        ->leftJoin('tipos_talla as tt', 'tt.id_tipo_talla', '=', 't.id_tipo_talla')
                        ->select([
                            't.id_talla',
                            't.talla',
                            't.id_tipo_talla',
                            't.estado_talla',
                            'tt.nombre_tipo_talla',
                            'tt.estado_tipo_talla',
                        ])
                        ->orderBy('t.id_tipo_talla')
                        ->orderBy('t.orden_talla')
                        ->get()
                        ->map(fn ($talla) => [
                            'id_talla' => (int) $talla->id_talla,
                            'talla' => $talla->talla,
                            'id_tipo_talla' => $talla->id_tipo_talla,
                            'estado_talla' => (bool) $talla->estado_talla,
                            'tipo_talla' => [
                                'nombre_tipo_talla' => $talla->nombre_tipo_talla,
                                'estado_tipo_talla' => $talla->estado_tipo_talla,
                            ],
                        ])
                        ->values()
                        ->all();
                });

                return compact('variaciones', 'imagenes', 'variacionesTallas', 'tallas');
            });

            return response()->json([
                'success' => true,
                'variaciones' => $datos['variaciones'],
                'imagenes' => $datos['imagenes'],
                'variaciones_tallas' => $datos['variacionesTallas'],
                'tallas' => $datos['tallas'],
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al obtener el detalle de variaciones: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener el detalle de variaciones',
                'detalle' => $e->getMessage(),
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
                'productos' => $productos,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener productos',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔══════════════ Auxiliares ══════════════════╗
        ╚════════════════════════════════════════════╝ */

    /**
     * Borra del disco las imágenes de una variación eliminada:
     * original del ERP, copia del website y miniatura generada.
     */
    private function eliminarArchivosImagenes(iterable $imagenes): void
    {
        foreach ($imagenes as $imagen) {

            $rutaRelativa = ltrim((string) $imagen->imagen, '/');

            if ($rutaRelativa !== '') {
                $archivo = public_path($rutaRelativa);

                if (is_file($archivo)) {
                    @unlink($archivo);
                }

                ImagenWeb::eliminar($rutaRelativa);
            }

            foreach (['webp', 'jpg'] as $extension) {
                $miniatura = public_path('imagenes/productosvariaciones/miniaturas/'.$imagen->id_imagen.'.'.$extension);

                if (is_file($miniatura)) {
                    @unlink($miniatura);
                }
            }
        }
    }
} // Fin de controlador
