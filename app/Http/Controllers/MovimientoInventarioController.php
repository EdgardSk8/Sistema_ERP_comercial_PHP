<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MovimientoInventario;

class MovimientoInventarioController extends Controller
{

/*  ╔═════ Mostrar Movimiento Inventario ═════╗ 
    ╚═════════════════════════════════════════╝ */
    public function MostrarMovimientosInventario()
    {
        try {

            $movimientos = MovimientoInventario::select(
                    'movimientos_inventario.id_movimiento_inventario',
                    'movimientos_inventario.id_producto',
                    'movimientos_inventario.id_variacion_talla',
                    'productos.nombre_producto',
                    'producto_variaciones.color as color_variacion',
                    'tallas.talla as talla_variacion',
                    'movimientos_inventario.tipo_movimiento',
                    'movimientos_inventario.cantidad_movimiento',
                    'movimientos_inventario.stock_resultante',
                    'movimientos_inventario.motivo_movimiento',
                    'movimientos_inventario.id_referencia',
                    'movimientos_inventario.tipo_referencia',
                    'movimientos_inventario.precio_unitario',
                    'movimientos_inventario.fecha_movimiento',
                    'movimientos_inventario.id_usuario',
                    'usuarios.nombre_completo_usuario'
                )
                ->join('productos', 'movimientos_inventario.id_producto', '=', 'productos.id_producto')
                ->leftJoin('variacion_tallas', 'movimientos_inventario.id_variacion_talla', '=', 'variacion_tallas.id_variacion_talla')
                ->leftJoin('producto_variaciones', 'variacion_tallas.id_variacion', '=', 'producto_variaciones.id_variacion')
                ->leftJoin('tallas', 'variacion_tallas.id_talla', '=', 'tallas.id_talla')
                ->join('usuarios', 'movimientos_inventario.id_usuario', '=', 'usuarios.id_usuario')
                ->orderBy('movimientos_inventario.fecha_movimiento', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'movimientos' => $movimientos
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener movimientos de inventario',
                'detalle' => $e->getMessage()
            ], 500);

        }
    }
    
}
