export default function initMostrarTiposMedidas() {

    document.getElementById('titulo').textContent = 'GESTIÓN DE TIPOS DE MEDIDA';

    $.fn.dataTable.ext.search.push( // Check de tipos de medida inactivos
        function(settings, data, dataIndex) {

            if (settings.nTable.id !== 'tablaTiposMedidas') return true;

            const ocultar = $('#toggleInactivosTiposMedidas').is(':checked');
            if (!ocultar) return true;

            const estado = data[3]; // Columna Estado
            return estado.includes('Activo');
        }
    );

    $('#toggleInactivosTiposMedidas').on('change', function () { tabla.draw(); });

    const tabla = $('#tablaTiposMedidas').DataTable({

        ajax: { url: '/tipos-medidas/mostrar', type: 'GET', dataSrc: 'tipos_medidas' },

        columns: [

            { data: 'nombre_tipo_medida' },

            { data: 'descripcion_tipo_medida' },

            { data: 'fecha_creacion_tipo_medida', render: function (data) { return formatearFechaDia(data); } },

            { data: 'estado_tipo_medida',
                render: function (data) {
                    return data == 1
                        ? '<span class="estado estado-activo">Activo</span>'
                        : '<span class="estado estado-inactivo">Inactivo</span>';
                }
            },

            {
                data: 'id_tipo_medida',
                orderable: false,
                searchable: false,
                render: function (data, type, row) {

                    let botonEstado = row.estado_tipo_medida == 1
                        ? `<button class="btn-baja bajaTipoMedida" data-id="${data}">
                                <i class="ph ph-prohibit"></i>
                           </button>`
                        : `<button class="btn-alta bajaTipoMedida" data-id="${data}">
                                <i class="ph ph-check-circle"></i>
                           </button>`;

                    return `
                        <button class="btn-editar editarTipoMedida" data-id="${data}">
                            <i class="ph ph-pencil-simple"></i>
                        </button>

                        ${botonEstado}
                    `;
                }
            }

        ], drawCallback: function () { AnimarFilasVisibles(this.api()); }

    });

    configurarToggleColumnas('tablaTiposMedidas');

/* ------------------------------------------------------------------------------------------------- */

    /* CREAR TIPO DE MEDIDA */

    $('#btnGuardarTipoMedida').on('click', function () {

        const nombre = $('#crear_nombre_tipo_medida').val().trim();
        const descripcion = $('#crear_descripcion_tipo_medida').val().trim();

        if (nombre === '') { mostrarToast('El nombre del tipo de medida es obligatorio', 'danger'); return; }

        const datos = {
            nombre_tipo_medida: nombre,
            descripcion_tipo_medida: descripcion,
            _token: $('meta[name="csrf-token"]').attr('content')
        };

        $.ajax({    url: '/tipos-medidas/crear', type: 'POST', data: datos,

            success: function () {

                mostrarToast('Tipo de medida creado correctamente', 'success');

                // Limpiar formulario
                $('#formCrearTipoMedida')[0].reset();

                // Cerrar modal
                const modalElement = document.getElementById('modalCrearTipoMedida');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);

                if (modalInstance) {
                    modalInstance.hide();
                }

                // Recargar DataTable
                if ($.fn.DataTable.isDataTable('#tablaTiposMedidas')) {
                    $('#tablaTiposMedidas').DataTable().ajax.reload(null, false);
                }

            },

            error: function (err) {

                console.error(err);

                if (err.status === 422) {
                    const errores = err.responseJSON.errors;
                    let mensaje = '';
                    for (let campo in errores) { mensaje = errores[campo][0]; break; }
                    mostrarToast(mensaje, 'danger');

                } else if (err.responseJSON && err.responseJSON.mensaje) {
                    mostrarToast(err.responseJSON.mensaje, 'danger');
                } else { mostrarToast('Error inesperado del servidor', 'danger'); }

            }

        });

    });

    $('#modalCrearTipoMedida').on('hidden.bs.modal', function () { $('#formCrearTipoMedida')[0].reset(); });

