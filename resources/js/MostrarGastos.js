export default function initMostrarGastos() {

    document.getElementById('titulo').textContent = 'GESTIÓN DE GASTOS';

    /* ═════════════ FILTRO INACTIVOS ═════════════ */

    const filtrosDataTable = $.fn.dataTable.ext.search;
    for (let i = filtrosDataTable.length - 1; i >= 0; i--) {
        if (filtrosDataTable[i]._filtroInactivosGastos) filtrosDataTable.splice(i, 1);
    }

    const filtrarGastosInactivos = function (settings, data) {
        if (settings.nTable.id !== 'tablaGastos') return true;
        const ocultar = $('#toggleInactivosGastos').is(':checked');
        if (!ocultar) return true;
        return String(data[7] ?? '').includes('Activo');
    };
    filtrarGastosInactivos._filtroInactivosGastos = true;
    filtrosDataTable.push(filtrarGastosInactivos);

    $('#toggleInactivosGastos').off('change.toggleInactivosGastos').on('change.toggleInactivosGastos', function () { tabla.draw(); });

    /* ═════════════ TABLA ═════════════ */$.fn.dataTable.ext.errMode = 'throw';

    const tabla = $('#tablaGastos').DataTable({

        ajax: { url: '/gastos/mostrar', type: 'GET', dataSrc: 'gastos' },

        columns: [

            { data: 'nombre_gasto', render: data => data ? data : '<span>—</span>' },
            { data: 'tipo', render: data => data ? data : '<span>—</span>' },
            { data: 'descripcion_gasto', render: data => data ? data : '<span>—</span>' },
            { data: 'fecha_pago', render: function (data) { return data ? FechaSimple(data) : '—'; } },

            { data: 'estado_pago',
                render: function (data) {
                    const estado = (data || '').toUpperCase();
                    if (estado === 'PAGADO') { return '<span class="estado estado-activo">Pagado</span>'; }
                    if (estado === 'ATRASADO') { return '<span class="estado estado-inactivo">Atrasado</span>'; }
                    return '<span class="estado estado-pendiente">Pendiente</span>';
                }
            },

            { data: 'ultimo_pago_fecha', render: function (data) { return data ? FechaSimple(data) : '-'; } },
            { data: 'ultimo_pago_monto', render: data => moneda(data) },

            { data: 'estado_gasto',
                render: function (data) {
                    return data == 1
                        ? '<span class="estado estado-activo">Activo</span>'
                        : '<span class="estado estado-inactivo">Inactivo</span>';
                }
            },

            { data: 'id_gasto',
                orderable: false,
                searchable: false,
                render: function (data) {

                    return `
                        <button class="btn-editar editarGasto" data-id="${data}">
                            <i class="ph ph-pencil-simple"></i>
                        </button>

                        <button class="btn-detalle detalleGasto" data-id="${data}">
                            <i class="ph ph-eye"></i>
                        </button>

                        <button class="pagar-gasto pagarGasto" data-id="${data}">
                            <i class="ph ph-credit-card"></i>
                        </button>
                    `;
                }
            }
        ], drawCallback: function () { AnimarFilasVisibles(this.api()); }

    });

    /* ═════════════ TOGGLE COLUMNAS ═════════════ */
    
    configurarToggleColumnas('tablaGastos');

    // EDITAR GASTO
    $('#tablaGastos').off('click.editarGasto', '.editarGasto').on('click.editarGasto', '.editarGasto', function () {
        const id = $(this).data('id'); abrirModalEditarGasto(id);
    });

    function abrirModalEditarGasto(id) {

        $.get(`/gastos/editar/${id}`, function (res) {

            if (!res.success || !res.gasto) {
                mostrarToast(res.mensaje || 'No se pudo cargar el gasto', 'danger');
                return;
            }

            const gasto = res.gasto;

            $('#editar_id_gasto').val(gasto.id_gasto);
            $('#editar_nombre_gasto').val(gasto.nombre_gasto);
            $('#editar_descripcion_gasto').val(gasto.descripcion_gasto);
            $('#editar_estado_gasto').val(gasto.estado_gasto);

            cargarTiposGastoEditar(gasto.id_tipo_gasto)
                .then(() => bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarGasto')).show())
                .catch(() => mostrarToast('No se pudieron cargar los tipos de gasto', 'danger'));

        }).fail(xhr => mostrarToast(xhr.responseJSON?.mensaje || 'Error al cargar el gasto', 'danger'));
    }

    /* ═════════════ TIPOS GASTO ═════════════ */

    function cargarTiposGastoEditar(seleccionado) {

        const select = $('#editar_id_tipo_gasto');

        return fetch('/tipo-gasto/mostrar')
            .then(res => {
                if (!res.ok) throw new Error('No se pudieron cargar los tipos de gasto');
                return res.json();
            })
            .then(data => {

                if (!data.tipos_gasto) throw new Error('Respuesta de tipos de gasto inválida');

                select.empty();

                const tipos = data.tipos_gasto || [];

                select.append(`<option disabled selected value="">Seleccione</option>`);

                tipos.forEach(tipo => {

                    select.append(`
                        <option value="${tipo.id_tipo_gasto}" 
                            ${Number(tipo.id_tipo_gasto) === Number(seleccionado) ? "selected" : ""}>
                            ${tipo.nombre_tipo_gasto}
                        </option>
                    `);
                });
            });
    }

    /* ═════════════ ACTUALIZAR GASTO ═════════════ */

    $('#btnActualizarGasto').off('click.actualizarGasto').on('click.actualizarGasto', function () {

        const btn = $(this);
        if (btn.data('loading')) return;

        const id = $('#editar_id_gasto').val();
        if (!id) {
            mostrarToast('No se identificó el gasto que desea editar', 'danger');
            return;
        }

        const datos = {

            nombre_gasto: $('#editar_nombre_gasto').val().trim(),
            descripcion_gasto: $('#editar_descripcion_gasto').val().trim(),
            id_tipo_gasto: $('#editar_id_tipo_gasto').val(),
            estado_gasto: $('#editar_estado_gasto').val(),
            _token: $('meta[name="csrf-token"]').attr('content')
        };

        btn.data('loading', true).prop('disabled', true);
        $.ajax({

            url: `/gastos/actualizar/${id}`,
            type: 'POST',
            data: datos,

            success: function (res) {

                if (!res.success) {
                    mostrarToast(res.mensaje || 'No se pudo actualizar el gasto', 'danger');
                    return;
                }

                mostrarToast('Gasto actualizado correctamente', 'success');

                tabla.ajax.reload(null, false);

                bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarGasto')).hide();
            },

            error: function (err) {

                if (err.status === 422) {
                    const errores = err.responseJSON.errors;
                    mostrarToast(Object.values(errores)[0][0], 'danger');
                }
                else if (err.responseJSON?.mensaje) {
                    mostrarToast(err.responseJSON.mensaje, 'danger');
                }
                else {
                    mostrarToast('Error inesperado del servidor', 'danger');
                }
            },
            complete: function () { btn.data('loading', false).prop('disabled', false); }
        });
    });

    /* ═════════════ RECARGA ═════════════ */

    // $('#modalEditarGasto').on('hidden.bs.modal', function () { tabla.ajax.reload(); });

/* ----------------------------------------------------------------------------------------- */


    // CREAR GASTO
    function cargarTipoGasto() {

        FlatPickr(document.getElementById('crear_fecha_pago'));
        FlatPickr(document.getElementById('pagar_nueva_fecha'));

        const modal = document.getElementById("modalCrearGasto");
        const selectTipo = document.getElementById("crear_id_tipo_gasto");

        if (!modal || !selectTipo) return;

        modal.addEventListener("shown.bs.modal", async function () {

            // 🔥 evita recargar cada vez que abres el modal
            if (selectTipo.dataset.loaded === "1") return;

            try {

                const res = await fetch('/tipo-gasto/mostrar');
                if (!res.ok) throw new Error('No se pudieron cargar los tipos de gasto');
                const data = await res.json();
                if (!data.tipos_gasto) throw new Error('Respuesta de tipos de gasto inválida');

                selectTipo.innerHTML = '<option disabled selected value="">Seleccione</option>';

                data.tipos_gasto.forEach(tipo => {
                    const option = document.createElement("option");
                    option.value = tipo.id_tipo_gasto;
                    option.textContent = tipo.nombre_tipo_gasto;
                    selectTipo.appendChild(option);
                });

                selectTipo.dataset.loaded = "1";

            } catch (error) {
                mostrarToast("Error al cargar tipos de gasto", "danger");
            }

        });
    }

/* ═══════════════════════════════════════════════════════ */

    $('#btnGuardarGasto').off('click.guardarGasto').on('click.guardarGasto', function () {

        const btn = $(this);
        if (btn.data('loading')) return;

        const nombre = $('#crear_nombre_gasto').val().trim();
        const tipo = $('#crear_id_tipo_gasto').val();
        const descripcion = $('#crear_descripcion_gasto').val().trim();
        const fecha_pago = $('#crear_fecha_pago').val();

        if (!nombre) {
            mostrarToast('Ingrese el nombre del gasto', 'danger');
            return;
        }

        if (!tipo) {
            mostrarToast('Seleccione el tipo de gasto', 'danger');
            return;
        }

        if (!fecha_pago) {
            mostrarToast('Seleccione la fecha de vencimiento', 'danger');
            return;
        }

        btn.data('loading', true).prop('disabled', true);
        $.ajax({
            url: '/gastos/crear',
            method: 'POST',
            data: {
                nombre_gasto: nombre,
                id_tipo_gasto: tipo,
                descripcion_gasto: descripcion,
                fecha_pago: fecha_pago || null,
                _token: $('meta[name="csrf-token"]').attr('content')
            },

            success: function (res) {

                if (res.success) {

                    mostrarToast('Gasto creado correctamente', 'success');

                    const modalEl = document.getElementById('modalCrearGasto');
                    bootstrap.Modal.getOrCreateInstance(modalEl).hide();

                    $('#tablaGastos').DataTable().ajax.reload(null, false);

                    limpiarFormularioCrearGasto(); // 🔥 EXTRA

                } else {
                    mostrarToast(res.mensaje || 'Error al crear', 'danger');
                }
            },

            error: function (xhr) {
                const errores = xhr.responseJSON?.errors;
                mostrarToast(errores ? Object.values(errores)[0][0] : (xhr.responseJSON?.mensaje || 'Error al crear el gasto'), 'danger');
            },
            complete: function () { btn.data('loading', false).prop('disabled', false); }
        });
    });

    // LIMPIAR FORMULARIO CREAR

    function limpiarFormularioCrearGasto() {

        $('#crear_nombre_gasto').val('');
        $('#crear_id_tipo_gasto').val('');
        $('#crear_descripcion_gasto').val('');
        $('#crear_fecha_pago').val('');
        const selectTipo = document.getElementById("crear_id_tipo_gasto");
        if (selectTipo) { selectTipo.dataset.loaded = "0"; }

    }

    // LIMPIAR AL CERRAR MODAL (EXTRA SEGURIDAD)

    $('#modalCrearGasto').off('hidden.bs.modal').on('hidden.bs.modal', function () { limpiarFormularioCrearGasto(); });

    // CARGA INICIAL
    cargarTipoGasto();

/* ----------------------------------------------------------------------------------------- */

/* Detalle gasto */

    function detallegasto() {

        /* ═══════════════════════════════
            CACHE
        ═══════════════════════════════ */
        let cajasCache = [];
        let cuentasCache = [];

        let origenesPromise = null;
        let gastoDetalleActualId = null;

        function escapeHtml(valor) {
            return $('<div>').text(valor ?? '').html();
        }

        function cargarOrigenes() {
            if (!origenesPromise) {
                origenesPromise = Promise.all([
                    $.getJSON('/gastos-cajas/mostrar'),
                    $.getJSON('/gastos-cuentas/mostrar')
                ]).then(([resCajas, resCuentas]) => {
                    if (!resCajas.success || !resCuentas.success) throw new Error('No se pudieron cargar los orígenes de pago');
                    cajasCache = resCajas.cajas || [];
                    cuentasCache = resCuentas.cuentas || [];
                }).catch(error => {
                    origenesPromise = null;
                    throw error;
                });
            }
            return origenesPromise;
        }

        /* ═══════════════════════════════
            HELPERS
        ═══════════════════════════════ */

        function buildOrigenSelect(m) {

            let html = `<select class="form-select form-select-sm origen-edit">`;
            html += `<option value="">Seleccione</option>`;

            if (m.id_caja && !cajasCache.some(c => Number(c.id) === Number(m.id_caja))) {
                html += `<option value="caja-${Number(m.id_caja)}" selected>Caja #${Number(m.id_caja)} (cerrada o no disponible)</option>`;
            }

            html += `<optgroup label="Cajas">`;

            cajasCache.forEach(c => {
                html += `
                    <option value="caja-${Number(c.id)}" ${Number(m.id_caja) === Number(c.id) ? 'selected' : ''}>
                        ${escapeHtml(c.display)}
                    </option>
                `;
            });

            html += `</optgroup><optgroup label="Cuentas">`;

            if (m.id_cuenta && !cuentasCache.some(c => Number(c.id) === Number(m.id_cuenta))) {
                html += `<option value="cuenta-${Number(m.id_cuenta)}" selected>Cuenta #${Number(m.id_cuenta)} (inactiva o no disponible)</option>`;
            }

            cuentasCache.forEach(c => {
                html += `
                    <option value="cuenta-${Number(c.id)}" ${Number(m.id_cuenta) === Number(c.id) ? 'selected' : ''}>
                        ${escapeHtml(c.display)}
                    </option>
                `;
            });

            html += `</optgroup></select>`;

            return html;
        }

        function validarMonto(monto) {

            if (monto === null || monto === '' || isNaN(monto)) {
                mostrarToast('Ingrese un monto válido', 'danger');
                return false;
            }

            if (monto <= 0) {
                mostrarToast('El monto debe ser mayor a 0', 'danger');
                return false;
            }

            return true;
        }

        /* ═══════════════════════════════
            DETALLE
        ═══════════════════════════════ */

        $('#tablaGastos').off('click', '.detalleGasto').on('click', '.detalleGasto', function () {

            const id = $(this).data('id');

            $.get(`/gastos/detalle/${id}`, function (res) {

                if (!res.success) {
                    mostrarToast('No se pudo cargar el detalle', 'danger');
                    return;
                }

                const g = res.gasto;

                $('#detalleNombreGasto').text(g.nombre_gasto);
                $('#detalleTipoGasto').text(g.tipo);
                $('#detalleDescripcion').text(g.descripcion_gasto ?? '—');

                $('#detalleUltimoPago').text(
                    g.ultimo_pago_fecha
                        ? formatearFechaDiaHora(g.ultimo_pago_fecha)
                        : 'Nunca'
                );

                let html = '';

                g.movimientos.forEach(m => {

                    let origenTexto = '';

                    if (m.caja) {
                        origenTexto = `Caja #${m.caja}`;
                    } else if (m.cuenta) {
                        origenTexto = `${m.cuenta}`;
                    }

                    html += `
                        <tr data-id="${m.id}">

                            <td>${formatearFechaDiaHora(m.fecha)}</td>

                            <td>
                                <span class="monto-text">${m.monto}</span>
                                <input type="number"
                                    class="form-control form-control-sm d-none monto-edit"
                                    value="${m.monto}">
                            </td>

                            <td>
                                <span class="origen-text">${origenTexto}</span>
                                <div class="d-none origen-edit-container">
                                    ${buildOrigenSelect(m)}
                                </div>
                            </td>

                            <td>${m.usuario.nombre}</td>

                            <td>
                                <button class="btn btn-sm guardar editarPago">Editar</button>
                                <button class="btn btn-sm cancelar cancelarPago d-none">Cancelar</button>
                                <button class="btn btn-sm guardar guardarPago d-none">Guardar</button>
                            </td>

                        </tr>
                    `;
                });

                $('#tablaHistorialGasto').html(html);

                new bootstrap.Modal(document.getElementById('modalDetalleGasto')).show();
            });
        });

        async function cargarDetalleGasto(id, abrirModal = true) {
            try {
                await cargarOrigenes();
                const res = await $.getJSON(`/gastos/detalle/${id}`);
                if (!res.success || !res.gasto) throw new Error(res.mensaje || 'No se pudo cargar el detalle');

                gastoDetalleActualId = Number(id);
                const gasto = res.gasto;
                $('#detalleNombreGasto').text(gasto.nombre_gasto ?? '—');
                $('#detalleTipoGasto').text(gasto.tipo ?? '—');
                $('#detalleDescripcion').text(gasto.descripcion_gasto ?? '—');
                $('#detalleUltimoPago').text(gasto.ultimo_pago_fecha ? formatearFechaDiaHora(gasto.ultimo_pago_fecha) : 'Nunca');

                const filas = (gasto.movimientos ?? []).map(movimiento => {
                    const origenTexto = movimiento.id_caja
                        ? `Caja #${Number(movimiento.id_caja)}`
                        : (movimiento.cuenta ?? 'Cuenta no disponible');
                    const monto = Number(movimiento.monto ?? 0);

                    return `
                        <tr data-id="${Number(movimiento.id)}">
                            <td>${escapeHtml(formatearFechaDiaHora(movimiento.fecha))}</td>
                            <td>
                                <span class="monto-text">${moneda(monto)}</span>
                                <input type="number" class="form-control form-control-sm d-none monto-edit" min="0.01" step="0.01" value="${monto.toFixed(2)}">
                            </td>
                            <td>
                                <span class="origen-text">${escapeHtml(origenTexto)}</span>
                                <div class="d-none origen-edit-container">${buildOrigenSelect(movimiento)}</div>
                            </td>
                            <td>${escapeHtml(movimiento.usuario?.nombre ?? '—')}</td>
                            <td>
                                <button class="btn btn-sm guardar editarPago" type="button">Editar</button>
                                <button class="btn btn-sm cancelar cancelarPago d-none" type="button">Cancelar</button>
                                <button class="btn btn-sm guardar guardarPago d-none" type="button">Guardar</button>
                            </td>
                        </tr>
                    `;
                }).join('');

                $('#tablaHistorialGasto').html(filas);
                if (abrirModal) bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDetalleGasto')).show();
            } catch (error) {
                mostrarToast(error.responseJSON?.mensaje || error.message || 'No se pudo cargar el detalle', 'danger');
            }
        }

        $('#tablaGastos').off('click', '.detalleGasto')
            .off('click.detalleGasto', '.detalleGasto')
            .on('click.detalleGasto', '.detalleGasto', function () {
                cargarDetalleGasto($(this).data('id'));
            });

        /* ═══════════════════════════════
            EDITAR
        ═══════════════════════════════ */

        $('#tablaHistorialGasto').off('click.editarPago', '.editarPago').on('click', '.editarPago', function () {

            const tr = $(this).closest('tr');

            tr.find('.monto-text, .origen-text').addClass('d-none');
            tr.find('.monto-edit, .origen-edit-container').removeClass('d-none');

            tr.find('.editarPago').addClass('d-none');
            tr.find('.guardarPago, .cancelarPago').removeClass('d-none');
        });

        /* ═══════════════════════════════
            CANCELAR
        ═══════════════════════════════ */

        $('#tablaHistorialGasto').off('click.cancelarPago', '.cancelarPago').on('click', '.cancelarPago', function () {
            const tr = $(this).closest('tr');
            tr.find('.monto-text, .origen-text').removeClass('d-none');
            tr.find('.monto-edit, .origen-edit-container').addClass('d-none');
            tr.find('.editarPago').removeClass('d-none');
            tr.find('.guardarPago, .cancelarPago').addClass('d-none');
        });

        // GUARDAR
        $('#tablaHistorialGasto').off('click.guardarPago', '.guardarPago').on('click.guardarPago', '.guardarPago', function () {

            const btn = $(this);

            if (btn.data('loading')) return;
            btn.data('loading', true);

            const tr = $(this).closest('tr');
            const id = tr.data('id');

            const monto = parseFloat(tr.find('.monto-edit').val());
            const origen = tr.find('.origen-edit').val();

            /* VALIDACIONES */
            if (!validarMonto(monto)) {
                btn.data('loading', false);
                return;
            }

            if (!origen) {
                mostrarToast('Seleccione un origen', 'danger');
                btn.data('loading', false);
                return;
            }

            const [tipo, origenId] = origen.split('-');

            $.ajax({
                url: '/gastos/movimiento/editar',
                type: 'POST',
                data: {
                    id_movimiento_gasto: id,
                    monto: monto,
                    id_caja: tipo === 'caja' ? origenId : null,
                    id_cuenta: tipo === 'cuenta' ? origenId : null,
                    _token: $('meta[name="csrf-token"]').attr('content')
                },

                success: function (res) {

                if (res.success) {

                        mostrarToast('Pago actualizado correctamente', 'success');

                        const tr = btn.closest('tr');

                        // 🔥 volver a modo vista
                        tr.find('.monto-text, .origen-text').removeClass('d-none');
                        tr.find('.monto-edit, .origen-edit-container').addClass('d-none');

                        tr.find('.editarPago').removeClass('d-none');
                        tr.find('.guardarPago, .cancelarPago').addClass('d-none');

                        // Vuelve a obtener el historial para reflejar monto y origen persistidos.
                        cargarDetalleGasto(gastoDetalleActualId, false);
                        $('#tablaGastos').DataTable().ajax.reload(null, false);
                    } else {
                        mostrarToast(res.mensaje || 'Error al actualizar', 'danger');
                    }
                },

                error: function (xhr) {

                    console.log("STATUS:", xhr.status);
                    console.log("RESPUESTA:", xhr.responseText);

                    mostrarToast(xhr.responseJSON?.mensaje || 'Error al actualizar el pago', 'danger');
                },

                complete: function () {
                    btn.data('loading', false);
                }
            });
        });

    }; detallegasto();


/* ----------------------------------------------------------------------------------------- */


    //FUNCION PAGAR GASTOS
    function PagarGasto() {

        // CARGAR CAJAS
        function cargarCajas() {
            return $.getJSON('/gastos-cajas/mostrar').then(function (res) {
                if (!res.success) throw new Error(res.mensaje || 'No se pudieron cargar las cajas');
                let html = '<option value="">Seleccione caja</option>';
                res.cajas.forEach(caja => { html += `<option value="${Number(caja.id)}" data-saldo="${Number(caja.saldo)}"> ${escapeHtml(caja.display)} </option>`; });
                $('#pagar_id_caja').html(html);
            });
        }

        // CARGAR CUENTAS
        function cargarCuentas() {
            return $.getJSON('/gastos-cuentas/mostrar').then(function (res) {
                if (!res.success) throw new Error(res.mensaje || 'No se pudieron cargar las cuentas');
                let html = '<option value="">Seleccione cuenta</option>';
                res.cuentas.forEach(cuenta => { html += `<option value="${Number(cuenta.id)}" data-saldo="${Number(cuenta.saldo)}"> ${escapeHtml(cuenta.display)} </option>`; });
                $('#pagar_id_cuenta').html(html);
            });
        }

        function escapeHtml(valor) {
            return $('<div>').text(valor ?? '').html();
        }

        function validarPago({ monto, id_caja, id_cuenta, fecha }) {

            const saldoCaja = parseFloat($('#pagar_id_caja option:selected').data('saldo') || 0);
            const saldoCuenta = parseFloat($('#pagar_id_cuenta option:selected').data('saldo') || 0);

            if (!Number.isFinite(monto) || monto <= 0) { mostrarToast('Ingrese un monto mayor a 0', 'danger'); return false; }
            if (!id_caja && !id_cuenta) { mostrarToast('Debe seleccionar una caja o cuenta', 'danger'); return false;}
            if (id_caja && id_cuenta) { mostrarToast('Seleccione solo caja o cuenta, no ambos', 'danger'); return false; }
            if (fecha && isNaN(new Date(fecha).getTime())) { mostrarToast('La fecha ingresada no es válida', 'danger'); return false; }
            if (id_caja && monto > saldoCaja) { mostrarToast('Saldo insuficiente en la caja seleccionada', 'danger'); return false; }
            if (id_cuenta && monto > saldoCuenta) { mostrarToast('Saldo insuficiente en la cuenta seleccionada', 'danger'); return false; }
            if ($('#pagar_renovar_fecha').val() === 'manual' && !fecha) { mostrarToast('Seleccione la nueva fecha de vencimiento', 'danger'); return false; }
            return true;
        }

        // SOLO UNO (CAJA / CUENTA)
        $('#pagar_id_caja').off('change.pagoGasto').on('change.pagoGasto', function () { if ($(this).val()) $('#pagar_id_cuenta').val(''); });
        $('#pagar_id_cuenta').off('change.pagoGasto').on('change.pagoGasto', function () { if ($(this).val()) $('#pagar_id_caja').val(''); });

        // VALIDAR SALDO
        function validarSaldo() {

            const monto = parseFloat($('#pagar_monto').val());
            if (!monto || monto <= 0) return;

            const cajaOption = $('#pagar_id_caja option:selected');
            const cuentaOption = $('#pagar_id_cuenta option:selected');
            const saldoCaja = parseFloat(cajaOption.data('saldo') || 0);
            const saldoCuenta = parseFloat(cuentaOption.data('saldo') || 0);

            if ($('#pagar_id_caja').val() && monto > saldoCaja) { mostrarToast('El monto supera el saldo de caja', 'danger'); }
            if ($('#pagar_id_cuenta').val() && monto > saldoCuenta) { mostrarToast('El monto supera el saldo de cuenta', 'danger'); }
        }

        $('#pagar_monto').off('input.validarSaldo').on('input', validarSaldo);

        // ABRIR MODAL (CORREGIDO)
        $('#tablaGastos').off('click.pagarGasto', '.pagarGasto').on('click.pagarGasto', '.pagarGasto', async function () {
            const fila = $('#tablaGastos').DataTable().row($(this).closest('tr')).data();
            if (!fila) return;

            try {
                await Promise.all([cargarCajas(), cargarCuentas()]);
                $('#pagar_id_gasto').val(fila.id_gasto);
                $('#pagar_nombre_gasto').val(fila.nombre_gasto);
                $('#pagar_ultimo_pago').val(fila.ultimo_pago_fecha ? formatearFechaDiaHora(fila.ultimo_pago_fecha) : 'Nunca');
                $('#pagar_ultimo_monto').val(fila.ultimo_pago_monto ?? '0.00');
                $('#pagar_monto').val(fila.ultimo_pago_monto ?? '');
                $('#pagar_id_caja, #pagar_id_cuenta').val('');
                $('#pagar_renovar_fecha').val('auto');
                $('#grupo_fecha_manual').addClass('d-none');
                $('#pagar_nueva_fecha').val('');
                bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPagarGasto')).show();
            } catch (error) {
                mostrarToast(error.responseJSON?.mensaje || error.message || 'No se pudieron cargar los orígenes de pago', 'danger');
            }
        });

        // PAGAR (ANTI DOBLE CLICK)

        $('#btnPagarGasto').off('click.pagarGasto').on('click.pagarGasto', function () {

            const btn = $(this);
            if (btn.data('loading')) return;

            const id_gasto = $('#pagar_id_gasto').val();
            const monto = parseFloat($('#pagar_monto').val());
            const id_caja = $('#pagar_id_caja').val();
            const id_cuenta = $('#pagar_id_cuenta').val();

            const renovar = $('#pagar_renovar_fecha').val();
            const nueva_fecha = $('#pagar_nueva_fecha').val();

            if (!id_gasto) {
                mostrarToast('No se identificó el gasto que desea pagar', 'danger');
                return;
            }

            if (!validarPago({ monto, id_caja, id_cuenta, fecha: nueva_fecha })) { return; }

            btn.data('loading', true).prop('disabled', true);

            $.ajax({
                url: '/gastos/pagar', method: 'POST',

                data: {
                    id_gasto,
                    monto,
                    id_caja: id_caja || null,
                    id_cuenta: id_cuenta || null,
                    renovar_vencimiento: renovar,
                    nueva_fecha: nueva_fecha || null,
                    _token: $('meta[name="csrf-token"]').attr('content')
                },

                success: function (res) {

                    if (res.success) {

                        mostrarToast('Pago registrado correctamente', 'success');
                        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPagarGasto')).hide();
                        $('#tablaGastos').DataTable().ajax.reload(null, false);

                    } else { mostrarToast(res.mensaje || 'Error al pagar', 'danger'); }
                },

                error: function (xhr) {
                    const errores = xhr.responseJSON?.errors;
                    const primerError = errores ? Object.values(errores).flat()[0] : null;
                    mostrarToast(primerError || xhr.responseJSON?.mensaje || xhr.responseJSON?.message || 'Error al registrar el pago', 'danger');
                },
                complete: function () { btn.data('loading', false).prop('disabled', false); }

            });

        });

        
        $('#pagar_renovar_fecha').off('change.renovarFecha').on('change', function () {

            const valor = $(this).val();
            if (valor === 'manual') { $('#grupo_fecha_manual').removeClass('d-none');
            } else { $('#grupo_fecha_manual').addClass('d-none'); $('#pagar_nueva_fecha').val(''); }

        });

        //  LIMPIAR MODAL (CORRECTO)
        function limpiarPago() {
            $('#formPagarGasto')[0].reset();
            $('#pagar_id_gasto').val('');
            $('#pagar_id_caja').val('');
            $('#pagar_id_cuenta').val('');
            $('#grupo_fecha_manual').addClass('d-none');
            $('#pagar_nueva_fecha').val('');
        }

        $('#modalPagarGasto').off('hidden.bs.modal.limpiarPago').on('hidden.bs.modal', function () { limpiarPago(); });

    }; PagarGasto();


/* ----------------------------------------------------------------------------------------- */

};
