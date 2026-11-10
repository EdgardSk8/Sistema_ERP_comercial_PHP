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
    ['#tablaPromociones', () => import('./MostrarPromociones')],
    ['#tablaCategorias', () => import('./MostrarCategoria')],
    ['#tablaMarcas', () => import('./MostrarCatalogos')],
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
    ['#tablaPedidosWeb', () => import('./MostrarPedidosWeb')],
    ['#tablaTrabajadores', () => import('./MostrarTrabajadores')],
    ['#tablaCupones', () => import('./MostrarCuponesDescuentos')],
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
    vista_pedidos_web: '/pedidos-web',

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
