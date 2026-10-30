<?php

namespace App\Http\Middleware;

use App\Models\Cliente;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ClienteWebMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $idCliente = session('cliente_web.id_cliente');

        if (! $idCliente) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Debes iniciar sesión para continuar.',
            ], 401);
        }

        $cliente = Cliente::where('id_cliente', $idCliente)
            ->where('estado_cliente', 1)
            ->first();

        if (! $cliente) {
            $request->session()->forget('cliente_web');

            return response()->json([
                'success' => false,
                'mensaje' => 'Tu sesión expiró. Vuelve a iniciar sesión.',
            ], 401);
        }

        $request->attributes->set('cliente_web', $cliente);

        return $next($request);
    }
}
