<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\MovimientoCaja;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CajaController extends Controller
{ /* MODIFICAR */

    /*  ╔════════════ Abrir Caja ═════════════╗
        ╚═════════════════════════════════════╝ */

    public function AbrirCaja(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'monto_inicial' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $idUsuario = session('usuario.id');

        if (! $idUsuario) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Sesión no válida',
            ], 401);
        }

        try {

            DB::transaction(function () use ($request, $idUsuario, &$caja) {

                $cajaAbierta = Caja::where('estado_caja', 1)
                    ->where('id_usuario', $idUsuario)
                    ->lockForUpdate()
                    ->first();

                if ($cajaAbierta) {
                    throw new \Exception('Ya tienes una caja abierta.');
                }

                $caja = Caja::create([
                    'fecha_apertura' => now(),
                    'monto_inicial' => $request->monto_inicial,
                    'id_usuario' => $idUsuario,
                    'estado_caja' => 1,
                ]);
            });

            session(['caja_id' => $caja->id_caja]);

            return response()->json([
                'success' => true,
                'mensaje' => 'Caja abierta correctamente',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'mensaje' => $e->getMessage(),
            ], 400);
        }
    }

    /*  ╔════════════ Cerrar Caja ═════════════╗
        ╚══════════════════════════════════════╝ */

    public function CerrarCaja()
    {
        $idUsuario = session('usuario.id');

        if (! $idUsuario) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Sesión no válida',
            ], 401);
        }

        try {

            $cajaCerrada = DB::transaction(function () use ($idUsuario) {
                $caja = Caja::where('estado_caja', 1)
                    ->where('id_usuario', $idUsuario)
                    ->lockForUpdate()
                    ->first();

                if (! $caja) {
                    return null;
                }

                $totales = $this->calcularTotalesCaja($caja);

                $caja->update([
                    'fecha_cierre' => now(),
                    'monto_final' => $totales['monto_teorico'],
                    'monto_teorico' => $totales['monto_teorico'],
                    'monto_real' => null,
                    'diferencia' => null,
                    'estado_caja' => 0,
                ]);

                return [
                    'id_caja' => $caja->id_caja,
                    'monto_teorico' => $totales['monto_teorico'],
                ];
            });

            if (! $cajaCerrada) {
                return response()->json([
                    'success' => false,
                    'mensaje' => 'No hay caja abierta',
                ], 400);
            }

            session()->forget('caja_id');

            return response()->json([
                'success' => true,
                'mensaje' => 'Caja cerrada correctamente',
                'total' => $cajaCerrada['monto_teorico'],
                'caja' => $cajaCerrada,
            ]);

        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,
                'mensaje' => $e->getMessage(),
            ], 500);
        }
    }

    /*  ╔════════════ Verificar Caja ════════════╗
        ╚════════════════════════════════════════╝ */

    public function VerificarCaja()
    {
        $idUsuario = session('usuario.id');

        if (! $idUsuario) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Sesión no válida',
            ], 401);
        }

        $caja = Caja::where('estado_caja', 1)
            ->where('id_usuario', $idUsuario)
            ->first();

        return response()->json([
            'abierta' => $caja ? true : false,
            'id_caja' => $caja ? $caja->id_caja : null,
            'usuario' => session('usuario'),
        ]);
    }

    /*  ╔════════════ Registro Caja ═════════════╗
        ╚════════════════════════════════════════╝ */

    public function RegistroCajas()
    {
        try {

            $cajas = Caja::with('usuario')
                ->orderBy('id_caja', 'desc')
                ->paginate(10);

            return response()->json([
                'success' => true,
                'data' => $cajas,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'mensaje' => 'Error al obtener historial',
                'detalle' => $e->getMessage(),
            ], 500);
        }
    }

    public function MostrarArqueo(Request $request)
    {
        [$inicio, $fin] = $this->validarRangoArqueo($request);
        $arqueo = $this->obtenerDatosArqueo($inicio, $fin);

        return response()->json([
            'success' => true,
            'fecha_inicio' => $inicio?->toDateString(),
            'fecha_fin' => $fin?->toDateString(),
            ...$arqueo,
        ]);
    }

    public function ImprimirArqueo(Request $request)
    {
        [$inicio, $fin] = $this->validarRangoArqueo($request);
        $arqueo = $this->obtenerDatosArqueo($inicio, $fin);

        return view('cajas.ArqueoImpresion', [
            'tipo' => 'periodo',
            'fechaInicio' => $inicio?->toDateString(),
            'fechaFin' => $fin?->toDateString(),
            'cajas' => $arqueo['cajas'],
            'resumen' => $arqueo['resumen'],
        ]);
    }

    public function ImprimirArqueoCaja($id)
    {
        $caja = Caja::with(['usuario', 'movimientos.usuario'])->find($id);

        if (! $caja) {
            abort(404);
        }

        if ($caja->estado_caja || $caja->monto_real === null) {
            abort(422, 'La caja todavía no tiene un arqueo cerrado.');
        }

        $totales = $this->calcularTotalesCaja($caja);
        $montoReal = (float) $caja->monto_real;
        $diferencia = round($montoReal - $totales['monto_teorico'], 2);

        return view('cajas.ArqueoImpresion', [
            'tipo' => 'caja',
            'fechaInicio' => null,
            'fechaFin' => null,
            'cajas' => [[
                'id_caja' => $caja->id_caja,
                'usuario' => $caja->usuario?->nombre_completo_usuario ?? $caja->usuario?->nombre_usuario ?? '-',
                'fecha_apertura' => $caja->fecha_apertura,
                'fecha_cierre' => $caja->fecha_cierre,
                'monto_inicial' => (float) $caja->monto_inicial,
                'ingresos' => $totales['ingresos'],
                'salidas' => $totales['salidas'],
                'monto_teorico' => $totales['monto_teorico'],
                'monto_real' => $montoReal,
                'diferencia' => $diferencia,
                'estado_caja' => false,
                'movimientos' => $caja->movimientos,
            ]],
            'resumen' => [
                'total_cajas' => 1,
                'cajas_abiertas' => 0,
                'cajas_cerradas' => 1,
                'monto_inicial' => (float) $caja->monto_inicial,
                'ingresos' => $totales['ingresos'],
                'salidas' => $totales['salidas'],
                'monto_teorico' => $totales['monto_teorico'],
                'monto_real' => $montoReal,
                'diferencia' => $diferencia,
                'sobrante' => max($diferencia, 0),
                'faltante' => abs(min($diferencia, 0)),
            ],
        ]);
    }

    public function GuardarArqueo(Request $request, $id)
    {
        $datos = $request->validate([
            'monto_real' => 'required|numeric|min:0',
        ]);

        try {
            $arqueo = DB::transaction(function () use ($id, $datos) {
                $caja = Caja::lockForUpdate()->find($id);

                if (! $caja) {
                    return null;
                }

                if ($caja->estado_caja) {
                    throw new \DomainException('Cierre la caja antes de registrarle el arqueo.');
                }

                $totales = $this->calcularTotalesCaja($caja);
                $montoReal = round((float) $datos['monto_real'], 2);
                $diferencia = round($montoReal - $totales['monto_teorico'], 2);

                $caja->update([
                    'monto_final' => $totales['monto_teorico'],
                    'monto_teorico' => $totales['monto_teorico'],
                    'monto_real' => $montoReal,
                    'diferencia' => $diferencia,
                ]);

                return [
                    'id_caja' => $caja->id_caja,
                    'monto_inicial' => (float) $caja->monto_inicial,
                    'monto_teorico' => $totales['monto_teorico'],
                    'monto_real' => $montoReal,
                    'diferencia' => $diferencia,
                ];
            });

            if (! $arqueo) {
                return response()->json(['success' => false, 'mensaje' => 'Caja no encontrada'], 404);
            }

            return response()->json(['success' => true, 'arqueo' => $arqueo]);
        } catch (\DomainException $e) {
            return response()->json(['success' => false, 'mensaje' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'mensaje' => 'No se pudo guardar el arqueo'], 500);
        }
    }

    private function calcularTotalesCaja(Caja $caja): array
    {
        $movimientos = MovimientoCaja::where('id_caja', $caja->id_caja)
            ->selectRaw("
                SUM(CASE WHEN tipo_movimiento_caja = 'INGRESO' THEN monto_movimiento_caja ELSE 0 END) AS ingresos,
                SUM(CASE WHEN tipo_movimiento_caja = 'SALIDA' THEN monto_movimiento_caja ELSE 0 END) AS salidas
            ")
            ->first();

        $ingresos = round((float) ($movimientos->ingresos ?? 0), 2);
        $salidas = round((float) ($movimientos->salidas ?? 0), 2);

        return [
            'ingresos' => $ingresos,
            'salidas' => $salidas,
            'monto_teorico' => round((float) $caja->monto_inicial + $ingresos - $salidas, 2),
        ];
    }

    private function validarRangoArqueo(Request $request): array
    {
        $inicio = $request->input('fecha_inicio') ?: null;
        $fin = $request->input('fecha_fin') ?: null;

        if ($inicio && ! $fin) {
            $fin = $inicio;
        } elseif (! $inicio && $fin) {
            $inicio = $fin;
        }

        $fechas = Validator::make([
            'fecha_inicio' => $inicio,
            'fecha_fin' => $fin,
        ], [
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
        ]);
        $fechas = $fechas->validate();

        if (! $fechas['fecha_inicio'] && ! $fechas['fecha_fin']) {
            return [null, null];
        }

        return [
            Carbon::parse($fechas['fecha_inicio'])->startOfDay(),
            Carbon::parse($fechas['fecha_fin'])->endOfDay(),
        ];
    }

    private function obtenerDatosArqueo(?Carbon $inicio, ?Carbon $fin): array
    {
        $consulta = Caja::with('usuario')
            ->orderBy('fecha_apertura')
            ->orderBy('id_caja');

        if ($inicio && $fin) {
            $consulta->whereBetween('fecha_apertura', [$inicio, $fin]);
        }

        $filas = $consulta->get()
            ->map(function (Caja $caja) {
                $totales = $this->calcularTotalesCaja($caja);
                $montoTeorico = $totales['monto_teorico'];
                $montoReal = $caja->monto_real !== null ? (float) $caja->monto_real : null;

                return [
                    'id_caja' => $caja->id_caja,
                    'usuario' => $caja->usuario?->nombre_completo_usuario ?? $caja->usuario?->nombre_usuario ?? '-',
                    'fecha_apertura' => $caja->fecha_apertura,
                    'fecha_cierre' => $caja->fecha_cierre,
                    'monto_inicial' => (float) $caja->monto_inicial,
                    'ingresos' => $totales['ingresos'],
                    'salidas' => $totales['salidas'],
                    'monto_teorico' => $montoTeorico,
                    'monto_real' => $montoReal,
                    'diferencia' => $montoReal !== null ? round($montoReal - $montoTeorico, 2) : null,
                    'estado_caja' => (bool) $caja->estado_caja,
                ];
            });

        $cerradas = $filas->where('estado_caja', false);
        $diferencias = $cerradas->pluck('diferencia')->filter(fn ($valor) => $valor !== null);

        return [
            'cajas' => $filas->values(),
            'resumen' => [
                'total_cajas' => $filas->count(),
                'cajas_abiertas' => $filas->where('estado_caja', true)->count(),
                'cajas_cerradas' => $cerradas->count(),
                'monto_inicial' => round($filas->sum('monto_inicial'), 2),
                'ingresos' => round($filas->sum('ingresos'), 2),
                'salidas' => round($filas->sum('salidas'), 2),
                'monto_teorico' => round($filas->sum('monto_teorico'), 2),
                'monto_real' => round($cerradas->sum('monto_real'), 2),
                'diferencia' => round($diferencias->sum(), 2),
                'sobrante' => round($diferencias->filter(fn ($valor) => $valor > 0)->sum(), 2),
                'faltante' => round(abs($diferencias->filter(fn ($valor) => $valor < 0)->sum()), 2),
            ],
        ];
    }
}
