let tablaReporteActiva = null;
let solicitudReporteActiva = null;

function limpiarModuloReportes() {
    $(document).off('.reporte');
    if (solicitudReporteActiva) {
        solicitudReporteActiva.abort();
        solicitudReporteActiva = null;
    }
    if (tablaReporteActiva) {
        if ($.fn.DataTable.isDataTable(tablaReporteActiva.table().node())) {
            tablaReporteActiva.destroy();
        }
        tablaReporteActiva = null;
    }
}

document.addEventListener('turbo:before-frame-render', (event) => {
    if (event.target.id === 'contenido-dinamico' && event.target.querySelector('#Reportes')) {
        limpiarModuloReportes();
    }
});

export default function initReportes() {

    if (tablaReporteActiva && tablaReporteActiva.table().node() === document.getElementById('Reportes')) return;
    limpiarModuloReportes();

    $('input[name="tipo_exportacion"]').on('change', function () {

        $('#btnGenerarReporte').prop('disabled', false);

    });

    // =====================================================
    // GENERAR
    // =====================================================

    $('#btnGenerarReporte').on('click', function () {

        const tipo = $('input[name="tipo_exportacion"]:checked').val();

        if (!tipo) {

            alert('Seleccione un tipo de exportación');
            return;

        }

        if (!$.fn.DataTable.isDataTable('#Reportes')) {

            alert('No hay datos cargados');
            return;

        }

        const tabla = $('#Reportes').DataTable();

        // =====================================================
        // PDF
        // =====================================================

        if (tipo === 'pdf') {

            tabla.button('.buttons-pdf').trigger();

        }

        // =====================================================
        // EXCEL
        // =====================================================

        if (tipo === 'excel') {

            tabla.button('.buttons-excel').trigger();

        }

    });
    
window.AppContext = { usuario: null, credenciales: null };

async function cargarContextoSistema() {

    try {
        const [me, cred] = await Promise.all([
            $.get('/me'),
            $.get('/credenciales/mostrar')
        ]);

        if (me && me.success) { window.AppContext.usuario = me.data; }
        if (cred && cred.success) { window.AppContext.credenciales = cred.data; }

    } catch (error) { console.error('Error cargando contexto:', error); }
}

$(document).ready(function () { cargarContextoSistema(); });

const PlantillaPDF = function (config = {}) {

    return {
        extend: 'pdfHtml5',
        orientation: 'landscape',
        pageSize: 'A4',
        filename: config.filename || 'REPORTE',
        title: '',
        footer: false,
        exportOptions: { columns: () => true },

        customize: function (doc) {

            const empresaData = window.AppContext?.credenciales || {};
            const usuarioData = window.AppContext?.usuario || {};

            const empresa = empresaData.nombre_empresa || 'Empresa';
            const direccion = [empresaData.direccion_empresa, empresaData.telefono_empresa]
                .filter(Boolean)
                .join('\n');
            const usuario = usuarioData.nombre || 'Usuario no identificado';
            const ahora = new Date();
            const fecha = ahora.toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' });
            const hora = ahora.toLocaleTimeString('es-NI', { hour: 'numeric', minute: '2-digit', hour12: true });
            const fechaHora = `${fecha}, ${hora}`;
            const nombresReportes = {
                ventas: 'ventas',
                inventario: 'inventario',
                movimientoinventario: 'movimientos de inventario',
                clientes: 'clientes',
                usuarios: 'usuarios',
                cajas: 'cajas'
            };
            const tipoReporte = nombresReportes[config.tipoReporte] || config.tipoReporte || 'general';
            const tituloReporte = `reporte de ${tipoReporte} · ${fechaHora}`;

            doc.pageMargins = [8, 78, 8, 26];
            doc.defaultStyle = { fontSize: 7, color: '#111111' };

            // Encabezado repetido en cada página, con tres columnas de ancho estable.
            doc.header = () => ({
                margin: [24, 13, 24, 0],
                stack: [
                    {
                        columns: [
                            { width: '*', text: direccion || ' ', alignment: 'left', fontSize: 7, color: '#333333' },
                            { width: '*', text: empresa, alignment: 'center', fontSize: 9, bold: true, color: '#111111' },
                            { width: '*', text: `Exportó: ${usuario}\n${fechaHora}`, alignment: 'right', fontSize: 7, color: '#333333' }
                        ],
                        columnGap: 10
                    },
                    {
                        text: tituloReporte,
                        alignment: 'center',
                        fontSize: 15,
                        bold: true,
                        color: '#111111',
                        margin: [0, 9, 0, 0]
                    },
                    { canvas: [{ type: 'line', x1: 0, y1: 6, x2: 794, y2: 6, lineWidth: 0.7, lineColor: '#555555' }] }
                ]
            });

            doc.footer = (pagina, paginas) => ({
                text: `Página ${pagina} de ${paginas}`,
                alignment: 'right',
                margin: [24, 0, 24, 12],
                fontSize: 7,
                color: '#333333'
            });

            const tabla = doc.content.find(item => item.table);
            if (!tabla) return;

            const body = tabla.table.body;
            const cantidadColumnas = body[0]?.length || 0;
            const textoCelda = celda => {
                const valor = typeof celda === 'object' && celda !== null ? celda.text : celda;
                if (Array.isArray(valor)) {
                    return valor.map(segmento => typeof segmento === 'object' && segmento !== null ? segmento.text : segmento).join('');
                }
                return String(valor ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            };

            // Mide el contenido de toda la columna para dar espacio también a los campos largos.
            const longitudes = Array.from({ length: cantidadColumnas }, (_, columna) => {
                const encabezado = textoCelda(body[0]?.[columna]).trim().toLowerCase();
                const longitudEncabezado = textoCelda(body[0]?.[columna]).length;
                const longitudesValores = body.slice(1).map(fila => textoCelda(fila[columna]).trim().length);
                const longitudPromedio = longitudesValores.length
                    ? longitudesValores.reduce((total, longitud) => total + longitud, 0) / longitudesValores.length
                    : 0;
                // Evita que un solo texto largo fuerce espacio vacío para todos los valores cortos.
                const anchoBase = Math.max(longitudEncabezado, longitudPromedio * 1.25, 3);
                if (encabezado === 'id' || encabezado.startsWith('id ')) return Math.max(3, Math.min(anchoBase, 7));
                return Math.max(5, Math.min(anchoBase, 28));
            });
            const anchoPagina = 841.89; // A4 horizontal en puntos PDF.
            const anchoDisponible = anchoPagina - doc.pageMargins[0] - doc.pageMargins[2];
            const espacioInterno = (cantidadColumnas * 2) + ((cantidadColumnas + 1) * 0.35);
            const anchoUtil = Math.max(1, anchoDisponible - espacioInterno);
            const sumaProporciones = longitudes.reduce((total, longitud) => total + longitud, 0) || 1;

            // La suma de los anchos de contenido más padding y bordes nunca excede la página.
            tabla.table.widths = longitudes.map(longitud => (longitud / sumaProporciones) * anchoUtil);
            tabla.table.headerRows = 1;
            tabla.table.keepWithHeaderRows = 1;
            tabla.table.dontBreakRows = true;
            tabla.layout = {
                fillColor: fila => fila === 0 ? '#e5e5e5' : null,
                hLineColor: () => '#888888',
                vLineColor: () => '#b0b0b0',
                hLineWidth: fila => fila === 0 || fila === 1 ? 0.8 : 0.35,
                vLineWidth: () => 0.35,
                paddingLeft: () => 1,
                paddingRight: () => 1,
                paddingTop: () => 2,
                paddingBottom: () => 2
            };

            doc.styles.tableHeader = {
                fillColor: '#e5e5e5',
                color: '#111111',
                bold: true,
                fontSize: 7,
                alignment: 'center'
            };
            doc.styles.tableBodyOdd = { color: '#111111', fontSize: 7, alignment: 'center' };
            doc.styles.tableBodyEven = { color: '#111111', fontSize: 7, alignment: 'center' };
        }
    };
};


const PlantillaCSV = function (config = {}) {

    return {
        extend: 'csvHtml5',footer: false,exportOptions: { columns: ':visible' },

        customize: function (csv) {

            const empresaData = window.AppContext?.credenciales || {};
            const usuarioData = window.AppContext?.usuario || {};

            const empresa   = empresaData.nombre_empresa || 'SIN EMPRESA';
            const usuario   = usuarioData.nombre || 'INVITADO';

            const fecha = window.formatearFechaDiaHora
                ? window.formatearFechaDiaHora(new Date())
                : new Date().toLocaleString('es-ES');

            const tipoReporte = config.tipoReporte || 'REPORTE GENERAL';

            const header =
`====================================
${empresa}
====================================
REPORTE: ${tipoReporte}
USUARIO: ${usuario}
FECHA: ${fecha}
====================================

`;

            return header + csv;
        }
    };
};


const  PlantillaExcel = function (config = {}) {

    return {
        extend: 'excelHtml5',
        filename: config.filename || 'REPORTE',

        exportOptions: { columns: ':visible' },

        customize: function (xlsx) {

            const sheet = xlsx.xl.worksheets['sheet1.xml'];

            const empresaData = window.AppContext?.credenciales || {};
            const usuarioData = window.AppContext?.usuario || {};

            const empresa = empresaData.nombre_empresa || 'SIN EMPRESA';
            const direccion = empresaData.direccion_empresa || '';
            const telefono = empresaData.telefono_empresa || '';
            const usuario = usuarioData.nombre || 'INVITADO';

            const fecha = window.formatearFechaDiaHora
                ? window.formatearFechaDiaHora(new Date())
                : new Date().toLocaleString('es-ES');

            const tipoReporte = config.tipoReporte || 'REPORTE GENERAL';

            // =========================
            // SHIFT (5 FILAS ARRIBA)
            // =========================
            $('row', sheet).each(function () {
                let r = parseInt($(this).attr('r'));
                $(this).attr('r', r + 5);
            });

            $('c', sheet).each(function () {
                let cell = $(this).attr('r');
                if (!cell) return;

                let col = cell.replace(/[0-9]/g, '');
                let row = parseInt(cell.replace(/[A-Z]/g, ''));

                $(this).attr('r', col + (row + 5));
            });

            // =========================
            // HEADER PRO (con celdas válidas)
            // =========================
            const headerRows = `
                <row r="1">
                    <c r="A1" t="inlineStr"><is><t>${tipoReporte}</t></is></c>
                </row>
                <row r="2">
                    <c r="A2" t="inlineStr"><is><t>${empresa}</t></is></c>
                </row>
                <row r="3">
                    <c r="A3" t="inlineStr"><is><t>${direccion} ${telefono}</t></is></c>
                </row>
                <row r="4">
                    <c r="A4" t="inlineStr"><is><t>Usuario: ${usuario}</t></is></c>
                </row>
                <row r="5">
                    <c r="A5" t="inlineStr"><is><t>${fecha}</t></is></c>
                </row>
            `;

            $('sheetData', sheet).prepend(headerRows);

            // =========================
            // ESTILOS (CENTRADO + NEGRITA)
            // =========================
            $('row[r="1"] c', sheet).attr('s', '2'); // título (más fuerte)
            $('row[r="2"] c', sheet).attr('s', '3'); // empresa
            $('row[r="3"] c, row[r="4"] c, row[r="5"] c', sheet).attr('s', '3');

            // =========================
            // MERGE CELLS (CORRECTO Y SEGURO)
            // =========================
            if ($('mergeCells', sheet).length === 0) {

                const mergeCells =
                    `<mergeCells count="2">
                        <mergeCell ref="A1:H1"/>
                        <mergeCell ref="A2:H2"/>
                    </mergeCells>`;

                $('worksheet', sheet).append(mergeCells);
            }

            // =========================
            // HEADER DE TABLA (fila real después del shift)
            // =========================
            $('row[r="6"] c', sheet).each(function () {
                $(this).attr('s', '4');
            });

            // =========================
            // ALTURA TÍTULO
            // =========================
            $('row[r="1"]', sheet)
                .attr('ht', '28')
                .attr('customHeight', 1);
        }
    };
};

/* ----------------------------------------------------------------------------------------------------- */

    /* EVENTO DE NOMBRAMIENTO DE TITULO */

    $('#titulo').text('REPORTES PARAMETRIZADOS');

    /* INICIALIZACION DE FLATPICKR */

    if (window.flatpickr) {
        window.flatpickr('#FechaInicio', { dateFormat: 'Y-m-d', allowInput: true });
        window.flatpickr('#FechaFin', { dateFormat: 'Y-m-d', allowInput: true });
    }

    /* VARIABLES DE ESTADO */

    let tablaReportes = null;
    let requestActual = null;

    /* ESTADO DE MODULO */

    const $fechaInicio = $('#FechaInicio');
    const $fechaFin = $('#FechaFin');
    const $limite = $('#LimiteDatos');
    const Primer_Reporte = $('input[name="reporte"]').first();

    /* MAPEO DE RUTAS */

    const rutasReportes = {
        ventas: '/reportes/ventas',
        inventario: '/reportes/inventario',
        movimientoinventario: '/reportes/movimiento-inventario',
        clientes: '/reportes/clientes',
        usuarios: '/reportes/usuarios',
        cajas: '/reportes/cajas'
    };

    /* FUNCION CONTROL DE FLUJO */

    function recargarReporte() { 
        const reporte = $('input[name="reporte"]:checked').val(); 
        if (reporte) cargarReporte(reporte); 
    }

    const configuracionFiltros = {

    ventas: { columnasSelect: [3, 4, 9, 12] },
    inventario: { columnasSelect: [2, 3, 4] },
    movimientoinventario: { columnasSelect: [2, 5, 6, 9] },
    clientes: { columnasSelect: [1, 4, 8] },
    usuarios: { columnasSelect: [3] },
    cajas: { columnasSelect: [1] }

    };

    const ConfigurarFiltrosDataTable = (tabla, config = {}) => {

        let columnasSelect = config.columnasSelect || [];

        tabla.columns().every(function () {

            let column = this;
            let index = column.index();
            let footer = $(column.footer());
            footer.empty();

            if(columnasSelect.includes(index)){

                let select = $(`<select class="form-select form-select-sm filtro-columna"> <option value="">Todos</option> </select>`)
                .appendTo(footer)
                .on('change', function () {
                    let val = $.fn.dataTable.util.escapeRegex($(this).val());
                    column.search(val ? '^' + val + '$' : '', true, false).draw();
                });

                let valores = [];
                column.data().each(function (d) {
                    d = $('<div>').html(d).text().trim();
                    if(d && !valores.includes(d)){ valores.push(d); }
                });

                valores.sort();
                valores.forEach(function (d) {
                    select.append( `<option value="${d}">${d}</option>` );
                });

            }

            // =========================
            // INPUT
            // =========================

            else{

                $(`
                    <input 
                        type="text" 
                        class="form-control form-control-sm filtro-columna" 
                        placeholder="Buscar"
                    >
                `)
                .appendTo(footer)
                .on('keyup change clear', function () {

                    if(column.search() !== this.value){

                        column
                            .search(this.value)
                            .draw();

                    }

                });

            }

        });

    };

    if (!document.getElementById('Reportes')) {
        return;
    }

    function cargarReporte(reporte) {

        if (requestActual) { requestActual.abort(); }

        requestActual = $.ajax({

            url: rutasReportes[reporte], type: 'GET',
            data: {
                fecha_inicio: $fechaInicio.val(),
                fecha_fin: $fechaFin.val(),
                limite: $limite.val() !== '' ? $limite.val() : null
            },

            success: function (respuesta) {

                if (!respuesta.success) return;

                if (!respuesta.datos || !respuesta.columnas) { console.error("RESPUESTA INVÁLIDA:", respuesta); return; }
                destruirTabla();

                $('#Orden-Datos')
                    .off('change.reporte')
                    .on('change.reporte', function () {

                        if (tablaReportes) {
                            tablaReportes.order([0, $(this).val()]).draw();
                        }

                    });

                /* GENERAR THEAD Y TFOOT DINAMICOS */
                let thead = '<tr>';
                let tfoot = '<tr>';

                respuesta.columnas.forEach(col => {

                    thead += `<th>${col.title}</th>`;
                    tfoot += `<th></th>`;

                });

                thead += '</tr>';
                tfoot += '</tr>';

                $('#Reportes').html(`
                    <thead>${thead}</thead>
                    <tfoot>${tfoot}</tfoot>
                    <tbody></tbody>
                `);


                tablaReportes = $('#Reportes').DataTable({
                        data: respuesta.datos,

                        /* CONFIGURAR FILTROS */
                        initComplete: function () {

                            ConfigurarFiltrosDataTable(
                                this.api(),
                                configuracionFiltros[reporte] || {}
                            );
                        },
                        columns: respuesta.columnas.map(c => ({ data: c.data, title: c.title, defaultContent: "" })),
                        pageLength: 20, dom: 'Bt', buttons: generarBotones(reporte), drawCallback: function () { AnimarFilasVisibles(this.api()); },
                        columnDefs: [ { targets: "_all", defaultContent: "" } ]
                        

                    });
                tablaReporteActiva = tablaReportes;

            },

            error: function (xhr, status) {

                if (status !== 'abort') { console.error("ERROR AJAX:", xhr.responseText); }
            },

            complete: function () {
                if (solicitudReporteActiva === requestActual) solicitudReporteActiva = null;
            }

        });
    }

    /* GESTION DE ESTADO UI */

    function destruirTabla() {

        if ($.fn.DataTable.isDataTable('#Reportes')) {
            $('#Reportes').DataTable().clear().destroy();
        }

        $('#Reportes').off(); // 🔥 elimina eventos colgados
        $('#Reportes').empty();
        tablaReporteActiva = null;
        tablaReportes = null;
    }

    /* FUNCION UTILITARIA */

    function generarNombreArchivo(reporte) {

        const limpio = (reporte || 'REPORTE')
            .toString()
            .toUpperCase()
            .replace(/\s+/g, '_')
            .replace(/[^\w_]/g, '');

        const fecha = window.formatearFechaDiaHora(new Date(), true);
        return `REPORTE DE ${limpio} ${fecha}`;
    }

    function generarBotones(reporte) {

        const nombre = generarNombreArchivo(reporte);
        return [

            PlantillaExcel({ filename: nombre, title: nombre }),
            PlantillaPDF({ filename: nombre, tipoReporte: reporte }),
            PlantillaCSV({ filename: nombre, title: nombre }),

            { extend: 'copyHtml5', text: '📋 Copiar', className: 'btn btn-danger' },
            { extend: 'print', text: '🖨️ Imprimir', className: 'btn btn-dark' }

        ];
    }

    /* MANEJO DE EVENTOS */

    $(document).off('change.reporte').on('change.reporte', 'input[name="reporte"]', function () { cargarReporte($(this).val()); });
    $('#limpiafiltroreporte').off('click.reporte').on('click.reporte', function () {
        $fechaInicio.val('');
        $fechaFin.val('');
        $limite.val('');
        if (tablaReportes) {
            tablaReportes.search('').columns().search('');
            $(tablaReportes.table().footer()).find('input, select').val('');
        }
        recargarReporte();
    });

    $fechaInicio.add($fechaFin).on('change', function () {

        const inicio = $fechaInicio.val();
        const fin = $fechaFin.val();

        if ( (inicio && !fin) || (!inicio && fin) ) {

            Swal.fire({
                icon: 'warning',
                title: 'Fechas incompletas',
                text: 'Debes seleccionar fecha de inicio y fecha fin.'
            });

            return;
        }

        recargarReporte();

    });

    $limite.on('input', recargarReporte);

    if (Primer_Reporte.length) { Primer_Reporte.prop('checked', true); cargarReporte(Primer_Reporte.val()); }
    
};
