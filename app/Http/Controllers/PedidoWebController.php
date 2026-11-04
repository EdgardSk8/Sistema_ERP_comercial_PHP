<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Throwable;

class PedidoWebController extends Controller
{
    private const ESTADOS_PEDIDO = [
        'solicitado',
        'aceptado',
        'rechazado',
        'preparando',
        'listo_retiro',
        'enviado',
        'entregado',
        'cancelado',
        'devuelto',
    ];

    private const ESTADOS_PAGO = [
        'pendiente',
        'en_revision',
        'pagado',
        'parcial',
        'reembolsado',
    ];

    private const TRANSICIONES = [
        'solicitado' => ['aceptado', 'rechazado', 'cancelado'],
        'aceptado' => ['enviado', 'listo_retiro', 'cancelado'],
        'preparando' => ['enviado', 'listo_retiro'],
        'enviado' => ['entregado'],
        'listo_retiro' => ['entregado'],
        'entregado' => ['devuelto'],
    ];

    private const TRANSICIONES_PAGO = [
        'pendiente' => ['en_revision', 'pagado', 'parcial'],
        'en_revision' => ['pendiente', 'pagado', 'parcial'],
        'pagado' => ['reembolsado'],
        'parcial' => ['pagado', 'reembolsado'],
        'reembolsado' => [],
    ];

    public function Mostrar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'estado' => 'nullable|in:todas,'.implode(',', self::ESTADOS_PEDIDO),
            'pago' => 'nullable|in:todos,'.implode(',', self::ESTADOS_PAGO),
            'buscar' => 'nullable|string|max:120',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $consulta = DB::table('pedidos_web as p')
            ->join('clientes as c', 'c.id_cliente', '=', 'p.id_cliente')
            ->select([
                'p.id_pedido',
                'p.numero_pedido',
                'p.fecha_pedido',
                'p.estado_pedido',
                'p.estado_pago',
                'p.metodo_pago_web',
                'p.subtotal_pedido',
                'p.descuento_pedido',
                'p.costo_envio_pedido',
                'p.total_pedido',
                'p.fecha_entrega_estimada',
                'p.fecha_aceptado',
                'p.fecha_entregado',
                'p.hora_entrega_preferida',
                'p.nota_negocio',
                'p.id_venta',
                'p.nombre_recibe',
                'p.telefono_contacto',
                'c.nombre_cliente',
                'c.correo_cliente',
                'c.telefono_cliente',
            ])
            ->orderByDesc('p.fecha_pedido');

        if ($request->filled('estado') && $request->estado !== 'todas') {
            $consulta->where('p.estado_pedido', $request->estado);
        }

        if ($request->filled('pago') && $request->pago !== 'todos') {
            $consulta->where('p.estado_pago', $request->pago);
        }

        if ($request->filled('buscar')) {
            $buscar = '%'.$request->buscar.'%';

            $consulta->where(function ($query) use ($buscar) {
                $query->where('p.numero_pedido', 'ilike', $buscar)
                    ->orWhere('c.nombre_cliente', 'ilike', $buscar)
                    ->orWhere('c.correo_cliente', 'ilike', $buscar)
                    ->orWhere('p.nombre_recibe', 'ilike', $buscar);
            });
        }

        $pedidos = $consulta->limit(500)->get();

        $detalles = DB::table('detalle_pedidos_web')
            ->whereIn('id_pedido', $pedidos->pluck('id_pedido'))
            ->orderBy('id_detalle_pedido')
            ->get()
            ->groupBy('id_pedido');

        $pedidos = $pedidos->map(function ($pedido) use ($detalles) {
            $items = $detalles->get($pedido->id_pedido, collect());

            $pedido->items_total = $items->count();
            $pedido->items_resumen = $items->take(3)->pluck('nombre_producto')->implode(', ');

            return $pedido;
        });

