<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('/principal/principal');
});

/*  ╔════════════ Insercion de controladores ════════════╗ 
    ╚════════════════════════════════════════════════════╝ */

use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\RolController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\ImpuestoController;
use App\Http\Controllers\MetodoPagoController;
use App\Http\Controllers\TipoGastoController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\ProveedorController;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\CredencialesController;
use App\Http\Controllers\FacturacionController;
use App\Http\Controllers\CuentaPorCobrarController;
use App\Http\Controllers\MovimientoInventarioController;
use App\Http\Controllers\VentaController;
use App\Http\Controllers\CompraController;
use App\Http\Controllers\MovimientoCajaController;
use App\Http\Controllers\DetalleVentaController;
use App\Http\Controllers\CuentaController;
use App\Http\Controllers\TransferenciaCajaCuentaController;
use App\Http\Controllers\MovimientoCuentaController;
use App\Http\Controllers\GastoController;
use App\Http\Controllers\MovimientoGastoController;
use App\Http\Controllers\DetalleCompraController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RolPermisoController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\CargaVistaController;
use App\Http\Controllers\MetodoPagoCuentaController;
use App\Http\Controllers\TiposMedidasController;
use App\Http\Controllers\MedidasController;
use App\Http\Controllers\TallaController;
use App\Http\Controllers\ProductoVariacionController;
use App\Http\Controllers\VariacionImagenController;
use App\Http\Controllers\VariacionTallaController;
use App\Http\Controllers\UbicacionController;

/*  ╔════════════ LOGIN ═════════════╗ 
    ╚════════════════════════════════╝ */

Route::get('/login', [LoginController::class, 'mostrarLogin'])->name('login');

Route::post('/login', [LoginController::class, 'login'])->name('login');
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

Route::get('/me', [LoginController::class, 'me']);

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/*  ╔════════════ Cargar de Vistas Dinamicas ════════════╗ 
    ╚════════════════════════════════════════════════════╝ */
// Route::get('/', [CargaVistaController::class, 'index'])->name('inicio');
Route::get('/cargar-permisos', [CargaVistaController::class, 'cargarpermisosUsuario']);

Route::view('/dashboard', 'dashboard.Dashboard') ->middleware('permiso:vista_dashboard')->name('dashboard');
Route::view('/usuarios', 'usuarios.Usuario')->middleware('permiso:vista_usuarios')->name('usuarios');
Route::view('/proveedores', 'proveedores.Proveedores')->middleware('permiso:vista_proveedores')->name('proveedores');
Route::view('/productos', 'productos.Productos')->middleware('permiso:vista_productos')->name('productos');
Route::view('/ubicaciones', 'ubicaciones.Ubicaciones')->middleware('permiso:vista_ubicaciones')->name('ubicaciones');
Route::view('/roles', 'roles.Roles')->middleware('permiso:vista_roles')->name('roles');
Route::view('/permisos', 'permisos.Permisos')->middleware('permiso:vista_permisos')->name('permisos');
Route::view('/categorias', 'categorias.Categorias')->middleware('permiso:vista_categorias')->name('categorias');
Route::view('/clientes', 'clientes.Clientes')->middleware('permiso:vista_clientes')->name('clientes');
Route::view('/compras/crear', 'compras.CrearCompra')->middleware('permiso:vista_crear_compras')->name('crear.compras');
Route::view('/compras', 'compras.Compras')->middleware('permiso:vista_compras')->name('compras');
Route::view('/ventas', 'ventas.Ventas')->middleware('permiso:vista_ventas')->name('ventas');
Route::view('/impuestos', 'impuestos.Impuestos')->middleware('permiso:vista_impuestos')->name('impuestos');
Route::view('/cajas', 'cajas.Cajas')->middleware('permiso:vista_cajas')->name('cajas');
Route::view('/cajas/movimientos', 'movimientos_caja.Movimientos_Caja')->middleware('permiso:vista_movimientos_cajas')->name('movimientos.cajas');
Route::view('/inventario/movimientos', 'inventario.MovimientosInventario')->middleware('permiso:vista_movimientos_inventario')->name('movimientos.inventario');
Route::view('/gastos', 'gastos.Gastos')->middleware('permiso:vista_gastos')->name('gastos');
Route::view('/tipos-gasto', 'tipos_gasto.TiposGasto')->middleware('permiso:vista_tipos_gasto')->name('tipos.gasto');
Route::view('/metodos-pago', 'metodos_pago.MetodosPago')->middleware('permiso:vista_metodos_pago')->name('metodos.pago');
Route::view('/metodos-pago-cuenta', 'metodos_pago_cuenta.MetodosPagoCuenta')->middleware('permiso:vista_metodos_pago_cuenta')->name('metodos.pago.cuenta');
Route::view('/facturacion', 'facturacion.Facturacion')->middleware('permiso:vista_facturacion')->name('facturacion');
Route::view('/credenciales', 'credenciales.Credenciales')->middleware('permiso:vista_credenciales')->name('credenciales');
Route::view('/transferencia', 'transferenciacajacuenta.Transferencia')->middleware('permiso:vista_transferenciacajacuenta')->name('transferencia');
Route::view('/cuentas', 'cuentas.Cuentas')->middleware('permiso:vista_cuentas')->name('cuentas');
Route::view('/cuentas/movimientos', 'movimientos_cuenta.Movimientos_Cuentas')->middleware('permiso:vista_movimientos_cuentas')->name('movimientos.cuentas');
Route::view('/gastos/movimientos', 'movimientos_gasto.Movimientos_Gastos')->middleware('permiso:vista_movimientos_gastos')->name('movimientos.gastos');
Route::view('/respaldo', 'respaldo.Respaldo')->middleware('permiso:vista_respaldo')->name('respaldo');
Route::view('/reportes', 'reportes.Reportes')->middleware('permiso:vista_reportes')->name('reportes');
Route::view('/tipos-medidas', 'tipos_medidas.TiposMedidas')->middleware('permiso:vista_tipos_medidas')->name('tipos.medidas');
Route::view('/medidas', 'medidas.Medidas')->middleware('permiso:vista_medidas')->name('medidas');
Route::view('/tallas', 'tallas.Tallas')->middleware('permiso:vista_tallas')->name('tallas');

