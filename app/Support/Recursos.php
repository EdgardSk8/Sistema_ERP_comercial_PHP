<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Decide de donde cargar los recursos de front-end:
 *
 * - Con internet usa el CDN (mas rapido y con cache del navegador).
 * - Sin internet usa los archivos de public/libs (modo offline).
 *
 * La comprobacion de conexion se guarda en cache para no pagar el ping en
 * cada peticion. Tambien se puede forzar el modo local con ASSETS_LOCAL=true.
 */
class Recursos
{
    /**
     * URL final del recurso indicado en config/assets.php.
     */
    public static function url(string $clave): string
    {
        $recurso = config('assets.recursos.'.$clave);

        if (! $recurso) {
            return '';
        }

        return static::usaLocal() ? asset($recurso['local']) : $recurso['cdn'];
    }

    public static function usaLocal(): bool
    {
        if (config('assets.forzar_local')) {
            return true;
        }

        // ?offline=1 fuerza local; ?online=1 vuelve al CDN (queda en la sesion).
        $forzado = static::forzadoEnSesion();

        if ($forzado !== null) {
            return $forzado;
        }

        return ! static::hayConexion();
    }

    /**
     * Comprueba si el CDN responde. Se recuerda mas tiempo cuando hay conexion.
     */
    public static function hayConexion(): bool
    {
        $conectado = Cache::remember('assets_conexion', now()->addMinutes(1), function () {
            return static::comprobarCdn();
        });

        // Si fallo, se reintenta antes (por si volvio el wifi).
        if (! $conectado) {
            Cache::forget('assets_conexion');
            Cache::put('assets_conexion', false, now()->addMinutes((int) config('assets.cache_sin_conexion', 2)));
        }

        return $conectado;
    }

    /**
     * Permite forzar el modo desde la peticion (?offline=1 / ?online=1) y lo
     * recuerda en la sesion. Util para probar ambos modos sin tocar el .env.
     */
    protected static function forzadoEnSesion(): ?bool
    {
        if (! app()->runningInConsole() && request()->has('offline')) {
            session(['assets_offline' => true]);
        }

        if (! app()->runningInConsole() && request()->has('online')) {
            session(['assets_offline' => false]);
        }

        $valor = session('assets_offline');

        return $valor === null ? null : (bool) $valor;
    }

    protected static function comprobarCdn(): bool
    {
        $contexto = stream_context_create([
            'http' => [
                'method' => 'HEAD',
                'timeout' => 2,
                'ignore_errors' => true,
                'user_agent' => 'Mozilla/5.0 (compatible; ERP-Tellez)',
            ],
        ]);

        $recurso = config('assets.recursos.bootstrap_css.cdn');

        return @file_get_contents($recurso, false, $contexto) !== false;
    }
}
