# Mapa de flujos financieros

## 1. Dónde vive el dinero y el inventario

| Módulo | Archivos clave | Qué escribe |
|---|---|---|
| Facturación / POS | `app/Http/Controllers/FacturacionController.php` (`FacturarProductosPOS`), `resources/js/Facturacion.js` | `ventas`, `detalle_ventas` (costo FIFO + `consumos_lotes`), `lotes_inventario`, `movimientos_inventario`, `movimientos_caja`, `movimientos_cuentas`, stock, `planes_pago`/`cuotas_venta` |
| Anulación de venta | `app/Http/Controllers/VentaController.php` (`AnularVenta`) | revierte stock, lotes, Kardex y movimientos de caja/cuenta |
| Costeo FIFO | `app/Services/CosteoInventarioService.php` (`registrarLote`, `consumir`, `restaurar`), `app/Models/LoteInventario.php` | `lotes_inventario` |
| Compras | `app/Http/Controllers/CompraController.php` (`RegistrarCompra`, `AnularCompra`, `procesarPagoCaja`) | `compras`, `detalle_compras`, lotes, Kardex, stock, `movimientos_caja`, `movimientos_cuentas` |
| Productos / ajustes | `app/Http/Controllers/ProductoController.php` (`CrearProducto`, `ActualizarProducto`) | `productos`, stock de variantes, `movimientos_inventario` (AJUSTE) |
| Cajas / arqueos | `app/Http/Controllers/CajaController.php` (`AbrirCaja`, `CerrarCaja`, arqueo, `calcularTotalesCaja`, `ImprimirArqueo`), `resources/js/MostrarCajas.js`, `resources/views/cajas/*` | `cajas` (monto_teorico/real/diferencia) |
| Cuentas | `app/Http/Controllers/CuentaController.php`, `app/Http/Controllers/TransferenciaCajaCuentaController.php` | `cuentas.saldo_actual`, `movimientos_cuentas`, `transferencias_caja_cuenta` |
| Gastos | `app/Http/Controllers/GastoController.php`, `app/Http/Controllers/MovimientoGastoController.php` | `gastos`, `movimientos_gastos`, `movimientos_caja`, `movimientos_cuentas` |
| Pago de ventas / CxC | `app/Services/RegistrarPagoVenta.php`, `app/Http/Controllers/CuentaPorCobrarController.php` | `pagos_venta`, `aplicaciones_pago_cuota`, `movimientos_caja`, `movimientos_cuentas` |
| Reportes | `app/Http/Controllers/DashboardController.php` (Ganancias, ventas, compras), `app/Http/Controllers/ReporteController.php` | solo lectura |

## 2. Tablas y columnas que importan

- `cajas`: `monto_inicial`, `monto_final`, `monto_teorico`, `monto_real`, `diferencia`, `estado_caja`
  (1 abierta / 0 cerrada). **No existe `saldo_actual`**: el saldo se deriva de los movimientos.
- `movimientos_caja`: `tipo_movimiento_caja` = `INGRESO` | `SALIDA`, `monto_movimiento_caja`,
  `id_referencia` (venta/compra/gasto), `id_transferencia`, `id_pago_venta`, `id_cuenta_destino`.
- `cuentas`: `saldo_actual` (se mantiene por código). `movimientos_cuentas`: `tipo_movimiento` =
  `INGRESO` | `SALIDA`, `monto`, `id_transferencia`, `id_pago_venta`. **No tiene `id_referencia`.**
- `ventas`: `subtotal_venta`, `impuesto_venta`, `descuento_venta`, `total_venta`, `estado_venta`
  (1 activa / 0 anulada), `id_caja`, `id_cuenta`, `id_metodo_pago`, `monto_recibido`, `vuelto`.
- `detalle_ventas`: `precio_unitario_venta` (**sin IVA**), `costo_unitario_venta` (snapshot FIFO,
  6 decimales), `consumos_lotes` (JSON `[{id_lote, cantidad, costo_unitario}]`),
  `subtotal_detalle_venta`, `porcentaje_impuesto`, `monto_impuesto`.
- `compras` / `detalle_compras`: `subtotal_compra`, `descuento_compra`, `impuesto_compra`,
  `total_compra`, `cantidad_compra`, `precio_unitario_compra`, `subtotal_detalle_compra`.
- `lotes_inventario`: `cantidad_inicial`, `cantidad_disponible`, `costo_unitario`, `fecha_ingreso`,
  `id_detalle_compra`.
- `productos`: `stock_actual`, `precio_compra`, `precio_venta` (**base sin IVA, 6 decimales**).
  `variacion_tallas`: `stock`, `precio_compra`, `precio_venta`.
- `movimientos_inventario` (Kardex): `tipo_movimiento` = `ENTRADA` | `SALIDA` | `AJUSTE`,
  `cantidad_movimiento`, `stock_resultante`, `tipo_referencia`, `id_referencia`.
- `gastos`: `estado_gasto`, `estado_pago`, **sin columna de monto** →
  el monto del gasto = Σ `movimientos_gastos.monto` (`origen`, `id_caja`, `id_cuenta`).
- Plazos/CxC: `planes_pago` (`id_venta`) → `cuotas_venta` (`id_plan_pago`, `monto_cuota`) →
  `aplicaciones_pago_cuota` (`id_pago_venta`, `id_cuota`, `monto_aplicado`) → `pagos_venta`
  (`monto_pago`, `id_caja`, `id_cuenta`, `id_metodo_pago`).
- `transferencias_caja_cuenta`: `id_caja_origen`, `id_cuenta_destino`, `monto`.

## 3. Convenciones de cálculo

- **IVA de venta**: `detalle_ventas` guarda el precio **sin IVA**; el total con IVA = precio final
  (base × (1 + %)). En `FacturacionController` el impuesto se calcula sobre el **precio final** y
  la base sale por resta (`round(final − impuesto, 2)`) para que base + impuesto = total exacto.
- **Costo**: snapshot FIFO con 6 decimales en `detalle_ventas.costo_unitario_venta`; si no alcanzan
  lotes se usa el costo de catálogo (`costoRespaldo`) → revisar si quedan unidades sin lote.
- **Ganancia** (`DashboardController::Ganancias`):
  `SUM((precio_unitario_venta − COALESCE(costo_unitario_venta, precio_compra)) × cantidad)` solo
  con `estado_venta = 1`.
- **Tipos de movimiento**: caja/cuenta usan `INGRESO`/`SALIDA`; inventario usa
  `ENTRADA`/`SALIDA`/`AJUSTE`. No mezclar.
- **Transacciones**: las operaciones multi-tabla deben ir en `DB::transaction` y todo `return`
  temprano dentro de la transacción debe hacer `rollBack()` explícito.
