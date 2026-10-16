<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use App\Models\Producto;
use Intervention\Image\Facades\Image;
use App\Models\MovimientoInventario;
use App\Models\VariacionTalla;
use Illuminate\Support\Facades\DB;


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

            $validator = Validator::make(
                [
                    'nombre_producto' => $request->nombre_producto,
                    'descripcion_producto' => $request->descripcion_producto,
                    'imagen_producto' => $request->imagen_producto,
                    'id_categoria' => $request->id_categoria,
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
                    'id_impuesto' => 'required|exists:impuestos,id_impuesto',
                    'id_ubicacion' => 'nullable|exists:ubicaciones,id_ubicacion',

                    'precio_compra' => 'nullable|numeric|min:0',
                    'precio_venta' => 'nullable|numeric|min:0',
                    'stock_actual' => 'nullable|integer|min:0',
                    'id_medida' => 'nullable|exists:medidas,id_medida',
                ],
                [
                    'required' => 'El campo :attribute es obligatorio.',
                    'exists' => 'El :attribute seleccionado no existe.',
                    'numeric' => 'El campo :attribute debe ser numérico.',
                    'integer' => 'El campo :attribute debe ser entero.'
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

        $ruta = public_path('imagenes/productos');

        if (!File::exists($ruta)) { File::makeDirectory($ruta, 0777, true); }

        $nombreImagen = null;

        if ($request->hasFile('imagen_producto')) {

            if (!file_exists($ruta)) { mkdir($ruta, 0777, true); }
            $archivo = $request->file('imagen_producto');
            $contador = 1;

            do {
                $nombreImagen = 'ImagenProducto' . $contador . '.png';
                //$rutaCompleta = public_path($ruta . '/' . $nombreImagen);
                $rutaCompleta = $ruta . '/' . $nombreImagen;
                $contador++;

            } while (file_exists($rutaCompleta));

            $imagen = Image::make($archivo)->encode('png', 100);
            $imagen->save($rutaCompleta);
        }

        $producto = Producto::create([
            'nombre_producto' => $request->nombre_producto,
            'descripcion_producto' => $request->descripcion_producto,
            'imagen_producto' => $nombreImagen,
            'id_categoria' => $request->id_categoria,
            'id_impuesto' => $request->id_impuesto,
            'id_ubicacion' => $idUbicacion,
            'precio_compra' => $request->precio_compra,
            'precio_venta' => $request->precio_venta,
            'stock_actual' => 0,
            'id_medida' => $idMedida,
            
        ]);

        return response()->json([
            'success' => true,
            'mensaje' => 'Producto creado correctamente',
            'producto' => [
                'id' => $producto->id_producto,
                'text' => $producto->nombre_producto
            ]
        ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al crear producto: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear producto',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

/*  ╔══════════ Editar Producto ══════════╗ 
    ╚═════════════════════════════════════╝ */

    public function EditarProducto(int|string $id)
    {
        try {
            $producto = Producto::with([
                'categoria',
                'ubicacion',
                'impuesto',
                'medida',
                'variaciones.tallas.talla'
            ])->find($id);

            if (!$producto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Producto no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'producto' => $producto
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al obtener producto: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener producto',
                'detalle' => $e->getMessage()
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

            if (!$producto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Producto no encontrado'
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

            $validator = Validator::make(
                [
                    'nombre_producto' => $request->nombre_producto,
                    'descripcion_producto' => $request->descripcion_producto,
                    'imagen_producto' => $request->file('imagen_producto'),
                    'id_categoria' => $request->id_categoria,
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
                    'errors' => $validator->errors()
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
                        'variacion_ajustes.*.cantidad' => ['required', 'integer', 'min:1']
                    ],
                    [
                        'variacion_ajustes.required' => 'Selecciona las tallas de las unidades retiradas.',
                        'variacion_ajustes.*.id_variacion_talla.required' => 'Cada talla seleccionada debe ser válida.',
                        'variacion_ajustes.*.cantidad.required' => 'Indica cuántas unidades se retiraron de cada talla.',
                        'variacion_ajustes.*.cantidad.min' => 'La cantidad retirada por talla debe ser al menos 1.'
                    ]
                );

                if ($validatorAjustes->fails()) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'errors' => $validatorAjustes->errors()
                    ], 422);
                }

                $ajustesVariacion = $validatorAjustes->validated()['variacion_ajustes'];
                $cantidadRetirada = collect($ajustesVariacion)->sum('cantidad');

                if ($cantidadRetirada !== abs($diferenciaSolicitada)) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'mensaje' => 'La cantidad asignada a las tallas debe coincidir con el ajuste total del producto.'
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
                        'mensaje' => 'Una de las tallas seleccionadas no pertenece a este producto.'
                    ], 422);
                }

                foreach ($ajustesVariacion as $ajuste) {
                    $variacionTalla = $variantesAjuste->get((int) $ajuste['id_variacion_talla']);
                    if ((int) $variacionTalla->stock < (int) $ajuste['cantidad']) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'mensaje' => 'La cantidad retirada supera el stock disponible de una talla.'
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

                $ruta = public_path('Imagenes/Productos');

                if (!file_exists($ruta)) {
                    mkdir($ruta, 0777, true);
                }

                if (
                    $producto->imagen_producto &&
                    file_exists($ruta . '/' . $producto->imagen_producto)
                ) {
                    unlink($ruta . '/' . $producto->imagen_producto);
                }

                $archivo = $request->file('imagen_producto');

                $contador = 1;

                do {

                    $nombreImagen = 'ImagenProducto' . $contador . '.png';
                    $rutaCompleta = $ruta . '/' . $nombreImagen;

                    $contador++;

                } while (file_exists($rutaCompleta));

                $imagen = Image::make($archivo)->encode('png', 100);

                $imagen->save($rutaCompleta);

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
            $producto->id_impuesto = $request->id_impuesto;
            $producto->id_ubicacion = $idUbicacion;
            $producto->precio_compra = $request->precio_compra;
            $producto->precio_venta = $request->precio_venta;
            $producto->stock_actual = $request->stock_actual ?? $producto->stock_actual;
            $producto->id_medida = $idMedida;

            $producto->save();


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
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

/*  ╔══════ Cambiar Estado Producto ═════╗ 
    ╚════════════════════════════════════╝ */

    public function CambiarEstadoProducto(int|string $id) {

        try {
            $producto = Producto::find($id);

            if (!$producto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Producto no encontrado'
                ], 404);
            }

            $producto->estado_producto = $producto->estado_producto == 1 ? 0 : 1;
            $producto->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Estado del producto actualizado'
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al cambiar estado del producto: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado del producto',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

/*  ╔═════════ Mostrar Producto ═════════╗ 
    ╚════════════════════════════════════╝ */

    public function MostrarProductos()
    {
        try {

            $productos = Producto::query()
                ->select([
                    'id_producto',
                    'nombre_producto',
                    'id_categoria',
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
                    'impuesto:id_impuesto,nombre_impuesto,porcentaje_impuesto',
                    'ubicacion:id_ubicacion,nombre_ubicacion',
                    'medida:id_medida,nombre_medida',
                ])
                ->get();

            return response()->json([
                'success' => true,
                'productos' => $productos
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al obtener productos: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener productos',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

/*  ╔══════════ Mostrar Datos ═══════════╗ 
    ╚════════════════════════════════════╝ */

    public function ObtenerDatosFormularioProducto(Request $request)
    {
        try {

            // 🔎 Validación opcional (por si quieres filtrar activos)
            $validator = Validator::make($request->all(), [
                'solo_activos' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensajes' => $validator->errors()
                ], 400);
            }

            // 📦 Consultas
            $categorias = \App\Models\Categoria::query();
            $ubicaciones = \App\Models\Ubicacion::query();
            $impuestos = \App\Models\Impuesto::query();
            $medidas = \App\Models\Medida::with('tipomedida');

            // 🔘 Filtro opcional (estado = 1)
            if ($request->has('solo_activos') && $request->solo_activos) {
                $categorias->where('estado_categoria', 1);
                $ubicaciones->where('estado_ubicacion', 1);
                $impuestos->where('estado_impuesto', 1);
                $medidas->where('estado_medida', 1);
            }

            // 📊 Ejecutar consultas
            $categorias = $categorias->orderBy('id_categoria', 'asc')->get();
            $ubicaciones = $ubicaciones->orderBy('id_ubicacion', 'asc')->get();
            $impuestos = $impuestos->orderBy('id_impuesto', 'asc')->get();
            $medidas = $medidas->orderBy('orden_medida')->get();

            // 📤 Respuesta
            return response()->json([
                'success' => true,
                'data' => [
                    'categorias' => $categorias,
                    'ubicaciones' => $ubicaciones,
                    'impuestos' => $impuestos,
                    'medidas' => $medidas
                ]
            ], 200);

        } catch (\Throwable $e) {

            Log::error('Error al obtener datos del formulario de productos: '.$e->getMessage());

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener datos del formulario de productos',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

}
