<?php

namespace App\Http\Controllers;

use App\Models\MovimientoGasto;

class MovimientoGastoController extends Controller
{
    public function MostrarMovimientosGastos()
    {
        try {

            $movimientos = MovimientoGasto::with([
                'gasto:id_gasto,nombre_gasto',
                'usuario:id_usuario,nombre_usuario',
                'caja:id_caja',
                'cuenta:id_cuenta,nombre_cuenta',
            ])
                ->orderBy('fecha', 'desc')
                ->get()
                ->map(function ($m) {

                    return [
                        'id' => $m->id_movimiento_gasto,
                        'fecha' => $m->fecha,
                        'monto' => $m->monto,
                        'origen' => $m->origen,
                        'observacion' => $m->observacion,

                        // 🔹 gasto
                        'gasto' => [
                            'id' => $m->gasto?->id_gasto,
                            'nombre' => $m->gasto?->nombre_gasto ?? '—',
                        ],

                        // 🔹 usuario
                        'usuario' => [
                            'id' => $m->id_usuario,
                            'nombre' => $m->usuario?->nombre_usuario ?? '—',
                        ],

                        // 🔹 caja (opcional)
                        'caja' => $m->caja ? [
                            'id' => $m->caja->id_caja,
                        ] : null,

                        // 🔹 cuenta (opcional)
                        'cuenta' => $m->cuenta ? [
                            'id' => $m->cuenta->id_cuenta,
                            'nombre' => $m->cuenta->nombre_cuenta,
                        ] : null,
                    ];
                });

            return response()->json([
                'success' => true,
                'movimientos' => $movimientos,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener historial de gastos',
                'detalle' => $e->getMessage(),
            ], 500);

        }
    }
}
