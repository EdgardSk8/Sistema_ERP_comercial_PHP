export default function initMostrarCategorias() {

    document.getElementById('titulo').textContent = 'CATEGORIA DE PRODUCTOS';

    $.fn.dataTable.ext.search.push( // Check de categorias inactivas
        function(settings, data, dataIndex) {
            const ocultar = $('#toggleInactivosCategorias').is(':checked');
            if (!ocultar) return true;
            const estado = data[3]; // columna estado_categoria
            return estado.includes('Activo');
        }
    );

    $('#toggleInactivosCategorias').on('change', function() { tabla.draw(); });

    // Inicializar DataTable
    const tabla = $('#tablaCategorias').DataTable({

        ajax: {url: '/categorias/mostrar' ,type: 'GET', dataSrc: 'categorias' },

        columns: [
            { data: 'nombre_categoria' },
            { data: 'descripcion_categoria' },
            {
                data: 'fecha_creacion_categoria',
                render: function (data, type, row) {
                    return window.formatearFecha(data);
                }
                },

            { data: 'estado_categoria',render: function(data){return data == 1 
                ? '<span class="estado estado-activo">Activo</span>'
                : '<span class="estado estado-inactivo">Inactivo</span>'; } },

            { data: 'id_categoria', orderable: false, searchable: false, render: function(data, type, row){

                    let botonEstado = row.estado_categoria == 1
                        ? `<button class="btn-baja bajaCategoria" data-id="${data}">
                        
                            <i class="ph ph-prohibit"></i>
                        
                        </button>`

                        : `<button class="btn-baja bajaCategoria" data-id="${data}">
                        
                            <i class="ph ph-check-circle"></i>
                        
                        </button>`;

                    return `

                        <button class="btn-editar editarCategoria" data-id="${data}">
                        
                            <i class="ph ph-pencil-simple"></i>
                         
                        </button>

                        ${botonEstado}
                    `;
                }
            }
        ], drawCallback: function () { AnimarFilasVisibles(this.api()); },  order: [[0, 'desc']],
    });

    configurarToggleColumnas('tablaCategorias');

    // Click en botón Editar
    $('#tablaCategorias').on('click', '.editarCategoria', function() {const id = $(this).data('id'); abrirModalEditar(id); });

    // Abrir modal y llenar datos
    function abrirModalEditar(id) {

        $.get(`/categorias/${id}/editar`, function(res){

            const categoria = res.categoria;

            $('#editar_id_categoria').val(categoria.id_categoria);
            $('#editar_nombre_categoria').val(categoria.nombre_categoria);
            $('#editar_descripcion_categoria').val(categoria.descripcion_categoria);
            $('#editar_estado_categoria').val(categoria.estado_categoria);
            $('#editar_fecha_creacion_categoria').val(window.formatearFecha(categoria.fecha_creacion_categoria));

            const modal = new bootstrap.Modal(document.getElementById("modalEditarCategoria"));
            modal.show();

        });

    }

    // Evita que Enter envíe el formulario y recargue la página (dejaba el fondo oscuro)
    $('#formEditarCategoria').off('submit.categorias').on('submit.categorias', function(event){
        event.preventDefault();
        $('#btnActualizarCategoria').trigger('click');
    });

    // Actualizar categoria
    $('#btnActualizarCategoria').click(function() {

        const nombre = $('#editar_nombre_categoria').val().trim();
        const descripcion = $('#editar_descripcion_categoria').val().trim();
        const estado = $('#editar_estado_categoria').val();
        const id = $('#editar_id_categoria').val();

        if(nombre === ''){
            mostrarToast('El nombre de la categoría es obligatorio', 'danger');
            return;
        }

        const datos = {

            nombre_categoria: nombre,
            descripcion_categoria: descripcion,
            estado_categoria: estado,
            _token: $('meta[name="csrf-token"]').attr('content')

        };

        $.ajax({

            url: `/categorias/${id}/actualizar/`,
            type: 'PUT',
            data: datos,

            success: function(res){

                mostrarToast('Categoría actualizada correctamente', 'success');
                tabla.ajax.reload();

                const modalElement = document.getElementById("modalEditarCategoria");
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

            } //Fin de Funcion error

        });

    });

/* -------------------------------------------------------------------------------- */

    document.addEventListener("click", async function(e) {

        if (e.target.classList.contains("bajaCategoria")) {

            const id = e.target.dataset.id;
            let modalElement = document.getElementById("modalConfirmarEstadoCategoria");

            // Crear modal si no existe
            if (!modalElement) {

                const modalHTML = `
                    <div class="modal fade" id="modalConfirmarEstadoCategoria" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">

                                <div class="modal-header">
                                    <h5 class="modal-title">Confirmar acción</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>

                                <div class="modal-body">
                                    <div class="card-responsive">
                                        ¿Deseas cambiar el estado de esta categoría?
                                    </div>
                                </div>

                                <div class="modal-footer">
                                    <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                                    <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstadoCategoria">Confirmar</button>
                                </div>

                            </div>
                        </div>
                    </div>`;

                document.body.insertAdjacentHTML("beforeend", modalHTML);
                modalElement = document.getElementById("modalConfirmarEstadoCategoria");
            }

            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            const botonConfirmar = modalElement.querySelector("#confirmarCambioEstadoCategoria");

            botonConfirmar.onclick = async function () {

                try {

                    const response = await fetch(`/categorias/cambiar-estado/${id}`, {
                        method: "POST",
                        headers: {
                            "X-CSRF-TOKEN": document
                                .querySelector('meta[name="csrf-token"]')
                                .getAttribute("content")
                        }
                    });

                    const data = await response.json();

                    if (data.success) {

                        mostrarToast("Estado de la categoría actualizado", "success");
                        $('#tablaCategorias').DataTable().ajax.reload(null, false);

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

/* -------------------------------------------------------------------------------- */

    function crearcategorias() {

        $('#formCrearCategoria').off('submit.categorias').on('submit.categorias', function(event) {
            event.preventDefault();

            const nombre = $('#crear_nombre_categoria').val().trim();
            const descripcion = $('#crear_descripcion_categoria').val().trim();

            if(nombre === '') {
                mostrarToast('El nombre de la categoría es obligatorio', 'danger');
                return;
            }

            const datos = {
                nombre_categoria: nombre,
                descripcion_categoria: descripcion,
                _token: $('meta[name="csrf-token"]').attr('content')
            };

            $.ajax({
                url: '/categorias/crear',
                type: 'POST',
                data: datos,
                success: function(res){

                    mostrarToast('Categoría creada correctamente', 'success');

                    // Limpiar formulario
                    $('#formCrearCategoria')[0].reset();

                    // Cerrar modal
                    const modalElement = document.getElementById("modalCrearCategoria");
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if(modalInstance) modalInstance.hide();

                    // Recargar DataTable
                    if($.fn.DataTable.isDataTable('#tablaCategorias')){
                        $('#tablaCategorias').DataTable().ajax.reload();
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
        $('#modalCrearCategoria').on('hidden.bs.modal', function () {
            $('#formCrearCategoria')[0].reset();
        });

    };crearcategorias()


};