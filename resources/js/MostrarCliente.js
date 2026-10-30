export default function initMostrarCliente() {

    document.getElementById('titulo').textContent = 'GESTION DE CLIENTES';

    // Filtro para ocultar clientes inactivos
    $.fn.dataTable.ext.search.push(

        function(settings, data, dataIndex) {
            const ocultar = $('#toggleInactivosClientes').is(':checked');
            if (!ocultar) return true;
            const estado = data[10]; // columna estado_cliente
            return estado.includes('Activo');
        }
        
    );

    $('#toggleInactivosClientes').on('change', function() { tabla.draw(); });

    // Inicializar DataTable
    const tabla = $('#tablaClientes').DataTable({

        ajax: {url: '/clientes/mostrar', type: 'GET', dataSrc: 'clientes'},

        scrollX: true,
        autoWidth: false,

        columns: [
            { data: 'id_cliente' },
            { data: 'nombre_cliente', render: data => data ? data : '<span>—</span>' },
            { data: 'cedula_cliente', render: data => data ? data : '<span>—</span>' },
            { data: 'ruc_cliente', render: data => data ? data : '<span>—</span>' },
            { data: 'fecha_nacimiento_cliente', render: function(data) {
                    if (!data) return '<span>—</span>';

                    const [anio, mes, dia] = String(data).substring(0, 10).split('-');
                    return dia && mes && anio ? `${dia}/${mes}/${anio}` : String(data);
                }
            },
            { data: 'telefono_cliente', render: data => data ? data : '<span>—</span>' },
            { data: 'correo_cliente', render: data => data ? data : '<span>—</span>' },
            { data: 'direccion_cliente', render: data => data ? data : '<span>—</span>' },
            { data: 'usuario_cliente', render: data => data ? data : '<span>—</span>' },

            { data: null, render: function(data, type, row) {
                    const tipo = row.descuento_tipo_cliente;
                    const valor = Number(row.descuento_valor_cliente) || 0;

                    if (!tipo || valor <= 0) return '<span>—</span>';

                    return tipo === 'porcentaje'
                        ? `${valor}%`
                        : `C$ ${valor.toFixed(2)}`;
                }
            },

            { data: 'estado_cliente', render: function(data) { return data == 1
                    ? '<span class="estado estado-activo">Activo</span>'
                    : '<span class="estado estado-inactivo">Inactivo</span>'; } },

            { data: 'fecha_creacion_cliente', render: function(data) {
                    if (!data) return '<span>—</span>';

                    const fecha = String(data).replace('T', ' ').substring(0, 16);
                    const [dia, hora] = fecha.split(' ');
                    const [anio, mes, d] = dia.split('-');

                    return d && mes && anio
                        ? `${d}/${mes}/${anio} ${hora || ''}`.trim()
                        : fecha;
                }
            },

            { data: 'id_cliente', orderable: false, searchable: false,
                
                render: function(data, type, row){

                    let botonEstado = row.estado_cliente == 1
                        ? `<button class="btn-baja bajaCliente" data-id="${data}">

                                <i class="ph ph-prohibit"></i>

                            </button>`

                        : `<button class="btn-alta bajaCliente" data-id="${data}">

                               <i class="ph ph-check-circle"></i>
                               
                            </button>`;
                    return `
                        <button class="btn-editar editarCliente" data-id="${data}">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        ${botonEstado}
                    `;

                }
            }

        ],

        drawCallback: function () { AnimarFilasVisibles(this.api()); }
    });

    configurarToggleColumnas('tablaClientes');

    // Click botón editar
    $('#tablaClientes').on('click', '.editarCliente', function(){const id = $(this).data('id');abrirModalEditar(id);});

    formatearCedula("editar_cedula_cliente");
    $('#editar_ruc_cliente').on('input', function () { validarInputRUC(this); });
    
    // Abrir modal editar cliente
    function abrirModalEditar(id) {

        $.get(`/clientes/${id}/editar`, function(res){

            const cliente = res.cliente;

            $('#editar_id_cliente').val(cliente.id_cliente);
            $('#editar_nombre_cliente').val(cliente.nombre_cliente);
            $('#editar_cedula_cliente').val(cliente.cedula_cliente);
            $('#editar_ruc_cliente').val(cliente.ruc_cliente);
            $('#editar_telefono_cliente').val(cliente.telefono_cliente);
            $('#editar_correo_cliente').val(cliente.correo_cliente);
            $('#editar_direccion_cliente').val(cliente.direccion_cliente);
            $('#editar_estado_cliente').val(cliente.estado_cliente);

            const fechaNacimiento = cliente.fecha_nacimiento_cliente
                ? String(cliente.fecha_nacimiento_cliente).substring(0, 10)
                : '';

            $('#editar_fecha_nacimiento_cliente').val(fechaNacimiento);
            $('#editar_usuario_cliente').val(cliente.usuario_cliente || '');
            $('#editar_password_cliente').val('');
            $('#editar_descuento_tipo_cliente').val(cliente.descuento_tipo_cliente || '');
            $('#editar_descuento_valor_cliente').val(cliente.descuento_valor_cliente || 0);

            // convertir fecha para datetime-local
            if(cliente.fecha_creacion_cliente){
                let fecha = cliente.fecha_creacion_cliente.replace(' ', 'T').substring(0,16);
                $('#editar_fecha_creacion_cliente').val(fecha);
            }

            const modal = new bootstrap.Modal(document.getElementById("modalEditarCliente"));
            modal.show();

        });

    }



    // Actualizar cliente
    $('#btnActualizarCliente').click(function() {

        const id = $('#editar_id_cliente').val();

        const datos = {

            nombre_cliente: $('#editar_nombre_cliente').val().trim(),
            cedula_cliente: $('#editar_cedula_cliente').val().trim(),
            ruc_cliente: $('#editar_ruc_cliente').val().trim(),
            telefono_cliente: $('#editar_telefono_cliente').val().trim(),
            correo_cliente: $('#editar_correo_cliente').val().trim(),
            direccion_cliente: $('#editar_direccion_cliente').val().trim(),
            estado_cliente: $('#editar_estado_cliente').val(),

            fecha_nacimiento_cliente: $('#editar_fecha_nacimiento_cliente').val(),
            usuario_cliente: $('#editar_usuario_cliente').val().trim(),
            password_cliente: $('#editar_password_cliente').val(),
            descuento_tipo_cliente: $('#editar_descuento_tipo_cliente').val(),
            descuento_valor_cliente: $('#editar_descuento_valor_cliente').val(),

            _token: $('meta[name="csrf-token"]').attr('content')

        };


        if(datos.nombre_cliente === ''){ mostrarToast('El nombre del cliente es obligatorio', 'danger'); return;}

        $.ajax({

            url: `/clientes/${id}/actualizar`,
            type: 'PUT',
            data: datos,

            success: function(res){

                mostrarToast('Cliente actualizado correctamente', 'success');

                tabla.ajax.reload();

                const modalElement = document.getElementById("modalEditarCliente");
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                modalInstance.hide();

            },

            error: function(err){

                console.error(err);

                if(err.status === 422){
                    const errores = err.responseJSON.errors;
                    let mensaje = '';
                    for(let campo in errores) {mensaje = errores[campo][0]; break; }
                    mostrarToast(mensaje, 'danger');
                }

                else if(err.responseJSON && err.responseJSON.mensaje){ mostrarToast(err.responseJSON.mensaje, 'danger');}
                else{ mostrarToast('Error inesperado del servidor', 'danger'); }

            }

        });

    });


function crearcliente() {

    formatearCedula("crear_cedula_cliente");
    $('#crear_ruc_cliente').on('input', function () { validarInputRUC(this); });

    // Click en botón Crear Cliente
    $('#btnGuardarCliente').click(function() {

        const nombre = $('#crear_nombre_cliente').val().trim();
        const cedula = $('#crear_cedula_cliente').val().trim();
        const ruc = $('#crear_ruc_cliente').val().trim();
        const telefono = $('#crear_telefono_cliente').val().trim();
        const correo = $('#crear_correo_cliente').val().trim();
        const direccion = $('#crear_direccion_cliente').val().trim();

        if(nombre === '') {
            mostrarToast('El nombre del cliente es obligatorio', 'danger');
            return;
        }

        const datos = {
            nombre_cliente: nombre,
            cedula_cliente: cedula,
            ruc_cliente: ruc,
            telefono_cliente: telefono,
            correo_cliente: correo,
            direccion_cliente: direccion,
            fecha_nacimiento_cliente: $('#crear_fecha_nacimiento_cliente').val(),
            usuario_cliente: $('#crear_usuario_cliente').val().trim(),
            password_cliente: $('#crear_password_cliente').val(),
            descuento_tipo_cliente: $('#crear_descuento_tipo_cliente').val(),
            descuento_valor_cliente: $('#crear_descuento_valor_cliente').val(),
            _token: $('meta[name="csrf-token"]').attr('content')
        };

        $.ajax({

            url: '/clientes/crear',
            type: 'POST',
            data: datos,

            success: function(res){

                mostrarToast('Cliente creado correctamente', 'success');

                // Limpiar formulario
                $('#formCrearCliente')[0].reset();

                // Cerrar modal
                const modalElement = document.getElementById("modalCrearCliente");
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if(modalInstance) modalInstance.hide();

                // Recargar DataTable
                if($.fn.DataTable.isDataTable('#tablaClientes')){
                    $('#tablaClientes').DataTable().ajax.reload();
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
    $('#modalCrearCliente').on('hidden.bs.modal', function () {
        $('#formCrearCliente')[0].reset();
    });

};

crearcliente()

document.addEventListener("click", async function(e) {

    if (e.target.classList.contains("bajaCliente")) {

        const id = e.target.dataset.id;
        let modalElement = document.getElementById("modalConfirmarEstadoCliente");

        // Crear modal si no existe
        if (!modalElement) {
            const modalHTML = `
            <div class="modal fade" id="modalConfirmarEstadoCliente" tabindex="-1" aria-hidden="true">

                <div class="modal-dialog modal-dialog-centered">

                    <div class="modal-content">

                        <div class="modal-header">
                            <h5 class="modal-title">Confirmar acción</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div class="modal-body">

                            <div class="card-responsive">
                                ¿Deseas cambiar el estado de este cliente?
                            </div>

                        </div>

                        <div class="modal-footer">
                            <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">
                                Cancelar
                            </button>

                            <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstadoCliente">
                                Confirmar
                            </button>
                        </div>

                    </div>

                </div> `;
            
            document.body.insertAdjacentHTML("beforeend", modalHTML);
            modalElement = document.getElementById("modalConfirmarEstadoCliente");
        }

        const modal = new bootstrap.Modal(modalElement);
        modal.show();

        const botonConfirmar = modalElement.querySelector("#confirmarCambioEstadoCliente");

        botonConfirmar.onclick = async function () {

            try {

                const response = await fetch(`/clientes/cambiar-estado/${id}`, {

                    method: "POST",

                    headers: {
                        "X-CSRF-TOKEN": document
                            .querySelector('meta[name="csrf-token"]')
                            .getAttribute("content")
                    }

                });

                const data = await response.json();

                if (data.success) {

                    mostrarToast("Estado del cliente actualizado", "success");

                    $('#tablaClientes').DataTable().ajax.reload(null, false);

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


};