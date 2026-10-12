<?php

namespace App\Services;

use App\Models\AplicacionPagoCuota;
use App\Models\Caja;
use App\Models\Cuenta;
use App\Models\MetodoPagoCuenta;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuenta;
use App\Models\PagoVenta;
use App\Models\Venta;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class RegistrarPagoVenta
{
    public function registrar(
        int $idVenta,
        float $monto,
        int $idMetodoPago,
        ?int $idCuenta,
        int $idUsuario,
        ?string $referencia = null
    ): PagoVenta {
        $montoCentavos = (int) round($monto * 100);
        if ($montoCentavos <= 0) {
            throw new RuntimeException('El abono debe ser mayor que cero.');
        }

        $venta = Venta::where('id_venta', $idVenta)->lockForUpdate()->first();
        if (!$venta || !$venta->planPago || !$venta->estado_venta) {
            throw new RuntimeException('La venta no tiene un plan de pagos activo.');
        }

        $caja = Caja::where('estado_caja', 1)
            ->where('id_usuario', $idUsuario)
            ->lockForUpdate()
            ->first();
        if (!$caja) {
            throw new RuntimeException('Abre tu caja antes de registrar un abono.');
        }

        if ($idMetodoPago === 1) {
            $idCuenta = null;
        } else {
            if (!$idCuenta || !MetodoPagoCuenta::where('id_metodo_pago', $idMetodoPago)
                ->where('id_cuenta', $idCuenta)
                ->where('estado', 1)
                ->whereHas('cuenta', fn ($query) => $query->where('estado', 1))
                ->exists()) {
                throw new RuntimeException('Selecciona una cuenta activa asociada al método de pago.');
            }
        }

        $cuotas = $venta->planPago->cuotas()
            ->withSum('aplicaciones as monto_aplicado', 'monto_aplicado')
            ->orderBy('fecha_vencimiento')
            ->orderBy('numero_cuota')
            ->lockForUpdate()
            ->get();

        $saldos = [];
        $saldoTotalCentavos = 0;
        foreach ($cuotas as $cuota) {
            $cuotaCentavos = (int) round((float) $cuota->monto_cuota * 100);
            $aplicadoCentavos = (int) round((float) ($cuota->monto_aplicado ?? 0) * 100);
            $saldoCentavos = max($cuotaCentavos - $aplicadoCentavos, 0);
            $saldos[] = [$cuota, $saldoCentavos];
            $saldoTotalCentavos += $saldoCentavos;
        }

        if ($montoCentavos > $saldoTotalCentavos) {
            throw new RuntimeException('El abono supera el saldo pendiente de la venta.');
        }

        $pago = PagoVenta::create([
            'id_venta' => $venta->id_venta,
            'id_metodo_pago' => $idMetodoPago,
            'id_caja' => $caja->id_caja,
            'id_cuenta' => $idCuenta,
            'id_usuario' => $idUsuario,
            'monto_pago' => $montoCentavos / 100,
            'fecha_pago' => now(),
            'referencia_pago' => $referencia
        ]);

        $pendientePorAplicar = $montoCentavos;
        foreach ($saldos as [$cuota, $saldoCuotaCentavos]) {
            if ($pendientePorAplicar === 0) break;
            if ($saldoCuotaCentavos === 0) continue;

            $montoAplicadoCentavos = min($pendientePorAplicar, $saldoCuotaCentavos);
            AplicacionPagoCuota::create([
                'id_pago_venta' => $pago->id_pago_venta,
                'id_cuota' => $cuota->id_cuota,
                'monto_aplicado' => $montoAplicadoCentavos / 100
            ]);
            $pendientePorAplicar -= $montoAplicadoCentavos;
        }

        if ($idMetodoPago === 1) {
            MovimientoCaja::create([
                'id_caja' => $caja->id_caja,
                'tipo_movimiento_caja' => 'INGRESO',
                'concepto_movimiento_caja' => 'Abono de venta ' . $venta->numero_factura,
                'monto_movimiento_caja' => $montoCentavos / 100,
                'id_usuario' => $idUsuario,
                'id_referencia' => $venta->id_venta,
                'id_pago_venta' => $pago->id_pago_venta
            ]);
        } else {
            $cuenta = Cuenta::where('id_cuenta', $idCuenta)->lockForUpdate()->first();
            if (!$cuenta || !$cuenta->estado) {
                throw new RuntimeException('La cuenta seleccionada ya no está activa.');
            }

            $cuenta->increment('saldo_actual', $montoCentavos / 100);
            MovimientoCuenta::create([
                'id_cuenta' => $cuenta->id_cuenta,
                'tipo_movimiento' => 'INGRESO',
                'monto' => $montoCentavos / 100,
                'descripcion' => 'Abono de venta ' . $venta->numero_factura,
                'fecha' => now(),
                'id_usuario' => $idUsuario,
                'id_pago_venta' => $pago->id_pago_venta
            ]);
        }

        return $pago;
    }
}