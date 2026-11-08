<?php

namespace App\Console\Commands;

use App\Support\ImagenOptimizada;
use App\Support\ImagenWeb;
use Illuminate\Console\Command;

class GenerarVariantesImagenes extends Command
{
    protected $signature = 'imagenes:variantes';

    protected $description = 'Genera las variantes responsive de productos y promociones para la tienda';

    public function handle(): int
    {
        $carpetas = [
            'imagenes/productosvariaciones',
            'imagenes/promociones',
        ];

        $generadas = 0;

        foreach ($carpetas as $carpeta) {
            $directorio = public_path($carpeta);

            if (! is_dir($directorio)) {
                continue;
            }

            $this->info("Carpeta: {$carpeta}");

            foreach (glob($directorio.'/*.{webp,jpg,jpeg,png}', GLOB_BRACE) ?: [] as $archivo) {
                $nombre = basename($archivo);

                /* No generar variantes de una variante. */
                if (preg_match('/-(?:320|640|960)\.webp$/i', $nombre)) {
                    continue;
                }

                $variantes = ImagenOptimizada::generarVariantes($archivo);

                if (! $variantes) {
                    continue;
                }

                $rutaRelativa = $carpeta.'/'.$nombre;
                ImagenWeb::sincronizarVariantes($rutaRelativa);
                $generadas += count($variantes);

                $this->line('  '.$nombre.' → '.count($variantes).' variantes');
            }
        }

        /* Respaldos estáticos de promociones que viven solo en el sitio. */
        $sitioPromos = base_path('website-supabase/imagenes/promociones');

        if (is_dir($sitioPromos)) {
            $this->info('Carpeta: website-supabase/imagenes/promociones');

            foreach (glob($sitioPromos.'/*.{webp,jpg,jpeg,png}', GLOB_BRACE) ?: [] as $archivo) {
                $nombre = basename($archivo);

                if (preg_match('/-(?:320|640|960)\.webp$/i', $nombre)) {
                    continue;
                }

                $variantes = ImagenOptimizada::generarVariantes($archivo);

                if (! $variantes) {
                    continue;
                }

                $generadas += count($variantes);
                $this->line('  '.$nombre.' → '.count($variantes).' variantes');
            }
        }

        $this->info("Listo: {$generadas} variante(s) generada(s).");

        return self::SUCCESS;
    }
}
