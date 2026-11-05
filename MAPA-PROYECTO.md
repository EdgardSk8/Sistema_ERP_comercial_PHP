# Mapa del proyecto

> Generado automaticamente por `scripts/generar-mapa.ps1`. No editar a mano.

## Convencion
- Vista: `resources/views/<modulo>/<Vista>.blade.php`
- CSS: `resources/css/<modulo>/<Vista>.css` (se carga con `@vite([...])` en la vista)
- JS: `resources/js/<Vista>.js` (registrado en `resources/js/app.js` -> arreglo `modulos`)
- Ruta: `routes/web.php`

## Menu lateral (grupo -> ruta -> texto)

| Grupo | Ruta | Texto del menu |
|---|---|---|
|  | dashboard | Dashboard |
| Ventas | facturacion | Facturación |
| Ventas | ventas | Ventas |
| Ventas | cuentas-por-cobrar | Cuentas por cobrar |
| Ventas | pedidos-web | Pedidos web |
| Ventas | cupones-descuentos | Cupones y descuentos |
| Ventas | clientes | Clientes |
| Compras | crear.compras | Compras |
| Compras | compras | Lista de Compras |
| Compras | proveedores | Proveedores |
| Caja | cajas | Cajas |
| Caja | movimientos.cajas | Movimientos de Caja |
| Cuentas | cuentas | Cuentas |
| Cuentas | movimientos.cuentas | Movimientos de Cuenta |
| Transferencias | transferencia | Caja → Cuenta |
| Gastos | gastos | Gastos |
| Gastos | tipos.gasto | Tipos de Gasto |
| Gastos | movimientos.gastos | Movimiento Gastos |
| Inventario | productos | Productos |
| Inventario | promociones | Promociones |
| Inventario | categorias | Categorías |
| Inventario | ubicaciones | Ubicaciones |
| Inventario | producto-variaciones | Variaciones de Productos |
| Inventario | producto-variaciones-detalles | Detalle de Variación |
| Inventario | tallas | Tallas |
| Inventario | tipos.medidas | Tipos de Medidas |
| Inventario | medidas | Medidas |
| Inventario | movimientos.inventario | Movimientos Inventario |
| Administración | usuarios | Usuarios |
| Administración | roles | Roles |
| Administración | permisos | Permisos |
| Reportes | reportes | Reportes |
| Configuración | impuestos | Impuestos |
| Configuración | metodos.pago | Métodos de Pago |
| Configuración | metodos.pago.cuenta | Método Pago Cuenta |
| Configuración | credenciales | Credenciales |
| Configuración | respaldo | Respaldo |
| Configuración | manual | Manual de uso |
| Configuración | login | header('Location: ' . route('login')); exit; |

## Vistas por modulo

