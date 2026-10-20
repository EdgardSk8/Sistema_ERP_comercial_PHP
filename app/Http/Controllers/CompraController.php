<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Compra;
use App\Models\Cuenta;
use App\Models\DetalleCompra;
use App\Models\LoteInventario;
use App\Models\Medida;
use App\Models\MetodoPago;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuenta;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\TipoFactura;
use App\Models\VariacionTalla;
use App\Services\CosteoInventarioService;
use App\Support\DataTableServidor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CompraController extends Controller
{
    /*  ╔═══════════ Registrar Compra ════════════╗
        ╚═════════════════════════════════════════╝ */
    public function RegistrarCompra(Request $request)
    {
        DB::beginTransaction();

        try {
            // =====================
            // 1️⃣ VALIDACIÓN
            // =====================
            $validator = Validator::make($request->all(), [
                'proveedor' => 'required|exists:proveedores,id_proveedor',
                'metodo_pago' => 'nullable|exists:metodos_pago,id_metodo_pago',
                'tipo_factura' => 'nullable|exists:tipos_factura,id_tipo_factura',
                'caja' => 'nullable|exists:cajas,id_caja',
                'cuenta' => 'nullable|exists:cuentas,id_cuenta',
                'carrito' => 'required|array|min:1',
                'carrito.*.id' => 'required|exists:productos,id_producto',
                'carrito.*.id_variacion_talla' => 'nullable|exists:variacion_tallas,id_variacion_talla',
                'carrito.*.cantidad' => 'required|numeric|min:1',
                'carrito.*.precio' => 'required|numeric|min:0',
            ]);

            if ($validator->fails()) {
                // Para toast, devolvemos solo el primer error o un mensaje general
                $mensaje = $validator->errors()->first() ?? 'Datos inválidos';

                return response()->json([
                    'success' => false,
                    'mensaje' => $mensaje,
                ], 422);
            }

            // =====================
            // 2️⃣ VALIDAR FUENTE DE PAGO
            // =====================
            $usaCaja = $request->filled('caja');
            $usaCuenta = $request->filled('cuenta');

            if (! $usaCaja && ! $usaCuenta) {
                return response()->json(['success' => false, 'mensaje' => 'Debe seleccionar caja o cuenta'], 422);
            }

            if ($usaCaja && $usaCuenta) {
                return response()->json(['success' => false, 'mensaje' => 'No puede pagar con caja y cuenta al mismo tiempo'], 422);
            }

            // =====================
            // 3️⃣ CALCULAR SUBTOTAL Y TOTAL
            // =====================
            $subtotalGeneral = 0;
            foreach ($request->carrito as $item) {
                $producto = Producto::find($item['id']);
                if (! $producto) {
                    return response()->json(['success' => false, 'mensaje' => 'Producto no encontrado: '.$item['id']], 422);
                }
                $subtotalGeneral += $item['precio'] * $item['cantidad'];
            }

            $descuento = $request->descuento ?? 0;
            $impuesto = $request->impuesto ?? 0;
            $totalCalculado = $subtotalGeneral - $descuento + $impuesto;

            if ($totalCalculado < 0) {
                return response()->json(['success' => false, 'mensaje' => 'Total inválido'], 422);
            }

            // =====================
            // 4️⃣ CREAR COMPRA
            // =====================
            $compra = Compra::create([
                'numero_factura_compra' => $request->numero_factura,
                'id_proveedor' => $request->proveedor,
                'id_usuario' => session('usuario.id'),
                'id_caja' => $usaCaja ? $request->caja : null,
                'id_cuenta' => $usaCuenta ? $request->cuenta : null,
                'id_metodo_pago' => $request->metodo_pago,
                'id_tipo_factura' => $request->tipo_factura,
                'subtotal_compra' => $subtotalGeneral,
                'descuento_compra' => $descuento,
                'impuesto_compra' => $impuesto,
                'total_compra' => $totalCalculado,
            ]);

            // =====================
            // 5️⃣ DETALLES, STOCK Y KARDEX
            // =====================
            foreach ($request->carrito as $item) {
                $producto = Producto::where('id_producto', $item['id'])->lockForUpdate()->first();
                $cantidad = $item['cantidad'];
                $precio = $item['precio'];
                $variacionTalla = null;
                if (! empty($item['id_variacion_talla'])) {
                    $variacionTalla = VariacionTalla::with(['variacion', 'talla'])
                        ->where('id_variacion_talla', $item['id_variacion_talla'])
                        ->whereHas('variacion', function ($query) use ($producto) {
                            $query->where('id_producto', $producto->id_producto)
                                ->where('estado_variacion', 1);
                        })->lockForUpdate()->first();
                    if (! $variacionTalla) {
                        throw new \Exception('La variante seleccionada ya no está disponible');
                    }
                }

                $detalleCompra = DetalleCompra::create([
                    'id_compra' => $compra->id_compra,
                    'id_producto' => $producto->id_producto,
                    'id_variacion_talla' => $variacionTalla?->id_variacion_talla,
                    'descripcion_variacion' => $variacionTalla
                        ? trim(($variacionTalla->variacion->color ?? '').' · '.($variacionTalla->talla->talla ?? ''))
                        : null,
                    'sku_variacion' => $variacionTalla?->sku,
                    'cantidad_compra' => $cantidad,
                    'precio_unitario_compra' => $precio,
                    'subtotal_detalle_compra' => $precio * $cantidad,
                ]);

                // 📦 Stock: solo se mueve la existencia. El precio de compra del
                // catálogo NO se modifica (queda como referencia del usuario).
                if ($variacionTalla) {
                    $variacionTalla->increment('stock', $cantidad);
                    $stockResultante = $variacionTalla->fresh()->stock;
                } else {
                    $producto->increment('stock_actual', $cantidad);
                    $stockResultante = $producto->fresh()->stock_actual;
                }

                // 🧾 LOTE FIFO: la compra entra como un lote con su costo real, para
                // que al vender la ganancia use el costo verdadero de cada unidad.
                app(CosteoInventarioService::class)->registrarLote(
                    $producto->id_producto,
                    $variacionTalla?->id_variacion_talla,
                    (int) $cantidad,
                    (float) $precio,
                    $detalleCompra->id_detalle_compra,
                    session('usuario.id')
                );

                // Registrar KARDEX
                MovimientoInventario::create([
                    'id_producto' => $producto->id_producto,
                    'tipo_movimiento' => 'ENTRADA',
                    'cantidad_movimiento' => $cantidad,
                    'stock_resultante' => $stockResultante,
                    'motivo_movimiento' => $variacionTalla
                        ? 'Reabastecimiento - '.trim(($variacionTalla->variacion->color ?? '').' '.($variacionTalla->talla->talla ?? ''))
                        : 'Reabastecimiento de productos',
                    'id_referencia' => $compra->id_compra,
                    'tipo_referencia' => 'COMPRA',
                    'precio_unitario' => $precio,
                    'id_usuario' => session('usuario.id'),
                ]);
            }

            // VALIDACION DE MOVIMIENTO DE CAJA
            if ($usaCaja) {

                $caja = Caja::find($request->caja);

                if (! $caja) {
                    DB::rollBack();

                    return response()->json(['success' => false, 'mensaje' => 'Caja no encontrada'], 422);
                }

                // 🧮 El saldo de la caja se calcula con sus movimientos (la tabla no
                // guarda saldo): monto inicial + ingresos − salidas.
                $saldoCaja = $caja->saldo_actual;

                if ($saldoCaja < $totalCalculado) {
                    DB::rollBack();

                    return response()->json([
                        'success' => false,
                        'mensaje' => 'Saldo insuficiente en caja (disponible: C$ '.number_format($saldoCaja, 2).')',
                    ], 422);
                }

                MovimientoCaja::create([
                    'id_caja' => $caja->id_caja,
                    'tipo_movimiento_caja' => 'SALIDA',
                    'concepto_movimiento_caja' => 'Reabastecimiento de productos',
                    'monto_movimiento_caja' => $totalCalculado,
                    'id_usuario' => session('usuario.id'),
                    'id_referencia' => $compra->id_compra,
                ]);

            }

            // VALIDACION DE MOVIMIENTO DE CUENTA
            if ($usaCuenta) {

                $cuenta = Cuenta::find($request->cuenta);

                if (! $cuenta) {
                    DB::rollBack();

                    return response()->json(['success' => false, 'mensaje' => 'Cuenta no encontrada'], 422);
                }

                if ($cuenta->saldo_actual < $totalCalculado) {
                    DB::rollBack();

                    return response()->json([
                        'success' => false,
                        'mensaje' => 'Saldo insuficiente en cuenta (disponible: C$ '.number_format((float) $cuenta->saldo_actual, 2).')',
                    ], 422);
                }

                MovimientoCuenta::create([
                    'id_cuenta' => $cuenta->id_cuenta,
                    'tipo_movimiento' => 'SALIDA',
                    'monto' => $totalCalculado,
                    'descripcion' => 'Compra de productos',
                    'id_usuario' => session('usuario.id'),
                ]);

                $cuenta->decrement('saldo_actual', $totalCalculado);
            }

            /* ----------------------------------------------------------------------------------------------------- */

            DB::commit();

            // =====================
            // 7️⃣ MENSAJE EXITOSO
            // =====================
            return response()->json([
                'success' => true,
                'mensaje' => 'Compra registrada correctamente',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error al registrar compra: '.$e->getMessage(), [
                'request' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'mensaje' => 'Ocurrió un error al registrar la compra: '.$e->getMessage(),
            ], 500);
        }
    }

    /*  ╔══════════ Mostrar Proveedores ══════════╗
        ╚═════════════════════════════════════════╝ */

    public function MostrarProveedoresCompras(Request $request)
    {
        try {

            // 🔍 VALIDACIÓN
            $validator = Validator::make($request->all(), [
                'q' => 'nullable|string|max:100',
                'estado' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensajes' => $validator->errors(),
                ], 400);
            }

            // 🔎 CONSULTA BASE
            $query = Proveedor::query();

            // 🟢 FILTRO POR ESTADO
            if ($request->has('estado')) {
                $query->where('estado_proveedor', $request->estado);
            } else {
                // por defecto solo activos
                $query->where('estado_proveedor', 1);
            }

            // 🔍 BÚSQUEDA (Select2 usa "q")
            if ($request->filled('q')) {
                $busqueda = $request->q;

                $query->where(function ($q) use ($busqueda) {
                    $q->where('nombre_proveedor', 'like', "%{$busqueda}%")
                        ->orWhere('ruc_proveedor', 'like', "%{$busqueda}%");
                });
            }

            $proveedores = $query
                ->orderBy('nombre_proveedor', 'asc')
                ->limit(20)
                ->get();

            // 🎯 FORMATO SELECT2
            $data = $proveedores->map(function ($p) {
                return [
                    'id' => $p->id_proveedor,
                    'text' => $p->nombre_proveedor,
                ];
            });

            return response()->json([
                'success' => true,
                'total' => $data->count(),
                'data' => $data,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener proveedores',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔════════ Mostrar Tipo de Factura ════════╗
        ╚═════════════════════════════════════════╝ */

    public function MostrarTiposFacturaCompras()
    {
        try {

            $tipos = TipoFactura::where('estado', 1)
                ->orderBy('nombre_tipo_factura', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $tipos,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener tipos de factura',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔═════════ Mostrar Tipo de Pago ══════════╗
        ╚═════════════════════════════════════════╝ */

    public function MostrarMetodosPagoCompras()
    {
        try {

            $metodos = MetodoPago::where('estado_metodo_pago', 1)
                ->orderBy('nombre_metodo_pago', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $metodos,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener métodos de pago',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔════════════ Mostrar Cuentas ════════════╗
        ╚═════════════════════════════════════════╝ */

    public function MostrarCuentasCompras()
    {
        try {
            // Trae solo las cuentas activas
            $cuentas = Cuenta::where('estado', 1)
                ->orderBy('nombre_cuenta', 'asc')
                ->get();

            // Formatea los datos para el <select>
            $data = $cuentas->map(function ($cuenta) {
                return [
                    'id' => $cuenta->id_cuenta, // valor real que se envía al backend
                    'nombre' => $cuenta->nombre_cuenta,
                    'saldo_actual' => number_format($cuenta->saldo_actual, 2),
                    'display' => "{$cuenta->nombre_cuenta} (Saldo: C$ ".number_format($cuenta->saldo_actual, 2).')',
                ];
            });

            return response()->json([
                'success' => true,
                'cuentas' => $data,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al obtener cuentas',
            ], 500);
        }
    }

    /*  ╔════════════ Mostrar Medidas ════════════╗
        ╚═════════════════════════════════════════╝ */

    public function MostrarMedidasCompras()
    {
        try {

            $medidas = Medida::with('tipomedida')
                ->where('estado_medida', 1)
                ->orderBy('orden_medida', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $medidas,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener medidas',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔════════════ Proceso de cajas ═══════════╗
        ╚═════════════════════════════════════════╝ */

    public function procesarPagoCaja(float|int $totalCompra, int|string|null $idCompra = null)
    {
        $idUsuario = session('usuario.id');
        if (! $idUsuario) {
            throw new \Exception('Sesión no válida');
        }

        $caja = Caja::where('estado_caja', 1)
            ->where('id_usuario', $idUsuario)
            ->orderBy('fecha_apertura', 'desc')
            ->first();

        if (! $caja) {
            throw new \Exception('No tienes una caja abierta');
        }

        $ingresos = MovimientoCaja::where('id_caja', $caja->id_caja)
            ->where('tipo_movimiento_caja', 'ENTRADA')
            ->sum('monto_movimiento_caja');

        $egresos = MovimientoCaja::where('id_caja', $caja->id_caja)
            ->where('tipo_movimiento_caja', 'SALIDA')
            ->sum('monto_movimiento_caja');

        $saldoActual = $caja->monto_inicial + $ingresos - $egresos;

        if ($saldoActual < $totalCompra) {
            throw new \Exception('Saldo insuficiente en caja');
        }

        MovimientoCaja::create([
            'id_caja' => $caja->id_caja,
            'tipo_movimiento_caja' => 'SALIDA',
            'concepto_movimiento_caja' => 'Compra de productos',
            'monto_movimiento_caja' => $totalCompra,
            'id_usuario' => $idUsuario,
            'id_referencia' => $idCompra ?? null,
        ]);

        return $caja;
    }

    /*  ╔════════ Mostrar Cajas Abiertas ═════════╗
        ╚═════════════════════════════════════════╝ */

    public function MostrarCajasAbiertas(Request $request)
    {
        $idUsuario = session('usuario.id');
        $totalCompra = $request->total ?? 0; // opcional para validar si hay suficiente saldo

        $cajas = Caja::where('estado_caja', 1)
            ->get(); // podemos filtrar por usuario si quieres

        $data = $cajas->map(function ($caja) {

            // calcular saldo en tiempo real
            $ingresos = MovimientoCaja::where('id_caja', $caja->id_caja)
                ->where('tipo_movimiento_caja', 'INGRESO')
                ->sum('monto_movimiento_caja');

            $salidas = MovimientoCaja::where('id_caja', $caja->id_caja)
                ->where('tipo_movimiento_caja', 'SALIDA')
                ->sum('monto_movimiento_caja');

            $saldoActual = $caja->monto_inicial + $ingresos - $salidas;

            return [
                'id' => $caja->id_caja,
                'text' => "{$caja->usuario->nombre_completo_usuario} (Saldo: C$ ".number_format($saldoActual, 2).')',
                'saldo_actual' => $saldoActual,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /*  ╔═══════════ Mostrar Productos ═══════════╗
        ╚═════════════════════════════════════════╝ */

    public function MostrarProductosCompras(Request $request)
    {
        try {
            // 🔍 VALIDACIÓN
            $validator = Validator::make($request->all(), [
                'q' => 'nullable|string|max:150',
                'estado' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensajes' => $validator->errors(),
                ], 400);
            }

            // 🔎 CONSULTA BASE
            $query = Producto::with(['impuestoProducto', 'variaciones' => function ($variaciones) {
                $variaciones->where('estado_variacion', 1)->with(['tallas.talla' => function ($tallas) {
                    $tallas->where('estado_talla', 1);
                }]);
            }]);

            // FILTRO POR ESTADO

            if ($request->has('estado')) {
                $query->where('estado_producto', $request->estado);
            } else {
                // por defecto solo activos
                $query->where('estado_producto', 1);
            }

            // BÚSQUEDA (Select2 usa "q")
            if ($request->filled('q')) {
                $busqueda = $request->q;

                $query->where(function ($q) use ($busqueda) {
                    $q->where('nombre_producto', 'like', "%{$busqueda}%")
                        ->orWhere('descripcion_producto', 'like', "%{$busqueda}%")
                        ->orWhereHas('variaciones.tallas', function ($variantes) use ($busqueda) {
                            $variantes->where('sku', 'like', "%{$busqueda}%")
                                ->orWhereHas('variacion', function ($variacion) use ($busqueda) {
                                    $variacion->where('color', 'like', "%{$busqueda}%");
                                })
                                ->orWhereHas('talla', function ($talla) use ($busqueda) {
                                    $talla->where('talla', 'like', "%{$busqueda}%");
                                });
                        });
                });
            }

            $productos = $query
                ->orderBy('nombre_producto', 'asc')
                // ->limit(20) limite datos cargadis en select2
                ->get();

            // FORMATO SELECT2
            $data = $productos->flatMap(function ($p) {
                $impuesto = $p->impuestoProducto->porcentaje_impuesto ?? 0;
                $variantes = $p->variaciones->flatMap(function ($variacion) use ($p, $impuesto) {
                    return $variacion->tallas->map(function ($talla) use ($p, $variacion, $impuesto) {
                        return [
                            'id' => $p->id_producto,
                            'id_variacion_talla' => $talla->id_variacion_talla,
                            'sku' => $talla->sku,
                            'text' => $p->nombre_producto.' · '.$variacion->color.' · '.($talla->talla->talla ?? '').' ['.$talla->sku.']',
                            'precio' => $talla->precio_compra ?? $p->precio_compra ?? 0,
                            'impuesto' => $impuesto,
                        ];
                    })->all();
                });

                return $variantes->isNotEmpty() ? $variantes->values()->all() : [[
                    'id' => $p->id_producto,
                    'id_variacion_talla' => null,
                    'text' => $p->nombre_producto,
                    'precio' => $p->precio_compra ?? 0,
                    'impuesto' => $impuesto,
                ]];
            });

            return response()->json([
                'success' => true,
                'total' => $data->count(),
                'data' => $data,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener productos',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function AnularCompra(int|string $id)
    {
        DB::beginTransaction();

        try {

            $compra = Compra::with('detalles')->find($id);

            if (! $compra) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Compra no encontrada',
                ], 404);
            }

            // ✔ estado consistente con tu sistema (0 = anulada)
            if ($compra->estado_compra == 0) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'La compra ya está anulada',
                ], 422);
            }

            // =====================
            // 1️⃣ REVERTIR INVENTARIO
            // =====================
            foreach ($compra->detalles as $detalle) {

                $producto = Producto::find($detalle->id_producto);

                if (! $producto) {
                    throw new \Exception('Producto no encontrado: '.$detalle->id_producto);
                }

                $esDetalleDeVariacion = ! empty($detalle->descripcion_variacion);
                $variacionTalla = $detalle->id_variacion_talla
                    ? VariacionTalla::with(['variacion', 'talla'])->find($detalle->id_variacion_talla)
                    : null;
                if ($esDetalleDeVariacion && ! $variacionTalla) {
                    throw new \Exception('No se puede revertir la compra: la variante ingresada ya fue eliminada');
                }

                // 🧾 Revertir el lote FIFO de esta compra. Solo se permite si aún no
                // se vendió nada del lote; si ya se vendió, no se puede anular.
                $lotes = LoteInventario::where('id_detalle_compra', $detalle->id_detalle_compra)
                    ->lockForUpdate()
                    ->get();

                foreach ($lotes as $lote) {
                    if ((int) $lote->cantidad_disponible < (int) $lote->cantidad_inicial) {
                        throw new \Exception('No se puede anular la compra: ya se vendieron unidades de este producto');
                    }
                }

                foreach ($lotes as $lote) {
                    $lote->delete();
                }

                if ($variacionTalla) {
                    if ($variacionTalla->stock < $detalle->cantidad_compra) {
                        throw new \Exception('Stock insuficiente para revertir compra');
                    }
                    $variacionTalla->decrement('stock', $detalle->cantidad_compra);
                    $stockResultante = $variacionTalla->fresh()->stock;
                    $motivo = 'Anulación de compra - '.trim(($variacionTalla->variacion->color ?? '').' '.($variacionTalla->talla->talla ?? ''));
                } else {
                    if ($producto->stock_actual < $detalle->cantidad_compra) {
                        throw new \Exception('Stock insuficiente para revertir compra');
                    }
                    $producto->decrement('stock_actual', $detalle->cantidad_compra);
                    $stockResultante = $producto->fresh()->stock_actual;
                    $motivo = 'Anulación de compra';
                }

                MovimientoInventario::create([
                    'id_producto' => $producto->id_producto,
                    'tipo_movimiento' => 'SALIDA',
                    'cantidad_movimiento' => $detalle->cantidad_compra,
                    'stock_resultante' => $stockResultante,
                    'motivo_movimiento' => $motivo,
                    'id_referencia' => $compra->id_compra,
                    'tipo_referencia' => 'DEVOLUCION',
                    'precio_unitario' => $detalle->precio_unitario_compra,
                    'id_usuario' => session('usuario.id'),
                ]);
            }

            // =====================
            // 2️⃣ DEVOLVER DINERO
            // =====================
            $total = $compra->total_compra;

            if ($compra->id_caja) {

                MovimientoCaja::create([
                    'id_caja' => $compra->id_caja,
                    'tipo_movimiento_caja' => 'INGRESO',
                    'concepto_movimiento_caja' => 'Anulación de compra',
                    'monto_movimiento_caja' => $total,
                    'id_usuario' => session('usuario.id'),
                    'id_referencia' => $compra->id_compra,
                ]);
            }

            if ($compra->id_cuenta) {

                $cuenta = Cuenta::find($compra->id_cuenta);

                if (! $cuenta) {
                    throw new \Exception('Cuenta no encontrada');
                }

                MovimientoCuenta::create([
                    'id_cuenta' => $cuenta->id_cuenta,
                    'tipo_movimiento' => 'INGRESO',
                    'monto' => $total,
                    'descripcion' => 'Anulación de compra',
                    'id_usuario' => session('usuario.id'),
                ]);

                $cuenta->increment('saldo_actual', $total);
            }

            // =====================
            // 3️⃣ MARCAR COMO ANULADA
            // =====================
            $compra->estado_compra = 0;
            $compra->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'mensaje' => 'Compra anulada correctamente',
            ]);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'mensaje' => $e->getMessage(),
            ], 500);
        }
    }

    public function MostrarCompras(Request $request)
    {
        try {

            $consulta = Compra::query()->with([
                'proveedor:id_proveedor,nombre_proveedor',
                'usuario:id_usuario,nombre_usuario',
                'metodoPago:id_metodo_pago,nombre_metodo_pago',
            ]);

            // Modo compatible: sin parametros de DataTables devuelve todo (como antes).
            if (! $request->filled('draw')) {

                return response()->json([
                    'success' => true,
                    'compras' => $consulta->orderByDesc('id_compra')->get(),
                ], 200);

            }

            // Modo servidor: la base solo devuelve la pagina visible.
            return DataTableServidor::responder($request, $consulta, [
                'columnas' => [
                    0 => ['col' => 'id_compra'],
                    1 => ['col' => 'numero_factura_compra', 'buscar' => true],
                    2 => ['rel' => 'proveedor', 'col' => 'nombre_proveedor', 'buscar' => true],
                    3 => ['rel' => 'usuario', 'col' => 'nombre_usuario', 'buscar' => true],
                    4 => ['fecha' => 'fecha_compra'],
                    5 => ['col' => 'subtotal_compra'],
                    6 => ['col' => 'descuento_compra'],
                    7 => ['col' => 'impuesto_compra'],
                    8 => ['col' => 'total_compra'],
                    9 => ['rel' => 'metodoPago', 'col' => 'nombre_metodo_pago'],
                    10 => ['col' => 'estado_compra'],
                ],
                'orden' => [
                    2 => '(select nombre_proveedor from proveedores where proveedores.id_proveedor = compras.id_proveedor)',
                    3 => '(select nombre_usuario from usuarios where usuarios.id_usuario = compras.id_usuario)',
                    9 => '(select nombre_metodo_pago from metodos_pago where metodos_pago.id_metodo_pago = compras.id_metodo_pago)',
                ],
                'ordenDefault' => ['columna' => 'id_compra', 'dir' => 'desc'],
                'extras' => ['opciones' => $this->opcionesFiltrosCompras()],
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener compras',
                'detalle' => $e->getMessage(),
            ], 500);

        }
    }

    /**
     * Valores para los filtros de columna (proveedor, usuario, metodo de pago),
     * indexados por la posicion de la columna. Se cachean.
     *
     * @return array<int, array<int, string>>
     */
    private function opcionesFiltrosCompras(): array
    {
        return Cache::remember('compras_opciones_filtros', now()->addMinutes(10), function () {

            return [
                2 => DB::table('compras')
                    ->join('proveedores', 'compras.id_proveedor', '=', 'proveedores.id_proveedor')
                    ->distinct()
                    ->orderBy('proveedores.nombre_proveedor')
                    ->pluck('proveedores.nombre_proveedor')
                    ->all(),

                3 => DB::table('compras')
                    ->join('usuarios', 'compras.id_usuario', '=', 'usuarios.id_usuario')
                    ->distinct()
                    ->orderBy('usuarios.nombre_usuario')
                    ->pluck('usuarios.nombre_usuario')
                    ->all(),

                9 => DB::table('compras')
                    ->join('metodos_pago', 'compras.id_metodo_pago', '=', 'metodos_pago.id_metodo_pago')
                    ->distinct()
                    ->orderBy('metodos_pago.nombre_metodo_pago')
                    ->pluck('metodos_pago.nombre_metodo_pago')
                    ->all(),
            ];

        });
    }

    public function MostrarDetalleCompra(int|string $id)
    {
        $compra = Compra::with([
            'proveedor',
            'usuario',
            'metodoPago',
            'detalles.producto',
        ])->findOrFail($id);

        return response()->json([
            'compra' => $compra,
        ]);
    }
} // Fin de controlador
