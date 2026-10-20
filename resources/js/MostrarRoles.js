export default function initMostrarRoles() {

    document.getElementById('titulo').textContent = 'GESTION DE ROLES';

    $.fn.dataTable.ext.search.push( // Check de roles inactivos

        function(settings, data, dataIndex) {

            const ocultar = $('#toggleInactivosRoles').is(':checked');
            if (!ocultar) return true; 
            const estado = data[3]; // columna "estado_rol" (índice 2)
            return estado.includes('Activo'); 

        }

    );

    $('#toggleInactivosRoles').on('change', function() { tabla.draw(); });
    
    const tabla = $('#tablaRoles').DataTable({ // Inicializar DataTable
        
        ajax: { url: '/roles/mostrar', type: 'GET', dataSrc: 'roles' },
        
        columns: [
            { data: 'nombre_rol' },
            { data: 'descripcion_rol' },
            { data: 'fecha_creacion_rol', render: function(data){ return formatearFecha(data); }
            },

            { 
                data: 'estado_rol',
                render: function(data){
                    return data == 1 
                        ? '<span class="estado estado-activo">Activo</span>'
                        : '<span class="estado estado-inactivo">Inactivo</span>';
                }
            },

            {
                data: 'id_rol',
                orderable: false,
                searchable: false,
                render: function(data, type, row){
                    let botonEstado = row.estado_rol == 1 
                        ? `<button class="btn-baja bajaRol" data-id="${data}">
                        
                            <i class="ph ph-prohibit"></i>
                        
                        </button>` 

                        : `<button class="btn-baja bajaRol" data-id="${data}">
                        
                            <i class="ph ph-check-circle"></i>
                        
                        </button>`;

                    return `

                        <button class="btn-editar editarRol" data-id="${data}">
                        
                            <i class="ph ph-pencil-simple"></i>
                        
                        </button>
                        
                        ${botonEstado}
                    `;
                }
            }
        ], drawCallback: function () { AnimarFilasVisibles(this.api()); }

    });
    
    configurarToggleColumnas('tablaRoles');

    // Click en botón Editar
    $('#tablaRoles').on('click', '.editarRol', function(){
        const id = $(this).data('id');
        abrirModalEditar(id);
    });

    // Abrir modal y llenar datos
    function abrirModalEditar(id) {

        $.get(`/roles/${id}/editar`, function(res){

            const rol = res.rol;

            $('#editar_id_rol').val(rol.id_rol);
            $('#editar_nombre_rol').val(rol.nombre_rol);
            $('#editar_descripcion_rol').val(rol.descripcion_rol);
            $('#editar_estado_rol').val(rol.estado_rol);
            $('#editar_fecha_creacion_rol').val(rol.fecha_creacion_rol);

            const modal = new bootstrap.Modal(document.getElementById("modalEditarRol"));
            modal.show();

        });
    }

    // Actualizar rol
    $('#btnActualizarRol').click(function() {
        const nombre = $('#editar_nombre_rol').val().trim();
        const descripcion = $('#editar_descripcion_rol').val().trim();
        const estado = $('#editar_estado_rol').val();
        const id = $('#editar_id_rol').val();

        if(nombre === ''){ mostrarToast('El nombre del rol es obligatorio', 'danger'); return; }

        const datos = {
            nombre_rol: nombre,
            descripcion_rol: descripcion,
            estado_rol: estado,
            _token: $('meta[name="csrf-token"]').attr('content')
        };

        $.ajax({
            url: `/roles/${id}/actualizar/`,
            type: 'PUT',
            data: datos,
            success: function(res){
                mostrarToast('Rol actualizado correctamente', 'success');
                tabla.ajax.reload();
                const modalElement = document.getElementById("modalEditarRol");
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
                else { mostrarToast('Error inesperado del servidor', 'danger'); }
            }

        });

    });

/* ---------------------------------------------------------------------------------------------- */

    document.addEventListener("click", async function(e) {

        if (e.target.classList.contains("bajaRol")) {

            const id = e.target.dataset.id;
            let modalElement = document.getElementById("modalConfirmarEstadoRol");

            // Crear modal si no existe
            if (!modalElement) {
                const modalHTML = `
                    <div class="modal fade" id="modalConfirmarEstadoRol" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">

                                <div class="modal-header">
                                    <h5 class="modal-title">Confirmar acción</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>

                                <div class="modal-body">
                                    <div class="card-responsive">
                                        ¿Deseas cambiar el estado de este rol?
                                    </div>
                                </div>

                                <div class="modal-footer">
                                    <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                                    <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstadoRol">Confirmar</button>
                                </div>

                            </div>
                        </div>
                    </div>`;
                
                document.body.insertAdjacentHTML("beforeend", modalHTML);
                modalElement = document.getElementById("modalConfirmarEstadoRol");
            }

            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            const botonConfirmar = modalElement.querySelector("#confirmarCambioEstadoRol");

            botonConfirmar.onclick = async function () {

                try {
                    const response = await fetch(`/roles/cambiar-estado/${id}`, {
                        method: "POST",
                        headers: {
                            "X-CSRF-TOKEN": document
                                .querySelector('meta[name="csrf-token"]')
                                .getAttribute("content")
                        }
                    });

                    const data = await response.json();

                    if (data.success) {
                        mostrarToast("Estado del rol actualizado", "success");
                        $('#tablaRoles').DataTable().ajax.reload(null, false);
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

/* ---------------------------------------------------------------------------------------------- */
    function crearroles() {

        // Click en botón Crear Rol
        $('#btnGuardarRol').click(function() {

            const nombre = $('#crear_nombre_rol').val().trim();
            const descripcion = $('#crear_descripcion_rol').val().trim();

            if(nombre === '') {
                mostrarToast('El nombre del rol es obligatorio', 'danger');
                return;
            }

            const datos = {
                nombre_rol: nombre,
                descripcion_rol: descripcion,
                _token: $('meta[name="csrf-token"]').attr('content')
            };

            $.ajax({
                url: '/roles/crear',
                type: 'POST',
                data: datos,
                success: function(res){
                    mostrarToast('Rol creado correctamente', 'success');

                    // Limpiar formulario
                    $('#formCrearRol')[0].reset();

                    // Cerrar modal
                    const modalElement = document.getElementById("modalCrearRol");
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if(modalInstance) modalInstance.hide();

                    // Recargar DataTable
                    if($.fn.DataTable.isDataTable('#tablaRoles')){
                        $('#tablaRoles').DataTable().ajax.reload();
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
        $('#modalCrearRol').on('hidden.bs.modal', function () {
            $('#formCrearRol')[0].reset();
        });

    }; crearroles();
/* ---------------------------------------------------------------------------------------------- */


};