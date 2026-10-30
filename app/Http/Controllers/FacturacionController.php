<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Cliente;
use App\Models\Credenciales;
use App\Models\Cuenta;
use App\Models\CuotaVenta;
use App\Models\DetalleVenta;
use App\Models\Impuesto;
use App\Models\MetodoPago;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuenta;
use App\Models\MovimientoInventario;
use App\Models\PlanPago;
use App\Models\Producto;
use App\Models\VariacionTalla;
use App\Models\Venta;
use App\Services\CosteoInventarioService;
use App\Services\RegistrarPagoVenta;
use App\Services\TicketEscPosService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class FacturacionController extends Controller
{
    /*  ╔════════ Mostrar Productos POS ══════════╗
        ╚═════════════════════════════════════════╝ */

    public function MostrarProductosPOS(Request $request)
    {
        try {

            $validator = Validator::make($request->all(), [
                'buscar' => 'nullable|string|max:150',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensajes' => $validator->errors(),
                ], 400);
            }

            $buscar = (string) $request->input('buscar', '');

            // Supabase responde cada consulta en ~230 ms: el catálogo se guarda
            // unos segundos en caché para que el POS no espere en cada carga.
            $clave = 'pos.productos.'.md5($buscar);

            $productos = Cache::remember(
                $clave,
                now()->addSeconds((int) env('POS_CACHE_PRODUCTOS', 30)),
                function () use ($request) {
                    $query = Producto::with([
                        'impuesto',
                        'variaciones' => function ($variaciones) {
                            $variaciones->where('estado_variacion', 1)
                                ->with(['tallas.talla' => function ($tallas) {
                                    $tallas->where('estado_talla', 1);
                                }]);
                        },
                    ])
                        ->where('estado_producto', 1);

                    // 🔍 Buscador
                    if ($request->filled('buscar')) {
                        $query->where('nombre_producto', 'like', '%'.$request->buscar.'%');
                    }

                    return $query->select(
                        'id_producto',
                        'nombre_producto',
                        'precio_venta',
                        'stock_actual',
                        'imagen_producto',
                        'id_impuesto'
                    )
                        ->get()
                        ->flatMap(function ($p) {

                            $iva = $p->impuesto->porcentaje_impuesto ?? 0;

                            $precioConIVA = $p->precio_venta + ($p->precio_venta * ($iva / 100));

                            $producto = [
                                'id_producto' => $p->id_producto,
                                'nombre_producto' => $p->nombre_producto,
                                'precio_venta' => $p->precio_venta,
                                'precio_con_iva' => round($precioConIVA, 2),
                                'iva' => $iva,
                                'stock_actual' => $p->stock_actual,
                                'imagen_producto' => $p->imagen_producto,
                            ];

                            $variantes = $p->variaciones->flatMap(function ($variacion) use ($p, $iva) {
                                return $variacion->tallas->map(function ($variacionTalla) use ($p, $variacion, $iva) {
                                    return [
                                        'id_producto' => $p->id_producto,
                                        'id_variacion_talla' => $variacionTalla->id_variacion_talla,
                                        'nombre_producto' => $p->nombre_producto.' · '.$variacion->color.' · '.($variacionTalla->talla->talla ?? 'Sin talla'),
                                        'precio_venta' => $variacionTalla->precio_venta ?? $p->precio_venta,
                                        'precio_con_iva' => round(($variacionTalla->precio_venta ?? $p->precio_venta) * (1 + ($iva / 100)), 2),
                                        'iva' => $iva,
                                        'stock_actual' => $variacionTalla->stock,
                                        'imagen_producto' => $p->imagen_producto,
                                        'es_variacion' => true,
                                        'sku' => $variacionTalla->sku,
                                    ];
                                })->all();
                            });

                            return $variantes->isNotEmpty() ? $variantes->values()->all() : [$producto];
                        })
                        ->toArray();
                }
            );

            return response()->json([
                'success' => true,
                'data' => $productos,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener productos',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔════════ Mostrar Clientes POS ═══════════╗
        ╚═════════════════════════════════════════╝ */

    public function MostrarClientesPOS(Request $request)
    {
        try {

            // Validar parámetros opcionales
            $validator = Validator::make($request->all(), [
                'estado' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensajes' => $validator->errors(),
                ], 400);
            }

            // Consulta base
            $estado = $request->has('estado') ? (int) $request->estado : 1;

            $clientes = Cache::remember(
                'pos.clientes.'.$estado,
                now()->addSeconds(60),
                fn () => Cliente::where('estado_cliente', $estado)
                    ->orderBy('nombre_cliente', 'asc')
                    ->get()
            );

            return response()->json([
                'success' => true,
                'total' => $clientes->count(),
                'data' => $clientes,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener los clientes',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔════════ Facturar Clientes POS ══════════╗
        ╚═════════════════════════════════════════╝ */

    public function FacturarProductosPOS(Request $request)
    {
        DB::beginTransaction();

        try {

            $esPagoPlazos = $request->boolean('pago_plazos');
            $abonoInicial = round((float) $request->input('abono_inicial', 0), 2);
            $descuentoCliente = round((float) $request->input('descuento_venta', 0), 2);
            $idUsuario = (int) session('usuario.id');
            $caja = null;

            if ($abonoInicial < 0) {
                throw new \Exception('El abono inicial no puede ser negativo.');
            }

            if ($descuentoCliente < 0) {
                throw new \Exception('El descuento del cliente no puede ser negativo.');
            }

            if (! $esPagoPlazos || $abonoInicial > 0) {
                $caja = Caja::where('estado_caja', 1)
                    ->where('id_usuario', $idUsuario)
                    ->lockForUpdate()
                    ->first();

                if (! $caja) {
                    throw new \Exception('Abre tu caja para registrar una venta o recibir un abono.');
                }
            }

            if ($esPagoPlazos) {
                $validator = Validator::make($request->all(), [
                    'cliente' => 'required|integer|exists:clientes,id_cliente',
                    'cuotas' => 'required|array|min:1|max:60',
                    'cuotas.*.fecha_vencimiento' => 'required|date|after_or_equal:today',
                    'cuotas.*.monto_cuota' => 'required|numeric|gt:0',
                    'abono_inicial' => 'nullable|numeric|min:0',
                    'descuento_venta' => 'nullable|numeric|min:0',
                ]);

                if ($validator->fails()) {
                    throw new \Exception($validator->errors()->first());
                }

                if (! Cliente::where('id_cliente', $request->cliente)->where('estado_cliente', 1)->exists()) {
                    throw new \Exception('Selecciona un cliente activo para crear el plan de pagos.');
                }
            }

            $numero = 'VTA-'.now()->format('Ymd').'-'.str_pad((Venta::max('id_venta') + 1), 5, '0', STR_PAD_LEFT);

            $subtotalGeneral = 0;
            $impuestoGeneral = 0;
            $esLiquidacion = $request->boolean('liquidacion');

            if (! $esPagoPlazos && (
                $request->id_metodo_pago != 1 &&
                empty($request->id_cuenta)
            )) {
                throw new \Exception(
                    'Debe seleccionar una cuenta'
                );
            }

            // ⚠️ NO usar total del frontend
            $venta = Venta::create([
                'numero_factura' => $numero,
                'id_cliente' => $request->cliente,
                'id_usuario' => $idUsuario,
                'id_caja' => $esPagoPlazos ? null : $caja->id_caja,
                'id_metodo_pago' => $esPagoPlazos ? null : $request->id_metodo_pago,
                'id_cuenta' => $esPagoPlazos ? null : $request->id_cuenta,
                'subtotal_venta' => 0,
                'impuesto_venta' => 0,
                'descuento_venta' => $descuentoCliente,
                'total_venta' => 0, // se actualiza después
                'monto_recibido' => $esPagoPlazos ? 0 : $request->recibido,
                'vuelto' => 0,
            ]);

            foreach ($request->carrito as $item) {

                $producto = Producto::with('impuesto')->find($item['id']);

                if (! $producto) {
                    throw new \Exception('Producto no encontrado');
                }

                $cantidad = (int) $item['cantidad'];
                if ($cantidad < 1) {
                    throw new \Exception('La cantidad debe ser al menos 1');
                }
                $variacionTalla = null;
                if (! empty($item['id_variacion_talla'])) {
                    $variacionTalla = VariacionTalla::with(['variacion', 'talla'])
                        ->where('id_variacion_talla', $item['id_variacion_talla'])
                        ->whereHas('variacion', function ($query) use ($producto) {
                            $query->where('id_producto', $producto->id_producto)
                                ->where('estado_variacion', 1);
                        })
                        ->whereHas('talla', function ($query) {
                            $query->where('estado_talla', 1);
                        })
                        ->lockForUpdate()
                        ->first();

                    if (! $variacionTalla) {
                        throw new \Exception('La variante seleccionada ya no está disponible');
                    }
                }

                $porcentaje = $producto->impuesto->porcentaje_impuesto ?? 0;

                if ($esLiquidacion && ! isset($item['precio_venta_final'])) {
                    throw new \Exception('Debe indicar el precio de liquidación de cada producto');
                }

                // Precio de catálogo almacenado en BD antes del impuesto.
                $precioCatalogoSinImpuesto = $variacionTalla
                    ? ($variacionTalla->precio_venta ?? $producto->precio_venta)
                    : $producto->precio_venta;

                $factorImpuesto = 1 + ($porcentaje / 100);

                // 💵 PRECIO FINAL unitario = lo que paga el cliente (base + impuesto).
                $precioFinalUnitario = (float) $precioCatalogoSinImpuesto * $factorImpuesto;
                $precioFinalAplicado = null;

                if (isset($item['precio_venta_final'])) {
                    $precioFinalSolicitado = filter_var($item['precio_venta_final'], FILTER_VALIDATE_FLOAT);

                    if ($precioFinalSolicitado === false || $precioFinalSolicitado <= 0 || $factorImpuesto <= 0) {
                        throw new \Exception('El precio de liquidación no es válido');
                    }

                    if ($precioFinalSolicitado > round($precioFinalUnitario, 2) + 0.001) {
                        throw new \Exception('El precio de liquidación no puede superar el precio normal');
                    }

                    $precioFinalAplicado = round($precioFinalSolicitado, 2);
                    $precioFinalUnitario = $precioFinalAplicado;
                }

                $precioFinalUnitario = round($precioFinalUnitario, 2);

                // 🧾 El impuesto se calcula sobre el PRECIO FINAL y la base sale por
                // resta: así base + impuesto = precio final exacto y no quedan centavos
                // fantasma (1,000 con IVA 15 % → 869.57 + 130.43 = 1,000.00).
                $impuestoUnitario = $factorImpuesto > 0
                    ? round($precioFinalUnitario * ($porcentaje / 100) / $factorImpuesto, 2)
                    : 0.0;

                $precioSinImpuesto = round($precioFinalUnitario - $impuestoUnitario, 2);

                $subtotal = round($precioSinImpuesto * $cantidad, 2);
                $impuesto = round($impuestoUnitario * $cantidad, 2);

                $subtotalGeneral += $subtotal;
                $impuestoGeneral += $impuesto;

                // 📸 COSTO HISTÓRICO (FIFO/PEPS): consume primero los lotes más
                // antiguos y congela el costo REAL de las unidades vendidas.
                $costoRespaldo = (float) ($variacionTalla
                    ? ($variacionTalla->precio_compra ?? $producto->precio_compra ?? 0)
                    : ($producto->precio_compra ?? 0));

                $costeoFifo = app(CosteoInventarioService::class)->consumir(
                    $producto->id_producto,
                    $variacionTalla?->id_variacion_talla,
                    $cantidad,
                    $costoRespaldo
                );

                // Se guarda con 6 decimales porque una línea puede consumir VARIOS
                // lotes: redondear aquí a 2 desviaba el total de la línea
                // (4,800 / 7 = 685.71 → 7 × 685.71 = 4,799.97).
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
                    'precio_unitario_venta' => $precioSinImpuesto, // 🔥 SIN IVA
                    'costo_unitario_venta' => $costoUnitario, // 📸 Costo histórico FIFO
                    'consumos_lotes' => $costeoFifo['consumos'],
                    'subtotal_detalle_venta' => $subtotal,
                    'porcentaje_impuesto' => $porcentaje,
                    'monto_impuesto' => $impuesto,
                ]);

                // 📦 stock
                $stockAntes = $variacionTalla ? $variacionTalla->stock : $producto->stock_actual;
                $stockDespues = $stockAntes - $cantidad;

                // if ($stockDespues < 0) {
                //     throw new \Exception("Stock insuficiente para {$producto->nombre_producto}");
                // }

                if ($stockAntes < $cantidad) {
                    throw new \Exception("El producto '{$producto->nombre_producto}' ya no tiene existencias disponibles");
                }

                if ($variacionTalla) {
                    $actualizado = VariacionTalla::where('id_variacion_talla', $variacionTalla->id_variacion_talla)
                        ->where('stock', '>=', $cantidad)
                        ->decrement('stock', $cantidad);

                    if (! $actualizado) {
                        $nombreTalla = $variacionTalla->talla->talla ?? 'seleccionada';
                        throw new \Exception("La talla '{$nombreTalla}' ya no tiene existencias disponibles");
                    }

                    $producto->decrement('stock_actual', $cantidad);
                    $stockResultante = $producto->fresh()->stock_actual;
                } else {
                    $actualizado = Producto::where('id_producto', $producto->id_producto)
                        ->where('stock_actual', '>=', $cantidad)
                        ->decrement('stock_actual', $cantidad);

                    if (! $actualizado) {
                        throw new \Exception("El producto '{$producto->nombre_producto}' ya no tiene existencias disponibles");
                    }

                    $stockResultante = $producto->fresh()->stock_actual;
                }

                MovimientoInventario::create([
                    'id_producto' => $producto->id_producto,
                    'tipo_movimiento' => 'SALIDA',
                    'cantidad_movimiento' => $cantidad,
                    'stock_resultante' => $stockResultante,
                    'motivo_movimiento' => $variacionTalla
                        ? 'Venta despacho - '.trim(($variacionTalla->variacion->color ?? '').' '.($variacionTalla->talla->talla ?? ''))
                        : 'Venta despacho realizada',
                    'id_referencia' => $venta->id_venta,
                    'tipo_referencia' => 'VENTA',
                    'precio_unitario' => $precioSinImpuesto,
                    'id_usuario' => session('usuario.id'),
                ]);
            }

            // 🔥 TOTAL REAL calculado en backend
            $totalGeneral = max($subtotalGeneral + $impuestoGeneral - $descuentoCliente, 0);
            if ($descuentoCliente > ($subtotalGeneral + $impuestoGeneral) + 0.001) {
                throw new \Exception('El descuento no puede ser mayor que el total de la venta.');
            }

            if ($esPagoPlazos) {
                $centavosCuotas = array_sum(array_map(
                    fn ($cuota) => (int) round(((float) $cuota['monto_cuota']) * 100),
                    $request->cuotas
                ));
                $totalCentavos = (int) round($totalGeneral * 100);
                $abonoInicialCentavos = (int) round($abonoInicial * 100);

                if ($abonoInicialCentavos >= $totalCentavos) {
                    throw new \Exception('El abono inicial debe ser menor que el total para crear un plan de pagos.');
                }

                if ($centavosCuotas !== $totalCentavos - $abonoInicialCentavos) {
                    throw new \Exception('La suma de las cuotas debe ser igual al saldo después del abono inicial.');
                }

                $venta->update([
                    'subtotal_venta' => $subtotalGeneral,
                    'impuesto_venta' => $impuestoGeneral,
                    'descuento_venta' => $descuentoCliente,
                    'total_venta' => $totalGeneral,
                    'monto_recibido' => $abonoInicial,
                    'vuelto' => 0,
                ]);

                $plan = PlanPago::create([
                    'id_venta' => $venta->id_venta,
                    'id_usuario' => $idUsuario,
                ]);

                foreach ($request->cuotas as $indice => $cuota) {
                    CuotaVenta::create([
                        'id_plan_pago' => $plan->id_plan_pago,
                        'numero_cuota' => $indice + 1,
                        'fecha_vencimiento' => $cuota['fecha_vencimiento'],
                        'monto_cuota' => round((float) $cuota['monto_cuota'], 2),
                    ]);
                }

                if ($abonoInicial > 0) {
                    app(RegistrarPagoVenta::class)->registrar(
                        $venta->id_venta,
                        $abonoInicial,
                        (int) $request->input('id_metodo_pago'),
                        $request->filled('id_cuenta') ? (int) $request->id_cuenta : null,
                        $idUsuario,
                        $request->input('referencia_pago')
                    );
                }
            } else {
                if (! $esLiquidacion && (int) $request->id_metodo_pago === 1 && (float) $request->recibido + 0.001 < $totalGeneral) {
                    throw new \Exception('El pago recibido es menor que el total de la venta');
                }

                $montoRecibido = $esLiquidacion && (int) $request->id_metodo_pago === 1
                    ? $totalGeneral
                    : (float) $request->recibido;

                $venta->update([
                    'subtotal_venta' => $subtotalGeneral,
                    'impuesto_venta' => $impuestoGeneral,
                    'descuento_venta' => $descuentoCliente,
                    'total_venta' => $totalGeneral,
                    'monto_recibido' => $montoRecibido,
                    'vuelto' => $montoRecibido - $totalGeneral,
                ]);

                // 💰 movimiento caja
                if ($request->id_metodo_pago == 1) {

                    MovimientoCaja::create([
                        'id_caja' => $caja->id_caja,
                        'tipo_movimiento_caja' => 'INGRESO',
                        'concepto_movimiento_caja' => 'Ingreso por ventas',
                        'monto_movimiento_caja' => $totalGeneral,
                        'id_usuario' => session('usuario.id'),
                        'id_referencia' => $venta->id_venta,
                    ]);

                } else {

                    $cuenta = Cuenta::find($request->id_cuenta);

                    if (! $cuenta) {
                        throw new \Exception('La cuenta seleccionada no existe');
                    }

                    $cuenta->increment(
                        'saldo_actual',
                        $totalGeneral
                    );

                    MovimientoCuenta::create([
                        'id_cuenta' => $cuenta->id_cuenta,
                        'tipo_movimiento' => 'INGRESO',
                        'monto' => $totalGeneral,
                        'descripcion' => 'Ingreso por venta #'.$venta->numero_factura,
                        'fecha' => now(),
                        'id_usuario' => session('usuario.id'),
                    ]);
                }
            }

            DB::commit();

            // El stock cambió: se invalida el catálogo cacheado del POS.
            Cache::forget('pos.productos.'.md5(''));

            return response()->json([
                'success' => true,
                'numero_factura' => $venta->numero_factura,
                'cliente' => $venta->cliente,
                'monto_recibido' => $venta->monto_recibido,
                'vuelto' => $venta->vuelto,
                'total' => $totalGeneral,
                'pago_plazos' => $esPagoPlazos,
                'saldo_pendiente' => $esPagoPlazos ? round($totalGeneral - $abonoInicial, 2) : 0,
                'productos' => $venta->detalles->map(function ($d) {
                    return [
                        'nombre' => $d->producto->nombre_producto
                            .($d->descripcion_variacion ? ' · '.$d->descripcion_variacion : '')
                            .($d->sku_variacion ? ' · SKU: '.$d->sku_variacion : ''),
                        'cantidad' => $d->cantidad_venta,
                        'precio' => $d->precio_unitario_venta,
                        'impuesto' => $d->monto_impuesto,
                        'subtotal' => $d->subtotal_detalle_venta,
                        'total' => $d->subtotal_detalle_venta + $d->monto_impuesto,
                    ];
                }),
            ]);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'linea' => $e->getLine(),
            ]);
        }
    }

    /*  ╔════════ Mostrar Metodo Pago POS ════════╗
        ╚═════════════════════════════════════════╝ */

    public function MostrarMetodoPagoPOS(Request $request)
    {
        try {

            $validator = Validator::make($request->all(), [
                'estado' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensajes' => $validator->errors(),
                ], 400);
            }

            $estado = $request->has('estado') ? (int) $request->estado : 1;

            $metodosPago = Cache::remember(
                'pos.metodos.'.$estado,
                now()->addMinutes(5),
                function () use ($estado) {
                    return MetodoPago::leftJoin(
                        'metodo_pago_cuenta',
                        'metodos_pago.id_metodo_pago',
                        '=',
                        'metodo_pago_cuenta.id_metodo_pago'
                    )
                        ->leftJoin(
                            'cuentas',
                            'metodo_pago_cuenta.id_cuenta',
                            '=',
                            'cuentas.id_cuenta'
                        )
                        ->where('metodos_pago.estado_metodo_pago', $estado)
                        ->where(function ($q) {
                            // Siempre mostrar efectivo
                            $q->where('metodos_pago.id_metodo_pago', 1)
                                // O métodos con cuentas activas
                                ->orWhere(function ($sub) {
                                    $sub->where('metodo_pago_cuenta.estado', 1);
                                });
                        })
                        ->select(
                            'metodos_pago.id_metodo_pago',
                            'metodos_pago.nombre_metodo_pago',
                            'metodo_pago_cuenta.id_metodo_pago_cuenta',
                            'cuentas.id_cuenta',
                            'cuentas.nombre_cuenta'
                        )
                        ->orderBy('metodos_pago.nombre_metodo_pago')
                        ->orderBy('cuentas.nombre_cuenta')
                        ->get();
                }
            );

            return response()->json([
                'success' => true,
                'total' => $metodosPago->count(),
                'data' => $metodosPago,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener los métodos de pago',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═══════ Validar Stock Carrito POS ═══════╗
        ╚═════════════════════════════════════════╝ */

    public function ValidarStockCarrito(Request $request)
    {
        $productos = Producto::whereIn('id_producto', collect($request->carrito)->pluck('id'))
            ->get()
            ->keyBy('id_producto');

        foreach ($request->carrito as $item) {

            $producto = $productos[$item['id']] ?? null;

            if (! $producto) {
                return response()->json([
                    'ok' => false,
                    'mensaje' => 'Producto no encontrado',
                ]);
            }

            $variacionTalla = ! empty($item['id_variacion_talla'])
                ? VariacionTalla::with(['variacion', 'talla'])
                    ->where('id_variacion_talla', $item['id_variacion_talla'])
                    ->whereHas('variacion', function ($query) use ($producto) {
                        $query->where('id_producto', $producto->id_producto)
                            ->where('estado_variacion', 1);
                    })->first()
                : null;

            if (! empty($item['id_variacion_talla']) && ! $variacionTalla) {
                return response()->json(['ok' => false, 'mensaje' => 'La variante seleccionada ya no está disponible']);
            }

            $stock = $variacionTalla ? $variacionTalla->stock : $producto->stock_actual;
            if ($stock < $item['cantidad']) {
                return response()->json([
                    'ok' => false,
                    'mensaje' => "El producto '{$producto->nombre_producto}'".($variacionTalla ? ' ('.$variacionTalla->variacion->color.' · '.$variacionTalla->talla->talla.')' : '').' ya no tiene existencias, por favor actualice el stock mostrado',
                    'stock' => $stock,
                    'id' => $producto->id_producto,
                    'id_variacion_talla' => $variacionTalla?->id_variacion_talla,
                ]);
            }
        }

        return response()->json(['ok' => true]);
    }

    /*  ╔═══════════ Mostrar Tipo de cambio ════════════╗
        ╚═══════════════════════════════════════════════╝ */

    public function MostrarTipoCambio()
    {
        try {
            $config = Credenciales::first();

            return response()->json([
                'success' => true,
                'tasa' => $config ? (float) $config->tipo_cambio : 0,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al obtener tipo de cambio',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function MostrarCredencialesPOS()
    {
        try {
            $config = Cache::remember('pos.credenciales', now()->addMinutes(10), fn () => Credenciales::first());

            return response()->json([
                'success' => true,
                'data' => $config,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener configuración',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔════════ Imprimir Ticket Termico ════════╗
        ╚═════════════════════════════════════════╝ */

    public function ImprimirTicketTermico(Request $request)
    {
        try {

            $validator = Validator::make($request->all(), [
                'numero_factura' => 'required|max:80',
            ], [
                'required' => 'El campo :attribute es obligatorio.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            // El POS envía "productos" y el módulo de ventas "detalles".
            $productos = $request->input('productos')
                ?? $request->input('detalles')
                ?? $request->input('detalle');

            if (! is_array($productos) || $productos === []) {
                return response()->json([
                    'success' => false,
                    'errors' => ['productos' => ['El ticket debe tener al menos un producto.']],
                ], 422);
            }

            $empresa = Credenciales::first();

            // Se toman los datos reales de la venta guardada: así el ticket sale
            // igual desde el POS y desde el historial (totales, fecha, cajero y
            // forma de pago siempre coinciden con la factura emitida).
            $datos = $request->all();

            $venta = Venta::with(['cliente', 'usuario', 'metodoPago', 'detalles.producto'])
                ->where('numero_factura', $datos['numero_factura'])
                ->first();

            if ($venta) {
                // Se descartan los ítems que envía el navegador: el POS manda
                // "productos" con el nombre ya mezclado (nombre · variación · SKU)
                // y ese arreglo tiene prioridad sobre "detalles". Al quitarlo, el
                // ticket usa siempre los detalles reales de la venta.
                unset($datos['productos'], $datos['detalle']);

                $datos = array_merge($datos, [
                    'fecha_venta' => $venta->fecha_venta,
                    'cliente' => $venta->cliente?->toArray(),
                    'usuario' => $venta->usuario?->toArray(),
                    'metodo_pago' => $venta->metodoPago?->toArray(),
                    'subtotal_venta' => $venta->subtotal_venta,
                    'impuesto_venta' => $venta->impuesto_venta,
                    'descuento_venta' => $venta->descuento_venta,
                    'total_venta' => $venta->total_venta,
                    'monto_recibido' => $venta->monto_recibido,
                    'vuelto' => $venta->vuelto,
                    'detalles' => $venta->detalles->toArray(),
                ]);
            }

            $enviado = app(TicketEscPosService::class)->imprimir(
                $datos,
                $empresa?->toArray()
            );

            if (! $enviado) {
                return response()->json([
                    'success' => false,
                    'error' => 'La impresora no respondió. Verifique que esté encendida y conectada.',
                ], 500);
            }

            return response()->json([
                'success' => true,
                'mensaje' => 'Ticket enviado a la impresora.',
            ]);

        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
