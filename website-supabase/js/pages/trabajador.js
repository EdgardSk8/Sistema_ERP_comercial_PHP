/* ╔══════════════════════════════════════════════════════════════╗
   ║  Panel del trabajador · pedidos de delivery                   ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    const porId = (id) => document.getElementById(id);

    const panel = porId('trabajadorPanel');
    const cargando = porId('trabajadorCargando');
    const bloqueo = porId('trabajadorBloqueo');

    if (!panel || !cargando || !bloqueo) return;

    const listaDisponibles = porId('listaDisponibles');
    const listaAsignados = porId('listaAsignados');
    const vacioDisponibles = porId('vacioDisponibles');
    const vacioAsignados = porId('vacioAsignados');
    const switchDisponible = porId('trabajadorDisponible');
    const alertaDisponibilidad = porId('alertaDisponibilidad');

    const ESTADOS = {
        aceptado: { texto: 'Aceptado', clase: 'aceptado', icono: 'bi-check2' },
        preparando: { texto: 'Preparando', clase: 'aceptado', icono: 'bi-box-seam' },
        enviado: { texto: 'En camino', clase: 'enviado', icono: 'bi-truck' },
        listo_retiro: { texto: 'Listo para retiro', clase: 'aceptado', icono: 'bi-box-seam' },
        entregado: { texto: 'Entregado', clase: 'entregado', icono: 'bi-check2-circle' },
        cancelado: { texto: 'Cancelado', clase: 'cancelado', icono: 'bi-x-circle' },
        devuelto: { texto: 'Devuelto', clase: 'cancelado', icono: 'bi-arrow-counterclockwise' },
        rechazado: { texto: 'Rechazado', clase: 'cancelado', icono: 'bi-x-circle' },
    };

    const METODOS_PAGO = {
        efectivo: 'Efectivo contra entrega',
        lafise: 'Transferencia Lafise',
        billetera_movil: 'Billetera móvil',
    };

    let trabajador = null;
    let disponible = false;
    let cargandoPedidos = false;
    let vistaActual = 'disponibles';

    const escapar = window.TiendaUtil.escapar;

    const moneda = (valor) => `C$ ${Number(valor || 0).toLocaleString('es-NI', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

    const fechaHora = (valor) => {
        if (!valor) return '—';
        const fecha = new Date(String(valor).replace(' ', 'T'));

        if (Number.isNaN(fecha.getTime())) return '—';

        return fecha.toLocaleString('es-NI', {
            day: '2-digit',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const fechaPedido = (valor) => {
        if (!valor) return '—';
        const fecha = new Date(String(valor).replace(' ', 'T'));

        if (Number.isNaN(fecha.getTime())) return '—';

        const hoy = new Date();
        const mismoDia = fecha.toDateString() === hoy.toDateString();

        return mismoDia
            ? `Hoy, ${fecha.toLocaleTimeString('es-NI', { hour: 'numeric', minute: '2-digit' })}`
            : fecha.toLocaleString('es-NI', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });
    };

    const hora = (valor) => {
        if (!valor) return '';

        const [horas, minutos] = String(valor).split(':').map(Number);

        if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return String(valor);

        const periodo = horas >= 12 ? 'PM' : 'AM';

        return `${horas % 12 || 12}:${String(minutos).padStart(2, '0')} ${periodo}`;
    };

    const telefono = (valor) => String(valor ?? '').replace(/\D/g, '');

    const whatsapp = (valor) => {
        const numero = telefono(valor);

        if (!numero) return '';

        return numero.length === 8 ? `505${numero}` : numero;
    };

    const colorSeguro = (valor) => {
        const color = String(valor ?? '').trim();

        return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : '#1f6f55';
    };

    const iniciales = (nombre) => String(nombre ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join('') || 'TR';

    const avatar = (persona, clase = '') => {
        const foto = String(persona?.foto_perfil ?? '').trim();
        const fotoValida = /^https?:\/\//i.test(foto) || (foto.startsWith('/') && !foto.startsWith('//'));

        if (fotoValida) {
            return `<img class="${clase}" src="${escapar(foto)}" alt="" loading="lazy"
                onerror="this.remove()">`;
        }

        return `<span class="${clase}">${escapar(iniciales(persona?.nombre || persona?.nombre_trabajador))}</span>`;
    };

    const estadoDe = (pedido) => ESTADOS[pedido?.estado_pedido] || {
        texto: pedido?.estado_pedido || '—',
        clase: 'aceptado',
        icono: 'bi-clock',
    };

    const badgeEstado = (pedido) => {
        const estado = estadoDe(pedido);

        return `<span class="trabajador-badge trabajador-badge--${estado.clase}">
            <i class="bi ${estado.icono}" aria-hidden="true"></i>${escapar(estado.texto)}
        </span>`;
    };

    const pagoPedido = (pedido) => {
        if (pedido?.estado_pago === 'pagado') {
            return { texto: 'Pagado', clase: '' };
        }

        if (pedido?.metodo_pago_web === 'efectivo') {
            return { texto: `Cobrar ${moneda(pedido.total_pedido)}`, clase: ' trabajador-pago--cobrar' };
        }

        const metodo = METODOS_PAGO[pedido?.metodo_pago_web];

        return {
            texto: metodo ? `Pago pendiente · ${metodo}` : 'Pago pendiente',
            clase: '',
        };
    };

    function mostrarToast(mensaje, tipo = 'success') {
        const contenedor = porId('trabajadorToasts');

        if (!contenedor) return;

        const toast = document.createElement('div');
        toast.className = `trabajador-toast${tipo === 'error' ? ' trabajador-toast--error' : ''}`;
        toast.innerHTML = `<i class="bi ${tipo === 'error' ? 'bi-exclamation-triangle' : 'bi-check2-circle'}" aria-hidden="true"></i>
            <span>${escapar(mensaje)}</span>`;

        contenedor.append(toast);
        window.setTimeout(() => toast.remove(), 4200);
    }

    function mostrarBloqueo(titulo, mensaje, enlace = '/tienda/perfil#trabajo') {
        cargando.hidden = true;
        panel.hidden = true;
        bloqueo.hidden = false;

        porId('trabajadorBloqueoTitulo').textContent = titulo;
        porId('trabajadorBloqueoTexto').textContent = mensaje;

        const boton = porId('trabajadorBloqueoEnlace');
        boton.href = enlace;
        boton.textContent = 'Ir a configuración';
    }

    function renderHero() {
        const nombre = trabajador?.nombre_trabajador || 'Trabajador';
        const color = colorSeguro(trabajador?.color_usuario);
        const avatarContenedor = porId('trabajadorAvatar');

        avatarContenedor.style.setProperty('--color-trabajador', color);
        avatarContenedor.innerHTML = avatar({
            ...trabajador,
            nombre,
        }, 'trabajador-hero__avatar-img');

        porId('trabajadorNombre').textContent = nombre;
        porId('trabajadorVehiculo').textContent = [
            trabajador?.vehiculo_marca,
            trabajador?.vehiculo_modelo,
            trabajador?.vehiculo_anio,
        ].filter(Boolean).join(' ') || 'Vehículo por confirmar';

        const placa = porId('trabajadorPlaca');
        placa.innerHTML = trabajador?.vehiculo_placa
            ? `<i class="bi bi-credit-card-2-front" aria-hidden="true"></i> Placa ${escapar(trabajador.vehiculo_placa)}`
            : '';

        const colorChip = porId('trabajadorColor');
        colorChip.innerHTML = trabajador?.color_usuario
            ? `<span class="trabajador-chip__punto" style="background:${escapar(color)}"></span> Color de identificación`
            : '';

        const comision = Number(trabajador?.porcentaje_comision);
        const ganancia = Number.isFinite(comision) ? Math.max(0, 100 - comision) : null;
        porId('trabajadorGanancia').textContent = ganancia === null
            ? 'Comisión por confirmar'
            : `Tu ganancia: ${ganancia.toFixed(0)}%`;

        switchDisponible.checked = disponible;
        actualizarDisponibilidadUI();
    }

    function actualizarDisponibilidadUI() {
        porId('trabajadorDisponibilidadTexto').textContent = disponible ? 'Conectado' : 'Desconectado';
        alertaDisponibilidad.hidden = disponible;

        document.querySelectorAll('[data-aceptar]').forEach((boton) => {
            boton.disabled = !disponible;
            boton.title = disponible ? '' : 'Activa tu disponibilidad para aceptar pedidos.';
        });
    }

    function renderCliente(pedido) {
        const cliente = pedido?.cliente || {};
        const nombre = pedido?.nombre_recibe || cliente.nombre || 'Cliente';
        const telefonoCliente = telefono(pedido?.telefono_contacto || cliente.telefono);
        const whatsappCliente = whatsapp(pedido?.telefono_contacto || cliente.telefono);
        const nombreBase = String(cliente.nombre || '').trim();
        const recibe = nombreBase && nombreBase !== nombre ? `Recibe: ${nombreBase}` : '';

        return `
            <div class="trabajador-cliente">
                <span class="trabajador-cliente__icono" aria-hidden="true"><i class="bi bi-person"></i></span>
                <div class="trabajador-cliente__datos">
                    <strong>${escapar(nombre)}</strong>
                    <span>${escapar(recibe || (telefonoCliente ? telefonoCliente : 'Datos de contacto del pedido'))}</span>
                </div>
                <div class="trabajador-cliente__acciones">
                    ${telefonoCliente ? `<a href="tel:${escapar(telefonoCliente)}" aria-label="Llamar al cliente" title="Llamar"><i class="bi bi-telephone"></i></a>` : ''}
                    ${whatsappCliente ? `<a href="https://wa.me/${escapar(whatsappCliente)}" target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp" title="WhatsApp"><i class="bi bi-whatsapp"></i></a>` : ''}
                </div>
            </div>`;
    }

    function renderItems(pedido) {
        const items = Array.isArray(pedido?.items) ? pedido.items : [];

        if (!items.length) return '';

        return `<ul class="trabajador-items">
            ${items.map((item) => {
                const variantes = [item.color, item.talla ? `Talla ${item.talla}` : '']
                    .filter(Boolean)
                    .join(' · ');

                return `<li>
                    <span>${Number(item.cantidad || 0)} × ${escapar(item.producto)}${variantes ? ` (${escapar(variantes)})` : ''}</span>
                    <span>${moneda(item.subtotal)}</span>
                </li>`;
            }).join('')}
        </ul>`;
    }

    function renderPedido(pedido, tipo) {
        const esAsignado = tipo === 'asignado';
        const estado = estadoDe(pedido);
        const numero = pedido?.numero_pedido || `VTA-${String(pedido?.id_pedido || '').padStart(5, '0')}`;
        const pago = ['cancelado', 'rechazado', 'devuelto'].includes(pedido?.estado_pedido)
            ? { texto: 'Sin cobro', clase: '' }
            : pagoPedido(pedido);
        const comision = Number(trabajador?.porcentaje_comision);
        const costoEnvio = Number(pedido?.costo_envio_pedido);
        const ganancia = Number.isFinite(comision) && costoEnvio > 0
            ? costoEnvio * (100 - Math.min(100, Math.max(0, comision))) / 100
            : null;
        const km = Number(pedido?.distancia_km);
        const distancia = Number.isFinite(km) && km > 0 ? `${km.toFixed(1)} km` : '';
        const lat = Number(pedido?.latitud_entrega);
        const lng = Number(pedido?.longitud_entrega);
        const mapa = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
            ? `https://www.google.com/maps?q=${lat},${lng}`
            : '';
        const horaPreferida = hora(pedido?.hora_entrega_preferida);
        const entregaEstimada = pedido?.fecha_entrega_estimada
            ? fechaHora(pedido.fecha_entrega_estimada)
            : '';
        const accion = esAsignado
            ? (() => {
                if (['aceptado', 'preparando'].includes(pedido?.estado_pedido)) {
                    return `<button type="button" class="trabajador-accion" data-en-camino="${Number(pedido.id_pedido)}">
                        <i class="bi bi-truck" aria-hidden="true"></i> Marcar en camino
                    </button>`;
                }

                if (pedido?.estado_pedido === 'enviado') {
                    return `<span class="trabajador-acciones">
                        <button type="button" class="trabajador-accion" data-entregado="${Number(pedido.id_pedido)}">
                            <i class="bi bi-check2-circle" aria-hidden="true"></i> Marcar entregado
                        </button>
                        <button type="button" class="trabajador-accion trabajador-accion--devolver" data-devuelto="${Number(pedido.id_pedido)}">
                            <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> No recibido
                        </button>
                    </span>`;
                }

                if (pedido?.estado_pedido === 'entregado') {
                    return '<span class="trabajador-accion trabajador-accion--secundaria"><i class="bi bi-check2-circle" aria-hidden="true"></i> Entregado</span>';
                }

                return `<span class="trabajador-accion trabajador-accion--secundaria">${escapar(estado.texto)}</span>`;
            })()
            : `<button type="button" class="trabajador-accion" data-aceptar="${Number(pedido.id_pedido)}"
                    ${disponible ? '' : 'disabled'} title="${disponible ? '' : 'Activa tu disponibilidad para aceptar pedidos.'}">
                    <i class="bi bi-hand-index-thumb" aria-hidden="true"></i> Aceptar pedido
               </button>`;

        const fechas = [
            horaPreferida ? `Hora preferida: ${horaPreferida}` : '',
            entregaEstimada ? `Entrega estimada: ${entregaEstimada}` : '',
            esAsignado && pedido?.fecha_aceptado_trabajador ? `Tomado: ${fechaHora(pedido.fecha_aceptado_trabajador)}` : '',
            esAsignado && pedido?.fecha_enviado ? `En camino: ${fechaHora(pedido.fecha_enviado)}` : '',
            esAsignado && pedido?.fecha_entregado ? `Entregado: ${fechaHora(pedido.fecha_entregado)}` : '',
        ].filter(Boolean);

        return `
            <article class="trabajador-pedido trabajador-pedido--${escapar(estado.clase)}" data-pedido="${Number(pedido.id_pedido)}">
                <header class="trabajador-pedido__cabecera">
                    <div>
                        <strong class="trabajador-pedido__numero">${escapar(numero)}</strong>
                        <span class="trabajador-pedido__fecha">${fechaPedido(pedido.fecha_pedido)}</span>
                        ${esAsignado ? `<div style="margin-top:6px">${badgeEstado(pedido)}</div>` : ''}
                    </div>
                    <strong class="trabajador-pedido__total">${moneda(pedido.total_pedido)}</strong>
                </header>

                ${renderCliente(pedido)}

                <p class="trabajador-direccion">
                    <i class="bi bi-geo-alt" aria-hidden="true"></i>
                    <span>
                        <strong>${escapar(pedido?.direccion_entrega || 'Dirección por confirmar')}</strong>
                        ${pedido?.referencia_entrega ? `<span>${escapar(pedido.referencia_entrega)}</span>` : ''}
                        ${distancia ? `<span class="trabajador-direccion__km">${distancia}</span>` : ''}
                    </span>
                    ${mapa ? `<a class="trabajador-mapa" href="${escapar(mapa)}" target="_blank" rel="noopener noreferrer">Ver mapa</a>` : ''}
                </p>

                ${pedido?.nota_cliente ? `<p class="trabajador-nota"><i class="bi bi-chat-left-text" aria-hidden="true"></i><span>${escapar(pedido.nota_cliente)}</span></p>` : ''}
                ${renderItems(pedido)}

                ${ganancia !== null
                    ? `<div class="trabajador-ganancia"><i class="bi bi-cash-coin" aria-hidden="true"></i> Tu ganancia por este envío: <strong>${moneda(ganancia)}</strong></div>`
                    : ''}

                ${fechas.length ? `<div class="trabajador-pedido__fecha">${escapar(fechas.join(' · '))}</div>` : ''}

                <footer class="trabajador-pedido__pie">
                    <span class="trabajador-pago${pago.clase}"><i class="bi bi-wallet2" aria-hidden="true"></i> ${escapar(pago.texto)}</span>
                    ${accion}
                </footer>
            </article>`;
    }

    function renderListas() {
        const disponibles = Array.isArray(pedidosActuales.disponibles) ? pedidosActuales.disponibles : [];
        const asignados = Array.isArray(pedidosActuales.asignados) ? pedidosActuales.asignados : [];
        const activos = asignados.filter((pedido) => ['aceptado', 'preparando', 'enviado'].includes(pedido.estado_pedido));
        const entregados = asignados.filter((pedido) => pedido.estado_pedido === 'entregado');

        listaDisponibles.innerHTML = disponibles.map((pedido) => renderPedido(pedido, 'disponible')).join('');
        listaAsignados.innerHTML = asignados.map((pedido) => renderPedido(pedido, 'asignado')).join('');

        vacioDisponibles.hidden = disponibles.length > 0;
        vacioAsignados.hidden = asignados.length > 0;

        porId('statDisponibles').textContent = disponibles.length;
        porId('statAsignados').textContent = activos.length;
        porId('statEntregados').textContent = entregados.length;
        porId('badgeDisponibles').textContent = disponibles.length;
        porId('badgeAsignados').textContent = asignados.length;

        actualizarDisponibilidadUI();
    }

    let pedidosActuales = { disponibles: [], asignados: [] };

    async function cargarPedidos(silencioso = false) {
        if (cargandoPedidos) return;

        cargandoPedidos = true;
        const botonRefrescar = document.querySelector('[data-refrescar]');
        botonRefrescar?.classList.add('is-cargando');

        if (!silencioso && !pedidosActuales.disponibles.length && !pedidosActuales.asignados.length) {
            listaDisponibles.innerHTML = '<p class="trabajador-vacio">Cargando pedidos…</p>';
            listaAsignados.innerHTML = '<p class="trabajador-vacio">Cargando pedidos…</p>';
        }

        try {
            const respuesta = await window.TiendaAPI.get('/tienda/api/trabajador/pedidos');

            disponible = Boolean(respuesta?.disponible);
            pedidosActuales = {
                disponibles: respuesta?.disponibles || [],
                asignados: respuesta?.asignados || [],
            };

            if (switchDisponible && document.activeElement !== switchDisponible) {
                switchDisponible.checked = disponible;
            }

            renderListas();
        } catch (error) {
            if (!silencioso) {
                const mensaje = error?.message || 'No se pudieron cargar los pedidos.';

                listaDisponibles.innerHTML = `<p class="trabajador-error">${escapar(mensaje)}</p>`;
                listaAsignados.innerHTML = `<p class="trabajador-error">${escapar(mensaje)}</p>`;
            }

            mostrarToast(error?.message || 'No se pudieron cargar los pedidos.', 'error');
        } finally {
            cargandoPedidos = false;
            botonRefrescar?.classList.remove('is-cargando');
        }
    }

    function cambiarVista(vista) {
        vistaActual = vista === 'asignados' ? 'asignados' : 'disponibles';

        document.querySelectorAll('.trabajador-tab').forEach((boton) => {
            const activo = boton.dataset.vista === vistaActual;
            boton.classList.toggle('is-active', activo);
            boton.setAttribute('aria-selected', activo ? 'true' : 'false');
        });

        porId('vistaDisponibles').hidden = vistaActual !== 'disponibles';
        porId('vistaAsignados').hidden = vistaActual !== 'asignados';
    }

    async function cambiarDisponibilidad() {
        const valor = switchDisponible.checked;
        switchDisponible.disabled = true;

        try {
            const respuesta = await window.TiendaAPI.put('/tienda/api/trabajador/disponibilidad', {
                disponible: valor,
            });

            disponible = Boolean(respuesta?.trabajador?.disponible ?? valor);
            switchDisponible.checked = disponible;
            actualizarDisponibilidadUI();
            mostrarToast(disponible ? 'Estás disponible para recibir pedidos.' : 'Quedaste desconectado.');
        } catch (error) {
            switchDisponible.checked = !valor;
            mostrarToast(error?.message || 'No se pudo cambiar tu disponibilidad.', 'error');
        } finally {
            switchDisponible.disabled = false;
        }
    }

    async function aceptarPedido(boton) {
        const id = Number(boton.dataset.aceptar);

        if (!id) return;

        const confirmado = await tiendaConfirmar({
            titulo: '¿Tomar este pedido?',
            mensaje: 'Revisa que puedas cubrir la entrega antes de aceptarlo.',
            textoAceptar: 'Aceptar pedido',
        });

        if (!confirmado) return;

        boton.disabled = true;
        boton.innerHTML = '<i class="bi bi-hourglass-split" aria-hidden="true"></i> Aceptando…';

        try {
            await window.TiendaAPI.post(`/tienda/api/trabajador/pedidos/${id}/aceptar`);
            mostrarToast('Pedido aceptado. Ya puedes ver los datos del cliente.');
            cambiarVista('asignados');
            await cargarPedidos(true);
        } catch (error) {
            mostrarToast(error?.message || 'No se pudo aceptar el pedido.', 'error');
            boton.disabled = false;
            boton.innerHTML = '<i class="bi bi-hand-index-thumb" aria-hidden="true"></i> Aceptar pedido';
        }
    }

    async function marcarEnCamino(boton) {
        const id = Number(boton.dataset.enCamino);

        if (!id) return;

        const confirmado = await tiendaConfirmar({
            titulo: '¿Ya sales con este pedido?',
            mensaje: 'El cliente verá el pedido «En camino».',
            textoAceptar: 'Sí, en camino',
        });

        if (!confirmado) return;

        boton.disabled = true;
        boton.innerHTML = '<i class="bi bi-hourglass-split" aria-hidden="true"></i> Actualizando…';

        try {
            await window.TiendaAPI.put(`/tienda/api/trabajador/pedidos/${id}/estado`, { estado: 'enviado' });
            mostrarToast('Pedido marcado en camino.');
            await cargarPedidos(true);
        } catch (error) {
            mostrarToast(error?.message || 'No se pudo actualizar el pedido.', 'error');
            boton.disabled = false;
            boton.innerHTML = '<i class="bi bi-truck" aria-hidden="true"></i> Marcar en camino';
        }
    }

    async function marcarEntregado(boton) {
        const id = Number(boton.dataset.entregado);

        if (!id) return;

        const confirmado = await tiendaConfirmar({
            titulo: '¿Entregaste este pedido?',
            mensaje: 'Confirma que el cliente recibió el pedido.',
            textoAceptar: 'Sí, entregado',
        });

        if (!confirmado) return;

        boton.disabled = true;
        boton.innerHTML = '<i class="bi bi-hourglass-split" aria-hidden="true"></i> Actualizando…';

        try {
            await window.TiendaAPI.put(`/tienda/api/trabajador/pedidos/${id}/estado`, { estado: 'entregado' });
            mostrarToast('Pedido marcado como entregado.');
            await cargarPedidos(true);
        } catch (error) {
            mostrarToast(error?.message || 'No se pudo actualizar el pedido.', 'error');
            boton.disabled = false;
            boton.innerHTML = '<i class="bi bi-check2-circle" aria-hidden="true"></i> Marcar entregado';
        }
    }

    async function marcarDevuelto(boton) {
        const id = Number(boton.dataset.devuelto);

        if (!id) return;

        const confirmado = await tiendaConfirmar({
            titulo: '¿El cliente no recibió el pedido?',
            mensaje: 'Se marcará como devuelto y regresará a la tienda. Si el pago estaba confirmado, la tienda lo reembolsará.',
            textoAceptar: 'Sí, devolver',
            textoCancelar: 'Volver',
            peligro: true,
        });

        if (!confirmado) return;

        boton.disabled = true;
        boton.innerHTML = '<i class="bi bi-hourglass-split" aria-hidden="true"></i> Actualizando…';

        try {
            await window.TiendaAPI.put(`/tienda/api/trabajador/pedidos/${id}/estado`, { estado: 'devuelto' });
            mostrarToast('Pedido marcado como devuelto. La tienda lo procesará.');
            await cargarPedidos(true);
        } catch (error) {
            mostrarToast(error?.message || 'No se pudo actualizar el pedido.', 'error');
            boton.disabled = false;
            boton.innerHTML = '<i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> No recibido';
        }
    }

    async function iniciar() {
        try {
            if (typeof window.cargarSupabase === 'function') await window.cargarSupabase();

            const sesion = await (window.sesionTiendaPromise || Promise.resolve(null)).catch(() => null);
            const cliente = sesion?.cliente || window.clienteTienda || null;

            if (!cliente) {
                window.location.replace(`/tienda/login?redirect=${encodeURIComponent('/tienda/trabajador')}`);
                return;
            }

            const respuesta = await window.TiendaAPI.get('/tienda/api/trabajador');
            trabajador = respuesta?.trabajador || null;

            if (!trabajador) {
                mostrarBloqueo(
                    'Aún no eres parte del equipo',
                    'Envía tu solicitud desde «Trabaja con nosotros» para empezar con nosotros.'
                );
                return;
            }

            if (trabajador.estado_trabajador !== 'aprobado') {
                const motivos = {
                    pendiente: 'Tu solicitud está en revisión. Te avisaremos cuando la tienda la apruebe.',
                    rechazado: trabajador.motivo_rechazo || 'Tu solicitud fue rechazada. Revisa tus datos y vuelve a enviarla.',
                    suspendido: trabajador.motivo_rechazo || 'Tu cuenta está suspendida. Contacta a la tienda para más información.',
                };

                mostrarBloqueo(
                    'Modo trabajador no disponible',
                    motivos[trabajador.estado_trabajador] || 'Tu cuenta de trabajador no está aprobada.'
                );
                return;
            }

            disponible = Boolean(trabajador.disponible);

            cargando.hidden = true;
            bloqueo.hidden = true;
            panel.hidden = false;

            renderHero();
            await cargarPedidos();
        } catch (error) {
            mostrarBloqueo(
                'No se pudo abrir el panel',
                error?.message || 'Ocurrió un error al cargar tu cuenta de trabajador.'
            );
        }
    }

    document.addEventListener('click', (evento) => {
        const tab = evento.target.closest('[data-vista]');

        if (tab) {
            cambiarVista(tab.dataset.vista);
            return;
        }

        if (evento.target.closest('[data-refrescar]')) {
            cargarPedidos(true);
            return;
        }

        const aceptar = evento.target.closest('[data-aceptar]');

        if (aceptar) {
            aceptarPedido(aceptar);
            return;
        }

        const enCamino = evento.target.closest('[data-en-camino]');

        if (enCamino) {
            marcarEnCamino(enCamino);
            return;
        }

        const entregado = evento.target.closest('[data-entregado]');

        if (entregado) {
            marcarEntregado(entregado);
            return;
        }

        const devuelto = evento.target.closest('[data-devuelto]');

        if (devuelto) {
            marcarDevuelto(devuelto);
        }
    });

    switchDisponible?.addEventListener('change', cambiarDisponibilidad);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && trabajador?.estado_trabajador === 'aprobado') {
            cargarPedidos(true);
        }
    });

    window.setInterval(() => {
        if (!document.hidden && trabajador?.estado_trabajador === 'aprobado') {
            cargarPedidos(true);
        }
    }, 30000);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();
