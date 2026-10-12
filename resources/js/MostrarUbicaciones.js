export default function initMostrarUbicaciones() {
    const $tabla = $('#tablaUbicaciones');
    const titulo = document.getElementById('titulo');
    const modalCrear = document.getElementById('modalCrearUbicacion');
    const modalEditar = document.getElementById('modalEditarUbicacion');
    const token = () => $('meta[name="csrf-token"]').attr('content');

    if (!$tabla.length) return;
    if (titulo) titulo.textContent = 'GESTIÓN DE UBICACIONES';
    if ($.fn.DataTable.isDataTable($tabla[0])) $tabla.DataTable().destroy();

    function escapar(valor) {
        return $('<div>').text(valor ?? '').html();
    }

    function mostrarError(xhr, fallback) {
        const errores = xhr.responseJSON?.errors;
        const primerError = errores ? Object.values(errores).flat()[0] : null;
        mostrarToast(xhr.responseJSON?.mensaje || primerError || fallback, 'danger');
    }

    const tabla = $tabla.DataTable({
        ajax: {
            url: '/ubicaciones/mostrar',
            type: 'GET',
            dataSrc: response => response.ubicaciones || []
        },
        columns: [
            { data: 'nombre_ubicacion', render: data => escapar(data) },
            { data: 'descripcion_ubicacion', render: data => escapar(data || '—') },
            {
                data: 'estado_ubicacion',
                render: (data, type) => {
                    const activa = Number(data) === 1;
                    const etiqueta = activa ? 'Activa' : 'Inactiva';

                    if (type === 'filter' || type === 'sort') return etiqueta;
                    return activa
                        ? '<span class="estado estado-activo">Activa</span>'
                        : '<span class="estado estado-inactivo">Inactiva</span>';
                }
            },
            {
                data: 'id_ubicacion',
                orderable: false,
                searchable: false,
                render: (id, type, ubicacion) => {
                    const activa = Number(ubicacion.estado_ubicacion) === 1;
                    const tituloEstado = activa ? 'Dar de baja' : 'Reactivar';
                    const iconoEstado = activa ? 'fa-ban' : 'fa-circle-check';
                    const claseEstado = activa ? 'btn-baja' : 'btn-alta';

                    return `
                        <button type="button" class="btn-editar editarUbicacion" data-id="${id}" title="Editar ubicación" aria-label="Editar ubicación">
                            <i class="fa-solid fa-pencil-alt"></i>
                        </button>
                        <button type="button" class="${claseEstado} cambiarEstadoUbicacion" data-id="${id}" data-activa="${activa}" title="${tituloEstado}" aria-label="${tituloEstado}">
                            <i class="fa-solid ${iconoEstado}"></i>
                        </button>
                    `;
                }
            }
        ],
        order: [[0, 'asc']],
        drawCallback: function () {
            AnimarFilasVisibles(this.api());
        }
    });

    configurarToggleColumnas('tablaUbicaciones');

    $('#toggleInactivosUbicaciones').off('change.ubicaciones').on('change.ubicaciones', function () {
        tabla.column(2).search(this.checked ? '^Activa$' : '', true, false).draw();
    }).trigger('change');

    $('#modalCrearUbicacion').off('hidden.bs.modal.ubicaciones').on('hidden.bs.modal.ubicaciones', function () {
        $('#formCrearUbicacion')[0].reset();
    });

    $('#formCrearUbicacion').off('submit.ubicaciones').on('submit.ubicaciones', function (event) {
        event.preventDefault();
        $('#btnGuardarUbicacion').trigger('click');
    });

    $('#formEditarUbicacion').off('submit.ubicaciones').on('submit.ubicaciones', function (event) {
        event.preventDefault();
        $('#btnActualizarUbicacion').trigger('click');
    });

    $tabla.off('click.ubicaciones', '.editarUbicacion').on('click.ubicaciones', '.editarUbicacion', function () {
        const id = $(this).data('id');
        $.getJSON(`/ubicaciones/editar/${id}`)
            .done(response => {
                if (!response.success || !response.ubicacion) {
                    return mostrarToast(response.mensaje || 'No se encontró la ubicación.', 'danger');
                }

                $('#editar_id_ubicacion').val(response.ubicacion.id_ubicacion);
                $('#editar_nombre_ubicacion').val(response.ubicacion.nombre_ubicacion);
                $('#editar_descripcion_ubicacion').val(response.ubicacion.descripcion_ubicacion || '');
                bootstrap.Modal.getOrCreateInstance(modalEditar).show();
            })
            .fail(xhr => mostrarError(xhr, 'Error al obtener la ubicación.'));
    });

    $('#btnGuardarUbicacion').off('click.ubicaciones').on('click.ubicaciones', function () {
        const nombre = $('#crear_nombre_ubicacion').val().trim();
        const descripcion = $('#crear_descripcion_ubicacion').val().trim();

        if (!nombre) {
            mostrarToast('El nombre de la ubicación es obligatorio.', 'danger');
            return;
        }

        const $boton = $(this).prop('disabled', true);
        $.ajax({
            url: '/ubicaciones/crear',
            type: 'POST',
            data: {
                nombre_ubicacion: nombre,
                descripcion_ubicacion: descripcion,
                _token: token()
            },
            headers: { 'X-CSRF-TOKEN': token() },
            success: response => {
                if (!response.success) return mostrarToast(response.mensaje || 'No se pudo crear la ubicación.', 'danger');
                mostrarToast(response.mensaje || 'Ubicación creada correctamente.', 'success');
                bootstrap.Modal.getOrCreateInstance(modalCrear).hide();
                tabla.ajax.reload(null, false);
            },
            error: xhr => mostrarError(xhr, 'Error al crear la ubicación.'),
            complete: () => $boton.prop('disabled', false)
        });
    });

    $('#btnActualizarUbicacion').off('click.ubicaciones').on('click.ubicaciones', function () {
        const id = $('#editar_id_ubicacion').val();
        const nombre = $('#editar_nombre_ubicacion').val().trim();
        const descripcion = $('#editar_descripcion_ubicacion').val().trim();

        if (!nombre) {
            mostrarToast('El nombre de la ubicación es obligatorio.', 'danger');
            return;
        }

        const $boton = $(this).prop('disabled', true);
        $.ajax({
            url: `/ubicaciones/actualizar/${id}`,
            type: 'PUT',
            data: {
                nombre_ubicacion: nombre,
                descripcion_ubicacion: descripcion,
                _token: token()
            },
            headers: { 'X-CSRF-TOKEN': token() },
            success: response => {
                if (!response.success) return mostrarToast(response.mensaje || 'No se pudo actualizar la ubicación.', 'danger');
                mostrarToast(response.mensaje || 'Ubicación actualizada correctamente.', 'success');
                bootstrap.Modal.getOrCreateInstance(modalEditar).hide();
                tabla.ajax.reload(null, false);
            },
            error: xhr => mostrarError(xhr, 'Error al actualizar la ubicación.'),
            complete: () => $boton.prop('disabled', false)
        });
    });

    let cambioEstadoPendiente = null;
    const modalEstado = document.getElementById('modalConfirmarEstadoUbicacion');
    const instanciaModalEstado = bootstrap.Modal.getOrCreateInstance(modalEstado);

    $tabla.off('click.ubicaciones', '.cambiarEstadoUbicacion').on('click.ubicaciones', '.cambiarEstadoUbicacion', function () {
        const activa = String($(this).data('activa')) === 'true';
        cambioEstadoPendiente = { id: $(this).data('id'), activa };
        $('#mensajeConfirmarEstadoUbicacion').text(
            activa
                ? '¿Deseas dar de baja esta ubicación? Los productos existentes conservarán su referencia.'
                : '¿Deseas reactivar esta ubicación?'
        );
        instanciaModalEstado.show();
    });

    $('#confirmarCambioEstadoUbicacion').off('click.ubicaciones').on('click.ubicaciones', function () {
        if (!cambioEstadoPendiente) return;

        const $boton = $(this).prop('disabled', true);
        $.ajax({
            url: `/ubicaciones/cambiar-estado/${cambioEstadoPendiente.id}`,
            type: 'POST',
            data: { _token: token() },
            headers: { 'X-CSRF-TOKEN': token() },
            success: response => {
                if (!response.success) return mostrarToast(response.mensaje || 'No se pudo cambiar el estado.', 'danger');
                mostrarToast(response.mensaje || 'Estado actualizado correctamente.', 'success');
                tabla.ajax.reload(null, false);
            },
            error: xhr => mostrarError(xhr, 'Error al cambiar el estado de la ubicación.'),
            complete: () => {
                $boton.prop('disabled', false);
                instanciaModalEstado.hide();
                cambioEstadoPendiente = null;
            }
        });
    });
}