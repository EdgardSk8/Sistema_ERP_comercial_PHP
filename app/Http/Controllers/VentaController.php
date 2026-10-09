<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Venta;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\Cuenta;
use App\Models\MovimientoCaja;
use App\Models\Caja;
use App\Models\MovimientoCuenta;
use App\Models\VariacionTalla;
use Illuminate\Support\Facades\DB;

class VentaController extends Controller
{


/*  ╔════════════ Mostrar Venta ═══════════╗ 
    ╚══════════════════════════════════════╝ */
    
    public function MostrarVentas()
    {
        try {

            $ventas = Venta::with([
                'cliente:id_cliente,nombre_cliente',
                'usuario:id_usuario,nombre_usuario',
                'metodoPago:id_metodo_pago,nombre_metodo_pago',
                // 'caja'
            ])->get();

            return response()->json([
                'success' => true,
                'ventas' => $ventas
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener ventas',
                'detalle' => $e->getMessage()
            ], 500);

        }
    }

    public function AnularVenta($id)
    {
        DB::beginTransaction();

        try {

            $venta = Venta::with('detalles')->find($id);

            if (!$venta) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Venta no encontrada'
                ], 404);
            }

            if ($venta->estado_venta == 0) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'La venta ya está anulada'
                ], 422);
            }

            // =====================
            // 1️⃣ DEVOLVER INVENTARIO
            // =====================
            foreach ($venta->detalles as $detalle) {

                $producto = Producto::find($detalle->id_producto);

                if (!$producto) {
                    throw new \Exception('Producto no encontrado');
                }

                $esDetalleDeVariacion = !empty($detalle->descripcion_variacion);
                $variacionTalla = $detalle->id_variacion_talla
                    ? VariacionTalla::with(['variacion', 'talla'])->find($detalle->id_variacion_talla)
                    : null;

                if ($esDetalleDeVariacion && !$variacionTalla) {
                    throw new \Exception('No se puede devolver el stock: la variante vendida ya fue eliminada');
                }

                // Devolver el inventario al nivel donde se descontó en la venta.
                if ($variacionTalla) {
                    $variacionTalla->increment('stock', $detalle->cantidad_venta);
                    $stockResultante = $variacionTalla->fresh()->stock;
                    $motivo = 'Anulación de venta - ' . trim(($variacionTalla->variacion->color ?? '') . ' ' . ($variacionTalla->talla->talla ?? ''));
                } else {
                    $producto->increment('stock_actual', $detalle->cantidad_venta);
                    $stockResultante = $producto->fresh()->stock_actual;
                    $motivo = 'Anulación de venta';
                }

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
                    'id_usuario' => session('usuario.id')
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
                    'id_referencia' => $venta->id_venta
                ]);
            }

            // 🔸 CUENTA
            if ($venta->id_cuenta) {

                $cuenta = Cuenta::find($venta->id_cuenta);

                if (!$cuenta) {
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
                    'id_usuario' => session('usuario.id')
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
                'mensaje' => 'Venta anulada correctamente'
            ]);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'mensaje' => $e->getMessage()
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
                'detalles.variacionTalla.talla'
            ])->findOrFail($id);

            return response()->json([
                'venta' => $venta
            ]);
    }


}