Route::view('/producto-variaciones', 'productosvariacion.ProductoVariaciones')->middleware('permiso:vista_producto_variaciones')->name('producto-variaciones');
Route::view('/producto-variaciones-detalles', 'productosvariaciondetalles.ProductoVariacionDetalle')->middleware('permiso:vista_producto_variaciones_detalle')->name('producto-variaciones-detalles');



Route::view('/error', 'errors.sin_permiso')->name('error');
/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
    
/*  ╔═══════════ Endpoint DASHBOARD ═════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/dashboard/ventas', [DashboardController::class, 'Ventas'])->middleware('permiso:mostrar_dashboard_ventas');
Route::get('/dashboard/movimiento-inventario', [DashboardController::class, 'movimientoinventario'])->middleware('permiso:mostrar_dashboard_movimiento_inventario');
Route::get('/dashboard/ganancias', [DashboardController::class, 'Ganancias'])->middleware('permiso:mostrar_dashboard_ganancias');
Route::get('/dashboard/compras', [DashboardController::class, 'Compras'])->middleware('permiso:mostrar_dashboard_compras');
Route::get('/dashboard/cajas', [DashboardController::class, 'Cajas'])->middleware('permiso:mostrar_dashboard_cajas');
Route::get('/dashboard/tallas', [DashboardController::class, 'Tallas'])->middleware('permiso:mostrar_dashboard_tallas');

/*  ╔════════════ Endpoint Empresa ══════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/credenciales/mostrar', [CredencialesController::class, 'MostrarCredenciales'])->middleware('permiso:mostrar_credenciales');
Route::get('/credenciales/{id}/editar', [CredencialesController::class, 'EditarCredencial'])->middleware('permiso:editar_credenciales');
Route::put('/credenciales/{id}/actualizar', [CredencialesController::class, 'ActualizarCredenciales'])->middleware('permiso:actualizar_credenciales');
Route::post('/credenciales/{id}/logo', [CredencialesController::class, 'GuardarLogo'])->middleware('permiso:actualizar_credenciales');
Route::put('/credenciales/{id}/logo', [CredencialesController::class, 'ActualizarLogo'])->middleware('permiso:actualizar_credenciales');
Route::delete('/credenciales/{id}/logo', [CredencialesController::class, 'EliminarLogo'])->middleware('permiso:actualizar_credenciales');

/*  ╔════════════ Endpoint Usuario ══════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/usuarios/mostrar', [UsuarioController::class, 'MostrarUsuarios']) ->middleware('permiso:mostrar_usuarios');
Route::post('/usuarios/crear', [UsuarioController::class, 'CrearUsuario']) ->middleware('permiso:crear_usuarios');
Route::get('/usuarios/{id}/editar', [UsuarioController::class, 'EditarUsuario']) ->middleware('permiso:editar_usuarios');
Route::put('/usuarios/{id}/actualizar', [UsuarioController::class, 'ActualizarUsuario']) ->middleware('permiso:actualizar_usuarios');
Route::post('/usuarios/cambiar-estado/{id}', [UsuarioController::class, 'cambiarEstadoUsuario']) ->middleware('permiso:cambiar_estado_usuarios');

Route::get('/roles-usuario/mostrar', [UsuarioController::class, 'MostrarRolesUsuario']); // No necesario

/*  ╔═══════════ Endpoint Categorias ════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/categorias/mostrar', [CategoriaController::class, 'MostrarCategorias'])->middleware('permiso:mostrar_categorias');
Route::post('/categorias/crear', [CategoriaController::class, 'CrearCategoria'])->middleware('permiso:crear_categorias');
Route::get('/categorias/{id}/editar', [CategoriaController::class, 'EditarCategoria'])->middleware('permiso:editar_categorias');
Route::put('/categorias/{id}/actualizar', [CategoriaController::class, 'ActualizarCategoria'])->middleware('permiso:actualizar_categorias');
Route::post('/categorias/cambiar-estado/{id}', [CategoriaController::class, 'CambiarEstadoCategoria'])->middleware('permiso:cambiar_estado_categorias');

/*  ╔════════════ Endpoint Impuestos ════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/impuestos/mostrar', [ImpuestoController::class, 'MostrarImpuestos'])->middleware('permiso:mostrar_impuestos');
Route::post('/impuestos/crear', [ImpuestoController::class, 'CrearImpuesto'])->middleware('permiso:crear_impuestos');
Route::get('/impuestos/{id}/editar', [ImpuestoController::class, 'EditarImpuesto'])->middleware('permiso:editar_impuestos');
Route::put('/impuestos/{id}/actualizar', [ImpuestoController::class, 'ActualizarImpuesto'])->middleware('permiso:actualizar_impuestos');
Route::post('/impuestos/cambiar-estado/{id}', [ImpuestoController::class, 'CambiarEstadoImpuesto'])->middleware('permiso:cambiar_estado_impuestos');

/*  ╔═══════════ Endpoint Metodo Pago ═══════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/metodos-pago/mostrar', [MetodoPagoController::class, 'MostrarMetodosPago'])->middleware('permiso:mostrar_metodos_pago');
Route::post('/metodos-pago/crear', [MetodoPagoController::class, 'CrearMetodoPago'])->middleware('permiso:crear_metodos_pago');
Route::get('/metodos-pago/{id}/editar', [MetodoPagoController::class, 'EditarMetodoPago'])->middleware('permiso:editar_metodos_pago');
Route::put('/metodos-pago/{id}/actualizar', [MetodoPagoController::class, 'ActualizarMetodoPago'])->middleware('permiso:actualizar_metodos_pago');
Route::post('/metodos-pago/cambiar-estado/{id}', [MetodoPagoController::class, 'CambiarEstadoMetodoPago'])->middleware('permiso:cambiar_estado_metodos_pago');

/*  ╔══════ Endpoint Metodo Pago - Cuentas ══════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/metodos-pago-cuenta/mostrar', [MetodoPagoCuentaController::class, 'MostrarMetodoPagoCuenta'])->middleware('permiso:mostrar_metodos_pago_cuenta');
Route::post('/metodos-pago-cuenta/crear', [MetodoPagoCuentaController::class, 'CrearMetodoPagoCuenta'])->middleware('permiso:crear_metodos_pago_cuenta');
Route::get('/metodos-pago-cuenta/{id}/editar', [MetodoPagoCuentaController::class, 'EditarMetodoPagoCuenta'])->middleware('permiso:editar_metodos_pago_cuenta');
Route::put('/metodos-pago-cuenta/{id}/actualizar', [MetodoPagoCuentaController::class, 'ActualizarMetodoPagoCuenta'])->middleware('permiso:actualizar_metodos_pago_cuenta');
Route::post('/metodos-pago-cuenta/cambiar-estado/{id}', [MetodoPagoCuentaController::class, 'CambiarEstadoMetodoPagoCuenta'])->middleware('permiso:cambiar_estado_metodos_pago_cuenta');
Route::get('/metodos-pago/{id}/cuentas', [MetodoPagoCuentaController::class, 'ObtenerCuentasPorMetodoPago']);

Route::get('/metodos-pago-cuenta/metodos-cuentas/mostrar', [MetodoPagoCuentaController::class, 'ObtenerDatosFormulario']);
Route::get('/metodos-pago-cuenta/cuentas-vinculadas/mostrar/{id}', [MetodoPagoCuentaController::class, 'ObtenerCuentasMetodoPago']);

/*  ╔══════════════ Endpoint Gastos ═════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/gastos/mostrar', [GastoController::class, 'MostrarGastos'])->middleware('permiso:mostrar_gastos');
Route::post('/gastos/crear', [GastoController::class, 'CrearGasto'])->middleware('permiso:crear_gastos');
Route::get('/gastos/editar/{id}', [GastoController::class, 'EditarGasto'])->middleware('permiso:editar_gastos');
Route::post('/gastos/actualizar/{id}', [GastoController::class, 'ActualizarGasto'])->middleware('permiso:actualizar_gastos');

Route::post('/gastos/pagar', [GastoController::class, 'PagarGasto'])->middleware('permiso:pagar_gastos');
Route::get('/gastos/detalle/{id}', [GastoController::class, 'DetalleGasto'])->middleware('permiso:mostrar_detalle_gastos');
Route::post('/gastos/movimiento/editar', [GastoController::class, 'EditarMovimientoGasto'])->middleware('permiso:editar_movimiento_gastos');

Route::get('/gastos-cuentas/mostrar', [GastoController::class, 'MostrarCuentasGastos']);
Route::get('/gastos-cajas/mostrar', [GastoController::class, 'MostrarCajasGastos']);


/*  ╔════════ Endpoint Movimiento Gasto ═════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/movimientos-gastos/mostrar', [MovimientoGastoController::class, 'MostrarMovimientosGastos'])->middleware('permiso:mostrar_movimientos_gastos');


/*  ╔══════════ Endpoint Tipo de Gasto ══════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/tipo-gasto/mostrar', [TipoGastoController::class, 'MostrarTipoGasto'])->middleware('permiso:mostrar_tipos_gasto');
Route::post('/tipo-gasto/crear', [TipoGastoController::class, 'CrearTipoGasto'])->middleware('permiso:crear_tipos_gasto');
Route::get('/tipo-gasto/{id}/editar', [TipoGastoController::class, 'EditarTipoGasto'])->middleware('permiso:editar_tipos_gasto');
Route::put('/tipo-gasto/{id}/actualizar', [TipoGastoController::class, 'ActualizarTipoGasto'])->middleware('permiso:actualizar_tipos_gasto');
Route::post('/tipo-gasto/cambiar-estado/{id}', [TipoGastoController::class, 'CambiarEstadoTipoGasto'])->middleware('permiso:cambiar_estado_tipos_gasto');

/*  ╔══════════════ Endpoint Cliente ══════════════╗ 
    ╚══════════════════════════════════════════════╝ */

