<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MovimientoInventario;
use App\Support\DataTableServidor;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MovimientoInventarioController extends Controller
{

/*  ╔═════ Mostrar Movimiento Inventario ═════╗ 
    ╚═════════════════════════════════════════╝ */
    public function MostrarMovimientosInventario(Request $request)
    {
        try {

            $consulta = MovimientoInventario::query()->select(
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
                ->join('usuarios', 'movimientos_inventario.id_usuario', '=', 'usuarios.id_usuario');

            // Modo compatible: sin parametros de DataTables devuelve todo (como antes).
            if (! $request->filled('draw')) {

                return response()->json([
                    'success' => true,
                    'movimientos' => $consulta->orderBy('movimientos_inventario.fecha_movimiento', 'asc')->get(),
                ], 200);

            }

            // Modo servidor: la base solo devuelve la pagina visible.
            return DataTableServidor::responder($request, $consulta, [
                'columnas' => [
                    0 => ['col' => 'movimientos_inventario.id_movimiento_inventario'],
                    1 => ['col' => 'usuarios.nombre_completo_usuario', 'buscar' => true],
                    2 => ['fecha' => 'movimientos_inventario.fecha_movimiento'],
                    3 => ['col' => 'productos.nombre_producto', 'buscar' => true],
                    5 => ['col' => 'movimientos_inventario.tipo_movimiento'],
                    6 => ['col' => 'movimientos_inventario.tipo_referencia'],
                    7 => ['col' => 'movimientos_inventario.motivo_movimiento'],
                    8 => ['col' => 'movimientos_inventario.cantidad_movimiento'],
                    9 => ['col' => 'movimientos_inventario.stock_resultante'],
                    10 => ['col' => 'movimientos_inventario.precio_unitario'],
                ],
                'orden' => [
                    1 => 'usuarios.nombre_completo_usuario',
                    3 => 'productos.nombre_producto',
                ],
                'ordenDefault' => ['columna' => 'movimientos_inventario.id_movimiento_inventario', 'dir' => 'desc'],
                'extras' => ['opciones' => $this->opcionesFiltrosKardex()],
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener movimientos de inventario',
                'detalle' => $e->getMessage()
            ], 500);

        }
    }

    /**
     * Valores para los filtros de columna (usuario, tipo y referencia),
     * indexados por la posicion de la columna. Se cachean.
     *
     * @return array<int, array<int, string>>
     */
    private function opcionesFiltrosKardex(): array
    {
        return Cache::remember('kardex_opciones_filtros', now()->addMinutes(10), function () {

            return [
                1 => DB::table('movimientos_inventario')
                    ->join('usuarios', 'movimientos_inventario.id_usuario', '=', 'usuarios.id_usuario')
                    ->distinct()
                    ->orderBy('usuarios.nombre_completo_usuario')
                    ->pluck('usuarios.nombre_completo_usuario')
                    ->all(),

                5 => DB::table('movimientos_inventario')
                    ->distinct()
                    ->orderBy('tipo_movimiento')
                    ->pluck('tipo_movimiento')
                    ->filter()
                    ->values()
                    ->all(),

                6 => DB::table('movimientos_inventario')
                    ->distinct()
                    ->orderBy('tipo_referencia')
                    ->pluck('tipo_referencia')
                    ->filter()
                    ->values()
                    ->all(),
            ];

        });
    }
    
}
