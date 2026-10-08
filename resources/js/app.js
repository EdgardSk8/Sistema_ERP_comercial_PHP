/*Turbo.session.drive = true

import initDashboard from './Dashboard'
import initFacturacion from './Facturacion'
import initMostrarVentas from './MostrarVentas'
import initMostrarCliente from './MostrarCliente'
import initCrearCompras from './RealizarCompras'
import initMostrarCompras from './MostrarCompras'
import initMostrarProveedores from './MostrarProveedor'
import initMostrarCajas from './MostrarCajas'
import initMovimientoCajas from './Movimientos_Caja'
import initCuentas from './MostrarCuentas' 
import initMovimientoCuenta from './Movimientos_Cuentas' 
import initCajaTransferencia from './MostrarCajaTransferencia'
import initMostrarGastos from './MostrarGastos'
import initMostrarTipoGastos from './MostrarTipoGasto'
import initMovimientoGasto from './MostrarMovimientosGastos' 
import initMostrarProductos from './MostrarProducto' 
import initMostrarCategorias from './MostrarCategoria'
import initMovimientoInventario from './MovimientosInventario'
import initMostrarUsuarios from './MostrarUsuarios'
import initMostrarRoles from './MostrarRoles'
import initPermisos from './PermisosRoles'
import initReportes from './Reportes'
import initMostrarImpuestos from './MostrarImpuestos'
import initMostrarMetodosPagos from './MostrarMetodoPago'
import initCredenciales from './Credenciales'
import initRespaldo from './Respaldo'

function iniciarDashboard() { if (!document.getElementById('chartVentas')) return; initDashboard() }
function InicializarFacturacion() { if (!document.getElementById('btnFacturar')) return; initFacturacion() }
function InicializarVentas() { if (!document.querySelector('#tablaVentas')) return; initMostrarVentas() }
function InicializarClientes() { if (!document.querySelector('#tablaClientes')) return; initMostrarCliente() }
function InicializarCompras() { if (!document.querySelector('#tabla_carrito')) return; initCrearCompras() }
function InicializarMostrarCompras() { if (!document.querySelector('#tablaCompras')) return; initMostrarCompras() }
function InicializarProveedores() { if (!document.querySelector('#tablaProveedores')) return; initMostrarProveedores() }
function InicializarMostrarCajas() { if (!document.querySelector('#tablaCajas')) return; initMostrarCajas() }
function InicializarMovimientosCajas() { if (!document.querySelector('#tablaMovimientosCaja')) return; initMovimientoCajas() }
function InicializarCuentas() { if (!document.querySelector('#tablaCuentas')) return; initCuentas() }
function InicializarMovimientosCuentas() { if (!document.querySelector('#tablaMovimientosCuenta')) return; initMovimientoCuenta() }
function InicializarCajaTransferencia() { if (!document.querySelector('#tablaCajaCuenta')) return; initCajaTransferencia() }
function InicializarMostrarGastos() { if (!document.querySelector('#tablaGastos')) return; initMostrarGastos() }
function InicializarMostrarTipoGastos() { if (!document.querySelector('#tablaTipoGasto')) return; initMostrarTipoGastos() }
function InicializarMovimientoGasto() { if (!document.querySelector('#tablaMovimientosGastos')) return; initMovimientoGasto() }
function InicializarMostrarProductos() { if (!document.querySelector('#TablaMostrarProductos')) return; initMostrarProductos() }
function InicializarMostrarCategorias() { if (!document.querySelector('#tablaCategorias')) return; initMostrarCategorias() }
function InicializarMovimientoInventario() { if (!document.querySelector('#tablaKardex')) return; initMovimientoInventario() }
function InicializarMostrarUsuarios() { if (!document.querySelector('#tablaUsuarios')) return; initMostrarUsuarios() }
function InicializarMostrarRoles() { if (!document.querySelector('#tablaRoles')) return; initMostrarRoles() }
function InicializarPermisos() { if (!document.querySelector('#selectRol')) return; initPermisos() }
function InicializarReportes() { if (!document.querySelector('#Reportes')) return; initReportes() }
function InicializarImpuestos() { if (!document.querySelector('#tablaImpuestos')) return; initMostrarImpuestos() }
function InicializarMetodoPago() { if (!document.querySelector('#tablaMetodosPago')) return; initMostrarMetodosPagos() }
function InicializarCredenciales() { if (!document.querySelector('#nombre_empresa')) return; initCredenciales() }
function InicializarRespaldo() { if (!document.querySelector('#btnExportarSistema')) return; initRespaldo() }

document.addEventListener('turbo:load', () => {
    iniciarDashboard();
    InicializarFacturacion();
    InicializarVentas();
    InicializarClientes();
    InicializarCompras();
    InicializarMostrarCompras();
    InicializarProveedores();
    InicializarMostrarCajas();
    InicializarMovimientosCajas();
    InicializarCuentas();
    InicializarMovimientosCuentas();
    InicializarCajaTransferencia();
    InicializarMostrarGastos();
    InicializarMostrarTipoGastos();
    InicializarMovimientoGasto();
    InicializarMostrarProductos();
    InicializarMostrarCategorias();
    InicializarMovimientoInventario();
    InicializarMostrarUsuarios();
    InicializarMostrarRoles();
    InicializarPermisos();
    InicializarReportes();
    InicializarImpuestos();
    InicializarMetodoPago();
    InicializarCredenciales();
    InicializarRespaldo();
})


document.addEventListener("turbo:frame-load", (event) => {

    if (event.target.id !== "contenido-dinamico") return;
    const view = event.target;

    if (view.querySelector('#chartVentas')) { iniciarDashboard() }
    if (view.querySelector('#btnFacturar')) { InicializarFacturacion() }
    InicializarVentas();
    InicializarClientes();
    InicializarCompras();
    InicializarMostrarCompras();
    InicializarProveedores();
    InicializarMostrarCajas();
    InicializarMovimientosCajas();
    InicializarCuentas();
    InicializarMovimientosCuentas();
    InicializarCajaTransferencia();
    InicializarMostrarGastos();
    InicializarMostrarTipoGastos();
    InicializarMovimientoGasto();
    InicializarMostrarProductos();
    InicializarMostrarCategorias();
    InicializarMovimientoInventario();
    InicializarMostrarUsuarios();
    InicializarMostrarRoles();
    InicializarPermisos();
    InicializarReportes();
    InicializarImpuestos();
    InicializarMetodoPago();
    InicializarCredenciales();
    InicializarRespaldo();

});
*/


