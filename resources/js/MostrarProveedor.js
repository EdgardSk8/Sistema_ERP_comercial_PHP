export default function initMostrarProveedores() {

    document.getElementById('titulo').textContent = 'REGISTRO DE PROVEEDORES';

    $.fn.dataTable.ext.search.push( // Check de proveedores inactivos
        function(settings, data, dataIndex) {
            const ocultar = $('#toggleInactivosProveedores').is(':checked');
            if (!ocultar) return true;

            const estado = data[6]; // columna estado_proveedor
            return estado.includes('Activo');
        }
    );

    $('#toggleInactivosProveedores').on('change', function() { tabla.draw(); });

    // Inicializar DataTable
    const tabla = $('#tablaProveedores').DataTable({
        // autoWidth: false,

        ajax: { url: '/proveedores/mostrar', type: 'GET', dataSrc: 'proveedores' },

        columns: [
            { data: 'id_proveedor' },
            { data: 'nombre_proveedor', render: data => data ? data : '<span>—</span>' },
            { data: 'ruc_proveedor', render: data => data ? data : '<span>—</span>' },
            { data: 'telefono_proveedor', render: data => data ? data : '<span>—</span>' },
            { data: 'correo_proveedor', render: data => data ? data : '<span>—</span>' },
            { data: 'direccion_proveedor', render: data => data ? data : '<span>—</span>' },
            //{ data: 'fecha_creacion_proveedor' },

            {
                data: 'estado_proveedor',
                render: function(data){
                    return data == 1
                        ? '<span class="estado estado-activo">Activo</span>'
                        : '<span class="estado estado-inactivo">Inactivo</span>';
                }
            },

            {
                data: 'id_proveedor',
                orderable: false,
                searchable: false,
                render: function(data, type, row){

                    let botonEstado = row.estado_proveedor == 1
                        ? `<button class="btn-baja bajaProveedor" data-id="${data}">
                        
                            <i class="fa-solid fa-ban"></i>
                        
                        </button>`

                        : `<button class="btn-alta bajaProveedor" data-id="${data}">
                        
                            <i class="fa-solid fa-circle-check"></i>
                        
                        </button>`;

                    return ` 
                        <button class="btn-editar editarProveedor" data-id="${data}">
                        
                            <i class="fa-solid fa-pencil-alt"></i>
                        
                        </button>
                        ${botonEstado}
                    `;
                }
            }
        ], drawCallback: function () { AnimarFilasVisibles(this.api()); }, order: [[0, 'desc']],

    });

    configurarToggleColumnas('tablaProveedores');

    $('#tablaProveedores').on('click', '.editarProveedor', function(){
        const id = $(this).data('id'); abrirModalEditar(id);
    });

    // Abrir modal editar
    function abrirModalEditar(id) {

        $.get(`/proveedores/${id}/editar`, function(res){

            const proveedor = res.proveedor;

            $('#editar_id_proveedor').val(proveedor.id_proveedor);
            $('#editar_nombre_proveedor').val(proveedor.nombre_proveedor);
            $('#editar_ruc_proveedor').val(proveedor.ruc_proveedor);
            $('#editar_telefono_proveedor').val(proveedor.telefono_proveedor);
            $('#editar_correo_proveedor').val(proveedor.correo_proveedor);
            $('#editar_direccion_proveedor').val(proveedor.direccion_proveedor);
            $('#editar_estado_proveedor').val(proveedor.estado_proveedor);

            if(proveedor.fecha_creacion_proveedor){
                $('#editar_fecha_creacion_proveedor').val( proveedor.fecha_creacion_proveedor.replace(' ', 'T') );
            }

            const modal = new bootstrap.Modal( document.getElementById("modalEditarProveedor") );
            modal.show();

        });

    }

    $('#editar_ruc_proveedor').on('input', function () { validarInputRUC(this); });

    // Actualizar proveedor
    $('#btnActualizarProveedor').click(function(){

        const id = $('#editar_id_proveedor').val();

        const datos = {

            nombre_proveedor: $('#editar_nombre_proveedor').val().trim(),
            ruc_proveedor: $('#editar_ruc_proveedor').val().trim(),
            telefono_proveedor: $('#editar_telefono_proveedor').val().trim(),
            correo_proveedor: $('#editar_correo_proveedor').val().trim(),
            direccion_proveedor: $('#editar_direccion_proveedor').val().trim(),
            estado_proveedor: $('#editar_estado_proveedor').val(),

            _token: $('meta[name="csrf-token"]').attr('content')
        };

        if(datos.nombre_proveedor === ''){
            mostrarToast('El nombre del proveedor es obligatorio', 'danger');
            return;
        }

        if(!validarRUC(datos.ruc_proveedor)){ return; }
        if (!validarTelefono(datos.telefono_proveedor)) { return; }

        $.ajax({

            url: `/proveedores/${id}/actualizar/`,
            type: 'PUT',
            data: datos,

            success: function(res){

                mostrarToast('Proveedor actualizado correctamente', 'success');

                tabla.ajax.reload();

                const modalElement = document.getElementById("modalEditarProveedor");
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

    function crearproveedor() {

        const inputRUC = $('#crear_ruc_proveedor');
        const selectorTipo = $('#tipo_ruc');

        $('#crear_ruc_proveedor').on('input', function () { validarInputRUC(this); });

        $('#btnGuardarProveedor').click(function() {

            const tipo = $('#tipo_ruc').val();
            const nombre = $('#crear_nombre_proveedor').val().trim();
            const ruc = $('#crear_ruc_proveedor').val().trim().toUpperCase();
            const telefono = $('#crear_telefono_proveedor').val().trim();
            const correo = $('#crear_correo_proveedor').val().trim();
            const direccion = $('#crear_direccion_proveedor').val().trim();

            if(nombre === '') { mostrarToast('El nombre del proveedor es obligatorio', 'danger'); return; }
            // if(tipo === "" || tipo === null){ mostrarToast('Seleccione el tipo de proveedor', 'danger'); return; }
            if (!validarTelefono(telefono)) { return; }

            if(ruc !== ''){

                // if(tipo === "natural"){
                //     if(!/^[0-9]{13}[A-Z]$/.test(ruc)){
                //         mostrarToast('El RUC natural debe tener 13 números y una letra final', 'danger'); return;
                //     }
                // }

                if(ruc.length !== 14){ mostrarToast('El RUC debe tener al menos 14 caracteres', 'danger'); return false; }
                if(tipo === "N"){ if(!/^N[0-9]{13}$/.test(ruc)){ mostrarToast('El RUC debe iniciar con N', 'danger'); return; } }
                if(tipo === "R"){ if(!/^R[0-9]{13}$/.test(ruc)){ mostrarToast('El RUC debe iniciar con R', 'danger'); return; } }
                if(tipo === "E"){ if(!/^E[0-9]{13}$/.test(ruc)){ mostrarToast('El RUC debe iniciar con E', 'danger'); return; } }
                if(tipo === "J"){ if(!/^J[0-9]{13}$/.test(ruc)){ mostrarToast('El RUC debe iniciar con J', 'danger'); return; } }

            }

            const datos = {
                nombre_proveedor: nombre,
                ruc_proveedor: ruc,
                telefono_proveedor: telefono,
                correo_proveedor: correo,
                direccion_proveedor: direccion,
                _token: $('meta[name="csrf-token"]').attr('content')
            };

            $.ajax({
                url: '/proveedores/crear',
                type: 'POST',
                data: datos,
                success: function(res){

                    mostrarToast('Proveedor creado correctamente', 'success');

                    // Limpiar formulario
                    $('#formCrearProveedor')[0].reset();

                    inputRUC.prop('disabled', true);

                    // Cerrar modal
                    const modalElement = document.getElementById("modalCrearProveedor");
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if(modalInstance) modalInstance.hide();

                    // Recargar DataTable
                    if($.fn.DataTable.isDataTable('#tablaProveedores')){
                        $('#tablaProveedores').DataTable().ajax.reload();
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

        $('#modalCrearProveedor').on('hidden.bs.modal', function () {
            $('#formCrearProveedor')[0].reset(); inputRUC.prop('disabled', true);
        });

        selectorTipo.change(function(){

            const tipo = $(this).val();
            if(tipo === ""){ inputRUC.prop('disabled', true); inputRUC.val(''); return; }
            inputRUC.prop('disabled', false);
            inputRUC.val('');
            if(tipo === "N" || tipo === "R" || tipo === "E" || tipo === "J"){ inputRUC.val(tipo); }

        });

    };crearproveedor()

    document.addEventListener("click", async function(e) {

        if (e.target.classList.contains("bajaProveedor")) {

            const id = e.target.dataset.id;
            let modalElement = document.getElementById("modalConfirmarEstadoProveedor");

            // Crear modal si no existe
            if (!modalElement) {
                const modalHTML = `
            <div class="modal fade" id="modalConfirmarEstadoProveedor" tabindex="-1" aria-hidden="true">

                <div class="modal-dialog modal-dialog-centered">

                    <div class="modal-content">

                        <div class="modal-header">
                            <h5 class="modal-title">Confirmar acción</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div class="modal-body">

                            <div class="card-responsive">
                                ¿Deseas cambiar el estado de este proveedor?
                            </div>

                        </div>

                        <div class="modal-footer">
                            <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">
                                Cancelar
                            </button>

                            <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstadoProveedor">
                                Confirmar
                            </button>
                        </div>

                    </div>

                </div>

            </div>`;
                
                document.body.insertAdjacentHTML("beforeend", modalHTML);
                modalElement = document.getElementById("modalConfirmarEstadoProveedor");
            }

            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            const botonConfirmar = modalElement.querySelector("#confirmarCambioEstadoProveedor");

            botonConfirmar.onclick = async function () {

                try {

                    const response = await fetch(`/proveedores/cambiar-estado/${id}`, {
                        method: "POST",
                        headers: {
                            "X-CSRF-TOKEN": document
                                .querySelector('meta[name="csrf-token"]')
                                .getAttribute("content")
                        }
                    });

                    const data = await response.json();

                    if (data.success) {

                        mostrarToast("Estado del proveedor actualizado", "success");

                        $('#tablaProveedores')
                            .DataTable()
                            .ajax.reload(null, false);

                    } else {

                        mostrarToast("Error al cambiar estado", "danger");

                    }

                } catch (error) {

                    mostrarToast("Error de conexión", "danger");
                    console.error(error);

                }

                modal.hide();
            };
        }
    });

};