| Vista (blade) | CSS/JS (@vite) | Includes | Modales | Botones | IDs principales |
|---|---|---|---|---|---|
| cajas/ArqueoImpresion.blade.php |  |  |  |  |  |
| cajas/Cajas.blade.php |  |  | modalEditarArqueo, modalArqueoMultiple | btnImprimirArqueo, btnArqueoHoy, btnArqueoSemana, btnLimpiarFiltros, btnArquearSeleccionadas, btnGuardarArqueo, btnGuardarArqueoMultiple | contenido-dinamico, tituloArqueos, btnImprimirArqueo, arqueoFechaInicio, arqueoFechaFin, btnArqueoHoy, btnArqueoSemana, btnLimpiarFiltros, arqueoTotalCajas, arqueoTotalTeorico, arqueoTotalReal, arqueoTotalDiferencia, arqueoSeleccionBarra, arqueoSeleccionarTodo, arqueoSeleccionCantidad, btnArquearSeleccionadas, tablaCajas, modalEditarArqueo, tituloModalArqueo, arqueoCajaEtiqueta |
| categorias/Categorias.blade.php |  | categorias.CheckColumnasCategorias, categorias.CrearCategoria, categorias.EditarCategoria |  |  | contenido-dinamico, tablaCategorias |
| categorias/CheckColumnasCategorias.blade.php |  |  |  | recargarCategorias | colNombre, colDescripcion, colFechaCreacion, colEstado, colAcciones, toggleInactivosCategorias, recargarCategorias |
| categorias/CrearCategoria.blade.php |  |  | modalCrearCategoria | btnGuardarCategoria | modalCrearCategoria, formCrearCategoria, crear_nombre_categoria, crear_descripcion_categoria, btnGuardarCategoria |
| categorias/EditarCategoria.blade.php |  |  | modalEditarCategoria | btnActualizarCategoria | modalEditarCategoria, formEditarCategoria, editar_id_categoria, editar_nombre_categoria, editar_descripcion_categoria, editar_estado_categoria, editar_fecha_creacion_categoria, btnActualizarCategoria |
| clientes/CheckColumnasClientes.blade.php |  |  |  | recargarClientes | colIdentificador, colNombre, colCedula, colRuc, colFechaNacimiento, colTelefono, colCorreo, colDireccion, colUsuarioWeb, colDescuento, colEstado, colFechaCreacion, colAcciones, toggleInactivosClientes, recargarClientes |
| clientes/Clientes.blade.php |  | clientes.CheckColumnasClientes, clientes.CrearCliente, clientes.EditarCliente |  |  | contenido-dinamico, tablaClientes |
| clientes/EditarCliente.blade.php |  |  | modalEditarCliente | btnActualizarCliente | modalEditarCliente, formEditarCliente, editar_id_cliente, editar_nombre_cliente, editar_cedula_cliente, editar_ruc_cliente, editar_telefono_cliente, editar_correo_cliente, editar_direccion_cliente, editar_fecha_nacimiento_cliente, editar_usuario_cliente, editar_password_cliente, editar_descuento_tipo_cliente, editar_descuento_valor_cliente, editar_estado_cliente, editar_fecha_creacion_cliente, btnActualizarCliente |
| compras/CheckColumnasCompras.blade.php |  |  |  | recargarCompras | colIdentificador, colFactura, colProveedor, colUsuario, colFecha, colSubtotal, colDescuento, colImpuesto, colTotal, colMetodoPago, colEstado, colDetalles, toggleFooter, recargarCompras |
| compras/Compras.blade.php |  | compras.CheckColumnasCompras, compras.DetalleCompra |  |  | contenido-dinamico, tablaCompras |
| compras/CrearCompra.blade.php |  | compras.CrearProducto |  | btnAgregar, btnLimpiar, btnRegistrar | contenido-dinamico, proveedor, numero_factura, tipo_factura, metodo_pago, cajacuentaselect, caja_select, cuenta, producto_select, cantidad, btnAgregar, tabla_carrito, subtotal, descuento, impuesto, chk_iva_incluido, total, btnLimpiar, btnRegistrar |
| compras/CrearProducto.blade.php |  |  | modalCrearProducto | btnGuardarProducto | modalCrearProducto, formCrearProducto, crear_nombre_producto, crear_descripcion_producto, crear_id_categoria, crear_medida_producto, crear_id_ubicacion, crear_id_impuesto, crear_precio_compra, crear_check_venta, crear_redondeo_venta, crear_porcentaje_venta, crear_precio_venta, crear_ganancia_producto, crear_precio_venta_TOTAL, crear_stock_actual, crear_imagen_producto, preview_imagen_producto, btnGuardarProducto |
| compras/DetalleCompra.blade.php |  |  | modalDetalleCompra | btnAnularCompra | modalDetalleCompra, facturaTituloCompra, btnAnularCompra, areaImprimirCompra, proveedorNombre, usuarioNombreCompra, fechaCompra, metodoPagoCompra, tablaDetallesCompra, subtotalCompra, descuentoCompra, impuestoCompra, totalCompra |
| credenciales/Credenciales.blade.php |  | credenciales.EditarCredenciales | modalLogoEmpresa | btnEditar, btnCambiarLogo, btnEliminarLogo, btnGuardarLogo | contenido-dinamico, btnEditar, nombre_empresa, ruc_empresa, direccion_empresa, telefono_empresa, correo_empresa, tipo_cambio, logoEmpresaActual, sinLogoEmpresa, btnCambiarLogo, btnEliminarLogo, modalLogoEmpresa, formLogoEmpresa, logo_id_empresa, archivoLogoEmpresa, contenedorPreviewLogo, previewLogoEmpresa, btnGuardarLogo |
| credenciales/EditarCredenciales.blade.php |  |  | modalEditarEmpresa | btnActualizarEmpresa | modalEditarEmpresa, formEditarEmpresa, editar_id_empresa, editar_nombre_empresa, editar_ruc_empresa, editar_direccion_empresa, editar_telefono_empresa, editar_correo_empresa, editar_tipo_cambio, editar_tarifa_km, editar_latitud_empresa, editar_longitud_empresa, btnActualizarEmpresa |
| cuentas/CheckColumnasCuentas.blade.php |  |  |  | recargarCuentas | colNombreCuenta, colTipo, colDescripcion, colSaldo, colEstado, colAcciones, toggleInactivosCuentas, recargarCuentas |
| cuentas/CrearCuenta.blade.php |  |  | modalCrearCuenta | btnGuardarCuenta | modalCrearCuenta, formCrearCuenta, crear_nombre_cuenta, crear_tipo_cuenta, crear_descripcion_cuenta, crear_saldo_cuenta, btnGuardarCuenta |
| cuentas/Cuentas.blade.php |  | cuentas.CheckColumnasCuentas, cuentas.CrearCuenta, cuentas.EditarCuenta, cuentas.TransferirCuenta |  |  | contenido-dinamico, tablaCuentas |
| cuentas/EditarCuenta.blade.php |  |  | modalEditarCuenta | btnActualizarCuenta | modalEditarCuenta, formEditarCuenta, editar_id_cuenta, editar_nombre_cuenta, editar_tipo_cuenta, editar_estado_cuenta, editar_descripcion_cuenta, editar_saldo_cuenta, btnActualizarCuenta |
| cuentas/TransferirCuenta.blade.php |  |  | ModalTransferirCuenta | btnTransferir | ModalTransferirCuenta, cuenta_origen, cuenta_destino, saldo_origen, saldo_destino, saldo_origen_resultante, saldo_destino_resultante, monto_transferencia, check_concepto, grupo_selector_concepto, selector_concepto, grupo_input_concepto, input_concepto, btnTransferir |
| cuentasporcobrar/CuentasPorCobrar.blade.php | resources/css/cuentasporcobrar/CuentasPorCobrar.css |  | modalDetalleCartera, modalAbonoCartera | recargarCartera, imprimirDetalleCartera, guardarAbonoCartera | contenido-dinamico, resumenCarteraTotal, resumenCarteraVencido, resumenCarteraPorVencer, resumenCarteraClientes, filtroEstadoCartera, recargarCartera, tablaCuentasPorCobrar, estadoVacioCartera, errorCartera, modalDetalleCartera, tituloDetalleCartera, imprimirDetalleCartera, facturaDetalleCartera, totalDetalleCartera, saldoDetalleCartera, clienteDetalleCartera, productosDetalleCartera, cuotasDetalleCartera, pagosDetalleCartera |
| cuponesdescuentos/CheckColumnasCupones.blade.php |  |  |  | btnNuevoCupon, recargarCupones | cuponColCodigo, cuponColNombre, cuponColTipo, cuponColValor, cuponColCategoria, cuponColUsos, cuponColVigencia, cuponColEstado, cuponColClientes, cuponColAcciones, btnNuevoCupon, buscarCupon, recargarCupones |
| cuponesdescuentos/CuponesDescuentos.blade.php | resources/css/cuponesdescuentos/CuponesDescuentos.css | cuponesdescuentos.CheckColumnasCupones | modalDetalleCupon, modalCupon, modalAsignarClientes | btnAsignarClientes, btnGuardarCupon, btnConfirmarAsignacion | contenido-dinamico, resumenCuponesTotal, resumenCuponesActivos, resumenCuponesFidelidad, resumenCuponesUsados, bienvenidaDisponibles, bienvenidaUsados, fidelidadCupones, cuponesAsignaciones, promocionesActivas, tablaCupones, modalDetalleCupon, tituloDetalleCupon, btnAsignarClientes, detalleCuponCodigo, detalleCuponNombre, detalleCuponOrigen, detalleCuponTipo, detalleCuponValor, detalleCuponCategoria |
| dashboard/Dashboard.blade.php |  |  |  | Btn_Limpiar_Filtros | contenido-dinamico, ventas, compras, ganancias, cajas, tallas, Movimiento_inventario, kpis_1, kpis_2, kpis_3, kpis_4, kpis_5, kpis_6, Dia, Mes, Anio, Semana, Fecha_Inicio, Fecha_Fin, Btn_Limpiar_Filtros |
| dashboard/GananciasGrafica.blade.php |  |  |  | BTN-Limpiar-Ganancias | Filtro-Ganancias, Tipo-Grafica-Ganancias, Select-Anio-Ganancias, Select-Mes-Ganancias, Select-Dia-Ganancias, Fecha-Inicio-Ganancias, Fecha-Fin-Ganancias, BTN-Limpiar-Ganancias, kpi-ganancia-total, kpi-ingresos, kpi-ganancia-unidad, kpi-margen-venta, kpi-ventas-totales, chartGanancias |
| dashboard/Movimiento_InventarioGrafica.blade.php |  |  |  | BTN-Limpiar-Inventario | Filtro-Inventario, Tipo-Grafica-Inventario, Select-Anio-Inventario, Select-Mes-Inventario, Select-Dia-Inventario, Fecha-Inicio-Inventario, Fecha-Fin-Inventario, BTN-Limpiar-Inventario, kpi-total-movimientos, kpi-entradas, kpi-salidas, kpi-ajustes, kpi-balance, kpi-promedio, Chart-Inventario |
| dashboard/VentasGrafica.blade.php |  |  |  | BTN-Limpiar-Ventas | Filtro-Ventas, Tipo-Grafica-Ventas, Select-Anio-Ventas, Select-Mes-Ventas, Select-Dia-Ventas, Fecha-Inicio-Ventas, Fecha-Fin-Ventas, BTN-Limpiar-Ventas, kpi-total-ventas, kpi-ingresos-venta, kpi-unidades-vendidas, kpi-promedio-venta, kpi-venta-maxima, kpi-impuestos, chartVentas |
| errors/sin_permiso.blade.php |  |  |  |  |  |
| facturacion/Facturacion.blade.php |  |  | modalidadVenta, modalPlanPagoVenta, modalPrecioLiquidacion | btnAbrirCaja, btnCerrarCaja, btnFacturar, agregarCuotaPlanPago, confirmarPlanPagoVenta, btnAplicarLiquidacion | contenido-dinamico, btnAbrirCaja, btnCerrarCaja, toggleFactura, BTN-Imprimir-Factura, toggleProformaFactura, BTN-Imprimir-Proforma, toggleLimpiarCaja, btnLimpiarCaja, tablaProductos, tasaImpuesto, NumeroCaja, clientes, modalidadVenta, grupoMetodoCobro, etiquetaMetodoCobro, metodo_pago, id_cuenta_metodo_pago, total, abonoInicialCreditoContenedor |
| gastos/CheckColumnasGastos.blade.php |  |  |  | recargarGastos | colNombre, colTipo, colDescripcion, colFechaPago, colEstadoPago, colUltimoPago, colMonto, colEstado, colAcciones, toggleInactivosGastos, recargarGastos |
| gastos/CrearGasto.blade.php |  |  | modalCrearGasto | btnGuardarGasto | modalCrearGasto, formCrearGasto, crear_nombre_gasto, crear_id_tipo_gasto, crear_descripcion_gasto, crear_fecha_pago, btnGuardarGasto |
| gastos/DetalleGasto.blade.php |  |  | modalDetalleGasto |  | modalDetalleGasto, detalleNombreGasto, areaImprimirGasto, detalleTipoGasto, detalleDescripcion, detalleUltimoPago, tablaHistorialGasto |
| gastos/EditarGasto.blade.php |  |  | modalEditarGasto | btnActualizarGasto | modalEditarGasto, formEditarGasto, editar_id_gasto, editar_nombre_gasto, editar_id_tipo_gasto, editar_descripcion_gasto, editar_estado_gasto, btnActualizarGasto |
| gastos/Gastos.blade.php |  | gastos.CrearGasto, gastos.EditarGasto, gastos.PagarGasto, gastos.DetalleGasto, gastos.CheckColumnasGastos |  |  | contenido-dinamico, tablaGastos |
| gastos/PagarGasto.blade.php |  |  | modalPagarGasto | btnPagarGasto | modalPagarGasto, formPagarGasto, pagar_id_gasto, pagar_nombre_gasto, pagar_ultimo_pago, pagar_ultimo_monto, pagar_monto, pagar_id_caja, pagar_id_cuenta, pagar_renovar_fecha, grupo_fecha_manual, pagar_nueva_fecha, btnPagarGasto |
| impuestos/CheckColumnasImpuestos.blade.php |  |  |  | recargarImpuestos | colNombre, colPorcentaje, colFechaCreacion, colEstado, colAcciones, toggleInactivosImpuestos, recargarImpuestos |
| impuestos/CrearImpuesto.blade.php |  |  | modalCrearImpuesto | btnGuardarImpuesto | modalCrearImpuesto, formCrearImpuesto, crear_nombre_impuesto, crear_porcentaje_impuesto, btnGuardarImpuesto |
| impuestos/EditarImpuesto.blade.php |  |  | modalEditarImpuesto | btnActualizarImpuesto | modalEditarImpuesto, formEditarImpuesto, editar_id_impuesto, editar_nombre_impuesto, editar_porcentaje_impuesto, editar_estado_impuesto, editar_fecha_creacion_impuesto, btnActualizarImpuesto |
| impuestos/Impuestos.blade.php |  | impuestos.CheckColumnasImpuestos, impuestos.CrearImpuesto, impuestos.EditarImpuesto |  |  | contenido-dinamico, tablaImpuestos |
| inventario/CheckColumnas.blade.php |  |  |  | recargarKardex | colIdentificador, colUsuario, colFecha, colProducto, colVariacion, colMovimiento, colTipo, colMotivo, colCantidad, colStockActual, colPrecio, colTotalVendido, toggleFooter, recargarKardex |
| inventario/MovimientosInventario.blade.php |  | inventario.CheckColumnas |  |  | contenido-dinamico, tablaKardex |
| login/Login.blade.php | resources/css/variables.css, resources/css/login/login.css | principal.links |  |  | formLogin, nombre_usuario, password |
| medidas/CheckColumnasMedidas.blade.php |  |  |  | recargarMedidas | colTipoMedida, colNombreMedida, colAbreviatura, colOrden, colFecha, colEstado, colAcciones, toggleInactivosMedidas, toggleFooter, recargarMedidas |
| medidas/CrearMedidas.blade.php |  |  | modalCrearMedida | btnGuardarMedida | modalCrearMedida, formCrearMedida, crear_tipo_medida, crear_nombre_medida, crear_abreviatura_medida, crear_orden_medida, btnGuardarMedida |
| medidas/EditarMedidas.blade.php |  |  | modalEditarMedida | btnActualizarMedida | modalEditarMedida, formEditarMedida, editar_id_medida, editar_tipo_medida, editar_nombre_medida, editar_abreviatura_medida, editar_orden_medida, editar_estado_medida, editar_fecha_creacion_medida, btnActualizarMedida |
| medidas/Medidas.blade.php |  | medidas.CheckColumnasMedidas, medidas.CrearMedidas, medidas.EditarMedidas |  |  | contenido-dinamico, tablaMedidas |
| metodos_pago/CheckColumnasMetodosPago.blade.php |  |  |  | recargarMetodosPago | colNombre, colDescripcion, colEstado, colAcciones, toggleInactivosMetodosPago, recargarMetodosPago |
| metodos_pago/CrearMetodoPago.blade.php |  |  | modalCrearMetodoPago | btnGuardarMetodoPago | modalCrearMetodoPago, formCrearMetodoPago, crear_nombre_metodo_pago, crear_descripcion_metodo_pago, btnGuardarMetodoPago |
| metodos_pago/EditarMetodoPago.blade.php |  |  | modalEditarMetodoPago | btnActualizarMetodoPago | modalEditarMetodoPago, formEditarMetodoPago, editar_id_metodo_pago, editar_nombre_metodo_pago, editar_descripcion_metodo_pago, editar_estado_metodo_pago, btnActualizarMetodoPago |
| metodos_pago/MetodosPago.blade.php |  | metodos_pago.CheckColumnasMetodosPago, metodos_pago.CrearMetodoPago, metodos_pago.EditarMetodoPago |  |  | contenido-dinamico, tablaMetodosPago |
| metodos_pago_cuenta/CheckColumnasMetodosPagoCuenta.blade.php |  |  |  | recargarMetodosPagoCuenta | colNombre, colDescripcion, colEstado, colAcciones, toggleInactivosMetodosPago, recargarMetodosPagoCuenta |
| metodos_pago_cuenta/CrearMetodoPagoCuenta.blade.php |  |  | ModalCrearMetodoPagoCuenta | btnGuardarMetodoPagoCuenta | ModalCrearMetodoPagoCuenta, formCrearMetodoPagoCuenta, id_metodo_pago, id_cuenta, estado, listaCuentasVinculadas, resumenVinculosMetodoPago, btnGuardarMetodoPagoCuenta |
| metodos_pago_cuenta/EditarMetodoPagoCuenta.blade.php |  |  | ModalEditarMetodoPagoCuenta | btnActualizarMetodoPagoCuenta | ModalEditarMetodoPagoCuenta, editar_id_metodo_pago, editar_id_metodo_pago_cuenta, editar_nombre_metodo_pago, editar_listaCuentasVinculadas, btnActualizarMetodoPagoCuenta |
| metodos_pago_cuenta/MetodosPagoCuenta.blade.php |  | metodos_pago_cuenta.CheckColumnasMetodosPagoCuenta, metodos_pago_cuenta.CrearMetodoPagoCuenta, metodos_pago_cuenta.EditarMetodoPagoCuenta |  |  | contenido-dinamico, tablaMetodoPagoCuenta |
| movimientos_caja/CheckColumnasMovimiento_Caja.blade.php |  |  |  | recargarMovimientosCaja | colIdentificador, colUsuario, colFecha, colCaja, colTipo, colMonto, colConcepto, colCuentaDestino, recargarMovimientosCaja |
| movimientos_caja/Movimientos_Caja.blade.php |  |  |  |  | contenido-dinamico, tablaMovimientosCaja |
| movimientos_cuenta/CheckColumnasMovimientoCuentas.blade.php |  |  |  | recargarMovimientosCuenta | colIdentificador, colUsuario, colFecha, colCuenta, colTipo, colDescripcion, colMonto, toggleFooter, recargarMovimientosCuenta |
| movimientos_cuenta/Movimientos_Cuentas.blade.php |  | movimientos_cuenta.CheckColumnasMovimientoCuentas |  |  | contenido-dinamico, tablaMovimientosCuenta |
| movimientos_gasto/CheckColumnasMovimientosGastos.blade.php |  |  |  | recargarMovimientosGastos | colIdentificador, colFecha, colGasto, colMonto, colOrigen, colCaja, colCuenta, colUsuario, colObservacion, recargarMovimientosGastos |
| movimientos_gasto/Movimientos_Gastos.blade.php |  | movimientos_gasto.CheckColumnasMovimientosGastos |  |  | contenido-dinamico, tablaMovimientosGastos |
| pedidosweb/PedidosWeb.blade.php | resources/css/pedidosweb/PedidosWeb.css |  | modalDetallePedidoWeb, modalConfirmarAccionPedidoWeb | recargarPedidosWeb, btnAceptarPedidoWeb, btnCancelarPedidoWeb, btnImprimirPedidoWeb, btnMarcarPagadoPedidoWeb, btnGuardarPedidoWeb, btnWhatsappPedidoWeb, confirmarAccionPedidoWeb | contenido-dinamico, resumenPedidosTotal, resumenPedidosSolicitados, resumenPedidosAceptados, resumenPedidosEnCamino, resumenPedidosEntregados, resumenPedidosCancelados, pedidoColNumero, pedidoColCliente, pedidoColProductos, pedidoColTotal, pedidoColEstado, pedidoColPago, pedidoColMetodoPago, pedidoColPreferida, pedidoColAceptado, pedidoColEntrega, pedidoColAcciones, filtroEstadoPedido, filtroEstadoPago |
| permisos/Permisos.blade.php |  |  |  |  | contenido-dinamico, selectRol, buscarPermiso, estadoSinRol, contenedorPermisos |
| productos/CheckColumnasProductos.blade.php |  |  |  | recargarProductos | colId, colImagen, colNombre, colCategoria, colPrecioCompra, colPrecioVenta, colGanancia, colGananciaPorcentaje, colImpuesto, colStock, colEstado, colAcciones, toggleInactivosProductos, toggleFooter, recargarProductos |
| productos/DetalleProducto.blade.php |  |  | modalDetalleProducto |  | modalDetalleProducto, detalle_imagen_producto, sin_imagen_texto, detalle_nombre_producto, detalle_descripcion_producto, detalle_categoria_producto, detalle_ubicacion_producto, detalle_impuesto_producto, detalle_precio_compra, detalle_precio_venta, detalle_stock_producto, detalle_fecha_producto, detalle_estado_producto |
| productos/EditarProducto.blade.php |  |  | modalEditarProducto, modalDistribuirAjusteVariacion | btnActualizarProducto, btnConfirmarAjusteVariacion | modalEditarProducto, formEditarProducto, editar_id_producto, editar_nombre_producto, editar_descripcion_producto, editar_id_categoria, editar_medida_producto, editar_id_ubicacion, editar_id_impuesto, editar_precio_compra, editar_check_venta, editar_redondeo_venta, editar_porcentaje_venta, editar_precio_venta, editar_ganancia_producto, editar_precio_venta_TOTAL, editar_stock_actual, ajustar_stock_actual, editar_stock_motivo, editar_imagen_producto |
| productos/Productos.blade.php |  | productos.EditarProducto, productos.DetalleProducto, productos.CheckColumnasProductos |  |  | contenido-dinamico, TablaMostrarProductos |
| productosvariacion/CheckColumnasProductoVariacion.blade.php |  |  |  | recargarProductoVariaciones | colProducto, colColor, colEstado, colAcciones, toggleInactivosProductoVariaciones, toggleFooter, recargarProductoVariaciones |
| productosvariacion/CrearProductoVariacion.blade.php |  |  | modalCrearProductoVariacion |  | modalCrearProductoVariacion, formCrearProductoVariacion, crear_id_producto, crear_color |
| productosvariacion/EditarProductoVariacion.blade.php |  |  | modalEditarProductoVariacion |  | modalEditarProductoVariacion, formEditarProductoVariacion, editar_id_variacion, editar_id_producto, editar_color |
| productosvariacion/ProductoVariaciones.blade.php |  | productosvariacion.CheckColumnasProductoVariacion, productosvariacion.CrearProductoVariacion, productosvariacion.EditarProductoVariacion |  |  | contenido-dinamico, tablaProductoVariaciones |
| productosvariaciondetalles/CheckColumnasProductoVariacionDetalle.blade.php |  |  |  | recargarProductoVariacionDetalle | CheckColumnasProductoVariacionDetalle, recargarProductoVariacionDetalle |
| productosvariaciondetalles/CrearVariacionImagen.blade.php |  |  | modalCrearVariacionImagen |  | modalCrearVariacionImagen, formCrearVariacionImagen, crear_id_variacion, crear_imagen, crear_preview_imagenes, crear_orden |
| productosvariaciondetalles/EditarVariacionImagen.blade.php |  |  | modalEditarVariacionImagen |  | modalEditarVariacionImagen, formEditarVariacionImagen, editar_id_imagen, editar_id_variacion, editar_imagen, editar_preview_imagen, editar_orden |
| productosvariaciondetalles/ProductoVariacionDetalle.blade.php |  | productosvariaciondetalles.CheckColumnasProductoVariacionDetalle, productosvariaciondetalles.CrearVariacionImagen, productosvariaciondetalles.EditarVariacionImagen | modalGaleriaVariacionImagenes, modalCrearVariacionTalla, modalEditarVariacionTalla | galeria_variacion_agregar | contenido-dinamico, tablaProductoVariacionDetalle, modalGaleriaVariacionImagenes, galeria_variacion_titulo, galeria_variacion_subtitulo, galeria_variacion_contenido, reemplazar_imagen_variacion, agregar_imagenes_variacion, galeria_variacion_agregar, modalCrearVariacionTalla, formCrearVariacionTalla, crear_talla_id_variacion, crear_id_tipo_talla_var, crear_id_talla, crear_stock_variacion_talla, crear_sku_variacion, crear_precio_compra_variacion, crear_precio_venta_variacion, crear_modo_precio_variacion, modalEditarVariacionTalla |
| promociones/Promociones.blade.php | resources/css/promociones/Promociones.css |  | modalPromocion, modalImagenPromocion | btnNuevaPromocion, btnGuardarPromocion | contenido-dinamico, btnNuevaPromocion, tablaPromociones, promocionesVacio, errorPromociones, modalPromocion, tituloModalPromocion, formPromocion, idPromocion, promocionProducto, promocionFiltroCategoria, promocionBuscarProducto, promocionProductos, promocionImagenPreview, promocionBadgePreview, promocionImagenTexto, promocionImagen, promocionFechaInicio, promocionFechaFin, promocionTipoDescuento |
| proveedores/CheckColumnasProveedor.blade.php |  |  |  | recargarProveedores | colIdentificador, colNombre, colRuc, colTelefono, colCorreo, colDireccion, colEstado, colAcciones, toggleInactivosProveedores, recargarProveedores |
| proveedores/CrearProveedor.blade.php |  |  | modalCrearProveedor | btnGuardarProveedor | modalCrearProveedor, formCrearProveedor, crear_nombre_proveedor, tipo_ruc, crear_ruc_proveedor, crear_telefono_proveedor, crear_correo_proveedor, crear_direccion_proveedor, btnGuardarProveedor |
| proveedores/EditarProveedor.blade.php |  |  | modalEditarProveedor | btnActualizarProveedor | modalEditarProveedor, formEditarProveedor, editar_id_proveedor, editar_nombre_proveedor, editar_ruc_proveedor, editar_telefono_proveedor, editar_correo_proveedor, editar_direccion_proveedor, editar_estado_proveedor, editar_fecha_creacion_proveedor, btnActualizarProveedor |
| proveedores/Proveedores.blade.php |  | proveedores.CheckColumnasProveedor, proveedores.CrearProveedor, proveedores.EditarProveedor |  |  | contenido-dinamico, tablaProveedores |
| reportes/Reportes.blade.php |  |  |  | btnGenerarReporte, limpiafiltroreporte | contenido-dinamico, ventas, inventario, movimientos, clientes, usuarios, cajas, exportExcel, exportPDF, btnGenerarReporte, FechaInicio, FechaFin, LimiteDatos, Orden-Datos, limpiafiltroreporte, Reportes |
| respaldo/Respaldo.blade.php |  |  |  | btnExportarSistema, btnImportarSistema | contenido-dinamico, excel, pdf, csv, sql, btnExportarSistema, archivoSql, btnImportarSistema |
| roles/CheckColumnasRoles.blade.php |  |  |  | recargarRoles | colNombre, colDescripcion, colFechaCreacion, colEstado, colAcciones, toggleInactivosRoles, recargarRoles |
| roles/CrearRol.blade.php |  |  | modalCrearRol | btnGuardarRol | modalCrearRol, formCrearRol, crear_nombre_rol, crear_descripcion_rol, btnGuardarRol |
| roles/EditarRol.blade.php |  |  | modalEditarRol | btnActualizarRol | modalEditarRol, formEditarRol, editar_id_rol, editar_nombre_rol, editar_descripcion_rol, editar_estado_rol, editar_fecha_creacion_rol, btnActualizarRol |
| roles/Roles.blade.php |  | roles.CheckColumnasRoles, roles.CrearRol, roles.EditarRol |  |  | contenido-dinamico, tablaRoles |
| tallas/CheckColumnasTallas.blade.php |  |  |  | recargarTallas | colTalla, colTipoTalla, colVariantesTalla, colEstadoTalla, colAccionesTalla, toggleInactivasTallas, toggleFooterTallas, recargarTallas |
| tallas/CrearTalla.blade.php |  |  | modalCrearTalla | btnGuardarTalla | modalCrearTalla, formCrearTalla, crear_talla, crear_id_tipo_talla, btnGuardarTalla |
| tallas/CrearTipoTalla.blade.php |  |  | modalCrearTipoTalla | btnGuardarTipoTalla | modalCrearTipoTalla, formCrearTipoTalla, crear_nombre_tipo_talla, crear_descripcion_tipo_talla, btnGuardarTipoTalla |
| tallas/EditarTalla.blade.php |  |  | modalEditarTalla | btnActualizarTalla | modalEditarTalla, formEditarTalla, editar_id_talla, editar_estado_talla, editar_talla, editar_id_tipo_talla, editar_variantes_talla, editar_estado_talla_texto, btnActualizarTalla |
| tallas/EditarTipoTalla.blade.php |  |  | modalEditarTipoTalla | btnActualizarTipoTalla | modalEditarTipoTalla, formEditarTipoTalla, editar_id_tipo_talla, editar_estado_tipo_talla, editar_nombre_tipo_talla, editar_descripcion_tipo_talla, editar_tallas_tipo_talla, editar_estado_tipo_talla_texto, btnActualizarTipoTalla |
| tallas/Tallas.blade.php |  | tallas.CheckColumnasTallas, tallas.CrearTalla, tallas.EditarTalla, tallas.TiposTallaModal, tallas.CrearTipoTalla, tallas.EditarTipoTalla |  |  | contenido-dinamico, tablaTallas |
| tallas/TiposTallaModal.blade.php |  |  | modalTiposTalla | btnNuevoTipoTalla | modalTiposTalla, btnNuevoTipoTalla, tablaTiposTalla |
| tipos_gasto/CheckColumnasTipoGasto.blade.php |  |  |  | recargarTiposGasto | colNombre, colDescripcion, colEstado, colAcciones, toggleInactivosTipoGasto, recargarTiposGasto |
| tipos_gasto/CrearTipoGasto.blade.php |  |  | modalCrearTipoGasto | btnGuardarTipoGasto | modalCrearTipoGasto, formCrearTipoGasto, crear_nombre_tipo_gasto, crear_descripcion_tipo_gasto, btnGuardarTipoGasto |
| tipos_gasto/EditarTipoGasto.blade.php |  |  | modalEditarTipoGasto | btnActualizarTipoGasto | modalEditarTipoGasto, formEditarTipoGasto, editar_id_tipo_gasto, editar_nombre_tipo_gasto, editar_descripcion_tipo_gasto, editar_estado_tipo_gasto, btnActualizarTipoGasto |
| tipos_gasto/TiposGasto.blade.php |  | tipos_gasto.CheckColumnasTipoGasto, tipos_gasto.CrearTipoGasto, tipos_gasto.EditarTipoGasto |  |  | contenido-dinamico, tablaTipoGasto |
| tipos_medidas/CheckColumnasTiposMedidas.blade.php |  |  |  | recargarTiposMedidas | colNombreTipoMedida, colDescripcionTipoMedida, colFechaCreacionTipoMedida, colEstadoTipoMedida, colAccionesTipoMedida, toggleInactivosTiposMedidas, recargarTiposMedidas |
| tipos_medidas/CrearTipoMedida.blade.php |  |  | modalCrearTipoMedida | btnGuardarTipoMedida | modalCrearTipoMedida, formCrearTipoMedida, crear_nombre_tipo_medida, crear_descripcion_tipo_medida, btnGuardarTipoMedida |
| tipos_medidas/EditarTipoMedida.blade.php |  |  | modalEditarTipoMedida | btnActualizarTipoMedida | modalEditarTipoMedida, formEditarTipoMedida, editar_id_tipo_medida, editar_nombre_tipo_medida, editar_descripcion_tipo_medida, editar_estado_tipo_medida, editar_fecha_creacion_tipo_medida, btnActualizarTipoMedida |
| tipos_medidas/TiposMedidas.blade.php |  | tipos_medidas.CheckColumnasTiposMedidas, tipos_medidas.CrearTipoMedida, tipos_medidas.EditarTipoMedida |  |  | contenido-dinamico, tablaTiposMedidas |
| transferenciacajacuenta/CheckColumnasTransferirCuentas.blade.php |  |  |  | recargarTransferencias | colCaja, colFecha, colAbreCaja, colCierraCaja, colSaldo, colTransferido, colCuentaTransferida, colAcciones, recargarTransferencias |
| transferenciacajacuenta/DetalleCuenta.blade.php |  |  | modalDetalleTransferencias |  | modalDetalleTransferencias, cajaDetalleTitulo, detalleCajaNumero, detalleCantidadTransferencias, detalleTotalTransferido, tablaDetalleTransferencias |
| transferenciacajacuenta/Transferencia.blade.php |  | transferenciacajacuenta.TransferirCuenta, transferenciacajacuenta.DetalleCuenta |  |  | contenido-dinamico, tablaCajaCuenta |
| transferenciacajacuenta/TransferirCuenta.blade.php |  |  | modalTransferir | btnGuardarTransferencia | modalTransferir, id_caja, infoCaja, infoFecha, infoInicial, infoFinal, monto, saldo_restante, cuenta, btnGuardarTransferencia |
| ubicaciones/CheckColumnasUbicacion.blade.php |  |  |  | recargarUbicaciones | colNombreUbicacion, colDescripcionUbicacion, colEstadoUbicacion, colAccionesUbicacion, toggleInactivosUbicaciones, recargarUbicaciones |
| ubicaciones/CrearUbicacion.blade.php |  |  | modalCrearUbicacion | btnGuardarUbicacion | modalCrearUbicacion, formCrearUbicacion, crear_nombre_ubicacion, crear_descripcion_ubicacion, btnGuardarUbicacion |
| ubicaciones/EditarUbicacion.blade.php |  |  | modalEditarUbicacion | btnActualizarUbicacion | modalEditarUbicacion, formEditarUbicacion, editar_id_ubicacion, editar_nombre_ubicacion, editar_descripcion_ubicacion, btnActualizarUbicacion |
| ubicaciones/Ubicaciones.blade.php |  | ubicaciones.CheckColumnasUbicacion, ubicaciones.CrearUbicacion, ubicaciones.EditarUbicacion | modalConfirmarEstadoUbicacion | confirmarCambioEstadoUbicacion | contenido-dinamico, tablaUbicaciones, modalConfirmarEstadoUbicacion, mensajeConfirmarEstadoUbicacion, confirmarCambioEstadoUbicacion |
| usuarios/CheckColumnasUsuarios.blade.php |  |  |  | recargarUsuarios | colNombre, colCedula, colUsuario, colRol, colEstado, colAcciones, toggleInactivosUsuarios, recargarUsuarios |
| usuarios/CrearUsuario.blade.php |  |  | modalCrearUsuario | btnGuardarUsuario | modalCrearUsuario, formCrearUsuario, crear_nombre_completo_usuario, crear_cedula_usuario, crear_nombre_usuario, crear_rol_usuario, crear_password_usuario, btnGuardarUsuario |
| usuarios/EditarUsuario.blade.php |  |  | modalEditarUsuario | btnActualizarUsuario | modalEditarUsuario, formEditarUsuario, editar_id_usuario, editar_nombre_completo_usuario, editar_cedula_usuario, editar_nombre_usuario, editar_rol_usuario, editar_estado_usuario, editar_password_usuario, editar_fecha_creacion, btnActualizarUsuario |
| usuarios/Usuario.blade.php |  | usuarios.CheckColumnasUsuarios, usuarios.CrearUsuario, usuarios.EditarUsuario |  |  | contenido-dinamico, tablaUsuarios |
| ventas/CheckColumnasVentas.blade.php |  |  |  | recargarVentas | colId, colFactura, colCliente, colUsuario, colNCaja, colFecha, colSubtotal, colImpuesto, colTotal, colMetodoPago, colEstado, colDetalles, toggleFooter, recargarVentas |
| ventas/DetalleVenta.blade.php |  |  | modalDetalleVenta | btnImprimir, btnAnular | modalDetalleVenta, facturaTitulo, btnImprimir, btnAnular, areaImprimir, clienteNombre, usuarioNombre, fechaVenta, metodoPago, tablaDetalles, subtotalVenta, impuestoVenta, totalVenta |
| ventas/Ventas.blade.php |  | ventas.CheckColumnasVentas, ventas.DetalleVenta |  |  | contenido-dinamico, tablaVentas |

