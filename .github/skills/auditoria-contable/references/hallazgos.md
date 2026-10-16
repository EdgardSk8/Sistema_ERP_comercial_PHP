# Hallazgos verificados

Registro de auditorías hechas sobre este ERP. **Actualizar al cerrar cada auditoría** y
distinguir siempre lo verificado con datos de lo que quedó sin comprobar.
Estados posibles: `ABIERTO`, `MITIGADO`, `CORREGIDO`, `SIN DATOS PARA PROBAR`.

---

## Auditoría 2026-10-15 (ventas, compras, cajas, cuentas, inventario)

### 1. `cajas` no tiene columna `saldo_actual` → compras con caja siempre rechazadas — CRÍTICO · CORREGIDO (2026-10-15)

- **Evidencia (código)**: `app/Http/Controllers/CompraController.php:190`
  `if ($caja->saldo_actual < $totalCalculado)` → `Caja::$fillable` no incluye `saldo_actual` y
  `AbrirCaja` nunca la escribe. `Schema::getColumnListing('cajas')` no la contiene → el atributo
  es `null` → `null < total` es `true` para cualquier total > 0.
- **Evidencia (datos)**: `compras_con_caja = 0`, `compras_con_cuenta = 7` (todas las compras reales
  se pagaron con cuenta).
- **Resultado actual vs. esperado**: comprar pagando en efectivo responde 422
  "Saldo insuficiente en caja" siempre; esperado: validar contra
  `monto_inicial + Σ INGRESO − Σ SALIDA` (como hace `CajaController::calcularTotalesCaja`).
- **Riesgo**: bloquea una operación de negocio; además el `return` ocurre dentro de la
  transacción sin `rollBack()` explícito (hoy se revierte por cierre de conexión).
- **Prueba necesaria**: con una caja abierta con saldo suficiente, registrar una compra pagada con
  caja y verificar que se cree la compra, el lote, el Kardex y 1 `movimientos_caja` SALIDA.
- **Corrección (2026-10-15)**: `Caja::getSaldoActualAttribute()` calcula el disponible con los
  movimientos (`monto_inicial + Σ INGRESO − Σ SALIDA`); `CompraController::RegistrarCompra` lo usa y
  ya hace `rollBack()` en los retornos de caja/cuenta, mostrando el disponible en el mensaje.
  **Verificado por cálculo**: caja 1 = 3,300 · caja 4 = 7,715 · caja 6 = 7,010 (coinciden con el
  recálculo independiente de la auditoría). **Falta**: prueba funcional desde la pantalla.

### 2. Costo unitario redondeado a 2 decimales desviaba la ganancia — ALTO · CORREGIDO (2026-10-15)

- **Evidencia**: venta 13, `costo_unitario_venta = 685.71` (4,800 / 7 = 685.714285…),
  ganancia (1,000 − 685.71) × 7 = **2,200.03** en vez de 2,200.00.
- **Corrección**: `detalle_ventas.costo_unitario_venta` → `decimal(14,6)` (migración
  `2026_10_15_000001`, recalcula desde `consumos_lotes`) y `FacturacionController` guarda 6 decimales.
- **Verificado**: 685.714286 → ganancia 2,199.999998 → redondeada 2,200.00.

### 3. Centavos fantasma en totales de venta — ALTO · CORREGIDO (2026-10-15)

- **Evidencia**: venta 11 total `1,000.01`, venta 12 `6,000.06` vendiendo a 1,000 con IVA 15 %
  (base 869.57 guardada con 2 decimales: 869.57 × 1.15 = 1,000.01).
- **Corrección**: `productos.precio_venta` / `variacion_tallas.precio_venta` → 6 decimales
  (migración `2026_10_15_000002`), los formularios derivan la base con `toFixed(6)` y
  `FacturacionController` calcula `IVA = round(final × %/(100+%), 2)` y `base = final − IVA`.
- **Nota**: las ventas 11 y 12 conservan su centavo histórico (no se recalcula lo ya facturado).

### 4. `compras.impuesto_compra` viene del frontend — MEDIO · ABIERTO

- **Evidencia**: `CompraController::RegistrarCompra` usa `$request->impuesto` y `$request->descuento`
  para `subtotal/impuesto/total_compra` en lugar de recalcularlos desde `detalle_compras`.
- **Riesgo**: un cliente puede alterar el total/impuesto de la compra sin que el backend lo detecte
  (en ventas sí se ignora el total del frontend).
