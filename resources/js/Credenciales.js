export default function initCredenciales() {

    document.getElementById('titulo').textContent = 'DATOS DE EMPRESA';
    let idEmpresa = null;
    let logoActual = null;
    let previewLogoUrl = null;

    function renderLogo(ruta) {
        logoActual = ruta || null;
        const $imagen = $('#logoEmpresaActual');

        if (!logoActual) {
            $imagen.addClass('d-none').removeAttr('src');
            $('#sinLogoEmpresa').removeClass('d-none').text('No hay un logo configurado.');
            $('#btnEliminarLogo').addClass('d-none');
            return;
        }

        const src = /^https?:\/\//i.test(logoActual)
            ? logoActual
            : `/${logoActual.replace(/^\/+/, '')}`;

        $imagen.off('error.logoCredenciales').one('error.logoCredenciales', function () {
            $(this).addClass('d-none').removeAttr('src');
            $('#sinLogoEmpresa').removeClass('d-none').text('No se pudo cargar el logo guardado.');
            $('#btnEliminarLogo').removeClass('d-none');
        });

        $imagen.attr('src', src).removeClass('d-none');
        $('#sinLogoEmpresa').addClass('d-none');
        $('#btnEliminarLogo').removeClass('d-none');
    }

    function limpiarPreviewLogo() {
        if (previewLogoUrl) URL.revokeObjectURL(previewLogoUrl);
        previewLogoUrl = null;
        $('#previewLogoEmpresa').removeAttr('src');
        $('#contenedorPreviewLogo').addClass('d-none');
    }

    function cargarCredenciales() {

        $.ajax({
            url: '/credenciales/mostrar',
            type: 'GET',
            dataType: 'json',

            success: function (res) {

                if (res.success && res.data) {

                    let data = res.data;
                    idEmpresa = data.id;
                    $('#editar_id_empresa, #logo_id_empresa').val(idEmpresa);
                    renderLogo(data.logo_empresa);

                    $('#nombre_empresa').text(data.nombre_empresa ?? '-');
                    $('#ruc_empresa').text(data.ruc_empresa ?? '-');
                    $('#direccion_empresa').text(data.direccion_empresa ?? '-');
                    $('#telefono_empresa').text(data.telefono_empresa ?? '-');
                    $('#correo_empresa').text(data.correo_empresa ?? '-');

                    // ✅ Tipo de cambio
                    let tasa = parseFloat(data.tipo_cambio);

                    if (!isNaN(tasa) && tasa > 0) {
                        $('#tipo_cambio').text(`1 USD = ${tasa.toFixed(2)} C$`);
                    } else {
                        $('#tipo_cambio').text('-');
                    }

                } else {
                    mostrarError('No hay configuración registrada');
                }

            },

            error: function () {
                mostrarError('Error al cargar datos');
            }

        });
    }

    // ⚠️ Manejo de error (CORREGIDO)
    function mostrarError(mensaje) {
        $('#nombre_empresa').text(mensaje);
        $('#ruc_empresa').text('-');
        $('#direccion_empresa').text('-');
        $('#telefono_empresa').text('-');
        $('#correo_empresa').text('-');
        $('#tipo_cambio').text('-'); // ✅ aquí estaba el fallo
    }

    // 🚀 Inicializar
    cargarCredenciales();

    $('#btnCambiarLogo').off('click.logoCredenciales').on('click.logoCredenciales', function () {
        if (!idEmpresa) { mostrarToast('No hay un logotipo registrado. Agregue uno para continuar.', 'warning'); }
        $('#logo_id_empresa').val(idEmpresa);
        $('#formLogoEmpresa')[0].reset();
        limpiarPreviewLogo();
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalLogoEmpresa')).show();
    });

    $('#archivoLogoEmpresa').off('change.logoCredenciales').on('change.logoCredenciales', function () {
        limpiarPreviewLogo();
        const archivo = this.files?.[0];
        if (!archivo) return;
        previewLogoUrl = URL.createObjectURL(archivo);
        $('#previewLogoEmpresa').attr('src', previewLogoUrl);
        $('#contenedorPreviewLogo').removeClass('d-none');
    });

    $('#btnGuardarLogo').off('click.logoCredenciales').on('click.logoCredenciales', function () {
        const archivo = $('#archivoLogoEmpresa')[0].files?.[0];
        if (!idEmpresa || !archivo) {
            mostrarToast('Seleccione una imagen para el logo', 'warning');
            return;
        }

        const datos = new FormData();
        datos.append('logo_empresa', archivo);
        datos.append('_token', $('meta[name="csrf-token"]').attr('content'));

        $.ajax({
            url: `/credenciales/${idEmpresa}/logo`,
            type: 'POST',
            data: datos,
            processData: false,
            contentType: false,
            success: function (res) {
                renderLogo(res.credenciales.logo_empresa);
                bootstrap.Modal.getInstance(document.getElementById('modalLogoEmpresa'))?.hide();
                limpiarPreviewLogo();
                mostrarToast(res.mensaje || 'Logo guardado correctamente', 'success');
            },
            error: function (xhr) {
                const mensaje = xhr.responseJSON?.errors?.logo_empresa?.[0]
                    || xhr.responseJSON?.mensaje
                    || 'No se pudo guardar el logo';
                mostrarToast(mensaje, 'danger');
            }
        });
    });

    function confirmarEliminarLogo(alConfirmar) {
        let modalElemento = document.getElementById('modalConfirmarEliminarLogoEmpresa');

        if (!modalElemento) {
            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="modalConfirmarEliminarLogoEmpresa" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Eliminar logo</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                            </div>
                            <div class="modal-body">
                                <p class="mb-0">¿Desea eliminar el logo de la empresa?</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn actualizar btn-sm-modal" id="btnConfirmarEliminarLogoEmpresa">Eliminar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            modalElemento = document.getElementById('modalConfirmarEliminarLogoEmpresa');
        }

        const modal = bootstrap.Modal.getOrCreateInstance(modalElemento);
        const finalizar = () => {
            $('#btnConfirmarEliminarLogoEmpresa').prop('disabled', false);
            modal.hide();
        };

        $('#btnConfirmarEliminarLogoEmpresa')
            .off('click.eliminarLogo')
            .on('click.eliminarLogo', function () {
                $(this).prop('disabled', true);
                alConfirmar(finalizar);
            });

        modal.show();
    }

    $('#btnEliminarLogo').off('click.logoCredenciales').on('click.logoCredenciales', function () {
        if (!idEmpresa || !logoActual) return;

        confirmarEliminarLogo(finalizar => {
            $.ajax({
                url: `/credenciales/${idEmpresa}/logo`,
                type: 'DELETE',
                data: { _token: $('meta[name="csrf-token"]').attr('content') },
                success: function (res) {
                    renderLogo(null);
                    mostrarToast(res.mensaje || 'Logo eliminado correctamente', 'success');
                },
                error: function (xhr) {
                    mostrarToast(xhr.responseJSON?.mensaje || 'No se pudo eliminar el logo', 'danger');
                },
                complete: finalizar
            });
        });
    });

    $('#modalLogoEmpresa').off('hidden.bs.modal.logoCredenciales').on('hidden.bs.modal.logoCredenciales', limpiarPreviewLogo);

/* ----------------------------------------------------------------------------------------------------------- */

    // ==========================
    // CUANDO EL DOM ESTÉ LISTO
    // ==========================
    function editarcredenciales(){

        // ==========================
        // ABRIR MODAL
        // ==========================
        $('#btnEditar').click(function(){
            const id = $('#editar_id_empresa').val() || 1; // dinámico o fallback
            abrirModalEditarEmpresa(id);
            
        });

        // ==========================
        // ACTUALIZAR EMPRESA
        // ==========================
        $('#btnActualizarEmpresa').click(function() {

            const id = $('#editar_id_empresa').val();
            const nombre = $('#editar_nombre_empresa').val().trim();

            if(nombre === ''){
                mostrarToast('El nombre es obligatorio', 'danger');
                return;
            }

            const datos = {
                nombre_empresa: nombre,
                ruc_empresa: $('#editar_ruc_empresa').val(),
                direccion_empresa: $('#editar_direccion_empresa').val(),
                telefono_empresa: $('#editar_telefono_empresa').val(),
                correo_empresa: $('#editar_correo_empresa').val(),
                tipo_cambio: $('#editar_tipo_cambio').val(), // ✅ SOLO ESTO
                tarifa_km: $('#editar_tarifa_km').val(),
                latitud_empresa: $('#editar_latitud_empresa').val(),
                longitud_empresa: $('#editar_longitud_empresa').val(),
                _token: $('meta[name="csrf-token"]').attr('content'),
                _method: 'PUT' // ✅ importante para Laravel
            };

            $.ajax({
                url: `/credenciales/${id}/actualizar`,
                type: 'POST', // ✅ Laravel recomienda POST + _method
                data: datos,

                success: function(res){
                    mostrarToast('Datos actualizados correctamente', 'success');

                    const empresa = res.credenciales;

                    // ==========================
                    // ACTUALIZAR VISTA
                    // ==========================
                    $('#nombre_empresa').text(empresa.nombre_empresa);
                    $('#ruc_empresa').text(empresa.ruc_empresa);
                    $('#direccion_empresa').text(empresa.direccion_empresa);
                    $('#telefono_empresa').text(empresa.telefono_empresa);
                    $('#correo_empresa').text(empresa.correo_empresa);
                    let tasa = parseFloat(empresa.tipo_cambio);
                    if (!isNaN(tasa) && tasa > 0) { $('#tipo_cambio').text(`1 USD = ${tasa.toFixed(2)} C$`); }
                    else { $('#tipo_cambio').text('-'); }

                    // ==========================
                    // CERRAR MODAL
                    // ==========================
                    const modalElement = document.getElementById("modalEditarEmpresa");
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    

                    if(modalInstance){
                        modalInstance.hide();
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

    }; editarcredenciales();


    // ==========================
    // CARGAR DATOS Y ABRIR MODAL
    // ==========================
    function abrirModalEditarEmpresa(id) {

        $.get(`/credenciales/${id}/editar`, function(res){

            const empresa = res.credenciales;

            // ==========================
            // LLENAR FORMULARIO
            // ==========================
            $('#editar_id_empresa').val(empresa.id);
            $('#editar_nombre_empresa').val(empresa.nombre_empresa);
            $('#editar_ruc_empresa').val(empresa.ruc_empresa);
            $('#editar_direccion_empresa').val(empresa.direccion_empresa);
            $('#editar_telefono_empresa').val(empresa.telefono_empresa);
            $('#editar_correo_empresa').val(empresa.correo_empresa);
            $('#editar_tipo_cambio').val(empresa.tipo_cambio); // ✅ SOLO ESTO
            $('#editar_tarifa_km').val(empresa.tarifa_km);
            $('#editar_latitud_empresa').val(empresa.latitud_empresa);
            $('#editar_longitud_empresa').val(empresa.longitud_empresa);

            // ==========================
            // ABRIR MODAL
            // ==========================
            const modalElement = document.getElementById("modalEditarEmpresa");
            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            // if(modalElement){
            //     const modal = new bootstrap.Modal(modalElement);
            //     modal.show();
            // } else {
            //     console.error('No se encontró el modal #modalEditarEmpresa');
            // }

        }).fail(function(err){
            console.error(err);
            mostrarToast('Error al cargar los datos', 'danger');
        });
    }




};