## Mapa JS (selector raiz -> modulo)

| Selector raiz | Modulo JS |
|---|---|
| #Chart_1 | resources/js/Dashboard.js |
| #btnFacturar | resources/js/Facturacion.js |
| #tablaVentas | resources/js/MostrarVentas.js |
| #tablaClientes | resources/js/MostrarCliente.js |
| #tabla_carrito | resources/js/RealizarCompras.js |
| #tablaCompras | resources/js/MostrarCompras.js |
| #tablaProveedores | resources/js/MostrarProveedor.js |
| #tablaCajas | resources/js/MostrarCajas.js |
| #tablaMovimientosCaja | resources/js/Movimientos_Caja.js |
| #tablaCuentas | resources/js/MostrarCuentas.js |
| #tablaMovimientosCuenta | resources/js/Movimientos_Cuentas.js |
| #tablaCajaCuenta | resources/js/MostrarCajaTransferencia.js |
| #tablaGastos | resources/js/MostrarGastos.js |
| #tablaTipoGasto | resources/js/MostrarTipoGasto.js |
| #tablaMovimientosGastos | resources/js/Movimientos_Gastos.js |
| #TablaMostrarProductos | resources/js/MostrarProducto.js |
| #tablaPromociones | resources/js/MostrarPromociones.js |
| #tablaCategorias | resources/js/MostrarCategoria.js |
| #tablaKardex | resources/js/Movimientos_Inventario.js |
| #tablaUsuarios | resources/js/MostrarUsuarios.js |
| #tablaRoles | resources/js/MostrarRoles.js |
| #selectRol | resources/js/PermisosRoles.js |
| #Reportes | resources/js/Reportes.js |
| #tablaImpuestos | resources/js/MostrarImpuestos.js |
| #tablaMetodosPago | resources/js/MostrarMetodoPago.js |
| #tablaMetodoPagoCuenta | resources/js/MostrarMetodoPagoCuenta.js |
| #nombre_empresa | resources/js/Credenciales.js |
| #btnExportarSistema | resources/js/Respaldo.js |
| #tablaTiposMedidas | resources/js/MostrarTiposMedidas.js |
| #tablaMedidas | resources/js/MostrarMedidas.js |
| #tablaTallas | resources/js/MostrarTallas.js |
| #tablaProductoVariaciones | resources/js/MostrarProductoVariacion.js |
| #tablaProductoVariacionDetalle | resources/js/MostrarProductoVariacionDetalle.js |
| #tablaUbicaciones | resources/js/MostrarUbicaciones.js |
| #tablaCuentasPorCobrar | resources/js/CuentasPorCobrar.js |
| #tablaPedidosWeb | resources/js/MostrarPedidosWeb.js |
| #tablaCupones | resources/js/MostrarCuponesDescuentos.js |
| #manualNav | resources/js/Manual.js |

