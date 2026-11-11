<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ArqueoTrabajadorService
{
    /**
     * Resumen de entregas pendientes de arqueo e historial de cierres.
     *
     * @return array<string, mixed>
     */
    public function resumen(int $idTrabajador, string $desde, string $hasta): array
    {
        $trabajador = DB::table('trabajadores')
            ->where('id_trabajador', $idTrabajador)
            ->first();

        if (! $trabajador) {
            throw new InvalidArgumentException('Repartidor no encontrado.');
        }

        $comision = round((float) ($trabajador->porcentaje_comision ?? 0), 2);
        $fechaEntrega = 'coalesce(p.fecha_entregado, p.fecha_actualizacion_pedido)::date';

        $pedidos = DB::table('pedidos_web as p')
            ->where('p.id_trabajador', $idTrabajador)
            ->where('p.estado_pedido', 'entregado')
            ->where('p.estado_pago', '<>', 'reembolsado')
            ->whereRaw("{$fechaEntrega} between ? and ?", [$desde, $hasta])
            ->whereNotExists(function ($consulta) {
                $consulta->select(DB::raw(1))
                    ->from('repartidor_cierre_pedidos as cp')
                    ->whereColumn('cp.id_pedido', 'p.id_pedido');
            })
            ->select([
                'p.id_pedido',
                'p.numero_pedido',
                'p.nombre_recibe',
                'p.metodo_pago_web',
                'p.total_pedido',
                'p.costo_envio_pedido',
                DB::raw("{$fechaEntrega} as fecha"),
            ])
            ->orderBy('fecha')
            ->orderBy('p.id_pedido')
            ->get();

        $dias = $pedidos
            ->groupBy('fecha')
            ->map(function ($items, $fecha) use ($comision) {
                $productos = 0.0;
                $delivery = 0.0;
                $efectivo = 0.0;
                $billetera = 0.0;
                $lafise = 0.0;
                $otros = 0.0;
                $detalle = [];

                foreach ($items as $pedido) {
                    $totalProducto = round(max((float) $pedido->total_pedido - (float) $pedido->costo_envio_pedido, 0), 2);
                    $metodo = $pedido->metodo_pago_web ?: 'efectivo';

                    $productos += $totalProducto;
                    $delivery += (float) $pedido->costo_envio_pedido;

                    if ($metodo === 'efectivo') {
                        $efectivo += $totalProducto;
                    } elseif ($metodo === 'billetera_movil') {
                        $billetera += $totalProducto;
                    } elseif ($metodo === 'lafise') {
                        $lafise += $totalProducto;
                    } else {
                        $otros += $totalProducto;
                    }

                    $detalle[] = [
                        'id_pedido' => (int) $pedido->id_pedido,
                        'numero' => $pedido->numero_pedido,
                        'cliente' => $pedido->nombre_recibe,
                        'metodo' => $metodo,
                        'productos' => $totalProducto,
                        'delivery' => round((float) $pedido->costo_envio_pedido, 2),
                        'total' => round((float) $pedido->total_pedido, 2),
                    ];
                }

                $comisionEmpresa = round($delivery * $comision / 100, 2);

                return [
                    'fecha' => $fecha,
                    'pedidos' => count($detalle),
                    'productos' => round($productos, 2),
                    'efectivo' => round($efectivo, 2),
                    'billetera' => round($billetera, 2),
                    'lafise' => round($lafise, 2),
                    'otros' => round($otros, 2),
                    'delivery' => round($delivery, 2),
                    'comision_empresa' => $comisionEmpresa,
                    'ganancia_delivery' => round($delivery - $comisionEmpresa, 2),
                    'total_empresa' => round($productos + $comisionEmpresa, 2),
                    'detalle' => $detalle,
                ];
            })
            ->sortByDesc('fecha')
            ->values()
            ->all();

        $totalProductos = round(array_sum(array_column($dias, 'productos')), 2);
        $totalDelivery = round(array_sum(array_column($dias, 'delivery')), 2);
        $totalComisionEmpresa = round(array_sum(array_column($dias, 'comision_empresa')), 2);

        $historial = DB::table('repartidor_cierres')
            ->where('id_trabajador', $idTrabajador)
            ->where('fecha_desde', '<=', $hasta)
            ->where('fecha_hasta', '>=', $desde)
            ->orderByDesc('fecha_cierre')
            ->get()
            ->map(fn ($cierre) => [
                'id_cierre' => (int) $cierre->id_cierre,
                'desde' => $cierre->fecha_desde,
                'hasta' => $cierre->fecha_hasta,
                'pedidos' => (int) $cierre->total_pedidos,
                'productos' => round((float) $cierre->total_productos, 2),
                'efectivo' => round((float) $cierre->total_efectivo, 2),
                'billetera' => round((float) $cierre->total_billetera, 2),
                'lafise' => round((float) $cierre->total_lafise, 2),
                'otros' => round((float) $cierre->total_otros, 2),
                'delivery' => round((float) $cierre->total_delivery, 2),
                'comision_empresa' => round((float) $cierre->comision_empresa, 2),
                'ganancia_delivery' => round((float) $cierre->ganancia_delivery, 2),
                'total_empresa' => round((float) $cierre->total_empresa, 2),
                'monto_entregado' => round((float) $cierre->monto_entregado, 2),
                'diferencia' => round((float) $cierre->diferencia, 2),
                'nota' => $cierre->nota,
                'fecha_cierre' => $cierre->fecha_cierre,
            ])
            ->all();

        return [
            'trabajador' => [
                'id_trabajador' => (int) $trabajador->id_trabajador,
                'nombre' => $trabajador->nombre_trabajador,
                'comision' => $comision,
            ],
            'desde' => $desde,
            'hasta' => $hasta,
            'pendiente' => [
                'dias' => $dias,
                'pedidos' => array_sum(array_column($dias, 'pedidos')),
                'productos' => $totalProductos,
                'efectivo' => round(array_sum(array_column($dias, 'efectivo')), 2),
                'billetera' => round(array_sum(array_column($dias, 'billetera')), 2),
                'lafise' => round(array_sum(array_column($dias, 'lafise')), 2),
                'otros' => round(array_sum(array_column($dias, 'otros')), 2),
                'delivery' => $totalDelivery,
                'comision_empresa' => $totalComisionEmpresa,
                'ganancia_delivery' => round($totalDelivery - $totalComisionEmpresa, 2),
                'total_empresa' => round($totalProductos + $totalComisionEmpresa, 2),
            ],
            'historial' => $historial,
        ];
    }
}
