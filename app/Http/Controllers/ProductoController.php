<?php

namespace App\Http\Controllers;

use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\VariacionTalla;
use App\Support\DataTableServidor;
use App\Support\ImagenOptimizada;
use App\Support\ImagenWeb;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ProductoController extends Controller
{
    /*  ╔══════════ Crear Producto ═══════════╗
        ╚═════════════════════════════════════╝ */

    public function CrearProducto(Request $request)
    {
        try {

            // 🧹 La medida es OPCIONAL: cuando no se elige, el select manda null y
            // FormData lo transforma en el texto "null" (no en un null real), por
            // eso la regla "exists" lo rechazaba. Aquí lo normalizamos a null.
            $idMedida = $request->input('id_medida');
            if (! is_numeric($idMedida) || (int) $idMedida <= 0) {
                $idMedida = null;
            } else {
                $idMedida = (int) $idMedida;
            }

            // 🧹 Igual con la ubicación: es OPCIONAL y el select vacío también
            // llegaba como el texto "null".
            $idUbicacion = $request->input('id_ubicacion');
            if (! is_numeric($idUbicacion) || (int) $idUbicacion <= 0) {
                $idUbicacion = null;
            } else {
                $idUbicacion = (int) $idUbicacion;
            }

            // 🧹 La marca es OPCIONAL: mismo tratamiento que medida y ubicación.
            $idMarca = $request->input('id_marca');
            if (! is_numeric($idMarca) || (int) $idMarca <= 0) {
                $idMarca = null;
            } else {
                $idMarca = (int) $idMarca;
            }

            $validator = Validator::make(
                [
                    'nombre_producto' => $request->nombre_producto,
                    'descripcion_producto' => $request->descripcion_producto,
                    'imagen_producto' => $request->imagen_producto,
                    'id_categoria' => $request->id_categoria,
                    'id_marca' => $idMarca,
                    'id_impuesto' => $request->id_impuesto,
                    'id_ubicacion' => $idUbicacion,
                    'precio_compra' => $request->precio_compra,
                    'precio_venta' => $request->precio_venta,
                    'stock_actual' => $request->stock_actual,
                    'id_medida' => $idMedida,
                ],
                [
                    'nombre_producto' => 'required|max:150',
                    'descripcion_producto' => 'nullable|string',
                    'imagen_producto' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',

                    'id_categoria' => 'required|exists:categoria,id_categoria',
                    'id_marca' => 'nullable|exists:marcas,id_marca',
                    'id_impuesto' => 'required|exists:impuestos,id_impuesto',
                    'id_ubicacion' => 'nullable|exists:ubicaciones,id_ubicacion',

                    'precio_compra' => 'required|numeric|min:0',
                    'precio_venta' => 'required|numeric|min:0',
                    'stock_actual' => 'nullable|integer|min:0',
                    'id_medida' => 'nullable|exists:medidas,id_medida',
                ],
                [
                    'required' => 'El campo :attribute es obligatorio.',
                    'exists' => 'El :attribute seleccionado no existe.',
                    'numeric' => 'El campo :attribute debe ser numérico.',
                    'integer' => 'El campo :attribute debe ser entero.',
                    'precio_compra.required' => 'El precio de compra es obligatorio.',
                    'precio_venta.required' => 'El precio de venta es obligatorio.',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $ruta = public_path('imagenes/productos');

            if (! File::exists($ruta)) {
                File::makeDirectory($ruta, 0777, true);
            }

            $nombreImagen = null;

            if ($request->hasFile('imagen_producto')) {
                // Redimensiona (máx. 1200px) y comprime en WebP: ~100-300 KB sin verse borrosa.
                $nombreImagen = ImagenOptimizada::guardar(
                    $request->file('imagen_producto'),
                    $ruta,
                    'ImagenProducto'
                );

                ImagenWeb::sincronizar('imagenes/productos/'.$nombreImagen);
            }

            $producto = DB::transaction(function () use ($request, $nombreImagen, $idUbicacion, $idMedida, $idMarca) {

                $producto = Producto::create([
                    'nombre_producto' => $request->nombre_producto,
                    'descripcion_producto' => $request->descripcion_producto,
                    'imagen_producto' => $nombreImagen,
                    'id_categoria' => $request->id_categoria,
                    'id_marca' => $idMarca,
                    'id_impuesto' => $request->id_impuesto,
                    'id_ubicacion' => $idUbicacion,
                    'precio_compra' => $request->precio_compra,
                    'precio_venta' => $request->precio_venta,
                    'stock_actual' => 0,
                    'id_medida' => $idMedida,

                ]);

                $this->sincronizarAtributos($producto, $request->input('atributos'));

                return $producto;
            });

            return response()->json([
                'success' => true,
                'mensaje' => 'Producto creado correctamente',
                'producto' => [
                    'id' => $producto->id_producto,
                    'text' => $producto->nombre_producto,
                ],
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al crear producto: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear producto',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔══════════ Editar Producto ══════════╗
        ╚═════════════════════════════════════╝ */

    /**
     * Datos del producto para los modales de edición y de detalles.
     *
     * Se resuelve con 3 consultas en vez de 11 cargas Eloquent: cada consulta
     * a Supabase cuesta ~100-150 ms y el modal abría con más de 1 s de espera.
     */
    public function EditarProducto(int|string $id)
    {
        try {

            /* ═════════ 1) Producto + catálogos (una sola consulta) ═════════ */

            $fila = DB::table('productos as p')
                ->leftJoin('categoria as c', 'c.id_categoria', '=', 'p.id_categoria')
                ->leftJoin('marcas as m', 'm.id_marca', '=', 'p.id_marca')
                ->leftJoin('ubicaciones as u', 'u.id_ubicacion', '=', 'p.id_ubicacion')
                ->leftJoin('impuestos as im', 'im.id_impuesto', '=', 'p.id_impuesto')
                ->leftJoin('medidas as md', 'md.id_medida', '=', 'p.id_medida')
                ->where('p.id_producto', $id)
                ->first([
                    'p.id_producto',
                    'p.nombre_producto',
                    'p.descripcion_producto',
                    'p.id_categoria',
                    'p.id_marca',
                    'p.id_medida',
                    'p.id_impuesto',
                    'p.id_ubicacion',
                    'p.imagen_producto',
                    'p.precio_compra',
                    'p.precio_venta',
                    'p.stock_actual',
                    'p.estado_producto',
                    'p.fecha_creacion_producto',

                    'c.nombre_categoria',
                    'c.descripcion_categoria',
                    'c.estado_categoria',
                    'c.fecha_creacion_categoria',
                    'c.id_tipo_talla',

                    'm.nombre_marca',
                    'm.slug_marca',
                    'm.logo_marca',
                    'm.estado_marca',
                    'm.fecha_creacion_marca',

                    'u.nombre_ubicacion',
                    'u.descripcion_ubicacion',
                    'u.estado_ubicacion',

                    'im.nombre_impuesto',
                    'im.porcentaje_impuesto',
                    'im.estado_impuesto',
                    'im.fecha_creacion_impuesto',

                    'md.nombre_medida',
                    'md.abreviatura_medida',
                    'md.orden_medida',
                    'md.id_tipo_medida',
                    'md.estado_medida',
                    'md.fecha_creacion_medida',
                ]);

            if (! $fila) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Producto no encontrado',
                ], 404);
            }

            $precioVenta = (float) $fila->precio_venta;
            $precioCompra = (float) $fila->precio_compra;
            $porcentajeImpuesto = (float) ($fila->porcentaje_impuesto ?? 0);

            /* ═════════ 2) Atributos del producto ═════════ */

            $atributos = DB::table('producto_atributos as pa')
                ->leftJoin('atributo_valores as v', 'v.id_valor', '=', 'pa.id_valor')
                ->where('pa.id_producto', $id)
                ->orderBy('pa.id_producto_atributo')
                ->get([
                    'pa.id_producto_atributo',
                    'pa.id_producto',
                    'pa.id_atributo',
                    'pa.id_valor',
                    'v.id_valor as valor_id_valor',
                    'v.id_atributo as valor_id_atributo',
                    'v.valor_atributo',
                    'v.orden_valor',
                    'v.estado_valor',
                ])
                ->map(function ($atributo) {
                    return [
                        'id_producto_atributo' => $atributo->id_producto_atributo,
                        'id_producto' => $atributo->id_producto,
                        'id_atributo' => $atributo->id_atributo,
                        'id_valor' => $atributo->id_valor,
                        'valor' => $atributo->valor_id_valor === null ? null : [
                            'id_valor' => $atributo->valor_id_valor,
                            'id_atributo' => $atributo->valor_id_atributo,
                            'valor_atributo' => $atributo->valor_atributo,
                            'orden_valor' => $atributo->orden_valor,
                            'estado_valor' => $atributo->estado_valor,
                        ],
                    ];
                })
                ->values();

            /* ═════════ 3) Variaciones con sus tallas ═════════ */

            $variaciones = [];

            $filasVariaciones = DB::table('producto_variaciones as v')
                ->leftJoin('variacion_tallas as vt', 'vt.id_variacion', '=', 'v.id_variacion')
                ->leftJoin('tallas as t', 't.id_talla', '=', 'vt.id_talla')
                ->where('v.id_producto', $id)
                ->orderBy('v.id_variacion')
                ->orderBy('vt.id_variacion_talla')
                ->get([
                    'v.id_variacion',
                    'v.id_producto',
                    'v.color',
                    'v.estado_variacion',

                    'vt.id_variacion_talla',
                    'vt.id_talla',
                    'vt.stock',
                    'vt.sku',
                    'vt.precio_compra as talla_precio_compra',
                    'vt.precio_venta as talla_precio_venta',

                    't.talla',
                    't.estado_talla',
                    't.id_tipo_talla',
                    't.orden_talla',
                ]);

            foreach ($filasVariaciones as $filaVariacion) {

                $idVariacion = (int) $filaVariacion->id_variacion;

                if (! isset($variaciones[$idVariacion])) {
                    $variaciones[$idVariacion] = [
                        'id_variacion' => $filaVariacion->id_variacion,
                        'id_producto' => $filaVariacion->id_producto,
                        'color' => $filaVariacion->color,
                        'estado_variacion' => $filaVariacion->estado_variacion,
                        'tallas' => [],
                    ];
                }

                // Un color sin tallas (producto sin variantes) llega con el join vacío.
                if ($filaVariacion->id_variacion_talla === null) {
                    continue;
                }

                $variaciones[$idVariacion]['tallas'][] = [
                    'id_variacion_talla' => $filaVariacion->id_variacion_talla,
                    'id_variacion' => $filaVariacion->id_variacion,
                    'id_talla' => $filaVariacion->id_talla,
                    'stock' => $filaVariacion->stock,
                    'sku' => $filaVariacion->sku,
                    'precio_compra' => $filaVariacion->talla_precio_compra,
                    'precio_venta' => $filaVariacion->talla_precio_venta,
                    'talla' => $filaVariacion->id_talla === null ? null : [
                        'id_talla' => $filaVariacion->id_talla,
                        'talla' => $filaVariacion->talla,
                        'estado_talla' => $filaVariacion->estado_talla,
                        'id_tipo_talla' => $filaVariacion->id_tipo_talla,
                        'orden_talla' => $filaVariacion->orden_talla,
                    ],
                ];
            }

            /* ═════════ Respuesta con la misma forma que consumía la vista ═════════ */

            $producto = [
                'id_producto' => $fila->id_producto,
                'nombre_producto' => $fila->nombre_producto,
                'descripcion_producto' => $fila->descripcion_producto,
                'id_categoria' => $fila->id_categoria,
                'id_impuesto' => $fila->id_impuesto,
                'id_ubicacion' => $fila->id_ubicacion,
                'id_medida' => $fila->id_medida,
                'imagen_producto' => $fila->imagen_producto,
                'precio_compra' => $fila->precio_compra,
                'precio_venta' => $fila->precio_venta,
                'stock_actual' => $fila->stock_actual,
                'estado_producto' => $fila->estado_producto,
                'fecha_creacion_producto' => $fila->fecha_creacion_producto,
                'id_marca' => $fila->id_marca,

                'ganancia' => $precioVenta - $precioCompra,
                'porcentaje_ganancia' => $precioCompra <= 0 ? 0 : round((($precioVenta - $precioCompra) / $precioCompra) * 100, 2),
                'precio_venta_final' => round($precioVenta * (1 + ($porcentajeImpuesto / 100)), 2),
                'medida_nombre' => $fila->nombre_medida,

                'categoria' => $fila->id_categoria === null ? null : [
                    'id_categoria' => $fila->id_categoria,
                    'nombre_categoria' => $fila->nombre_categoria,
                    'descripcion_categoria' => $fila->descripcion_categoria,
                    'estado_categoria' => $fila->estado_categoria,
                    'fecha_creacion_categoria' => $fila->fecha_creacion_categoria,
                    'id_tipo_talla' => $fila->id_tipo_talla,
                ],

                'marca' => $fila->id_marca === null ? null : [
                    'id_marca' => $fila->id_marca,
                    'nombre_marca' => $fila->nombre_marca,
                    'slug_marca' => $fila->slug_marca,
                    'logo_marca' => $fila->logo_marca,
                    'estado_marca' => $fila->estado_marca,
                    'fecha_creacion_marca' => $fila->fecha_creacion_marca,
                ],

                'ubicacion' => $fila->id_ubicacion === null ? null : [
                    'id_ubicacion' => $fila->id_ubicacion,
                    'nombre_ubicacion' => $fila->nombre_ubicacion,
                    'descripcion_ubicacion' => $fila->descripcion_ubicacion,
                    'estado_ubicacion' => $fila->estado_ubicacion,
                ],

                'impuesto' => $fila->id_impuesto === null ? null : [
                    'id_impuesto' => $fila->id_impuesto,
                    'nombre_impuesto' => $fila->nombre_impuesto,
                    'porcentaje_impuesto' => $fila->porcentaje_impuesto,
                    'estado_impuesto' => $fila->estado_impuesto,
                    'fecha_creacion_impuesto' => $fila->fecha_creacion_impuesto,
                ],

                'medida' => $fila->id_medida === null ? null : [
                    'id_medida' => $fila->id_medida,
                    'nombre_medida' => $fila->nombre_medida,
                    'abreviatura_medida' => $fila->abreviatura_medida,
                    'orden_medida' => $fila->orden_medida,
                    'id_tipo_medida' => $fila->id_tipo_medida,
                    'estado_medida' => $fila->estado_medida,
                    'fecha_creacion_medida' => $fila->fecha_creacion_medida,
                ],

                'atributos' => $atributos,
                'variaciones' => array_values($variaciones),
            ];

            return response()->json([
                'success' => true,
                'producto' => $producto,
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al obtener producto: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener producto',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔════════ Actualizar Producto ════════╗
        ╚═════════════════════════════════════╝ */

    public function ActualizarProducto(Request $request, int|string $id)
    {
        DB::beginTransaction();

        try {

            $producto = Producto::with('variaciones.tallas')->lockForUpdate()->find($id);

            if (! $producto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Producto no encontrado',
                ], 404);
            }

            // STOCK ANTERIOR
            $stockAnterior = (int) $producto->stock_actual;

            // 🧹 La medida es OPCIONAL: si el select queda vacío el JS manda null y
            // FormData lo convierte en el texto "null", que rompía el UPDATE.
            $idMedida = $request->input('id_medida');
            if (! is_numeric($idMedida) || (int) $idMedida <= 0) {
                $idMedida = null;
            } else {
                $idMedida = (int) $idMedida;
            }

            // 🧹 Igual con la ubicación: es OPCIONAL y el select vacío también
            // llegaba como el texto "null".
            $idUbicacion = $request->input('id_ubicacion');
            if (! is_numeric($idUbicacion) || (int) $idUbicacion <= 0) {
                $idUbicacion = null;
            } else {
                $idUbicacion = (int) $idUbicacion;
            }

            // 🧹 La marca es OPCIONAL: mismo tratamiento que medida y ubicación.
            $idMarca = $request->input('id_marca');
            if (! is_numeric($idMarca) || (int) $idMarca <= 0) {
                $idMarca = null;
            } else {
                $idMarca = (int) $idMarca;
            }

            $validator = Validator::make(
                [
                    'nombre_producto' => $request->nombre_producto,
                    'descripcion_producto' => $request->descripcion_producto,
                    'imagen_producto' => $request->file('imagen_producto'),
                    'id_categoria' => $request->id_categoria,
                    'id_marca' => $idMarca,
                    'id_impuesto' => $request->id_impuesto,
                    'id_ubicacion' => $idUbicacion,
                    'precio_compra' => $request->precio_compra,
                    'precio_venta' => $request->precio_venta,
                    'stock_actual' => $request->stock_actual,
                    // 'id_medida' => $request->id_medida,
                ],
                [
                    'nombre_producto' => 'required|max:150',
                    'descripcion_producto' => 'nullable|string',
                    'imagen_producto' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',

                    'id_categoria' => 'required|exists:categoria,id_categoria',
                    'id_marca' => 'nullable|exists:marcas,id_marca',
                    'id_impuesto' => 'required|exists:impuestos,id_impuesto',
                    'id_ubicacion' => 'nullable|exists:ubicaciones,id_ubicacion',

                    'precio_compra' => 'required|numeric|min:0',
                    'precio_venta' => 'required|numeric|min:0',
                    'stock_actual' => 'nullable|integer|min:0',
                    // 'id_medida' => 'nullable|exists:medidas,id_medida',
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $stockSolicitado = (int) ($request->stock_actual ?? $stockAnterior);
            $diferenciaSolicitada = $stockSolicitado - $stockAnterior;
            $ajustesVariacion = [];
            $variantesAjuste = collect();

            if (
                $diferenciaSolicitada < 0 &&
                $producto->variaciones()->whereHas('tallas')->exists()
            ) {
                $ajustesVariacion = json_decode((string) $request->input('variacion_ajustes'), true);
                $validatorAjustes = Validator::make(
                    ['variacion_ajustes' => $ajustesVariacion],
                    [
                        'variacion_ajustes' => ['required', 'array', 'min:1'],
                        'variacion_ajustes.*.id_variacion_talla' => ['required', 'integer', 'distinct'],
                        'variacion_ajustes.*.cantidad' => ['required', 'integer', 'min:1'],
                    ],
                    [
                        'variacion_ajustes.required' => 'Selecciona las tallas de las unidades retiradas.',
                        'variacion_ajustes.*.id_variacion_talla.required' => 'Cada talla seleccionada debe ser válida.',
                        'variacion_ajustes.*.cantidad.required' => 'Indica cuántas unidades se retiraron de cada talla.',
                        'variacion_ajustes.*.cantidad.min' => 'La cantidad retirada por talla debe ser al menos 1.',
                    ]
                );

                if ($validatorAjustes->fails()) {
                    DB::rollBack();

                    return response()->json([
                        'success' => false,
                        'errors' => $validatorAjustes->errors(),
                    ], 422);
                }

                $ajustesVariacion = $validatorAjustes->validated()['variacion_ajustes'];
                $cantidadRetirada = collect($ajustesVariacion)->sum('cantidad');

                if ($cantidadRetirada !== abs($diferenciaSolicitada)) {
                    DB::rollBack();

                    return response()->json([
                        'success' => false,
                        'mensaje' => 'La cantidad asignada a las tallas debe coincidir con el ajuste total del producto.',
                    ], 422);
                }

                $idsVariacionTalla = collect($ajustesVariacion)
                    ->pluck('id_variacion_talla')
                    ->map(fn ($idVariacionTalla) => (int) $idVariacionTalla)
                    ->all();

                $variantesAjuste = VariacionTalla::with('variacion')
                    ->whereIn('id_variacion_talla', $idsVariacionTalla)
                    ->whereHas('variacion', function ($query) use ($producto) {
                        $query->where('id_producto', $producto->id_producto);
                    })
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id_variacion_talla');

                if ($variantesAjuste->count() !== count($idsVariacionTalla)) {
                    DB::rollBack();

                    return response()->json([
                        'success' => false,
                        'mensaje' => 'Una de las tallas seleccionadas no pertenece a este producto.',
                    ], 422);
                }

                foreach ($ajustesVariacion as $ajuste) {
                    $variacionTalla = $variantesAjuste->get((int) $ajuste['id_variacion_talla']);
                    if ((int) $variacionTalla->stock < (int) $ajuste['cantidad']) {
                        DB::rollBack();

                        return response()->json([
                            'success' => false,
                            'mensaje' => 'La cantidad retirada supera el stock disponible de una talla.',
                        ], 422);
                    }
                }
            }

            /*
            |--------------------------------------------------------------------------
            | IMAGEN
            |--------------------------------------------------------------------------
            */

            if ($request->hasFile('imagen_producto')) {

                $ruta = public_path('imagenes/productos');

                if (! file_exists($ruta)) {
                    mkdir($ruta, 0777, true);
                }

                $imagenAnterior = $producto->imagen_producto;

                // Redimensiona (máx. 1200px) y comprime en WebP: ~100-300 KB sin verse borrosa.
                $nombreImagen = ImagenOptimizada::guardar(
                    $request->file('imagen_producto'),
                    $ruta,
                    'ImagenProducto'
                );

                ImagenWeb::sincronizar('imagenes/productos/'.$nombreImagen);

                if (
                    $imagenAnterior &&
                    $imagenAnterior !== $nombreImagen &&
                    file_exists($ruta.'/'.$imagenAnterior)
                ) {
                    @unlink($ruta.'/'.$imagenAnterior);
                    ImagenWeb::eliminar('imagenes/productos/'.$imagenAnterior);
                }

                $producto->imagen_producto = $nombreImagen;
            }

            /*
            |--------------------------------------------------------------------------
            | DATOS DEL PRODUCTO
            |--------------------------------------------------------------------------
            */

            $producto->nombre_producto = $request->nombre_producto;
            $producto->descripcion_producto = $request->descripcion_producto;
            $producto->id_categoria = $request->id_categoria;
            $producto->id_marca = $idMarca;
            $producto->id_impuesto = $request->id_impuesto;
            $producto->id_ubicacion = $idUbicacion;
            $producto->precio_compra = $request->precio_compra;
            $producto->precio_venta = $request->precio_venta;
            $producto->stock_actual = $request->stock_actual ?? $producto->stock_actual;
            $producto->id_medida = $idMedida;

            $producto->save();

            $this->sincronizarAtributos($producto, $request->input('atributos'));

            /*
            |--------------------------------------------------------------------------
            | MOVIMIENTO DE INVENTARIO
            |--------------------------------------------------------------------------
            */

            $stockNuevo = $producto->stock_actual;

            // Diferencia entre stock anterior y nuevo
            $diferencia = $stockNuevo - $stockAnterior;

            // Solo registrar movimiento si realmente cambió el stock
            if ($diferencia != 0) {
                if ($diferencia < 0 && $ajustesVariacion) {
                    $stockResultante = $stockAnterior;

                    foreach ($ajustesVariacion as $ajuste) {
                        $idVariacionTalla = (int) $ajuste['id_variacion_talla'];
                        $cantidad = (int) $ajuste['cantidad'];
                        $variacionTalla = $variantesAjuste->get($idVariacionTalla);
                        $variacionTalla->stock -= $cantidad;
                        $variacionTalla->save();
                        $stockResultante -= $cantidad;

                        MovimientoInventario::create([
                            'id_producto' => $producto->id_producto,
                            'id_variacion_talla' => $idVariacionTalla,
                            'tipo_movimiento' => 'AJUSTE',
                            'cantidad_movimiento' => $cantidad,
                            'stock_resultante' => $stockResultante,
                            'motivo_movimiento' => $request->motivo_movimiento,
                            'id_referencia' => null,
                            'tipo_referencia' => 'AJUSTE',
                            'precio_unitario' => $producto->precio_compra,
                            'fecha_movimiento' => now(),
                            'id_usuario' => session('usuario.id'),
                        ]);
                    }
                } else {
                    MovimientoInventario::create([
                        'id_producto' => $producto->id_producto,
                        'id_variacion_talla' => null,
                        'tipo_movimiento' => 'AJUSTE',
                        'cantidad_movimiento' => abs($diferencia),
                        'stock_resultante' => $stockNuevo,
                        'motivo_movimiento' => $request->motivo_movimiento,
                        'id_referencia' => null,
                        'tipo_referencia' => 'AJUSTE',
                        'precio_unitario' => $producto->precio_compra,
                        'fecha_movimiento' => now(),
                        'id_usuario' => session('usuario.id'),
                    ]);
                }
            }

            /*
            |--------------------------------------------------------------------------
            | CONFIRMAR TODO
            |--------------------------------------------------------------------------
            */

            DB::commit();

            return response()->json([
                'success' => true,
                'mensaje' => 'Producto actualizado correctamente',
                'stock_anterior' => $stockAnterior,
                'stock_resultante' => $stockNuevo,
                'cantidad_ajuste' => abs($diferencia),
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al actualizar producto: '.$e->getMessage());

            DB::rollBack();

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar producto',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔══════ Cambiar Estado Producto ═════╗
        ╚════════════════════════════════════╝ */

    public function CambiarEstadoProducto(int|string $id)
    {

        try {
            $producto = Producto::find($id);

            if (! $producto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Producto no encontrado',
                ], 404);
            }

            $producto->estado_producto = $producto->estado_producto == 1 ? 0 : 1;
            $producto->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado del producto actualizado',
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al cambiar estado del producto: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado del producto',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═════════ Mostrar Producto ═════════╗
        ╚════════════════════════════════════╝ */

    public function MostrarProductos(Request $request)
    {
        try {

            $consulta = Producto::query()
                ->select([
                    'id_producto',
                    'nombre_producto',
                    'id_categoria',
                    'id_marca',
                    'id_impuesto',
                    'id_ubicacion',
                    'id_medida',
                    'imagen_producto',
                    'precio_compra',
                    'precio_venta',
                    'stock_actual',
                    'estado_producto',
                ])
                ->with([
                    'categoria:id_categoria,nombre_categoria',
                    'marca:id_marca,nombre_marca',
                    'impuesto:id_impuesto,nombre_impuesto,porcentaje_impuesto',
                    'ubicacion:id_ubicacion,nombre_ubicacion',
                    'medida:id_medida,nombre_medida',
                ]);

            // Modo compatible: sin parametros de DataTables devuelve todo (como antes).
            if (! $request->filled('draw')) {

                return response()->json([
                    'success' => true,
                    'productos' => $consulta->orderBy('id_producto')->get(),
                ], 200);

            }

            // Modo servidor: la base solo devuelve la pagina visible.
            return DataTableServidor::responder($request, $consulta, [
                'columnas' => [
                    0 => ['col' => 'id_producto'],
                    2 => ['col' => 'nombre_producto', 'buscar' => true],
                    3 => ['rel' => 'categoria', 'col' => 'nombre_categoria', 'buscar' => true],
                    4 => ['rel' => 'marca', 'col' => 'nombre_marca', 'buscar' => true],
                    5 => ['rel' => 'medida', 'col' => 'nombre_medida', 'buscar' => true],
                    6 => ['col' => 'precio_compra'],
                    7 => ['col' => 'precio_venta'],
                    11 => ['rel' => 'impuesto', 'col' => 'porcentaje_impuesto'],
                    12 => ['col' => 'stock_actual'],
                    13 => ['col' => 'estado_producto'],
                ],
                'orden' => [
                    3 => '(select nombre_categoria from categoria where categoria.id_categoria = productos.id_categoria)',
                    4 => '(select nombre_marca from marcas where marcas.id_marca = productos.id_marca)',
                    5 => '(select nombre_medida from medidas where medidas.id_medida = productos.id_medida)',
                ],
                'ordenDefault' => ['columna' => 'id_producto', 'dir' => 'asc'],
                'extras' => ['opciones' => $this->opcionesFiltrosProductos()],
            ]);

        } catch (\Throwable $e) {

            Log::error('Error al obtener productos: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener productos',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Valores para los filtros de columna (categoria), indexados por columna.
     * Se cachean porque no cambian en cada consulta.
     *
     * @return array<int, array<int, string>>
     */
    private function opcionesFiltrosProductos(): array
    {
        return Cache::remember('productos_opciones_filtros', now()->addMinutes(10), function () {

            return [
                3 => DB::table('categoria')->orderBy('nombre_categoria')->pluck('nombre_categoria')->all(),
                4 => DB::table('marcas')->orderBy('nombre_marca')->pluck('nombre_marca')->all(),
            ];

        });
    }

    /*  ╔══════════ Mostrar Datos ═══════════╗
        ╚════════════════════════════════════╝ */

    public function ObtenerDatosFormularioProducto(Request $request)
    {
        try {

            // 🔎 Validación opcional (por si quieres filtrar activos)
            $validator = Validator::make($request->all(), [
                'solo_activos' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensajes' => $validator->errors(),
                ], 400);
            }

            // 📦 Consultas
            $categorias = \App\Models\Categoria::query();
            $ubicaciones = \App\Models\Ubicacion::query();
            $impuestos = \App\Models\Impuesto::query();
            $medidas = \App\Models\Medida::with('tipomedida');
            $marcas = \App\Models\Marca::query();
            $atributos = \App\Models\Atributo::with(['valores' => function ($query) {
                $query->where('estado_valor', true);
            }]);

            // 🔘 Filtro opcional (estado = 1)
            if ($request->has('solo_activos') && $request->solo_activos) {
                $categorias->where('estado_categoria', 1);
                $ubicaciones->where('estado_ubicacion', 1);
                $impuestos->where('estado_impuesto', 1);
                $medidas->where('estado_medida', 1);
                $marcas->where('estado_marca', 1);
                $atributos->where('estado_atributo', 1);
            }

            // 📊 Ejecutar consultas
            $categorias = $categorias->orderBy('id_categoria', 'asc')->get();
            $ubicaciones = $ubicaciones->orderBy('id_ubicacion', 'asc')->get();
            $impuestos = $impuestos->orderBy('id_impuesto', 'asc')->get();
            $medidas = $medidas->orderBy('orden_medida')->get();
            $marcas = $marcas->orderBy('nombre_marca')->get();
            $atributos = $atributos->orderBy('nombre_atributo')->get();

            // 📤 Respuesta
            return response()->json([
                'success' => true,
                'data' => [
                    'categorias' => $categorias,
                    'ubicaciones' => $ubicaciones,
                    'impuestos' => $impuestos,
                    'medidas' => $medidas,
                    'marcas' => $marcas,
                    'atributos' => $atributos,
                ],
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al obtener datos del formulario de productos: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener datos del formulario de productos',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════ Atributos del Producto ═════╗
        ╚════════════════════════════════════╝ */

    /**
     * Reemplaza los atributos del producto (uno por atributo).
     *
     * Acepta un arreglo o el JSON que envía el formulario por FormData.
     * Si la clave no llega en la petición no se toca nada; si llega vacía se
     * limpian los atributos del producto.
     */
    private function sincronizarAtributos(Producto $producto, mixed $atributos): void
    {
        if ($atributos === null || $atributos === '') {
            return;
        }

        if (is_string($atributos)) {
            $atributos = json_decode($atributos, true);
        }

        if (! is_array($atributos)) {
            return;
        }

        DB::table('producto_atributos')->where('id_producto', $producto->id_producto)->delete();

        $filas = [];

        foreach ($atributos as $atributo) {
            $idAtributo = (int) ($atributo['id_atributo'] ?? 0);
            $idValor = (int) ($atributo['id_valor'] ?? 0);

            if ($idAtributo <= 0 || $idValor <= 0) {
                continue;
            }

            // El valor debe pertenecer al atributo: evita guardar combinaciones inválidas.
            $pertenece = DB::table('atributo_valores')
                ->where('id_valor', $idValor)
                ->where('id_atributo', $idAtributo)
                ->exists();

            if (! $pertenece) {
                continue;
            }

            $filas[$idAtributo] = [
                'id_producto' => $producto->id_producto,
                'id_atributo' => $idAtributo,
                'id_valor' => $idValor,
            ];
        }

        if ($filas) {
            DB::table('producto_atributos')->insert(array_values($filas));
        }
    }
}
