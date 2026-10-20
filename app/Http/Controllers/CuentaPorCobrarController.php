<?php

namespace App\Http\Controllers;

use App\Models\PlanPago;
use App\Services\RegistrarPagoVenta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Throwable;

class CuentaPorCobrarController extends Controller
{
    public function Mostrar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'cliente' => 'nullable|integer|exists:clientes,id_cliente',
            'estado' => 'nullable|in:todas,pendiente,parcial,atrasada,pagada'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $consulta = PlanPago::with([
            'venta.cliente:id_cliente,nombre_cliente',
            'venta.pagos.metodoPago:id_metodo_pago,nombre_metodo_pago',
            'venta.pagos.cuenta:id_cuenta,nombre_cuenta',
            'cuotas.aplicaciones'
        ])->whereHas('venta', function ($query) use ($request) {
            $query->where('estado_venta', 1);
            if ($request->filled('cliente')) {
                $query->where('id_cliente', $request->integer('cliente'));
            }
        })->orderByDesc('id_plan_pago');

        // El filtro por estado se resuelve en SQL: asi la base no devuelve
        // planes que se van a descartar despues en PHP.
        $this->filtrarPorEstadoEnSql($consulta, $request->input('estado'), now()->startOfDay()->toDateString());

        $hoy = now()->startOfDay();
        $planes = $consulta->get()->map(function (PlanPago $plan) use ($hoy) {
            $cuotas = $plan->cuotas->map(function ($cuota) use ($hoy) {
                $pagado = round((float) $cuota->aplicaciones->sum('monto_aplicado'), 2);
                $saldo = max(round((float) $cuota->monto_cuota - $pagado, 2), 0);
                $vencimiento = $cuota->fecha_vencimiento->startOfDay();
                $estado = $saldo <= 0
                    ? 'pagada'
                    : ($vencimiento->lt($hoy) ? 'atrasada' : ($pagado > 0 ? 'parcial' : 'pendiente'));

                return [
                    'id_cuota' => $cuota->id_cuota,
                    'numero' => $cuota->numero_cuota,
                    'fecha_vencimiento' => $vencimiento->toDateString(),
                    'monto' => (float) $cuota->monto_cuota,
                    'pagado' => $pagado,
                    'saldo' => $saldo,
                    'estado' => $estado,
                    'dias_atraso' => $estado === 'atrasada' ? $vencimiento->diffInDays($hoy) : 0
                ];
            });

            $saldo = round($cuotas->sum('saldo'), 2);
            $estado = $saldo <= 0
                ? 'pagada'
                : ($cuotas->contains('estado', 'atrasada')
                    ? 'atrasada'
                    : ($cuotas->contains('estado', 'parcial') ? 'parcial' : 'pendiente'));

            return [
                'id_venta' => $plan->venta->id_venta,
                'numero_factura' => $plan->venta->numero_factura,
                'id_cliente' => $plan->venta->id_cliente,
                'cliente' => $plan->venta->cliente?->nombre_cliente ?? 'Cliente',
                'fecha_venta' => $plan->venta->fecha_venta,
                'total' => (float) $plan->venta->total_venta,
                'saldo' => $saldo,
                'estado' => $estado,
                'cuotas' => $cuotas,
                'pagos' => $plan->venta->pagos->map(fn ($pago) => [
                    'id_pago' => $pago->id_pago_venta,
                    'fecha' => $pago->fecha_pago,
                    'monto' => (float) $pago->monto_pago,
                    'metodo' => $pago->metodoPago?->nombre_metodo_pago ?? 'Método de pago',
                    'cuenta' => $pago->cuenta?->nombre_cuenta,
                    'referencia' => $pago->referencia_pago
                ])
            ];
        });

        if ($request->filled('estado') && $request->estado !== 'todas') {
            $planes = $planes->where('estado', $request->estado)->values();
        }

        return response()->json(['success' => true, 'planes' => $planes]);
    }

    /**
     * Reduce en SQL los planes segun su estado de cobro. El estado real se
     * sigue calculando en PHP al armar la respuesta, esto solo evita traer
     * de la base lo que se va a descartar.
     */
    private function filtrarPorEstadoEnSql($consulta, ?string $estado, string $hoy): void
    {
        if (! $estado || $estado === 'todas') {
            return;
        }

        $totalCuotas = '(select coalesce(sum(c.monto_cuota), 0) from cuotas_venta c where c.id_plan_pago = planes_pago.id_plan_pago)';

        $pagadoCuotas = '(select coalesce(sum(a.monto_aplicado), 0) from aplicaciones_pago_cuota a
            join cuotas_venta c2 on c2.id_cuota = a.id_cuota
            where c2.id_plan_pago = planes_pago.id_plan_pago)';

        $cuotaVencida = "(select count(*) from cuotas_venta c3
            where c3.id_plan_pago = planes_pago.id_plan_pago
              and c3.fecha_vencimiento < '{$hoy}'
              and c3.monto_cuota > (select coalesce(sum(a3.monto_aplicado), 0) from aplicaciones_pago_cuota a3 where a3.id_cuota = c3.id_cuota))";

        match ($estado) {
            'pagada' => $consulta->whereRaw("({$totalCuotas} - {$pagadoCuotas}) <= 0"),

            'atrasada' => $consulta
                ->whereRaw("({$totalCuotas} - {$pagadoCuotas}) > 0")
                ->whereRaw("{$cuotaVencida} > 0"),

            'parcial' => $consulta
                ->whereRaw("({$totalCuotas} - {$pagadoCuotas}) > 0")
                ->whereRaw("{$pagadoCuotas} > 0")
                ->whereRaw("{$cuotaVencida} = 0"),

            'pendiente' => $consulta
                ->whereRaw("({$totalCuotas} - {$pagadoCuotas}) > 0")
                ->whereRaw("{$pagadoCuotas} = 0")
                ->whereRaw("{$cuotaVencida} = 0"),

            default => null,
        };
    }

    public function RegistrarPago(Request $request, int $idVenta, RegistrarPagoVenta $registrarPago)
    {
        $validator = Validator::make($request->all(), [
            'monto' => 'required|numeric|gt:0',
            'id_metodo_pago' => 'required|integer|exists:metodos_pago,id_metodo_pago',
            'id_cuenta' => 'nullable|integer|exists:cuentas,id_cuenta',
            'referencia' => 'nullable|string|max:120'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $pago = DB::transaction(fn () => $registrarPago->registrar(
                $idVenta,
                (float) $request->monto,
                (int) $request->id_metodo_pago,
                $request->filled('id_cuenta') ? (int) $request->id_cuenta : null,
                (int) session('usuario.id'),
                $request->input('referencia')
            ));

            return response()->json([
                'success' => true,
                'mensaje' => 'Abono registrado correctamente.',
                'id_pago' => $pago->id_pago_venta
            ]);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'mensaje' => $e->getMessage()], 422);
        }
    }
}