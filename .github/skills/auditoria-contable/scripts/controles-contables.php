<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Controles contables de SOLO LECTURA para el ERP (Laravel + MariaDB).
 *
 * No escribe ni modifica datos: sólo consulta y genera un reporte de texto.
 * Uso:
 *   1. Copiar este archivo a una ruta temporal FUERA del repositorio.
 *   2. Desde la raíz del proyecto:  php artisan tinker <ruta temporal>
 *   3. Leer el reporte generado en %TEMP%\auditoria_erp.txt
 *
 * Ver SKILL.md → "Cómo ejecutar los controles" (trampa de `$` en PowerShell).
 */

$L = [];
$add = function (string $titulo, $valor) use (&$L) {
    $L[] = '=== ' . $titulo . ' ===';
    $L[] = json_encode($valor, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    $L[] = '';
};

/* ── 1. ESQUEMA: columnas de las tablas con dinero/inventario ─────────────── */
$columnas = [];
foreach (['cajas', 'cuentas', 'movimientos_caja', 'movimientos_cuentas', 'ventas', 'detalle_ventas',
    'pagos_venta', 'planes_pago', 'cuotas_venta', 'aplicaciones_pago_cuota', 'compras',
    'detalle_compras', 'lotes_inventario', 'productos', 'variacion_tallas',
    'movimientos_inventario', 'gastos', 'movimientos_gastos', 'transferencias_caja_cuenta'] as $t) {
    $columnas[$t] = Schema::hasTable($t) ? Schema::getColumnListing($t) : 'NO EXISTE';
}
$add('1. COLUMNAS', $columnas);

/* ── 2. CAJAS: balance recalculado vs. lo guardado ───────────────────────── */
$cajas = [];
foreach (DB::table('cajas')->orderBy('id_caja')->get() as $c) {
    $ing = (float) DB::table('movimientos_caja')->where('id_caja', $c->id_caja)->where('tipo_movimiento_caja', 'INGRESO')->sum('monto_movimiento_caja');
    $sal = (float) DB::table('movimientos_caja')->where('id_caja', $c->id_caja)->where('tipo_movimiento_caja', 'SALIDA')->sum('monto_movimiento_caja');
    $balance = round((float) $c->monto_inicial + $ing - $sal, 2);

    $cajas[] = [
        'id_caja' => $c->id_caja, 'estado' => $c->estado_caja,
        'monto_inicial' => (float) $c->monto_inicial,
        'ingresos' => round($ing, 2), 'salidas' => round($sal, 2),
        'balance_recalculado' => $balance,
        'monto_teorico_guardado' => $c->monto_teorico === null ? null : (float) $c->monto_teorico,
        'diferencia_teorico' => $c->monto_teorico === null ? null : round((float) $c->monto_teorico - $balance, 2),
        'monto_final_guardado' => $c->monto_final === null ? null : (float) $c->monto_final,
        'monto_real' => $c->monto_real === null ? null : (float) $c->monto_real,
        'diferencia_guardada' => $c->diferencia === null ? null : (float) $c->diferencia,
    ];
}
$add('2. CAJAS', $cajas);

/* ── 3. CUENTAS: saldo vs. movimientos ───────────────────────────────────── */
$cuentas = [];
foreach (DB::table('cuentas')->orderBy('id_cuenta')->get() as $c) {
    $ing = (float) DB::table('movimientos_cuentas')->where('id_cuenta', $c->id_cuenta)->where('tipo_movimiento', 'INGRESO')->sum('monto');
    $sal = (float) DB::table('movimientos_cuentas')->where('id_cuenta', $c->id_cuenta)->where('tipo_movimiento', 'SALIDA')->sum('monto');

    $cuentas[] = [
        'id_cuenta' => $c->id_cuenta, 'nombre' => $c->nombre_cuenta, 'estado' => $c->estado,
        'saldo_actual' => (float) $c->saldo_actual,
        'mov_ingresos' => round($ing, 2), 'mov_salidas' => round($sal, 2),
        'mov_neto' => round($ing - $sal, 2),
        'inicial_implicito' => round((float) $c->saldo_actual - ($ing - $sal), 2),
        'saldo_negativo' => (float) $c->saldo_actual < 0,
    ];
}
$add('3. CUENTAS', $cuentas);

/* ── 4. VENTAS: cuadre cabecera/detalle y conciliación con caja ──────────── */
$ventas = [];
foreach (DB::table('ventas')->orderBy('id_venta')->get() as $v) {
    $det = DB::table('detalle_ventas')->where('id_venta', $v->id_venta)->get();
    $sumDet = round((float) $det->sum('subtotal_detalle_venta') + (float) $det->sum('monto_impuesto'), 2);
    $cab = round((float) $v->subtotal_venta + (float) $v->impuesto_venta - (float) $v->descuento_venta, 2);
    $movCaja = DB::table('movimientos_caja')->where('id_referencia', $v->id_venta)->get();

    $ventas[] = [
        'id_venta' => $v->id_venta, 'estado' => $v->estado_venta,
        'total' => (float) $v->total_venta, 'sub_imp_desc' => $cab, 'detalle_sum' => $sumDet,
        'ok_cabecera' => abs($cab - (float) $v->total_venta) < 0.005,
        'ok_detalle' => abs($sumDet - (float) $v->total_venta) < 0.005,
        'metodo' => $v->id_metodo_pago, 'id_caja' => $v->id_caja, 'id_cuenta' => $v->id_cuenta,
        'mov_caja_n' => $movCaja->count(),
        'mov_caja_tipos' => $movCaja->pluck('tipo_movimiento_caja')->implode(','),
        'mov_caja_monto' => round((float) $movCaja->sum('monto_movimiento_caja'), 2),
        'recibido_menos_vuelto' => round((float) $v->monto_recibido - (float) $v->vuelto, 2),
    ];
}
$add('4. VENTAS', $ventas);

/* ── 5. INVENTARIO: stock vs. Kardex vs. lotes ───────────────────────────── */
$inventario = [];
foreach (DB::table('productos')->orderBy('id_producto')->get() as $p) {
    $tieneTallas = DB::table('producto_variaciones')->where('id_producto', $p->id_producto)->exists();
    $stockTallas = (int) DB::table('variacion_tallas')
        ->join('producto_variaciones', 'variacion_tallas.id_variacion', '=', 'producto_variaciones.id_variacion')
        ->where('producto_variaciones.id_producto', $p->id_producto)->sum('variacion_tallas.stock');
    $kEnt = (int) DB::table('movimientos_inventario')->where('id_producto', $p->id_producto)->whereIn('tipo_movimiento', ['ENTRADA', 'AJUSTE'])->sum('cantidad_movimiento');
    $kSal = (int) DB::table('movimientos_inventario')->where('id_producto', $p->id_producto)->where('tipo_movimiento', 'SALIDA')->sum('cantidad_movimiento');
    $lotes = (int) DB::table('lotes_inventario')->where('id_producto', $p->id_producto)->sum('cantidad_disponible');
    $kNeto = $kEnt - $kSal;

    if ((int) $p->stock_actual !== $kNeto || $lotes !== (int) $p->stock_actual || ($tieneTallas && $stockTallas !== (int) $p->stock_actual)) {
        $inventario[] = [
            'id_producto' => $p->id_producto, 'nombre' => $p->nombre_producto,
            'stock_actual' => (int) $p->stock_actual,
            'stock_tallas' => $tieneTallas ? $stockTallas : null,
            'kardex_neto' => $kNeto, 'stock_sin_kardex' => (int) $p->stock_actual - $kNeto,
            'lotes_disponibles' => $lotes, 'stock_sin_lote' => (int) $p->stock_actual - $lotes,
        ];
    }
}
$add('5. PRODUCTOS CON STOCK QUE NO CUADRA (vacío = todo OK)', $inventario);

/* ── 6. COMPRAS: cuadre y lotes por línea ───────────────────────────────── */
$compras = [];
foreach (DB::table('compras')->orderBy('id_compra')->get() as $c) {
    $det = DB::table('detalle_compras')->where('id_compra', $c->id_compra)->get();
    $sumDet = round((float) $det->sum('subtotal_detalle_compra'), 2);
    $cab = round((float) $c->subtotal_compra + (float) $c->impuesto_compra - (float) $c->descuento_compra, 2);
    $lotes = DB::table('lotes_inventario')->whereIn('id_detalle_compra', $det->pluck('id_detalle_compra'))->count();

    if (abs($cab - (float) $c->total_compra) > 0.005 || abs($sumDet - (float) $c->subtotal_compra) > 0.005 || $lotes !== $det->count()) {
        $compras[] = [
            'id_compra' => $c->id_compra, 'estado' => $c->estado_compra,
            'subtotal' => (float) $c->subtotal_compra, 'impuesto' => (float) $c->impuesto_compra,
            'descuento' => (float) $c->descuento_compra, 'total' => (float) $c->total_compra,
            'cabecera_calculada' => $cab, 'detalle_sum' => $sumDet,
            'lineas' => $det->count(), 'lotes' => $lotes,
        ];
    }
}
$add('6. COMPRAS QUE NO CUADRAN (vacío = todo OK)', $compras);

$lineasCompra = [];
foreach (DB::table('detalle_compras')->orderBy('id_detalle_compra')->get() as $d) {
    $kardex = (int) DB::table('movimientos_inventario')
        ->where('id_producto', $d->id_producto)
        ->where('tipo_referencia', 'COMPRA')
        ->where('id_referencia', $d->id_compra)
        ->when($d->id_variacion_talla, fn ($q, $v) => $q->where('id_variacion_talla', $v))
        ->sum('cantidad_movimiento');
    $lote = (int) DB::table('lotes_inventario')->where('id_detalle_compra', $d->id_detalle_compra)->sum('cantidad_inicial');

    if ($kardex !== (int) $d->cantidad_compra || $lote !== (int) $d->cantidad_compra) {
        $lineasCompra[] = [
            'id_detalle_compra' => $d->id_detalle_compra, 'id_compra' => $d->id_compra,
            'id_producto' => $d->id_producto, 'variante' => $d->id_variacion_talla,
            'cantidad_compra' => (int) $d->cantidad_compra, 'kardex_entrada' => $kardex,
            'lote_inicial' => $lote, 'precio' => (float) $d->precio_unitario_compra,
        ];
    }
}
$add('6b. LINEAS DE COMPRA QUE NO CUADRAN CON KARDEX/LOTE', $lineasCompra);

/* ── 7. GASTOS ──────────────────────────────────────────────────────────── */
$gastos = [];
foreach (DB::table('gastos')->orderBy('id_gasto')->get() as $g) {
    $movs = DB::table('movimientos_gastos')->where('id_gasto', $g->id_gasto)->get();
    $gastos[] = [
        'id_gasto' => $g->id_gasto, 'nombre' => $g->nombre_gasto,
        'estado_gasto' => $g->estado_gasto, 'estado_pago' => $g->estado_pago,
        'movs_n' => $movs->count(), 'movs_suma' => round((float) $movs->sum('monto'), 2),
        'movs_origen' => $movs->pluck('origen')->implode(','),
        'mov_caja_ref' => DB::table('movimientos_caja')->where('id_referencia', $g->id_gasto)->count(),
    ];
}
$add('7. GASTOS', $gastos);

/* ── 8. VENTAS A PLAZOS / CUENTAS POR COBRAR ────────────────────────────── */
$plazos = [];
foreach (DB::table('planes_pago')->orderBy('id_plan_pago')->get() as $plan) {
    $venta = DB::table('ventas')->where('id_venta', $plan->id_venta)->first();
    $cuotas = DB::table('cuotas_venta')->where('id_plan_pago', $plan->id_plan_pago)->get();
    $pagos = DB::table('pagos_venta')->where('id_venta', $plan->id_venta)->sum('monto_pago');
    $aplicado = (float) DB::table('aplicaciones_pago_cuota')
        ->join('cuotas_venta', 'cuotas_venta.id_cuota', '=', 'aplicaciones_pago_cuota.id_cuota')
        ->where('cuotas_venta.id_plan_pago', $plan->id_plan_pago)->sum('monto_aplicado');

    $plazos[] = [
        'id_plan_pago' => $plan->id_plan_pago, 'id_venta' => $plan->id_venta,
        'venta_total' => $venta ? (float) $venta->total_venta : null,
        'cuotas_n' => $cuotas->count(), 'cuotas_suma' => round((float) $cuotas->sum('monto_cuota'), 2),
        'pagos_suma' => round((float) $pagos, 2), 'aplicado_a_cuotas' => round($aplicado, 2),
        'saldo_por_cobrar' => $venta ? round((float) $venta->total_venta - $aplicado, 2) : null,
    ];
}
$add('8. PLANES DE PAGO / CxC', $plazos);

/* ── 9. TRANSFERENCIAS CAJA → CUENTA ───────────────────────────────────── */
$transferencias = [];
foreach (DB::table('transferencias_caja_cuenta')->orderBy('id_transferencia')->get() as $t) {
    $movCaja = DB::table('movimientos_caja')->where('id_transferencia', $t->id_transferencia)->get();
    $movCuenta = DB::table('movimientos_cuentas')->where('id_transferencia', $t->id_transferencia)->get();
    $ok = $movCaja->count() === 1 && $movCuenta->count() === 1
        && abs((float) $movCaja->sum('monto_movimiento_caja') - (float) $t->monto) < 0.005
        && abs((float) $movCuenta->sum('monto') - (float) $t->monto) < 0.005;

    if (! $ok) {
        $transferencias[] = [
            'id_transferencia' => $t->id_transferencia, 'monto' => (float) $t->monto,
            'mov_caja' => $movCaja->toArray(), 'mov_cuenta' => $movCuenta->toArray(),
        ];
    }
}
$add('9. TRANSFERENCIAS ANOMALAS (vacío = todo OK)', $transferencias);

/* ── 10. ANULACIONES: rastro del reverso ───────────────────────────────── */
$anulVentas = [];
foreach (DB::table('ventas')->where('estado_venta', 0)->pluck('id_venta') as $id) {
    $anulVentas[] = [
        'id_venta' => $id,
        'mov_caja' => DB::table('movimientos_caja')->where('id_referencia', $id)->count(),
        'kardex' => DB::table('movimientos_inventario')->where('id_referencia', $id)->count(),
        'pagos' => DB::table('pagos_venta')->where('id_venta', $id)->count(),
    ];
}
$add('10a. VENTAS ANULADAS (se esperan 2 movimientos y 2 kardex)', $anulVentas);

$anulCompras = [];
foreach (DB::table('compras')->where('estado_compra', 0)->pluck('id_compra') as $id) {
    $det = DB::table('detalle_compras')->where('id_compra', $id)->pluck('id_detalle_compra');
    $anulCompras[] = [
        'id_compra' => $id, 'detalles' => $det->count(),
        'lotes_restantes' => DB::table('lotes_inventario')->whereIn('id_detalle_compra', $det)->count(),
        'mov_caja' => DB::table('movimientos_caja')->where('id_referencia', $id)->count(),
    ];
}
$add('10b. COMPRAS ANULADAS (no deben quedar lotes)', $anulCompras);

/* ── 11. TOTALES GLOBALES (recálculo independiente) ────────────────────── */
$add('11. TOTALES GLOBALES', [
    'ventas_activas_total' => round((float) DB::table('ventas')->where('estado_venta', 1)->sum('total_venta'), 2),
    'ventas_activas_subtotal' => round((float) DB::table('ventas')->where('estado_venta', 1)->sum('subtotal_venta'), 2),
    'ventas_activas_impuesto' => round((float) DB::table('ventas')->where('estado_venta', 1)->sum('impuesto_venta'), 2),
    'ventas_anuladas_total' => round((float) DB::table('ventas')->where('estado_venta', 0)->sum('total_venta'), 2),
    'detalle_activas_sum' => round((float) DB::table('detalle_ventas')
        ->join('ventas', 'ventas.id_venta', '=', 'detalle_ventas.id_venta')
        ->where('ventas.estado_venta', 1)
        ->sum(DB::raw('detalle_ventas.subtotal_detalle_venta + detalle_ventas.monto_impuesto')), 2),
    'costo_vendido' => round((float) DB::table('detalle_ventas')
        ->join('ventas', 'ventas.id_venta', '=', 'detalle_ventas.id_venta')
        ->where('ventas.estado_venta', 1)
        ->sum(DB::raw('detalle_ventas.costo_unitario_venta * detalle_ventas.cantidad_venta')), 2),
    'ganancia' => round((float) DB::table('detalle_ventas')
        ->join('ventas', 'ventas.id_venta', '=', 'detalle_ventas.id_venta')
        ->where('ventas.estado_venta', 1)
        ->sum(DB::raw('(detalle_ventas.precio_unitario_venta - detalle_ventas.costo_unitario_venta) * detalle_ventas.cantidad_venta')), 2),
    'mov_caja_ingresos' => round((float) DB::table('movimientos_caja')->where('tipo_movimiento_caja', 'INGRESO')->sum('monto_movimiento_caja'), 2),
    'mov_caja_salidas' => round((float) DB::table('movimientos_caja')->where('tipo_movimiento_caja', 'SALIDA')->sum('monto_movimiento_caja'), 2),
    'mov_cuenta_ingresos' => round((float) DB::table('movimientos_cuentas')->where('tipo_movimiento', 'INGRESO')->sum('monto'), 2),
    'mov_cuenta_salidas' => round((float) DB::table('movimientos_cuentas')->where('tipo_movimiento', 'SALIDA')->sum('monto'), 2),
    'compras_activas' => round((float) DB::table('compras')->where('estado_compra', 1)->sum('total_compra'), 2),
    'mov_gastos_total' => round((float) DB::table('movimientos_gastos')->sum('monto'), 2),
    'suma_saldos_cuentas' => round((float) DB::table('cuentas')->sum('saldo_actual'), 2),
    'ventas_no_efectivo' => round((float) DB::table('ventas')->where('estado_venta', 1)->where('id_metodo_pago', '!=', 1)->sum('total_venta'), 2),
    'transferencias_total' => round((float) DB::table('transferencias_caja_cuenta')->sum('monto'), 2),
]);

/* ── 12. DETALLE: precio x cantidad, IVA e inventario fino ────────────── */
$difPrecio = [];
$difCosto = [];
foreach (DB::table('detalle_ventas')->orderBy('id_detalle_venta')->get() as $d) {
    if (abs(round((float) $d->precio_unitario_venta * (int) $d->cantidad_venta, 2) - (float) $d->subtotal_detalle_venta) > 0.005) {
        $difPrecio[] = ['id_detalle_venta' => $d->id_detalle_venta, 'precio' => (float) $d->precio_unitario_venta,
            'cantidad' => (int) $d->cantidad_venta, 'subtotal_guardado' => (float) $d->subtotal_detalle_venta];
    }

    if ($d->consumos_lotes) {
        $consumos = json_decode((string) $d->consumos_lotes, true) ?: [];
        $total = 0.0;
        foreach ($consumos as $c) {
            $total += (float) ($c['costo_unitario'] ?? 0) * (float) ($c['cantidad'] ?? 0);
        }
        $esperado = round($total / max(1, (int) $d->cantidad_venta), 6);
        if (abs($esperado - (float) $d->costo_unitario_venta) > 0.000001) {
            $difCosto[] = ['id_detalle_venta' => $d->id_detalle_venta, 'costo_guardado' => (float) $d->costo_unitario_venta,
                'costo_desde_lotes' => $esperado];
        }
    }
}
$add('12a. precio x cantidad <> subtotal', $difPrecio);
$add('12b. costo unitario <> lotes consumidos', $difCosto);

/* ── 13. HUERFANOS, DUPLICADOS Y CONCURRENCIA ─────────────────────────── */
$add('13. HUERFANOS Y DUPLICADOS', [
    'kardex_sin_producto' => DB::table('movimientos_inventario')->leftJoin('productos', 'productos.id_producto', '=', 'movimientos_inventario.id_producto')->whereNull('productos.id_producto')->count(),
    'detalle_sin_venta' => DB::table('detalle_ventas')->leftJoin('ventas', 'ventas.id_venta', '=', 'detalle_ventas.id_venta')->whereNull('ventas.id_venta')->count(),
    'mov_caja_sin_caja' => DB::table('movimientos_caja')->leftJoin('cajas', 'cajas.id_caja', '=', 'movimientos_caja.id_caja')->whereNull('cajas.id_caja')->count(),
    'mov_cuenta_sin_cuenta' => DB::table('movimientos_cuentas')->leftJoin('cuentas', 'cuentas.id_cuenta', '=', 'movimientos_cuentas.id_cuenta')->whereNull('cuentas.id_cuenta')->count(),
    'kardex_duplicado_por_variante' => DB::table('movimientos_inventario')
        ->selectRaw('id_producto, id_variacion_talla, id_referencia, tipo_referencia, COUNT(*) as veces, ROUND(SUM(cantidad_movimiento),2) as cantidad')
        ->groupBy('id_producto', 'id_variacion_talla', 'id_referencia', 'tipo_referencia')
        ->having('veces', '>', 1)->get()->toArray(),
    'mov_caja_duplicado_por_venta' => DB::table('movimientos_caja')
        ->selectRaw('id_referencia, tipo_movimiento_caja, COUNT(*) as veces')
        ->whereNotNull('id_referencia')->groupBy('id_referencia', 'tipo_movimiento_caja')
        ->having('veces', '>', 1)->get()->toArray(),
    'cajas_abiertas_por_usuario' => DB::table('cajas')->where('estado_caja', 1)
        ->selectRaw('id_usuario, COUNT(*) as abiertas')->groupBy('id_usuario')->get()->toArray(),
]);

$ruta = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'auditoria_erp.txt';
file_put_contents($ruta, implode(PHP_EOL, $L));

echo 'REPORTE: ' . $ruta . PHP_EOL;
echo 'Lineas: ' . count($L) . PHP_EOL;
