export default function initTrabajadores() {
    const tabla = document.getElementById('tablaTrabajadores');
    if (!tabla) return;

    document.getElementById('titulo').textContent = 'TRABAJADORES';

    const tbody = tabla.querySelector('tbody');
    const vacio = document.getElementById('trabajadoresVacio');
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';
    const modalElemento = document.getElementById('modalTrabajador');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElemento);
    const modalArqueoElemento = document.getElementById('modalArqueoTrabajador');
    const modalArqueo = modalArqueoElemento ? bootstrap.Modal.getOrCreateInstance(modalArqueoElemento) : null;
    const arqueoDesde = document.getElementById('arqueoErpDesde');
    const arqueoHasta = document.getElementById('arqueoErpHasta');
    const arqueoDetalle = document.getElementById('trabajadorArqueoErpDetalle');

    const filtroEstado = document.getElementById('filtroEstadoTrabajador');
    const buscar = document.getElementById('buscarTrabajador');
    const recargar = document.getElementById('recargarTrabajadores');

    const estadoTexto = {
        pendiente: 'Pendiente',
        aprobado: 'Aprobado',
        rechazado: 'Rechazado',
        suspendido: 'Suspendido',
    };

    const escapar = (valor) => $('<div>').text(valor ?? '').html();

    const fechaCorta = (valor) => {
        if (!valor) return '—';

        const base = String(valor).slice(0, 10);
        const [anio, mes, dia] = base.split('-');

        return dia && mes && anio ? `${dia}/${mes}/${anio}` : String(valor);
    };

    const numero = (valor) => Number(valor || 0);
    const moneda = (valor) => `C$ ${Number(valor || 0).toLocaleString('es-NI', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
    const fechaISO = (fecha) => [
        fecha.getFullYear(),
        String(fecha.getMonth() + 1).padStart(2, '0'),
        String(fecha.getDate()).padStart(2, '0'),
    ].join('-');
    const fechaDia = (valor) => {
        if (!valor) return '—';
        const base = String(valor).slice(0, 10);
        const [anio, mes, dia] = base.split('-');
        return dia && mes && anio ? `${dia}/${mes}/${anio}` : String(valor);
    };
    const metodoTexto = (metodo) => ({
        efectivo: 'Efectivo',
        billetera_movil: 'Billetera móvil',
        lafise: 'Lafise',
    }[metodo] || 'Otro');

    let trabajadores = [];
    let trabajadorArqueoId = null;
    let temporizador = null;

    function badgeEstado(estado) {
        return `<span class="trabajadores-badge trabajadores-badge--${escapar(estado)}">${escapar(estadoTexto[estado] || estado)}</span>`;
    }

    function pintarResumen(resumen = {}) {
        const mapa = {
            resumenTrabajadoresTotal: resumen.total,
            resumenTrabajadoresPendientes: resumen.pendientes,
            resumenTrabajadoresAprobados: resumen.aprobados,
            resumenTrabajadoresRechazados: resumen.rechazados,
            resumenTrabajadoresSuspendidos: resumen.suspendidos,
        };

        Object.entries(mapa).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.textContent = Number(valor || 0);
        });
    }

    function pintarTabla() {
        if (!trabajadores.length) {
            tbody.innerHTML = '';
            if (vacio) vacio.hidden = false;
            return;
        }

        if (vacio) vacio.hidden = true;

        tbody.innerHTML = trabajadores.map((t) => {
            const foto = t.foto_perfil
                ? `<img class="trabajadores-foto" src="${escapar(t.foto_perfil)}" alt="Foto de ${escapar(t.nombre_trabajador)}" loading="lazy">`
                : '<span class="trabajadores-foto trabajadores-foto--vacia"><i class="ph ph-user"></i></span>';

            const vehiculo = [t.vehiculo_marca, t.vehiculo_modelo].filter(Boolean).join(' ') || '—';
            const comision = numero(t.porcentaje_comision);

            return `
                <tr data-id="${Number(t.id_trabajador)}">
                    <td class="trabajadores-col-foto">${foto}</td>
                    <td>
                        <strong class="trabajadores-nombre">${escapar(t.nombre_trabajador)}</strong>
                        <span class="trabajadores-sub">C.I. ${escapar(t.cedula_trabajador || '—')}</span>
                    </td>
                    <td>
                        <span class="trabajadores-sub">${escapar(t.telefono_trabajador || '—')}</span>
                        <span class="trabajadores-sub">${escapar(t.correo_trabajador || '—')}</span>
                    </td>
                    <td>
                        <strong class="trabajadores-nombre">${escapar(vehiculo)}</strong>
                        <span class="trabajadores-sub">${escapar(t.vehiculo_placa || '—')} · ${escapar(t.vehiculo_color || 'Sin color')}</span>
                        <span class="trabajadores-color"><i style="background:${escapar(t.color_usuario || '#22c55e')}"></i> ${escapar(t.color_usuario || '#22c55e')}</span>
                    </td>
                    <td>
                        <span class="trabajadores-sub">Lic. ${escapar(t.licencia_numero || '—')} · ${fechaCorta(t.licencia_vencimiento)}</span>
                        <span class="trabajadores-sub">Circ. ${escapar(t.circulacion_numero || '—')} · ${fechaCorta(t.circulacion_vencimiento)}</span>
                    </td>
                    <td class="text-center">
                        <span class="trabajadores-comision">${comision.toFixed(2)}%</span>
                    </td>
                    <td>${badgeEstado(t.estado_trabajador)}</td>
                    <td><span class="trabajadores-sub">${fechaCorta(t.fecha_solicitud)}</span></td>
                    <td class="text-center">
                        <button type="button" class="btn btn-sm btn-outline-success arqueoTrabajador" data-id="${Number(t.id_trabajador)}" title="Ver arqueo">
                            <i class="ph ph-cash-register"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-primary gestionarTrabajador ms-1" data-id="${Number(t.id_trabajador)}" title="Gestionar solicitud">
                            <i class="ph ph-eye"></i>
                        </button>
                    </td>
                </tr>`;
        }).join('');
    }

    async function cargar() {
        const parametros = new URLSearchParams();

        if (filtroEstado?.value && filtroEstado.value !== 'todas') parametros.set('estado', filtroEstado.value);
        if (buscar?.value.trim()) parametros.set('buscar', buscar.value.trim());

        try {
            const respuesta = await fetch(`/trabajadores/mostrar?${parametros.toString()}`, {
                headers: { Accept: 'application/json' },
            });
            const datos = await respuesta.json().catch(() => null);

            if (!respuesta.ok || !datos?.success) {
                throw new Error(datos?.mensaje || 'No se pudieron cargar los trabajadores.');
            }

            trabajadores = datos.trabajadores || [];
            pintarResumen(datos.resumen);
            pintarTabla();
        } catch (error) {
            mostrarToast(error.message || 'No se pudieron cargar los trabajadores.', 'danger');
        }
    }

    function infoHtml(t) {
        const fotos = [
            ['Foto del trabajador', t.foto_perfil],
            ['Foto del vehículo', t.foto_vehiculo],
            ['Licencia', t.foto_licencia],
            ['Circulación', t.foto_circulacion],
            ['Seguro', t.foto_seguro],
        ].filter(([, url]) => Boolean(url));

        const galeria = fotos.length
            ? `<div class="trabajadores-galeria">${fotos.map(([etiqueta, url]) => `
                <a href="${escapar(url)}" target="_blank" rel="noopener" class="trabajadores-galeria__item" title="${escapar(etiqueta)}">
                    <img src="${escapar(url)}" alt="${escapar(etiqueta)}" loading="lazy">
                    <span>${escapar(etiqueta)}</span>
                </a>`).join('')}</div>`
            : '<p class="trabajadores-sub">Sin fotos adjuntas.</p>';

        const dato = (etiqueta, valor) => `
            <div class="trabajadores-dato">
                <span>${escapar(etiqueta)}</span>
                <strong>${escapar(valor || '—')}</strong>
            </div>`;

        return `
            <div class="trabajadores-detalle__cabecera">
                <div>
                    <h4>${escapar(t.nombre_trabajador)}</h4>
                    <p class="trabajadores-sub">${escapar(t.nombre_cliente || '')} · Cliente #${Number(t.id_cliente)}</p>
                </div>
                ${badgeEstado(t.estado_trabajador)}
            </div>

            ${galeria}

            <div class="trabajadores-detalle__grid">
                ${dato('Cédula', t.cedula_trabajador)}
                ${dato('Teléfono', t.telefono_trabajador)}
                ${dato('Correo', t.correo_trabajador)}
                ${dato('Nacimiento', fechaCorta(t.fecha_nacimiento))}
                ${dato('Dirección', t.direccion_trabajador)}
                ${dato('Rol del cliente', t.rol_cliente)}
            </div>

            <h6 class="trabajadores-detalle__titulo">Documentos</h6>
            <div class="trabajadores-detalle__grid">
                ${dato('Licencia', `${t.licencia_numero || '—'} · vence ${fechaCorta(t.licencia_vencimiento)}`)}
                ${dato('Circulación', `${t.circulacion_numero || '—'} · vence ${fechaCorta(t.circulacion_vencimiento)}`)}
                ${dato('Aseguradora', t.seguro_aseguradora)}
                ${dato('Número de seguro', t.seguro_numero)}
                ${dato('Vence el seguro', fechaCorta(t.seguro_vencimiento))}
            </div>

            <h6 class="trabajadores-detalle__titulo">Vehículo</h6>
            <div class="trabajadores-detalle__grid">
                ${dato('Marca', t.vehiculo_marca)}
                ${dato('Modelo', t.vehiculo_modelo)}
                ${dato('Año', t.vehiculo_anio)}
                ${dato('Placa', t.vehiculo_placa)}
                ${dato('Color del vehículo', t.vehiculo_color)}
                ${dato('Color del trabajador', t.color_usuario)}
            </div>

            <div class="trabajadores-detalle__notas">
                <p><strong>Solicitud:</strong> ${fechaCorta(t.fecha_solicitud)}</p>
                <p><strong>Revisión:</strong> ${fechaCorta(t.fecha_revision)}</p>
                ${t.motivo_rechazo ? `<p class="trabajadores-motivo"><strong>Motivo del rechazo:</strong> ${escapar(t.motivo_rechazo)}</p>` : ''}
                ${t.nota_erp ? `<p><strong>Nota interna:</strong> ${escapar(t.nota_erp)}</p>` : ''}
            </div>`;
    }

    function renderArqueoErp(datos) {
        if (!arqueoDetalle) return;

        const pendiente = datos.pendiente || {};
        const dias = Array.isArray(pendiente.dias) ? pendiente.dias : [];
        const historial = Array.isArray(datos.historial) ? datos.historial : [];
        const cobrado = (Number(pendiente.productos) || 0) + (Number(pendiente.delivery) || 0);
        const metodos = [
            ['Efectivo', pendiente.efectivo],
            ['Billetera', pendiente.billetera],
            ['Lafise', pendiente.lafise],
        ];

        const diasHtml = dias.length ? dias.map((dia) => {
            const detalle = Array.isArray(dia.detalle) ? dia.detalle : [];

            return `
                <details class="trabajadores-arqueo__dia">
                    <summary>
                        <span>
                            <strong>${fechaDia(dia.fecha)}</strong>
                            <small>${Number(dia.pedidos) || 0} pedido(s) · Delivery ${moneda(dia.delivery)}</small>
                        </span>
                        <strong>${moneda(dia.total_empresa)}</strong>
                        <i class="ph ph-caret-down"></i>
                    </summary>
                    <div class="trabajadores-arqueo__dia-cuerpo">
                        <div class="trabajadores-arqueo__mini">
                            ${metodos.map(([etiqueta, valor]) => `<span>${etiqueta} <strong>${moneda(dia[etiqueta.toLowerCase()] ?? valor)}</strong></span>`).join('')}
                        </div>
                        <div class="trabajadores-arqueo__mini">
                            <span>Delivery <strong>${moneda(dia.delivery)}</strong></span>
                            <span>Empresa <strong>${moneda(dia.comision_empresa)}</strong></span>
                            <span>Ganancia <strong>${moneda(dia.ganancia_delivery)}</strong></span>
                        </div>
                        <ul class="trabajadores-arqueo__pedidos">
                            ${detalle.map((pedido) => `
                                <li>
                                    <span>${escapar(pedido.numero || 'Pedido')} · ${escapar(metodoTexto(pedido.metodo))}</span>
                                    <strong>${moneda(pedido.total)}</strong>
                                </li>`).join('')}
                        </ul>
                    </div>
                </details>`;
        }).join('') : '<p class="trabajadores-sub">No hay entregas pendientes en estas fechas.</p>';

        const historialHtml = historial.length ? historial.map((cierre) => {
            const diferencia = numero(cierre.diferencia);
            const estado = Math.abs(diferencia) < 0.005
                ? 'Cuadra'
                : (diferencia > 0 ? `Sobra ${moneda(diferencia)}` : `Falta ${moneda(Math.abs(diferencia))}`);

            return `
                <div class="trabajadores-arqueo__historial-linea">
                    <span>
                        <strong>${fechaDia(cierre.desde)} al ${fechaDia(cierre.hasta)}</strong>
                        <small>${Number(cierre.pedidos) || 0} pedido(s) · ${estado}</small>
                    </span>
                    <strong>${moneda(cierre.monto_entregado)}</strong>
                </div>`;
        }).join('') : '<p class="trabajadores-sub">Aún no hay cierres registrados.</p>';

        arqueoDetalle.innerHTML = `
            <div class="trabajadores-arqueo__hero">
                <span>Total a entregar a la empresa</span>
                <strong>${moneda(pendiente.total_empresa)}</strong>
                <small>Cobrado en mano: ${moneda(cobrado)} · Ganancia: ${moneda(pendiente.ganancia_delivery)}</small>
            </div>

            <div class="trabajadores-arqueo__grid">
                ${metodos.map(([etiqueta, valor]) => `
                    <div>
                        <span>${etiqueta}</span>
                        <strong>${moneda(valor)}</strong>
                    </div>`).join('')}
                <div><span>Productos</span><strong>${moneda(pendiente.productos)}</strong></div>
                <div><span>Delivery</span><strong>${moneda(pendiente.delivery)}</strong></div>
                <div><span>Ganancia</span><strong>${moneda(pendiente.ganancia_delivery)}</strong></div>
            </div>

            <h6 class="trabajadores-arqueo__titulo">Pendiente por día</h6>
            <div class="trabajadores-arqueo__dias">${diasHtml}</div>

            <h6 class="trabajadores-arqueo__titulo">Historial de arqueos</h6>
            <div class="trabajadores-arqueo__historial">${historialHtml}</div>
        `;
    }

    async function cargarArqueoErp(id) {
        if (!arqueoDetalle || !arqueoDesde || !arqueoHasta) return;

        if (!arqueoDesde.value || !arqueoHasta.value) {
            arqueoDetalle.innerHTML = '<p class="trabajadores-sub">Selecciona las dos fechas.</p>';
            return;
        }

        if (arqueoHasta.value < arqueoDesde.value) {
            arqueoDetalle.innerHTML = '<p class="trabajadores-sub">La fecha final no puede ser anterior a la inicial.</p>';
            return;
        }

        arqueoDetalle.innerHTML = '<p class="trabajadores-sub">Cargando arqueo…</p>';

        try {
            const parametros = new URLSearchParams({
                desde: arqueoDesde.value,
                hasta: arqueoHasta.value,
            });
            const respuesta = await fetch(`/trabajadores/${Number(id)}/arqueos?${parametros.toString()}`, {
                headers: { Accept: 'application/json' },
            });
            const datos = await respuesta.json().catch(() => null);

            if (!respuesta.ok || !datos?.success) {
                throw new Error(datos?.mensaje || 'No se pudo cargar el arqueo.');
            }

            renderArqueoErp(datos);
        } catch (error) {
            arqueoDetalle.innerHTML = `<p class="trabajadores-sub">${escapar(error.message || 'No se pudo cargar el arqueo.')}</p>`;
        }
    }

    function abrirArqueoErp(id) {
        const trabajador = trabajadores.find((t) => Number(t.id_trabajador) === Number(id));

        if (!trabajador || !modalArqueo) return;

        trabajadorArqueoId = Number(id);
        document.getElementById('modalArqueoTrabajadorTitulo').textContent = `Arqueo · ${trabajador.nombre_trabajador}`;

        if (arqueoDesde && !arqueoDesde.value) {
            const inicio = new Date();
            inicio.setDate(inicio.getDate() - 6);
            arqueoDesde.value = fechaISO(inicio);
        }

        if (arqueoHasta && !arqueoHasta.value) arqueoHasta.value = fechaISO(new Date());

        modalArqueo.show();
        cargarArqueoErp(trabajadorArqueoId);
    }

    function abrirModal(id) {
        const trabajador = trabajadores.find((t) => Number(t.id_trabajador) === Number(id));

        if (!trabajador) return;

        document.getElementById('modalTrabajadorTitulo').textContent = `Solicitud · ${trabajador.nombre_trabajador}`;
        document.getElementById('trabajadorDetalleInfo').innerHTML = infoHtml(trabajador);
        document.getElementById('trabajadorId').value = trabajador.id_trabajador;
        document.getElementById('trabajadorEstado').value = trabajador.estado_trabajador;
        document.getElementById('trabajadorComision').value = numero(trabajador.porcentaje_comision).toFixed(2);
        document.getElementById('trabajadorNota').value = trabajador.nota_erp || '';
        document.getElementById('trabajadorMotivo').value = trabajador.motivo_rechazo || '';
        document.getElementById('trabajadorDisponible').innerHTML = trabajador.disponible
            ? '<span class="trabajadores-badge trabajadores-badge--disponible">Disponible</span>'
            : '<span class="trabajadores-badge trabajadores-badge--no-disponible">No disponible</span>';

        alternarMotivo();

        modal.show();
    }

    function alternarMotivo() {
        const estado = document.getElementById('trabajadorEstado').value;
        const wrap = document.getElementById('trabajadorMotivoWrap');

        if (wrap) wrap.hidden = estado !== 'rechazado';
    }

    async function guardar() {
        const id = document.getElementById('trabajadorId').value;
        const estado = document.getElementById('trabajadorEstado').value;
        const comision = document.getElementById('trabajadorComision').value;
        const motivo = document.getElementById('trabajadorMotivo').value.trim();
        const nota = document.getElementById('trabajadorNota').value.trim();

        if (!id) return;

        if (estado === 'rechazado' && !motivo) {
            mostrarToast('Escribe el motivo del rechazo.', 'warning');
            return;
        }

        const boton = document.getElementById('btnGuardarTrabajador');
        boton.disabled = true;

        try {
            const respuesta = await fetch(`/trabajadores/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({
                    estado_trabajador: estado,
                    porcentaje_comision: comision === '' ? null : Number(comision),
                    motivo_rechazo: motivo || null,
                    nota_erp: nota || null,
                }),
            });
            const datos = await respuesta.json().catch(() => null);

            if (!respuesta.ok || !datos?.success) {
                const mensaje = datos?.errors ? Object.values(datos.errors).flat()[0] : (datos?.mensaje || 'No se pudo guardar.');
                throw new Error(mensaje);
            }

            mostrarToast(datos.mensaje || 'Solicitud actualizada.', 'success');
            modal.hide();
            await cargar();
        } catch (error) {
            mostrarToast(error.message || 'No se pudo guardar la solicitud.', 'danger');
        } finally {
            boton.disabled = false;
        }
    }

    async function eliminar() {
        const id = document.getElementById('trabajadorId').value;

        if (!id) return;

        if (!window.confirm('¿Eliminar esta solicitud de trabajador? Esta acción no se puede deshacer.')) return;

        try {
            const respuesta = await fetch(`/trabajadores/${id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
            });
            const datos = await respuesta.json().catch(() => null);

            if (!respuesta.ok || !datos?.success) {
                throw new Error(datos?.mensaje || 'No se pudo eliminar la solicitud.');
            }

            mostrarToast(datos.mensaje || 'Solicitud eliminada.', 'success');
            await cargar();
            modal.hide();
        } catch (error) {
            mostrarToast(error.message || 'No se pudo eliminar la solicitud.', 'danger');
        }
    }

    tabla.addEventListener('click', (evento) => {
        const arqueo = evento.target.closest('.arqueoTrabajador');

        if (arqueo) {
            abrirArqueoErp(arqueo.dataset.id);
            return;
        }

        const boton = evento.target.closest('.gestionarTrabajador');

        if (boton) abrirModal(boton.dataset.id);
    });

    document.querySelectorAll('.trabajadores-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.trabajadores-chip').forEach((otro) => otro.classList.remove('is-activo'));
            chip.classList.add('is-activo');

            if (filtroEstado) filtroEstado.value = chip.dataset.estado || 'todas';

            cargar();
        });
    });

    filtroEstado?.addEventListener('change', cargar);

    buscar?.addEventListener('input', () => {
        window.clearTimeout(temporizador);
        temporizador = window.setTimeout(cargar, 350);
    });

    recargar?.addEventListener('click', cargar);

    document.getElementById('btnGuardarTrabajador')?.addEventListener('click', guardar);
    document.getElementById('btnEliminarTrabajador')?.addEventListener('click', eliminar);
    document.getElementById('trabajadorEstado')?.addEventListener('change', alternarMotivo);

    document.getElementById('btnFiltrarArqueoErp')?.addEventListener('click', () => {
        if (trabajadorArqueoId) cargarArqueoErp(trabajadorArqueoId);
    });

    arqueoDesde?.addEventListener('change', () => {
        if (trabajadorArqueoId) cargarArqueoErp(trabajadorArqueoId);
    });

    arqueoHasta?.addEventListener('change', () => {
        if (trabajadorArqueoId) cargarArqueoErp(trabajadorArqueoId);
    });

    cargar();
}
