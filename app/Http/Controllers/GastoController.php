<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Gasto;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuenta;
use App\Models\MovimientoGasto;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Cuenta;
use App\Models\Caja;
use Carbon\Carbon;

class GastoController extends Controller
{

    private function calcularEstadoPago(Gasto $gasto): string
    {
        $fechaVencimiento = $gasto->proximo_pago ?: $gasto->fecha_pago;

        if (!$fechaVencimiento) {
            return strtoupper($gasto->estado_pago ?? 'SIN PAGAR');
        }

        $vencimiento = Carbon::parse($fechaVencimiento)->startOfDay();
        $inicioMesActual = today()->startOfMonth();

        if ($vencimiento->lt($inicioMesActual)) {
            return 'ATRASADO';
        }

        if ($vencimiento->isSameMonth($inicioMesActual)) {
            return 'PENDIENTE';
        }

        return strtoupper($gasto->estado_pago ?? '') === 'PAGADO' ? 'PAGADO' : 'PENDIENTE';
    }

/*  ╔════════════ Mostrar Gastos ════════════╗ 
    ╚════════════════════════════════════════╝ */
    
    public function MostrarGastos()
    {
        try {

            $hoy = today();

            $gastos = Gasto::with(['tipoGasto', 'movimientosGasto'])
                ->get()
                ->map(function ($gasto) use ($hoy) {

                    $ultimo = $gasto->movimientosGasto
                        ->sortByDesc('fecha')
                        ->sortByDesc('id_movimiento_gasto')
                        ->first();

                    $fechaBase = $gasto->proximo_pago ?: $gasto->fecha_pago;
                    $estadoPago = $this->calcularEstadoPago($gasto);
                    $dias_restantes = null;
                    $dias_atraso = null;

                    /* ═══════════════════════════════════════
                    🔹 BASE REAL: PROXIMO PAGO
                    ═══════════════════════════════════════ */

                    if ($fechaBase) {
                        $fechaBase = Carbon::parse($fechaBase)->startOfDay();
                        if ($estadoPago === 'ATRASADO') {
                            $dias_atraso = $fechaBase->diffInDays($hoy);
                        } elseif ($estadoPago === 'PENDIENTE' && $fechaBase->gt($hoy)) {
                            $dias_restantes = $hoy->diffInDays($fechaBase);
                        }
                    }

                    return [
                        'id_gasto' => $gasto->id_gasto,
                        'nombre_gasto' => $gasto->nombre_gasto,
                        'descripcion_gasto' => $gasto->descripcion_gasto,
                        'estado_gasto' => $gasto->estado_gasto,

                        'tipo' => $gasto->tipoGasto->nombre_tipo_gasto ?? 'N/A',

                        'fecha_pago' => $fechaBase?->toDateString(),
                        'proximo_pago' => $gasto->proximo_pago,

                        'estado_pago' => $estadoPago,
                        'dias_restantes' => $dias_restantes,
                        'dias_atraso' => $dias_atraso,

                        'ultimo_pago_fecha' => $ultimo?->fecha ?? $gasto->ultimo_pago,
                        'ultimo_pago_monto' => $ultimo?->monto,
                    ];
                });

            return response()->json([
                'success' => true,
                'gastos' => $gastos
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener gastos',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

/*  ╔═════════════ Crear Gastos ═════════════╗ 
    ╚════════════════════════════════════════╝ */

    public function CrearGasto(Request $request)
    {
        try {

            $request->validate([
                'id_tipo_gasto'     => 'required|integer|exists:tipo_gasto,id_tipo_gasto',
                'nombre_gasto'      => 'required|string|max:150',
                'descripcion_gasto' => 'nullable|string|max:200',
                'fecha_pago'        => 'nullable|date',
                'proximo_pago'      => 'nullable|date'
            ]);

            /* ═══════════════════════════════════════
             FECHAS NORMALIZADAS
            ═══════════════════════════════════════ */

            $fecha_pago   = $request->fecha_pago;
            $proximo_pago = $request->proximo_pago ?? $fecha_pago;

            /* ═══════════════════════════════════════
            🔥 CREACIÓN
            ═══════════════════════════════════════ */

            $gasto = Gasto::create([
                'id_tipo_gasto'     => $request->id_tipo_gasto,
                'nombre_gasto'      => $request->nombre_gasto,
                'descripcion_gasto' => $request->descripcion_gasto,

                'fecha_pago'        => $fecha_pago,
                'proximo_pago'      => $proximo_pago,

                'estado_pago'       => 'PENDIENTE',
                'estado_gasto'      => true,
            ]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Gasto creado correctamente',
                'gasto'   => $gasto
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {

            return response()->json([
                'success' => false,
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear gasto',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

/*  ╔═════════════ Editar Gastos ════════════╗ 
    ╚════════════════════════════════════════╝ */

    public function EditarGasto($id)
    {
        try {

            $gasto = Gasto::where('id_gasto', $id)->first();

            if (!$gasto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Gasto no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'gasto' => $gasto
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener gasto',
                'detalle' => $e->getMessage()
            ], 500);

        }
    }

/*  ╔══════════ Actualizar Gastos ═══════════╗ 
    ╚════════════════════════════════════════╝ */

    public function ActualizarGasto(Request $request, $id)
    {
        try {

            $gasto = Gasto::where('id_gasto', $id)->first();

            if (!$gasto) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Gasto no encontrado'
                ], 404);
            }

            $validator = Validator::make(

                [
                    'id_tipo_gasto' => $request->id_tipo_gasto,
                    'nombre_gasto' => $request->nombre_gasto,
                    'descripcion_gasto' => $request->descripcion_gasto,
                    'estado_gasto' => $request->estado_gasto
                ],

                [
                    'id_tipo_gasto' => [
                        'required',
                        'exists:tipo_gasto,id_tipo_gasto'
                    ],

                    'nombre_gasto' => [
                        'required',
                        'string',
                        'max:150'
                    ],

                    'descripcion_gasto' => [
                        'nullable',
                        'string',
                        'max:200'
                    ],

                    'estado_gasto' => [
                        'required',
                        'boolean'
                    ]
                ],

                [
                    'id_tipo_gasto.exists' => 'El tipo de gasto no existe.',
                    'nombre_gasto.required' => 'El nombre del gasto es obligatorio.'
                ]
            );

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $gasto->id_tipo_gasto = $request->id_tipo_gasto;
            $gasto->nombre_gasto = $request->nombre_gasto;
            $gasto->descripcion_gasto = $request->descripcion_gasto;
            $gasto->estado_gasto = $request->estado_gasto;

            $gasto->save();

            return response()->json([
                'success' => true,
                'mensaje' => 'Gasto actualizado correctamente'
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar gasto',
                'detalle' => $e->getMessage()
            ], 500);

        }
    }

/*  ╔═════════════ Pagar Gastos ═════════════╗ 
    ╚════════════════════════════════════════╝ */

 public function DetalleGasto($id)
{

   
    $gasto = Gasto::with([
        'tipoGasto',
        'movimientosGasto.usuario',
        'movimientosGasto.caja',
        'movimientosGasto.cuenta'
    ])->find($id);

    if (!$gasto) {
        return response()->json([
            'success' => false
        ], 404);
    }

    $movimientos = $gasto->movimientosGasto->sortByDesc('fecha')->values();
    $ultimo = $movimientos->first();

    return response()->json([
        'success' => true,
        'gasto' => [
            'id_gasto' => $gasto->id_gasto,
            'nombre_gasto' => $gasto->nombre_gasto,
            'descripcion_gasto' => $gasto->descripcion_gasto,
            'tipo' => $gasto->tipoGasto->nombre_tipo_gasto ?? '—',
            'estado_pago' => $this->calcularEstadoPago($gasto),

            // 🔥 FIX REAL: asegurar orden correcto del último pago
            'ultimo_pago_fecha' =>
                $ultimo?->fecha ?? $gasto->ultimo_pago,

            // 🔥 HISTORIAL
            'movimientos' => $movimientos->map(function ($m) {

                return [
                    'id' => $m->id_movimiento_gasto,
                    'fecha' => $m->fecha,
                    'monto' => $m->monto,
                    'origen' => $m->origen,

                    'usuario' => [
                        'id' => $m->id_usuario,
                        'nombre' => $m->usuario?->nombre_usuario ?? '—'
                    ],


                    // 🔥 CAJA (SIN TOCAR)
                    'id_caja' => $m->id_caja,
                    'caja' => $m->caja?->id_caja,

                    // 🔥 CUENTA (SIN TOCAR)
                    'id_cuenta' => $m->id_cuenta,
                    'cuenta' => $m->cuenta?->nombre_cuenta,
                ];
            })->values()
        ]
    ]);
}

    public function EditarMovimientoGasto(Request $request)
    {
        try {

            \Log::info('INICIO EDITAR MOVIMIENTO', $request->all());

            $request->validate([
                'id_movimiento_gasto' => 'required|exists:movimientos_gastos,id_movimiento_gasto',
                'monto'               => 'required|numeric|min:0.01',
                'id_caja'             => 'nullable|exists:cajas,id_caja',
                'id_cuenta'           => 'nullable|exists:cuentas,id_cuenta',
            ]);

            if (!$request->id_caja && !$request->id_cuenta) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Debe seleccionar caja o cuenta'
                ], 422);
            }

            if ($request->id_caja && $request->id_cuenta) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Solo puede usar caja o cuenta'
                ], 422);
            }

            DB::beginTransaction();

            $mov = MovimientoGasto::lockForUpdate()
                ->find($request->id_movimiento_gasto);

            if (!$mov) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Movimiento no encontrado'
                ], 404);
            }

            \Log::info('MOVIMIENTO ORIGINAL', $mov->toArray());

            $montoNuevo = (float) $request->monto;
            $montoViejo = (float) $mov->monto;
            $idUsuario = session('usuario.id');

            if (!$idUsuario) {
                DB::rollBack();
                return response()->json(['success' => false, 'mensaje' => 'Usuario no autenticado'], 401);
            }

            /* =====================================================
                🔴 REVERSAR MOVIMIENTO ANTERIOR
            ===================================================== */

            if ($mov->origen === 'CAJA' && $mov->id_caja) {

                $cajaOld = Caja::lockForUpdate()->find($mov->id_caja);

                if ($cajaOld) {

                    // devolver dinero
                    // reverso lógico (opcional auditoría)
                    MovimientoCaja::create([
                        'id_caja' => $cajaOld->id_caja,
                        'tipo_movimiento_caja' => 'INGRESO',
                        'concepto_movimiento_caja' => 'Reverso edición gasto',
                        'monto_movimiento_caja' => $montoViejo,
                        'fecha_movimiento_caja' => now(),
                        'id_usuario' => $idUsuario
                    ]);
                }
            }

            if ($mov->origen === 'CUENTA' && $mov->id_cuenta) {

                $cuentaOld = Cuenta::lockForUpdate()->find($mov->id_cuenta);

                if ($cuentaOld) {

                    $cuentaOld->saldo_actual += $montoViejo;
                    $cuentaOld->save();

                    MovimientoCuenta::create([
                        'id_cuenta' => $cuentaOld->id_cuenta,
                        'tipo_movimiento' => 'INGRESO',
                        'descripcion' => 'Reverso edición gasto',
                        'monto' => $montoViejo,
                        'fecha' => now(),
                        'id_usuario' => $idUsuario
                    ]);
                }
            }

            /* =====================================================
                🔵 APLICAR NUEVO ORIGEN
            ===================================================== */

            // ================= CAJA =================
            if ($request->id_caja) {

                $caja = Caja::lockForUpdate()->find($request->id_caja);

                if (!$caja) {
                    DB::rollBack();
                    return response()->json(['success' => false, 'mensaje' => 'Caja no encontrada'], 404);
                }

                // 🔥 VALIDAR CAJA CERRADA
                if (isset($caja->estado_caja) && $caja->estado_caja == 0) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'mensaje' => 'La caja está cerrada'
                    ], 422);
                }

                // saldo real
                $totalIngresos = MovimientoCaja::where('id_caja', $caja->id_caja)
                    ->where('tipo_movimiento_caja', 'INGRESO')
                    ->sum('monto_movimiento_caja');

                $totalSalidas = MovimientoCaja::where('id_caja', $caja->id_caja)
                    ->where('tipo_movimiento_caja', 'SALIDA')
                    ->sum('monto_movimiento_caja');

                $saldoCaja = $caja->monto_inicial + $totalIngresos - $totalSalidas;

                if ($montoNuevo > $saldoCaja) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'mensaje' => 'Saldo insuficiente en caja'
                    ], 422);
                }

                // descontar
                // movimiento auditoría
                MovimientoCaja::create([
                    'id_caja' => $caja->id_caja,
                    'tipo_movimiento_caja' => 'SALIDA',
                    'concepto_movimiento_caja' => 'Edición gasto',
                    'monto_movimiento_caja' => $montoNuevo,
                    'fecha_movimiento_caja' => now(),
                    'id_usuario' => $idUsuario
                ]);

                $mov->origen = 'CAJA';
                $mov->id_caja = $caja->id_caja;
                $mov->id_cuenta = null;
            }

            // ================= CUENTA =================
            if ($request->id_cuenta) {

                $cuenta = Cuenta::lockForUpdate()->find($request->id_cuenta);

                if (!$cuenta) {
                    DB::rollBack();
                    return response()->json(['success' => false, 'mensaje' => 'Cuenta no encontrada'], 404);
                }

                if (!$cuenta->estado) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'mensaje' => 'No se puede usar una cuenta inactiva'
                    ], 422);
                }

                if ($montoNuevo > $cuenta->saldo_actual) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'mensaje' => 'Saldo insuficiente en cuenta'
                    ], 422);
                }

                $cuenta->saldo_actual -= $montoNuevo;
                $cuenta->save();

                MovimientoCuenta::create([
                    'id_cuenta' => $cuenta->id_cuenta,
                    'tipo_movimiento' => 'SALIDA',
                    'descripcion' => 'Edición gasto',
                    'monto' => $montoNuevo,
                    'fecha' => now(),
                    'id_usuario' => $idUsuario
                ]);

                $mov->origen = 'CUENTA';
                $mov->id_cuenta = $cuenta->id_cuenta;
                $mov->id_caja = null;
            }

            /* =====================================================
                🟢 ACTUALIZAR MOVIMIENTO
            ===================================================== */

            $mov->monto = $montoNuevo;
            $mov->save();

            DB::commit();

            \Log::info('MOVIMIENTO ACTUALIZADO OK');

            return response()->json([
                'success' => true,
                'mensaje' => 'Movimiento actualizado correctamente'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            return response()->json([
                'success' => false,
                'mensaje' => 'Errores de validación',
                'errors' => $e->errors()
            ], 422);

        } catch (\Throwable $e) {

            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            \Log::error('ERROR EDITAR MOVIMIENTO', [
                'mensaje' => $e->getMessage(),
                'linea' => $e->getLine(),
                'archivo' => $e->getFile()
            ]);

            return response()->json([
                'success' => false,
                'mensaje' => 'Error interno',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


    public function PagarGasto(Request $request)
    {
        try {

            $request->validate([
                'id_gasto' => 'required|exists:gastos,id_gasto',
                'monto' => 'required|numeric|min:0.01',
                'id_caja' => 'nullable|exists:cajas,id_caja',
                'id_cuenta' => 'nullable|exists:cuentas,id_cuenta',
                'renovar_vencimiento' => 'required|in:auto,manual,ninguno',
                'nueva_fecha' => 'required_if:renovar_vencimiento,manual|nullable|date'
            ]);

            DB::beginTransaction();

            $gasto = Gasto::lockForUpdate()->find($request->id_gasto);

            if (!$gasto) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Gasto no encontrado'
                ], 404);
            }

            if (!$request->id_caja && !$request->id_cuenta) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Debe seleccionar caja o cuenta'
                ], 422);
            }

            if ($request->id_caja && $request->id_cuenta) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Solo puede usar caja o cuenta'
                ], 422);
            }

            $idUsuario = session('usuario.id');

            if (!$idUsuario) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'mensaje' => 'Usuario no autenticado'
                ], 401);
            }

            if (!$gasto->estado_gasto) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'mensaje' => 'No se puede pagar un gasto inactivo'
                ], 422);
            }

            $monto = $request->monto;
            $fecha = now();
            $concepto = 'Pago de gasto: ' . $gasto->nombre_gasto;

            /* ═══════════════════════════════
                🔥 PAGO CON CAJA
            ═══════════════════════════════ */
            if ($request->id_caja) {

                $caja = Caja::lockForUpdate()->find($request->id_caja);

                if (!$caja) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'mensaje' => 'Caja no encontrada'
                    ], 404);
                }

                if (!$caja->estado_caja) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'mensaje' => 'No se puede pagar desde una caja cerrada'
                    ], 422);
                }

                $totalesCaja = MovimientoCaja::where('id_caja', $caja->id_caja)
                    ->selectRaw("SUM(CASE WHEN tipo_movimiento_caja = 'INGRESO' THEN monto_movimiento_caja ELSE 0 END) AS ingresos, SUM(CASE WHEN tipo_movimiento_caja = 'SALIDA' THEN monto_movimiento_caja ELSE 0 END) AS salidas")
                    ->first();
                $saldoCaja = (float) $caja->monto_inicial + (float) $totalesCaja->ingresos - (float) $totalesCaja->salidas;

                if ($monto > $saldoCaja) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'mensaje' => 'Saldo insuficiente en caja'
                    ], 422);
                }

                // 🔥 DESCONTAR CAJA (MOVIMIENTO)
                MovimientoCaja::create([
                    'id_caja' => $caja->id_caja,
                    'tipo_movimiento_caja' => 'SALIDA',
                    'concepto_movimiento_caja' => $concepto,
                    'monto_movimiento_caja' => $monto,
                    'fecha_movimiento_caja' => $fecha,
                    'id_usuario' => $idUsuario
                ]);
            }

            /* ═══════════════════════════════
                🔥 PAGO CON CUENTA
            ═══════════════════════════════ */
            if ($request->id_cuenta) {

                $cuenta = Cuenta::lockForUpdate()->find($request->id_cuenta);

                if (!$cuenta) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'mensaje' => 'Cuenta no encontrada'
                    ], 404);
                }

                if (!$cuenta->estado) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'mensaje' => 'No se puede pagar desde una cuenta inactiva'
                    ], 422);
                }

                if ($monto > $cuenta->saldo_actual) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'mensaje' => 'Saldo insuficiente en cuenta'
                    ], 422);
                }

                // 🔥 DESCONTAR CUENTA
                $cuenta->saldo_actual -= $monto;
                $cuenta->save();

                // 🔥 MOVIMIENTO CUENTA
                MovimientoCuenta::create([
                    'id_cuenta' => $cuenta->id_cuenta,
                    'tipo_movimiento' => 'SALIDA',
                    'descripcion' => $concepto,
                    'monto' => $monto,
                    'fecha' => $fecha,
                    'id_usuario' => $idUsuario
                ]);
            }

            /* ═══════════════════════════════
                🔥 REGISTRO GASTO
            ═══════════════════════════════ */
            MovimientoGasto::create([
                'id_gasto' => $gasto->id_gasto,
                'monto' => $monto,
                'origen' => $request->id_caja ? 'CAJA' : 'CUENTA',
                'id_caja' => $request->id_caja,
                'id_cuenta' => $request->id_cuenta,
                'fecha' => $fecha,
                'id_usuario' => $idUsuario,
                'observacion' => $concepto
            ]);

            /* ═══════════════════════════════
                🔥 RENOVACIÓN DE VENCIMIENTO
            ═══════════════════════════════ */
            $fechaBaseProximoPago = Carbon::parse($gasto->proximo_pago ?: $gasto->fecha_pago ?: $fecha->toDateString());

            $gasto->ultimo_pago = $fecha->toDateString();
            $gasto->estado_pago = 'PAGADO';

            if ($request->renovar_vencimiento === 'manual') {

                // Se programó una fecha concreta para el próximo pago.
                $gasto->fecha_pago = $fecha->toDateString();
                $gasto->proximo_pago = $request->nueva_fecha;

            } elseif ($request->renovar_vencimiento === 'auto') {

                // Se mantiene la regla de renovar un mes.
                $gasto->fecha_pago = $fecha->toDateString();
                $gasto->proximo_pago = $fechaBaseProximoPago->addMonthNoOverflow()->toDateString();

            } else {

                // Pago irregular: no hay próxima fecha programada.
                $gasto->fecha_pago = null;
                $gasto->proximo_pago = null;
            }

            $gasto->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'mensaje' => 'Pago registrado correctamente'
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {

            return response()->json([
                'success' => false,
                'mensaje' => 'Errores de validación',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'mensaje' => 'Error al registrar pago',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    public function MostrarCajasGastos()
    {
        try {

            $cajas = Caja::with('usuario')
                ->where('estado_caja', 1)
                ->orderBy('id_caja', 'asc')
                ->get();

            $totales = MovimientoCaja::whereIn('id_caja', $cajas->pluck('id_caja'))
                ->selectRaw("id_caja, SUM(CASE WHEN tipo_movimiento_caja = 'INGRESO' THEN monto_movimiento_caja ELSE 0 END) AS ingresos, SUM(CASE WHEN tipo_movimiento_caja = 'SALIDA' THEN monto_movimiento_caja ELSE 0 END) AS salidas")
                ->groupBy('id_caja')
                ->get()
                ->keyBy('id_caja');

            $cajas = $cajas->map(function ($caja) use ($totales) {
                    $movimientos = $totales->get($caja->id_caja);
                    $saldo = (float) $caja->monto_inicial
                        + (float) ($movimientos->ingresos ?? 0)
                        - (float) ($movimientos->salidas ?? 0);

                    return [
                        'id' => $caja->id_caja,
                        'saldo' => round($saldo, 2),
                        'display' => "Caja #{$caja->id_caja} - {$caja->usuario->nombre_usuario} (Saldo: C$ " . number_format($saldo, 2) . ")"
                    ];
                });

            return response()->json([
                'success' => true,
                'cajas' => $cajas
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener cajas',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }


    public function MostrarCuentasGastos()
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
                    'saldo' => (float) $cuenta->saldo_actual,
                    'saldo_actual' => number_format($cuenta->saldo_actual, 2),
                    'display' => "{$cuenta->nombre_cuenta} (Saldo: C$ " . number_format($cuenta->saldo_actual, 2) . ")"
                ];
            });

            return response()->json([
                'success' => true,
                'cuentas' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al obtener cuentas'
            ], 500);
        }
    }
}