- **Además (contable)**: el costo del lote es el precio tal como se ingresa; si se ingresa con IVA
  incluido, el IVA queda dentro del costo de inventario. El sistema no separa IVA acreditable
  (no hay libro de IVA ni retenciones). **Verificar el régimen fiscal del negocio en fuentes
  oficiales antes de afirmar el tratamiento correcto.**

### 5. `return` temprano sin `rollBack()` dentro de transacciones — MEDIO · PARCIAL (2026-10-15)

- **Evidencia**: `CompraController::RegistrarCompra` hace `DB::beginTransaction()` y retorna 422
  ("Saldo insuficiente en caja/cuenta") sin `rollBack()`; hoy sólo se revierte al cerrar la conexión.
- **Riesgo**: si en el futuro se usa una conexión persistente o se maneja la respuesta distinto,
  puede quedar una compra parcial (cabecera sin movimientos o stock sin pago).

### 6. `cajas.monto_final` con semántica inconsistente — MEDIO · ABIERTO

- **Evidencia (datos)**: caja 2 → teórico 4,840 y `monto_final` 4,790 (= real contado);
  caja 5 → teórico 5,760 y `monto_final` 5,710. `CerrarCaja` escribe `monto_final = monto_teorico`,
  pero el registro del arqueo lo sobrescribe con el monto real.
- **Riesgo**: reportes/impresiones que usen `monto_final` pueden mostrar el contado como si fuera
  el esperado. Definir una sola semántica (documentar en `modulos-financieros.md`).

### 7. Stock sin trazabilidad vs. Kardex y lotes — MEDIO · ABIERTO (datos)

- **Evidencia (datos)**: producto 1 → `stock_actual` 25, Kardex neto 16, lotes disponibles 16;
  producto 2 → 27 / 9 / 9; producto 3 → 25 / 7 / 7 (los que tienen tallas cuadran en tallas, no en lotes).
- **Consecuencia**: al vender esas unidades el costo cae al `costoRespaldo` (precio de catálogo),
  no a un lote real → ganancia no FIFO para esa parte, y falta de trazabilidad del saldo inicial.
- **Nota**: aparece con los datos del relleno SQL; confirmar si es dato de prueba o si el sistema
  permite stock sin entrada (ajustes sin lote).

### 8. `CuentaController::ActualizarCuenta` no aplica `saldo_actual` — MEDIO · ABIERTO

- **Evidencia**: `app/Http/Controllers/CuentaController.php:177`
  `//$cuenta->saldo_actual = $request->saldo_actual;` (comentado) mientras el validador sí lo exige.
- **Riesgo**: si el usuario corrige el saldo, el cambio no se guarda ni genera movimiento →
  la diferencia real vs. sistema no queda trazada.

### 9. Saldo inicial de cuentas sin asiento — BAJO · ABIERTO

- **Evidencia (datos)**: saldos actuales vs. movimientos ⇒ iniciales implícitos: cuenta 1 = 8,000,
  cuenta 2 = 85,000, cuenta 3 = 45,000, cuenta 4 = 60,000, cuenta 5 = 160,000; no hay movimiento de
  apertura que los respalde.
- **Riesgo**: no se puede conciliar el saldo de la cuenta con su historial sin conocer el inicial
  (hoy sólo se conoce por diferencia).

### 10. Módulos sin datos de prueba — SIN DATOS PARA PROBAR

- `gastos` / `movimientos_gastos`: 0 registros.
- `planes_pago` / `cuotas_venta` / `aplicaciones_pago_cuota` / `pagos_venta`: 0 registros.
- Requieren pruebas aisladas antes de afirmar que están correctos o incorrectos.

### 11. Controles que SÍ cuadraron (verificado 2026-10-15)

- Ventas: `total_venta = subtotal + impuesto − descuento` y = Σ `detalle_ventas` (13 ventas).
- Ventas en efectivo: 1 `movimientos_caja` INGRESO por el total; tarjeta/transferencia: sin
  movimiento de caja y acreditadas en cuenta.
- Anulaciones (ventas 11 y 12): 2 movimientos de caja y 2 asientos de Kardex por venta (original + reverso).
- Compras: `total = subtotal + impuesto − descuento`, Σ detalles = subtotal, 1 lote por línea.
- Transferencias caja→cuenta: exactamente 1 SALIDA (caja) + 1 INGRESO (cuenta) por el mismo monto.
- Sin registros huérfanos (Kardex sin producto, detalle sin venta, movimientos sin caja/cuenta).
- Cajas 1, 3, 4, 6, 7, 8, 9: `monto_inicial + ingresos − salidas = monto_teorico` guardado.