        $resumen = DB::table('pedidos_web')
            ->selectRaw('count(*) as total')
            ->selectRaw("sum(case when estado_pedido = 'solicitado' then 1 else 0 end) as solicitados")
            ->selectRaw("sum(case when estado_pedido = 'aceptado' then 1 else 0 end) as aceptados")
            ->selectRaw("sum(case when estado_pedido = 'cancelado' then 1 else 0 end) as cancelados")
            ->first();

        return response()->json([
            'success' => true,
            'pedidos' => $pedidos,
            'resumen' => [
                'total' => (int) ($resumen->total ?? 0),
                'solicitados' => (int) ($resumen->solicitados ?? 0),
                'aceptados' => (int) ($resumen->aceptados ?? 0),
                'cancelados' => (int) ($resumen->cancelados ?? 0),
            ],
        ]);
    }

    public function Detalle($id)
    {
        $pedido = DB::table('pedidos_web as p')
            ->join('clientes as c', 'c.id_cliente', '=', 'p.id_cliente')
            ->where('p.id_pedido', $id)
            ->select('p.*', 'c.nombre_cliente', 'c.correo_cliente', 'c.telefono_cliente')
            ->first();

        if (! $pedido) {
            return response()->json(['success' => false, 'mensaje' => 'Pedido no encontrado.'], 404);
        }

        $pedido->items = DB::table('detalle_pedidos_web')
            ->where('id_pedido', $id)
            ->orderBy('id_detalle_pedido')
            ->get();

        $pedido->historial = DB::table('pedido_web_estados as h')
            ->leftJoin('usuarios as u', 'u.id_usuario', '=', 'h.id_usuario')
            ->where('h.id_pedido', $id)
            ->orderBy('h.fecha_cambio')
            ->select('h.*', 'u.nombre_usuario')
            ->get();

        $pedido->transiciones = self::TRANSICIONES[$pedido->estado_pedido] ?? [];
        $pedido->pagos_permitidos = self::TRANSICIONES_PAGO[$pedido->estado_pago] ?? [];

        return response()->json(['success' => true, 'pedido' => $pedido]);
    }

    public function CambiarEstado(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'estado_pedido' => 'nullable|in:'.implode(',', self::ESTADOS_PEDIDO),
            'estado_pago' => 'nullable|in:'.implode(',', self::ESTADOS_PAGO),
            'fecha_entrega_estimada' => 'nullable|date',
            'nota_negocio' => 'nullable|string|max:500',
        ], [
            'in' => 'El estado seleccionado no es válido.',
            'date' => 'La fecha de entrega no es válida.',
            'max' => 'La nota no puede superar los :max caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $pedido = DB::table('pedidos_web')->where('id_pedido', $id)->first();

        if (! $pedido) {
            return response()->json(['success' => false, 'mensaje' => 'Pedido no encontrado.'], 404);
        }

        $nuevoEstadoPedido = $request->input('estado_pedido', $pedido->estado_pedido);
        $nuevoEstadoPago = $request->input('estado_pago', $pedido->estado_pago);
        $esEfectivo = $pedido->metodo_pago_web === 'efectivo';

        if ($esEfectivo && $nuevoEstadoPedido === 'entregado' && $pedido->estado_pago !== 'reembolsado') {
            $nuevoEstadoPago = 'pagado';
        }

        $permisos = session('permisos', []);

        if ($nuevoEstadoPago !== $pedido->estado_pago
            && ! in_array('actualizar_pagos_pedidos_web', $permisos, true)) {
            return response()->json([
                'success' => false,
                'mensaje' => 'No tienes permiso para confirmar pagos de pedidos.',
            ], 403);
        }

        if ($nuevoEstadoPedido !== $pedido->estado_pedido) {
            $permitidos = self::TRANSICIONES[$pedido->estado_pedido] ?? [];

            if (! in_array($nuevoEstadoPedido, $permitidos, true)) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'No se puede pasar de "'.$pedido->estado_pedido.'" a "'.$nuevoEstadoPedido.'".',
                ], 422);
            }
        }

        if ($nuevoEstadoPago !== $pedido->estado_pago) {
            $permitidosPago = self::TRANSICIONES_PAGO[$pedido->estado_pago] ?? [];

            if (! in_array($nuevoEstadoPago, $permitidosPago, true)) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'No se puede pasar el pago de "'.$pedido->estado_pago.'" a "'.$nuevoEstadoPago.'".',
                ], 422);
            }
        }

        if ($nuevoEstadoPedido === 'aceptado' && ! $esEfectivo && $nuevoEstadoPago !== 'pagado') {
            return response()->json([
                'success' => false,
                'mensaje' => 'Primero confirma que el pago llegó antes de aceptar el pedido.',
            ], 422);
        }

        $datos = [
            'estado_pedido' => $nuevoEstadoPedido,
            'estado_pago' => $nuevoEstadoPago,
        ];

        if ($request->filled('fecha_entrega_estimada')) {
            $datos['fecha_entrega_estimada'] = date(
                'Y-m-d H:i:s',
                strtotime($request->input('fecha_entrega_estimada'))
            );
        }

        if ($request->has('nota_negocio')) {
            $datos['nota_negocio'] = $request->input('nota_negocio') ?: null;
        }

        $usuario = session('usuario', []);

        try {
            DB::transaction(function () use ($id, $pedido, $datos, $nuevoEstadoPedido, $nuevoEstadoPago, $request, $usuario) {
                DB::table('pedidos_web')->where('id_pedido', $id)->update($datos);

                $huboCambio = $nuevoEstadoPedido !== $pedido->estado_pedido
                    || $nuevoEstadoPago !== $pedido->estado_pago;

                if (! $huboCambio && ! $request->filled('nota_negocio')) {
                    return;
                }

                DB::table('pedido_web_estados')->insert([
                    'id_pedido' => $id,
                    'estado_anterior' => $pedido->estado_pedido,
                    'estado_nuevo' => $nuevoEstadoPedido,
                    'estado_pago_anterior' => $pedido->estado_pago,
                    'estado_pago_nuevo' => $nuevoEstadoPago,
                    'origen' => 'erp',
                    'id_usuario' => $usuario['id'] ?? null,
                    'nota' => $request->input('nota_negocio') ?: null,
                ]);
            });
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => 'No se pudo actualizar el pedido. Intenta de nuevo.',
            ], 500);
        }

        if (in_array($nuevoEstadoPedido, ['cancelado', 'rechazado'], true)
            && ! empty($pedido->uso_descuento_bienvenida)) {
            $this->reactivarDescuentoBienvenida((int) $pedido->id_cliente);
        }

        $actualizado = DB::table('pedidos_web')->where('id_pedido', $id)->first();

        return response()->json([
            'success' => true,
            'mensaje' => 'Pedido actualizado correctamente.',
            'pedido' => [
                'id_pedido' => (int) $id,
                'estado_pedido' => $nuevoEstadoPedido,
                'estado_pago' => $nuevoEstadoPago,
                'fecha_entrega_estimada' => $actualizado->fecha_entrega_estimada,
                'fecha_aceptado' => $actualizado->fecha_aceptado,
                'fecha_entregado' => $actualizado->fecha_entregado,
                'hora_entrega_preferida' => $actualizado->hora_entrega_preferida,
                'nota_negocio' => $actualizado->nota_negocio,
            ],
        ]);
    }

    private function reactivarDescuentoBienvenida(int $idCliente): void
    {
        try {
            DB::update(
                "update auth.users u
                    set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
                        || '{\"descuento_primera_compra\": true, \"descuento_primera_compra_usado\": false}'::jsonb
                  from clientes c
                 where c.auth_id = u.id
                   and c.id_cliente = ?",
                [$idCliente]
            );
        } catch (Throwable $e) {
            report($e);
        }
    }
}
