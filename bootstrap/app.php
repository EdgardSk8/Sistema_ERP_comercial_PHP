<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        
    )
    ->withMiddleware(function (Middleware $middleware): void {

        // Confiar en los proxies (Cloudflare Tunnel, ngrok, balanceadores) para que
        // Laravel detecte el esquema real (https) via X-Forwarded-Proto y genere
        // los assets con la URL correcta (evita contenido mixto).
        $middleware->trustProxies(at: '*');

        $middleware->alias([
            'permiso' => \App\Http\Middleware\PermisoMiddleware::class,
        ]);
        
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
