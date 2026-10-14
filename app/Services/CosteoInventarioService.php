<?php

namespace App\Services;

use App\Models\LoteInventario;

class CosteoInventarioService
{
    /**
     * Registra un nuevo lote de inventario (una compra entra como lote).
     */
    public function registrarLote(
        int $idProducto,
        ?int $idVariacionTalla,
        int $cantidad,
        float $costoUnitario,
        ?int $idDetalleCompra = null,
        ?int $idUsuario = null
    ): LoteInventario {
        return LoteInventario::create([
            'id_producto' => $idProducto,
            'id_variacion_talla' => $idVariacionTalla,
            'id_detalle_compra' => $idDetalleCompra,
            'cantidad_inicial' => $cantidad,
            'cantidad_disponible' => $cantidad,
            'costo_unitario' => round($costoUnitario, 2),
            'fecha_ingreso' => now(),
            'id_usuario' => $idUsuario,
        ]);
    }

    /**
     * Consume stock por FIFO/PEPS para un producto (y variante opcional).
     *
     * Toma primero los lotes más antiguos. Si no alcanzan los lotes (por ejemplo,
     * stock antiguo o ajustes manuales), el resto se valúa con $costoRespaldo.
     *
     * @return array{costo_total: float, consumos: array<int, array{id_lote: int|null, cantidad: int, costo_unitario: float}>}
     */
    public function consumir(
        int $idProducto,
        ?int $idVariacionTalla,
        int $cantidad,
        float $costoRespaldo = 0.0
    ): array {
        if ($cantidad <= 0) {
            return ['costo_total' => 0.0, 'consumos' => []];
        }

        $restante = $cantidad;
        $costoTotal = 0.0;
        $consumos = [];

        $lotes = LoteInventario::where('id_producto', $idProducto)
            ->when(
                $idVariacionTalla,
                fn ($query) => $query->where('id_variacion_talla', $idVariacionTalla),
                fn ($query) => $query->whereNull('id_variacion_talla')
            )
            ->where('cantidad_disponible', '>', 0)
            ->orderBy('fecha_ingreso', 'asc')
            ->orderBy('id_lote', 'asc')
            ->lockForUpdate()
            ->get();

        foreach ($lotes as $lote) {
            if ($restante <= 0) {
                break;
            }

            $tomar = min($restante, (int) $lote->cantidad_disponible);
            if ($tomar <= 0) {
                continue;
            }

            $costoUnitario = round((float) $lote->costo_unitario, 2);
            $costoTotal += $costoUnitario * $tomar;
            $restante -= $tomar;

            $lote->cantidad_disponible = (int) $lote->cantidad_disponible - $tomar;
            $lote->save();

            $consumos[] = [
                'id_lote' => $lote->id_lote,
                'cantidad' => $tomar,
                'costo_unitario' => $costoUnitario,
            ];
        }

        // Respaldo: unidades sin lote (stock antiguo / ajustes).
        if ($restante > 0) {
            $costoRespaldo = round($costoRespaldo, 2);
            $costoTotal += $costoRespaldo * $restante;

            $consumos[] = [
                'id_lote' => null,
                'cantidad' => $restante,
                'costo_unitario' => $costoRespaldo,
            ];
        }

        return [
            'costo_total' => round($costoTotal, 2),
            'consumos' => $consumos,
        ];
    }

    /**
     * Devuelve al inventario las unidades consumidas de una venta anulada.
     *
     * @param  array<int, array{id_lote: int|null, cantidad: int}>  $consumos
     */
    public function restaurar(array $consumos): void
    {
        foreach ($consumos as $consumo) {
            $idLote = $consumo['id_lote'] ?? null;
            $cantidad = (int) ($consumo['cantidad'] ?? 0);

            // Los consumos sin lote (costo de respaldo) no se restauran.
            if (! $idLote || $cantidad <= 0) {
                continue;
            }

            $lote = LoteInventario::lockForUpdate()->find($idLote);

            if ($lote) {
                $lote->cantidad_disponible = (int) $lote->cantidad_disponible + $cantidad;
                $lote->save();
            }
        }
    }
}
