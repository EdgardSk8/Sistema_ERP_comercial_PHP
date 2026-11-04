<?php

namespace App\Http\Controllers;

use App\Models\MovimientoCaja;

class MovimientoCajaController extends Controller
{
    /*  ╔═════ Mostrar Movimientos de Caja ═════╗
        ╚═══════════════════════════════════════╝ */
    public function MostrarMovimientosCaja()
    {
        try {

            $movimientos = MovimientoCaja::select(
                'movimientos_caja.id_movimiento_caja',
                'movimientos_caja.id_caja',
                'cajas.fecha_apertura',
                'movimientos_caja.tipo_movimiento_caja',
                'movimientos_caja.concepto_movimiento_caja',
                'movimientos_caja.monto_movimiento_caja',
                'movimientos_caja.fecha_movimiento_caja',
                'movimientos_caja.id_usuario',
                'usuarios.nombre_completo_usuario',
                'movimientos_caja.id_referencia',
                'movimientos_caja.id_cuenta_destino',
                'cuentas.nombre_cuenta as cuenta_destino'
            )
                ->join('cajas', 'movimientos_caja.id_caja', '=', 'cajas.id_caja')
                ->join('usuarios', 'movimientos_caja.id_usuario', '=', 'usuarios.id_usuario')
                ->leftJoin('cuentas', 'movimientos_caja.id_cuenta_destino', '=', 'cuentas.id_cuenta')
                ->orderBy('movimientos_caja.fecha_movimiento_caja', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'movimientos' => $movimientos,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener movimientos de caja',
                'detalle' => $e->getMessage(),
            ], 500);

        }
    }
}
