export default function initMostrarImpuestos() {

    document.getElementById('titulo').textContent = 'GESTION DE IMPUESTOS';

    $.fn.dataTable.ext.search.push( // Check de impuestos inactivos
        function(settings, data, dataIndex) {
            const ocultar = $('#toggleInactivosImpuestos').is(':checked');
            if (!ocultar) return true;
            const estado = data[3]; // columna estado
            return estado.includes('Activo');
        }
    );

    $('#toggleInactivosImpuestos').on('change', function() { tabla.draw(); });

    // Inicializar DataTable
    const tabla = $('#tablaImpuestos').DataTable({

        ajax: { url: '/impuestos/mostrar', type: 'GET', dataSrc: 'impuestos' },

        columns: [
            { data: 'nombre_impuesto' },

            { data: 'porcentaje_impuesto', render: function(data){ return data + ' %'; } },

            { data: 'fecha_creacion_impuesto', render: function (data, type, row) { return formatearFechaDia(data); } },
                
            { data: 'estado_impuesto',
                render: function(data){
                    return data == 1 
                        ? '<span class="estado estado-activo">Activo</span>'
                        : '<span class="estado estado-inactivo">Inactivo</span>';
                }
            },

            { data: 'id_impuesto',
                orderable: false,
                searchable: false,
                render: function(data, type, row){

                    let botonEstado = row.estado_impuesto == 1 
                        ? `<button class="btn-baja bajaImpuesto" data-id="${data}">
                        
                            <i class="ph ph-prohibit"></i>

                        </button>` 

                        : `<button class="btn-alta bajaImpuesto" data-id="${data}">
                        
                            <i class="ph ph-check-circle"></i>
                        
                        </button>`;

                    return `
                        <button class="btn-editar editarImpuesto" data-id="${data}">
                        
                            <i class="ph ph-pencil-simple"></i>
                        
                        </button>

                        ${botonEstado}
                    `;
                }
            }
        ], drawCallback: function () { AnimarFilasVisibles(this.api()); }

       
    });

    configurarToggleColumnas('tablaImpuestos');

/* ------------------------------------------------------------------------------------------------- */

    $('#tablaImpuestos').on('click', '.editarImpuesto', function(){
        const id = $(this).data('id'); abrirModalEditar(id);
    });

    // Abrir modal y llenar datos
    function abrirModalEditar(id) {

        $.get(`/impuestos/${id}/editar`, function(res){

            const impuesto = res.impuesto;

            $('#editar_id_impuesto').val(impuesto.id_impuesto);
            $('#editar_nombre_impuesto').val(impuesto.nombre_impuesto);
            $('#editar_porcentaje_impuesto').val(impuesto.porcentaje_impuesto);
            $('#editar_estado_impuesto').val(impuesto.estado_impuesto);

            // convertir fecha para datetime-local
            const fecha = impuesto.fecha_creacion_impuesto
                ? impuesto.fecha_creacion_impuesto.replace(" ", "T").substring(0,16)
                : '';

            $('#editar_fecha_creacion_impuesto').val(fecha);

            const modal = new bootstrap.Modal(document.getElementById("modalEditarImpuesto"));
            modal.show();

        });

    }

    // Actualizar impuesto
    $('#btnActualizarImpuesto').click(function() {

        const nombre = $('#editar_nombre_impuesto').val().trim();
        const porcentaje = $('#editar_porcentaje_impuesto').val();
        const estado = $('#editar_estado_impuesto').val();
        const id = $('#editar_id_impuesto').val();

        if(nombre === ''){ mostrarToast('El nombre del impuesto es obligatorio', 'danger'); return; }
        if(porcentaje === ''){ mostrarToast('El porcentaje es obligatorio', 'danger'); return; }

        const datos = {

            nombre_impuesto: nombre,
            porcentaje_impuesto: porcentaje,
            estado_impuesto: estado,
            _token: $('meta[name="csrf-token"]').attr('content')

        };

        $.ajax({

            url: `/impuestos/${id}/actualizar/`,
            type: 'PUT',
            data: datos,

            success: function(res){

                mostrarToast('Impuesto actualizado correctamente', 'success');

                tabla.ajax.reload();

                const modalElement = document.getElementById("modalEditarImpuesto");
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


/* ------------------------------------------------------------------------------------------------- */

    document.addEventListener("click", async function(e) {

        if (e.target.classList.contains("bajaImpuesto")) {

            const id = e.target.dataset.id;
            let modalElement = document.getElementById("modalConfirmarEstadoImpuesto");

            // Crear modal si no existe
            if (!modalElement) {
                const modalHTML = `
                    <div class="modal fade" id="modalConfirmarEstadoImpuesto" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">

                                <div class="modal-header">
                                    <h5 class="modal-title">Confirmar acción</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>

                                <div class="modal-body">
                                    <div class="card-responsive">
                                        ¿Deseas cambiar el estado de este impuesto?
                                    </div>
                                </div>

                                <div class="modal-footer">
                                    <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                                    <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstadoImpuesto">Confirmar</button>
                                </div>

                            </div>
                        </div>
                    </div>`;
                
                document.body.insertAdjacentHTML("beforeend", modalHTML);
                modalElement = document.getElementById("modalConfirmarEstadoImpuesto");
            }

            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            const botonConfirmar = modalElement.querySelector("#confirmarCambioEstadoImpuesto");

            botonConfirmar.onclick = async function () {

                try {
                    const response = await fetch(`/impuestos/cambiar-estado/${id}`, {
                        method: "POST",
                        headers: {
                            "X-CSRF-TOKEN": document
                                .querySelector('meta[name="csrf-token"]')
                                .getAttribute("content")
                        }
                    });

                    const data = await response.json();

                    if (data.success) {
                        mostrarToast("Estado del impuesto actualizado", "success");
                        $('#tablaImpuestos').DataTable().ajax.reload(null, false);
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

/* ------------------------------------------------------------------------------------------------- */

    function crearimpuesto() {

        // Click en botón Crear Impuesto
        $('#btnGuardarImpuesto').click(function() {

            const nombre = $('#crear_nombre_impuesto').val().trim();
            const porcentaje = $('#crear_porcentaje_impuesto').val().trim();

            if(nombre === '') {
                mostrarToast('El nombre del impuesto es obligatorio', 'danger');
                return;
            }

            if(porcentaje === '') {
                mostrarToast('El porcentaje del impuesto es obligatorio', 'danger');
                return;
            }

            const datos = {
                nombre_impuesto: nombre,
                porcentaje_impuesto: porcentaje,
                _token: $('meta[name="csrf-token"]').attr('content')
            };

            $.ajax({

                url: '/impuestos/crear',
                type: 'POST',
                data: datos,

                success: function(res){

                    mostrarToast('Impuesto creado correctamente', 'success');

                    // Limpiar formulario
                    $('#formCrearImpuesto')[0].reset();

                    // Cerrar modal
                    const modalElement = document.getElementById("modalCrearImpuesto");
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if(modalInstance) modalInstance.hide();

                    // Recargar DataTable
                    if($.fn.DataTable.isDataTable('#tablaImpuestos')){
                        $('#tablaImpuestos').DataTable().ajax.reload();
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
        $('#modalCrearImpuesto').on('hidden.bs.modal', function () {
            $('#formCrearImpuesto')[0].reset();
        });

    }; crearimpuesto();


/* ------------------------------------------------------------------------------------------------- */


};