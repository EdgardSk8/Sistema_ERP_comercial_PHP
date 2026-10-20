<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Cuenta;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuenta;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\VariacionTalla;
use App\Models\Venta;
use App\Services\CosteoInventarioService;
use App\Support\DataTableServidor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class VentaController extends Controller
{
    /*  ╔════════════ Mostrar Venta ═══════════╗
        ╚══════════════════════════════════════╝ */

    public function MostrarVentas(Request $request)
    {
        try {

            $consulta = Venta::query()->with([
                'cliente:id_cliente,nombre_cliente',
                'usuario:id_usuario,nombre_usuario',
                'metodoPago:id_metodo_pago,nombre_metodo_pago',
                'planPago:id_plan_pago,id_venta',
                // 'caja'
            ]);

            // Modo compatible: sin parametros de DataTables devuelve todo (como antes).
            if (! $request->filled('draw')) {

                return response()->json([
                    'success' => true,
                    'ventas' => $consulta->orderByDesc('id_venta')->get(),
                ], 200);

            }

            // Modo servidor: la base solo devuelve la pagina visible.
            return DataTableServidor::responder($request, $consulta, [
                'columnas' => [
                    0 => ['col' => 'id_venta'],
                    1 => ['col' => 'numero_factura', 'buscar' => true],
                    2 => ['rel' => 'cliente', 'col' => 'nombre_cliente', 'buscar' => true],
                    3 => ['rel' => 'usuario', 'col' => 'nombre_usuario', 'buscar' => true],
                    4 => ['col' => 'id_caja'],
                    5 => ['fecha' => 'fecha_venta'],
                    6 => ['col' => 'subtotal_venta'],
                    7 => ['col' => 'impuesto_venta'],
                    8 => ['col' => 'total_venta'],
                    9 => [
                        'callback' => function ($query, string $valor) {
                            $limpio = str_replace('\\', '', trim($valor, '^$'));

                            if (stripos($limpio, 'plazo') !== false) {
                                $query->has('planPago');

                                return;
                            }

                            $query->whereHas('metodoPago', fn ($metodo) => $metodo->where('nombre_metodo_pago', 'like', "%{$limpio}%"));
                        },
                    ],
                    10 => ['col' => 'estado_venta'],
                ],
                'orden' => [
                    2 => '(select nombre_cliente from clientes where clientes.id_cliente = ventas.id_cliente)',
                    3 => '(select nombre_usuario from usuarios where usuarios.id_usuario = ventas.id_usuario)',
                ],
                'ordenDefault' => ['columna' => 'id_venta', 'dir' => 'desc'],
                'extras' => ['opciones' => $this->opcionesFiltrosVentas()],
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener ventas',
                'detalle' => $e->getMessage(),
            ], 500);

        }
    }

    /**
     * Valores para los filtros de columna (cliente, usuario, metodo de pago),
     * indexados por la posicion de la columna. Se cachean porque no cambian
     * en cada consulta.
     *
     * @return array<int, array<int, string>>
     */
    private function opcionesFiltrosVentas(): array
    {
        return Cache::remember('ventas_opciones_filtros', now()->addMinutes(10), function () {

            return [
                2 => DB::table('ventas')
                    ->join('clientes', 'ventas.id_cliente', '=', 'clientes.id_cliente')
                    ->distinct()
                    ->orderBy('clientes.nombre_cliente')
                    ->pluck('clientes.nombre_cliente')
                    ->all(),

                3 => DB::table('ventas')
                    ->join('usuarios', 'ventas.id_usuario', '=', 'usuarios.id_usuario')
                    ->distinct()
                    ->orderBy('usuarios.nombre_usuario')
                    ->pluck('usuarios.nombre_usuario')
                    ->all(),

                9 => array_values(array_filter(array_merge(
                    ['A plazos'],
                    DB::table('ventas')
                        ->join('metodos_pago', 'ventas.id_metodo_pago', '=', 'metodos_pago.id_metodo_pago')
                        ->distinct()
                        ->orderBy('metodos_pago.nombre_metodo_pago')
                        ->pluck('metodos_pago.nombre_metodo_pago')
                        ->all()
                ))),
            ];

        });
    }

    public function AnularVenta($id)
    {
        DB::beginTransaction();

        try {

            $venta = Venta::with('detalles')->find($id);

            if (! $venta) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Venta no encontrada',
                ], 404);
            }

            if ($venta->estado_venta == 0) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'La venta ya está anulada',
                ], 422);
            }

            if ($venta->pagos()->exists()) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'mensaje' => 'No se puede anular una venta que ya recibió abonos. Registra una devolución antes de anularla.',
                ], 422);
            }

            // =====================
            // 1️⃣ DEVOLVER INVENTARIO
            // =====================
            foreach ($venta->detalles as $detalle) {

                $producto = Producto::find($detalle->id_producto);

                if (! $producto) {
                    throw new \Exception('Producto no encontrado');
                }

                $esDetalleDeVariacion = ! empty($detalle->descripcion_variacion);
                $variacionTalla = $detalle->id_variacion_talla
                    ? VariacionTalla::with(['variacion', 'talla'])->find($detalle->id_variacion_talla)
                    : null;

                if ($esDetalleDeVariacion && ! $variacionTalla) {
                    throw new \Exception('No se puede devolver el stock: la variante vendida ya fue eliminada');
                }

                // Devolver el inventario al nivel donde se descontó en la venta.
                if ($variacionTalla) {
                    $variacionTalla->increment('stock', $detalle->cantidad_venta);
                    $producto->increment('stock_actual', $detalle->cantidad_venta);
                    $stockResultante = $producto->fresh()->stock_actual;
                    $motivo = 'Anulación de venta - '.trim(($variacionTalla->variacion->color ?? '').' '.($variacionTalla->talla->talla ?? ''));
                } else {
                    $producto->increment('stock_actual', $detalle->cantidad_venta);
                    $stockResultante = $producto->fresh()->stock_actual;
                    $motivo = 'Anulación de venta';
                }

                // 🧾 Devolver las unidades a sus lotes FIFO originales.
                app(CosteoInventarioService::class)->restaurar($detalle->consumos_lotes ?? []);

                // KARDEX
                MovimientoInventario::create([
                    'id_producto' => $producto->id_producto,
                    'tipo_movimiento' => 'ENTRADA',
                    'cantidad_movimiento' => $detalle->cantidad_venta,
                    'stock_resultante' => $stockResultante,
                    'motivo_movimiento' => $motivo,
                    'id_referencia' => $venta->id_venta,
                    'tipo_referencia' => 'DEVOLUCION',
                    'precio_unitario' => $detalle->precio_unitario_venta,
                    'fecha_movimiento' => now(),
                    'id_usuario' => session('usuario.id'),
                ]);
            }

            // =====================
            // 2️⃣ SACAR DINERO
            // =====================
            $total = $venta->total_venta;

            // 🔸 CAJA
            if ($venta->id_caja) {

                MovimientoCaja::create([
                    'id_caja' => $venta->id_caja,
                    'tipo_movimiento_caja' => 'SALIDA',
                    'concepto_movimiento_caja' => 'Anulación de venta',
                    'monto_movimiento_caja' => $total,
                    'id_usuario' => session('usuario.id'),
                    'id_referencia' => $venta->id_venta,
                ]);
            }

            // 🔸 CUENTA
            if ($venta->id_cuenta) {

                $cuenta = Cuenta::find($venta->id_cuenta);

                if (! $cuenta) {
                    throw new \Exception('Cuenta no encontrada');
                }

                // ⚠️ Validar saldo
                if ($cuenta->saldo_actual < $total) {
                    throw new \Exception('No hay saldo suficiente en la cuenta para anular la venta');
                }

                MovimientoCuenta::create([
                    'id_cuenta' => $cuenta->id_cuenta,
                    'tipo_movimiento' => 'SALIDA',
                    'monto' => $total,
                    'descripcion' => 'Anulación de venta',
                    'id_usuario' => session('usuario.id'),
                ]);

                $cuenta->decrement('saldo_actual', $total);
            }

            // =====================
            // 3️⃣ MARCAR COMO ANULADA
            // =====================
            $venta->estado_venta = 0; // 0 = ANULADA
            $venta->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'mensaje' => 'Venta anulada correctamente',
            ]);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'mensaje' => $e->getMessage(),
            ], 500);
        }
    }

    public function MostrarDetalleVenta($id)
    {
        $venta = Venta::with([
            'cliente',
            'usuario',
            'metodoPago',
            'detalles.producto',
            'detalles.variacionTalla.variacion',
            'detalles.variacionTalla.talla',
        ])->findOrFail($id);

        return response()->json([
            'venta' => $venta,
        ]);
    }
}
