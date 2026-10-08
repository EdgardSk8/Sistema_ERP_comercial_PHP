<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;
use App\Models\Producto;
use Intervention\Image\Facades\Image;
use App\Models\MovimientoInventario;
use Illuminate\Support\Facades\DB;


class ProductoController extends Controller
{

/*  ╔══════════ Crear Producto ═══════════╗ 
    ╚═════════════════════════════════════╝ */

    public function CrearProducto(Request $request)
    {
        try {
            $validator = Validator::make(
                [
                    'nombre_producto' => $request->nombre_producto,
                    'descripcion_producto' => $request->descripcion_producto,
                    'imagen_producto' => $request->imagen_producto,
                    'id_categoria' => $request->id_categoria,
                    'id_impuesto' => $request->id_impuesto,
                    'id_ubicacion' => $request->id_ubicacion,
                    'precio_compra' => $request->precio_compra,
                    'precio_venta' => $request->precio_venta,
                    'stock_actual' => $request->stock_actual,
                    'id_medida' => $request->id_medida,
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
                    'id_medida' => 'required|exists:medidas,id_medida',
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
            'id_ubicacion' => $request->id_ubicacion,
            'precio_compra' => $request->precio_compra,
            'precio_venta' => $request->precio_venta,
            'stock_actual' => 0,
            'id_medida' => $request->id_medida,
            
        ]);

        return response()->json([
            'success' => true,
            'mensaje' => 'Producto creado correctamente',
            'producto' => [
                'id' => $producto->id_producto,
                'text' => $producto->nombre_producto
            ]
        ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear producto',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

/*  ╔══════════ Editar Producto ══════════╗ 
    ╚═════════════════════════════════════╝ */

    public function EditarProducto($id)
    {
        try {
            $producto = Producto::find($id);

        $producto = Producto::with([
            'categoria',
            'ubicacion',
            'impuesto',
            'medida'
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

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener producto',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

/*  ╔════════ Actualizar Producto ════════╗ 
    ╚═════════════════════════════════════╝ */

    public function ActualizarProducto(Request $request, $id)
    {
        DB::beginTransaction();

        try {

            $producto = Producto::find($id);

            if (!$producto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Producto no encontrado'
                ], 404);
            }

            // STOCK ANTERIOR
            $stockAnterior = $producto->stock_actual;

            $validator = Validator::make(
                [
                    'nombre_producto' => $request->nombre_producto,
                    'descripcion_producto' => $request->descripcion_producto,
                    'imagen_producto' => $request->file('imagen_producto'),
                    'id_categoria' => $request->id_categoria,
                    'id_impuesto' => $request->id_impuesto,
                    'id_ubicacion' => $request->id_ubicacion,
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
            $producto->id_ubicacion = $request->id_ubicacion;
            $producto->precio_compra = $request->precio_compra;
            $producto->precio_venta = $request->precio_venta;
            $producto->stock_actual = $request->stock_actual ?? $producto->stock_actual;
            $producto->id_medida = $request->id_medida;

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

                MovimientoInventario::create([
                    'id_producto' => $producto->id_producto,
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


        } catch (\Exception $e) {

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

    public function CambiarEstadoProducto($id) {

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

        } catch (\Exception $e) {
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

            $productos = Producto::with(['categoria', 'impuesto', 'ubicacion', 'medida'])->get();

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

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener datos del formulario de productos',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

}