/* ------------------------------------------------------------------------------------------------- */

    /* EDITAR TIPO DE MEDIDA */

    $('#tablaTiposMedidas').on('click', '.editarTipoMedida', function () {
        const id = $(this).data('id');
        abrirModalEditar(id);
    });

    // Abrir modal y llenar datos
    function abrirModalEditar(id) {

        $.get(`/tipos-medidas/editar/${id}`, function (res) {

            const tipoMedida = res.tipo_medida;

            $('#editar_id_tipo_medida').val(tipoMedida.id_tipo_medida);
            $('#editar_nombre_tipo_medida').val(tipoMedida.nombre_tipo_medida);
            $('#editar_descripcion_tipo_medida').val(tipoMedida.descripcion_tipo_medida);
            $('#editar_estado_tipo_medida').val(tipoMedida.estado_tipo_medida);

            const fecha = tipoMedida.fecha_creacion_tipo_medida
                ? tipoMedida.fecha_creacion_tipo_medida.replace(" ", "T").substring(0, 16)
                : '';

            $('#editar_fecha_creacion_tipo_medida').val(fecha);

            const modal = new bootstrap.Modal(document.getElementById("modalEditarTipoMedida"));
            modal.show();

        });

    }

    // Actualizar Tipo de Medida
    $('#btnActualizarTipoMedida').click(function () {

        const nombre = $('#editar_nombre_tipo_medida').val().trim();
        const descripcion = $('#editar_descripcion_tipo_medida').val().trim();
        const estado = $('#editar_estado_tipo_medida').val();
        const id = $('#editar_id_tipo_medida').val();

        if (nombre === '') {
            mostrarToast('El nombre del tipo de medida es obligatorio', 'danger');
            return;
        }

        const datos = {

            nombre_tipo_medida: nombre,
            descripcion_tipo_medida: descripcion,
            estado_tipo_medida: estado,
            _token: $('meta[name="csrf-token"]').attr('content')

        };

        $.ajax({

            url: `/tipos-medidas/actualizar/${id}`,
            type: 'PUT',
            data: datos,

            success: function (res) {

                mostrarToast('Tipo de medida actualizado correctamente', 'success');

                tabla.ajax.reload();

                const modalElement = document.getElementById("modalEditarTipoMedida");
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                modalInstance.hide();

            },

            error: function (err) {

                console.error(err);

                if (err.status === 422) {

                    const errores = err.responseJSON.errors;
                    let mensaje = '';

                    for (let campo in errores) {
                        mensaje = errores[campo][0];
                        break;
                    }

                    mostrarToast(mensaje, 'danger');

                }
                else if (err.responseJSON && err.responseJSON.mensaje) {

                    mostrarToast(err.responseJSON.mensaje, 'danger');

                }
                else {

                    mostrarToast('Error inesperado del servidor', 'danger');

                }

            }

        });

    });

/* ------------------------------------------------------------------------------------------------- */

    /* DAR DE BAJA TIPO DE MEDIDA */

    document.addEventListener("click", async function (e) {

        const boton = e.target.closest(".bajaTipoMedida");
        if (!boton) return;

        const id = boton.dataset.id;
        let modalElement = document.getElementById("modalConfirmarEstadoTipoMedida");

        // Crear modal si no existe
        if (!modalElement) {

            const modalHTML = `
                <div class="modal fade" id="modalConfirmarEstadoTipoMedida" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">

                            <div class="modal-header">
                                <h5 class="modal-title">Confirmar acción</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>

                            <div class="modal-body">
                                <div class="card-responsive">
                                    ¿Deseas cambiar el estado de este tipo de medida?
                                </div>
                            </div>

                            <div class="modal-footer">
                                <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstadoTipoMedida">
                                    Confirmar
                                </button>
                            </div>

                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML("beforeend", modalHTML);
            modalElement = document.getElementById("modalConfirmarEstadoTipoMedida");
        }

        // Evita crear múltiples instancias del modal
        let modal = bootstrap.Modal.getInstance(modalElement);

        if (!modal) { modal = new bootstrap.Modal(modalElement); }
        modal.show();

        const botonConfirmar = modalElement.querySelector("#confirmarCambioEstadoTipoMedida");
        botonConfirmar.onclick = null; // Evitar multiples click acumulados

        botonConfirmar.onclick = async function () {

            try {

                const response = await fetch(`/tipos-medidas/cambiar-estado/${id}`, {
                    method: "PUT",
                    headers: { "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content") }
                });

                const data = await response.json();

                if (data.success) {
                    mostrarToast("Estado del tipo de medida actualizado", "success");
                    $('#tablaTiposMedidas').DataTable().ajax.reload(null, false);
                } else {
                    mostrarToast(data.mensaje || "Error al cambiar estado", "danger");
                }

            } catch (error) {
                console.error(error);
                mostrarToast("Error de conexión", "danger");
            }
            modal.hide();
        };

    });

}