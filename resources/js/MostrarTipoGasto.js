export default function initTipoGasto() {

    document.getElementById('titulo').textContent = 'CLASIFICACION DE GASTOS';

    $.fn.dataTable.ext.search.push( // Check de tipos de gasto inactivos
        function(settings, data, dataIndex) {
            const ocultar = $('#toggleInactivosTipoGasto').is(':checked');
            if (!ocultar) return true; // no filtrar si el checkbox está desmarcado
            const estado = data[2]; // columna "estado_tipo_gasto"
            return estado.includes('Activo'); // solo mostrar activos
        }
    );

    $('#toggleInactivosTipoGasto').on('change', function() { tabla.draw(); });

    // Inicializar DataTable
    const tabla = $('#tablaTipoGasto').DataTable({
        
        ajax: { url: '/tipo-gasto/mostrar', type: 'GET', dataSrc: 'tipos_gasto' },

        columns: [
            { data: 'nombre_tipo_gasto' },
            { data: 'descripcion_tipo_gasto' },

            { 
                data: 'estado_tipo_gasto',
                render: function(data){
                    return data == 1 
                        ? '<span class="estado estado-activo">Activo</span>'
                        : '<span class="estado estado-inactivo">Inactivo</span>';
                }
            },
            
            {
                data: 'id_tipo_gasto',
                orderable: false,
                searchable: false,
                render: function(data, type, row){
                    let botonEstado = row.estado_tipo_gasto == 1 
                        ? `<button class="btn-baja bajaTipoGasto" data-id="${data}">
                        
                            <i class="ph ph-prohibit"></i>
                        
                        </button>` 

                        : `<button class="btn-baja bajaTipoGasto" data-id="${data}">
                        
                            <i class="ph ph-check-circle"></i>
                        
                        </button>`;

                    return `
                        <button class="btn-editar editarTipoGasto" data-id="${data}">
                        
                            <i class="ph ph-pencil-simple"></i>
                        
                        </button>
                        ${botonEstado}
                    `;
                }
            }
        ], drawCallback: function () { AnimarFilasVisibles(this.api()); }
    });

    // Click en botón Editar
    $('#tablaTipoGasto').on('click', '.editarTipoGasto', function(){
        const id = $(this).data('id');
        abrirModalEditar(id);
    });

    // Abrir modal y llenar datos
    function abrirModalEditar(id) {
        $.get(`/tipo-gasto/${id}/editar`, function(res){
            const tipo_gasto = res.tipo_gasto;

            $('#editar_id_tipo_gasto').val(tipo_gasto.id_tipo_gasto);
            $('#editar_nombre_tipo_gasto').val(tipo_gasto.nombre_tipo_gasto);
            $('#editar_descripcion_tipo_gasto').val(tipo_gasto.descripcion_tipo_gasto);
            $('#editar_estado_tipo_gasto').val(tipo_gasto.estado_tipo_gasto);

            const modal = new bootstrap.Modal(document.getElementById("modalEditarTipoGasto"));
            modal.show();
        });
    }

    // Actualizar tipo de gasto
    $('#btnActualizarTipoGasto').click(function() {

        const nombre = $('#editar_nombre_tipo_gasto').val().trim();
        const descripcion = $('#editar_descripcion_tipo_gasto').val().trim();
        const estado = $('#editar_estado_tipo_gasto').val();
        const id = $('#editar_id_tipo_gasto').val();

        if(nombre === ''){
            mostrarToast('El nombre del tipo de gasto es obligatorio', 'danger');
            return;
        }

        const datos = {
            nombre_tipo_gasto: nombre,
            descripcion_tipo_gasto: descripcion,
            estado_tipo_gasto: estado,
            _token: $('meta[name="csrf-token"]').attr('content')
        };

        $.ajax({
            url: `/tipo-gasto/${id}/actualizar/`,
            type: 'PUT',
            data: datos,
            success: function(res){
                mostrarToast('Tipo de gasto actualizado correctamente', 'success');
                tabla.ajax.reload();

                const modalElement = document.getElementById("modalEditarTipoGasto");
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

/* ------------------------------------------------------------------------------------------- */

/* BAJA TIPO DE GASTO */

    document.addEventListener("click", async function(e) {

        if (e.target.classList.contains("bajaTipoGasto")) {

            const id = e.target.dataset.id;
            let modalElement = document.getElementById("modalConfirmarEstadoTipoGasto");

            // Crear modal si no existe
            if (!modalElement) {
                const modalHTML = `
                    <div class="modal fade" id="modalConfirmarEstadoTipoGasto" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">

                                <div class="modal-header">
                                    <h5 class="modal-title">Confirmar acción</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>

                                <div class="modal-body">
                                    <div class="card-responsive">
                                        ¿Deseas cambiar el estado de este tipo de gasto?
                                    </div>
                                </div>

                                <div class="modal-footer">
                                    <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                                    <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstadoTipoGasto">Confirmar</button>
                                </div>

                            </div>
                        </div>
                    </div>`;
                
                document.body.insertAdjacentHTML("beforeend", modalHTML);
                modalElement = document.getElementById("modalConfirmarEstadoTipoGasto");
            }

            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            const botonConfirmar = modalElement.querySelector("#confirmarCambioEstadoTipoGasto");

            botonConfirmar.onclick = async function () {

                try {
                    const response = await fetch(`/tipo-gasto/cambiar-estado/${id}`, {
                        method: "POST",
                        headers: {
                            "X-CSRF-TOKEN": document
                                .querySelector('meta[name="csrf-token"]')
                                .getAttribute("content")
                        }
                    });

                    const data = await response.json();

                    if (data.success) {
                        mostrarToast("Estado del tipo de gasto actualizado", "success");
                        $('#tablaTipoGasto').DataTable().ajax.reload(null, false);
                    } else {
                        mostrarToast(data.mensaje || "Error al cambiar estado", "danger");
                    }

                } catch (error) {
                    mostrarToast("Error de conexión", "danger");
                    console.error(error);
                }

                modal.hide();
            };
        }
    });

/* ------------------------------------------------------------------------------------------- */

/* CREAR TIPO DE GASTO */

    function creartipogasto() {

        // Click en botón Crear Tipo de Gasto
        $('#btnGuardarTipoGasto').click(function() {

            const nombre = $('#crear_nombre_tipo_gasto').val().trim();
            const descripcion = $('#crear_descripcion_tipo_gasto').val().trim();

            if(nombre === '') {
                mostrarToast('El nombre del tipo de gasto es obligatorio', 'danger');
                return;
            }

            const datos = {
                nombre_tipo_gasto: nombre,
                descripcion_tipo_gasto: descripcion,
                _token: $('meta[name="csrf-token"]').attr('content')
            };

            $.ajax({
                url: '/tipo-gasto/crear',
                type: 'POST',
                data: datos,
                success: function(res){
                    mostrarToast('Tipo de gasto creado correctamente', 'success');

                    // Limpiar formulario
                    $('#formCrearTipoGasto')[0].reset();

                    // Cerrar modal
                    const modalElement = document.getElementById("modalCrearTipoGasto");
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if(modalInstance) modalInstance.hide();

                    // Recargar DataTable
                    if($.fn.DataTable.isDataTable('#tablaTipoGasto')){
                        $('#tablaTipoGasto').DataTable().ajax.reload();
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
        $('#modalCrearTipoGasto').on('hidden.bs.modal', function () {
            $('#formCrearTipoGasto')[0].reset();
        });

    }; creartipogasto();



/* ------------------------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------------------- */

};