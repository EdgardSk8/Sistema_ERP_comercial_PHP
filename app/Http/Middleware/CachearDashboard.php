<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cachea las respuestas JSON del dashboard durante N segundos.
 *
 * Se aplica SIEMPRE después del middleware `permiso`, para que un usuario sin
 * permiso nunca reciba una respuesta cacheada por otro.
 *
 * La cabecera X-Dashboard-Cache indica si la respuesta vino de la caché
 * (HIT) o se calculó en ese momento (MISS).
 */
class CachearDashboard
{
    public function handle(Request $request, Closure $next): Response
    {
        $segundos = (int) config('dashboard.cache_segundos', 30);

        if ($segundos <= 0 || ! $request->isMethod('GET')) {
            return $next($request);
        }

        $clave = 'dashboard:'.md5($request->fullUrl());

        if (Cache::has($clave)) {
            $guardado = Cache::get($clave);

            return response($guardado['contenido'], $guardado['estado'])
                ->header('Content-Type', 'application/json')
                ->header('X-Dashboard-Cache', 'HIT');
        }

        $respuesta = $next($request);

        // Solo se guardan respuestas exitosas: un 500 no debe quedar cacheado.
        if ($respuesta->getStatusCode() === 200) {
            Cache::put($clave, [
                'estado' => $respuesta->getStatusCode(),
                'contenido' => $respuesta->getContent(),
            ], now()->addSeconds($segundos));
        }

        $respuesta->headers->set('X-Dashboard-Cache', 'MISS');

        return $respuesta;
    }
}