Route::get('/clientes/mostrar', [ClienteController::class, 'MostrarClientes'])->middleware('permiso:mostrar_clientes');
Route::post('/clientes/crear', [ClienteController::class, 'CrearCliente'])->middleware('permiso:crear_clientes');
Route::get('/clientes/{id}/editar', [ClienteController::class, 'EditarCliente'])->middleware('permiso:editar_clientes');
Route::put('/clientes/{id}/actualizar', [ClienteController::class, 'ActualizarCliente'])->middleware('permiso:actualizar_clientes');
Route::post('/clientes/cambiar-estado/{id}', [ClienteController::class, 'CambiarEstadoCliente'])->middleware('permiso:cambiar_estado_clientes');

/*  ╔════════════ Endpoint Proveedores ════════════╗ 
    ╚══════════════════════════════════════════════╝ */

Route::get('/proveedores/mostrar', [ProveedorController::class, 'MostrarProveedores'])->middleware('permiso:mostrar_proveedores');
Route::post('/proveedores/crear', [ProveedorController::class, 'CrearProveedor'])->middleware('permiso:crear_proveedores');
Route::get('/proveedores/{id}/editar', [ProveedorController::class, 'EditarProveedor'])->middleware('permiso:editar_proveedores');
Route::put('/proveedores/{id}/actualizar', [ProveedorController::class, 'ActualizarProveedor'])->middleware('permiso:actualizar_proveedores');
Route::post('/proveedores/cambiar-estado/{id}', [ProveedorController::class, 'CambiarEstadoProveedor'])->middleware('permiso:cambiar_estado_proveedores');

