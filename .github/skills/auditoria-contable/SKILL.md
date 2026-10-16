---
name: auditoria-contable
description: 'Auditoría contable, financiera y de control interno del ERP Laravel/POS (ventas, compras, caja, arqueos, cuentas, inventario, costo/ganancia, IVA, cuentas por cobrar, anulaciones, reportes). Use when the user asks to auditar cálculos, cuadrar caja o cuentas, verificar saldos o totales, revisar costo de inventario o Kardex, ganancias, impuestos, redondeos, trazabilidad o integridad del dinero, or requests a financial/accounting review with evidence.'
argument-hint: 'Módulo o duda a auditar (p. ej. "cajas y arqueos", "costo de inventario", "IVA en compras")'
---

# Auditoría contable y financiera del ERP

Auditoría con evidencia verificable sobre un ERP de gestión comercial y punto de venta
(Laravel 12 · PHP 8.2 · MariaDB · Blade/jQuery). El objetivo **no** es revisar sintaxis:
es comprobar que los cálculos y los principios contables se cumplan y que el dinero y el
inventario sean consistentes y trazables.

## Cuándo usar esta skill

- Verificar cálculos: subtotales, impuestos, totales, descuentos, redondeos, costos, saldos.
- Cuadrar cajas (arqueos), cuentas bancarias, transferencias y métodos de pago.
- Revisar costo de mercancía (FIFO), Kardex, existencias, ganancia y márgenes.
- Revisar compras, gastos, IVA, cuentas por cobrar/pagar y anulaciones/devoluciones.
- Buscar duplicaciones, condiciones de carrera, falta de trazabilidad o de transacciones.
- Antes de "probar en producción" un cambio que toca saldos, stock o dinero.

## Reglas obligatorias (no negociables)

1. **No modificar archivos** hasta comprender el funcionamiento y **documentar** los hallazgos.
2. **Ningún hallazgo sin evidencia verificable** (código + línea, o dato recalculado). No inventar errores.
3. **No cambiar fórmulas ni reglas de negocio** sin explicar por qué son incorrectas.
4. **No eliminar** funcionalidades, campos, rutas, identificadores, módulos ni datos.
5. **No ejecutar migraciones destructivas**, borrados ni operaciones financieras sobre la BD real.
6. **No alterar facturas históricas ni saldos reales** durante las pruebas.
7. Mantener la arquitectura existente y **separar lógica de negocio de la presentación**;
   evitar duplicar cálculos entre frontend y backend.
8. Si falta información para determinar el resultado correcto, **documentar la incertidumbre**
   en lugar de asumir una regla (sobre todo en temas fiscales).
9. Sobre impuestos: usar **fuentes oficiales y vigentes de Nicaragua**; distinguir normativa
   fiscal de principios contables generales. Si no se verificó la fuente, decirlo.
10. **Presentar hallazgos y plan de corrección antes de tocar código**; nada se da por
    corregido hasta verificarlo con una prueba.

## Procedimiento

1. **Mapa de flujos financieros**: ver [modulos-financieros.md](./references/modulos-financieros.md)
   (archivos, funciones y operaciones que escriben dinero/inventario).
2. **Localizar cálculo vs. persistencia**: dónde se calcula y dónde se guarda/modifica un saldo
   (`create`, `update`, `increment`, `decrement`, `MovimientoCaja`, `MovimientoCuenta`,
   `MovimientoInventario`, `lotes_inventario`, `cuentas.saldo_actual`).
3. **Seguir el flujo completo** de cada operación: interfaz → controlador → BD → reporte.
4. **Recalcular de forma independiente** y comparar con lo que el sistema generó:
   ejecutar [controles-contables.php](./scripts/controles-contables.php) (solo lectura).
5. **Casos extremos**: cantidades decimales, descuentos, multi-pago, saldos insuficientes,
   anulaciones, devoluciones, ventas a plazos y operaciones simultáneas.
6. **Transacciones y validaciones**: `DB::transaction`, `lockForUpdate`, rollback correcto en
   cada `return` temprano, restricciones/FK, y ausencia de movimientos duplicados.
7. **Diseñar la prueba** que reproduce el error con datos aislados (transacción + rollback o BD
   de pruebas), nunca con datos reales.
8. **Entregar el informe** con el formato de abajo y actualizar
   [hallazgos.md](./references/hallazgos.md).

