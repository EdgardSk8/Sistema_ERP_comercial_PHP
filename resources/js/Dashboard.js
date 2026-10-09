export default function initDashboard() {

    document.getElementById('titulo').textContent = 'Panel Analitico';

    document.querySelectorAll('input[name="dashboard"]').forEach(radio => {

        radio.addEventListener('change', async () => {
            moduloActual = radio.value;
            await CargarDatosDashboard();
        });

    });

    let Chart_Grafica_1 = null;
    let Chart_Grafica_2 = null;
    let Chart_Grafica_3 = null;
    let Chart_Tabla_1 = null;

    let Datos_Grafica_1 = [];
    let UI_Grafica_1 = {};
    let Datos_Grafica_2 = [];
    let UI_Grafica_2 = {};
    let Datos_Grafica_3 = [];
    let UI_Grafica_3 = {};

    let moduloActual = 'ventas';
    let filtroBackend = null;
    let solicitudActual = 0;
    let controladorSolicitud = null;

    const rutasDashboard = {
        ventas: '/dashboard/ventas',
        compras: '/dashboard/compras',
        ganancias: '/dashboard/ganancias',
        cajas: '/dashboard/cajas',
        Movimiento_inventario: '/dashboard/movimiento-inventario'
    };
    
    const $ = id => document.getElementById(id);

    /* ══════════════════ [ELEMENTOS] ═══════════════════ */

    const Fecha_Ini = $('Fecha_Inicio');
    const Fecha_Fin = $('Fecha_Fin');

    const Btn_Limpiar_Filtros = document.getElementById('Btn_Limpiar_Filtros');

    const ctx_Grafica_1 = document.getElementById('Chart_1').getContext('2d');
    const ctx_Grafica_2 = document.getElementById('Chart_2').getContext('2d');
    const ctx_Grafica_3 = document.getElementById('Chart_3').getContext('2d');

    function ObtenerColorTextoGrafica() {
        return getComputedStyle(document.documentElement).getPropertyValue('--text-soft').trim() || '#AEB4BB';
    }

    function SincronizarTemaGraficas() {
        const colorTexto = ObtenerColorTextoGrafica();

        if (Chart_Grafica_1) {
            Chart_Grafica_1.options.scales.x.ticks.color = colorTexto;
            Chart_Grafica_1.options.scales.y.ticks.color = colorTexto;
            Chart_Grafica_1.options.plugins.title.color = colorTexto;
            Chart_Grafica_1.update('none');
        }

        if (Chart_Grafica_2) {
            Chart_Grafica_2.options.plugins.legend.labels.color = colorTexto;
            Chart_Grafica_2.options.plugins.title.color = colorTexto;
            Chart_Grafica_2.update('none');
        }

        if (Chart_Grafica_3) {
            Chart_Grafica_3.options.scales.x.ticks.color = colorTexto;
            Chart_Grafica_3.options.scales.y.ticks.color = colorTexto;
            Chart_Grafica_3.options.plugins.title.color = colorTexto;
            Chart_Grafica_3.update('none');
        }
    }

    window.__dashboardThemeObserver?.disconnect();
    window.__dashboardThemeObserver = new MutationObserver(SincronizarTemaGraficas);
    window.__dashboardThemeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });

    /* ══════════════════ [FUNCIONES] ══════════════════ */

    function Obtener_Filtros() { 
        return filtroBackend ?? document.querySelector('input[name="Radio_Filtro"]:checked').value;
    }

    function FormatearFechaLocal(fecha) {
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
    }

    //SIRVE PARA PONER LA FECHA DE FIN EN EL DIA DE HOY Y FIN HACE 3 MESES
    function InicializarFechasGraficas() {
        const hoy = new Date();
        const fechaFin = FormatearFechaLocal(hoy);
        const fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        const fechaInicioFormato = FormatearFechaLocal(fechaInicio);
        Fecha_Ini.value = fechaInicioFormato;
        Fecha_Fin.value = fechaFin;
    }

    function AplicarFiltroSemana() {
        const hoy = new Date(); const fechaFin = FormatearFechaLocal(hoy); const fechaInicio = new Date();
        fechaInicio.setDate(hoy.getDate() - 6);
        const inicio = FormatearFechaLocal(fechaInicio);
        if (Fecha_Ini._flatpickr) { Fecha_Ini._flatpickr.setDate(inicio, false); } else { Fecha_Ini.value = inicio; }
        if (Fecha_Fin._flatpickr) { Fecha_Fin._flatpickr.setDate(fechaFin, false); } else { Fecha_Fin.value = fechaFin; }
    }

    // FUNCION PARA OBTENER DATOS
    async function ObtenerDatos() {
        const solicitud = ++solicitudActual;
        controladorSolicitud?.abort();
        controladorSolicitud = new AbortController();

        const params = new URLSearchParams({ tipo: Obtener_Filtros(), inicio: Fecha_Ini.value, fin: Fecha_Fin.value });
        const response = await fetch(`${rutasDashboard[moduloActual]}?${params}`, { signal: controladorSolicitud.signal });
        if (!response.ok) throw new Error(`Error al cargar el dashboard (${response.status})`);
        const data = await response.json();
        if (solicitud !== solicitudActual) return;
        if (!data.ui) throw new Error('La respuesta del dashboard no contiene la configuración de gráficas.');

        Render_Kpis(data.kpis);
        Render_Grafica_1(data.grafica_1 ?? [], data.ui.grafica_1 ?? {});
        Render_Grafica_2(data.grafica_2 ?? [], data.ui.grafica_2 ?? {});
        Render_Grafica_3(data.grafica_3 ?? [], data.ui.grafica_3 ?? {});
        Render_Tabla_1(data.tabla_1 ?? [], data.ui.tabla_1 ?? {});

    }

    async function CargarDatosDashboard() {
        try {
            await ObtenerDatos();
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error(error);
            mostrarToast('No se pudieron cargar los datos.', 'danger');
        }
    }

    // ANIMACION DE TEXTO PARA KPIS
    function AnimarTexto(elemento, texto, icono) {

        if (!elemento) return;

        elemento.animate(
            [{ opacity: 0 }, { opacity: 1 }],
            { duration: 500, easing: 'ease-in' }
        );

        elemento.textContent = texto ?? '';

        if (icono) {
            icono.animate(
                [{ opacity: 0 }, { opacity: 1 }],
                { duration: 500, easing: 'ease-in' }
            );
        }

    }

    // FUNCION PARA ANIMACION DE GRAFICOS AL CAMBIAR EN RADIO BUTTON
    function ActualizarGraficaAnimada(chart, labels, valores, opciones = {}) {

        if (!chart) return false;

        chart.data.labels = labels;
        chart.data.datasets[0].data = valores;

        if (opciones.dataset !== undefined) { chart.data.datasets[0].label = opciones.dataset; }
        if (opciones.titulo !== undefined) { chart.options.plugins.title.text = opciones.titulo; }
        chart.update({ duration: opciones.duration ?? 1000, easing: opciones.easing ?? 'easeOutQuart' });
        return true;
    }

    // ANIMACION DE TABLA
    function ActualizarTablaAnimada(tabla, datos, ui = {}) {
        if (!tabla) return false;
        const headers = tabla.columns().header();
        headers[1].textContent = ui.columnas?.label ?? '';
        headers[2].textContent = ui.columnas?.cantidad ?? '';
        headers[3].textContent = ui.columnas?.total ?? '';
        tabla.clear(); tabla.rows.add(datos); tabla.draw(false);
        const contenedor = document.querySelector('.Tabla_1');
        if (contenedor) { contenedor.animate( [ { opacity: 0 }, { opacity: 1 } ], { duration: 500, easing: 'ease-out' } ); }
        return true;
    }

    /* ═════════════════ [KPIs] ═════════════════ */

    function Render_Kpis(kpis) {

        if (!kpis) return;

        Object.values(kpis).forEach((item, index) => {

            const contenedor = document.getElementById(`kpis_${index + 1}`);
            if (!contenedor) return;

            const card = contenedor.closest('.Card_Kpis');
            if (!card) return;

            const icono = card.querySelector('i');
            if (icono && item.icono) {
                icono.className = item.icono;
            }

            const titulo = contenedor.querySelector('label');
            const valor = contenedor.querySelector('strong');

            AnimarTexto(titulo, item.titulo, icono);
            AnimarTexto(valor, item.valor);

            card.setAttribute('data-bs-toggle', 'tooltip');
            card.setAttribute('data-bs-title', item.tooltip ?? '');

            bootstrap.Tooltip.getOrCreateInstance(card);

        });

    }

    /* ═════════════════ [RENDER GRAFICA] ═════════════════ */

    function Render_Grafica_1(datos = [], ui = {}) {

        Datos_Grafica_1 = datos;
        UI_Grafica_1 = ui;

        const labels = datos.map(item => item.label);
        const valores = datos.map(item => Number(item.total ?? 0));

        if (ActualizarGraficaAnimada( Chart_Grafica_1, labels, valores, {dataset: ui.dataset ?? '', titulo: ui.titulo ?? ''} )) { return; }

        const gradient = ctx_Grafica_1.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(34, 197, 94, 1)');
        gradient.addColorStop(0.45, 'rgba(34, 197, 94, 0)');

        Chart_Grafica_1 = new Chart(ctx_Grafica_1, { type: 'line',

            data: { labels,
                datasets: [
                    {
                        label: ui.dataset ?? '',
                        data: datos.map(item => Number(item.total ?? 0)),
                        backgroundColor: gradient,
                        borderColor: '#22c55e',
                        borderWidth: 1,
                        tension: 0.5,
                        yAxisID: 'y',
                        fill: true,
                        pointRadius: 3,
                        pointBackgroundColor: '#22c55e',
                    },
                ]
            },

            options: {

                scales: {
                    x: { ticks: { color: ObtenerColorTextoGrafica(), callback: function(value) { const label = this.getLabelForValue(value); return EjeXDashboard(label); } } },
                    y: { ticks: { color: ObtenerColorTextoGrafica() } }
                },
                responsive: true,
                maintainAspectRatio: false,

                plugins: {

                    legend: { display: false },
                    title: { display: true, text: ui.titulo ?? '', color: ObtenerColorTextoGrafica(), font: { size: 12, weight: 'bold' }, padding: { top: 0, bottom: 5 } },
                    
                    tooltip: {

                        callbacks: { 
                            
                            title(context) { const item = Datos_Grafica_1[context[0].dataIndex]; return formatearFechaDashboard(item.label); },

                            label(context) {
                                const item = Datos_Grafica_1[context.dataIndex]; const total = Number(item.total ?? 0);
                                return [
                                `${UI_Grafica_1.labels?.total ?? ''}: ${moneda(total)}`,
                                `${UI_Grafica_1.labels?.cantidad ?? ''}: ${Number(item.cantidad ?? 0).toLocaleString('es-NI')}`,
                                ];
                            }

                        }

                    }

                }

            }

        });

    }

    function Render_Grafica_2(datos = [], ui = {}) {

        Datos_Grafica_2 = datos;
        UI_Grafica_2 = ui;

        const labels = datos.map(item => String(item.label));
        const valores = datos.map(item => Number(item.cantidad ?? 0));

        if (ActualizarGraficaAnimada( Chart_Grafica_2, labels, valores, {dataset: ui.dataset ?? '', titulo: ui.titulo ?? ''} )) { return; }

        Chart_Grafica_2 = new Chart(ctx_Grafica_2, {

            type: 'pie',

            data: {

                labels,

                datasets: [
                    {
                        label: ui.dataset ?? '',

                        data: datos.map(item => Number(item.cantidad ?? 0)),

                        backgroundColor: Colores.colores_2,

                        borderWidth: 1,
                    }
                ]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,


                plugins: {

                    legend: {
                        display: true,
                        position: 'left',
                        labels: {
                            boxWidth: 15,
                            padding: 10,
                            font: {
                                size: 12
                            },
                            color: ObtenerColorTextoGrafica()
                        }
                    },


                    title: {

                        display: true,

                        text: ui.titulo ?? '',
                        color: ObtenerColorTextoGrafica(),

                        font: {
                            size: 12,
                            weight: 'bold'
                        },

                        padding: {
                            top: 0,
                            bottom: 5
                        }

                    },


                    datalabels: {

                        color: '#fff',

                        font: {
                            weight: 'bold',
                            size: 12
                        },

                        formatter: (value) => {

                            if (value === 0) return '';

                            return value.toLocaleString('es-NI');

                        }

                    },


                    tooltip: {

                        callbacks: {

                            label: function(context) {
                                const item = Datos_Grafica_2[context.dataIndex];
                                const cantidad = Number(item.cantidad ?? 0);
                                return `${UI_Grafica_2.labels?.cantidad ?? ''}: ${cantidad.toLocaleString('es-NI')}`;
                            }

                        }

                    }

                }

            },

            plugins: [ChartDataLabels]

        });

    }

    function Render_Grafica_3(datos = [], ui = {}) {2

        Datos_Grafica_3 = datos; UI_Grafica_3 = ui;

        // const labels = datos.map(item => Formato12Horas(item.label));

        const labels = datos.map(item => { const label = String(item.label); return /^\d{2}:\d{2}$/.test(label) ? Formato12Horas(label) : label; });
        const valores = datos.map(item => Number(item.cantidad ?? 0));

        if (ActualizarGraficaAnimada( Chart_Grafica_3, labels, valores, {dataset: ui.dataset ?? '', titulo: ui.titulo ?? ''} )) { return; }

        Chart_Grafica_3 = new Chart(ctx_Grafica_3, {

            type: 'bar',

            data: { // labels: datos.map(item => Formato12Horas(item.label)),
                
                labels: datos.map(item => {
                const label = String(item.label); return /^\d{2}:\d{2}$/.test(label) ? Formato12Horas(label) : label; }),

                datasets: [
                    {
                        label: ui.dataset ?? '',
                        data: datos.map(item => Number(item.cantidad ?? 0)),
                        backgroundColor: Colores.colores_2,
                        borderWidth: 1
                    }
                ]

            },

            options: {

                responsive: true, maintainAspectRatio: false,

                plugins: {

                    title: { display: true, text: ui.titulo ?? '', color: ObtenerColorTextoGrafica(), font: { size: 12, weight: 'bold' },padding: { top: 0, bottom: 5 } },
                    legend: { display: false },

                    tooltip: {

                        callbacks: {

                            label(context) {
                                const item = Datos_Grafica_3[context.dataIndex];
                                return [
                                    `${UI_Grafica_3.labels?.cantidad ?? ''}: ${Number(item.cantidad ?? 0).toLocaleString('es-NI')}`,
                                    `${UI_Grafica_3.labels?.total ?? ''}: ${moneda(Number(item.total ?? 0))}`
                                ];
                            }

                        }

                    }

                },

                scales: {
                    x: { ticks: { color: ObtenerColorTextoGrafica() } },
                    y: { beginAtZero: true, ticks: { color: ObtenerColorTextoGrafica() } }
                }
            }

        });

    }

    function Render_Tabla_1(datos = [], ui = {}) {

        datos = datos.map(item => ({ label: item.label, cantidad: Number(item.cantidad ?? 0), total: Number(item.total ?? 0) }));
        document.querySelector('.Tabla_1 .Titulo-Tabla').textContent = ui.titulo ?? '';
        if (ActualizarTablaAnimada(Chart_Tabla_1, datos, ui)) { return; }

        Chart_Tabla_1 = jQuery('#Tabla_1').DataTable({

            data: datos,


            columns: [

                {
                    title: '#',
                    data: null,
                    className: 'text-center',

                    render: (data, type, row, meta) => meta.row + 1
                },


                {
                    title: ui.columnas?.label ?? '',
                    data: 'label'
                },


                {
                    title: ui.columnas?.cantidad ?? '',
                    data: 'cantidad',
                    className: 'text-center'
                },


                {
                    title: ui.columnas?.total ?? '',
                    data: 'total',
                    className: 'text-end',

                    render: data => moneda(Number(data ?? 0))
                }

            ],


            paging: false,

            searching: false,

            info: false,

            ordering: false,

            responsive: true,


            language: {

                emptyTable: ui.vacio ?? ''

            }

        });

    }

    /* ═══════════════════════ [EVENTOS] ═══════════════════════ */

document.querySelectorAll('input[name="Radio_Filtro"]').forEach(radio => {

    radio.addEventListener('change', () => {

        filtroBackend = null;

        if (radio.value === 'semana') {

            AplicarFiltroSemana();

            // Solo cambia lo que recibe Laravel
            filtroBackend = 'dia';

        }

        CargarDatosDashboard();

    });

});

    Fecha_Ini.addEventListener('change', () => {
        if (Fecha_Ini.value && Fecha_Fin.value) CargarDatosDashboard();
    });
    Fecha_Fin.addEventListener('change', () => {
        if (Fecha_Ini.value && Fecha_Fin.value) CargarDatosDashboard();
    });

    Btn_Limpiar_Filtros.addEventListener('click', () => {
        document.getElementById('Mes').checked = true;
        ResetearInputs(Fecha_Ini, Fecha_Fin); 
        Fecha_Ini._flatpickr?.clear();
        Fecha_Fin._flatpickr?.clear();
        CargarDatosDashboard();
    });

    /* ═══════════════════════ [INICIO] ═══════════════════════ */

    InicializarFechasGraficas();
    CargarDatosDashboard();
    FlatPickr(Fecha_Ini);
    FlatPickr(Fecha_Fin);

};
