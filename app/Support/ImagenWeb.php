<?php

namespace App\Support;

use Illuminate\Support\Facades\File;

/**
 * Mantiene sincronizadas las imágenes del ERP con la copia que publica el sitio.
 *
 * El website se sirve como archivos estáticos desde `website-supabase/`, así que
 * una imagen subida en el ERP (que vive en `public/imagenes/...`) no se vería en
 * la tienda hasta copiarla allí.
 */
class ImagenWeb
{
    /** Carpeta del sitio dentro del proyecto. */
    private const SITIO = 'website-supabase';

    /** Copia la imagen indicada a la carpeta del sitio. */
    public static function sincronizar(string $rutaRelativa): void
    {
        $rutaRelativa = self::normalizar($rutaRelativa);

        if ($rutaRelativa === null) {
            return;
        }

        $origen = public_path($rutaRelativa);
        $destino = base_path(self::SITIO.'/'.$rutaRelativa);

        if (! File::exists($origen)) {
            return;
        }

        File::ensureDirectoryExists(dirname($destino));
        File::copy($origen, $destino);
    }

    /** Copia las variantes responsive de una imagen a la carpeta del sitio. */
    public static function sincronizarVariantes(string $rutaRelativa): void
    {
        $rutaRelativa = self::normalizar($rutaRelativa);

        if ($rutaRelativa === null) {
            return;
        }

        foreach (ImagenOptimizada::rutasVariantes($rutaRelativa) as $variante) {
            self::sincronizar($variante);
        }
    }

    /** Borra las variantes responsive de la copia pública. */
    public static function eliminarVariantes(string $rutaRelativa): void
    {
        $rutaRelativa = self::normalizar($rutaRelativa);

        if ($rutaRelativa === null) {
            return;
        }

        foreach (ImagenOptimizada::rutasVariantes($rutaRelativa) as $variante) {
            self::eliminar($variante);
        }
    }

    /** Borra la copia del sitio cuando la imagen se elimina del ERP. */
    public static function eliminar(string $rutaRelativa): void
    {
        $rutaRelativa = self::normalizar($rutaRelativa);

        if ($rutaRelativa === null) {
            return;
        }

        $destino = base_path(self::SITIO.'/'.$rutaRelativa);

        if (File::exists($destino)) {
            File::delete($destino);
        }
    }

    /** Solo rutas relativas dentro de imagenes/, sin salir de la carpeta. */
    private static function normalizar(string $rutaRelativa): ?string
    {
        $rutaRelativa = ltrim(trim($rutaRelativa), '/');

        if ($rutaRelativa === '' || ! str_starts_with($rutaRelativa, 'imagenes/') || str_contains($rutaRelativa, '..')) {
            return null;
        }

        return $rutaRelativa;
    }
}
