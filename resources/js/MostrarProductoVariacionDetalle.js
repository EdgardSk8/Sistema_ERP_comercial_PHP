export default function initMostrarProductoVariacionDetalle() {

    document.getElementById('titulo').textContent = 'GESTIÓN DE VARIACIONES DE PRODUCTOS, TALLAS E IMÁGENES';

    const $tabla = $('#tablaProductoVariacionDetalle');
    const $modalCrearImagen = $('#modalCrearVariacionImagen');
    const $modalGaleriaImagenes = $('#modalGaleriaVariacionImagenes');
    const $modalEditarImagen = $('#modalEditarVariacionImagen');
    const $modalCrearTalla = $('#modalCrearVariacionTalla');
    const $modalEditarTalla = $('#modalEditarVariacionTalla');
    const csrf = () => $('meta[name="csrf-token"]').attr('content');
    const calcularPrecioBase = (valor, idVariacion, modo) => {
        const variacion = filas.find(item => String(item.id_variacion) === String(idVariacion));
        const impuesto = Number(variacion?.producto?.impuesto?.porcentaje_impuesto || 0);
        const precio = Number(valor || 0);
        return modo === 'incluido' ? precio / (1 + impuesto / 100) : precio;
    };
    let tabla;
    let tallas = [];
    let filas = [];
    let previewImagenCrearUrl = null;

    if (!$tabla.length) return;
    if ($.fn.DataTable.isDataTable($tabla[0])) $tabla.DataTable().destroy();

    function escapar(valor) {
        return $('<div>').text(valor ?? '').html();
    }

    function calcularStockMaximoPorVariacion(idVariacion, idTallaActual = null) {
        const variacion = filas.find(item => String(item.id_variacion) === String(idVariacion));
        const stockReal = Number(variacion?.producto?.stock_actual ?? 0);

        if (!Number.isFinite(stockReal) || stockReal <= 0) return null;

        const totalEnOtrasTallas = (variacion?.tallas || []).reduce((total, talla) => {
            const mismoId = String(talla.id_variacion_talla) === String(idTallaActual);
            return total + (mismoId ? 0 : Number(talla.stock || 0));
        }, 0);

        return Math.max(stockReal - totalEnOtrasTallas, 0);
    }

    function validarStockPorVariacion(idVariacion, stock, idTallaActual = null) {
        const stockNumerico = Number(stock || 0);
        const maximo = calcularStockMaximoPorVariacion(idVariacion, idTallaActual);

        if (maximo === null) {
            return { ok: true, maximo: null };
        }

        if (!Number.isFinite(stockNumerico) || stockNumerico < 0) {
            return { ok: false, maximo, mensaje: 'El stock no puede ser negativo.' };
        }

        if (stockNumerico > maximo) {
            return {
                ok: false,
                maximo,
                mensaje: `El stock máximo permitido para esta talla es ${maximo} según el stock real del producto.`
            };
        }

        return { ok: true, maximo };
    }

    function configurarLimiteStockInput(selector, idVariacion, idTallaActual = null) {
        const $input = $(selector);
        const maximo = calcularStockMaximoPorVariacion(idVariacion, idTallaActual);

        if (maximo === null) {
            $input.removeAttr('max');
            return;
        }

        $input.attr('max', String(maximo));
        $input.off('input.stockLimit').on('input.stockLimit', function () {
            const valor = Number(this.value || 0);
            if (Number.isFinite(valor) && valor > maximo) {
                this.value = maximo;
                mostrarToast(`El stock no puede superar ${maximo} unidades para este producto.`, 'warning');
            }
        });
    }

    function mostrarError(xhr, fallback) {
        const errores = xhr.responseJSON?.errors || xhr.responseJSON?.errores;
        const primerError = errores ? Object.values(errores).flat()[0] : null;
        mostrarToast(xhr.responseJSON?.mensaje || xhr.responseJSON?.message || primerError || fallback, 'danger');
    }

    function opcionesTallas() {
        [
            { id: '#crear_id_talla', modal: $modalCrearTalla, disponibles: tallas.filter(talla => talla.estado_talla == 1) },
            { id: '#editar_id_talla', modal: $modalEditarTalla, disponibles: tallas }
        ].forEach(config => {
            const $select = $(config.id);
            if ($.fn.select2 && $select.hasClass('select2-hidden-accessible')) $select.select2('destroy');
            $select.empty().append(new Option('Seleccione una talla', ''));
            config.disponibles.forEach(talla => {
                const nombre = talla.estado_talla == 1 ? talla.talla : `${talla.talla} (Inactiva)`;
                $select.append(new Option(nombre, talla.id_talla));
            });
            if ($.fn.select2) {
                $select.select2({
                    width: '100%',
                    dropdownParent: config.modal,
                    placeholder: 'Buscar talla',
                    allowClear: true
                });
            }
        });
    }

    async function cargarDatos() {
        try {
            const [variacionesResponse, imagenesResponse, relacionesResponse, tallasResponse] = await Promise.all([
                $.getJSON('/producto-variaciones/mostrar'),
                $.getJSON('/variacion-imagenes/mostrar'),
                $.getJSON('/variacion-tallas/mostrar'),
                $.getJSON('/tallas/mostrar')
            ]);

            if (!variacionesResponse.success || !imagenesResponse.success || !relacionesResponse.success || !tallasResponse.success) {
                throw new Error('No se pudieron cargar todos los datos del producto.');
            }

            tallas = tallasResponse.tallas || [];
            opcionesTallas();

            const imagenes = imagenesResponse.imagenes || [];
            const relaciones = relacionesResponse.variaciones_tallas || [];
            const tallasPorId = new Map(tallas.map(talla => [String(talla.id_talla), talla.talla]));
            const imagenesPorVariacion = new Map();
            const relacionesPorVariacion = new Map();

            imagenes.forEach(imagen => {
                const idVariacion = String(imagen.id_variacion);
                if (!imagenesPorVariacion.has(idVariacion)) imagenesPorVariacion.set(idVariacion, []);
                imagenesPorVariacion.get(idVariacion).push(imagen);
            });

            relaciones.forEach(relacion => {
                const idVariacion = String(relacion.id_variacion);
                if (!relacionesPorVariacion.has(idVariacion)) relacionesPorVariacion.set(idVariacion, []);
                relacionesPorVariacion.get(idVariacion).push(relacion);
            });

            filas = (variacionesResponse.variaciones || []).map(variacion => ({
                ...variacion,
                nombre_producto: variacion.producto?.nombre_producto || `Producto ${variacion.id_producto}`,
                imagenes: imagenesPorVariacion.get(String(variacion.id_variacion)) || [],
                tallas: (relacionesPorVariacion.get(String(variacion.id_variacion)) || [])
                    .map(relacion => ({
                        ...relacion,
                        nombre_talla: tallasPorId.get(String(relacion.id_talla)) || `Talla ${relacion.id_talla}`
                    }))
            }));

            const agrupadas = new Map();
            filas.forEach(variacion => {
                const idProducto = String(variacion.id_producto);
                if (!agrupadas.has(idProducto)) agrupadas.set(idProducto, {
                    nombre_producto: variacion.nombre_producto,
                    variaciones: []
                });
                agrupadas.get(idProducto).variaciones.push(variacion);
            });
            const filasAgrupadas = [...agrupadas.values()];

            if (!tabla) {
                tabla = $tabla.DataTable({
    data: filasAgrupadas,
    columns: [
        { data: 'nombre_producto', render: data => escapar(data || '—') },
        {
            data: 'variaciones',
            orderable: false,
            render: variaciones => variaciones.map(variacion => `
                <section class="mb-1 px-2 py-1 rounded small d-flex flex-wrap align-items-center gap-3" style="background:var(--celeste-soft); border:1px solid var(--celeste-soft-border);">
                    <span><strong>Color:</strong> ${escapar(variacion.color || 'Sin especificar')}</span>
                    ${variacion.tallas.length ? variacion.tallas.map(talla => {
                        const porcentajeImpuesto = Number(variacion.producto?.impuesto?.porcentaje_impuesto || 0);
                        const precioVentaBase = Number(talla.precio_venta ?? variacion.producto?.precio_venta ?? 0);
                        return `
                        <span class="d-inline-flex align-items-center gap-1">
                            <strong>Talla:</strong> ${escapar(talla.nombre_talla)}
                            <strong>Stock:</strong> ${escapar(talla.stock)}
                            <strong>SKU:</strong> ${escapar(talla.sku || '—')}
                            <strong>Compra:</strong> C$ ${Number(talla.precio_compra || 0).toFixed(2)}
                            <strong>Venta neta:</strong> C$ ${precioVentaBase.toFixed(2)}
                            <strong>Final:</strong> C$ ${(precioVentaBase * (1 + porcentajeImpuesto / 100)).toFixed(2)}
                            <button class="btn-editar editarVariacionTalla" data-id="${talla.id_variacion_talla}" title="Editar talla y stock"><i class="fa-solid fa-pencil-alt"></i></button>
                            <button class="btn-baja eliminarVariacionTalla" data-id="${talla.id_variacion_talla}" title="Quitar talla"><i class="fa-solid fa-xmark"></i></button>
                        </span>
                    `; }).join('') : '<span>Sin tallas asignadas</span>'}
                    <div class="d-flex align-items-center flex-shrink-0 ms-auto">
                            <button class="btn-transferir verImagenesVariacion" data-id="${variacion.id_variacion}" title="Ver imágenes"><i class="fa-solid fa-images"></i> ${variacion.imagenes.length} ${variacion.imagenes.length === 1 ? 'Imagenes' : 'im&aacute;genes'}</button>
                            <button class="btn-alta agregarTallaVariacion" data-id="${variacion.id_variacion}" title="Agregar medida"><i class="fa-solid fa-ruler"></i> Tallas</button>
                    </div>
                </section>
            `).join('')
        }
    ],

    order: [[0, 'asc']],
    drawCallback: function() {
        AnimarFilasVisibles(this.api());
    }
});
                configurarToggleColumnas('tablaProductoVariacionDetalle');
            } else {
                tabla.clear().rows.add(filasAgrupadas).draw(false);
            }
        } catch (error) {
            mostrarToast(error.message || 'Error al cargar imágenes y tallas', 'danger');
            console.error(error);
        }
    }

    function recargarDatos() {
        return cargarDatos();
    }

    $tabla.off('click.detalle', '.verImagenesVariacion').on('click.detalle', '.verImagenesVariacion', function () {
        const variacion = filas.find(fila => String(fila.id_variacion) === String($(this).data('id')));
        if (!variacion) return;

        $('#galeria_variacion_titulo').text(` ${variacion.nombre_producto} · ${variacion.color || 'Sin color'}`);
        $('#galeria_variacion_contenido').html(variacion.imagenes.length ? variacion.imagenes.map(imagen => `
            <div style="flex: 0 1 200px; max-width:200px;">
                <div class="card h-100">
                    <img src="/${escapar(imagen.imagen)}" alt="Imagen ${escapar(variacion.color)}" class="card-img-top" style="width:100%; height:100px; object-fit:contain; background:#f8f9fa;">
                    <div class="card-body text-center p-2">
                        <small class="d-block mb-2">Imagen ${escapar(imagen.orden)}</small>
                        <button class="btn-baja eliminarVariacionImagen" data-id="${imagen.id_imagen}" title="Quitar imagen"><i class="fa-solid fa-trash"></i> Quitar</button>
                    </div>
                </div>
            </div>
        `).join('') : '<div class="col-12 text-center py-4">Este color todavía no tiene imágenes.</div>');
        const cantidadImagenes = variacion.imagenes.length;
        const anchoModal = Math.min(900, Math.max(300, cantidadImagenes * 184 + 48));
        $modalGaleriaImagenes.find('.modal-dialog').css('width', `${anchoModal}px`);
        $('#galeria_variacion_agregar').data('id', variacion.id_variacion);
        bootstrap.Modal.getOrCreateInstance($modalGaleriaImagenes[0]).show();
    });

    $('#galeria_variacion_agregar').off('click.detalle').on('click.detalle', function () {
        const idVariacion = $(this).data('id');
        bootstrap.Modal.getOrCreateInstance($modalGaleriaImagenes[0]).hide();
        $modalGaleriaImagenes.one('hidden.bs.modal', () => abrirModalAgregarImagen(idVariacion));
    });

    function abrirModalAgregarImagen(idVariacion) {
        limpiarPreviewImagenCrear();
        $('#formCrearVariacionImagen')[0].reset();
        $('#crear_id_variacion').val(idVariacion);
        const imagenes = filas.find(fila => String(fila.id_variacion) === String(idVariacion))?.imagenes || [];
        const ordenes = imagenes.map(imagen => Number(imagen.orden)).filter(Number.isFinite);
        $('#crear_orden').val(ordenes.length ? Math.max(...ordenes) + 1 : 1);
        bootstrap.Modal.getOrCreateInstance($modalCrearImagen[0]).show();
    }

    function limpiarPreviewImagenCrear() {
        if (previewImagenCrearUrl) URL.revokeObjectURL(previewImagenCrearUrl);
        previewImagenCrearUrl = null;
        $('#crear_preview_imagen').attr('src', '').addClass('d-none');
    }

    $('#crear_imagen').off('change.detalle').on('change.detalle', function () {
        limpiarPreviewImagenCrear();
        const archivo = this.files?.[0];
        if (!archivo || !archivo.type.startsWith('image/')) return;

        previewImagenCrearUrl = URL.createObjectURL(archivo);
        $('#crear_preview_imagen').attr('src', previewImagenCrearUrl).removeClass('d-none');
    });

    $modalCrearImagen.off('hidden.bs.modal.preview').on('hidden.bs.modal.preview', limpiarPreviewImagenCrear);

    $tabla.off('click.detalle', '.agregarImagenVariacion').on('click.detalle', '.agregarImagenVariacion', function () {
        abrirModalAgregarImagen($(this).data('id'));
    });

    $('#formCrearVariacionImagen').off('submit.detalle').on('submit.detalle', function (event) {
        event.preventDefault();
        const formData = new FormData(this);
        formData.set('_token', csrf());
        $.ajax({
            url: '/variacion-imagenes/crear',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: { 'X-CSRF-TOKEN': csrf() },
            success: response => {
                if (!response.success) return mostrarToast(response.mensaje || 'No se pudo guardar la imagen', 'danger');
                mostrarToast(response.mensaje || 'Imagen agregada correctamente', 'success');
                bootstrap.Modal.getOrCreateInstance($modalCrearImagen[0]).hide();
                $('#formCrearVariacionImagen')[0].reset();
                limpiarPreviewImagenCrear();
                recargarDatos();
            },
            error: xhr => mostrarError(xhr, 'Error al agregar la imagen')
        });
    });

    $(document).off('click.detalle', '.editarVariacionImagen').on('click.detalle', '.editarVariacionImagen', function () {
        const id = $(this).data('id');
        $.get(`/variacion-imagenes/editar/${id}`, response => {
            if (!response.success || !response.imagen) return mostrarToast(response.mensaje || 'No se encontro la imagen', 'danger');
            $('#formEditarVariacionImagen')[0].reset();
            $('#editar_id_imagen').val(response.imagen.id_imagen);
            $('#editar_id_variacion').val(response.imagen.id_variacion);
            $('#editar_orden').val(response.imagen.orden);
            const ruta = String(response.imagen.imagen || '').replace(/^\/+/, '');
            $('#editar_preview_imagen').attr('src', `/${ruta}`).toggleClass('d-none', !ruta);
            bootstrap.Modal.getOrCreateInstance($modalEditarImagen[0]).show();
        }).fail(xhr => mostrarError(xhr, 'Error al obtener la imagen'));
    });

    $('#formEditarVariacionImagen').off('submit.detalle').on('submit.detalle', function (event) {
        event.preventDefault();
        const id = $('#editar_id_imagen').val();
        const formData = new FormData(this);
        formData.set('_method', 'PUT');
        formData.set('_token', csrf());
        $.ajax({
            url: `/variacion-imagenes/actualizar/${id}`,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: { 'X-CSRF-TOKEN': csrf() },
            success: response => {
                if (!response.success) return mostrarToast(response.mensaje || 'No se pudo actualizar la imagen', 'danger');
                mostrarToast(response.mensaje || 'Imagen actualizada correctamente', 'success');
                bootstrap.Modal.getOrCreateInstance($modalEditarImagen[0]).hide();
                $('#formEditarVariacionImagen')[0].reset();
                $('#editar_preview_imagen').attr('src', '').addClass('d-none');
                recargarDatos();
            },
            error: xhr => mostrarError(xhr, 'Error al actualizar la imagen')
        });
    });

    $(document).off('click.detalle', '.eliminarVariacionImagen').on('click.detalle', '.eliminarVariacionImagen', function () {
        const id = $(this).data('id');
        const idVariacion = filas.find(fila => fila.imagenes.some(imagen => String(imagen.id_imagen) === String(id)))?.id_variacion;
        if (!window.confirm('Â¿Deseas eliminar esta imagen?')) return;
        $.ajax({
            url: `/variacion-imagenes/eliminar/${id}`,
            type: 'DELETE',
            data: { _token: csrf() },
            headers: { 'X-CSRF-TOKEN': csrf() },
            success: response => {
                if (!response.success) return mostrarToast(response.mensaje || 'No se pudo eliminar la imagen', 'danger');
                mostrarToast(response.mensaje || 'Imagen eliminada correctamente', 'success');
                recargarDatos().then(() => {
                    if (idVariacion) $tabla.find(`.verImagenesVariacion[data-id="${idVariacion}"]`).trigger('click');
                });
            },
            error: xhr => mostrarError(xhr, 'Error al eliminar la imagen')
        });
    });

    $tabla.off('click.detalle', '.agregarTallaVariacion').on('click.detalle', '.agregarTallaVariacion', function () {
        const idVariacion = $(this).data('id');
        const variacion = filas.find(item => String(item.id_variacion) === String(idVariacion));
        $('#formCrearVariacionTalla')[0].reset();
        $('#crear_talla_id_variacion').val(idVariacion);
        $('#crear_id_talla').val('').trigger('change');
        $('#crear_precio_compra_variacion').val(variacion?.producto?.precio_compra ?? '');
        $('#crear_precio_venta_variacion').val(variacion?.producto?.precio_venta ?? '');
        $('#crear_modo_precio_variacion').val('base');
        configurarLimiteStockInput('#crear_stock_variacion_talla', idVariacion);
        bootstrap.Modal.getOrCreateInstance($modalCrearTalla[0]).show();
    });

    $('#formCrearVariacionTalla').off('submit.detalle').on('submit.detalle', function (event) {
        event.preventDefault();
        const idVariacion = $('#crear_talla_id_variacion').val();
        const idTalla = $('#crear_id_talla').val();
        const stock = Number($('#crear_stock_variacion_talla').val() || 0);
        const precioVentaBase = calcularPrecioBase(
            $('#crear_precio_venta_variacion').val(),
            idVariacion,
            $('#crear_modo_precio_variacion').val()
        );
        const repetida = filas.some(fila => String(fila.id_variacion) === String(idVariacion) && fila.tallas.some(talla => String(talla.id_talla) === String(idTalla)));
        if (!idTalla) return mostrarToast('Seleccione una talla del catalogo', 'warning');
        if (repetida) return mostrarToast('Esa talla ya está asignada a este color', 'warning');

        const validacion = validarStockPorVariacion(idVariacion, stock);
        if (!validacion.ok) {
            mostrarToast(validacion.mensaje, 'warning');
            $('#crear_stock_variacion_talla').val(validacion.maximo ?? 0).trigger('input');
            return;
        }

        $.ajax({
            url: '/variacion-tallas/crear',
            type: 'POST',
            data: {
                id_variacion: idVariacion,
                id_talla: idTalla,
                stock: $('#crear_stock_variacion_talla').val(),
                sku: $('#crear_sku_variacion').val(),
                precio_compra: $('#crear_precio_compra_variacion').val(),
                precio_venta: precioVentaBase.toFixed(2),
                _token: csrf()
            },
            headers: { 'X-CSRF-TOKEN': csrf() },
            success: response => {
                if (!response.success) return mostrarToast(response.mensaje || 'No se pudo agregar la talla', 'danger');
                mostrarToast(response.mensaje || 'Talla agregada correctamente', 'success');
                bootstrap.Modal.getOrCreateInstance($modalCrearTalla[0]).hide();
                recargarDatos();
            },
            error: xhr => mostrarError(xhr, 'Error al agregar la talla')
        });
    });

    $tabla.off('click.detalle', '.editarVariacionTalla').on('click.detalle', '.editarVariacionTalla', function () {
        const id = $(this).data('id');
        $.get(`/variacion-tallas/editar/${id}`, response => {
            if (!response.success || !response.variacion_talla) return mostrarToast(response.mensaje || 'No se encontró la talla', 'danger');
            $('#editar_id_variacion_talla').val(response.variacion_talla.id_variacion_talla);
            $('#editar_id_variacion_talla').data('variacion', response.variacion_talla.id_variacion);
            const variacion = filas.find(item => String(item.id_variacion) === String(response.variacion_talla.id_variacion));
            $('#editar_id_talla').val(response.variacion_talla.id_talla).trigger('change');
            $('#editar_stock_variacion_talla').val(response.variacion_talla.stock);
            $('#editar_sku_variacion').val(response.variacion_talla.sku);
            $('#editar_precio_compra_variacion').val(response.variacion_talla.precio_compra ?? variacion?.producto?.precio_compra ?? '');
            $('#editar_precio_venta_variacion').val(response.variacion_talla.precio_venta ?? variacion?.producto?.precio_venta ?? '');
            $('#editar_modo_precio_variacion').val('base');
            configurarLimiteStockInput('#editar_stock_variacion_talla', response.variacion_talla.id_variacion, response.variacion_talla.id_variacion_talla);
            bootstrap.Modal.getOrCreateInstance($modalEditarTalla[0]).show();
        }).fail(xhr => mostrarError(xhr, 'Error al obtener la talla'));
    });

    $('#formEditarVariacionTalla').off('submit.detalle').on('submit.detalle', function (event) {
        event.preventDefault();
        const id = $('#editar_id_variacion_talla').val();
        const idTalla = $('#editar_id_talla').val();
        const stock = Number($('#editar_stock_variacion_talla').val() || 0);
        const precioVentaBase = calcularPrecioBase(
            $('#editar_precio_venta_variacion').val(),
            $('#editar_id_variacion_talla').data('variacion'),
            $('#editar_modo_precio_variacion').val()
        );
        const repetida = filas.some(fila => String(fila.id_variacion) === String($('#editar_id_variacion_talla').data('variacion')) && fila.tallas.some(talla => String(talla.id_talla) === String(idTalla) && String(talla.id_variacion_talla) !== String(id)));
        if (!idTalla) return mostrarToast('Seleccione una talla del catalogo', 'warning');
        if (repetida) return mostrarToast('Esa talla ya está asignada a este color', 'warning');

        const validacion = validarStockPorVariacion($('#editar_id_variacion_talla').data('variacion'), stock, id);
        if (!validacion.ok) {
            mostrarToast(validacion.mensaje, 'warning');
            $('#editar_stock_variacion_talla').val(validacion.maximo ?? 0).trigger('input');
            return;
        }

        $.ajax({
            url: `/variacion-tallas/actualizar/${id}`,
            type: 'PUT',
            data: {
                id_talla: idTalla,
                stock: $('#editar_stock_variacion_talla').val(),
                sku: $('#editar_sku_variacion').val(),
                precio_compra: $('#editar_precio_compra_variacion').val(),
                precio_venta: precioVentaBase.toFixed(2),
                _token: csrf()
            },
            headers: { 'X-CSRF-TOKEN': csrf() },
            success: response => {
                if (!response.success) return mostrarToast(response.mensaje || 'No se pudo actualizar la talla', 'danger');
                mostrarToast(response.mensaje || 'Talla actualizada correctamente', 'success');
                bootstrap.Modal.getOrCreateInstance($modalEditarTalla[0]).hide();
                recargarDatos();
            },
            error: xhr => mostrarError(xhr, 'Error al actualizar la talla')
        });
    });

    $tabla.off('click.detalle', '.eliminarVariacionTalla').on('click.detalle', '.eliminarVariacionTalla', function () {
        const id = $(this).data('id');
        if (!window.confirm('Â¿Deseas quitar esta talla de la variacion?')) return;
        $.ajax({
            url: `/variacion-tallas/eliminar/${id}`,
            type: 'DELETE',
            data: { _token: csrf() },
            headers: { 'X-CSRF-TOKEN': csrf() },
            success: response => {
                if (!response.success) return mostrarToast(response.mensaje || 'No se pudo quitar la talla', 'danger');
                mostrarToast(response.mensaje || 'Talla quitada correctamente', 'success');
                recargarDatos();
            },
            error: xhr => mostrarError(xhr, 'Error al quitar la talla')
        });
    });

    cargarDatos();
}
