# Hallazgos verificados

Registro de auditorías hechas sobre este ERP. **Actualizar al cerrar cada auditoría** y
distinguir siempre lo verificado con datos de lo que quedó sin comprobar.
Estados posibles: `ABIERTO`, `MITIGADO`, `CORREGIDO`, `SIN DATOS PARA PROBAR`.

---

## Auditoría 2026-11-05 (detalle de variaciones: tallas, precios, impuesto, color)

### 12. Precio base de la variación redondeado a 2 decimales → centavos fantasma — MEDIO · CORREGIDO (2026-11-05)

- **Evidencia (código)**: `resources/js/MostrarProductoVariacionDetalle.js` enviaba
  `precio_venta: precioVentaBase.toFixed(2)` (crear y editar), mientras
  `variacion_tallas.precio_venta` es `numeric(12,6)` desde la migración `2026_10_15_000002`.
- **Evidencia (recálculo)**: con IVA 15 % e importe "1000 incluido" la base real es
  869.565217; guardada como 869.57 el final queda en **1,000.01** (esperado 1,000.00).
- **Estado de los datos**: no reproducible con datos reales porque los 15 productos están en
  *Exento 0 %*; se reprodujo creando una fila temporal con IVA 15 % (producto de prueba,
  luego eliminado).
- **Corrección**: el JS envía `toFixed(6)`. Verificado: base 869.565217 → final 1,000.00.

### 13. Renombrar el color dejaba los SKU con el color viejo — MEDIO · CORREGIDO (2026-11-05)

- **Evidencia (datos)**: `variacion_tallas.sku = NEXT-LINE-MAMON-CON-NEGRO-37` con
  `producto_variaciones.color = 'Rosa Vieja con Negro'` (37 filas revisadas; 1 caso).
- **Causa**: `ProductoVariacionController::ActualizarProductoVariacion` guardaba `color` sin
  tocar los SKU, que se arman con producto + color + talla.
- **Corrección**: `App\Support\SkuVariacion::regenerarPorCambioColor()` renombra solo los SKU
  autogenerados (los escritos a mano se respetan). Verificado: `...-NEGRO-UNICA` →
  `...-GRIS-GRAFITO-UNICA`.
- **Pendiente**: el SKU histórico `...-MAMON-CON-NEGRO-...` se dejó intacto a propósito
  (facturas y Kardex ya lo referencian).

### 14. Color o talla duplicados devolvían error 500 con SQL crudo — MEDIO · CORREGIDO (2026-11-05)

- **Evidencia (código)**: `producto_variaciones` tiene `unique(id_producto, color)` y
  `variacion_tallas` `unique(id_variacion, id_talla)`; los controladores no validaban y la
  excepción salía como HTTP 500 en `detalle`.
- **Corrección**: regla `unique` en `ProductoVariacionController` (crear y actualizar) y
  comprobación explícita en `VariacionTallaController` (crear y actualizar). Verificado: 422
  con mensaje en español.

### 15. Precio vacío al editar una talla se guardaba como 0 — BAJO · CORREGIDO (2026-11-05)

- **Evidencia**: `$request->has('precio_venta')` es `true` con cadena vacía, y el JS enviaba
  `Number('') → 0 → "0.00"`; el precio de la variación quedaba en 0 y Facturación lo usaría
  como precio de catálogo.
- **Corrección**: el JS no envía el precio cuando el campo está vacío y el controlador usa
  `filled()` (conserva el valor actual); al crear, cae al precio del producto.
  Verificado: precio 869.565217 se mantiene tras guardar con el campo vacío.

### 16. Productos sin tallas (no ropa) no se podían vender por color — ALTO · CORREGIDO (2026-11-05)

- **Evidencia**: `variacion_tallas.id_talla` era `NOT NULL`; el POS arma los ítems desde
  `variacion->tallas` (`FacturacionController::MostrarProductosPOS`) y, sin tallas, caía al
  producto base perdiendo el color y usando `productos.stock_actual`.
- **Corrección**: migración `2026_11_05_000007` deja `id_talla` nullable; una fila por color
  sin talla (SKU `...-UNICA`), validación de fila única por color, POS acepta variantes sin
  talla y `web_producto` devuelve `Única`. La ficha web oculta el selector de tallas.
- **Verificado** (producto de prueba, luego eliminado): POS muestra «Producto · Negro» con su
  stock y SKU; `/producto?p=19` oculta tallas, preselecciona «Única» y **agrega al carrito**.
- **Invariante 7**: Σ `variacion_tallas.stock` = `productos.stock_actual` en los 15 productos
  reales (0 descuadres) después de los cambios.

### 17. Cambiar la talla de una fila no deja rastro en el Kardex — MEDIO · ABIERTO

- **Evidencia**: `VariacionTallaController::ActualizarVariacionTalla` modifica `stock` y
  `id_talla` sin crear `movimientos_inventario`; el alta tampoco genera movimiento. El tope es
  `productos.stock_actual` (Σ tallas ≤ stock del producto), así que mover stock entre tallas
  no cambia el total, pero un cambio de talla sí altera la composición sin trazabilidad.
- **Riesgo**: el Kardex no explica por qué una talla subió y otra bajó.
- **Prueba necesaria**: con un producto de prueba, cambiar 2 unidades de la talla 40 a la 41 y
  verificar si se espera un par de movimientos AJUSTE (decisión de negocio pendiente).

### 18. Sin datos para probar

- Productos con IVA 15 % / ISC 10 %: no existen (todos Exento). El cálculo final con impuesto
  se verificó por recálculo, no desde la pantalla.

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
