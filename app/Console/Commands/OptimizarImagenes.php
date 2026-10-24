<?php

namespace App\Console\Commands;

use App\Support\ImagenOptimizada;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class OptimizarImagenes extends Command
{
    protected $signature = 'imagenes:optimizar
                            {--limite=300 : Peso máximo por imagen en KB}
                            {--dry : Solo mostrar qué archivos se optimizarían}';

    protected $description = 'Recomprime las fotos de productos y variaciones a WebP por debajo del límite de peso';

    /** @var array<int, string> */
    private array $extensiones = ['jpg', 'jpeg', 'png', 'webp'];

    public function handle(): int
    {
        $limite = max(50, (int) $this->option('limite')) * 1024;
        $soloMostrar = (bool) $this->option('dry');

        $total = 0;
        $ahorro = 0;

        foreach ($this->carpetas() as $carpeta) {
            $directorio = public_path($carpeta['ruta']);

            if (! is_dir($directorio)) {
                continue;
            }

            $this->info("Carpeta: {$carpeta['ruta']}");

            foreach (glob($directorio.'/*') ?: [] as $archivo) {
                if (! is_file($archivo)) {
                    continue;
                }

                $extension = strtolower(pathinfo($archivo, PATHINFO_EXTENSION));

                if (! in_array($extension, $this->extensiones, true)) {
                    continue;
                }

                $peso = filesize($archivo);

                if ($peso <= $limite) {
                    continue;
                }

                $nombreViejo = basename($archivo);
                $nombreNuevo = $this->nombreWebp($directorio, $nombreViejo, $extension);
                $rutaNueva = $directorio.DIRECTORY_SEPARATOR.$nombreNuevo;

                $this->line(sprintf(
                    '  %s (%d KB) → %s',
                    $nombreViejo,
                    round($peso / 1024),
                    $nombreNuevo
                ));

                if ($soloMostrar) {
                    continue;
                }

                try {
                    $bytes = ImagenOptimizada::comprimir($archivo, 'webp', $limite);
                    file_put_contents($rutaNueva, $bytes);
                    @chmod($rutaNueva, 0644);
                } catch (\Throwable $e) {
                    $this->warn("    No se pudo optimizar: {$e->getMessage()}");

                    continue;
                }

                $this->actualizarReferencias($carpeta, $nombreViejo, $nombreNuevo);

                if (is_file($archivo) && $rutaNueva !== $archivo) {
                    @unlink($archivo);
                }

                $total++;
                $ahorro += max(0, $peso - filesize($rutaNueva));
            }
        }

        if ($soloMostrar) {
            $this->info('Modo simulación: no se modificó ningún archivo.');

            return self::SUCCESS;
        }

        $this->info(sprintf(
            'Listo: %d imagen(es) optimizada(s), ~%d KB liberados.',
            $total,
            round($ahorro / 1024)
        ));

        return self::SUCCESS;
    }

    /**
     * Carpetas a revisar y la tabla/columna que apunta a cada archivo.
     *
     * @return array<int, array{ruta: string, tabla: string, columna: string, relativa: bool}>
     */
    private function carpetas(): array
    {
        return [
            [
                'ruta' => 'imagenes/productos',
                'tabla' => 'productos',
                'columna' => 'imagen_producto',
                'relativa' => false,
            ],
            [
                'ruta' => 'imagenes/productosvariaciones',
                'tabla' => 'variacion_imagenes',
                'columna' => 'imagen',
                'relativa' => true,
            ],
        ];
    }

    /**
     * Devuelve un nombre .webp libre (misma base, sin pisar otros archivos).
     */
    private function nombreWebp(string $directorio, string $nombreViejo, string $extension): string
    {
        if ($extension === 'webp') {
            return $nombreViejo;
        }

        $base = pathinfo($nombreViejo, PATHINFO_FILENAME);
        $nombre = $base.'.webp';
        $contador = 2;

        while (file_exists($directorio.DIRECTORY_SEPARATOR.$nombre)) {
            $nombre = $base.'-'.$contador.'.webp';
            $contador++;
        }

        return $nombre;
    }

    /**
     * Actualiza la ruta guardada en la base de datos.
     *
     * @param  array{ruta: string, tabla: string, columna: string, relativa: bool}  $carpeta
     */
    private function actualizarReferencias(array $carpeta, string $viejo, string $nuevo): void
    {
        $valorViejo = $carpeta['relativa'] ? $carpeta['ruta'].'/'.$viejo : $viejo;
        $valorNuevo = $carpeta['relativa'] ? $carpeta['ruta'].'/'.$nuevo : $nuevo;

        DB::table($carpeta['tabla'])
            ->where($carpeta['columna'], $valorViejo)
            ->update([$carpeta['columna'] => $valorNuevo]);

        // Por si alguna fila guardó la ruta completa o con prefijo.
        DB::table($carpeta['tabla'])
            ->where($carpeta['columna'], 'like', '%'.$viejo)
            ->where($carpeta['columna'], '!=', $valorViejo)
            ->update([$carpeta['columna'] => $valorNuevo]);
    }
}