/*  ╔══════════════ Endpoint Cajas ══════════════╗ 
    ╚════════════════════════════════════════════╝ */

/*Route::post('/cajas/abrir', [CajaController::class, 'AbrirCaja']);
Route::post('/cajas/cerrar', [CajaController::class, 'CerrarCaja']);*/

Route::get('/cajas/registro', [CajaController::class, 'RegistroCajas']) ->middleware('permiso:mostrar_cajas');

/*  ╔════════════ Endpoint Productos ════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/productos/mostrar', [ProductoController::class, 'MostrarProductos'])->middleware('permiso:mostrar_productos');
Route::post('/productos/crear', [ProductoController::class, 'CrearProducto'])->middleware('permiso:crear_productos');
Route::get('/productos/{id}/editar', [ProductoController::class, 'EditarProducto'])->middleware('permiso:editar_productos');
Route::put('/productos/{id}/actualizar', [ProductoController::class, 'ActualizarProducto'])->middleware('permiso:actualizar_productos');
Route::post('/productos/cambiar-estado/{id}', [ProductoController::class, 'CambiarEstadoProducto'])->middleware('permiso:cambiar_estado_productos');

Route::get('/productos/formulario', [ProductoController::class, 'ObtenerDatosFormularioProducto']); //revisar


/*  ╔══════════════ Endpoint Roles ══════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/roles/mostrar', [RolController::class, 'MostrarRoles'])->middleware('permiso:mostrar_roles');
Route::post('/roles/crear', [RolController::class, 'CrearRol'])->middleware('permiso:crear_roles');
Route::get('/roles/{id}/editar', [RolController::class, 'EditarRol'])->middleware('permiso:editar_roles');
Route::put('/roles/{id}/actualizar', [RolController::class, 'ActualizarRol'])->middleware('permiso:actualizar_roles');
Route::post('/roles/cambiar-estado/{id}', [RolController::class, 'CambiarEstadoRol'])->middleware('permiso:cambiar_estado_roles');

/*  ╔══════════════ Endpoint Ventas ═════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/ventas/mostrar', [VentaController::class, 'MostrarVentas'])->middleware('permiso:mostrar_ventas');
Route::post('/ventas/anular/{id}', [VentaController::class, 'AnularVenta'])->middleware('permiso:anular_ventas');
Route::get('/ventas/{id}/detalle', [VentaController::class, 'MostrarDetalleVenta'])->middleware('permiso:mostrar_detalle_ventas');

/*  ╔══════ Movimiento Inventario (Kardex) ══════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/movimiento-inventario/mostrar', [MovimientoInventarioController::class, 'MostrarMovimientosInventario'])->middleware('permiso:mostrar_movimiento_inventario');

/*  ╔═══════ Movimiento caja (Kardex) ═══════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/movimientos-caja/mostrar', [MovimientoCajaController::class, 'MostrarMovimientosCaja']) ->middleware('permiso:mostrar_movimiento_cajas');

/*  ╔═══════════ Cuentas (Kardex) ═══════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/cuenta/mostrar', [CuentaController::class, 'MostrarCuentas'])->middleware('permiso:mostrar_cuentas');
Route::post('/cuenta/crear', [CuentaController::class, 'CrearCuenta'])->middleware('permiso:crear_cuentas');
Route::get('/cuenta/{id}/editar', [CuentaController::class, 'EditarCuenta'])->middleware('permiso:editar_cuentas');
Route::put('/cuenta/{id}/actualizar', [CuentaController::class, 'ActualizarCuenta'])->middleware('permiso:actualizar_cuentas');
Route::post('/cuenta/cambiar-estado/{id}', [CuentaController::class, 'CambiarEstadoCuenta'])->middleware('permiso:cambiar_estado_cuentas');
Route::post('/cuenta/transferir', [CuentaController::class, 'TransferirEntreCuentas'])->middleware('permiso:transferir_cuentas');
Route::post('/cuenta/movimiento', [CuentaController::class, 'MovimientoCuenta']);// ->middleware('permiso:movimiento_cuentas');

Route::get('/cuenta/mostrarselector', [CuentaController::class, 'MostrarCuentasSelector']);

/*  ╔══════ Movimiento Cuentas (Kardex) ═════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/movimientos-cuenta/mostrar', [MovimientoCuentaController::class, 'MostrarMovimientosCuenta']) ->middleware('permiso:mostrar_movimiento_cuentas');

/*  ╔════════ Transferencias (Kardex) ═══════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/movimientos-caja-cuenta/mostrar', [TransferenciaCajaCuentaController::class, 'MostrarCajaTransferencia'])->middleware('permiso:mostrar_transferencias_caja_cuenta');
Route::post('/movimientos-caja-cuenta/transferir', [TransferenciaCajaCuentaController::class, 'TransferenciaCajaCuenta'])->middleware('permiso:transferir_caja_cuentas');
Route::get('/movimientos-caja-cuenta/detalle/{id}', [TransferenciaCajaCuentaController::class, 'MostrarDetalleCuenta'])->middleware('permiso:mostrar_detalle_transferencias_caja_cuenta');

/*  ╔════════════════ FACTURACION ═══════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/productos/pos', [FacturacionController::class, 'MostrarProductosPOS'])->middleware('permiso:usar_facturacion');
Route::post('/facturar/pos', [FacturacionController::class, 'FacturarProductosPOS'])->middleware('permiso:usar_facturacion');
Route::get('/cuentas-por-cobrar/mostrar', [CuentaPorCobrarController::class, 'Mostrar'])->middleware('permiso:mostrar_cuentas_por_cobrar');
Route::post('/cuentas-por-cobrar/{idVenta}/pagos', [CuentaPorCobrarController::class, 'RegistrarPago'])->middleware('permiso:registrar_pagos_venta');
Route::view('/cuentas-por-cobrar', 'cuentasporcobrar.CuentasPorCobrar')->middleware('permiso:vista_cuentas_por_cobrar')->name('cuentas-por-cobrar');

Route::post('/caja/abrir', [CajaController::class, 'AbrirCaja'])->middleware('permiso:abrir_caja');
Route::post('/caja/cerrar', [CajaController::class, 'CerrarCaja'])->middleware('permiso:cerrar_caja');
Route::get('/caja/verificar', [CajaController::class, 'VerificarCaja']); //->middleware('permiso:verificar_caja');
Route::get('/cajas/arqueo', [CajaController::class, 'MostrarArqueo'])->middleware('permiso:mostrar_cajas');
Route::put('/cajas/{id}/arqueo', [CajaController::class, 'GuardarArqueo'])->middleware('permiso:editar_arqueo_cajas');
Route::get('/cajas/arqueo/imprimir', [CajaController::class, 'ImprimirArqueo'])->middleware('permiso:mostrar_cajas');
Route::get('/cajas/arqueo/{id}/imprimir', [CajaController::class, 'ImprimirArqueoCaja'])->middleware('permiso:mostrar_cajas');

Route::post('/validar-stock-carrito', [FacturacionController::class, 'ValidarStockCarrito']);
Route::get('/tipo-cambio/pos', [FacturacionController::class, 'MostrarTipoCambio']);
Route::get('/clientes/pos', [FacturacionController::class, 'MostrarClientesPOS']);
Route::get('/metodo-pago/pos', [FacturacionController::class, 'MostrarMetodoPagoPOS']);
Route::get('/credenciales/pos', [FacturacionController::class, 'MostrarCredencialesPOS']);

/*  ╔═════════════ Endpoint Compras ═════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/compras/mostrar', [CompraController::class, 'MostrarCompras'])->middleware('permiso:mostrar_compras');
Route::post('/compra/crear', [CompraController::class, 'RegistrarCompra'])->middleware('permiso:crear_compras');
Route::post('/compras/anular/{id}', [CompraController::class, 'AnularCompra'])->middleware('permiso:anular_compras');

Route::get('/productos-compra/mostrar', [CompraController::class, 'MostrarProductosCompras']);

Route::get('/proveedores-compra/mostrar', [CompraController::class, 'MostrarProveedoresCompras']);
Route::get('/tipo-factura-compra/mostrar', [CompraController::class, 'MostrarTiposFacturaCompras']);
Route::get('/metodo-pago-compra/mostrar', [CompraController::class, 'MostrarMetodosPagoCompras']);
Route::get('/cuenta-compra/mostrar', [CompraController::class, 'MostrarCuentasCompras']);
Route::get('/caja-compra/mostrar', [CompraController::class, 'mostrarCajasAbiertas']);
Route::get('/medidas-compra/mostrar', [CompraController::class, 'MostrarMedidasCompras']);
Route::get('/compras/{id}/detalle', [CompraController::class, 'MostrarDetalleCompra'])->middleware('permiso:mostrar_detalle_compras');

/*  ╔════════════ Endpoint Permisos ═════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/roles/permisos', [RolPermisoController::class, 'obtenerRolesPermisos'])->middleware('permiso:mostrar_roles_permisos');
Route::post('/roles/permisos/asignar', [RolPermisoController::class, 'asignar'])->middleware('permiso:asignar_roles_permisos');

/*  ╔════════════ Endpoint Respaldo ═════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::post('/backup/exportar', [BackupController::class, 'exportar'])->middleware('permiso:exportar_respaldo');
Route::post('/backup/importar', [BackupController::class, 'importarSQL'])->middleware('permiso:importar_respaldo');

/*  ╔════════════ Endpoint Reportes ═════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/reportes/ventas', [ReporteController::class, 'ReporteVentas'])->middleware('permiso:mostrar_reportes');
Route::get('/reportes/inventario', [ReporteController::class, 'ReporteInventario'])->middleware('permiso:mostrar_reportes');
Route::get('/reportes/movimiento-inventario', [ReporteController::class, 'ReporteMovimientoInventario'])->middleware('permiso:mostrar_reportes');
Route::get('/reportes/clientes', [ReporteController::class, 'ReporteClientes'])->middleware('permiso:mostrar_reportes');
Route::get('/reportes/usuarios', [ReporteController::class, 'ReporteUsuarios'])->middleware('permiso:mostrar_reportes');
Route::get('/reportes/cajas', [ReporteController::class, 'ReporteCajas'])->middleware('permiso:mostrar_reportes');

/*  ╔════════ Endpoint Tipos de Medidas ═════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/tipos-medidas/mostrar', [TiposMedidasController::class, 'MostrarTiposMedidas'])->middleware('permiso:mostrar_tipos_medidas');
Route::post('/tipos-medidas/crear', [TiposMedidasController::class, 'CrearTipoMedida'])->middleware('permiso:crear_tipos_medidas');
Route::get('/tipos-medidas/editar/{id}', [TiposMedidasController::class, 'EditarTipoMedida']);//->middleware('permiso:editar_medidas');
Route::put('/tipos-medidas/actualizar/{id}', [TiposMedidasController::class, 'ActualizarTipoMedida'])->middleware('permiso:actualizar_tipos_medidas');
Route::put('/tipos-medidas/cambiar-estado/{id}', [TiposMedidasController::class, 'CambiarEstadoTipoMedida'])->middleware('permiso:cambiar_estado_tipos_medidas');

/*  ╔════════════ Endpoint de Medida ════════════╗ 
    ╚════════════════════════════════════════════╝ */