Turbo.session.drive = true

/* DASHBOARD */
import initDashboard from './Dashboard'

/* FACTURACION */
import initFacturacion from './Facturacion'

/* VENTAS */
import initMostrarVentas from './MostrarVentas'

/* CLIENTES */
import initMostrarCliente from './MostrarCliente'

/* COMPRAS */
import initCrearCompras from './RealizarCompras'
import initMostrarCompras from './MostrarCompras'

/* PROVEEDORES */
import initMostrarProveedores from './MostrarProveedor'

/* CAJAS */
import initMostrarCajas from './MostrarCajas'
import initMovimientoCajas from './Movimientos_Caja'

/* CUENTAS */
import initCuentas from './MostrarCuentas'
import initMovimientoCuenta from './Movimientos_Cuentas'
import initCajaTransferencia from './MostrarCajaTransferencia'

/* GASTOS */
import initMostrarGastos from './MostrarGastos'
import initMostrarTipoGastos from './MostrarTipoGasto'
import initMovimientoGasto from './Movimientos_Gastos'

/* INVENTARIO */
import initMostrarProductos from './MostrarProducto'
import initMostrarCategorias from './MostrarCategoria'
import initMovimientoInventario from './Movimientos_Inventario'

/* USUARIOS */
import initMostrarUsuarios from './MostrarUsuarios'
import initMostrarRoles from './MostrarRoles'
import initPermisos from './PermisosRoles'

/* REPORTES */
import initReportes from './Reportes'

/* CONFIGURACION */
import initMostrarImpuestos from './MostrarImpuestos'
import initMostrarMetodosPagos from './MostrarMetodoPago'
import initMostrarMetodosPagosCuenta from './MostrarMetodoPagoCuenta'
import initCredenciales from './Credenciales'
import initRespaldo from './Respaldo'

import initMostrarTiposMedidas from './MostrarTiposMedidas'
import initMostrarMedidas from './MostrarMedidas'
import initMostrarProductoVariaciones from './MostrarProductoVariacion'
import initMostrarProductoVariacionDetalle from './MostrarProductoVariacionDetalle'

/*
|--------------------------------------------------------------------------
| REGISTRO DE MODULOS
|--------------------------------------------------------------------------
*/

