export default function initMostrarMedidas() {

    document.getElementById('titulo').textContent = 'GESTIÓN DE MEDIDAS';
    
    // INICIALIZACION DE TABLA
    const tabla = $('#tablaMedidas').DataTable({

        ajax:{
            url:'/medidas/mostrar',
            type:'GET',
            dataSrc:'medidas'
        },

        columns:[
            { data:'tipomedida.nombre_tipo_medida', defaultContent:'—' },
            { data:'nombre_medida', defaultContent:'—' },
            { data:'abreviatura_medida', defaultContent:'—' },
            { data:'orden_medida', defaultContent:'—' },
            { data:'fecha_creacion_medida', render:function(data){ return formatearFechaDia(data); } },

            { data:'estado_medida',
                render:function(data){
                    return data == 1
                    ? '<span class="estado estado-activo">Activo</span>'
                    : '<span class="estado estado-inactivo">Inactivo</span>';
                }
            },
            {
                data:'id_medida',
                orderable:false,
                searchable:false,

                render:function(data,type,row){

                    let botonEstado = row.estado_medida == 1

                    ? `<button class="btn-baja bajaMedida" data-id="${data}">
                            <i class="ph ph-prohibit"></i>
                    </button>`

                    : `<button class="btn-alta bajaMedida" data-id="${data}">
                            <i class="ph ph-check-circle"></i>
                    </button>`;

                    return `
                        <button class="btn-editar editarMedida" data-id="${data}">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        ${botonEstado}
                    `;
                }
            }
        ],order:[ [0,'asc'],[3,'asc'] ], drawCallback:function(){ AnimarFilasVisibles(this.api()); },
        initComplete: function () { ConfigurarFiltrosDataTable(this, { columnasSelect: [0,3], columnasIgnorar: [6]}); }

    });

    configurarToggleColumnas('tablaMedidas');

    /* FUNCION CARGAR TIPOS DE MEDIDAS */
    function CargarTiposMedida(selector, dropdownParent = null) {

        $(selector).select2({

            dropdownParent: dropdownParent,

            ajax: {
                url: '/medidas/tipos-medidas/mostrar',
                dataType: 'json',
                delay: 250,
                data: function (params) { return { term: params.term }; },
                processResults: function (res) { return { results: res.results }; }

            }

        });

    }

    // EVENTO DE MOSTRAR ESTADOS
    $('#toggleInactivosMedidas').off('change').on('change',function(){ tabla.draw(); });
    $.fn.dataTable.ext.search.push(function(settings,data){
        if(settings.nTable.id !== 'tablaMedidas') return true;
        const ocultar = $('#toggleInactivosMedidas').is(':checked');
        if(!ocultar) return true; 
        return data[5].includes('Activo');
    });

    // EVENTO PARA CARGAR LOS TIPOS DE MEDIDAS
    $('#modalCrearMedida, #modalEditarMedida').on('shown.bs.modal', function () {
        const modal = $(this); CargarTiposMedida( modal.find('#crear_tipo_medida, #editar_tipo_medida'), modal ); 
    });

    function Validacion(tipo, nombre, orden) {
        if (!tipo || tipo === '') { mostrarToast('Seleccione un tipo de medida', 'danger'); return false; }
        if (!nombre || nombre.trim() === '') { mostrarToast('El nombre de la medida es obligatorio', 'danger'); return false; }
        if (orden === '' || orden < 0) { mostrarToast('El número debe ser mayor o igual a 0', 'danger'); return false; }
        return true;
    }
    
    // EVENTO DE GUARDAR MEDIDA
    $('#btnGuardarMedida').off('click').on('click',function(){

        const tipo = $('#crear_tipo_medida').val();
        const nombre = $('#crear_nombre_medida').val().trim();
        const abreviatura = $('#crear_abreviatura_medida').val().trim();
        const orden = $('#crear_orden_medida').val();

        if(tipo === ''){ mostrarToast( 'Seleccione un tipo de medida', 'danger' ); return;  }
        if(nombre === ''){ mostrarToast('El nombre de la medida es obligatorio', 'danger'); return; }
        if(orden < '0'){ mostrarToast('El Numero debe de ser mayor a 0', 'danger' ); return; }

        $.ajax({

            url:'/medidas/crear', type:'POST',

            data:{
                id_tipo_medida:tipo,
                nombre_medida:nombre,
                abreviatura_medida:abreviatura,
                orden_medida:orden,
                _token:$('meta[name="csrf-token"]').attr('content')
            },

            success:function(){
                mostrarToast( 'Medida creada correctamente', 'success' );
                $('#formCrearMedida')[0].reset();
                bootstrap.Modal.getInstance(document.getElementById('modalCrearMedida')).hide();
                tabla.ajax.reload(null,false);
            },
            
            error: function (xhr, status, error) {

                console.error('Estado:', status);
                console.error('Error:', error);
                console.error('Respuesta:', xhr.responseText);

                let mensaje = 'Ocurrió un error al crear la medida.';

                if (xhr.responseJSON) {
                    if (xhr.responseJSON.mensaje) { mensaje = xhr.responseJSON.mensaje;
                    } else if (xhr.responseJSON.message) { mensaje = xhr.responseJSON.message; }
                }
                mostrarToast(mensaje, 'danger');
            }

        });

    });

    // EVENTO DE EDITAR MEDIDA
    $('#tablaMedidas').off('click').on('click', '.editarMedida', function () {

        const id = $(this).data('id');
        $.get(`/medidas/editar/${id}`, function (res) {

            const medida = res.medida;
            $('#editar_id_medida').val(medida.id_medida);
            const option = new Option( medida.tipomedida.nombre_tipo_medida, medida.id_tipo_medida, true, true);
            $('#editar_tipo_medida').append(option).trigger('change');
            $('#editar_nombre_medida').val(medida.nombre_medida);
            $('#editar_abreviatura_medida').val(medida.abreviatura_medida);
            $('#editar_orden_medida').val(medida.orden_medida);
            $('#editar_estado_medida').val(medida.estado_medida);
            $('#editar_fecha_creacion_medida').val(medida.fecha_creacion_medida);
            new bootstrap.Modal(document.getElementById('modalEditarMedida')).show();
        });

    });


    $('#btnActualizarMedida').off('click').on('click',function(){

        const id = $('#editar_id_medida').val();
        const tipo = $('#editar_tipo_medida').val();
        const nombre = $('#editar_nombre_medida').val().trim();
        const abreviatura = $('#editar_abreviatura_medida').val().trim();
        const orden = $('#editar_orden_medida').val();
        const estado = $('#editar_estado_medida').val();

        if(!Validacion(tipo,nombre,orden)) return;

        $.ajax({

            url:`/medidas/actualizar/${id}`,
            type:'PUT',

            data:{
                id_tipo_medida:tipo,
                nombre_medida:nombre,
                abreviatura_medida:abreviatura,
                orden_medida:orden,
                estado_medida: estado,
                _token:$('meta[name="csrf-token"]').attr('content')
            },

            success:function(){
                mostrarToast('Medida actualizada correctamente','success');
                bootstrap.Modal.getInstance(document.getElementById('modalEditarMedida')).hide();
                tabla.ajax.reload(null,false);
            },

            error:function(xhr){
                let mensaje='Ocurrió un error al actualizar la medida.';
                if(xhr.responseJSON?.mensaje){ mensaje=xhr.responseJSON.mensaje;
                } else if(xhr.responseJSON?.message){ mensaje=xhr.responseJSON.message; }
                mostrarToast(mensaje,'danger');
            }

        });

    });

    document.addEventListener("click", async function(e){

        if(e.target.classList.contains("bajaMedida")){

            const id = e.target.dataset.id;
            let modalElement = document.getElementById("modalConfirmarEstadoMedida");

            if(!modalElement){

                const modalHTML = `
                    <div class="modal fade" id="modalConfirmarEstadoMedida" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">

                                <div class="modal-header">
                                    <h5 class="modal-title">Confirmar acción</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>

                                <div class="modal-body">
                                    <div class="card-responsive">
                                        ¿Deseas cambiar el estado de esta medida?
                                    </div>
                                </div>

                                <div class="modal-footer">
                                    <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                                    <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstadoMedida">Confirmar</button>
                                </div>

                            </div>
                        </div>
                    </div>`;

                document.body.insertAdjacentHTML("beforeend", modalHTML);
                modalElement = document.getElementById("modalConfirmarEstadoMedida");
            }

            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            modalElement.querySelector("#confirmarCambioEstadoMedida").onclick = async function(){

                try{

                    const response = await fetch(`/medidas/cambiar-estado/${id}`,{
                        method:"PUT",
                        headers:{
                            "X-CSRF-TOKEN":document.querySelector('meta[name="csrf-token"]').getAttribute("content")
                        }
                    });

                    const data = await response.json();

                    if(data.success){
                        mostrarToast("Estado de la medida actualizado","success");
                        $('#tablaMedidas').DataTable().ajax.reload(null,false);
                    }else{
                        mostrarToast("Error al cambiar estado","danger");
                    }

                }catch(error){
                    mostrarToast("Error de conexión","danger");
                    console.error(error);
                }

                modal.hide();
            };
        }
    });


}