Route::get('/medidas/mostrar', [MedidasController::class, 'MostrarMedidas'])->middleware('permiso:mostrar_medidas');
Route::post('/medidas/crear', [MedidasController::class, 'CrearMedida'])->middleware('permiso:crear_medidas');
Route::get('/medidas/editar/{id}', [MedidasController::class, 'EditarMedida']);
Route::put('/medidas/actualizar/{id}', [MedidasController::class, 'ActualizarMedida'])->middleware('permiso:actualizar_medidas');
Route::put('/medidas/cambiar-estado/{id}', [MedidasController::class, 'CambiarEstadoMedida'])->middleware('permiso:cambiar_estado_medidas');
Route::get('/medidas/tipos-medidas/mostrar',[MedidasController::class, 'MostrarTiposMedidas']);

/*  ╔════════════ Endpoint de Ubicaciones ════════╗
    ╚══════════════════════════════════════════════╝ */

Route::get('/ubicaciones/mostrar', [UbicacionController::class, 'MostrarUbicaciones'])->middleware('permiso:mostrar_ubicaciones');
Route::post('/ubicaciones/crear', [UbicacionController::class, 'CrearUbicacion'])->middleware('permiso:crear_ubicaciones');
Route::get('/ubicaciones/editar/{id}', [UbicacionController::class, 'EditarUbicacion'])->middleware('permiso:editar_ubicaciones');
Route::put('/ubicaciones/actualizar/{id}', [UbicacionController::class, 'ActualizarUbicacion'])->middleware('permiso:actualizar_ubicaciones');
Route::post('/ubicaciones/cambiar-estado/{id}', [UbicacionController::class, 'CambiarEstadoUbicacion'])->middleware('permiso:cambiar_estado_ubicaciones');

