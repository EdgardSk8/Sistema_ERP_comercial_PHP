<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\Promocion;
use App\Support\ImagenOptimizada;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class PromocionController extends Controller
{
    public function MostrarPromociones()
    {
        try {
            $promociones = DB::table('promociones as p')
                ->join('productos as pr', 'pr.id_producto', '=', 'p.id_producto')
                ->select('p.*', 'pr.nombre_producto', 'pr.precio_venta', 'pr.imagen_producto')
                ->orderByDesc('p.fecha_inicio_promocion')
                ->orderByDesc('p.id_promocion')
                ->get()
                ->map(function ($promocion) {
                    $promocion->estado_promocion = (bool) $promocion->estado_promocion;
                    $promocion->imagen_promocion_url = $this->urlPromocion($promocion->imagen_promocion);
                    $promocion->imagen_producto_url = $this->urlProducto($promocion->imagen_producto);

                    return $promocion;
                });

            return response()->json([
                'success' => true,
                'promociones' => $promociones,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudieron cargar las promociones.',
            ], 500);
        }
    }

    public function ProductosDisponibles()
    {
        try {
            $productos = Producto::with([
                'variaciones' => fn ($query) => $query
                    ->where('estado_variacion', true)
                    ->with(['imagenes' => fn ($imagenes) => $imagenes->orderBy('orden')]),
            ])
                ->where('estado_producto', true)
                ->orderBy('nombre_producto')
                ->get(['id_producto', 'nombre_producto', 'precio_compra', 'precio_venta', 'imagen_producto'])
                ->map(function ($producto) {
                    $imagenVariacion = $producto->variaciones->first()?->imagenes->first()?->imagen;
                    $producto->imagen_producto_url = $this->urlImagenProductoVariacion(
                        $producto->imagen_producto,
                        $imagenVariacion
                    );

                    return $producto;
                });

            return response()->json([
                'success' => true,
                'productos' => $productos,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudieron cargar los productos.',
            ], 500);
        }
    }

    public function CrearPromocion(Request $request)
    {
        $validator = $this->validar($request, true);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $imagen = $this->guardarImagen($request->file('imagen_promocion'));

            DB::table('promociones')->insert([
                'id_producto' => (int) $request->id_producto,
                'imagen_promocion' => $imagen,
                'tipo_descuento_promocion' => $request->tipo_descuento_promocion ?: null,
                'valor_descuento_promocion' => $request->tipo_descuento_promocion
                    ? (float) ($request->valor_descuento_promocion ?: 0)
                    : null,
                'fecha_inicio_promocion' => $request->fecha_inicio_promocion,
                'fecha_fin_promocion' => $request->fecha_fin_promocion ?: null,
                'estado_promocion' => true,
                'fecha_creacion_promocion' => now(),
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Promoción creada correctamente.',
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo crear la promoción.',
            ], 500);
        }
    }

    public function EditarPromocion($id)
    {
        $promocion = DB::table('promociones as p')
            ->join('productos as pr', 'pr.id_producto', '=', 'p.id_producto')
            ->where('p.id_promocion', $id)
            ->select('p.*', 'pr.nombre_producto', 'pr.precio_venta', 'pr.imagen_producto')
            ->first();

        if (! $promocion) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Promoción no encontrada.',
            ], 404);
        }

        $promocion->estado_promocion = (bool) $promocion->estado_promocion;
        $promocion->imagen_promocion_url = $this->urlPromocion($promocion->imagen_promocion);
        $promocion->imagen_producto_url = $this->urlProducto($promocion->imagen_producto);

        return response()->json([
            'success' => true,
            'promocion' => $promocion,
        ]);
    }

    public function ActualizarPromocion(Request $request, $id)
    {
        $promocion = Promocion::find($id);

        if (! $promocion) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Promoción no encontrada.',
            ], 404);
        }

        $validator = $this->validar($request, false);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $datos = [
                'id_producto' => (int) $request->id_producto,
                'tipo_descuento_promocion' => $request->tipo_descuento_promocion ?: null,
                'valor_descuento_promocion' => $request->tipo_descuento_promocion
                    ? (float) ($request->valor_descuento_promocion ?: 0)
                    : null,
                'fecha_inicio_promocion' => $request->fecha_inicio_promocion,
                'fecha_fin_promocion' => $request->fecha_fin_promocion ?: null,
                'fecha_actualizacion_promocion' => now(),
            ];

            if ($request->hasFile('imagen_promocion')) {
                $imagenAnterior = $promocion->imagen_promocion;
                $datos['imagen_promocion'] = $this->guardarImagen($request->file('imagen_promocion'));

                if ($imagenAnterior) {
                    $ruta = public_path('imagenes/promociones');
                    $archivoAnterior = $ruta.DIRECTORY_SEPARATOR.$imagenAnterior;

                    if (is_file($archivoAnterior)) {
                        @unlink($archivoAnterior);
                    }

                    $rutaWeb = base_path('website-supabase/imagenes/promociones');
                    $archivoWebAnterior = $rutaWeb.DIRECTORY_SEPARATOR.$imagenAnterior;

                    if (is_file($archivoWebAnterior)) {
                        @unlink($archivoWebAnterior);
                    }
                }
            }

            $promocion->update($datos);

            return response()->json([
                'success' => true,
                'mensaje' => 'Promoción actualizada correctamente.',
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo actualizar la promoción.',
            ], 500);
        }
    }

    public function CambiarEstadoPromocion($id)
    {
        $promocion = Promocion::find($id);

        if (! $promocion) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Promoción no encontrada.',
            ], 404);
        }

        try {
            $promocion->estado_promocion = ! $promocion->estado_promocion;
            $promocion->fecha_actualizacion_promocion = now();
            $promocion->save();

            return response()->json([
                'success' => true,
                'mensaje' => $promocion->estado_promocion
                    ? 'Promoción activada.'
                    : 'Promoción desactivada.',
                'estado_promocion' => $promocion->estado_promocion,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo cambiar el estado de la promoción.',
            ], 500);
        }
    }

    private function validar(Request $request, bool $imagenObligatoria)
    {
        $validator = Validator::make($request->all(), [
            'id_producto' => 'required|exists:productos,id_producto',
            'fecha_inicio_promocion' => 'required|date',
            'fecha_fin_promocion' => 'nullable|date|after_or_equal:fecha_inicio_promocion',
            'imagen_promocion' => ($imagenObligatoria ? 'required' : 'nullable').'|image|mimes:jpg,jpeg,png,webp|max:4096',
            'tipo_descuento_promocion' => 'nullable|in:porcentaje,monto,precio',
            'valor_descuento_promocion' => 'nullable|required_with:tipo_descuento_promocion|numeric|min:0',
        ], [
            'required' => 'El campo :attribute es obligatorio.',
            'exists' => 'El :attribute seleccionado no existe.',
            'date' => 'El campo :attribute debe ser una fecha válida.',
            'image' => 'El campo :attribute debe ser una imagen.',
            'mimes' => 'La imagen debe ser JPG, PNG o WebP.',
            'max' => 'La imagen no debe superar los 4 MB.',
            'after_or_equal' => 'La fecha de fin no puede ser anterior a la fecha de inicio.',
            'in' => 'El tipo de descuento no es válido.',
            'numeric' => 'El valor del descuento debe ser numérico.',
            'min' => 'El valor del descuento no puede ser negativo.',
            'required_with' => 'Indica el valor del descuento.',
        ], [
            'id_producto' => 'producto',
            'fecha_inicio_promocion' => 'fecha de inicio',
            'fecha_fin_promocion' => 'fecha de fin',
            'imagen_promocion' => 'imagen',
            'tipo_descuento_promocion' => 'tipo de descuento',
            'valor_descuento_promocion' => 'valor del descuento',
        ]);

        $validator->after(function ($validador) use ($request) {
            if ($request->tipo_descuento_promocion === 'porcentaje'
                && $request->filled('valor_descuento_promocion')
                && (float) $request->valor_descuento_promocion > 100) {
                $validador->errors()->add(
                    'valor_descuento_promocion',
                    'El porcentaje no puede ser mayor a 100.'
                );
            }
        });

        return $validator;
    }

    private function guardarImagen($archivo): string
    {
        $ruta = public_path('imagenes/promociones');

        if (! File::exists($ruta)) {
            File::makeDirectory($ruta, 0777, true);
        }

        $nombre = ImagenOptimizada::guardar($archivo, $ruta, 'Promocion', 600 * 1024);

        // Copia para la tienda estática (website-supabase).
        $rutaWeb = base_path('website-supabase/imagenes/promociones');

        if (! File::exists($rutaWeb)) {
            File::makeDirectory($rutaWeb, 0777, true);
        }

        $origen = $ruta.DIRECTORY_SEPARATOR.$nombre;
        $destino = $rutaWeb.DIRECTORY_SEPARATOR.$nombre;

        if (is_file($origen)) {
            @copy($origen, $destino);
        }

        return $nombre;
    }

    private function urlPromocion(?string $imagen): ?string
    {
        return $imagen ? asset('imagenes/promociones/'.$imagen) : null;
    }

    private function urlProducto(?string $imagen): ?string
    {
        return $imagen ? asset('imagenes/productos/'.$imagen) : null;
    }

    private function urlImagenProductoVariacion(?string $imagenProducto, ?string $imagenVariacion): ?string
    {
        if ($imagenVariacion) {
            $ruta = ltrim(str_replace('\\', '/', $imagenVariacion), '/');

            return asset(
                str_starts_with($ruta, 'imagenes/')
                    ? $ruta
                    : 'imagenes/productosvariaciones/'.$ruta
            );
        }

        return $this->urlProducto($imagenProducto);
    }
}
