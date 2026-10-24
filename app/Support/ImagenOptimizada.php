<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Intervention\Image\Facades\Image;

/**
 * Optimiza imágenes subidas: las redimensiona, las convierte a WebP y baja la
 * calidad por pasos hasta que pesen como máximo 300 KB (o menos si se indica).
 */
class ImagenOptimizada
{
    /** Ancho máximo en píxeles. */
    public const ANCHO_MAXIMO = 1200;

    /** Alto máximo en píxeles. */
    public const ALTO_MAXIMO = 1600;

    /** Peso máximo permitido: 300 KB. */
    public const PESO_MAXIMO = 300 * 1024;

    /** Calidad inicial de compresión (0-100). */
    public const CALIDAD = 80;

    /** Nitidez aplicada después de redimensionar (0-100). */
    public const NITIDEZ = 8;

    /** Calidades que se prueban, de mayor a menor, hasta bajar del límite. */
    protected const CALIDADES = [80, 75, 70, 65, 60, 55, 50, 45, 40, 35];

    /** Ancho mínimo al que se puede reducir buscando el peso máximo. */
    protected const ANCHO_MINIMO = 640;

    /**
     * Guarda la imagen optimizada en el directorio indicado.
     *
     * @return string Nombre del archivo guardado (con extensión).
     */
    public static function guardar(
        UploadedFile $archivo,
        string $directorio,
        string $prefijo = 'Imagen',
        int $pesoMaximo = self::PESO_MAXIMO
    ): string {
        if (! is_dir($directorio)) {
            mkdir($directorio, 0777, true);
        }

        $extension = self::extensionSoportada();
        $nombre = self::nombreDisponible($directorio, $prefijo, $extension);
        $destino = $directorio.DIRECTORY_SEPARATOR.$nombre;

        $bytes = self::comprimir($archivo->getRealPath(), $extension, $pesoMaximo);
        file_put_contents($destino, $bytes);
        @chmod($destino, 0644);

        return $nombre;
    }

    /**
     * Recomprime un archivo existente conservando su ruta y su formato.
     * Útil para archivos ya subidos que pesan demasiado.
     */
    public static function optimizarEnSitio(string $ruta, int $pesoMaximo = self::PESO_MAXIMO): bool
    {
        if (! is_file($ruta)) {
            return false;
        }

        $extension = strtolower(pathinfo($ruta, PATHINFO_EXTENSION));
        $formato = in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)
            ? ($extension === 'jpeg' ? 'jpg' : $extension)
            : self::extensionSoportada();

        $bytes = self::comprimir($ruta, $formato, $pesoMaximo);

        if (strlen($bytes) >= filesize($ruta)) {
            return false;
        }

        file_put_contents($ruta, $bytes);

        return true;
    }

    /**
     * Devuelve el binario de la imagen ya optimizado.
     */
    public static function comprimir(string $ruta, string $formato = 'webp', int $pesoMaximo = self::PESO_MAXIMO): string
    {
        $imagen = Image::make($ruta)->orientate();

        if ($imagen->width() > self::ANCHO_MAXIMO) {
            $imagen->resize(self::ANCHO_MAXIMO, null, function ($restriccion) {
                $restriccion->aspectRatio();
                $restriccion->upsize();
            });
        }

        if ($imagen->height() > self::ALTO_MAXIMO) {
            $imagen->resize(null, self::ALTO_MAXIMO, function ($restriccion) {
                $restriccion->aspectRatio();
                $restriccion->upsize();
            });
        }

        $imagen->sharpen(self::NITIDEZ);

        $datos = '';

        foreach (self::CALIDADES as $calidad) {
            $datos = $imagen->encode($formato, $calidad)->getEncoded();

            if (strlen($datos) <= $pesoMaximo) {
                return $datos;
            }
        }

        // Aún pesa demasiado: se reduce el ancho en pasos del 15 %.
        $ancho = $imagen->width();

        while (strlen($datos) > $pesoMaximo && $ancho > self::ANCHO_MINIMO) {
            $ancho = (int) round($ancho * 0.85);

            $imagen->resize($ancho, null, function ($restriccion) {
                $restriccion->aspectRatio();
            });

            $datos = $imagen->encode($formato, 60)->getEncoded();
        }

        return $datos;
    }

    /** Usa WebP si GD lo soporta; si no, cae a JPG. */
    public static function extensionSoportada(): string
    {
        return (imagetypes() & IMG_WEBP) ? 'webp' : 'jpg';
    }

    /** Busca un nombre libre: ImagenProducto1.webp, ImagenProducto2.webp, ... */
    protected static function nombreDisponible(string $directorio, string $prefijo, string $extension): string
    {
        $contador = 1;

        do {
            $nombre = $prefijo.$contador.'.'.$extension;
            $contador++;
        } while (file_exists($directorio.DIRECTORY_SEPARATOR.$nombre));

        return $nombre;
    }
}
