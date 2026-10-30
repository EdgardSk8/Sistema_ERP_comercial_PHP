<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CopiarImagenesTienda extends Command
{
    protected $signature = 'tienda:imagenes
                            {--dry : Solo mostrar qué archivos se copiarían}';

    protected $description = 'Copia las imágenes nuevas de public/imagenes a website-supabase/imagenes para la tienda';

    public function handle(): int
    {
        $origen = public_path('imagenes');
        $destino = base_path('website-supabase/imagenes');
        $soloMostrar = (bool) $this->option('dry');

        if (! is_dir($origen)) {
            $this->error('No existe public/imagenes.');

            return self::FAILURE;
        }

        if (! $soloMostrar) {
            File::ensureDirectoryExists($destino);
        }

        $copiados = 0;
        $omitidos = 0;

        foreach (File::allFiles($origen) as $archivo) {
            $relativa = str_replace('\\', '/', $archivo->getRelativePathname());
            $rutaDestino = $destino.'/'.$relativa;

            if (is_file($rutaDestino) && filesize($rutaDestino) === $archivo->getSize()) {
                $omitidos++;

                continue;
            }

            $this->line(($soloMostrar ? '[dry] ' : '').$relativa);

            if (! $soloMostrar) {
                File::ensureDirectoryExists(dirname($rutaDestino));
                copy($archivo->getPathname(), $rutaDestino);
            }

            $copiados++;
        }

        $this->info(($soloMostrar ? 'Se copiarían' : 'Copiados').": {$copiados} · sin cambios: {$omitidos}");
        $this->line('Recuerda hacer commit + push para que Cloudflare Pages publique las imágenes.');

        return self::SUCCESS;
    }
}
