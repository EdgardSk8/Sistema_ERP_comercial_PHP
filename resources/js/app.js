/*Turbo.session.drive = true

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


/*
|--------------------------------------------------------------------------
| REGISTRO DE MODULOS
|--------------------------------------------------------------------------
*/

const modulos = [
    ['#Chart_1', () => import('./Dashboard')],
    ['#btnFacturar', () => import('./Facturacion')],
    ['#tablaVentas', () => import('./MostrarVentas')],
    ['#tablaClientes', () => import('./MostrarCliente')],
    ['#tabla_carrito', () => import('./RealizarCompras')],
    ['#tablaCompras', () => import('./MostrarCompras')],
    ['#tablaProveedores', () => import('./MostrarProveedor')],
    ['#tablaCajas', () => import('./MostrarCajas')],
    ['#tablaMovimientosCaja', () => import('./Movimientos_Caja')],
    ['#tablaCuentas', () => import('./MostrarCuentas')],
    ['#tablaMovimientosCuenta', () => import('./Movimientos_Cuentas')],
    ['#tablaCajaCuenta', () => import('./MostrarCajaTransferencia')],
    ['#tablaGastos', () => import('./MostrarGastos')],
    ['#tablaTipoGasto', () => import('./MostrarTipoGasto')],
    ['#tablaMovimientosGastos', () => import('./Movimientos_Gastos')],
    ['#TablaMostrarProductos', () => import('./MostrarProducto')],
    ['#tablaCategorias', () => import('./MostrarCategoria')],
    ['#tablaKardex', () => import('./Movimientos_Inventario')],
    ['#tablaUsuarios', () => import('./MostrarUsuarios')],
    ['#tablaRoles', () => import('./MostrarRoles')],
    ['#selectRol', () => import('./PermisosRoles')],
    ['#Reportes', () => import('./Reportes')],
    ['#tablaImpuestos', () => import('./MostrarImpuestos')],
    ['#tablaMetodosPago', () => import('./MostrarMetodoPago')],
    ['#tablaMetodoPagoCuenta', () => import('./MostrarMetodoPagoCuenta')],
    ['#nombre_empresa', () => import('./Credenciales')],
    ['#btnExportarSistema', () => import('./Respaldo')],
    ['#tablaTiposMedidas', () => import('./MostrarTiposMedidas')],
    ['#tablaMedidas', () => import('./MostrarMedidas')],
    ['#tablaTallas', () => import('./MostrarTallas')],
    ['#tablaProductoVariaciones', () => import('./MostrarProductoVariacion')],
    ['#tablaProductoVariacionDetalle', () => import('./MostrarProductoVariacionDetalle')],
    ['#tablaUbicaciones', () => import('./MostrarUbicaciones')],
    ['#tablaCuentasPorCobrar', () => import('./CuentasPorCobrar')],
    ['#manualNav', () => import('./Manual')]



];

/*
|--------------------------------------------------------------------------
| BOOTSTRAP GENERAL
|--------------------------------------------------------------------------
*/

let generacionModulos = 0;
const modulosInicializados = new WeakMap();

function iniciarModulos(scope = document) {
    modulos.forEach(([selector, cargarModulo]) => {
        const elemento = scope.querySelector(selector);
        if (!elemento || modulosInicializados.get(elemento) === generacionModulos) return;

        const generacion = generacionModulos;
        modulosInicializados.set(elemento, generacion);
        cargarModulo().then(({ default: inicializar }) => {
            if (elemento.isConnected && generacion === generacionModulos) inicializar();
        }).catch(error => {
            modulosInicializados.delete(elemento);
            console.error(`No se pudo cargar el módulo de ${selector}`, error);
        });
    });
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
    generacionModulos++;
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
    vista_ubicaciones: '/ubicaciones',
    vista_roles: '/roles',
    vista_permisos: '/permisos',
    vista_categorias: '/categorias',
    vista_clientes: '/clientes',

    vista_crear_compras: '/compras/crear',
    vista_compras: '/compras',

    vista_ventas: '/ventas',
    vista_cuentas_por_cobrar: '/cuentas-por-cobrar',

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

    vista_tipos_medidas: '/tipos-medidas',
    vista_medidas: '/medidas',
    vista_tallas: '/tallas',
    vista_producto_variaciones: '/producto-variaciones',
    vista_producto_variaciones_detalle: '/producto-variaciones-detalles'
};

function cargarInicial(primero) {

    if (!primero) { console.warn("No hay permiso inicial"); return; }
    const url = rutas[primero];
    if (!url) {console.warn("No hay ruta para:", primero); return; }

    document.getElementById('contenido-dinamico').setAttribute('src', url);
    // document.getElementById('contenido-dinamico').setAttribute('src', '/facturacion');
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