/* ╔════════════ Endpoint de Talla ════════════╗
   ╚═══════════════════════════════════════════╝ */

Route::get('/tallas/mostrar', [TallaController::class, 'MostrarTalla'])
    ->middleware('permiso:mostrar_tallas')->name('tallas.mostrar');
Route::post('/tallas/crear', [TallaController::class, 'CrearTalla'])
    ->middleware('permiso:crear_tallas')->name('tallas.crear');
Route::get('/tallas/editar/{id}', [TallaController::class, 'EditarTalla'])
    ->middleware('permiso:editar_tallas')->name('tallas.editar');
Route::put('/tallas/actualizar/{id}', [TallaController::class, 'ActualizarTalla'])
    ->middleware('permiso:actualizar_tallas')->name('tallas.actualizar');
Route::put('/tallas/cambiar-estado/{id}', [TallaController::class, 'CambiarEstadoTalla'])
    ->middleware('permiso:cambiar_estado_tallas')->name('tallas.cambiar-estado');
Route::delete('/tallas/eliminar/{id}', [TallaController::class, 'EliminarTalla'])
    ->middleware('permiso:eliminar_tallas')->name('tallas.eliminar');

/* ╔════════ Endpoint de Producto Variación ════════╗
   ╚════════════════════════════════════════════════╝ */

