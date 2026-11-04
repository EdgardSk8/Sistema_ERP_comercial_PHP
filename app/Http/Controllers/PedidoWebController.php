<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Cuenta;
use App\Models\DetalleVenta;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuenta;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\VariacionTalla;
use App\Models\Venta;
use App\Services\CosteoInventarioService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
            ->selectRaw("sum(case when estado_pedido in ('enviado', 'listo_retiro') then 1 else 0 end) as en_camino")
            ->selectRaw("sum(case when estado_pedido = 'entregado' then 1 else 0 end) as entregados")
            ->selectRaw("sum(case when estado_pedido = 'cancelado' then 1 else 0 end) as cancelados")
            ->first();

        return response()->json([
            'success' => true,
            'pedidos' => $pedidos,
            'resumen' => [
                'total' => (int) ($resumen->total ?? 0),
                'solicitados' => (int) ($resumen->solicitados ?? 0),
                'aceptados' => (int) ($resumen->aceptados ?? 0),
                'en_camino' => (int) ($resumen->en_camino ?? 0),
                'entregados' => (int) ($resumen->entregados ?? 0),
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

        $facturo = false;

        try {
            DB::transaction(function () use ($id, $pedido, $datos, $nuevoEstadoPedido, $nuevoEstadoPago, $request, $usuario, &$facturo) {
                DB::table('pedidos_web')->where('id_pedido', $id)->update($datos);

                $huboCambio = $nuevoEstadoPedido !== $pedido->estado_pedido
                    || $nuevoEstadoPago !== $pedido->estado_pago;

                if (in_array($nuevoEstadoPedido, ['aceptado', 'entregado'], true)
                    && $nuevoEstadoPago === 'pagado'
                    && in_array($pedido->metodo_pago_web, ['efectivo', 'lafise', 'billetera_movil'], true)) {
                    $facturo = $this->facturarPedidoWeb((int) $id, $usuario);
                }

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
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'success' => false,
                'mensaje' => $e->getMessage() ?: 'No se pudo actualizar el pedido. Intenta de nuevo.',
            ], 422);
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

        if ($facturo) {
            Cache::forget('pos.productos.'.md5(''));
        }

        $actualizado = DB::table('pedidos_web')->where('id_pedido', $id)->first();

        return response()->json([
            'success' => true,
            'mensaje' => $facturo
                ? 'Pedido aceptado y pagado. Venta registrada, stock descontado e ingreso registrado en caja/cuenta.'
                : 'Pedido actualizado correctamente.',
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

    private function cuentaParaPedidoWeb(string $metodoPago): ?object
    {
        $consulta = DB::table('cuentas')->where('estado', 1);

        if ($metodoPago === 'billetera_movil') {
            $consulta->where(function ($query) {
                $query->where('nombre_cuenta', 'ilike', '%billetera%')
                    ->orWhere('nombre_cuenta', 'ilike', '%móvil%')
                    ->orWhere('nombre_cuenta', 'ilike', '%movil%');
            });
        } else {
            $consulta->where('nombre_cuenta', 'ilike', '%lafise%');
        }

        $cuenta = $consulta->orderBy('id_cuenta')->first();

        return $cuenta ?: DB::table('cuentas')->where('estado', 1)->orderBy('id_cuenta')->first();
    }

    private function facturarPedidoWeb(int $idPedido, array $usuario): bool
    {
        $pedido = DB::table('pedidos_web')->where('id_pedido', $idPedido)->lockForUpdate()->first();

        if (! $pedido || $pedido->id_venta) {
            return false;
        }

        if (! in_array($pedido->metodo_pago_web, ['efectivo', 'lafise', 'billetera_movil'], true)
            || ! in_array($pedido->estado_pedido, ['aceptado', 'entregado'], true)
            || $pedido->estado_pago !== 'pagado') {
            return false;
        }

        $items = DB::table('detalle_pedidos_web')
            ->where('id_pedido', $idPedido)
            ->orderBy('id_detalle_pedido')
            ->get();

        if ($items->isEmpty()) {
            throw new \Exception('El pedido no tiene productos para facturar.');
        }

        $idUsuario = (int) ($usuario['id'] ?? 0);
        $esEfectivo = $pedido->metodo_pago_web === 'efectivo';
        $caja = null;
        $cuenta = null;
        $ingresoEnCuenta = ! $esEfectivo;

        if ($esEfectivo) {
            $caja = Caja::where('estado_caja', 1)
                ->where('id_usuario', $idUsuario)
                ->lockForUpdate()
                ->first();

            if (! $caja) {
                // Sin caja abierta: el efectivo queda registrado en una cuenta.
                $cuenta = $this->cuentaParaPedidoWeb($pedido->metodo_pago_web);
                $ingresoEnCuenta = true;

                if (! $cuenta) {
                    throw new \Exception('No hay caja abierta ni una cuenta activa para registrar el pago del pedido.');
                }
            }
        } else {
            $cuenta = $this->cuentaParaPedidoWeb($pedido->metodo_pago_web);

            if (! $cuenta) {
                throw new \Exception('No hay una cuenta activa para registrar el pago del pedido.');
            }
        }

        $cliente = DB::table('clientes')->where('id_cliente', $pedido->id_cliente)->first();
        $nombreCliente = $cliente->nombre_cliente ?? $pedido->nombre_recibe ?? 'Cliente';
        $telefonoCliente = $cliente->telefono_cliente ?? $pedido->telefono_contacto ?? '';
        $correoCliente = $cliente->correo_cliente ?? '';
        $detalleCliente = trim($nombreCliente
            .($telefonoCliente ? ' · Tel: '.$telefonoCliente : '')
            .($correoCliente ? ' · '.$correoCliente : ''));

        $numero = 'VTA-'.now()->format('Ymd').'-'.str_pad((Venta::max('id_venta') + 1), 5, '0', STR_PAD_LEFT);

        $venta = Venta::create([
            'numero_factura' => $numero,
            'id_cliente' => $pedido->id_cliente,
            'id_usuario' => $idUsuario,
            'id_caja' => (! $ingresoEnCuenta && $caja) ? $caja->id_caja : null,
            'id_cuenta' => $ingresoEnCuenta ? $cuenta->id_cuenta : null,
            'subtotal_venta' => 0,
            'impuesto_venta' => 0,
            'descuento_venta' => (float) ($pedido->descuento_pedido ?? 0),
            'total_venta' => 0,
            'id_metodo_pago' => $esEfectivo ? 1 : 2,
            'monto_recibido' => (float) $pedido->total_pedido,
            'vuelto' => 0,
        ]);

        $subtotalGeneral = 0.0;
        $impuestoGeneral = 0.0;

        foreach ($items as $item) {
            $cantidad = (int) $item->cantidad_pedido;

            if ($cantidad < 1) {
                throw new \Exception('La cantidad de un producto del pedido no es válida.');
            }

            $producto = Producto::with('impuesto')->find($item->id_producto);

            if (! $producto) {
                throw new \Exception('El producto "'.$item->nombre_producto.'" ya no existe.');
            }

            $variacionTalla = null;

            if (! empty($item->id_variacion_talla)) {
                $variacionTalla = VariacionTalla::with(['variacion', 'talla'])
                    ->where('id_variacion_talla', $item->id_variacion_talla)
                    ->whereHas('variacion', fn ($query) => $query->where('id_producto', $producto->id_producto))
                    ->lockForUpdate()
                    ->first();
            }

            $impuestoUnitario = round((float) ($item->monto_impuesto_pedido ?? 0) / $cantidad, 2);
            $precioSinImpuesto = round((float) $item->precio_unitario_pedido - $impuestoUnitario, 2);
            $subtotal = round($precioSinImpuesto * $cantidad, 2);
            $impuesto = round($impuestoUnitario * $cantidad, 2);

            $subtotalGeneral += $subtotal;
            $impuestoGeneral += $impuesto;

            $costoRespaldo = (float) ($variacionTalla
                ? ($variacionTalla->precio_compra ?? $producto->precio_compra ?? 0)
                : ($producto->precio_compra ?? 0));

            $costeoFifo = app(CosteoInventarioService::class)->consumir(
                $producto->id_producto,
                $variacionTalla?->id_variacion_talla,
                $cantidad,
                $costoRespaldo
            );

            $costoUnitario = $cantidad > 0
                ? round($costeoFifo['costo_total'] / $cantidad, 6)
                : 0.0;

            DetalleVenta::create([
                'id_venta' => $venta->id_venta,
                'id_producto' => $producto->id_producto,
                'id_variacion_talla' => $variacionTalla?->id_variacion_talla,
                'descripcion_variacion' => $variacionTalla
                    ? trim(($variacionTalla->variacion->color ?? '').' · '.($variacionTalla->talla->talla ?? ''))
                    : null,
                'sku_variacion' => $variacionTalla?->sku,
                'cantidad_venta' => $cantidad,
                'precio_unitario_venta' => $precioSinImpuesto,
                'costo_unitario_venta' => $costoUnitario,
                'consumos_lotes' => $costeoFifo['consumos'],
                'subtotal_detalle_venta' => $subtotal,
                'porcentaje_impuesto' => (float) ($item->porcentaje_impuesto_pedido ?? 0),
                'monto_impuesto' => $impuesto,
            ]);

            $stockAntes = $variacionTalla ? $variacionTalla->stock : $producto->stock_actual;

            if ($stockAntes < $cantidad) {
                throw new \Exception("El producto '{$producto->nombre_producto}' ya no tiene existencias disponibles.");
            }

            if ($variacionTalla) {
                $actualizado = VariacionTalla::where('id_variacion_talla', $variacionTalla->id_variacion_talla)
                    ->where('stock', '>=', $cantidad)
                    ->decrement('stock', $cantidad);

                if (! $actualizado) {
                    $nombreTalla = $variacionTalla->talla->talla ?? 'seleccionada';
                    throw new \Exception("La talla '{$nombreTalla}' ya no tiene existencias disponibles.");
                }

                $producto->decrement('stock_actual', $cantidad);
                $stockResultante = $producto->fresh()->stock_actual;
            } else {
                $actualizado = Producto::where('id_producto', $producto->id_producto)
                    ->where('stock_actual', '>=', $cantidad)
                    ->decrement('stock_actual', $cantidad);

                if (! $actualizado) {
                    throw new \Exception("El producto '{$producto->nombre_producto}' ya no tiene existencias disponibles.");
                }

                $stockResultante = $producto->fresh()->stock_actual;
            }

            MovimientoInventario::create([
                'id_producto' => $producto->id_producto,
                'tipo_movimiento' => 'SALIDA',
                'cantidad_movimiento' => $cantidad,
                'stock_resultante' => $stockResultante,
                'motivo_movimiento' => 'Venta pedido web '.$pedido->numero_pedido,
                'id_referencia' => $venta->id_venta,
                'tipo_referencia' => 'VENTA',
                'precio_unitario' => $precioSinImpuesto,
                'id_usuario' => $idUsuario,
            ]);
        }

        $subtotalConEnvio = round($subtotalGeneral + (float) ($pedido->costo_envio_pedido ?? 0), 2);
        $totalGeneral = round(max($subtotalConEnvio + $impuestoGeneral - (float) ($pedido->descuento_pedido ?? 0), 0), 2);

        if (abs($totalGeneral - (float) $pedido->total_pedido) > 0.01) {
            $totalGeneral = (float) $pedido->total_pedido;
            $subtotalConEnvio = round($totalGeneral + (float) ($pedido->descuento_pedido ?? 0) - $impuestoGeneral, 2);
        }

        $venta->update([
            'subtotal_venta' => $subtotalConEnvio,
            'impuesto_venta' => $impuestoGeneral,
            'total_venta' => $totalGeneral,
            'monto_recibido' => $totalGeneral,
            'vuelto' => 0,
        ]);

        $etiquetaCanal = $esEfectivo
            ? ($ingresoEnCuenta ? 'Efectivo sin caja' : 'Efectivo en caja')
            : ($pedido->metodo_pago_web === 'lafise' ? 'Lafise' : 'Billetera móvil');

        $concepto = mb_substr('Ingreso pedido web '.$pedido->numero_pedido.' · '.$etiquetaCanal.' · '.$detalleCliente, 0, 255);

        if (! $ingresoEnCuenta) {
            MovimientoCaja::create([
                'id_caja' => $caja->id_caja,
                'tipo_movimiento_caja' => 'INGRESO',
                'concepto_movimiento_caja' => $concepto,
                'monto_movimiento_caja' => $totalGeneral,
                'id_usuario' => $idUsuario,
                'id_referencia' => $venta->id_venta,
            ]);
        } else {
            Cuenta::where('id_cuenta', $cuenta->id_cuenta)->increment('saldo_actual', $totalGeneral);

            MovimientoCuenta::create([
                'id_cuenta' => $cuenta->id_cuenta,
                'tipo_movimiento' => 'INGRESO',
                'monto' => $totalGeneral,
                'descripcion' => $concepto,
                'fecha' => now(),
                'id_usuario' => $idUsuario,
            ]);
        }

        DB::table('pedidos_web')->where('id_pedido', $idPedido)->update(['id_venta' => $venta->id_venta]);

        return true;
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