## Cómo ejecutar los controles (solo lectura)

El script [controles-contables.php](./scripts/controles-contables.php) **no escribe en la BD**:
solo consulta y genera un reporte en `%TEMP%\auditoria_erp.txt`.

```powershell
# Ejecutar (PowerShell, desde la raíz del proyecto)
php artisan tinker "C:\Users\Admin\AppData\Local\Temp\auditoria_erp.php"
```

- Copiar el script a una ruta temporal **fuera del repositorio** antes de ejecutarlo.
- Leer el reporte con la herramienta de lectura de archivos por rangos de líneas.
- **Trampa de PowerShell**: dentro de `--execute="..."` la shell interpola `$variable`.
  Para consultas de una línea usar solo comillas simples internas y **ningún `$`**:
  `php artisan tinker --execute="dump(DB::table('ventas')->count());"`.
  Si el código necesita `$`, escribir un archivo y usar `php artisan tinker <archivo>`.
- Consultas rápidas de esquema: `dump(Schema::getColumnListing('tabla'));`

## Invariantes a verificar (checklist)

| # | Invariante | Cómo se comprueba |
|---|---|---|
| 1 | `ventas.total_venta = subtotal + impuesto − descuento` | recálculo por venta |
| 2 | Σ `detalle_ventas.subtotal + monto_impuesto` = `total_venta` | join ventas/detalle |
| 3 | Venta en efectivo ⇒ 1 `movimientos_caja` INGRESO por el total | `id_referencia` = id_venta |
| 4 | Venta con tarjeta/transferencia ⇒ 1 `movimientos_cuentas` INGRESO | y `cuentas.saldo_actual` actualizado |
| 5 | Anulación de venta ⇒ revierte caja/cuenta **y** stock **y** lotes | 2 movimientos y 2 kardex por venta |
| 6 | Compra ⇒ lotes FIFO = Σ `detalle_compras` y Kardex ENTRADA = cantidad | por línea de compra |
| 7 | `productos.stock_actual` = Σ `variacion_tallas.stock` = Kardex neto = lotes disponibles | por producto |
| 8 | Caja: `monto_inicial + ingresos − salidas = monto_teorico` y `monto_real − teórico = diferencia` | por caja cerrada |
| 9 | Transferencia caja→cuenta: 1 SALIDA (caja) + 1 INGRESO (cuenta), nunca doble ingreso | por transferencia |
| 10 | Costo unitario en `detalle_ventas` = Σ(cantidad × costo de lote) / cantidad | consumos_lotes |
| 11 | Ganancia = Σ(precio sin IVA − costo) × cantidad, solo ventas activas | `estado_venta = 1` |
| 12 | Cuentas: saldo = inicial + Σ ingresos − Σ salidas (saldo inicial trazable) | `movimientos_cuentas` |
| 13 | CxC: Σ cuotas = saldo financiado; Σ aplicaciones = Σ pagos recibidos | `planes_pago`/`cuotas_venta` |
| 14 | Precisión: sin centavos fantasma (precios/IVA/costos) y sin duplicar redondeos | recalcular a 2 y 6 decimales |
| 15 | Cada `return` dentro de una transacción hace `rollBack()` o `commit()` | revisión de código |

## Formato del informe

1. **Errores críticos** que puedan causar pérdidas de dinero o alterar saldos.
2. **Errores contables y fiscales.**
3. **Errores matemáticos y de redondeo.**
4. **Inconsistencias** entre módulos, BD y reportes.
5. **Riesgos de duplicación, concurrencia y falta de trazabilidad.**
6. **Archivos y funciones** implicados en cada hallazgo (ruta:línea).
7. **Ejemplo concreto**: cálculo incorrecto, resultado actual vs. esperado.
8. **Nivel de riesgo, causa raíz y propuesta de solución.**
9. **Pruebas necesarias** para demostrar que la corrección funciona.
10. **Funcionalidades revisadas sin errores** en las pruebas realizadas.

Ordenar por riesgo y separar siempre **verificado** de **no verificado / sin datos de prueba**.

## Referencias

- [modulos-financieros.md](./references/modulos-financieros.md) — mapa de archivos, funciones y tablas.
- [hallazgos.md](./references/hallazgos.md) — hallazgos ya verificados y su estado (mantener al día).
- [controles-contables.php](./scripts/controles-contables.php) — script de recálculo (solo lectura).
