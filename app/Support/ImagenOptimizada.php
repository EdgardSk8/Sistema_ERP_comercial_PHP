<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Intervention\Image\Facades\Image;

/**
 * Optimiza las imágenes subidas: las reduce a un ancho máximo y las
 * comprime en WebP para que pesen entre ~100 y 300 KB sin verse borrosas.
 */
class ImagenOptimizada
{
    /** Ancho máximo en píxeles (mantiene proporción). */
    public const ANCHO_MAXIMO = 1200;

    /** Calidad de compresión (0-100). 80 = casi sin pérdida visible. */
    public const CALIDAD = 80;

    /** Nitidez aplicada después de redimensionar (0-100). */
    public const NITIDEZ = 8;

    /**
     * Guarda la imagen optimizada en el directorio indicado.
     *
     * @return string Nombre del archivo guardado (con extensión).
     */
    public static function guardar(
        UploadedFile $archivo,
        string $directorio,
        string $prefijo = 'Imagen'
    ): string {
        if (! is_dir($directorio)) {
            mkdir($directorio, 0777, true);
        }

        $extension = self::extensionSoportada();
        $nombre = self::nombreDisponible($directorio, $prefijo, $extension);

        $imagen = Image::make($archivo->getRealPath())->orientate();

        if ($imagen->width() > self::ANCHO_MAXIMO) {
            $imagen->resize(self::ANCHO_MAXIMO, null, function ($restriccion) {
                $restriccion->aspectRatio();
                $restriccion->upsize();
            });
        }

        $imagen->sharpen(self::NITIDEZ);

        $imagen->encode($extension, self::CALIDAD)
            ->save($directorio.DIRECTORY_SEPARATOR.$nombre);

        return $nombre;
    }

    /** Usa WebP si GD lo soporta; si no, cae a JPG. */
    private static function extensionSoportada(): string
    {
        return (imagetypes() & IMG_WEBP) ? 'webp' : 'jpg';
    }

    /** Busca un nombre libre: ImagenProducto1.webp, ImagenProducto2.webp, ... */
    private static function nombreDisponible(string $directorio, string $prefijo, string $extension): string
    {
        $contador = 1;

        do {
            $nombre = $prefijo.$contador.'.'.$extension;
            $contador++;
        } while (file_exists($directorio.DIRECTORY_SEPARATOR.$nombre));

        return $nombre;
    }
}
