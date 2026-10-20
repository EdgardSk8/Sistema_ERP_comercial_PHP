export default function initMostrarUsuarios() {

    document.getElementById('titulo').textContent = 'GESTION DE USUARIOS';

    $.fn.dataTable.ext.search.push( // Check de usuarios inactivos

    function(settings, data, dataIndex) {

        const ocultar = $('#toggleInactivosUsuarios').is(':checked');
        if (!ocultar) return true; // no filtrar si el checkbox está desmarcado
        const estado = data[4]; // columna "estado_usuario" (índice 4)
        return estado.includes('Activo'); // solo mostrar activos

    }); $('#toggleInactivosUsuarios').on('change', function() { tabla.draw(); });

    // Inicializar DataTable
    const tabla = $('#tablaUsuarios').DataTable({

        ajax: { url: '/usuarios/mostrar', type: 'GET', dataSrc: 'usuarios' },
        
        columns: [
            { data: 'nombre_completo_usuario' },
            { data: 'cedula_identidad_usuario' },
            { data: 'nombre_usuario' },
            { data: 'nombre_rol' },
            { 
                data: 'estado_usuario',
                render: function(data){
                    return data == 1 
                        ? '<span class="estado estado-activo">Activo</span>'
                        : '<span class="estado estado-inactivo">Inactivo</span>';
                }
            },
            {
                data: 'id_usuario',
                orderable: false,
                searchable: false,
                render: function(data, type, row){
                    let botonEstado = row.estado_usuario == 1 
                        ? `<button class="btn-baja bajaUsuario" data-id="${data}">
                        
                            <i class="ph ph-prohibit"></i>
                        
                        </button>` 

                        : `<button class="btn-baja bajaUsuario" data-id="${data}">
                        
                            <i class="ph ph-check-circle"></i>
                        
                        </button>`;

                    return `

                        <button class="btn-editar editarUsuario" data-id="${data}">
                        
                           <i class="ph ph-pencil-simple"></i>
                        
                        </button>
                        
                        ${botonEstado}
                    `;
                }
            }
        ], drawCallback: function () { AnimarFilasVisibles(this.api()); }
    });

    configurarToggleColumnas('tablaUsuarios');

    // Click en botón Editar
    $('#tablaUsuarios').on('click', '.editarUsuario', function(){
        const id = $(this).data('id');
        abrirModalEditar(id);
    });

    // Abrir modal y llenar datos
    function abrirModalEditar(id) {

        $.get(`/usuarios/${id}/editar`, function(res){

            const usuario = res.usuario;

            $('#editar_id_usuario').val(usuario.id_usuario);
            $('#editar_nombre_completo_usuario').val(usuario.nombre_completo_usuario);
            $('#editar_cedula_usuario').val(usuario.cedula_identidad_usuario);
            $('#editar_nombre_usuario').val(usuario.nombre_usuario);
            $('#editar_estado_usuario').val(usuario.estado_usuario);
            $('#editar_fecha_creacion').val(usuario.fecha_creacion_usuario);

            cargarRolesEditar(usuario.id_rol_usuario);

            const modal = new bootstrap.Modal(document.getElementById("modalEditarUsuario"));
            modal.show();

        });

    }
    

    // Cargar roles
    function cargarRolesEditar(rolSeleccionado){

        const select = $('#editar_rol_usuario');

        fetch('/roles-usuario/mostrar?estado=1') // tu endpoint de roles
            .then(response => response.json())
            .then(data => {
                select.empty();
                // Asegurarse que es un array de roles
                const roles = data.data || data.roles || [];
                roles.forEach(rol => {
                    if(rol.estado_rol == 1){ // SOLO roles activos
                        const selected = Number(rol.id_rol) === Number(rolSeleccionado) ? "selected" : "";
                        select.append(`<option value="${rol.id_rol}" ${selected}>${rol.nombre_rol}</option>`);
                    }
                });
            })
            .catch(err => console.error("Error al cargar roles:", err));
    }

    formatearCedula("editar_cedula_usuario");

    // Actualizar usuario
    $('#btnActualizarUsuario').click(function() {
        
        const nombre = $('#editar_nombre_completo_usuario').val().trim();
        const cedula = $('#editar_cedula_usuario').val().trim();
        const usuario = $('#editar_nombre_usuario').val().trim();
        const rol = $('#editar_rol_usuario').val();
        const estado = $('#editar_estado_usuario').val();
        const password = $('#editar_password_usuario').val().trim();
        const id = $('#editar_id_usuario').val();

        if(nombre === '' || usuario === '' || !rol){
            mostrarToast('Todos los campos son obligatorios (excepto contraseña)', 'danger');
            return;
        }

        const datos = {
            nombre_completo_usuario: nombre,
            cedula_identidad_usuario: cedula,
            nombre_usuario: usuario,
            id_rol_usuario: rol,
            estado_usuario: estado,
            _token: $('meta[name="csrf-token"]').attr('content')
        };

        if(password.length >= 6){
            datos.password_usuario = password;
        }

        $.ajax({
            url: `/usuarios/${id}/actualizar/`,
            type: 'PUT',
            data: datos,
            success: function(res){
                mostrarToast('Usuario actualizado correctamente', 'success');tabla.ajax.reload();
                // Después (BS5)
                const modalElement = document.getElementById("modalEditarUsuario");
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

    // Recargar tabla al cancelar
    $('#modalEditarUsuario').on('hidden.bs.modal', function () {tabla.ajax.reload(); });

/* ----------------------------------------------------------------------------------------- */

    document.addEventListener("click", async function(e) {

        if (e.target.classList.contains("bajaUsuario")) {

            const id = e.target.dataset.id;
            let modalElement = document.getElementById("modalConfirmarEstado");// crear modal si no existe

            if (!modalElement) {

                const modalHTML = `
                    <div class="modal fade" id="modalConfirmarEstado" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">

                                <div class="modal-header">
                                    <h5 class="modal-title">Confirmar acción</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>

                                <div class="modal-body">
                                    <div class="card-responsive">
                                        ¿Deseas cambiar el estado de este usuario?
                                    </div>
                                </div>

                                <div class="modal-footer">
                                    <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                                    <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstado">Confirmar</button>
                                </div>

                            </div>
                        </div>
                    </div>`;

                document.body.insertAdjacentHTML("beforeend", modalHTML);
                modalElement = document.getElementById("modalConfirmarEstado");
            }

            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            const botonConfirmar = modalElement.querySelector("#confirmarCambioEstado");

            botonConfirmar.onclick = async function () {

                try {

                    const response = await fetch(`/usuarios/cambiar-estado/${id}`, {
                        method: "POST",
                        headers: {
                            "X-CSRF-TOKEN": document
                                .querySelector('meta[name="csrf-token"]')
                                .getAttribute("content")
                        }
                    });

                    const data = await response.json();
                    
                    if (data.success) {
                        mostrarToast("Estado actualizado", "success");
                        $('#tablaUsuarios').DataTable().ajax.reload(null, false);
                    } else { mostrarToast(data.mensaje || "Error al cambiar estado", "danger"); }

                } catch (error) { mostrarToast("Error de conexión", "danger"); }
                modal.hide();
            };
        }
    }); //Fin de la fruncion click

/* ----------------------------------------------------------------------------------------- */

// CARGAR ROLES AL ABRIR EL MODAL (estructura compatible con vistas hijas)
function cargarRoles() {

    const modal = document.getElementById("modalCrearUsuario");
    const selectRol = document.getElementById("crear_rol_usuario");
    if (!modal || !selectRol) return;

    // Escuchar cuando el modal se abre
    modal.addEventListener("shown.bs.modal", async function () {
        try {
            const res = await fetch("/roles-usuario/mostrar?estado=1");
            const data = await res.json();

            selectRol.innerHTML = '<option disabled selected value="">Seleccione</option>';

            data.data.forEach(rol => {
                const option = document.createElement("option");
                option.value = rol.id_rol;
                option.textContent = rol.nombre_rol;
                selectRol.appendChild(option);
            });
        } catch (error) {
            mostrarToast("Error al cargar roles", "danger");
        }
    });
}

// ENVIAR FORMULARIO
document.getElementById("btnGuardarUsuario").addEventListener("click", async function () {
    const form = document.getElementById("formCrearUsuario");
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const datos = {
        nombre_completo_usuario: document.getElementById("crear_nombre_completo_usuario").value,
        cedula_identidad_usuario: document.getElementById("crear_cedula_usuario").value,
        nombre_usuario: document.getElementById("crear_nombre_usuario").value,
        id_rol_usuario: document.getElementById("crear_rol_usuario").value,
        password_hash_usuario: document.getElementById("crear_password_usuario").value
    };

    try {
        const response = await fetch("/usuarios/crear", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content")
            },
            body: JSON.stringify(datos)
        });

        const data = await response.json();

        if (data.success) {

            mostrarToast(data.mensaje, "success");

            const modalElement = document.getElementById("modalCrearUsuario");
            const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);

            modal.hide();

            document.body.classList.remove("modal-open");
            document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());

            form.reset();
            
            $('#tablaUsuarios').DataTable().ajax.reload();// actualizar tabla
            
        } else {
            if (data.errors) {
                let mensaje = Object.values(data.errors)[0][0];
                mostrarToast(mensaje, "danger");
            } else {
                mostrarToast("Error al crear usuario", "danger");
            }
        }
    } catch (error) {
        mostrarToast("Error de conexión", "danger");
    }
});

// INICIALIZAR
formatearCedula("crear_cedula_usuario");
cargarRoles();


};