## Selectores que consulta cada JS

| JS | Funcion | IDs principales |
|---|---|---|
| app.js |  | #chartVentas, #btnFacturar, #contenido-dinamico |
| Credenciales.js | initCredenciales | #titulo, #modalLogoEmpresa, #modalConfirmarEliminarLogoEmpresa |
| CuentasPorCobrar.js | initCuentasPorCobrar | #titulo, #modalDetalleCartera, #modalAbonoCartera |
| Dashboard.js | initDashboard | #titulo, #Btn_Limpiar_Filtros, #Chart_1, #Chart_2, #Chart_3, #Mes |
| Facturacion.js | initFacturacion | #tablaProductos, #titulo, #modalPrecioLiquidacion, #modalPlanPagoVenta, #modalAbrirCaja, #montoInicialCaja |
| logout.js |  | #modalConfirmarLogout |
| Manual.js | initManual | #manualNav, #titulo, #manualVolverArriba |
| MostrarCajas.js | initMostrarCajas | #titulo, #arqueoFechaInicio, #arqueoFechaFin, #modalEditarArqueo, #arqueoSeleccionarTodo, #arqueoSeleccionCantidad, #btnArquearSeleccionadas, #arqueoMultipleDetalle, #arqueoMultipleDiferencia, #btnGuardarArqueoMultiple, #arqueoMultipleReal, #arqueoMultipleCantidad |
| MostrarCajaTransferencia.js | initCajaTransferencia | #titulo, #modalTransferir, #modalDetalleTransferencias |
| MostrarCategoria.js | initMostrarCategorias | #titulo |
| MostrarCliente.js | initMostrarCliente | #titulo |
| MostrarCompras.js | initMostrarCompras | #titulo, #modalDetalleCompra |
| MostrarCuentas.js | initCuentas | #titulo, #modalMovimiento, #ModalTransferirCuenta |
| MostrarCuponesDescuentos.js | initCuponesDescuentos | #titulo, #formCupon, #modalCupon, #modalAsignarClientes, #tituloModalCupon, #btnGuardarCupon, #btnConfirmarAsignacion, #errorFormCupon, #cuponCategoria, #cuponCodigo, #cuponNombre, #cuponTipo |
| MostrarGastos.js | initMostrarGastos | #titulo, #modalEditarGasto, #crear_fecha_pago, #pagar_nueva_fecha, #modalCrearGasto, #modalDetalleGasto, #modalPagarGasto |
| MostrarImpuestos.js | initMostrarImpuestos | #titulo |
| MostrarMedidas.js | initMostrarMedidas | #titulo, #modalCrearMedida, #modalEditarMedida |
| MostrarMetodoPago.js | initMostrarMetodosPagos | #titulo |
| MostrarMetodoPagoCuenta.js | initMostrarMetodosPagosCuenta | #ModalCrearMetodoPagoCuenta, #ModalEditarMetodoPagoCuenta |
| MostrarPedidosWeb.js | initPedidosWeb | #tablaPedidosWeb, #titulo, #modalDetallePedidoWeb, #modalConfirmarAccionPedidoWeb, #fechaEntregaPedidoWeb, #resumenPedidosTotal, #resumenPedidosSolicitados, #resumenPedidosAceptados, #resumenPedidosEnCamino, #resumenPedidosEntregados, #resumenPedidosCancelados, #estadoVacioPedidos |
| MostrarProducto.js | initMostrarProductos | #titulo, #modalDistribuirAjusteVariacion, #modalEditarProducto, #modalDetalleProducto |
| MostrarProductoVariacion.js | initMostrarProductoVariaciones | #titulo, #formCrearProductoVariacion, #modalCrearProductoVariacion, #listaColoresEditarVariacion, #modalEditarProductoVariacion |
| MostrarProductoVariacionDetalle.js | initMostrarProductoVariacionDetalle | #titulo, #recargarProductoVariacionDetalle, #agregar_imagenes_variacion, #reemplazar_imagen_variacion, #modalConfirmarAccionVariacion |
| MostrarPromociones.js | initPromociones | #tablaPromociones, #titulo, #modalPromocion, #modalImagenPromocion, #imagenPromocionGrande, #tituloImagenPromocion, #formPromocion, #tituloModalPromocion, #idPromocion, #promocionProducto, #promocionProductos, #promocionFechaInicio |
| MostrarProveedor.js | initMostrarProveedores | #titulo |
| MostrarRoles.js | initMostrarRoles | #titulo |
| MostrarTallas.js | initMostrarTallas | #titulo, #modalConfirmarEstadoTalla, #modalConfirmarEstadoTipoTalla, #modalTiposTalla |
| MostrarTipoGasto.js | initTipoGasto | #titulo |
| MostrarTiposMedidas.js | initMostrarTiposMedidas | #titulo, #modalCrearTipoMedida |
| MostrarUbicaciones.js | initMostrarUbicaciones | #titulo, #modalCrearUbicacion, #modalEditarUbicacion, #modalConfirmarEstadoUbicacion |
| MostrarUsuarios.js | initMostrarUsuarios | #titulo |
| MostrarVentas.js | initMostrarVentas | #titulo, #modalDetalleVenta |
| Movimientos_Caja.js | initMovimientoCajas | #titulo |
| Movimientos_Cuentas.js | initMovimientoCuenta | #titulo |
| Movimientos_Gastos.js | initMovimientoGasto | #titulo |
| Movimientos_Inventario.js | initMovimientoInventario | #titulo |
| PermisosRoles.js | initPermisos | #titulo, #selectRol, #buscarPermiso, #contenedorPermisos, #estadoSinRol |
| RealizarCompras.js | initCompras | #titulo, #formCrearProducto |
| Reportes.js | initReportes | #Reportes |
| Respaldo.js | initRespaldo | #titulo, #modalAvisoRespaldo, #archivoSql |
