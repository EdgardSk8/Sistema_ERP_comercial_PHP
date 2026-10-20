const filtroMetodosPago = function(settings, data) {
    if (settings.nTable.id !== 'tablaMetodosPago') return true;
    if (!$('#toggleInactivosMetodosPago').is(':checked')) return true;
    return data[2].includes('Activo');
};

export default function initMostrarMetodosPagos() {

    document.getElementById('titulo').textContent = 'METODOS DE PAGO';

    if (!$.fn.dataTable.ext.search.includes(filtroMetodosPago)) {
        $.fn.dataTable.ext.search.push(filtroMetodosPago);
    }

    $('#toggleInactivosMetodosPago').off('change.metodosPago').on('change.metodosPago', function() { tabla.draw(); });

    // Inicializar DataTable
    const tabla = $('#tablaMetodosPago').DataTable({

        ajax: { url: '/metodos-pago/mostrar', type: 'GET', dataSrc: 'metodos_pago' },

        columns: [
            { data: 'nombre_metodo_pago' },
            { data: 'descripcion_metodo_pago' },

            { data: 'estado_metodo_pago',
                render: function(data){
                    return data == 1 
                        ? '<span class="estado estado-activo">Activo</span>'
                        : '<span class="estado estado-inactivo">Inactivo</span>';
                }
            },

            { data: 'id_metodo_pago',
                orderable: false,
                searchable: false,
                render: function(data, type, row){

                    let botonEstado = row.estado_metodo_pago == 1 
                        ? `<button class="btn-baja bajaMetodoPago" data-id="${data}">
                        
                            <i class="ph ph-prohibit"></i>
                        
                        </button>` 

                        : `<button class="btn-baja bajaMetodoPago" data-id="${data}">
                        
                            <i class="ph ph-check-circle"></i>
                        
                        </button>`;

                    return `
                    
                        <button class="btn-editar editarMetodoPago" data-id="${data}">
                        
                            <i class="ph ph-pencil-simple"></i>
                        
                        </button>

                        ${botonEstado}
                    `;
                }
            }
        ], drawCallback: function () { AnimarFilasVisibles(this.api()); }
    });

    configurarToggleColumnas('tablaMetodosPago');

    // Click en botón Editar
    $('#tablaMetodosPago').off('click.metodosPago', '.editarMetodoPago').on('click.metodosPago', '.editarMetodoPago', function(){
        const id = $(this).data('id');
        abrirModalEditar(id);
    });

    // Abrir modal y llenar datos
    function abrirModalEditar(id) {
        $.get(`/metodos-pago/${id}/editar`, function(res){

            const metodo = res.metodo_pago;

            $('#editar_id_metodo_pago').val(metodo.id_metodo_pago);
            $('#editar_nombre_metodo_pago').val(metodo.nombre_metodo_pago);
            $('#editar_descripcion_metodo_pago').val(metodo.descripcion_metodo_pago);
            $('#editar_estado_metodo_pago').val(metodo.estado_metodo_pago);

            const modal = new bootstrap.Modal(document.getElementById("modalEditarMetodoPago"));
            modal.show();
        });
    }

    // Actualizar método de pago
    $('#btnActualizarMetodoPago').off('click.metodosPago').on('click.metodosPago', function() {

        const nombre = $('#editar_nombre_metodo_pago').val().trim();
        const descripcion = $('#editar_descripcion_metodo_pago').val().trim();
        const estado = $('#editar_estado_metodo_pago').val();
        const id = $('#editar_id_metodo_pago').val();

        if(nombre === ''){
            mostrarToast('El nombre del método de pago es obligatorio', 'danger');
            return;
        }

        const datos = {
            nombre_metodo_pago: nombre,
            descripcion_metodo_pago: descripcion,
            estado_metodo_pago: estado,
            _token: $('meta[name="csrf-token"]').attr('content')
        };

        $.ajax({
            url: `/metodos-pago/${id}/actualizar`,
            type: 'PUT',
            data: datos,
            success: function(res){

                mostrarToast('Método de pago actualizado correctamente', 'success');

                tabla.ajax.reload();

                const modalElement = document.getElementById("modalEditarMetodoPago");
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                modalInstance.hide();
            },
            error: function(err){

                console.error(err);

                if(err.status === 422){

                    const errores = err.responseJSON.errors;
                    let mensaje = '';

                    for(let campo in errores){
                        mensaje = errores[campo][0];
                        break;
                    }

                    mostrarToast(mensaje, 'danger');
                } 
                else if(err.responseJSON && err.responseJSON.mensaje){

                    mostrarToast(err.responseJSON.mensaje, 'danger');
                } 
                else {

                    mostrarToast('Error inesperado del servidor', 'danger');
                }
            }
        });

    });

/* ------------------------------------------------------------------------------------------------------ */

    function crearmetododepago() {

        // Click en botón Crear Método de Pago
        $('#btnGuardarMetodoPago').off('click.metodosPago').on('click.metodosPago', function() {

            const nombre = $('#crear_nombre_metodo_pago').val().trim();
            const descripcion = $('#crear_descripcion_metodo_pago').val().trim();

            if(nombre === '') {
                mostrarToast('El nombre del método de pago es obligatorio', 'danger');
                return;
            }

            const datos = {
                nombre_metodo_pago: nombre,
                descripcion_metodo_pago: descripcion,
                _token: $('meta[name="csrf-token"]').attr('content')
            };

            $.ajax({
                url: '/metodos-pago/crear',
                type: 'POST',
                data: datos,
                success: function(res){

                    mostrarToast('Método de pago creado correctamente', 'success');

                    // Limpiar formulario
                    $('#formCrearMetodoPago')[0].reset();

                    // Cerrar modal
                    const modalElement = document.getElementById("modalCrearMetodoPago");
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if(modalInstance) modalInstance.hide();

                    // Recargar DataTable
                    if($.fn.DataTable.isDataTable('#tablaMetodosPago')){
                        $('#tablaMetodosPago').DataTable().ajax.reload();
                    }
                },
                error: function(err){

                    console.error(err);

                    if(err.status === 422){

                        const errores = err.responseJSON.errors;
                        let mensaje = '';

                        for(let campo in errores){
                            mensaje = errores[campo][0];
                            break;
                        }

                        mostrarToast(mensaje, 'danger');
                    } 
                    else if(err.responseJSON && err.responseJSON.mensaje){

                        mostrarToast(err.responseJSON.mensaje, 'danger');
                    } 
                    else {

                        mostrarToast('Error inesperado del servidor', 'danger');
                    }
                }
            });

        });

        // Limpiar formulario al cerrar modal
        $('#modalCrearMetodoPago').off('hidden.bs.modal.metodosPago').on('hidden.bs.modal.metodosPago', function () { $('#formCrearMetodoPago')[0].reset(); });

    }; crearmetododepago();

/* ------------------------------------------------------------------------------------------------------ */

    $(document).off('click.metodosPagoBaja').on('click.metodosPagoBaja', '#tablaMetodosPago .bajaMetodoPago', async function(e) {

            const id = this.dataset.id;
            let modalElement = document.getElementById("modalConfirmarEstadoMetodoPago");

            // Crear modal si no existe
            if (!modalElement) {

                const modalHTML = `
                    <div class="modal fade" id="modalConfirmarEstadoMetodoPago" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">

                                <div class="modal-header">
                                    <h5 class="modal-title">Confirmar acción</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>

                                <div class="modal-body">
                                    <div class="card-responsive">
                                        ¿Deseas cambiar el estado de este método de pago?
                                    </div>
                                </div>

                                <div class="modal-footer">
                                    <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                                    <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstadoMetodoPago">Confirmar</button>
                                </div>

                            </div>
                        </div>
                    </div>`;

                document.body.insertAdjacentHTML("beforeend", modalHTML);
                modalElement = document.getElementById("modalConfirmarEstadoMetodoPago");
            }

            const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
            modal.show();

            const botonConfirmar = modalElement.querySelector("#confirmarCambioEstadoMetodoPago");

            botonConfirmar.onclick = async function () {

                try {

                    const response = await fetch(`/metodos-pago/cambiar-estado/${id}`, {
                        method: "POST",
                        headers: {
                            "X-CSRF-TOKEN": document
                                .querySelector('meta[name="csrf-token"]')
                                .getAttribute("content")
                        }
                    });

                    const data = await response.json();

                    if (data.success) {

                        mostrarToast("Estado del método de pago actualizado", "success");

                        $('#tablaMetodosPago').DataTable().ajax.reload(null, false);

                    } else {

                        mostrarToast(data.mensaje || "Error al cambiar estado", "danger");
                    }

                } catch (error) {

                    mostrarToast("Error de conexión", "danger");
                    console.error(error);

                }

                modal.hide();
            };
    });

/* ------------------------------------------------------------------------------------------------------ */


};