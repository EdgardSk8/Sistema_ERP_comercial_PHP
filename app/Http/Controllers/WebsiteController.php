<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class WebsiteController extends Controller
{
    /*  ╔══════════════ Vistas de la tienda ══════════════╗
        ╚═════════════════════════════════════════════════╝ */

    public function inicio(): BinaryFileResponse
    {
        return response()->file(base_path('website/index.html'), [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'no-cache',
        ]);
    }

    public function productoVista(): BinaryFileResponse
    {
        return response()->file(base_path('website/producto.html'), [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'no-cache',
        ]);
    }

    public function carritoVista(): BinaryFileResponse
    {
        return response()->file(base_path('website/carrito.html'), [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'no-cache',
        ]);
    }

    public function perfilVista(): BinaryFileResponse
    {
        return response()->file(base_path('website/perfil.html'), [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'no-cache',
        ]);
    }

    /** Sirve css, js e imágenes de la carpeta website/. */
    public function archivo(string $archivo): BinaryFileResponse
    {
        $base = realpath(base_path('website'));
        $ruta = realpath($base.DIRECTORY_SEPARATOR.$archivo);

        abort_if(! $ruta || ! str_starts_with($ruta, $base) || ! is_file($ruta), 404);

        // no-cache: el navegador revalida siempre (evita CSS/JS viejo tras editar).
        return response()->file($ruta, [
            'Content-Type' => $this->tipoContenido($ruta),
            'Cache-Control' => 'no-cache',
        ]);
    }

    /** Tipos MIME necesarios: finfo devuelve text/plain para css. */
    private function tipoContenido(string $ruta): string
    {
        $tipos = [
            'css' => 'text/css; charset=UTF-8',
            'js' => 'application/javascript; charset=UTF-8',
            'json' => 'application/json; charset=UTF-8',
            'svg' => 'image/svg+xml',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'ico' => 'image/x-icon',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
        ];

        return $tipos[strtolower(pathinfo($ruta, PATHINFO_EXTENSION))] ?? 'application/octet-stream';
    }

    /*  ╔══════════════ API de la tienda ═════════════════╗
        ╚═════════════════════════════════════════════════╝ */

    public function productos(): JsonResponse
    {
        $productos = $this->consultaProductos()
            ->orderBy('nombre_producto')
            ->get();

        return response()->json([
            'success' => true,
            'productos' => $productos->map(fn (Producto $producto) => $this->resumenProducto($producto))->values(),
        ]);
    }

    public function productoDetalle(int|string $id): JsonResponse
    {
        $producto = $this->consultaProductos()->find($id);

        if (! $producto || ! $producto->estado_producto) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Producto no encontrado.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'producto' => $this->detalleProducto($producto),
        ]);
    }

    /*  ╔══════════════ Helpers ══════════════════════════╗
        ╚═════════════════════════════════════════════════╝ */

    private function consultaProductos()
    {
        return Producto::with([
            'categoria:id_categoria,nombre_categoria',
            'impuesto',
            'variaciones' => fn ($query) => $query->where('estado_variacion', 1),
            'variaciones.imagenes',
            'variaciones.tallas.talla',
        ])->where('estado_producto', 1);
    }

    private function resumenProducto(Producto $producto): array
    {
        $impuesto = (float) ($producto->impuesto->porcentaje_impuesto ?? 0);
        $precioBase = (float) $producto->precio_venta;
        $variaciones = $producto->variaciones;

        $colores = $variaciones
            ->map(fn ($variacion) => [
                'nombre' => $variacion->color ?: 'Único',
                'imagen' => $this->urlVariacionImagen($variacion->imagenes->first()->imagen ?? null)
                    ?: $this->urlImagenProducto($producto),
                'stock' => (int) $variacion->tallas->sum('stock'),
                'tallas' => $variacion->tallas
                    ->map(fn ($variacionTalla) => $variacionTalla->talla->talla ?? 'Única')
                    ->unique()
                    ->values(),
            ])
            ->unique('nombre')
            ->values();

        return [
            'id' => $producto->id_producto,
            'nombre' => $producto->nombre_producto,
            'categoria' => $producto->categoria->nombre_categoria ?? 'General',
            'descripcion' => $producto->descripcion_producto,
            'precio' => round($precioBase * (1 + $impuesto / 100), 2),
            'impuesto' => $impuesto,
            'imagen' => $colores->first()['imagen'] ?? $this->urlImagenProducto($producto),
            'colores' => $colores,
            'stock' => (int) $variaciones->flatMap->tallas->sum('stock'),
        ];
    }

    private function detalleProducto(Producto $producto): array
    {
        $impuesto = (float) ($producto->impuesto->porcentaje_impuesto ?? 0);
        $precioBase = (float) $producto->precio_venta;

        $variaciones = $producto->variaciones->map(function ($variacion) use ($producto, $precioBase, $impuesto) {
            $imagenes = $variacion->imagenes
                ->map(fn ($imagen) => $this->urlVariacionImagen($imagen->imagen))
                ->filter()
                ->values();

            if ($imagenes->isEmpty()) {
                $imagenes = collect([$this->urlImagenProducto($producto)])->filter()->values();
            }

            $tallas = $variacion->tallas
                ->map(function ($variacionTalla) use ($precioBase, $impuesto) {
                    $base = $variacionTalla->precio_venta !== null
                        ? (float) $variacionTalla->precio_venta
                        : $precioBase;

                    return [
                        'id' => $variacionTalla->id_variacion_talla,
                        'nombre' => $variacionTalla->talla->talla ?? 'Única',
                        'stock' => (int) $variacionTalla->stock,
                        'precio' => round($base * (1 + $impuesto / 100), 2),
                    ];
                })
                ->sortBy(fn ($talla) => mb_strlen($talla['nombre']).$talla['nombre'])
                ->values();

            return [
                'id' => $variacion->id_variacion,
                'color' => $variacion->color ?: 'Único',
                'imagenes' => $imagenes,
                'tallas' => $tallas,
            ];
        })->values();

        $primera = $variaciones->first();

        return [
            'id' => $producto->id_producto,
            'nombre' => $producto->nombre_producto,
            'categoria' => $producto->categoria->nombre_categoria ?? 'General',
            'descripcion' => $producto->descripcion_producto,
            'precio' => round($precioBase * (1 + $impuesto / 100), 2),
            'precio_base' => $precioBase,
            'impuesto' => $impuesto,
            'imagen' => $primera['imagenes'][0] ?? $this->urlImagenProducto($producto),
            'variaciones' => $variaciones,
        ];
    }

    private function urlVariacionImagen(?string $ruta): ?string
    {
        if (! $ruta) {
            return null;
        }

        $ruta = ltrim(str_replace('\\', '/', $ruta), '/');

        return str_starts_with($ruta, 'imagenes/')
            ? '/'.$ruta
            : '/imagenes/productosvariaciones/'.$ruta;
    }

    private function urlImagenProducto(Producto $producto): ?string
    {
        if (! $producto->imagen_producto) {
            return null;
        }

        $ruta = ltrim(str_replace('\\', '/', $producto->imagen_producto), '/');

        return str_contains($ruta, '/') ? '/'.$ruta : '/imagenes/productos/'.$ruta;
    }
}
