import { imprimirFacturaTermica, imprimirFacturaEscPos } from './ImprimirFacturaTermica';

export default function initPedidosWeb() {
    const tabla = document.getElementById('tablaPedidosWeb');
    if (!tabla) return;

    document.getElementById('titulo').textContent = 'PEDIDOS WEB';

    const tbody = tabla.querySelector('tbody');
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
    const modalElemento = document.getElementById('modalDetallePedidoWeb');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElemento);

    const modalAccionElemento = document.getElementById('modalConfirmarAccionPedidoWeb');
    const modalAccion = modalAccionElemento ? bootstrap.Modal.getOrCreateInstance(modalAccionElemento) : null;
    let accionRapidaPendiente = null;


    const fechaEntregaInput = document.getElementById('fechaEntregaPedidoWeb');

    function aplicarFormatoVisible(fechas, instancia) {
        if (!instancia?.altInput) return;

        instancia.altInput.value = fechas?.length
            ? window.formatearFechaDiaHora(instancia.formatDate(fechas[0], 'Y-m-d H:i'))
            : '';
    }

    const fechaEntregaPicker = window.flatpickr
        ? window.flatpickr(fechaEntregaInput, {
            locale: 'es',
            enableTime: true,
            time_24hr: false,
            dateFormat: 'Y-m-d H:i',
            altInput: true,
            altInputClass: 'form-control form-control-sm',
            altFormat: 'd/m/Y h:i K',
            allowInput: true,
            minuteIncrement: 15,
            onChange: (fechas, _texto, instancia) => aplicarFormatoVisible(fechas, instancia),
            onClose: (fechas, _texto, instancia) => aplicarFormatoVisible(fechas, instancia),
        })
        : null;

    if (fechaEntregaPicker?.altInput) {
        fechaEntregaPicker.altInput.id = 'fechaEntregaPedidoWebVisible';
        document.querySelector('label[for="fechaEntregaPedidoWeb"]')?.setAttribute('for', 'fechaEntregaPedidoWebVisible');

        fechaEntregaPicker.altInput.addEventListener('blur', () => {
            const texto = fechaEntregaPicker.altInput.value.trim();

            if (!texto) {
                fechaEntregaPicker.clear();
                return;
            }

            const fecha = fechaEntregaPicker.parseDate(texto, 'd/m/Y h:i K');

            if (fecha) {
                fechaEntregaPicker.setDate(fecha, true);
            } else {
                aplicarFormatoVisible(fechaEntregaPicker.selectedDates, fechaEntregaPicker);
            }
        });
    }

    const ESTADOS_PEDIDO = {
        solicitado: 'Solicitado',
        aceptado: 'Aceptado',
        rechazado: 'Rechazado',
        preparando: 'Preparando',
        listo_retiro: 'Listo para retiro',
        enviado: 'En camino',
        entregado: 'Entregado',
        cancelado: 'Cancelado',
        devuelto: 'Devuelto',
    };

    const ESTADOS_PAGO = {
        pendiente: 'Pago pendiente',
        en_revision: 'Pago en revisión',
        pagado: 'Pagado',
        parcial: 'Pago parcial',
        reembolsado: 'Reembolsado',
    };

    const METODOS_PAGO = {
        efectivo: 'Efectivo (contra entrega)',
        billetera_movil: 'Billetera móvil',
        lafise: 'Transferencia Lafise',
    };

    const escapar = (valor) => $('<div>').text(valor ?? '').html();
    const estadoPedidoTexto = (estado) => ESTADOS_PEDIDO[estado] || estado || '—';
    const estadoPagoTexto = (estado) => ESTADOS_PAGO[estado] || estado || '—';

    function formatearHora(hora) {
        if (!hora) return '—';

        const [horas, minutos] = String(hora).split(':').map(Number);

        if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return String(hora);

        const periodo = horas >= 12 ? 'PM' : 'AM';
        const hora12 = horas % 12 || 12;

        return `${String(hora12).padStart(2, '0')}:${String(minutos).padStart(2, '0')} ${periodo}`;
    }

    let pedidos = [];
    let pedidoActual = null;
    let temporizadorBusqueda = null;

    function primerError(datos) {
        const errores = datos?.errors;

        if (!errores) return datos?.mensaje || '';

        const primero = Object.values(errores)[0];

        return Array.isArray(primero) ? primero[0] : primero;
    }

    function badgePedido(estado) {
        return `<span class="pedidos-estado is-${escapar(estado)}">${escapar(estadoPedidoTexto(estado))}</span>`;
    }

    function badgePago(estado) {
        return `<span class="pedidos-pago is-${escapar(estado)}">${escapar(estadoPagoTexto(estado))}</span>`;
    }

    function fechaInput(valor) {
        if (!valor) return '';

        return String(valor).replace(' ', 'T').slice(0, 16);
    }

    function valorFechaEntrega() {
        if (fechaEntregaPicker) {
            return fechaEntregaPicker.selectedDates.length ? fechaEntregaPicker.input.value : null;
        }

        return document.getElementById('fechaEntregaPedidoWeb').value || null;
    }

    function aplicarFechaEntrega(valor) {
        if (fechaEntregaPicker) {
            if (valor) {
                const fecha = new Date(String(valor).replace(' ', 'T'));
                fechaEntregaPicker.setDate(fecha, false);

                if (fechaEntregaPicker.altInput) {
                    fechaEntregaPicker.altInput.value = window.formatearFechaDiaHora(valor);
                }
            } else {
                fechaEntregaPicker.clear();
            }

            return;
        }

        document.getElementById('fechaEntregaPedidoWeb').value = fechaInput(valor);
    }

    function pintarResumen(resumen) {
        document.getElementById('resumenPedidosTotal').textContent = Number(resumen?.total || 0);
        document.getElementById('resumenPedidosSolicitados').textContent = Number(resumen?.solicitados || 0);
        document.getElementById('resumenPedidosAceptados').textContent = Number(resumen?.aceptados || 0);
        document.getElementById('resumenPedidosEnCamino').textContent = Number(resumen?.en_camino || 0);
        document.getElementById('resumenPedidosEntregados').textContent = Number(resumen?.entregados || 0);
        document.getElementById('resumenPedidosCancelados').textContent = Number(resumen?.cancelados || 0);
    }

    function marcarChipActivo(estado) {
        document.querySelectorAll('.pedidos-chip[data-estado-filtro]').forEach((chip) => {
            chip.classList.toggle('is-activo', chip.dataset.estadoFiltro === estado);
        });
    }

    function aplicarColumnas() {
        const tabla = document.getElementById('tablaPedidosWeb');
        if (!tabla) return;

        document.querySelectorAll('.toggle-col-pedido').forEach((checkbox) => {
            const columna = Number(checkbox.dataset.column) + 1;

            tabla.querySelectorAll(`thead th:nth-child(${columna}), tbody tr td:nth-child(${columna})`).forEach((celda) => {
                celda.classList.toggle('d-none', !checkbox.checked);
            });
        });
    }

    function pintarTabla() {
        tbody.replaceChildren();

        pedidos.forEach((pedido) => {
            const resumenItems = pedido.items_total > 3
                ? `${pedido.items_resumen} (+${pedido.items_total - 3})`
                : (pedido.items_resumen || '—');

            const puedeEnCamino = ['aceptado', 'preparando'].includes(pedido.estado_pedido);
            const puedeEntregar = ['enviado', 'listo_retiro'].includes(pedido.estado_pedido);

            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td class="pedidos-numero">${escapar(pedido.numero_pedido || `VTA-${pedido.id_pedido}`)}</td>
                <td class="pedidos-fecha">${escapar(window.FechaSimple(pedido.fecha_pedido))}</td>
                <td class="pedidos-cliente">${escapar(pedido.nombre_cliente)}</td>
                <td class="pedidos-items" title="${escapar(resumenItems)}"><span class="pedidos-items-texto">${escapar(resumenItems)}</span></td>
                <td class="fw-semibold">${moneda(pedido.total_pedido)}</td>
                <td>${badgePedido(pedido.estado_pedido)}</td>
                <td>${badgePago(pedido.estado_pago)}</td>
                <td class="pedidos-metodo-pago">${escapar(METODOS_PAGO[pedido.metodo_pago_web] || pedido.metodo_pago_web || '—')}</td>
                <td>${formatearHora(pedido.hora_entrega_preferida)}</td>
                <td>${escapar(window.FechaSimple(pedido.fecha_aceptado) || '—')}</td>
                <td>${escapar(window.formatearFechaDiaHora(pedido.fecha_entrega_estimada) || '—')}</td>
                <td class="text-end pedidos-acciones">
                    <button type="button" class="btn-detalle" data-pedido="${Number(pedido.id_pedido)}"
                        title="Gestionar pedido" aria-label="Gestionar pedido">
                        <i class="ph ph-eye"></i>
                    </button>
                    <button type="button" class="btn-en-camino${puedeEnCamino ? '' : ' d-none'}"
                        data-en-camino="${Number(pedido.id_pedido)}" title="Marcar en camino" aria-label="Marcar en camino">
                        <i class="ph ph-truck"></i>
                    </button>
                    <button type="button" class="btn-entregado${puedeEntregar ? '' : ' d-none'}"
                        data-entregado="${Number(pedido.id_pedido)}" title="Marcar entregado" aria-label="Marcar entregado">
                        <i class="ph ph-check-circle"></i>
                    </button>
                </td>`;
            tbody.append(fila);
        });

        document.getElementById('estadoVacioPedidos')
            .classList.toggle('d-none', pedidos.length > 0);

        aplicarColumnas();
    }

    async function cargar() {
        const error = document.getElementById('errorPedidos');
        error.classList.add('d-none');
        error.textContent = '';
        tbody.innerHTML = '<tr><td colspan="12" class="text-center text-secondary py-4">Cargando pedidos…</td></tr>';

        try {
            const parametros = new URLSearchParams({
                estado: document.getElementById('filtroEstadoPedido').value,
                pago: document.getElementById('filtroEstadoPago').value,
                buscar: document.getElementById('buscarPedidoWeb').value.trim(),
            });

            const respuesta = await fetch(`/pedidos-web/mostrar?${parametros.toString()}`, {
                headers: { Accept: 'application/json' },
            });

            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok || !datos.success) {
                throw new Error(primerError(datos) || 'No se pudieron cargar los pedidos.');
            }

            pedidos = datos.pedidos || [];
            pintarResumen(datos.resumen);
            pintarTabla();
        } catch (fallo) {
            pedidos = [];
            tbody.replaceChildren();
            error.classList.remove('d-none');
            error.textContent = fallo.message || 'Error al cargar los pedidos.';
            document.getElementById('estadoVacioPedidos').classList.add('d-none');
        }
    }

    function opcionesEstadoPago(pedido) {
        const estados = [pedido.estado_pago, ...(pedido.pagos_permitidos || [])];
        const unicos = [...new Set(estados)];

        return unicos.map((estado) => `
            <option value="${escapar(estado)}">
                ${escapar(estadoPagoTexto(estado))}${estado === pedido.estado_pago ? ' (actual)' : ''}
            </option>`).join('');
    }

    function pintarHistorial(historial) {
        const contenedor = document.getElementById('historialPedidoWeb');
        const registros = (historial || []).slice().reverse();

        if (!registros.length) {
            contenedor.innerHTML = '<tr><td colspan="4" class="text-secondary">Sin cambios registrados.</td></tr>';
            return;
        }

        contenedor.innerHTML = registros.map((registro) => {
            const cambioPedido = registro.estado_anterior
                ? `${estadoPedidoTexto(registro.estado_anterior)} → ${estadoPedidoTexto(registro.estado_nuevo)}`
                : estadoPedidoTexto(registro.estado_nuevo);
            const cambioPago = registro.estado_pago_anterior && registro.estado_pago_anterior !== registro.estado_pago_nuevo
                ? `${estadoPagoTexto(registro.estado_pago_anterior)} → ${estadoPagoTexto(registro.estado_pago_nuevo)}`
                : '—';
            const usuario = registro.nombre_usuario || (registro.origen === 'web' ? 'Cliente' : 'Sistema');

            const nota = registro.nota
                ? `<small class="text-secondary d-block">${escapar(registro.nota)}</small>`
                : '';

            return `
                <tr>
                    <td>${escapar(window.formatearFechaDiaHora(registro.fecha_cambio))}</td>
                    <td>${escapar(cambioPedido)}${nota}</td>
                    <td>${escapar(cambioPago)}</td>
                    <td>${escapar(usuario)}</td>
                </tr>`;
        }).join('');
    }

    function pintarItems(items) {
        const cuerpo = document.getElementById('itemsPedidoWeb');
        const registros = items || [];

        if (!registros.length) {
            cuerpo.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">Sin productos.</td></tr>';
            return;
        }

        cuerpo.innerHTML = registros.map((item) => {
            const variante = [item.color_producto, item.talla_producto ? `Talla ${item.talla_producto}` : '']
                .filter(Boolean)
                .join(' · ');

            return `
                <tr>
                    <td>
                        ${escapar(item.nombre_producto)}
                        ${variante ? `<span class="pedidos-producto-variante">${escapar(variante)}</span>` : ''}
                    </td>
                    <td class="text-center">${Number(item.cantidad_pedido)}</td>
                    <td class="text-end">${moneda(item.precio_unitario_pedido)}</td>
                    <td class="text-end">${moneda(item.subtotal_pedido)}</td>
                </tr>`;
        }).join('');
    }

    function solicitarCredenciales(url) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url,
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': csrf,
                },
                success: (res) => {
                    if (res.success && res.data) {
                        resolve(res.data);
                    } else {
                        reject(new Error('Sin datos de la empresa.'));
                    }
                },
                error: (xhr) => {
                    console.error(`Error AJAX credenciales (${url}):`, xhr.responseText);
                    reject(new Error('Error del servidor.'));
                },
            });
        });
    }

    async function obtenerCredencialesEmpresa() {
        try {
            return await solicitarCredenciales('/credenciales/mostrar');
        } catch (fallo) {
            return solicitarCredenciales('/credenciales/pos');
        }
    }

    function enviarPedidoWhatsapp() {
        if (!pedidoActual) {
            mostrarToast('No hay datos del pedido para enviar.', 'danger');
            return;
        }

        const telefono = String(pedidoActual.telefono_contacto || pedidoActual.telefono_cliente || '')
            .replace(/\D/g, '');

        if (!telefono) {
            mostrarToast('El pedido no tiene teléfono de contacto.', 'warning');
            return;
        }

        const numero = telefono.length === 8 ? `505${telefono}` : telefono;
        const lineas = (pedidoActual.items || []).map((item) => {
            const variante = [item.color_producto, item.talla_producto ? `Talla ${item.talla_producto}` : '']
                .filter(Boolean)
                .join(' · ');

            return `• ${item.cantidad_pedido} x ${item.nombre_producto}${variante ? ` (${variante})` : ''} - ${moneda(item.subtotal_pedido)}`;
        });

        const mensaje = [
            `*Pedido ${pedidoActual.numero_pedido || pedidoActual.id_pedido}*`,
            `Cliente: ${pedidoActual.nombre_cliente || '—'}`,
            '',
            '*Productos:*',
            ...lineas,
            '',
            `Subtotal: ${moneda(pedidoActual.subtotal_pedido)}`,
            Number(pedidoActual.descuento_pedido) > 0 ? `Descuento: -${moneda(pedidoActual.descuento_pedido)}` : null,
            Number(pedidoActual.costo_envio_pedido) > 0 ? `Envío: ${moneda(pedidoActual.costo_envio_pedido)}` : null,
            `*Total: ${moneda(pedidoActual.total_pedido)}*`,
            '',
            `Entrega: ${pedidoActual.direccion_entrega || '—'}`,
            pedidoActual.referencia_entrega ? `Referencia: ${pedidoActual.referencia_entrega}` : null,
        ].filter((linea) => linea !== null).join('\n');

        window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, '_blank');
    }

    async function imprimirPedido() {
        if (!pedidoActual) {
            mostrarToast('No hay datos del pedido para imprimir.', 'danger');
            return;
        }

        const productos = (pedidoActual.items || []).map((item) => {
            const variante = [item.color_producto, item.talla_producto ? `Talla ${item.talla_producto}` : '']
                .filter(Boolean)
                .join(' · ');

            return {
                nombre_producto: item.nombre_producto,
                descripcion_variacion: variante,
                cantidad: item.cantidad_pedido,
                precio: item.precio_unitario_pedido,
                subtotal: item.subtotal_pedido,
                impuesto: 0,
                total: item.subtotal_pedido,
            };
        });

        if (!productos.length) {
            mostrarToast('El pedido no tiene productos para imprimir.', 'danger');
            return;
        }

        const datos = {
            numero_factura: pedidoActual.numero_pedido || `VTA-${pedidoActual.id_pedido}`,
            fecha_venta: pedidoActual.fecha_pedido,
            cliente: { nombre_cliente: pedidoActual.nombre_cliente },
            metodo_pago: METODOS_PAGO[pedidoActual.metodo_pago_web] || pedidoActual.metodo_pago_web,
            subtotal_venta: pedidoActual.subtotal_pedido,
            impuesto_venta: pedidoActual.impuesto_pedido,
            descuento_venta: pedidoActual.descuento_pedido,
            costo_envio_venta: pedidoActual.costo_envio_pedido,
            total_venta: pedidoActual.total_pedido,
            productos,
        };

        try {
            await imprimirFacturaEscPos(datos);
            return;
        } catch (fallo) {
            console.error('Impresión ESC/POS falló:', fallo);
        }

        let empresa = {};

        try {
            empresa = await obtenerCredencialesEmpresa();
        } catch (fallo) {
            console.error('No se pudieron cargar los datos de la empresa:', fallo);
        }

        imprimirFacturaTermica(datos, empresa);
    }

    function abrirDetalle(id) {
        document.getElementById('errorEstadoPedidoWeb').textContent = '';

        fetch(`/pedidos-web/${id}/detalle`, { headers: { Accept: 'application/json' } })
            .then(async (respuesta) => {
                const datos = await respuesta.json().catch(() => ({}));

                if (!respuesta.ok || !datos.success) {
                    throw new Error(primerError(datos) || 'No se pudo cargar el pedido.');
                }

                const pedido = datos.pedido;
                pedidoActual = pedido;

                document.getElementById('idPedidoDetalleWeb').value = pedido.id_pedido;
                document.getElementById('numeroDetallePedidoWeb').textContent = pedido.numero_pedido || '—';
                document.getElementById('fechaDetallePedidoWeb').textContent = window.FechaSimple(pedido.fecha_pedido);
                document.getElementById('clienteDetallePedidoWeb').textContent = pedido.nombre_cliente || '—';
                document.getElementById('telefonoDetallePedidoWeb').textContent = pedido.telefono_contacto || pedido.telefono_cliente || '—';
                document.getElementById('metodoDetallePedidoWeb').textContent = METODOS_PAGO[pedido.metodo_pago_web] || pedido.metodo_pago_web || '—';
                document.getElementById('subtotalDetallePedidoWeb').textContent = moneda(pedido.subtotal_pedido);
                document.getElementById('descuentoDetallePedidoWeb').textContent = moneda(pedido.descuento_pedido);
                document.getElementById('envioDetallePedidoWeb').textContent = moneda(pedido.costo_envio_pedido);
                document.getElementById('totalDetallePedidoWeb').textContent = moneda(pedido.total_pedido);
                document.getElementById('estadoDetallePedidoWeb').textContent = estadoPedidoTexto(pedido.estado_pedido);
                document.getElementById('pagoDetallePedidoWeb').textContent = estadoPagoTexto(pedido.estado_pago);
                document.getElementById('direccionDetallePedidoWeb').textContent = pedido.direccion_entrega || '—';
                document.getElementById('referenciaDetallePedidoWeb').textContent = pedido.referencia_entrega || '—';
                document.getElementById('aceptadoDetallePedidoWeb').textContent = window.FechaSimple(pedido.fecha_aceptado) || '—';
                document.getElementById('preferidaDetallePedidoWeb').textContent = formatearHora(pedido.hora_entrega_preferida);
                document.getElementById('entregaDetallePedidoWeb').textContent = window.formatearFechaDiaHora(pedido.fecha_entrega_estimada) || '—';
                document.getElementById('horaPreferidaFormPedidoWeb').textContent = formatearHora(pedido.hora_entrega_preferida);

                document.getElementById('selectEstadoPagoWeb').innerHTML = opcionesEstadoPago(pedido);
                aplicarFechaEntrega(pedido.fecha_entrega_estimada);
                if (fechaEntregaPicker) fechaEntregaPicker.close();
                document.getElementById('notaPedidoWeb').value = pedido.nota_negocio || '';

                const esEfectivo = pedido.metodo_pago_web === 'efectivo';
                document.getElementById('grupoEstadoPagoWeb').classList.toggle('d-none', esEfectivo);

                const btnPagado = document.getElementById('btnMarcarPagadoPedidoWeb');
                if (btnPagado) {
                    const puedeMarcarPagado = esEfectivo
                        && pedido.estado_pago !== 'pagado'
                        && !pedido.id_venta;
                    btnPagado.classList.toggle('d-none', !puedeMarcarPagado);
                    btnPagado.disabled = !puedeMarcarPagado;
                }

                const transiciones = pedido.transiciones || [];
                document.getElementById('btnAceptarPedidoWeb').disabled = pedido.estado_pedido !== 'solicitado';
                document.getElementById('btnCancelarPedidoWeb').disabled = !transiciones.includes('cancelado');

                const selectEstado = document.getElementById('selectEstadoPedidoWeb');
                if (selectEstado) {
                    selectEstado.innerHTML = [
                        `<option value="${escapar(pedido.estado_pedido)}" selected>${escapar(estadoPedidoTexto(pedido.estado_pedido))} (actual)</option>`,
                        ...transiciones.map((estado) => `<option value="${escapar(estado)}">${escapar(estadoPedidoTexto(estado))}</option>`),
                    ].join('');
                    selectEstado.disabled = transiciones.length === 0;
                }

                pintarItems(pedido.items);
                pintarHistorial(pedido.historial);
                modal.show();
            })
            .catch((fallo) => {
                mostrarToast(fallo.message || 'No se pudo cargar el pedido.', 'danger');
            });
    }

    async function guardarCambios(payload) {
        if (!pedidoActual) return;

        const error = document.getElementById('errorEstadoPedidoWeb');
        const boton = document.getElementById('btnGuardarPedidoWeb');

        error.textContent = '';
        boton.disabled = true;

        try {
            const respuesta = await fetch(`/pedidos-web/${pedidoActual.id_pedido}/estado`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify(payload),
            });

            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok || !datos.success) {
                throw new Error(primerError(datos) || 'No se pudo actualizar el pedido.');
            }

            modal.hide();
            mostrarToast(datos.mensaje || 'Pedido actualizado.', 'success');
            await cargar();
        } catch (fallo) {
            error.textContent = fallo.message || 'No se pudo actualizar el pedido.';
        } finally {
            boton.disabled = false;
        }
    }

    async function ejecutarCambioEstadoRapido(idPedido, estado) {
        try {
            const respuesta = await fetch(`/pedidos-web/${idPedido}/estado`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({ estado_pedido: estado }),
            });

            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok || !datos.success) {
                throw new Error(primerError(datos) || 'No se pudo actualizar el pedido.');
            }

            mostrarToast(datos.mensaje || 'Pedido actualizado.', 'success');
            await cargar();
        } catch (fallo) {
            mostrarToast(fallo.message || 'No se pudo actualizar el pedido.', 'danger');
        }
    }

    function confirmarCambioEstadoRapido(idPedido, estado, titulo, mensaje) {
        if (!modalAccion) {
            if (window.confirm(mensaje)) ejecutarCambioEstadoRapido(idPedido, estado);
            return;
        }

        accionRapidaPendiente = { idPedido, estado };
        document.getElementById('tituloConfirmarAccionPedidoWeb').textContent = titulo;
        document.getElementById('mensajeConfirmarAccionPedidoWeb').textContent = mensaje;
        modalAccion.show();
    }

    document.getElementById('confirmarAccionPedidoWeb')?.addEventListener('click', () => {
        if (!accionRapidaPendiente) return;

        const { idPedido, estado } = accionRapidaPendiente;
        accionRapidaPendiente = null;
        modalAccion?.hide();
        ejecutarCambioEstadoRapido(idPedido, estado);
    });

    modalAccionElemento?.addEventListener('hidden.bs.modal', () => {
        accionRapidaPendiente = null;
    });

    document.getElementById('formEstadoPedidoWeb').addEventListener('submit', (evento) => {
        evento.preventDefault();

        const esEfectivo = pedidoActual?.metodo_pago_web === 'efectivo';

        const payload = {
            fecha_entrega_estimada: valorFechaEntrega(),
            nota_negocio: document.getElementById('notaPedidoWeb').value.trim() || null,
        };

        if (!esEfectivo) {
            payload.estado_pago = document.getElementById('selectEstadoPagoWeb').value;
        }

        const estadoSeleccionado = document.getElementById('selectEstadoPedidoWeb')?.value;

        if (estadoSeleccionado && estadoSeleccionado !== pedidoActual?.estado_pedido) {
            if (['cancelado', 'rechazado'].includes(estadoSeleccionado) && !payload.nota_negocio) {
                mostrarToast('Escribe el motivo en Nota / motivo.', 'warning');
                document.getElementById('notaPedidoWeb').focus();
                return;
            }

            if (estadoSeleccionado === 'entregado'
                && !window.confirm('¿Confirmas que el pedido fue entregado al cliente?')) {
                return;
            }

            payload.estado_pedido = estadoSeleccionado;
        }

        guardarCambios(payload);
    });

    document.getElementById('btnAceptarPedidoWeb').addEventListener('click', () => {
        const esEfectivo = pedidoActual?.metodo_pago_web === 'efectivo';
        const mensaje = esEfectivo
            ? '¿Aceptar el pedido? El pago se cobrará al entregar.'
            : '¿Confirmas que el pago llegó y deseas aceptar el pedido?';

        if (!window.confirm(mensaje)) return;

        const payload = {
            estado_pedido: 'aceptado',
            fecha_entrega_estimada: valorFechaEntrega(),
            nota_negocio: document.getElementById('notaPedidoWeb').value.trim() || null,
        };

        if (!esEfectivo) {
            payload.estado_pago = 'pagado';
        }

        guardarCambios(payload);
    });

    document.getElementById('btnCancelarPedidoWeb').addEventListener('click', () => {
        const motivo = document.getElementById('notaPedidoWeb').value.trim();

        if (!motivo) {
            mostrarToast('Escribe el motivo de la cancelación en Nota / motivo.', 'warning');
            document.getElementById('notaPedidoWeb').focus();
            return;
        }

        guardarCambios({
            estado_pedido: 'cancelado',
            nota_negocio: motivo,
        });
    });

    document.getElementById('btnImprimirPedidoWeb').addEventListener('click', imprimirPedido);

    document.getElementById('btnMarcarPagadoPedidoWeb').addEventListener('click', () => {
        const esEfectivo = pedidoActual?.metodo_pago_web === 'efectivo';
        if (!esEfectivo) return;

        if (!window.confirm('¿Confirmas que el pedido fue pagado en efectivo? Se descontará el stock y se registrará el ingreso en caja.')) return;

        guardarCambios({
            estado_pago: 'pagado',
            fecha_entrega_estimada: valorFechaEntrega(),
            nota_negocio: document.getElementById('notaPedidoWeb').value.trim() || null,
        });
    });
    document.getElementById('btnWhatsappPedidoWeb').addEventListener('click', enviarPedidoWhatsapp);

    tabla.addEventListener('click', (evento) => {
        const botonEnCamino = evento.target.closest('[data-en-camino]');

        if (botonEnCamino) {
            confirmarCambioEstadoRapido(
                Number(botonEnCamino.dataset.enCamino),
                'enviado',
                'Marcar en camino',
                '¿Marcar este pedido en camino? El cliente verá el seguimiento actualizado.'
            );
            return;
        }

        const botonEntregado = evento.target.closest('[data-entregado]');

        if (botonEntregado) {
            confirmarCambioEstadoRapido(
                Number(botonEntregado.dataset.entregado),
                'entregado',
                'Marcar entregado',
                '¿Confirmas que el paquete fue entregado al cliente?'
            );
            return;
        }

        const boton = evento.target.closest('[data-pedido]');
        if (!boton) return;

        abrirDetalle(Number(boton.dataset.pedido));
    });

    document.querySelectorAll('.pedidos-chip[data-estado-filtro]').forEach((chip) => {
        chip.addEventListener('click', () => {
            const estado = chip.dataset.estadoFiltro;
            document.getElementById('filtroEstadoPedido').value = estado;
            marcarChipActivo(estado);
            cargar();
        });
    });

    document.getElementById('filtroEstadoPedido').addEventListener('change', (evento) => {
        marcarChipActivo(evento.target.value);
        cargar();
    });

    document.getElementById('filtroEstadoPago').addEventListener('change', cargar);
    document.getElementById('recargarPedidosWeb').addEventListener('click', cargar);

    document.getElementById('buscarPedidoWeb').addEventListener('input', () => {
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(cargar, 350);
    });

    document.querySelectorAll('.toggle-col-pedido').forEach((checkbox) => {
        checkbox.addEventListener('change', aplicarColumnas);
    });

    cargar();
}
