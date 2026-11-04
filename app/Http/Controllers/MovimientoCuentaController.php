<?php

namespace App\Http\Controllers;

use App\Models\MovimientoCuenta;

class MovimientoCuentaController extends Controller
{
    public function MostrarMovimientosCuenta()
    {
        try {

            $movimientos = MovimientoCuenta::select(
                'movimientos_cuentas.id_movimiento_cuenta',
                'movimientos_cuentas.id_cuenta',
                'cuentas.nombre_cuenta',
                'movimientos_cuentas.tipo_movimiento',
                'movimientos_cuentas.monto',
                'movimientos_cuentas.descripcion',
                'movimientos_cuentas.id_transferencia',
                'movimientos_cuentas.fecha',
                'movimientos_cuentas.id_usuario',
                'usuarios.nombre_completo_usuario'
            )
                ->join('cuentas', 'movimientos_cuentas.id_cuenta', '=', 'cuentas.id_cuenta')
                ->join('usuarios', 'movimientos_cuentas.id_usuario', '=', 'usuarios.id_usuario')
                ->orderBy('movimientos_cuentas.id_cuenta', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'movimientos' => $movimientos,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener movimientos de cuentas',
                'detalle' => $e->getMessage(),
            ], 500);

        }
    }
}