const modulos = [
    ['#Chart_1', initDashboard],
    ['#btnFacturar', initFacturacion],
    ['#tablaVentas', initMostrarVentas],
    ['#tablaClientes', initMostrarCliente],
    ['#tabla_carrito', initCrearCompras],
    ['#tablaCompras', initMostrarCompras],
    ['#tablaProveedores', initMostrarProveedores],
    ['#tablaCajas', initMostrarCajas],
    ['#tablaMovimientosCaja', initMovimientoCajas],
    ['#tablaCuentas', initCuentas],
    ['#tablaMovimientosCuenta', initMovimientoCuenta],
    ['#tablaCajaCuenta', initCajaTransferencia],
    ['#tablaGastos', initMostrarGastos],
    ['#tablaTipoGasto', initMostrarTipoGastos],
    ['#tablaMovimientosGastos', initMovimientoGasto],
    ['#TablaMostrarProductos', initMostrarProductos],
    ['#tablaCategorias', initMostrarCategorias],
    ['#tablaKardex', initMovimientoInventario],
    ['#tablaUsuarios', initMostrarUsuarios],
    ['#tablaRoles', initMostrarRoles],
    ['#selectRol', initPermisos],
    ['#Reportes', initReportes],
    ['#tablaImpuestos', initMostrarImpuestos],
    ['#tablaMetodosPago', initMostrarMetodosPagos],
    ['#tablaMetodoPagoCuenta', initMostrarMetodosPagosCuenta],
    ['#nombre_empresa', initCredenciales],
    ['#btnExportarSistema', initRespaldo],
    ['#tablaTiposMedidas', initMostrarTiposMedidas],
    ['#tablaMedidas', initMostrarMedidas],

    ['#tablaProductoVariaciones', initMostrarProductoVariaciones],
    ['#tablaProductoVariacionDetalle', initMostrarProductoVariacionDetalle]



];

/*
|--------------------------------------------------------------------------
| BOOTSTRAP GENERAL
|--------------------------------------------------------------------------
*/

function iniciarModulos(scope = document) {
    modulos.forEach(([selector, init]) => { if (scope.querySelector(selector)) { init(); } });
}

/*
|--------------------------------------------------------------------------
| TURBO LOAD
|--------------------------------------------------------------------------
|
| Primera carga de página
|
*/

document.addEventListener('turbo:load', () => { iniciarModulos(); })

/*
|--------------------------------------------------------------------------
| TURBO FRAME LOAD
|--------------------------------------------------------------------------
|
| Carga parcial dentro de frames
|
*/

document.addEventListener('turbo:frame-load', (event) => {
    if (event.target.id !== 'contenido-dinamico') return
    iniciarModulos(event.target)
})

/*
|--------------------------------------------------------------------------
| LIMPIEZA ANTES DEL CACHE DE TURBO
|--------------------------------------------------------------------------
|
| Aquí destruyes DataTables, Select2, etc.
|
*/

document.addEventListener('turbo:before-cache', () => {
    $('.dataTable').each(function () { if ($.fn.DataTable.isDataTable(this)) {  $(this).DataTable().destroy();} })
})

let PERMISOS = [];
function guardarPermisos(permisos) {
    PERMISOS = permisos.map(p => p.nombre_permiso);
    //console.log("Permisos cargados:", PERMISOS);
}

const rutas = {
    vista_dashboard: '/dashboard',
    vista_usuarios: '/usuarios',
    vista_proveedores: '/proveedores',
    vista_productos: '/productos',
    vista_roles: '/roles',
    vista_permisos: '/permisos',
    vista_categorias: '/categorias',
    vista_clientes: '/clientes',

    vista_crear_compras: '/compras/crear',
    vista_compras: '/compras',

    vista_ventas: '/ventas',

    vista_impuestos: '/impuestos',

    vista_cajas: '/cajas',
    vista_movimientos_cajas: '/cajas/movimientos',

    vista_movimientos_inventario: '/inventario/movimientos',

    vista_gastos: '/gastos',
    vista_tipos_gasto: '/tipos-gasto',
    vista_movimientos_gastos: '/gastos/movimientos',

    vista_metodos_pago: '/metodos-pago',
    vista_metodos_pago_cuenta: '/metodos-pago-cuenta',

    vista_facturacion: '/facturacion',

    vista_credenciales: '/credenciales',

    vista_transferenciacajacuenta: '/transferencia',

    vista_cuentas: '/cuentas',
    vista_movimientos_cuentas: '/cuentas/movimientos',

    vista_respaldo: '/respaldo',
    vista_reportes: '/reportes',

    vista_producto_variacion: '/producto-variaciones'




};

function cargarInicial(primero) {

    if (!primero) { console.warn("No hay permiso inicial"); return; }
    const url = rutas[primero];
    if (!url) {console.warn("No hay ruta para:", primero); return; }

    // document.getElementById('contenido-dinamico').setAttribute('src', url);
    document.getElementById('contenido-dinamico').setAttribute('src', '/reportes');
}

fetch('/cargar-permisos').then(r => r.json())
    .then(data => {

        if (!data.status) return;

        const permisos = data.permisos;
        const primero = data.primer;

        guardarPermisos(permisos);
        cargarInicial(primero);
    })
    .catch(err => {
        console.error("Error cargando permisos:", err);
    });
