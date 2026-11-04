<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Cuenta;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuenta;
use App\Models\TransferenciaCajaCuenta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransferenciaCajaCuentaController extends Controller
{
    /* ╔══════ Transferir Caja a Cuenta ══════╗ */
    public function TransferenciaCajaCuenta(Request $request)
    {
        try {

            return DB::transaction(function () use ($request) {

                $idCaja = $request->id_caja;
                $idCuenta = $request->id_cuenta;
                $monto = floatval($request->monto);
                $idUsuario = session('usuario.id');

                // ✅ Validaciones básicas
                if (! $idCaja || ! $idCuenta || $monto <= 0) {
                    throw new \Exception('Datos inválidos');
                }

                $caja = Caja::findOrFail($idCaja);
                $cuenta = Cuenta::findOrFail($idCuenta);

                // ✅ Calcular saldo de caja
                $ingresos = MovimientoCaja::where('id_caja', $idCaja)
                    ->where('tipo_movimiento_caja', 'INGRESO')
                    ->sum('monto_movimiento_caja');

                $salidas = MovimientoCaja::where('id_caja', $idCaja)
                    ->where('tipo_movimiento_caja', 'SALIDA')
                    ->sum('monto_movimiento_caja');

                $saldoCaja = ($caja->monto_inicial ?? 0) + $ingresos - $salidas;

                if ($saldoCaja < $monto) {
                    throw new \Exception('Saldo insuficiente en caja');
                }

                /* =====================================================
                   1. CREAR TRANSFERENCIA (PRIMERO)
                ===================================================== */
                $transferencia = TransferenciaCajaCuenta::create([
                    'id_caja_origen' => $idCaja,
                    'id_cuenta_destino' => $idCuenta,
                    'monto' => $monto,
                    'concepto' => 'Transferencia de Caja a Cuenta',
                    'id_usuario' => $idUsuario,
                    'fecha' => now(),
                ]);

                /* =====================================================
                   2. MOVIMIENTO CAJA (SALIDA)
                ===================================================== */
                MovimientoCaja::create([
                    'id_caja' => $idCaja,
                    'tipo_movimiento_caja' => 'SALIDA',
                    'concepto_movimiento_caja' => 'Transferencia de Caja hacia Cuenta: '.$cuenta->nombre_cuenta,
                    'monto_movimiento_caja' => $monto,
                    'fecha_movimiento_caja' => now(),
                    'id_usuario' => $idUsuario,
                    'id_cuenta_destino' => $idCuenta,

                    // 🔥 CLAVE
                    'id_transferencia' => $transferencia->id_transferencia,
                ]);

                /* =====================================================
                   3. MOVIMIENTO CUENTA (INGRESO)
                ===================================================== */
                MovimientoCuenta::create([
                    'id_cuenta' => $idCuenta,
                    'tipo_movimiento' => 'INGRESO',
                    'descripcion' => 'Transferencia desde Caja #'.$idCaja.' hacia '.$cuenta->nombre_cuenta,
                    'monto' => $monto,
                    'fecha' => now(),
                    'id_usuario' => $idUsuario,

                    // 🔥 CLAVE
                    'id_transferencia' => $transferencia->id_transferencia,
                ]);

                /* =====================================================
                   4. ACTUALIZAR SALDO CUENTA
                ===================================================== */
                $cuenta->increment('saldo_actual', $monto);

                return response()->json([
                    'success' => true,
                    'mensaje' => 'Transferencia realizada correctamente',
                    'id_transferencia' => $transferencia->id_transferencia,
                ]);
            });

        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,
                'mensaje' => $e->getMessage(),
            ], 500);
        }
    }

    public function MostrarCajaTransferencia()
    {
        try {

            $cajas = Caja::orderBy('fecha_apertura', 'desc')->get();

            $data = $cajas->map(function ($caja) {

                $ingresos = MovimientoCaja::where('id_caja', $caja->id_caja)
                    ->where('tipo_movimiento_caja', 'INGRESO')
                    ->sum('monto_movimiento_caja');

                $salidas = MovimientoCaja::where('id_caja', $caja->id_caja)
                    ->where('tipo_movimiento_caja', 'SALIDA')
                    ->sum('monto_movimiento_caja');

                $transferido = MovimientoCaja::where('id_caja', $caja->id_caja)
                    ->whereNotNull('id_cuenta_destino')
                    ->sum('monto_movimiento_caja');

                // 🔥 última transferencia
                $ultima = MovimientoCaja::where('id_caja', $caja->id_caja)
                    ->whereNotNull('id_cuenta_destino')
                    ->latest('fecha_movimiento_caja')
                    ->first();

                $cuenta = $ultima?->cuentaDestino;

                $saldoCaja = $caja->monto_inicial + $ingresos - $salidas;

                return [
                    'numero_caja' => $caja->id_caja,
                    'fecha_cierre' => $caja->fecha_cierre,
                    'monto_inicial' => $caja->monto_inicial,
                    'monto_final' => $caja->monto_final,
                    'monto_transferido' => $transferido,
                    'saldo_caja' => $saldoCaja,
                    'nombre_cuenta' => $cuenta?->nombre_cuenta ?? null,
                    'saldo_cuenta' => $cuenta?->saldo_actual ?? null,
                ];
            });

            return response()->json([
                'data' => $data,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => $e->getMessage(),
            ], 500);
        }
    }

    /* ╔═══════ Mostrar Transferencias ═══════╗ */
    public function MostrarDetalleCuenta($id_caja)
    {
        try {

            $transferencias = TransferenciaCajaCuenta::with([
                'cuentaDestino',
                'usuario',
            ])
                ->where('id_caja_origen', $id_caja)
                ->orderBy('id_transferencia', 'desc')
                ->get();

            $data = $transferencias->map(function ($t) {

                return [
                    'id' => $t->id_transferencia,
                    'nombre_cuenta' => $t->cuentaDestino->nombre_cuenta ?? 'Sin cuenta',
                    'monto' => (float) $t->monto,
                    'saldo_cuenta' => (float) ($t->cuentaDestino->saldo_actual ?? 0),
                    'usuario' => $t->usuario->nombre_completo_usuario ?? 'Sin usuario',
                    'fecha' => $t->fecha,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'total' => $data->sum('monto'),
                'cantidad' => $data->count(),
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'mensaje' => $e->getMessage(),
            ], 500);
        }
    }
}
