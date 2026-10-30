<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Producto;
use App\Models\ReseniaProducto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ReseniaController extends Controller
{
    /*  ╔══════════════ Reseñas de un producto ═══════════╗
        ╚═════════════════════════════════════════════════╝ */

    /**
     * Lista pública de reseñas visibles de un producto + resumen de estrellas.
     * Si hay sesión de cliente, devuelve además su propia reseña en "mi_resenia".
     */
    public function listar(Request $request, int|string $idProducto): JsonResponse
    {
        $producto = Producto::where('id_producto', $idProducto)
            ->where('estado_producto', 1)
            ->first();

        if (! $producto) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Producto no encontrado.',
            ], 404);
        }

        $limite = $request->integer('limite');

        $consulta = ReseniaProducto::with('cliente:id_cliente,nombre_cliente')
            ->where('id_producto', $producto->id_producto)
            ->where('estado_resenia', 1)
            ->orderByDesc('fecha_creacion_resenia');

        if ($limite > 0) {
            $consulta->limit($limite);
        }

        $resenias = $consulta->get();

        $cliente = $this->clienteDeSesion($request);
        $idClienteActual = $cliente?->id_cliente;

        // Se busca aparte para que el autor pueda editar/eliminar su reseña
        // aunque esté oculta por moderación.
        $miResenia = $idClienteActual
            ? ReseniaProducto::with('cliente:id_cliente,nombre_cliente')
                ->where('id_producto', $producto->id_producto)
                ->where('id_cliente', $idClienteActual)
                ->first()
            : null;

        return response()->json([
            'success' => true,
            'resumen' => $this->resumen($producto->id_producto),
            'resenias' => $resenias
                ->map(fn (ReseniaProducto $resenia) => $this->datosResenia($resenia, $idClienteActual))
                ->values(),
            'mi_resenia' => $miResenia ? $this->datosResenia($miResenia, $idClienteActual) : null,
            'puede_resenar' => (bool) $cliente,
        ]);
    }

    /*  ╔══════════════ Crear / actualizar reseña ════════╗
        ╚═════════════════════════════════════════════════╝ */

    /**
     * Crea la reseña del cliente autenticado. Si ya existe una para ese
     * producto, la actualiza (una reseña por cliente y producto).
     */
    public function guardar(Request $request): JsonResponse
    {
        $cliente = $this->clienteAutenticado($request);

        $validator = Validator::make($request->all(), [
            'id_producto' => 'required|integer|exists:productos,id_producto',
            'calificacion_resenia' => 'required|integer|min:1|max:5',
            'comentario_resenia' => 'nullable|string|max:1000',
        ], [
            'id_producto.required' => 'Selecciona un producto.',
            'id_producto.integer' => 'El producto seleccionado no es válido.',
            'id_producto.exists' => 'El producto no existe.',
            'calificacion_resenia.required' => 'Selecciona una calificación de 1 a 5 estrellas.',
            'calificacion_resenia.integer' => 'La calificación debe ser un número entero.',
            'calificacion_resenia.min' => 'La calificación mínima es 1 estrella.',
            'calificacion_resenia.max' => 'La calificación máxima es 5 estrellas.',
            'comentario_resenia.string' => 'El comentario no es válido.',
            'comentario_resenia.max' => 'El comentario no puede superar los 1000 caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $producto = Producto::where('id_producto', $request->id_producto)
            ->where('estado_producto', 1)
            ->first();

        if (! $producto) {
            return response()->json([
                'success' => false,
                'mensaje' => 'El producto no está disponible.',
            ], 404);
        }

        $comentario = trim((string) $request->input('comentario_resenia'));

        try {
            [$resenia, $actualizada] = DB::transaction(function () use ($cliente, $producto, $request, $comentario) {
                $existente = ReseniaProducto::where('id_cliente', $cliente->id_cliente)
                    ->where('id_producto', $producto->id_producto)
                    ->lockForUpdate()
                    ->first();

                if ($existente) {
                    $existente->update([
                        'calificacion_resenia' => (int) $request->calificacion_resenia,
                        'comentario_resenia' => $comentario !== '' ? $comentario : null,
                        'fecha_actualizacion_resenia' => now(),
                    ]);

                    return [$existente, true];
                }

                $nueva = ReseniaProducto::create([
                    'id_cliente' => $cliente->id_cliente,
                    'id_producto' => $producto->id_producto,
                    'calificacion_resenia' => (int) $request->calificacion_resenia,
                    'comentario_resenia' => $comentario !== '' ? $comentario : null,
                    'estado_resenia' => true,
                    'fecha_creacion_resenia' => now(),
                ]);

                return [$nueva, false];
            });
        } catch (\Throwable $e) {
            Log::error('ReseniaController@guardar: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo guardar tu reseña. Intenta nuevamente.',
            ], 500);
        }

        $resenia->load('cliente:id_cliente,nombre_cliente');

        return response()->json([
            'success' => true,
            'mensaje' => $actualizada
                ? 'Tu reseña se actualizó correctamente.'
                : '¡Gracias por tu reseña!',
            'actualizada' => $actualizada,
            'resenia' => $this->datosResenia($resenia, $cliente->id_cliente),
            'resumen' => $this->resumen($producto->id_producto),
        ], $actualizada ? 200 : 201);
    }

    /*  ╔══════════════ Eliminar reseña propia ═══════════╗
        ╚═════════════════════════════════════════════════╝ */

    public function eliminar(Request $request, int|string $idResenia): JsonResponse
    {
        $cliente = $this->clienteAutenticado($request);

        $resenia = ReseniaProducto::where('id_resenia', $idResenia)
            ->where('id_cliente', $cliente->id_cliente)
            ->first();

        if (! $resenia) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No encontramos una reseña tuya para eliminar.',
            ], 404);
        }

        $idProducto = $resenia->id_producto;
        $resenia->delete();

        return response()->json([
            'success' => true,
            'mensaje' => 'Reseña eliminada.',
            'resumen' => $this->resumen($idProducto),
        ]);
    }

    /*  ╔══════════════ Helpers ══════════════════════════╗
        ╚═════════════════════════════════════════════════╝ */

    private function clienteAutenticado(Request $request): Cliente
    {
        return $request->attributes->get('cliente_web');
    }

    private function clienteDeSesion(Request $request): ?Cliente
    {
        $idCliente = $request->session()->get('cliente_web.id_cliente');

        if (! $idCliente) {
            return null;
        }

        return Cliente::where('id_cliente', $idCliente)
            ->where('estado_cliente', 1)
            ->first();
    }

    /** Resumen calculado desde una colección ya cargada (sin consultas extra). */
    private function resumenDesdeColeccion($resenias): array
    {
        $total = $resenias->count();

        $distribucion = [];

        foreach ([5, 4, 3, 2, 1] as $estrellas) {
            $cantidad = $resenias->where('calificacion_resenia', $estrellas)->count();

            $distribucion[] = [
                'estrellas' => $estrellas,
                'total' => $cantidad,
                'porcentaje' => $total > 0 ? round(($cantidad / $total) * 100, 1) : 0,
            ];
        }

        return [
            'promedio' => $total > 0 ? round((float) $resenias->avg('calificacion_resenia'), 2) : 0,
            'total' => $total,
            'distribucion' => $distribucion,
        ];
    }

    /** Resumen de un producto puntual (para respuestas de guardar/eliminar). */
    private function resumen(int|string $idProducto): array
    {
        $fila = ReseniaProducto::select('id_producto')
            ->selectRaw('count(*) as total, coalesce(avg(calificacion_resenia), 0) as promedio')
            ->where('id_producto', $idProducto)
            ->where('estado_resenia', 1)
            ->groupBy('id_producto')
            ->first();

        $resenias = ReseniaProducto::where('id_producto', $idProducto)
            ->where('estado_resenia', 1)
            ->get(['calificacion_resenia']);

        return [
            'promedio' => $fila ? round((float) $fila->promedio, 2) : 0,
            'total' => (int) ($fila->total ?? 0),
            'distribucion' => $this->resumenDesdeColeccion($resenias)['distribucion'],
        ];
    }

    private function datosResenia(ReseniaProducto $resenia, ?int $idClienteActual = null): array
    {
        $nombre = $resenia->cliente->nombre_cliente ?? 'Cliente';

        return [
            'id_resenia' => $resenia->id_resenia,
            'id_producto' => $resenia->id_producto,
            'cliente' => $this->nombrePublico($nombre),
            'inicial' => mb_strtoupper(mb_substr($nombre, 0, 1)),
            'calificacion' => (int) $resenia->calificacion_resenia,
            'comentario' => $resenia->comentario_resenia,
            'fecha' => $resenia->fecha_creacion_resenia?->format('Y-m-d H:i'),
            'editada' => $resenia->fecha_actualizacion_resenia !== null,
            'es_mia' => $idClienteActual !== null && (int) $resenia->id_cliente === (int) $idClienteActual,
        ];
    }

    /** Solo el primer nombre, para no exponer el nombre completo del cliente. */
    private function nombrePublico(string $nombre): string
    {
        $partes = preg_split('/\s+/', trim($nombre));

        return $partes[0] ?? 'Cliente';
    }
}
