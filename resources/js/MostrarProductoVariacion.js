export default function initMostrarProductoVariaciones() {

    document.getElementById('titulo').textContent = 'GESTIÓN DE VARIACIONES DE PRODUCTOS';
    
    // INICIALIZACION DE TABLA
    const tabla = $('#tablaProductoVariaciones').DataTable({

        ajax:{
            url:'/producto-variaciones/mostrar',
            type:'GET',
            dataSrc:function(response){
                const grupos = new Map();
                (response.variaciones || []).forEach(variacion => {
                    const id = variacion.id_producto;
                    if(!grupos.has(id)){
                        grupos.set(id,{
                            id_producto:id,
                            nombre_producto:variacion.producto?.nombre_producto || '—',
                            variaciones:[]
                        });
                    }
                    grupos.get(id).variaciones.push(variacion);
                });
                return Array.from(grupos.values());
            }
        },

        columns:[
            { data:'nombre_producto', defaultContent:'—' },
            { data:'variaciones', render:function(variaciones){
                if(!variaciones?.length) return '<span class="text-muted">Sin colores</span>';
                return variaciones.map(variacion => {
                    const color=$('<div>').text(variacion.color || '').html();
                    const clase=variacion.estado_variacion == 1 ? 'bg-success' : 'bg-secondary';
                    return `<span class="badge ${clase} me-1 mb-1">${color}</span>`;
                }).join('');
            }},

            { data:'variaciones', render:function(variaciones){
                const activos=(variaciones || []).filter(v => v.estado_variacion == 1).length;
                const inactivos=(variaciones || []).length-activos;
                if(!variaciones?.length) return '<span class="estado estado-inactivo">Sin variaciones</span>';
                return `${activos ? `<span class="estado estado-activo me-1">${activos} activo(s)</span>` : ''}${inactivos ? `<span class="estado estado-inactivo">${inactivos} inactivo(s)</span>` : ''}`;
            }},
            {
                data:'id_producto',
                orderable:false,
                searchable:false,
                render:function(data){
                    return `<button class="btn-editar editarProductoVariacion" data-id="${data}"><i class="ph ph-pencil-simple"></i></button>`;
                }
            }
        ],

        order:[ [0,'asc'],[1,'asc'] ],

        drawCallback:function(){
            AnimarFilasVisibles(this.api());
        },

        initComplete:function(){
            ConfigurarFiltrosDataTable(this,{
                columnasIgnorar:[3]
            });
        }

    });

    configurarToggleColumnas('tablaProductoVariaciones');


    // EVENTO DE MOSTRAR ESTADOS
    $('#toggleInactivosProductoVariaciones').off('change').on('change',function(){
        tabla.draw();
    });

    $.fn.dataTable.ext.search.push(function(settings,data){

        if(settings.nTable.id !== 'tablaProductoVariaciones') return true;

        const ocultar = $('#toggleInactivosProductoVariaciones').is(':checked');

        if(!ocultar) return true; 
        
        return data[2].includes('activo(s)');
    });

    // CARGAR PRODUCTOS EN LOS SELECTS
    $.get('/producto-variaciones/mostrar-producto',function(response){
        if(!response.success || !Array.isArray(response.productos)){
            mostrarToast(response.mensaje || 'No se pudieron obtener los productos','danger');
            return;
        }
        ['#crear_id_producto','#editar_id_producto'].forEach(selector => {
            const select=$(selector);
            select.html('<option value="">Seleccione un producto</option>');
            response.productos.forEach(producto => {
                select.append(`<option value="${producto.id_producto}">${$('<div>').text(producto.nombre_producto).html()}</option>`);
            });
        });
        const $productoCrear=$('#crear_id_producto');
        if($productoCrear.hasClass('select2-hidden-accessible')) $productoCrear.select2('destroy');
        $productoCrear.select2({
            width:'100%',
            dropdownParent:$('#modalCrearProductoVariacion'),
            placeholder:'Buscar producto',
            allowClear:false
        });
    }).fail(function(xhr){
        mostrarToast(xhr.responseJSON?.mensaje || 'Error al obtener los productos','danger');
    });

    let variacionesEnEdicion=[];
    let variacionesPorEliminar=new Set();

    function obtenerGrupo(idProducto){
        return tabla.rows().data().toArray().find(grupo => String(grupo.id_producto) === String(idProducto));
    }

    function renderizarColoresEdicion(){
        const visibles=variacionesEnEdicion.filter(v => !variacionesPorEliminar.has(String(v.id_variacion)));
        const html=visibles.length ? visibles.map(v => `
            <div class="d-flex justify-content-between align-items-center border rounded mb-2 px-2 colorVariacionEdicion">
                <span class="badge ${v.estado_variacion == 1 ? 'bg-success' : 'bg-secondary'}">${$('<div>').text(v.color || '').html()}</span>
                <button type="button" class="btn-baja quitarColorVariacion" data-id="${v.id_variacion}" title="Quitar color"><i class="ph ph-x"></i></button>
            </div>`).join('') : '<div class="text-muted small">No hay colores asignados</div>';
        $('#listaColoresEditarVariacion').html(html);
    }


    function Validacion(id_producto,color) {

        if(!id_producto || id_producto === ''){
            mostrarToast('Seleccione un producto','danger');
            return false;
        }

        if(!color || color.trim() === ''){
            mostrarToast('El color es obligatorio','danger');
            return false;
        }

        return true;
    }


    // EVENTO DE GUARDAR VARIACION
    $('#formCrearProductoVariacion').off('submit').on('submit',function(e){

        e.preventDefault();

        const producto = $('#crear_id_producto').val();
        const color = $('#crear_color').val().trim();

        if(!Validacion(producto,color)) return;

        $.ajax({

            url:'/producto-variaciones/crear',
            type:'POST',

            data:{
                id_producto:producto,
                color:color,
                _token:$('meta[name="csrf-token"]').attr('content')
            },

            success:function(){
                mostrarToast('Variación creada correctamente','success');
                $('#formCrearProductoVariacion')[0].reset();
                bootstrap.Modal.getInstance(document.getElementById('modalCrearProductoVariacion')).hide();
                tabla.ajax.reload(null,false);
            },
            
            error:function(xhr,status,error){

                console.error('Estado:',status);
                console.error('Error:',error);
                console.error('Respuesta:',xhr.responseText);

                let mensaje='Ocurrió un error al crear la variación.';

                if(xhr.responseJSON){
                    if(xhr.responseJSON.mensaje){
                        mensaje=xhr.responseJSON.mensaje;
                    }else if(xhr.responseJSON.message){
                        mensaje=xhr.responseJSON.message;
                    }
                }

                mostrarToast(mensaje,'danger');
            }

        });

    });


    // EVENTO DE EDITAR VARIACION
    $('#tablaProductoVariaciones').off('click.editar').on('click.editar','.editarProductoVariacion',function(){
        const idProducto=$(this).data('id');
        const grupo=obtenerGrupo(idProducto);
        if(!grupo || !grupo.variaciones.length){
            mostrarToast('No se encontraron colores para este producto','danger');
            return;
        }

        $.get(`/producto-variaciones/editar/${grupo.variaciones[0].id_variacion}`,function(res){
            if(!res.success || !res.variacion){
                mostrarToast(res.mensaje || 'No se pudo obtener la variación','danger');
                return;
            }

            variacionesEnEdicion=grupo.variaciones;
            variacionesPorEliminar=new Set();
            $('#editar_id_variacion').val(res.variacion.id_variacion);
            $('#editar_id_producto').val(grupo.id_producto).prop('disabled',true);
            const $color=$('#editar_color');
            $color.val('').attr('placeholder','Agregar un color nuevo');
            $color.closest('.col-12').find('label').text('Agregar color');
            if(!document.getElementById('listaColoresEditarVariacion')){
                $('#editar_color').closest('.col-12').before('<div class="col-12"><label class="form-label">Colores asignados</label><div id="listaColoresEditarVariacion"></div></div>');
            }
            renderizarColoresEdicion();
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarProductoVariacion')).show();
        }).fail(function(xhr){
            mostrarToast(xhr.responseJSON?.mensaje || xhr.responseJSON?.message || 'Error al obtener la variación','danger');
        });
    });

    $('#modalEditarProductoVariacion').off('click.quitar','.quitarColorVariacion').on('click.quitar','.quitarColorVariacion',function(){
        const id=String($(this).data('id'));
        variacionesPorEliminar.add(id);
        $(this).closest('.colorVariacionEdicion').addClass('bg-danger-subtle border-danger').html('<span class="badge bg-danger">Se quitará</span>');
    });


    // EVENTO DE ACTUALIZAR VARIACION
    $('#formEditarProductoVariacion').off('submit').on('submit',function(e){

        e.preventDefault();

        const producto=$('#editar_id_producto').val();
        const color=($('#editar_color').val() || '').trim();

        if(!producto){ mostrarToast('Seleccione un producto','danger'); return; }
        if(color && color.length > 50){ mostrarToast('El color no puede exceder 50 caracteres','danger'); return; }

        const conservar=variacionesEnEdicion.filter(v => !variacionesPorEliminar.has(String(v.id_variacion)));
        if(color && variacionesEnEdicion.some(v => !variacionesPorEliminar.has(String(v.id_variacion)) && String(v.color).trim().toLocaleLowerCase() === color.toLocaleLowerCase())){
            mostrarToast('Ese color ya está asignado al producto','warning');
            return;
        }

        const tareas=[];
        variacionesPorEliminar.forEach(idVariacion => tareas.push($.ajax({
            url:`/producto-variaciones/eliminar/${idVariacion}`,
            type:'DELETE',
            data:{_token:$('meta[name="csrf-token"]').attr('content')}
        })));
        conservar.forEach(variacion => tareas.push($.ajax({
            url:`/producto-variaciones/actualizar/${variacion.id_variacion}`,
            type:'PUT',
            data:{id_producto:producto,color:variacion.color,estado_variacion:variacion.estado_variacion,_token:$('meta[name="csrf-token"]').attr('content')}
        })));
        if(color) tareas.push($.ajax({
            url:'/producto-variaciones/crear',
            type:'POST',
            data:{id_producto:producto,color,_token:$('meta[name="csrf-token"]').attr('content')}
        }));

        if(!tareas.length){ mostrarToast('No hay cambios para guardar','info'); return; }
        $.when.apply($,tareas).done(function(){
            mostrarToast('Variaciones actualizadas correctamente','success');
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarProductoVariacion')).hide();
            tabla.ajax.reload(null,false);
        }).fail(function(xhr){
            mostrarToast(xhr.responseJSON?.mensaje || xhr.responseJSON?.message || 'Error al actualizar las variaciones','danger');
        });

    });


}