Route::get('/producto-variaciones/mostrar', [ProductoVariacionController::class, 'MostrarProductoVariacion'])->middleware('permiso:mostrar_producto_variaciones');
Route::get('/producto-variaciones/mostrar-producto', [ProductoVariacionController::class, 'MostrarProductosSelect'])->middleware('permiso:mostrar_productos_select_variaciones');
Route::post('/producto-variaciones/crear', [ProductoVariacionController::class, 'CrearProductoVariacion'])->middleware('permiso:crear_producto_variaciones');
Route::get('/producto-variaciones/editar/{id}', [ProductoVariacionController::class, 'EditarProductoVariacion'])->middleware('permiso:editar_producto_variaciones');
Route::put('/producto-variaciones/actualizar/{id}', [ProductoVariacionController::class, 'ActualizarProductoVariacion'])->middleware('permiso:actualizar_producto_variaciones');
Route::put('/producto-variaciones/cambiar-estado/{id}', [ProductoVariacionController::class, 'CambiarEstadoProductoVariacion'])->middleware('permiso:cambiar_estado_producto_variaciones');
Route::delete('/producto-variaciones/eliminar/{id}', [ProductoVariacionController::class, 'EliminarProductoVariacion'])->middleware('permiso:eliminar_producto_variaciones');

