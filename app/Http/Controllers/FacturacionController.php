<?php

namespace App\Http\Controllers;

use App\Models\Impuesto;
use App\Models\MetodoPago;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

use App\Models\Producto;
use App\Models\Cliente;
use App\Models\Venta;
use App\Models\DetalleVenta;
use App\Models\MovimientoCaja;
use App\Models\MovimientoInventario;
use App\Models\Caja;
use App\Models\Credenciales;
use App\Models\MetodoPagoCuenta;
use App\Models\Cuenta;
use App\Models\MovimientoCuenta;
use App\Models\VariacionTalla;

class FacturacionController extends Controller
{

/*  ╔════════ Mostrar Productos POS ══════════╗ 
    ╚═════════════════════════════════════════╝ */
    
    public function MostrarProductosPOS(Request $request)
    {
        try {

            $validator = Validator::make($request->all(), [
                'buscar' => 'nullable|string|max:150'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensajes' => $validator->errors()
                ], 400);
            }

            $query = Producto::with([
                    'impuesto',
                    'variaciones' => function ($variaciones) {
                        $variaciones->where('estado_variacion', 1)
                            ->with(['tallas.talla' => function ($tallas) {
                                $tallas->where('estado_talla', 1);
                            }]);
                    }
                ])
                ->where('estado_producto', 1);

            // 🔍 Buscador
            if ($request->filled('buscar')) {
                $query->where('nombre_producto', 'like', '%' . $request->buscar . '%');
            }

            $productos = $query->select(
                    'id_producto',
                    'nombre_producto',
                    'precio_venta',
                    'stock_actual',
                    'imagen_producto',
                    'id_impuesto' 
                )
                //->limit(20)
                ->get()
                ->flatMap(function ($p) {

                    $iva = $p->impuesto->porcentaje_impuesto ?? 0;

                    $precioConIVA = $p->precio_venta + ($p->precio_venta * ($iva / 100));

                    $producto = [
                        'id_producto'     => $p->id_producto,
                        'nombre_producto' => $p->nombre_producto,
                        'precio_venta'    => $p->precio_venta,
                        'precio_con_iva'  => round($precioConIVA, 2),
                        'iva'             => $iva,
                        'stock_actual'    => $p->stock_actual,
                        'imagen_producto' => $p->imagen_producto
                    ];

                    $variantes = $p->variaciones->flatMap(function ($variacion) use ($p, $iva, $precioConIVA) {
                        return $variacion->tallas->map(function ($variacionTalla) use ($p, $variacion, $iva, $precioConIVA) {
                            return [
                                'id_producto' => $p->id_producto,
                                'id_variacion_talla' => $variacionTalla->id_variacion_talla,
                                'nombre_producto' => $p->nombre_producto . ' · ' . $variacion->color . ' · ' . ($variacionTalla->talla->talla ?? 'Sin talla'),
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
                });

            return response()->json([
                'success' => true,
                'data' => $productos
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener productos',
                'detalle' => $e->getMessage()
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
                'estado' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensajes' => $validator->errors()
                ], 400);
            }

            // Consulta base
            $query = Cliente::query();

            // Filtrar por estado si se envía
            if ($request->has('estado')) {
                $query->where('estado_cliente', $request->estado);
            } else {
                // Por defecto, solo clientes activos
                $query->where('estado_cliente', 1);
            }

            $clientes = $query->orderBy('nombre_cliente', 'asc')->get();

            return response()->json([
                'success' => true,
                'total' => $clientes->count(),
                'data' => $clientes
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener los clientes',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

/*  ╔════════ Facturar Clientes POS ══════════╗ 
    ╚═════════════════════════════════════════╝ */

    public function FacturarProductosPOS(Request $request)
    {
        DB::beginTransaction();

        try {

            // 🔥 obtener caja abierta
            $caja = Caja::where('estado_caja', 1)->first();

            if (!$caja) {
                throw new \Exception('No hay caja abierta');
            }

           $numero = 'VTA-' . now()->format('Ymd') . '-' . str_pad((Venta::max('id_venta') + 1), 5, '0', STR_PAD_LEFT);

            $subtotalGeneral = 0;
            $impuestoGeneral = 0;
            $esLiquidacion = $request->boolean('liquidacion');

            if (
                $request->id_metodo_pago != 1 &&
                empty($request->id_cuenta)
            ) {
                throw new \Exception(
                    'Debe seleccionar una cuenta'
                );
            }

            // ⚠️ NO usar total del frontend
            $venta = Venta::create([
                'numero_factura' => $numero,
                'id_cliente' => $request->cliente,
                'id_usuario' => session('usuario.id'),
                'id_caja' => $caja->id_caja,
                'id_metodo_pago' => $request->id_metodo_pago,
                'id_cuenta' => $request->id_cuenta,
                'subtotal_venta' => 0,
                'impuesto_venta' => 0,
                'total_venta' => 0, // se actualiza después
                'monto_recibido' => $request->recibido,
                'vuelto' => 0
            ]);

            foreach ($request->carrito as $item) {

                $producto = Producto::with('impuesto')->find($item['id']);

                if (!$producto) {
                    throw new \Exception('Producto no encontrado');
                }

                $cantidad = (int) $item['cantidad'];
                if ($cantidad < 1) {
                    throw new \Exception('La cantidad debe ser al menos 1');
                }
                $variacionTalla = null;
                if (!empty($item['id_variacion_talla'])) {
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

                    if (!$variacionTalla) {
                        throw new \Exception('La variante seleccionada ya no está disponible');
                    }
                }

                $porcentaje = $producto->impuesto->porcentaje_impuesto ?? 0;

                if ($esLiquidacion && !isset($item['precio_venta_final'])) {
                    throw new \Exception('Debe indicar el precio de liquidación de cada producto');
                }

                // Precio de catálogo almacenado en BD antes del impuesto.
                $precioCatalogoSinImpuesto = $variacionTalla
                    ? ($variacionTalla->precio_venta ?? $producto->precio_venta)
                    : $producto->precio_venta;

                $precioSinImpuesto = $precioCatalogoSinImpuesto;
                $precioFinalAplicado = null;
                if (isset($item['precio_venta_final'])) {
                    $precioFinalSolicitado = filter_var($item['precio_venta_final'], FILTER_VALIDATE_FLOAT);
                    $factorImpuesto = 1 + ($porcentaje / 100);
                    $precioCatalogoFinal = round($precioCatalogoSinImpuesto * $factorImpuesto, 2);

                    if ($precioFinalSolicitado === false || $precioFinalSolicitado <= 0 || $factorImpuesto <= 0) {
                        throw new \Exception('El precio de liquidación no es válido');
                    }

                    if ($precioFinalSolicitado > $precioCatalogoFinal + 0.001) {
                        throw new \Exception('El precio de liquidación no puede superar el precio normal');
                    }

                    $precioFinalAplicado = round($precioFinalSolicitado, 2);
                    $precioSinImpuesto = round($precioFinalAplicado / $factorImpuesto, 2);
                }

                // 🔥 cálculo correcto
                $impuestoUnitario = $precioFinalAplicado !== null
                    ? round($precioFinalAplicado - $precioSinImpuesto, 2)
                    : $precioSinImpuesto * ($porcentaje / 100);

                $subtotal = round($precioSinImpuesto * $cantidad, 2);
                $impuesto = round($impuestoUnitario * $cantidad, 2);

                $subtotalGeneral += $subtotal;
                $impuestoGeneral += $impuesto;

                DetalleVenta::create([
                    'id_venta' => $venta->id_venta,
                    'id_producto' => $producto->id_producto,
                    'id_variacion_talla' => $variacionTalla?->id_variacion_talla,
                    'descripcion_variacion' => $variacionTalla
                        ? trim(($variacionTalla->variacion->color ?? '') . ' · ' . ($variacionTalla->talla->talla ?? ''))
                        : null,
                    'sku_variacion' => $variacionTalla?->sku,
                    'cantidad_venta' => $cantidad,
                    'precio_unitario_venta' => $precioSinImpuesto, // 🔥 SIN IVA
                    'subtotal_detalle_venta' => $subtotal,
                    'porcentaje_impuesto' => $porcentaje,
                    'monto_impuesto' => $impuesto
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

                    if (!$actualizado) {
                        $nombreTalla = $variacionTalla->talla->talla ?? 'seleccionada';
                        throw new \Exception("La talla '{$nombreTalla}' ya no tiene existencias disponibles");
                    }

                    $producto->decrement('stock_actual', $cantidad);
                    $stockResultante = $producto->fresh()->stock_actual;
                } else {
                    $actualizado = Producto::where('id_producto', $producto->id_producto)
                        ->where('stock_actual', '>=', $cantidad)
                        ->decrement('stock_actual', $cantidad);

                    if (!$actualizado) {
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
                        ? 'Venta despacho - ' . trim(($variacionTalla->variacion->color ?? '') . ' ' . ($variacionTalla->talla->talla ?? ''))
                        : 'Venta despacho realizada',
                    'id_referencia' => $venta->id_venta,
                    'tipo_referencia' => 'VENTA',
                    'precio_unitario' => $precioSinImpuesto,
                    'id_usuario' => session('usuario.id')
                ]);
            }

            // 🔥 TOTAL REAL calculado en backend
            $totalGeneral = $subtotalGeneral + $impuestoGeneral;

            if (!$esLiquidacion && (int) $request->id_metodo_pago === 1 && (float) $request->recibido + 0.001 < $totalGeneral) {
                throw new \Exception('El pago recibido es menor que el total de la venta');
            }

            $montoRecibido = $esLiquidacion && (int) $request->id_metodo_pago === 1
                ? $totalGeneral
                : (float) $request->recibido;

            $venta->update([
                'subtotal_venta' => $subtotalGeneral,
                'impuesto_venta' => $impuestoGeneral,
                'total_venta' => $totalGeneral,
                'monto_recibido' => $montoRecibido,
                'vuelto' => $montoRecibido - $totalGeneral
            ]);

            // 💰 movimiento caja
            if ($request->id_metodo_pago == 1) {

                MovimientoCaja::create([
                    'id_caja' => $caja->id_caja,
                    'tipo_movimiento_caja' => 'INGRESO',
                    'concepto_movimiento_caja' => 'Ingreso por ventas',
                    'monto_movimiento_caja' => $totalGeneral,
                    'id_usuario' => session('usuario.id'),
                    'id_referencia' => $venta->id_venta
                ]);

            } else {

               $cuenta = Cuenta::find($request->id_cuenta);

                if (!$cuenta) {
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
                    'descripcion' => 'Ingreso por venta #' . $venta->numero_factura,
                    'fecha' => now(),
                    'id_usuario' => session('usuario.id')
                ]);
            }

            DB::commit();

                return response()->json([
                    'success' => true,
                    'numero_factura' => $venta->numero_factura,
                    'cliente' => $venta->cliente,
                    'monto_recibido' => $venta->monto_recibido,
                    'vuelto' => $venta->vuelto,
                    'total' => $totalGeneral,
                    'productos' => $venta->detalles->map(function ($d) {
                        return [
                            'nombre' => $d->producto->nombre_producto
                                . ($d->descripcion_variacion ? ' · ' . $d->descripcion_variacion : '')
                                . ($d->sku_variacion ? ' · SKU: ' . $d->sku_variacion : ''),
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
                'linea' => $e->getLine()
            ]);
        }
    }


/*  ╔════════ Mostrar Metodo Pago POS ════════╗ 
    ╚═════════════════════════════════════════╝ */

    public function MostrarMetodoPagoPOS(Request $request)
    {
        try {

            $validator = Validator::make($request->all(), [
                'estado' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensajes' => $validator->errors()
                ], 400);
            }

            $query = MetodoPago::leftJoin(
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
                );

            if ($request->has('estado')) {
                $query->where(
                    'metodos_pago.estado_metodo_pago',
                    $request->estado
                );
            } else {
                $query->where(
                    'metodos_pago.estado_metodo_pago',
                    1
                );
            }

            $query->where(function ($q) {

                // Siempre mostrar efectivo
                $q->where('metodos_pago.id_metodo_pago', 1)

                // O métodos con cuentas activas
                ->orWhere(function ($sub) {
                    $sub->where('metodo_pago_cuenta.estado', 1);
                });
            });

            $metodosPago = $query->select(
                    'metodos_pago.id_metodo_pago',
                    'metodos_pago.nombre_metodo_pago',
                    'metodo_pago_cuenta.id_metodo_pago_cuenta',
                    'cuentas.id_cuenta',
                    'cuentas.nombre_cuenta'
                )
                ->orderBy('metodos_pago.nombre_metodo_pago')
                ->orderBy('cuentas.nombre_cuenta')
                ->get();

            return response()->json([
                'success' => true,
                'total' => $metodosPago->count(),
                'data' => $metodosPago
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener los métodos de pago',
                'detalle' => $e->getMessage()
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

            if (!$producto) {
                return response()->json([
                    'ok' => false,
                    'mensaje' => "Producto no encontrado"
                ]);
            }

            $variacionTalla = !empty($item['id_variacion_talla'])
                ? VariacionTalla::with(['variacion', 'talla'])
                    ->where('id_variacion_talla', $item['id_variacion_talla'])
                    ->whereHas('variacion', function ($query) use ($producto) {
                        $query->where('id_producto', $producto->id_producto)
                            ->where('estado_variacion', 1);
                    })->first()
                : null;

            if (!empty($item['id_variacion_talla']) && !$variacionTalla) {
                return response()->json(['ok' => false, 'mensaje' => 'La variante seleccionada ya no está disponible']);
            }

            $stock = $variacionTalla ? $variacionTalla->stock : $producto->stock_actual;
            if ($stock < $item['cantidad']) {
                return response()->json([
                    'ok' => false,
                    'mensaje' => "El producto '{$producto->nombre_producto}'" . ($variacionTalla ? ' (' . $variacionTalla->variacion->color . ' · ' . $variacionTalla->talla->talla . ')' : '') . ' ya no tiene existencias, por favor actualice el stock mostrado',
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
                'tasa' => $config ? (float) $config->tipo_cambio : 0
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al obtener tipo de cambio',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function MostrarCredencialesPOS()
    {
        try {
            $config = Credenciales::first();

            return response()->json([
                'success' => true,
                'data' => $config
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener configuración',
                'error' => $e->getMessage()
            ], 500);
        }
    }

}
