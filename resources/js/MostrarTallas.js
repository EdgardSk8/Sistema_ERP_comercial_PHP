export default function initMostrarTallas() {
    const $tabla = $('#tablaTallas');
    if (!$tabla.length) return;

    document.getElementById('titulo').textContent = 'GESTIÓN DE TALLAS PARA VARIACIONES';

    const puedeEditar = $tabla.data('can-edit') == 1;
    const puedeCambiarEstado = $tabla.data('can-toggle') == 1;
    const csrf = () => $('meta[name="csrf-token"]').attr('content');
    const $modalCrear = $('#modalCrearTalla');
    const $modalEditar = $('#modalEditarTalla');
    const $modalCrearTipo = $('#modalCrearTipoTalla');
    const $modalEditarTipo = $('#modalEditarTipoTalla');

    let tiposTalla = [];

    function pintarSelectTipos() {
        const activos = tiposTalla.filter(tipo => tipo.estado_tipo_talla == 1);

        ['#crear_id_tipo_talla', '#editar_id_tipo_talla'].forEach((selector) => {
            const $select = $(selector);
            if (!$select.length) return;

            const valor = $select.val();

            if ($.fn.select2 && $select.hasClass('select2-hidden-accessible')) $select.select2('destroy');

            $select.empty().append('<option value="">Seleccione</option>');

            activos.forEach((tipo) => {
                $select.append(`<option value="${tipo.id_tipo_talla}">${$('<div>').text(tipo.nombre_tipo_talla).html()}</option>`);
            });

            if ($.fn.select2) {
                $select.select2({
                    width: '100%',
                    dropdownParent: $select.closest('.modal'),
                    placeholder: 'Buscar tipo de talla',
                    allowClear: false
                });
            }

            $select.val(valor || '').trigger('change.select2');
        });
    }

    function cargarTiposTalla() {
        return $.get('/tallas/tipos/mostrar')
            .done((response) => {
                tiposTalla = response.tipos || [];
                pintarSelectTipos();
            })
            .fail((xhr) => mostrarToast(xhr.responseJSON?.mensaje || 'No se pudieron cargar los tipos de talla.', 'danger'));
    }

    $tabla.off('.tallas');
    $('#formCrearTalla').off('.tallas');
    $('#formEditarTalla').off('.tallas');

    if (window.filtroTallasDataTable) {
        const indice = $.fn.dataTable.ext.search.indexOf(window.filtroTallasDataTable);
        if (indice !== -1) $.fn.dataTable.ext.search.splice(indice, 1);
    }

    window.filtroTallasDataTable = function (settings, data) {
        if (settings.nTable.id !== 'tablaTallas') return true;
        if (!$('#toggleInactivasTallas').is(':checked')) return true;
        const estado = $('<div>').html(data[3] || '').text().trim();
        return estado === 'Activa';
    };
    $.fn.dataTable.ext.search.push(window.filtroTallasDataTable);

    if ($.fn.DataTable.isDataTable($tabla[0])) $tabla.DataTable().destroy();

    const tabla = $tabla.DataTable({
        ajax: {
            url: '/tallas/mostrar',
            type: 'GET',
            dataSrc: 'tallas',
            error: xhr => mostrarToast(xhr.responseJSON?.mensaje || 'No se pudieron cargar las tallas.', 'danger')
        },
        columns: [
            { data: 'talla', defaultContent: '—' },
            {
                data: 'tipo_talla.nombre_tipo_talla',
                defaultContent: '—',
                render: data => data
                    ? $('<div>').text(data).html()
                    : '<span class="text-muted">Sin tipo</span>'
            },
            {
                data: 'variaciones_count',
                className: 'text-center',
                render: data => `<span>${Number(data || 0)}</span>`
            },
            {
                data: 'estado_talla',
                className: 'text-center',
                render: data => data == 1
                    ? '<span class="estado estado-activo">Activa</span>'
                    : '<span class="estado estado-inactivo">Inactiva</span>'
            },
            {
                data: 'id_talla',
                orderable: false,
                searchable: false,
                render: function (id, type, row) {
                    if (type !== 'display') return '';
                    let botones = '';

                    if (puedeEditar) {
                        botones += `<button class="btn-editar editarTalla" data-id="${id}" title="Editar talla"><i class="ph ph-pencil-simple"></i></button>`;
                    }

                    if (puedeCambiarEstado) {
                        const tieneStock = Number(row.variantes_con_stock_count || 0) > 0;
                        const deshabilitado = row.estado_talla == 1 && tieneStock ? 'disabled' : '';
                        const titulo = deshabilitado ? 'No se puede desactivar mientras haya stock' : 'Cambiar estado';
                        const clase = row.estado_talla == 1 ? 'btn-baja' : 'btn-alta';
                        const icono = row.estado_talla == 1 ? 'ph-prohibit' : 'ph-check-circle';
                        botones += `<button class="${clase} cambiarEstadoTalla" data-id="${id}" data-estado="${row.estado_talla}" title="${titulo}" ${deshabilitado}><i class="ph ${icono}"></i></button>`;
                    }

                    return botones || '<span class="text-muted">Sin acciones</span>';
                }
            }
        ],
        order: [[0, 'asc']],
        drawCallback: function () { AnimarFilasVisibles(this.api()); },
        initComplete: function () {
            ConfigurarFiltrosDataTable(this, { columnasSelect: [0, 1, 3], columnasIgnorar: [4] });
        }
    });

    cargarTiposTalla();

    configurarToggleColumnas('tablaTallas');

    $('#toggleInactivasTallas').off('change.tallas').on('change.tallas', () => tabla.draw());
    $('#formCrearTalla').on('submit.tallas', function (event) {
        event.preventDefault();
        const nombre = $('#crear_talla').val().trim();
        const idTipo = $('#crear_id_tipo_talla').val();

        if (!nombre) return mostrarToast('Escribe el nombre de la talla.', 'warning');
        if (!idTipo) return mostrarToast('Selecciona el tipo de talla.', 'warning');

        $.ajax({
            url: '/tallas/crear',
            method: 'POST',
            data: { talla: nombre, id_tipo_talla: idTipo, _token: csrf() },
            success: response => {
                mostrarToast(response.mensaje || 'Talla creada correctamente.', 'success');
                this.reset();
                pintarSelectTipos();
                bootstrap.Modal.getOrCreateInstance($modalCrear[0]).hide();
                tabla.ajax.reload(null, false);
                recargarTablaTipos();
            },
            error: xhr => mostrarToast(
                xhr.responseJSON?.errors?.talla?.[0]
                || xhr.responseJSON?.errors?.id_tipo_talla?.[0]
                || xhr.responseJSON?.mensaje
                || 'No se pudo crear la talla.',
                'danger'
            )
        });
    });

    $tabla.on('click.tallas', '.editarTalla', function () {
        const id = $(this).data('id');
        $.get(`/tallas/editar/${id}`)
            .done(response => {
                const talla = response.talla;
                $('#editar_id_talla').val(talla.id_talla);
                $('#editar_talla').val(talla.talla);
                $('#editar_id_tipo_talla').val(talla.id_tipo_talla || '');
                $('#editar_estado_talla').val(String(talla.estado_talla));
                $('#editar_estado_talla_texto').val(talla.estado_talla == 1 ? 'Activa' : 'Inactiva');
                $('#editar_variantes_talla').val(Number(talla.variaciones_count || 0));
                bootstrap.Modal.getOrCreateInstance($modalEditar[0]).show();
            })
            .fail(xhr => mostrarToast(xhr.responseJSON?.mensaje || 'No se pudo cargar la talla.', 'danger'));
    });

    $('#formEditarTalla').on('submit.tallas', function (event) {
        event.preventDefault();
        const id = $('#editar_id_talla').val();
        const nombre = $('#editar_talla').val().trim();
        const idTipo = $('#editar_id_tipo_talla').val();
        const estado = $('#editar_estado_talla').val();

        if (!nombre) return mostrarToast('Escribe el nombre de la talla.', 'warning');
        if (!idTipo) return mostrarToast('Selecciona el tipo de talla.', 'warning');

        $.ajax({
            url: `/tallas/actualizar/${id}`,
            method: 'PUT',
            data: { talla: nombre, id_tipo_talla: idTipo, estado_talla: estado, _token: csrf() },
            success: response => {
                mostrarToast(response.mensaje || 'Talla actualizada correctamente.', 'success');
                bootstrap.Modal.getOrCreateInstance($modalEditar[0]).hide();
                tabla.ajax.reload(null, false);
                recargarTablaTipos();
            },
            error: xhr => mostrarToast(
                xhr.responseJSON?.errors?.talla?.[0]
                || xhr.responseJSON?.errors?.id_tipo_talla?.[0]
                || xhr.responseJSON?.mensaje
                || 'No se pudo actualizar la talla.',
                'danger'
            )
        });
    });

    function obtenerModalConfirmacionEstado() {
        let modal = document.getElementById('modalConfirmarEstadoTalla');
        if (modal) return modal;

        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="modalConfirmarEstadoTalla" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Confirmar cambio de estado</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body"><div class="card-responsive" id="mensajeConfirmarEstadoTalla"></div></div>
                        <div class="modal-footer">
                            <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstadoTalla">Confirmar</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
        return document.getElementById('modalConfirmarEstadoTalla');
    }

    $tabla.on('click.tallas', '.cambiarEstadoTalla', function () {
        const id = $(this).data('id');
        const estaActiva = String($(this).data('estado')) === '1';
        const modalElement = obtenerModalConfirmacionEstado();
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        $('#mensajeConfirmarEstadoTalla').text(
            estaActiva ? '¿Deseas dar de baja esta talla?' : '¿Deseas volver a activar esta talla?'
        );

        $('#confirmarCambioEstadoTalla').off('click.tallas').on('click.tallas', function () {
            const boton = $(this);
            boton.prop('disabled', true);
            $.ajax({
                url: `/tallas/cambiar-estado/${id}`,
                method: 'PUT',
                data: { _token: csrf() },
                success: response => {
                    mostrarToast(response.mensaje || 'Estado actualizado.', 'success');
                    tabla.ajax.reload(null, false);
                    modal.hide();
                },
                error: xhr => mostrarToast(xhr.responseJSON?.mensaje || 'No se pudo cambiar el estado.', 'danger'),
                complete: () => boton.prop('disabled', false)
            });
        });
        modal.show();
    });

    $modalCrear.off('hidden.bs.modal.tallas').on('hidden.bs.modal.tallas', () => $('#formCrearTalla')[0].reset());

    /* Al abrir "Agregar talla", el tipo empieza sin selección. */
    $modalCrear.off('shown.bs.modal.tallas').on('shown.bs.modal.tallas', function () {
        $('#crear_id_tipo_talla').val('').trigger('change.select2');
    });

    /* ╔══════════════════════════════════════════════════════════╗
       ║  Tipos de talla (CRUD dentro de la misma vista)           ║
       ╚══════════════════════════════════════════════════════════╝ */

    let tablaTipos = null;

    function recargarTablaTipos() {
        if (tablaTipos) tablaTipos.ajax.reload(null, false);
    }

    const $tablaTipos = $('#tablaTiposTalla');

    if ($tablaTipos.length) {
        const puedeEditarTipo = $tablaTipos.data('can-edit') == 1;
        const puedeCambiarEstadoTipo = $tablaTipos.data('can-toggle') == 1;

        if ($.fn.DataTable.isDataTable($tablaTipos[0])) $tablaTipos.DataTable().destroy();

        tablaTipos = $tablaTipos.DataTable({
            ajax: {
                url: '/tallas/tipos/mostrar',
                type: 'GET',
                dataSrc: 'tipos',
                error: xhr => mostrarToast(xhr.responseJSON?.mensaje || 'No se pudieron cargar los tipos de talla.', 'danger')
            },
            columns: [
                { data: 'nombre_tipo_talla', defaultContent: '—' },
                {
                    data: 'descripcion_tipo_talla',
                    defaultContent: '',
                    render: data => data
                        ? $('<div>').text(data).html()
                        : '<span class="text-muted">—</span>'
                },
                {
                    data: 'tallas_count',
                    className: 'text-center',
                    render: data => `<span>${Number(data || 0)}</span>`
                },
                {
                    data: 'estado_tipo_talla',
                    className: 'text-center',
                    render: data => data == 1
                        ? '<span class="estado estado-activo">Activa</span>'
                        : '<span class="estado estado-inactivo">Inactiva</span>'
                },
                {
                    data: 'id_tipo_talla',
                    orderable: false,
                    searchable: false,
                    render: function (id, type, row) {
                        if (type !== 'display') return '';

                        let botones = '';

                        if (puedeEditarTipo) {
                            botones += `<button class="btn-editar editarTipoTalla" data-id="${id}" title="Editar tipo"><i class="ph ph-pencil-simple"></i></button>`;
                        }

                        if (puedeCambiarEstadoTipo) {
                            const conTallas = Number(row.tallas_count || 0) > 0;
                            const deshabilitado = row.estado_tipo_talla == 1 && conTallas ? 'disabled' : '';
                            const titulo = deshabilitado ? 'No se puede desactivar: tiene tallas asignadas' : 'Cambiar estado';
                            const clase = row.estado_tipo_talla == 1 ? 'btn-baja' : 'btn-alta';
                            const icono = row.estado_tipo_talla == 1 ? 'ph-prohibit' : 'ph-check-circle';

                            botones += `<button class="${clase} cambiarEstadoTipoTalla" data-id="${id}" data-estado="${row.estado_tipo_talla}" title="${titulo}" ${deshabilitado}><i class="ph ${icono}"></i></button>`;
                        }

                        return botones || '<span class="text-muted">Sin acciones</span>';
                    }
                }
            ],
            order: [[0, 'asc']],
            drawCallback: function () { AnimarFilasVisibles(this.api()); }
        });

        $('#formCrearTipoTalla').on('submit.tallas', function (event) {
            event.preventDefault();

            const nombre = $('#crear_nombre_tipo_talla').val().trim();
            if (!nombre) return mostrarToast('Escribe el nombre del tipo.', 'warning');

            $.ajax({
                url: '/tallas/tipos/crear',
                method: 'POST',
                data: {
                    nombre_tipo_talla: nombre,
                    descripcion_tipo_talla: $('#crear_descripcion_tipo_talla').val(),
                    _token: csrf()
                },
                success: response => {
                    mostrarToast(response.mensaje || 'Tipo creado correctamente.', 'success');
                    this.reset();
                    bootstrap.Modal.getOrCreateInstance($modalCrearTipo[0]).hide();
                    cargarTiposTalla();
                    tablaTipos.ajax.reload(null, false);
                },
                error: xhr => mostrarToast(
                    xhr.responseJSON?.errors?.nombre_tipo_talla?.[0]
                    || xhr.responseJSON?.mensaje
                    || 'No se pudo crear el tipo de talla.',
                    'danger'
                )
            });
        });

        $tablaTipos.on('click.tallas', '.editarTipoTalla', function () {
            const id = $(this).data('id');

            $.get(`/tallas/tipos/editar/${id}`)
                .done(response => {
                    const tipo = response.tipo;

                    $('#editar_id_tipo_talla').val(tipo.id_tipo_talla);
                    $('#editar_nombre_tipo_talla').val(tipo.nombre_tipo_talla);
                    $('#editar_descripcion_tipo_talla').val(tipo.descripcion_tipo_talla || '');
                    $('#editar_tallas_tipo_talla').val(Number(tipo.tallas_count || 0));
                    $('#editar_estado_tipo_talla').val(String(tipo.estado_tipo_talla));
                    $('#editar_estado_tipo_talla_texto').val(tipo.estado_tipo_talla == 1 ? 'Activa' : 'Inactiva');

                    bootstrap.Modal.getOrCreateInstance($modalEditarTipo[0]).show();
                })
                .fail(xhr => mostrarToast(xhr.responseJSON?.mensaje || 'No se pudo cargar el tipo de talla.', 'danger'));
        });

        $('#formEditarTipoTalla').on('submit.tallas', function (event) {
            event.preventDefault();

            const id = $('#editar_id_tipo_talla').val();
            const nombre = $('#editar_nombre_tipo_talla').val().trim();
            const estado = $('#editar_estado_tipo_talla').val();

            if (!nombre) return mostrarToast('Escribe el nombre del tipo.', 'warning');

            $.ajax({
                url: `/tallas/tipos/actualizar/${id}`,
                method: 'PUT',
                data: {
                    nombre_tipo_talla: nombre,
                    descripcion_tipo_talla: $('#editar_descripcion_tipo_talla').val(),
                    estado_tipo_talla: estado,
                    _token: csrf()
                },
                success: response => {
                    mostrarToast(response.mensaje || 'Tipo actualizado correctamente.', 'success');
                    bootstrap.Modal.getOrCreateInstance($modalEditarTipo[0]).hide();
                    cargarTiposTalla();
                    tablaTipos.ajax.reload(null, false);
                    tabla.ajax.reload(null, false);
                },
                error: xhr => mostrarToast(
                    xhr.responseJSON?.errors?.nombre_tipo_talla?.[0]
                    || xhr.responseJSON?.mensaje
                    || 'No se pudo actualizar el tipo de talla.',
                    'danger'
                )
            });
        });

        function modalConfirmarTipo() {
            let modal = document.getElementById('modalConfirmarEstadoTipoTalla');
            if (modal) return modal;

            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="modalConfirmarEstadoTipoTalla" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Confirmar cambio de estado</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                            </div>
                            <div class="modal-body"><div class="card-responsive" id="mensajeConfirmarEstadoTipoTalla"></div></div>
                            <div class="modal-footer">
                                <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstadoTipoTalla">Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            return document.getElementById('modalConfirmarEstadoTipoTalla');
        }

        $tablaTipos.on('click.tallas', '.cambiarEstadoTipoTalla', function () {
            const id = $(this).data('id');
            const estaActiva = String($(this).data('estado')) === '1';
            const modalElement = modalConfirmarTipo();
            const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

            $('#mensajeConfirmarEstadoTipoTalla').text(
                estaActiva ? '¿Deseas desactivar este tipo de talla?' : '¿Deseas volver a activar este tipo de talla?'
            );

            $('#confirmarCambioEstadoTipoTalla').off('click.tallas').on('click.tallas', function () {
                const boton = $(this);
                boton.prop('disabled', true);

                $.ajax({
                    url: `/tallas/tipos/cambiar-estado/${id}`,
                    method: 'PUT',
                    data: { _token: csrf() },
                    success: response => {
                        mostrarToast(response.mensaje || 'Estado actualizado.', 'success');
                        cargarTiposTalla();
                        tablaTipos.ajax.reload(null, false);
                        modal.hide();
                    },
                    error: xhr => mostrarToast(xhr.responseJSON?.mensaje || 'No se pudo cambiar el estado.', 'danger'),
                    complete: () => boton.prop('disabled', false)
                });
            });

            modal.show();
        });

        $modalCrearTipo.off('hidden.bs.modal.tallas').on('hidden.bs.modal.tallas', () => $('#formCrearTipoTalla')[0].reset());

        /* La tabla de tipos vive en un modal: se ajusta y recarga al abrirlo. */
        $('#modalTiposTalla').off('shown.bs.modal.tallas').on('shown.bs.modal.tallas', function () {
            if (!tablaTipos) return;

            tablaTipos.columns.adjust();
            tablaTipos.ajax.reload(null, false);
        });

        /* Abrir "Agregar tipo" desde el modal de tipos (no se pueden apilar dos). */
        $('#btnNuevoTipoTalla').off('click.tallas').on('click.tallas', function () {
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalTiposTalla')).hide();

            setTimeout(() => {
                bootstrap.Modal.getOrCreateInstance($modalCrearTipo[0]).show();
            }, 260);
        });
    }
}