/* ╔════════ Endpoint de Variación Imagen ════════╗
   ╚══════════════════════════════════════════════╝ */

Route::get('/variacion-imagenes/mostrar', [VariacionImagenController::class, 'MostrarVariacionImagen'])->middleware('permiso:mostrar_variacion_imagenes');
Route::post('/variacion-imagenes/crear', [VariacionImagenController::class, 'CrearVariacionImagen'])->middleware('permiso:crear_variacion_imagenes');
Route::get('/variacion-imagenes/editar/{id}', [VariacionImagenController::class, 'EditarVariacionImagen'])->middleware('permiso:editar_variacion_imagenes');
Route::put('/variacion-imagenes/actualizar/{id}', [VariacionImagenController::class, 'ActualizarVariacionImagen'])->middleware('permiso:actualizar_variacion_imagenes');
Route::put('/variacion-imagenes/cambiar-orden/{id}', [VariacionImagenController::class, 'CambiarOrdenVariacionImagen'])->middleware('permiso:cambiar_orden_variacion_imagenes');
Route::put('/variacion-imagenes/ordenar/{idVariacion}', [VariacionImagenController::class, 'OrdenarVariacionImagenes'])->middleware('permiso:cambiar_orden_variacion_imagenes');
Route::delete('/variacion-imagenes/eliminar/{id}', [VariacionImagenController::class, 'EliminarVariacionImagen'])->middleware('permiso:eliminar_variacion_imagenes');

/* ╔════════ Endpoint de Variación Talla ═════════╗
   ╚══════════════════════════════════════════════╝ */

Route::get('/variacion-tallas/mostrar', [VariacionTallaController::class, 'MostrarVariacionTalla'])->middleware('permiso:mostrar_variacion_tallas');
Route::post('/variacion-tallas/crear', [VariacionTallaController::class, 'CrearVariacionTalla'])->middleware('permiso:crear_variacion_tallas');
Route::get('/variacion-tallas/editar/{id}', [VariacionTallaController::class, 'EditarVariacionTalla'])->middleware('permiso:editar_variacion_tallas');
Route::put('/variacion-tallas/actualizar/{id}', [VariacionTallaController::class, 'ActualizarVariacionTalla'])->middleware('permiso:actualizar_variacion_tallas');
Route::delete('/variacion-tallas/eliminar/{id}', [VariacionTallaController::class, 'EliminarVariacionTalla'])->middleware('permiso:eliminar_variacion_tallas');








