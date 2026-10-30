<?php

/**
 * Servidor local para probar la tienda estática con las mismas rutas
 * que usa el hosting (_redirects de Netlify/Cloudflare o vercel.json).
 *
 * Uso:
 *   php -S 127.0.0.1:8090 dev-server.php
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

function servir(string $archivo): bool
{
    $extensiones = [
        'html' => 'text/html; charset=UTF-8',
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

    $tipo = $extensiones[strtolower(pathinfo($archivo, PATHINFO_EXTENSION))] ?? 'application/octet-stream';
    header('Content-Type: '.$tipo);
    readfile($archivo);

    return true;
}

$rutas = [
    '/' => 'index.html',
    '/tienda' => 'index.html',
    '/tienda/' => 'index.html',
    '/producto' => 'producto.html',
    '/login' => 'login.html',
    '/carrito' => 'carrito.html',
    '/perfil' => 'perfil.html',
    '/tienda/login' => 'login.html',
    '/tienda/carrito' => 'carrito.html',
    '/tienda/perfil' => 'perfil.html',
];

if (isset($rutas[$uri])) {
    servir(__DIR__.'/'.$rutas[$uri]);

    return true;
}

if (preg_match('#^/tienda/producto/(\d+)$#', $uri)) {
    servir(__DIR__.'/producto.html');

    return true;
}

if (preg_match('#^/tienda/recursos/(.+)$#', $uri, $coincidencia)) {
    $archivo = __DIR__.'/'.$coincidencia[1];

    if (is_file($archivo)) {
        servir($archivo);

        return true;
    }

    http_response_code(404);

    return true;
}

return false;
