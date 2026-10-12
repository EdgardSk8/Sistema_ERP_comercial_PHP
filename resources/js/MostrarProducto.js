export default function initMostrarProductos() {

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ════════════════ TÍTULO DINAMICO DE LA VISTA ════════════════ */

    document.getElementById('titulo').textContent = 'GESTION DE PRODUCTOS';

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ════════════════ INICIALIZACION DE BASE DE DATOS ════════════════ */

    const tabla = $('#TablaMostrarProductos').DataTable({

        ajax: { url: '/productos/mostrar', type: 'GET', dataSrc: 'productos' },
        deferRender: true,

        columns: [

            { data: 'id_producto' },

            { data: 'imagen_producto', /* ══════ Imagen del Producto ══════ */
                 render: function(data){
                    if(data){ 
                        return `<img class="TablaImagenProducto" src="/imagenes/productos/${data}" width="30">`; 
                    } 
                    else { 
                        return `<img class="TablaImagenProducto" src="/img/noproducto.png" width="30">`; 
                    }
                }
            },

            { data: 'nombre_producto' }, /*  ══════ Nombre Producto  ══════ */

            { data: 'categoria.nombre_categoria', defaultContent: '—' }, /*  ══════ Categoria  ══════*/

            { data: 'medida.nombre_medida', defaultContent: '—'},

            { data: 'precio_compra', render: data => moneda(data) }, /*  ══════ P.Compra ══════ */

            { data: 'precio_venta', render: data => moneda(data) }, /*  ══════ P.Venta ══════ */

            { data: 'precio_venta_final', render: data => moneda(data) }, /*  ══════ P.Venta Final ══════ */

            { data: 'ganancia', render: data => `<strong class="text-success">${moneda(data)}</strong>`},

            { data: 'porcentaje_ganancia', render: data => `<span class="text-success fw-bold">${data}%</span>` },

            { data: 'impuesto', /*  ══════ Impuesto  ══════ */
                render: function(data){
                    if(!data) return 'Sin impuesto';
                    let porcentaje = parseFloat(data.porcentaje_impuesto).toFixed(0);
                    return `<!-- ${data.nombre_impuesto} --> <strong> ${porcentaje}% </strong>`;
                }
            },
            
            { data: 'stock_actual', /*  ══════ Cantidad  ══════ */
                render: function(data) { 
                    if (parseFloat(data) === 0) { return `<strong class="text-danger">${data}</strong>`; } 
                    else { return `<strong class="text-success">${data}</strong>`; }
                }
            }, 

            { data: 'estado_producto', render: function(data){ return data == 1 /*  ══════ Estado  ══════ */
                ? '<span class="estado estado-activo">Activo</span>'
                : '<span class="estado estado-inactivo">Inactivo</span>'; }
            },

            { data: 'id_producto', orderable: false, searchable: false,

                render: function(data, type, row){

                    let botonEstado = row.estado_producto == 1 

                        ? `<button class="btn-baja bajaProducto" data-id="${data}">
                        
                           <i class="fa-solid fa-ban"></i>
                        
                        </button>` 

                        : `<button class="btn-baja bajaProducto" data-id="${data}">
                        
                            <i class="fa-solid fa-circle-check"></i>
                        
                        </button>`;
                    
                        let botonDetalles = `<button class="btn-detalle detallesProducto" data-id="${data}">
                        
                            <i class="fa-solid fa-eye"></i>
                        
                        </button>`;
                    
                        return `

                        <button class="btn-editar editarProducto" data-id="${data}">
                        
                            <i class="fa-solid fa-pencil-alt"></i>
                        
                        </button>

                        ${botonEstado}
                        ${botonDetalles}
                    `;

                }
            }
        ],
        drawCallback: function () { AnimarFilasVisibles(this.api()); }, order: [[1, 'asc']],
        initComplete: function () {
            ConfigurarFiltrosDataTable(this, { columnasSelect: [3, 9], columnasIgnorar: [1, 12] });
        }

    }); // Fin de Funcion de inicializacion de tabla
    

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ════════════════ FILTROS (OCULTAR INACTIVOS) ════════════════ */

    $.fn.dataTable.ext.search.push(

        function(settings, data, dataIndex) {

            const ocultar = $('#toggleInactivosProductos').is(':checked');
            if (!ocultar) return true;

            const estado = data[12]; // columna estado (IMPORTANTE)
            return estado.includes('Activo');
        }

    );

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ════════════════ FILTRO: MOSTRAR / OCULTAR INACTIVOS ════════════════ */

    $('#toggleInactivosProductos').on('change', function() { tabla.draw(); });

/* ════════════════ CONTROL DE COLUMNAS (MOSTRAR / OCULTAR) ════════════════ */

    configurarToggleColumnas('TablaMostrarProductos');
    
/* ════════════════ ACCIÓN: ABRIR MODAL DE EDICIÓN ════════════════ */

    $('#TablaMostrarProductos').on('click', '.editarProducto', function() { 
        const id = $(this).data('id'); abrirModalEditar(id); 
    });

/* ════════════════ ACCIÓN: ABRIR MODAL DE DETALLES DE PRODUCTO ════════════════ */

    $('#TablaMostrarProductos').on('click', '.detallesProducto', function () {

        const btn = $(this);

        if (btn.prop('disabled')) return;

        btn.prop('disabled', true);

        const id = btn.data('id');

        abrirModalDetalles(id);

        setTimeout(() => {
            btn.prop('disabled', false);
        }, 1000); // tiempo en ms

    });

/* ════════════════ ACCIÓN: MOSTRAR IMAGEN CON CURSOR: POINTER ════════════════ */

    $('#TablaMostrarProductos').on('mouseenter', 'td img', function() { 
        $(this).css('cursor', 'pointer'); 
    });

/* ════════════════ ACCIÓN: ABRIR MODAL DE IMAGEN DEL PRODUCTO ════════════════ */

    $('#TablaMostrarProductos').on('click', 'td img', function() {

        const src = $(this).attr('src');

        // Crear modal si no existe
        let modalElement = document.getElementById("modalImagenProducto");

        if (!modalElement) {

            const modalHTML = `
            <div class="modal fade" id="modalImagenProducto" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style="background: transparent; border: none; position: relative;">
                        
                        <!-- Imagen -->
                        <img id="imagenModalProducto" src="" >
                    </div>
                </div>
            </div>`;

            document.body.insertAdjacentHTML("beforeend", modalHTML);
            modalElement = document.getElementById("modalImagenProducto");
        }

        const imagenModal = modalElement.querySelector("#imagenMalProducto");
        imagenModal.src = src;

        // Mostrar modal
        const modal = new bootstrap.Modal(modalElement, { backdrop: true, keyboard: true });
        modal.show();

        // Cerrar modal al hacer click en la imagen
        imagenModal.onclick = function() { modal.hide(); };
    });


/* ════════════════ ACCIÓN: BTN DE ACTUALIZAR PRODUCTO EDITADO ════════════════ */

    function enviarActualizacionProducto(formData, conAjusteVariacion = false) {
        const $botonConfirmar = $('#btnConfirmarAjusteVariacion');
        if (conAjusteVariacion) $botonConfirmar.prop('disabled', true).text('Aplicando...');

        $.ajax({
            url: `/productos/${$('#editar_id_producto').val()}/actualizar`,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(res){
                mostrarToast(res.mensaje || 'Producto actualizado correctamente', 'success');
                $('#TablaMostrarProductos').DataTable().ajax.reload();

                if (conAjusteVariacion) {
                    formDataAjusteVariacionPendiente = null;
                    bootstrap.Modal.getInstance(document.getElementById('modalDistribuirAjusteVariacion'))?.hide();
                }

                bootstrap.Modal.getInstance(document.getElementById('modalEditarProducto'))?.hide();
            },
            error: function(err){
                console.error(err);
                if (err.status === 422) {
                    const errores = err.responseJSON?.errors;
                    const mensaje = errores ? Object.values(errores).flat()[0] : err.responseJSON?.mensaje;
                    mostrarToast(mensaje || 'No se pudo aplicar el ajuste', 'danger');
                } else if (err.responseJSON?.mensaje) {
                    mostrarToast(err.responseJSON.mensaje, 'danger');
                } else {
                    mostrarToast('Error inesperado del servidor', 'danger');
                }
            },
            complete: function(){
                if (conAjusteVariacion) $botonConfirmar.prop('disabled', false).text('Confirmar baja');
            }
        });
    }

    $('#btnActualizarProducto').click(function() {
        const id = $('#editar_id_producto').val();
        const nombre = $('#editar_nombre_producto').val().trim();
        const descripcion = $('#editar_descripcion_producto').val().trim();
        const id_categoria = $('#editar_id_categoria').val();
        const id_ubicacion = $('#editar_id_ubicacion').val();
        const id_impuesto = $('#editar_id_impuesto').val();
        const precio_compra = $('#editar_precio_compra').val();
        const precio_venta = $('#editar_precio_venta').val();
        const stock = $('#editar_stock_actual').val();
        const imagen = $('#editar_imagen_producto')[0].files[0]; // archivo seleccionado
        const id_medida = $('#editar_medida_producto').val();
        const motivo = $('#editar_stock_motivo').val();

        // Validaciones básicas
        if(nombre === ''){ mostrarToast('El nombre del producto es obligatorio', 'danger'); return; }
    
        // FormData para enviar datos + archivo
        const formData = new FormData();
        formData.append('nombre_producto', nombre);
        formData.append('descripcion_producto', descripcion);
        formData.append('id_categoria', id_categoria);
        formData.append('id_ubicacion', id_ubicacion);
        formData.append('id_impuesto', id_impuesto);
        formData.append('precio_compra', precio_compra);
        formData.append('precio_venta', precio_venta);
        formData.append('stock_actual', stock);
        formData.append('id_medida', id_medida);
        if(imagen) formData.append('imagen_producto', imagen);
        formData.append('motivo_movimiento',$('#editar_stock_motivo').val());

        // Spoofing PUT para Laravel
        formData.append('_method', 'PUT');
        formData.append('_token', $('meta[name="csrf-token"]').attr('content'));

        const diferenciaStock = Number(stock) - StockOriginal;
        if (diferenciaStock < 0 && variantesStockProducto.length) {
            abrirModalDistribuirAjuste(formData, Math.abs(diferenciaStock));
            return;
        }

        enviarActualizacionProducto(formData);
    });

/* ════════════════ ACCIÓN: PREVIEW DE LA NUEVA IMAGEN ════════════════ */

    $('#editar_imagen_producto').on('change', function() {
        const file = this.files[0];
        if(file){
            $('#preview_editar_imagen_producto')
                .attr('src', URL.createObjectURL(file))
                .removeClass('d-none');
        }
    });

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

    function abrirModalDetalles(id){

        $.get(`/productos/${id}/editar`, function(resProducto){
            const p = resProducto.producto;

            $('#detalle_nombre_producto').text(p.nombre_producto);
            $('#detalle_descripcion_producto').text(p.descripcion_producto || '-');
            $('#detalle_fecha_producto').text( p.fecha_creacion_producto ? formatearFecha(p.fecha_creacion_producto) : '-' );
            $('#detalle_categoria_producto').text(p.categoria?.nombre_categoria || 'SIN CATEGORIA');
            $('#detalle_ubicacion_producto').text(p.ubicacion?.nombre_ubicacion || 'SIN UBICACION');
            $('#detalle_impuesto_producto').text(p.impuesto?.nombre_impuesto+ ' ' + p.impuesto?.porcentaje_impuesto + '%' || 'SIN IMPUESTO ASIGNADO');
            $('#detalle_precio_compra').text(`C$ ${parseFloat(p.precio_compra).toFixed(2)}`);
            $('#detalle_precio_venta').text(`C$ ${parseFloat(p.precio_venta).toFixed(2)}`);
            $('#detalle_stock_producto').text(p.stock_actual);
            $('#detalle_estado_producto').text(p.estado_producto == 1 ? 'Activo' : 'Inactivo');

            if (p.imagen_producto){
                
                $('#detalle_imagen_producto')
                    .attr('src', `/imagenes/productos/${p.imagen_producto}`)
                    .removeClass('d-none');

                $('#sin_imagen_texto').addClass('d-none');

            } 
            else { $('#detalle_imagen_producto').addClass('d-none'); $('#sin_imagen_texto').removeClass('d-none'); }

            const modal = new bootstrap.Modal(document.getElementById('modalDetalleProducto'));
            modal.show();

        }).fail(function(){ mostrarToast('Erodror al cargar detalles del producto', 'danger'); });

    } // Fin de Funcion de Abrir Modal

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ════════════════ ABRIR MODAL Y CARGAR DATOS ════════════════ */
    let StockOriginal = 0;
    let variantesStockProducto = [];
    let formDataAjusteVariacionPendiente = null;
    let cantidadAjusteVariacionPendiente = 0;

    function actualizarResumenAjusteVariacion() {
        const cantidadSeleccionada = $('#filasAjusteStockVariacion .cantidad-ajuste-variacion')
            .toArray()
            .reduce((total, input) => total + (Number(input.value) || 0), 0);
        const diferencia = cantidadAjusteVariacionPendiente - cantidadSeleccionada;
        const coincide = diferencia === 0;

        $('#resumenAjusteStockVariacion')
            .text(coincide
                ? `Distribución completa: ${cantidadSeleccionada} unidades.`
                : diferencia > 0
                    ? `Faltan ${diferencia} unidades por asignar.`
                    : `La distribución excede el ajuste por ${Math.abs(diferencia)} unidades.`)
            .toggleClass('text-danger', cantidadSeleccionada > cantidadAjusteVariacionPendiente)
            .toggleClass('text-success', coincide);
        $('#btnConfirmarAjusteVariacion').prop('disabled', !coincide);
    }

    function abrirModalDistribuirAjuste(formData, cantidadTotal) {
        const tallasDisponibles = variantesStockProducto.filter(variacion => variacion.stock > 0);
        const stockDisponible = tallasDisponibles.reduce((total, variacion) => total + variacion.stock, 0);

        if (stockDisponible < cantidadTotal) {
            mostrarToast('El stock de las tallas no alcanza para aplicar esta baja.', 'danger');
            return;
        }

        formDataAjusteVariacionPendiente = formData;
        cantidadAjusteVariacionPendiente = cantidadTotal;
        $('#cantidadTotalAjusteVariacion').text(cantidadTotal);
        const $filas = $('#filasAjusteStockVariacion').empty();

        tallasDisponibles.forEach(variacion => {
            const $fila = $('<tr>');
            $fila.append($('<td>').text(variacion.color));
            $fila.append($('<td>').text(variacion.talla));
            $fila.append($('<td>').text(variacion.sku || '—'));
            $fila.append($('<td>').text(variacion.stock));
            $fila.append($('<td>').append($('<input>', {
                type: 'number',
                class: 'form-control form-control-sm cantidad-ajuste-variacion',
                min: 0,
                max: variacion.stock,
                value: 0,
                'data-id-variacion-talla': variacion.id,
                'aria-label': `Unidades a retirar de ${variacion.color}, talla ${variacion.talla}`
            })));
            $filas.append($fila);
        });

        actualizarResumenAjusteVariacion();
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarProducto')).hide();
        $('#modalEditarProducto').one('hidden.bs.modal.ajusteVariacion', function () {
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDistribuirAjusteVariacion')).show();
        });
    }

    $('#filasAjusteStockVariacion').off('input.ajusteVariacion').on('input.ajusteVariacion', '.cantidad-ajuste-variacion', function () {
        const cantidad = Number(this.value) || 0;
        if (cantidad < 0) this.value = 0;
        if (cantidad > Number(this.max)) this.value = this.max;
        actualizarResumenAjusteVariacion();
    });

    $('#modalDistribuirAjusteVariacion').off('hidden.bs.modal.ajusteVariacion').on('hidden.bs.modal.ajusteVariacion', function () {
        if (!formDataAjusteVariacionPendiente) return;
        formDataAjusteVariacionPendiente = null;
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarProducto')).show();
    });

    $('#btnConfirmarAjusteVariacion').off('click.ajusteVariacion').on('click.ajusteVariacion', function () {
        if (!formDataAjusteVariacionPendiente) return;

        const ajustes = $('#filasAjusteStockVariacion .cantidad-ajuste-variacion')
            .toArray()
            .map(input => ({
                id_variacion_talla: Number(input.dataset.idVariacionTalla),
                cantidad: Number(input.value) || 0
            }))
            .filter(ajuste => ajuste.cantidad > 0);

        formDataAjusteVariacionPendiente.set('variacion_ajustes', JSON.stringify(ajustes));
        enviarActualizacionProducto(formDataAjusteVariacionPendiente, true);
    });

    function abrirModalEditar(id) {

        $.get('/productos/formulario?solo_activos=1', function(res){

            const data = res.data;

            /* ══════════════════════════════════════════ */

            const selectCat = $('#editar_id_categoria');
            const selectUbic = $('#editar_id_ubicacion');
            const selectImp = $('#editar_id_impuesto');
            const selectMed = $('#editar_medida_producto');
            const selectMot = $('#editar_stock_motivo');

            $('#editar_stock_motivo').prop('selectedIndex', 0).prop('disabled', true).trigger('change');
            $('#ajustar_stock_actual').val('0').css('color', '#198754');

            /* ══════════════════════════════════════════ */

            [selectCat, selectUbic, selectImp, selectMed, selectMot].forEach(select => {
                if (select.hasClass('select2-hidden-accessible')) { select.select2('destroy'); }
            });

            // ajustar_stock_actual

            [selectCat, selectUbic, selectImp, selectMed, selectMot].forEach(select => {
                select.select2({
                    width: '100%',
                    dropdownParent: $('#modalEditarProducto'),
                    placeholder: 'Seleccione',
                    allowClear: false,
                    minimumResultsForSearch: Infinity //SIN BUSCADOR
                });
            });

            selectCat.empty().append('<option value="" disabled selected>Seleccione</option>');
            selectUbic.empty().append('<option value="">Seleccione</option>');
            selectImp.empty().append('<option value="" disabled selected>Seleccione</option>');
            selectMed.empty().append('<option value="" disabled selected>Seleccione</option>');

            /* ══════════════════════════════════════════════════════════════════════════════════════════ */
            
            data.categorias.forEach(cat => { selectCat.append(`<option value="${cat.id_categoria}">${cat.nombre_categoria}</option>`); });
            data.ubicaciones.forEach(ubi => { selectUbic.append(`<option value="${ubi.id_ubicacion}">${ubi.nombre_ubicacion}</option>`); });
            
            data.impuestos.forEach(imp => {
                selectImp.append(`
                    <option value="${imp.id_impuesto}" data-iva="${imp.porcentaje_impuesto}">
                        ${imp.nombre_impuesto} (${parseFloat(imp.porcentaje_impuesto)}%)
                    </option>
                `);
            });

            const grupos = {};

            data.medidas.forEach(med => {
                const tipo = med.tipomedida.nombre_tipo_medida; if (!grupos[tipo]) { grupos[tipo] = []; } grupos[tipo].push(med);
            });

            Object.keys(grupos).forEach(tipo => {

                // ORDENAR POR ORDEN_MEDIDA
                grupos[tipo].sort((a, b) => a.orden_medida - b.orden_medida);
                const optgroup = $(`<optgroup label="${tipo}"></optgroup>`);

                grupos[tipo].forEach(med => {
                    optgroup.append(` <option value="${med.id_medida}"> ${med.orden_medida}. ${med.nombre_medida} (${med.abreviatura_medida}) </option> `);
                });

                selectMed.append(optgroup);
            });

           /* ══════════════════════════════════════════════════════════════════════════════════════════ */

            /* ═════════ OBTENER DATOS DEL PRODUCTO ════════════ */

            $.get(`/productos/${id}/editar`, function(resProducto){
                const producto = resProducto.producto;

                StockOriginal = Number(producto.stock_actual);
                variantesStockProducto = (producto.variaciones || []).flatMap(variacion => (variacion.tallas || []).map(talla => ({
                    id: Number(talla.id_variacion_talla),
                    color: variacion.color || 'Sin color',
                    talla: talla.talla?.talla || 'Sin talla',
                    sku: talla.sku || '',
                    stock: Number(talla.stock) || 0
                })));

                $('#editar_stock_actual').val(StockOriginal);
                $('#ajustar_stock_actual').val('0').css('color', '#198754');

                // Campos de texto
                $('#editar_id_producto').val(producto.id_producto);
                $('#editar_nombre_producto').val(producto.nombre_producto);
                $('#editar_descripcion_producto').val(producto.descripcion_producto);
                $('#editar_precio_compra').val(producto.precio_compra);
                $('#editar_precio_venta').val(producto.precio_venta);
                // $('#editar_stock_actual').val(producto.stock_actual);
                $('#editar_ganancia_producto').val( (producto.precio_venta - producto.precio_compra).toFixed(2) );

                // Seleccionar los valores correctos en los selects
                selectCat.val(producto.id_categoria).trigger('change');
                selectUbic.val(producto.id_ubicacion).trigger('change');
                selectImp.val(producto.id_impuesto).trigger('change');
                selectMed.val(producto.id_medida).trigger('change'); // si aplica

                // Preview de la imagen
                if(producto.imagen_producto){
                    $('#preview_editar_imagen_producto')
                        .attr('src', `/imagenes/productos/${producto.imagen_producto}`)
                        .removeClass('d-none');
                } else {
                    $('#preview_editar_imagen_producto').addClass('d-none');
                }

                /* ═════════ MOSTRAR MODAL ════════════ */

                const modal = new bootstrap.Modal(document.getElementById("modalEditarProducto"));
                modal.show();

            }).fail(function(){ mostrarToast('Error al cargar los datos del producto', 'danger'); });

        }).fail(function(){ mostrarToast('Error al cargar datos del formulario', 'danger'); });

    } // FIN DE FUNCION ABRIR MODAL

    //EVENTO DE AJUSTAR STOCK
    $(document).off('input', '#ajustar_stock_actual').on('input', '#ajustar_stock_actual', function () {

        let valor = $(this).val();

        // Permitir solo números y signos
        valor = valor.replace(/[^\d+-]/g, '');

        // Solo permitir un signo al inicio
        valor = valor.replace(/(?!^)[+-]/g, '');

        // Evitar múltiples signos al inicio
        valor = valor.replace(/^([+-]{2,})/, valor.charAt(0));

        $(this).val(valor);

        const motivo = $('#editar_stock_motivo');
        const mensaje = $('#mensaje_ajuste_stock');
        const stockActual = $('#editar_stock_actual');

        // Vacío o solo signo
        if (valor === '' || valor === '+' || valor === '-') {

            $(this).css('color', '');

            stockActual.val(StockOriginal);

            motivo
                .val(motivo.find('option:first').val())
                .prop('disabled', true)
                .trigger('change');

            mensaje.addClass('d-none');

            return;
        }

        const numero = Number(valor);

        // Ajuste inválido: 0
        if (numero === 0) {

            motivo
                .val(motivo.find('option:first').val())
                .prop('disabled', true)
                .trigger('change');

            mensaje
                .text('Seleccione un valor de ajuste correcto')
                .removeClass('d-none');

        } else {

            motivo
                .prop('disabled', false)
                .trigger('change');

            mensaje.addClass('d-none');
        }

        // Color del ajuste
        $(this).css(
            'color',
            numero > 0 ? '#198754' : '#dc3545'
        );

        // Stock resultante
        stockActual.val(StockOriginal + numero);

    });

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

    function inicializarEdicionVenta() {

        const checkVenta = $('#editar_check_venta'); 
        const checkRedondeo = $('#editar_redondeo_venta');

        const inputPorcentaje = $('#editar_porcentaje_venta');
        const inputPrecioCompra = $('#editar_precio_compra');
        const inputPrecioVenta = $('#editar_precio_venta'); 
        const inputPrecioTotal = $('#editar_precio_venta_TOTAL');
        const selectImpuesto = $('#editar_id_impuesto');

        function calcularGanancia() {
            let compra = parseFloat(inputPrecioCompra.val()) || 0;
            let venta = parseFloat(inputPrecioVenta.val()) || 0;
            $('#editar_ganancia_producto').val((venta - compra).toFixed(2));
        }

        let porcentajeOriginal = parseFloat(inputPorcentaje.val()) || 0;
        let bloqueando = false;
        let modoRedondeo = false; // 🔥 NUEVO

        // 🔹 Habilitar / deshabilitar inputs
        function toggleInputs() {
            if (checkVenta.is(':checked')) {
                inputPorcentaje.prop('disabled', false);
                inputPrecioVenta.prop('disabled', true);
                inputPrecioTotal.prop('disabled', true);
            } else {
                inputPorcentaje.prop('disabled', true);
                inputPrecioVenta.prop('disabled', false);
                inputPrecioTotal.prop('disabled', false);
            }
        }

        // 🔹 Calcular desde % o precio base
        function calcularTodo() {
            if (bloqueando || modoRedondeo) return; // 🔥 clave
            bloqueando = true;

            let precioCompra = parseFloat(inputPrecioCompra.val()) || 0;
            let iva = parseFloat(selectImpuesto.find(':selected').data('iva')) || 0;

            if (checkVenta.is(':checked')) {
                let porcentaje = parseFloat(inputPorcentaje.val()) || 0;

                let precioBase = precioCompra * (1 + porcentaje / 100);
                let precioTotal = precioBase * (1 + iva / 100);

                inputPrecioVenta.val(precioBase.toFixed(2));
                inputPrecioTotal.val(precioTotal.toFixed(2));
                calcularGanancia();

                porcentajeOriginal = porcentaje;

            } else {
                let precioBase = parseFloat(inputPrecioVenta.val()) || 0;
                let precioTotal = precioBase * (1 + iva / 100);
                inputPrecioTotal.val(precioTotal.toFixed(2));
            }
            calcularGanancia();
            bloqueando = false;
        }

        // 🔥 Calcular desde TOTAL
        function calcularDesdeTotal() {
            if (bloqueando) return;
            bloqueando = true;

            modoRedondeo = false; // 🔥 si escribe usuario, se desactiva

            let precioCompra = parseFloat(inputPrecioCompra.val()) || 0;
            let total = parseFloat(inputPrecioTotal.val()) || 0;
            let iva = parseFloat(selectImpuesto.find(':selected').data('iva')) || 0;

            if (precioCompra <= 0 || total <= 0) { bloqueando = false; return; }

            let precioBase = total / (1 + iva / 100);
            let porcentaje = ((precioBase / precioCompra) - 1) * 100;

            inputPrecioVenta.val(precioBase.toFixed(2));
            inputPorcentaje.val(porcentaje.toFixed(2));
            calcularGanancia();
            porcentajeOriginal = porcentaje;

            bloqueando = false;
        }

        // 🔹 Redondeo PRO (estable)
        function redondearTotal() {

            modoRedondeo = true; // 🔥 activa bloqueo

            let iva = parseFloat(selectImpuesto.find(':selected').data('iva')) || 0;

            if (checkVenta.is(':checked')) {

                let precioCompra = parseFloat(inputPrecioCompra.val()) || 0;

                let totalConIva = precioCompra * (1 + porcentajeOriginal / 100) * (1 + iva / 100);
                let totalRedondeado = Math.ceil(totalConIva);

                let baseRedondeada = totalRedondeado / (1 + iva / 100);
                let nuevoPorcentaje = ((baseRedondeada / precioCompra) - 1) * 100;

                porcentajeOriginal = nuevoPorcentaje;

                inputPorcentaje.val(nuevoPorcentaje.toFixed(3));
                inputPrecioVenta.val(baseRedondeada.toFixed(2));
                inputPrecioTotal.val(totalRedondeado);
                calcularGanancia();
            } else {

                let precioBase = parseFloat(inputPrecioVenta.val()) || 0;

                let totalConIva = precioBase * (1 + iva / 100);
                let totalRedondeado = Math.ceil(totalConIva);

                let nuevoPrecioVenta = totalRedondeado / (1 + iva / 100);

                inputPrecioVenta.val(nuevoPrecioVenta.toFixed(2));
                inputPrecioTotal.val(totalRedondeado);
                calcularGanancia();
            }
        }

        toggleInputs();
        calcularTodo();

        // EVENTOS
        checkVenta.on('change', () => {  modoRedondeo = false; toggleInputs(); calcularTodo(); });
        inputPrecioCompra.on('input', () => { modoRedondeo = false; calcularTodo(); });
        inputPorcentaje.on('input', () => { modoRedondeo = false; calcularTodo(); });
        inputPrecioVenta.on('input', () => { modoRedondeo = false; calcularTodo(); });
        selectImpuesto.on('change', () => { modoRedondeo = false; calcularTodo(); });
        inputPrecioTotal.on('input', calcularDesdeTotal);

        // BTN DE REDONDEO
        checkRedondeo.on('click', function(e) { e.preventDefault(); redondearTotal(); checkRedondeo.prop('checked', false); });

        // MODAL
        $('#modalEditarProducto').on('shown.bs.modal', function () { modoRedondeo = false; toggleInputs(); calcularTodo(); });
    }

    inicializarEdicionVenta();

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* BAJAR PRODUCTOS */

    document.addEventListener("click", async function(e) {

        if (e.target.classList.contains("bajaProducto")) {

            const id = e.target.dataset.id;
            let modalElement = document.getElementById("modalConfirmarEstadoProducto");

            // Crear modal si no existe
            if (!modalElement) {
                const modalHTML = `
                
                <div class="modal fade" id="modalConfirmarEstadoProducto" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">

                            <div class="modal-header">
                                <h5 class="modal-title">Confirmar acción</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>

                            <div class="modal-body">
                                <div class="card-responsive">
                                    ¿Deseas cambiar el estado de este producto?
                                </div>
                            </div>

                            <div class="modal-footer">
                                <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstadoProducto">Confirmar</button>
                            </div>

                        </div>
                    </div>
                </div>`;
                
                document.body.insertAdjacentHTML("beforeend", modalHTML);
                modalElement = document.getElementById("modalConfirmarEstadoProducto");
            }

            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            const botonConfirmar = modalElement.querySelector("#confirmarCambioEstadoProducto");

            botonConfirmar.onclick = async function () {

                try {
                    const response = await fetch(`/productos/cambiar-estado/${id}`, {
                        method: "POST",
                        headers: {
                            "X-CSRF-TOKEN": document
                                .querySelector('meta[name="csrf-token"]')
                                .getAttribute("content")
                        }
                    });

                    const data = await response.json();

                    if (data.success) {
                        mostrarToast("Estado del producto actualizado", "success");
                        $('#TablaMostrarProductos').DataTable().ajax.reload(null, false);
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
