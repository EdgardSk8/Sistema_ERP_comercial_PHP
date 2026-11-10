export default function initCuponesDescuentos() {
    document.getElementById('titulo').textContent = 'CUPONES Y DESCUENTOS';

    let filtroChip = 'todos';
    let cuponEditandoId = null;
    let cuponDetalleId = null;
    let codigoCuponActual = '';
    let clientesCupon = [];
    let categoriasCargadas = false;

    const csrf = document.querySelector('meta[name="csrf-token"]')?.content;

    const formCupon = document.getElementById('formCupon');
    const modalCupon = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCupon'));
    const modalAsignar = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAsignarClientes'));
    const tituloModalCupon = document.getElementById('tituloModalCupon');
    const btnGuardarCupon = document.getElementById('btnGuardarCupon');
    const btnConfirmarAsignacion = document.getElementById('btnConfirmarAsignacion');
    const errorFormCupon = document.getElementById('errorFormCupon');
    const categoriaSelect = document.getElementById('cuponCategoria');
    const campoCodigo = document.getElementById('cuponCodigo');
    const campoNombre = document.getElementById('cuponNombre');
    const campoTipo = document.getElementById('cuponTipo');
    const campoValor = document.getElementById('cuponValor');
    const campoUsos = document.getElementById('cuponUsos');
    const campoInicio = document.getElementById('cuponInicio');
    const campoFin = document.getElementById('cuponFin');
    const campoDescripcion = document.getElementById('cuponDescripcion');
    const campoTope = document.getElementById('cuponTope');
    const campoEstado = document.getElementById('cuponEstado');
    const listaClientes = document.getElementById('listaClientesCupon');
    const pickerInicio = window.FlatPickr ? window.FlatPickr(campoInicio) : null;
    const pickerFin = window.FlatPickr ? window.FlatPickr(campoFin) : null;

    const escapar = (valor) => $('<div>').text(valor ?? '').html();

    const tipoTexto = (tipo) => (tipo === 'porcentaje' ? 'Porcentaje' : 'Monto');

    const valorTexto = (cupon) => (
        cupon.tipo_descuento_cupon === 'porcentaje'
            ? `${Number(cupon.valor_descuento_cupon || 0)}%`
            : window.moneda(cupon.valor_descuento_cupon || 0)
    );

    const fechaCorta = (fecha) => {
        if (!fecha) return 'Sin límite';

        const valor = new Date(fecha);

        if (Number.isNaN(valor.getTime())) return String(fecha);

        const dia = String(valor.getDate()).padStart(2, '0');
        const mes = String(valor.getMonth() + 1).padStart(2, '0');

        return `${dia}/${mes}/${valor.getFullYear()}`;
    };

    const vigenciaHTML = (cupon) => {
        const inicio = fechaCorta(cupon.fecha_inicio_cupon);
        const fin = fechaCorta(cupon.fecha_fin_cupon);
        const vencido = cupon.fecha_fin_cupon && !cupon.vigente;

        return `<div class="cupones-vigencia ${vencido ? 'is-vencido' : ''}">
                    <strong>${escapar(inicio)} → ${escapar(fin)}</strong>
                    <span>${vencido ? 'Vencido' : cupon.vigente ? 'Vigente' : 'Programado'}</span>
                </div>`;
    };

    const coincideFiltro = (fila) => {
        if (filtroChip === 'activos') return Boolean(fila.estado_cupon);
        if (filtroChip === 'fidelidad') return fila.origen === 'fidelidad';
        if (filtroChip === 'usados') return Number(fila.usos_realizados || 0) > 0;

        return true;
    };

    const tabla = $('#tablaCupones').DataTable({
        dom: 't',
        ajax: {
            url: '/cupones-descuentos/mostrar',
            type: 'GET',
            dataSrc: (json) => {
                pintarResumen(json.resumen || {});
                cargarCategorias(json.categorias || []);
                return json.cupones || [];
            },
        },
        columns: [
            {
                data: 'codigo_cupon',
                render: (data, type, fila) => `<span class="cupones-codigo">${escapar(data)}</span>${
                    fila.origen === 'fidelidad' ? '<span class="cupones-origen">Fidelidad</span>' : ''
                }`,
            },
            { data: 'nombre_cupon' },
            {
                data: 'tipo_descuento_cupon',
                render: (data) => tipoTexto(data),
            },
            {
                data: 'valor_descuento_cupon',
                render: (data, type, fila) => `<span class="cupones-valor">${escapar(valorTexto(fila))}</span>`,
            },
            {
                data: 'categoria_cupon',
                render: (data) => (data ? escapar(data) : '<span class="text-secondary">Todas</span>'),
            },
            {
                data: 'usos_realizados',
                render: (data, type, fila) => `<span class="cupones-usos">${Number(data)} / ${Number(fila.usos_maximos)}</span>`,
            },
            {
                data: 'fecha_inicio_cupon',
                render: (data, type, fila) => vigenciaHTML(fila),
            },
            {
                data: 'estado_cupon',
                render: (data) => (data
                    ? '<span class="estado estado-activo">Activo</span>'
                    : '<span class="estado estado-inactivo">Inactivo</span>'),
            },
            {
                data: 'asignados',
                render: (data, type, fila) => `<span class="cupones-clientes">${Number(data)} asignados · ${Number(fila.usados)} usados</span>`,
            },
            {
                data: 'id_cupon',
                orderable: false,
                searchable: false,
                render: (data) => `<div class="cupones-acciones">
                    <button type="button" class="btn-detalle btn-detalle-cupon"
                        data-id="${Number(data)}" title="Ver detalle" aria-label="Ver detalle del cupón">
                        <i class="ph ph-eye"></i>
                    </button>
                    <button type="button" class="btn-editar btn-editar-cupon"
                        data-id="${Number(data)}" title="Editar cupón" aria-label="Editar cupón">
                        <i class="ph ph-pencil-simple"></i>
                    </button>
                </div>`,
            },
        ],
        order: [[7, 'desc'], [0, 'asc']],
        language: {
            emptyTable: 'No hay cupones registrados.',
            zeroRecords: 'No hay cupones que coincidan con la búsqueda.',
        },
        drawCallback: function () {
            window.AnimarFilasVisibles?.(this.api());
        },
    });

    window.registrarFiltroDataTable('cupones-filtro', (settings, data, index) => {
        if (settings.nTable.id !== 'tablaCupones') return true;

        const fila = settings.aoData[index]?._aData || {};

        return coincideFiltro(fila);
    });

    configurarToggleColumnas('tablaCupones', '#columnasCupones .toggle-col');

    document.querySelectorAll('.cupones-chip[data-filtro]').forEach((chip) => {
        chip.addEventListener('click', () => {
            filtroChip = chip.dataset.filtro;

            document.querySelectorAll('.cupones-chip[data-filtro]').forEach((item) => {
                item.classList.toggle('is-activo', item === chip);
            });

            tabla.draw();
        });
    });

    document.getElementById('buscarCupon')?.addEventListener('input', (evento) => {
        tabla.search(window.normalizarBusqueda(evento.target.value)).draw();
    });

    document.getElementById('recargarCupones')?.addEventListener('click', () => {
        tabla.ajax.reload(null, false);
    });

    /* ── Clientes: compras, bienvenida y cupones ───────────────── */
    let filtroCliente = 'todos';

    const pintarResumenClientes = (resumen = {}) => {
        document.getElementById('resumenClientesTotal').textContent = Number(resumen.total || 0);
        document.getElementById('resumenClientesCompras').textContent = Number(resumen.con_compras || 0);
        document.getElementById('resumenClientesBienvenida').textContent = Number(resumen.bienvenida_disponible || 0);
        document.getElementById('resumenClientesBienvenidaUsada').textContent = Number(resumen.bienvenida_usada || 0);
        document.getElementById('resumenClientesSinCompras').textContent = Number(resumen.sin_compras || 0);
        document.getElementById('resumenClientesCupones').textContent = Number(resumen.con_cupones || 0);
    };

    const coincideFiltroCliente = (cliente) => {
        const compras = Number(cliente.compras || 0) + Number(cliente.pedidos_web || 0);

        if (filtroCliente === 'con-compras') return compras > 0;
        if (filtroCliente === 'sin-compras') return compras === 0;
        if (filtroCliente === 'bienvenida-disponible') return Boolean(cliente.bienvenida_disponible);
        if (filtroCliente === 'bienvenida-usada') return Boolean(cliente.bienvenida_usada);
        if (filtroCliente === 'con-cupones') return Number(cliente.cupones_asignados || 0) > 0;

        return true;
    };

    const tablaClientes = $('#tablaClientesCupones').DataTable({
        dom: 't',
        scrollY: '100vh',
        scrollCollapse: true,
        ajax: {
            url: '/cupones-descuentos/clientes-resumen',
            type: 'GET',
            dataSrc: (json) => {
                pintarResumenClientes(json.resumen || {});
                return json.clientes || [];
            },
        },
        columns: [
            {
                data: 'nombre_cliente',
                render: (data, type, fila) => `<div class="cupones-cliente-nombre">
                    <strong>${escapar(data || 'Sin nombre')}</strong>
                    ${fila.estado_cliente === false || fila.estado_cliente === 0
                        ? '<span class="estado estado-inactivo">Inactivo</span>'
                        : ''}
                </div>`,
            },
            {
                data: 'correo_cliente',
                render: (data) => (data ? escapar(data) : '<span class="text-secondary">—</span>'),
            },
            {
                data: 'telefono_cliente',
                render: (data) => (data ? escapar(data) : '<span class="text-secondary">—</span>'),
            },
            {
                data: 'compras',
                render: (data, type, fila) => `<span class="cupones-compras">${Number(data)}${
                    Number(fila.pedidos_web) ? ` + ${Number(fila.pedidos_web)} web` : ''
                }</span>`,
            },
            {
                data: 'total_gastado',
                render: (data) => `<span class="cupones-total">${escapar(window.moneda(data || 0))}</span>`,
            },
            {
                data: 'pedidos_web',
                render: (data) => (Number(data)
                    ? `<span class="cupones-pedidos">${Number(data)}</span>`
                    : '<span class="text-secondary">—</span>'),
            },
            {
                data: 'ultima_actividad',
                render: (data) => (data
                    ? escapar(window.formatearFechaDiaHora(data))
                    : '<span class="text-secondary">—</span>'),
            },
            {
                data: 'bienvenida_usada',
                render: (data, type, fila) => {
                    if (fila.bienvenida_usada) return '<span class="estado estado-inactivo">Usada</span>';
                    if (fila.bienvenida_disponible) return '<span class="estado estado-activo">Disponible</span>';

                    return '<span class="text-secondary">Sin bienvenida</span>';
                },
            },
            {
                data: 'cupones_asignados',
                render: (data, type, fila) => (Number(data)
                    ? `<span class="cupones-clientes">${Number(data)} asignados · ${Number(fila.cupones_usados)} usados</span>`
                    : '<span class="text-secondary">—</span>'),
            },
            {
                data: 'id_cliente',
                orderable: false,
                searchable: false,
                render: (data) => `<div class="cupones-acciones">
                    <button type="button" class="btn-detalle" data-detalle-cliente="${Number(data)}"
                        title="Ver detalle" aria-label="Ver detalle del cliente">
                        <i class="ph ph-eye"></i>
                    </button>
                </div>`,
            },
        ],
        order: [[3, 'desc'], [0, 'asc']],
        language: {
            emptyTable: 'No hay clientes registrados.',
            zeroRecords: 'No hay clientes que coincidan con la búsqueda.',
        },
        drawCallback: function () {
            window.AnimarFilasVisibles?.(this.api());
        },
    });

    window.registrarFiltroDataTable('clientes-cupones-filtro', (settings, data, index) => {
        if (settings.nTable.id !== 'tablaClientesCupones') return true;

        const fila = settings.aoData[index]?._aData || {};

        return coincideFiltroCliente(fila);
    });

    configurarToggleColumnas('tablaClientesCupones', '#columnasClientesCupones .toggle-col');

    document.querySelectorAll('[data-filtro-cliente]').forEach((chip) => {
        chip.addEventListener('click', () => {
            filtroCliente = chip.dataset.filtroCliente;

            document.querySelectorAll('[data-filtro-cliente]').forEach((item) => {
                item.classList.toggle('is-activo', item === chip);
            });

            tablaClientes.draw();
        });
    });

    document.getElementById('buscarClienteCuponTabla')?.addEventListener('input', (evento) => {
        tablaClientes.search(window.normalizarBusqueda(evento.target.value)).draw();
    });

    document.getElementById('recargarClientesCupones')?.addEventListener('click', () => {
        tablaClientes.ajax.reload(null, false);
    });

    /* ── Cambio de vista ───────────────────────────────────────── */
    const vistaCupones = document.getElementById('vistaCupones');
    const vistaClientes = document.getElementById('vistaClientes');
    const chipsCupones = document.getElementById('chipsCupones');

    document.querySelectorAll('[data-vista-cupones]').forEach((boton) => {
        boton.addEventListener('click', () => {
            const verClientes = boton.dataset.vistaCupones === 'clientes';

            document.querySelectorAll('[data-vista-cupones]').forEach((item) => {
                item.classList.toggle('is-activo', item === boton);
                item.setAttribute('aria-selected', String(item === boton));
            });

            vistaCupones.hidden = verClientes;
            vistaClientes.hidden = !verClientes;
            if (chipsCupones) chipsCupones.hidden = verClientes;

            if (verClientes) {
                tablaClientes.columns.adjust().draw(false);
            } else {
                tabla.columns.adjust();
            }
        });
    });

    /* ── Detalle del cliente: datos, cupones y compras ─────────── */
    const modalClienteCupon = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalClienteCupon'));
    const modalConfirmarCupon = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalConfirmarClienteCupon'));
    const formCuponManual = document.getElementById('formCuponManual');
    const listaCuponesCliente = document.getElementById('clienteCuponesLista');
    const manualTipo = document.getElementById('manualTipo');

    const alternarCamposManual = () => {
        const porcentaje = manualTipo.value === 'porcentaje';

        document.getElementById('manualCategoriaCampo').hidden = !porcentaje;
        document.getElementById('manualTopeCampo').hidden = !porcentaje;
    };

    manualTipo.addEventListener('change', alternarCamposManual);
    alternarCamposManual();

    let clienteCuponId = null;
    let resolverConfirmacion = null;

    function confirmarCupon(titulo, mensaje) {
        return new Promise((resolve) => {
            resolverConfirmacion = resolve;
            document.getElementById('tituloConfirmarCupon').textContent = titulo;
            document.getElementById('mensajeConfirmarCupon').textContent = mensaje;
            modalConfirmarCupon.show();
        });
    }

    document.getElementById('btnAceptarConfirmarCupon').addEventListener('click', () => {
        modalConfirmarCupon.hide();
        resolverConfirmacion?.(true);
        resolverConfirmacion = null;
    });

    document.getElementById('modalConfirmarClienteCupon').addEventListener('hidden.bs.modal', () => {
        if (resolverConfirmacion) {
            resolverConfirmacion(false);
            resolverConfirmacion = null;
        }
    });

    const valorCuponTexto = (cupon) => (cupon.tipo_descuento_cupon === 'porcentaje'
        ? `${Number(cupon.valor_descuento_cupon)}%`
        : window.moneda(cupon.valor_descuento_cupon || 0));

    function pintarDetalleCliente(datos) {
        const cliente = datos.cliente || {};
        const cupones = datos.cupones || [];

        clienteCuponId = Number(cliente.id_cliente);

        document.getElementById('tituloClienteCupon').textContent = `Cliente: ${cliente.nombre_cliente || '—'}${cliente.estado_cliente ? '' : ' (inactivo)'}`;
        document.getElementById('clienteNombreCupon').textContent = cliente.nombre_cliente || '—';
        document.getElementById('clienteCorreoCupon').textContent = cliente.correo_cliente || '—';
        document.getElementById('clienteTelefonoCupon').textContent = cliente.telefono_cliente || '—';
        document.getElementById('clienteAltaCupon').textContent = cliente.fecha_creacion_cliente
            ? window.formatearFechaDiaHora(cliente.fecha_creacion_cliente)
            : '—';

        document.getElementById('resumenClienteCupon').innerHTML = `
            <span class="cupones-chip"><span>Compras</span><strong>${Number(cliente.compras || 0) + Number(cliente.pedidos_web || 0)}</strong></span>
            <span class="cupones-chip"><span>Total gastado</span><strong>${escapar(window.moneda(cliente.total_gastado || 0))}</strong></span>
            <span class="cupones-chip"><span>Bienvenida</span><strong>${cliente.bienvenida_usada ? 'Usada' : cliente.bienvenida_disponible ? 'Disponible' : '—'}</strong></span>
            <span class="cupones-chip"><span>Cupones</span><strong>${Number(cliente.cupones_asignados || 0)}</strong></span>
        `;

        if (!cupones.length) {
            listaCuponesCliente.innerHTML = '<div class="cupones-asignar__vacio">Este cliente no tiene cupones.</div>';
        } else {
            listaCuponesCliente.innerHTML = cupones.map((cupon) => {
                const estado = cupon.usado_cupon
                    ? '<span class="estado estado-inactivo">Usado</span>'
                    : (cupon.estado_cupon
                        ? '<span class="estado estado-activo">Disponible</span>'
                        : '<span class="estado estado-inactivo">Inactivo</span>');
                const usado = cupon.usado_cupon && cupon.fecha_uso_cupon
                    ? ` · Usado ${escapar(fechaCorta(cupon.fecha_uso_cupon))}`
                    : '';
                const categoria = cupon.categoria_cupon ? ` · Categoría: ${escapar(cupon.categoria_cupon)}` : '';
                const tope = Number(cupon.tope_descuento_cupon) > 0
                    ? ` · Tope: ${escapar(window.moneda(cupon.tope_descuento_cupon))}`
                    : '';

                return `<div class="cupones-cliente-cupon">
                    <div class="cupones-cliente-cupon__info">
                        <div class="cupones-cliente-cupon__titulo">
                            <strong>${escapar(cupon.codigo_cupon)}</strong>
                            <span>${escapar(cupon.nombre_cupon || '')}</span>
                            <span class="cupones-valor">${escapar(valorCuponTexto(cupon))}</span>
                            ${estado}
                        </div>
                        <small>Vigencia hasta ${escapar(fechaCorta(cupon.fecha_fin_cupon))} · Asignado ${escapar(fechaCorta(cupon.fecha_asignacion_cupon))}${usado}${categoria}${tope}</small>
                    </div>
                    <div class="cupones-cliente-cupon__acciones">
                        <button type="button" class="cupones-btn cupones-btn--secundario cupones-btn--xs"
                            data-extender-cupon="${Number(cupon.id_cupon)}" data-dias="7">+7 días</button>
                        <button type="button" class="cupones-btn cupones-btn--secundario cupones-btn--xs"
                            data-extender-cupon="${Number(cupon.id_cupon)}" data-dias="15">+15 días</button>
                        <button type="button" class="cupones-btn cupones-btn--secundario cupones-btn--xs"
                            data-extender-cupon="${Number(cupon.id_cupon)}" data-dias="30">+30 días</button>
                        <button type="button" class="cupones-btn cupones-btn--peligro cupones-btn--xs"
                            data-quitar-cupon="${Number(cupon.id_cupon)}">Quitar</button>
                    </div>
                </div>`;
            }).join('');
        }

        const movimientos = [
            ...(datos.ventas || []).map((venta) => ({
                tipo: 'Compra',
                numero: venta.numero_factura,
                fecha: venta.fecha_venta,
                total: venta.total_venta,
                estado: venta.estado_venta ? 'Activa' : 'Anulada',
            })),
            ...(datos.pedidos || []).map((pedido) => ({
                tipo: 'Pedido web',
                numero: pedido.numero_pedido,
                fecha: pedido.fecha_pedido,
                total: pedido.total_pedido,
                estado: pedido.estado_pedido,
            })),
        ].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));

        document.getElementById('clienteComprasLista').innerHTML = movimientos.length
            ? movimientos.map((movimiento) => `<div class="cupones-cliente-compra">
                    <span class="cupones-cliente-compra__tipo">${escapar(movimiento.tipo)}</span>
                    <strong>${escapar(movimiento.numero || '—')}</strong>
                    <span>${escapar(window.formatearFechaDiaHora(movimiento.fecha))}</span>
                    <span class="cupones-total">${escapar(window.moneda(movimiento.total || 0))}</span>
                    <span class="text-secondary">${escapar(movimiento.estado || '')}</span>
                </div>`).join('')
            : '<div class="cupones-asignar__vacio">Sin compras registradas.</div>';
    }

    async function cargarDetalleCliente(id) {
        const respuesta = await fetch(`/cupones-descuentos/clientes/${id}/detalle`, {
            headers: { Accept: 'application/json' },
        });
        const datos = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok || !datos.success) {
            throw new Error(primerError(datos) || 'No se pudo cargar el cliente.');
        }

        return datos;
    }

    async function abrirDetalleCliente(id) {
        try {
            pintarDetalleCliente(await cargarDetalleCliente(id));
            modalClienteCupon.show();
        } catch (fallo) {
            window.mostrarToast?.(fallo.message || 'No se pudo cargar el cliente.', 'danger');
        }
    }

    async function recargarDetalleCliente() {
        if (!clienteCuponId) return;

        try {
            pintarDetalleCliente(await cargarDetalleCliente(clienteCuponId));
        } catch (fallo) {
            window.mostrarToast?.(fallo.message || 'No se pudo recargar el cliente.', 'danger');
        }
    }

    $('#tablaClientesCupones').on('click', '[data-detalle-cliente]', function () {
        abrirDetalleCliente(Number(this.dataset.detalleCliente));
    });

    listaCuponesCliente.addEventListener('click', async (evento) => {
        const extender = evento.target.closest('[data-extender-cupon]');
        const quitar = evento.target.closest('[data-quitar-cupon]');

        if (extender && clienteCuponId) {
            const dias = Number(extender.dataset.dias || 7);

            extender.disabled = true;

            try {
                const respuesta = await fetch(`/cupones-descuentos/clientes/${clienteCuponId}/cupones/${extender.dataset.extenderCupon}/extender`, {
                    method: 'POST',
                    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                    body: JSON.stringify({ dias }),
                });
                const datos = await respuesta.json().catch(() => ({}));

                if (!respuesta.ok || !datos.success) {
                    throw new Error(primerError(datos) || 'No se pudo extender el cupón.');
                }

                window.mostrarToast?.(datos.mensaje || 'Vigencia extendida.', 'success');
                await recargarDetalleCliente();
                tablaClientes.ajax.reload(null, false);
            } catch (fallo) {
                window.mostrarToast?.(fallo.message || 'No se pudo extender el cupón.', 'danger');
            } finally {
                extender.disabled = false;
            }

            return;
        }

        if (quitar && clienteCuponId) {
            const confirmado = await confirmarCupon('Quitar cupón', 'El cupón se quitará a este cliente. ¿Continuar?');

            if (!confirmado) return;

            try {
                const respuesta = await fetch(`/cupones-descuentos/clientes/${clienteCuponId}/cupones/${quitar.dataset.quitarCupon}`, {
                    method: 'DELETE',
                    headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf },
                });
                const datos = await respuesta.json().catch(() => ({}));

                if (!respuesta.ok || !datos.success) {
                    throw new Error(primerError(datos) || 'No se pudo quitar el cupón.');
                }

                window.mostrarToast?.(datos.mensaje || 'Cupón quitado.', 'success');
                await recargarDetalleCliente();
                tablaClientes.ajax.reload(null, false);
            } catch (fallo) {
                window.mostrarToast?.(fallo.message || 'No se pudo quitar el cupón.', 'danger');
            }
        }
    });

    formCuponManual.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        if (!clienteCuponId) return;

        const error = document.getElementById('errorCuponManual');
        const boton = document.getElementById('btnAgregarCuponManual');
        const valor = Number(document.getElementById('manualValor').value);

        error.textContent = '';

        if (!Number.isFinite(valor) || valor <= 0) {
            error.textContent = 'Escribe un valor mayor a 0.';
            return;
        }

        boton.disabled = true;
        boton.textContent = 'Agregando…';

        try {
            const respuesta = await fetch(`/cupones-descuentos/clientes/${clienteCuponId}/cupon-manual`, {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({
                    tipo_descuento_cupon: manualTipo.value,
                    valor_descuento_cupon: valor,
                    nombre_cupon: document.getElementById('manualNombre').value.trim(),
                    categoria_cupon: document.getElementById('manualCategoria').value,
                    tope_descuento_cupon: document.getElementById('manualTope').value
                        ? Number(document.getElementById('manualTope').value)
                        : null,
                    dias: Number(document.getElementById('manualDias').value || 30),
                }),
            });
            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok || !datos.success) {
                throw new Error(primerError(datos) || 'No se pudo agregar el cupón.');
            }

            window.mostrarToast?.(datos.mensaje || 'Cupón agregado.', 'success');
            formCuponManual.reset();
            document.getElementById('manualDias').value = '30';
            alternarCamposManual();
            await recargarDetalleCliente();
            tablaClientes.ajax.reload(null, false);
        } catch (fallo) {
            error.textContent = fallo.message || 'No se pudo agregar el cupón.';
        } finally {
            boton.disabled = false;
            boton.textContent = 'Agregar cupón';
        }
    });

    $('#tablaCupones').on('click', '.btn-detalle-cupon', function () {
        abrirDetalle(Number($(this).data('id')));
    });

    $('#tablaCupones').on('click', '.btn-editar-cupon', function () {
        abrirFormularioCupon(Number($(this).data('id')));
    });

    document.getElementById('btnNuevoCupon').addEventListener('click', () => {
        abrirFormularioCupon(null);
    });

    document.getElementById('btnAsignarClientes').addEventListener('click', abrirAsignacion);

    document.getElementById('buscarClienteCupon').addEventListener('input', pintarClientesCupon);

    listaClientes.addEventListener('change', actualizarConteo);

    document.getElementById('seleccionarTodosClientes').addEventListener('change', (evento) => {
        const marcar = evento.target.checked;

        listaClientes.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach((checkbox) => {
            checkbox.checked = marcar;
        });

        actualizarConteo();
    });

    btnConfirmarAsignacion.addEventListener('click', confirmarAsignacion);

    formCupon.addEventListener('submit', guardarCupon);

    btnConfirmarAsignacion.disabled = true;

    function primerError(datos) {
        const errores = datos?.errors;

        if (!errores) return datos?.mensaje || '';

        const primero = Object.values(errores)[0];

        return Array.isArray(primero) ? primero[0] : primero;
    }

    function cargarCategorias(categorias) {
        if (categoriasCargadas) return;

        const manualCategoria = document.getElementById('manualCategoria');

        categorias.forEach((nombre) => {
            categoriaSelect.add(new Option(nombre, nombre));
            manualCategoria?.add(new Option(nombre, nombre));
        });

        categoriasCargadas = true;
    }

    function asegurarCategoria(nombre) {
        if (!nombre) {
            categoriaSelect.value = '';
            return;
        }

        const existe = [...categoriaSelect.options].some((opcion) => opcion.value === nombre);

        if (!existe) categoriaSelect.add(new Option(nombre, nombre));

        categoriaSelect.value = nombre;
    }

    function hoyISO() {
        const hoy = new Date();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');

        return `${hoy.getFullYear()}-${mes}-${dia}`;
    }

    function aplicarFecha(picker, input, valor) {
        if (picker) {
            picker.setDate(valor || null, false);
            return;
        }

        input.value = valor || '';
    }

    async function abrirFormularioCupon(id) {
        formCupon.reset();
        errorFormCupon.textContent = '';
        cuponEditandoId = id || null;
        tituloModalCupon.textContent = id ? 'Editar cupón' : 'Nuevo cupón';
        btnGuardarCupon.textContent = id ? 'Guardar cambios' : 'Guardar cupón';
        campoEstado.checked = true;
        campoUsos.value = '100';
        campoTope.value = '';
        asegurarCategoria('');
        aplicarFecha(pickerInicio, campoInicio, id ? null : hoyISO());
        aplicarFecha(pickerFin, campoFin, null);

        if (!id) {
            modalCupon.show();
            return;
        }

        try {
            const respuesta = await fetch(`/cupones-descuentos/${id}/detalle`, {
                headers: { Accept: 'application/json' },
            });
            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok || !datos.success) {
                throw new Error(datos.mensaje || 'No se pudo cargar el cupón.');
            }

            const cupon = datos.cupon || {};

            campoCodigo.value = cupon.codigo_cupon || '';
            campoNombre.value = cupon.nombre_cupon || '';
            campoTipo.value = cupon.tipo_descuento_cupon || 'porcentaje';
            campoValor.value = cupon.valor_descuento_cupon ?? '';
            campoTope.value = cupon.tope_descuento_cupon ?? '';
            asegurarCategoria(cupon.categoria_cupon);
            campoUsos.value = cupon.usos_maximos ?? 100;
            aplicarFecha(pickerInicio, campoInicio, cupon.fecha_inicio_cupon ? String(cupon.fecha_inicio_cupon).slice(0, 10) : null);
            aplicarFecha(pickerFin, campoFin, cupon.fecha_fin_cupon ? String(cupon.fecha_fin_cupon).slice(0, 10) : null);
            campoDescripcion.value = cupon.descripcion_cupon || '';
            campoEstado.checked = Boolean(cupon.estado_cupon);

            modalCupon.show();
        } catch (fallo) {
            window.mostrarToast?.(fallo.message || 'No se pudo cargar el cupón.', 'danger');
        }
    }

    async function guardarCupon(evento) {
        evento.preventDefault();

        errorFormCupon.textContent = '';

        const codigo = campoCodigo.value.trim();
        const nombre = campoNombre.value.trim();
        const valor = Number(campoValor.value);
        const usos = Number(campoUsos.value);

        if (!codigo) {
            errorFormCupon.textContent = 'El campo código es obligatorio.';
            campoCodigo.focus();
            return;
        }

        if (!nombre) {
            errorFormCupon.textContent = 'El campo nombre es obligatorio.';
            campoNombre.focus();
            return;
        }

        if (!campoValor.value || Number.isNaN(valor) || valor <= 0) {
            errorFormCupon.textContent = 'El campo valor debe ser mayor a 0.';
            campoValor.focus();
            return;
        }

        if (campoTipo.value === 'porcentaje' && valor > 100) {
            errorFormCupon.textContent = 'El porcentaje no puede ser mayor a 100.';
            campoValor.focus();
            return;
        }

        if (campoTope.value && (Number.isNaN(Number(campoTope.value)) || Number(campoTope.value) <= 0)) {
            errorFormCupon.textContent = 'El tope debe ser mayor a 0.';
            campoTope.focus();
            return;
        }

        if (!Number.isInteger(usos) || usos < 1) {
            errorFormCupon.textContent = 'El campo usos máximos debe ser mayor o igual a 1.';
            campoUsos.focus();
            return;
        }

        const datos = new FormData();

        datos.append('codigo_cupon', codigo);
        datos.append('nombre_cupon', nombre);
        datos.append('descripcion_cupon', campoDescripcion.value.trim());
        datos.append('tipo_descuento_cupon', campoTipo.value);
        datos.append('valor_descuento_cupon', String(valor));
        datos.append('categoria_cupon', categoriaSelect.value);
        datos.append('tope_descuento_cupon', campoTope.value);
        datos.append('usos_maximos', String(usos));
        datos.append('fecha_inicio_cupon', campoInicio.value);
        datos.append('fecha_fin_cupon', campoFin.value);
        datos.append('estado_cupon', campoEstado.checked ? '1' : '0');

        if (cuponEditandoId) datos.append('_method', 'PUT');

        const textoBoton = btnGuardarCupon.textContent;
        btnGuardarCupon.disabled = true;
        btnGuardarCupon.textContent = 'Guardando…';

        try {
            const respuesta = await fetch(
                cuponEditandoId ? `/cupones-descuentos/${cuponEditandoId}/actualizar` : '/cupones-descuentos/crear',
                {
                    method: 'POST',
                    headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf },
                    body: datos,
                },
            );
            const resultado = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok || !resultado.success) {
                throw new Error(primerError(resultado) || 'No se pudo guardar el cupón.');
            }

            modalCupon.hide();
            window.mostrarToast?.(resultado.mensaje || 'Cupón guardado.', 'success');
            tabla.ajax.reload(null, false);
        } catch (fallo) {
            errorFormCupon.textContent = fallo.message || 'No se pudo guardar el cupón.';
        } finally {
            btnGuardarCupon.disabled = false;
            btnGuardarCupon.textContent = textoBoton;
        }
    }

    async function abrirAsignacion() {
        if (!cuponDetalleId) return;

        document.getElementById('buscarClienteCupon').value = '';
        document.getElementById('seleccionarTodosClientes').checked = false;
        document.getElementById('tituloAsignarClientes').textContent = `Asignar clientes · ${codigoCuponActual}`;
        listaClientes.innerHTML = '<div class="cupones-asignar__vacio">Cargando clientes…</div>';
        clientesCupon = [];
        actualizarConteo();

        try {
            const respuesta = await fetch(`/cupones-descuentos/clientes?cupon=${cuponDetalleId}`, {
                headers: { Accept: 'application/json' },
            });
            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok || !datos.success) {
                throw new Error(datos.mensaje || 'No se pudieron cargar los clientes.');
            }

            const asignados = (datos.asignados || []).map(Number);

            clientesCupon = (datos.clientes || []).map((cliente) => ({
                ...cliente,
                asignado: asignados.includes(Number(cliente.id_cliente)),
            }));

            pintarClientesCupon();
            modalAsignar.show();
        } catch (fallo) {
            window.mostrarToast?.(fallo.message || 'No se pudieron cargar los clientes.', 'danger');
        }
    }

    function pintarClientesCupon() {
        const busqueda = window.normalizarBusqueda(document.getElementById('buscarClienteCupon').value);

        const visibles = clientesCupon.filter((cliente) => {
            if (!busqueda) return true;

            return window.normalizarBusqueda(`${cliente.nombre_cliente || ''} ${cliente.correo_cliente || ''}`)
                .includes(busqueda);
        });

        if (!visibles.length) {
            listaClientes.innerHTML = '<div class="cupones-asignar__vacio">No hay clientes que coincidan.</div>';
            actualizarConteo();
            return;
        }

        listaClientes.innerHTML = visibles.map((cliente) => `
            <label class="cupones-cliente${cliente.asignado ? ' is-asignado' : ''}">
                <input class="form-check-input" type="checkbox" value="${Number(cliente.id_cliente)}"
                       ${cliente.asignado ? 'checked disabled' : ''}>
                <span class="cupones-cliente__texto">
                    <strong>${escapar(cliente.nombre_cliente || 'Sin nombre')}</strong>
                    <small>${escapar(cliente.correo_cliente || 'Sin correo')}</small>
                </span>
                ${cliente.asignado ? '<span class="cupones-cliente__badge">Ya asignado</span>' : ''}
            </label>`).join('');

        actualizarConteo();
    }

    function actualizarConteo() {
        const seleccionados = listaClientes.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)').length;

        document.getElementById('conteoClientesCupon').textContent = seleccionados === 1
            ? '1 seleccionado'
            : `${seleccionados} seleccionados`;

        btnConfirmarAsignacion.disabled = seleccionados === 0;
    }

    async function confirmarAsignacion() {
        const ids = [...listaClientes.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)')]
            .map((checkbox) => Number(checkbox.value));

        if (!ids.length) {
            window.mostrarToast?.('Selecciona al menos un cliente.', 'warning');
            return;
        }

        const textoBoton = btnConfirmarAsignacion.textContent;
        btnConfirmarAsignacion.disabled = true;
        btnConfirmarAsignacion.textContent = 'Asignando…';

        try {
            const respuesta = await fetch(`/cupones-descuentos/${cuponDetalleId}/asignar`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({ clientes: ids }),
            });
            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok || !datos.success) {
                throw new Error(primerError(datos) || 'No se pudo asignar el cupón.');
            }

            modalAsignar.hide();
            window.mostrarToast?.(datos.mensaje || 'Cupón asignado.', 'success');
            tabla.ajax.reload(null, false);
            abrirDetalle(cuponDetalleId);
        } catch (fallo) {
            window.mostrarToast?.(fallo.message || 'No se pudo asignar el cupón.', 'danger');
        } finally {
            btnConfirmarAsignacion.disabled = false;
            btnConfirmarAsignacion.textContent = textoBoton;
        }
    }

    function pintarResumen(resumen) {
        document.getElementById('resumenCuponesTotal').textContent = Number(resumen.total || 0);
        document.getElementById('resumenCuponesActivos').textContent = Number(resumen.activos || 0);
        document.getElementById('resumenCuponesFidelidad').textContent = Number(resumen.fidelidad || 0);
        document.getElementById('resumenCuponesUsados').textContent = Number(resumen.usados || 0);
        document.getElementById('bienvenidaDisponibles').textContent = Number(resumen.bienvenida_disponibles || 0);
        document.getElementById('bienvenidaUsados').textContent = Number(resumen.bienvenida_usados || 0);
        document.getElementById('fidelidadCupones').textContent = Number(resumen.fidelidad || 0);
        document.getElementById('cuponesAsignaciones').textContent = Number(resumen.asignaciones || 0);
        document.getElementById('promocionesActivas').textContent = Number(resumen.promociones_activas || 0);
    }

    function abrirDetalle(id) {
        fetch(`/cupones-descuentos/${id}/detalle`, { headers: { Accept: 'application/json' } })
            .then(async (respuesta) => {
                const datos = await respuesta.json().catch(() => ({}));

                if (!respuesta.ok || !datos.success) {
                    throw new Error(datos.mensaje || 'No se pudo cargar el cupón.');
                }

                pintarDetalle(datos);
                bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDetalleCupon')).show();
            })
            .catch((fallo) => {
                window.mostrarToast?.(fallo.message || 'No se pudo cargar el cupón.', 'danger');
            });
    }

    function pintarDetalle(datos) {
        const cupon = datos.cupon || {};
        const clientes = datos.clientes || [];

        cuponDetalleId = Number(cupon.id_cupon) || null;
        codigoCuponActual = cupon.codigo_cupon || '';

        document.getElementById('tituloDetalleCupon').textContent = `Cupón: ${cupon.codigo_cupon || '—'}`;
        document.getElementById('detalleCuponCodigo').textContent = cupon.codigo_cupon || '—';
        document.getElementById('detalleCuponNombre').textContent = cupon.nombre_cupon || '—';
        document.getElementById('detalleCuponOrigen').textContent = String(cupon.codigo_cupon || '').toUpperCase().startsWith('FIEL-')
            ? 'Fidelidad · 10 pares'
            : 'Manual';
        document.getElementById('detalleCuponTipo').textContent = tipoTexto(cupon.tipo_descuento_cupon);
        document.getElementById('detalleCuponValor').textContent = valorTexto(cupon);
        document.getElementById('detalleCuponCategoria').textContent = cupon.categoria_cupon || 'Todas';
        document.getElementById('detalleCuponUsos').textContent = `${Number(cupon.usos_realizados || 0)} / ${Number(cupon.usos_maximos || 0)}`;
        document.getElementById('detalleCuponVigencia').textContent = `${fechaCorta(cupon.fecha_inicio_cupon)} → ${fechaCorta(cupon.fecha_fin_cupon)}`;
        document.getElementById('detalleCuponEstado').textContent = cupon.estado_cupon ? 'Activo' : 'Inactivo';
        document.getElementById('detalleCuponDescripcion').textContent = cupon.descripcion_cupon || '';

        const tbody = document.getElementById('detalleCuponClientes');

        if (!clientes.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary py-3">Sin clientes asignados.</td></tr>';
            return;
        }

        tbody.innerHTML = clientes.map((cliente) => `
            <tr>
                <td>${escapar(cliente.nombre_cliente || '—')}</td>
                <td>${escapar(cliente.correo_cliente || '—')}</td>
                <td>${cliente.usado_cupon
                    ? '<span class="estado estado-inactivo">Usado</span>'
                    : '<span class="estado estado-activo">Disponible</span>'}</td>
                <td>${cliente.fecha_uso_cupon ? escapar(window.formatearFechaDiaHora(cliente.fecha_uso_cupon)) : '—'}</td>
            </tr>`).join('');
    }
}
