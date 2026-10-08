export default function initMostrarProductoVariacionDetalle() {

    document.getElementById('titulo').textContent = 'GESTIÓN DE VARIACIONES DE PRODUCTOS, TALLAS E IMÁGENES';

    const $tabla = $('#tablaProductoVariacionDetalle');
    const $modalCrearImagen = $('#modalCrearVariacionImagen');
    const $modalGaleriaImagenes = $('#modalGaleriaVariacionImagenes');
    const $modalEditarImagen = $('#modalEditarVariacionImagen');
    const $modalCrearTalla = $('#modalCrearVariacionTalla');
    const $modalEditarTalla = $('#modalEditarVariacionTalla');
    const csrf = () => $('meta[name="csrf-token"]').attr('content');
    let tabla;
    let tallas = [];
    let filas = [];
    let previewImagenCrearUrl = null;

    if (!$tabla.length) return;
    if ($.fn.DataTable.isDataTable($tabla[0])) $tabla.DataTable().destroy();

    function escapar(valor) {
        return $('<div>').text(valor ?? '').html();
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

            filas = (variacionesResponse.variaciones || []).map(variacion => ({
                ...variacion,
                nombre_producto: variacion.producto?.nombre_producto || `Producto ${variacion.id_producto}`,
                imagenes: imagenes.filter(imagen => String(imagen.id_variacion) === String(variacion.id_variacion)),
                tallas: relaciones
                    .filter(relacion => String(relacion.id_variacion) === String(variacion.id_variacion))
                    .map(relacion => ({
                        ...relacion,
                        nombre_talla: tallas.find(talla => String(talla.id_talla) === String(relacion.id_talla))?.talla || `Talla ${relacion.id_talla}`
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
                    ${variacion.tallas.length ? variacion.tallas.map(talla => `
                        <span class="d-inline-flex align-items-center gap-3">
                            <strong>Talla:</strong> ${escapar(talla.nombre_talla)}
                            <strong>Stock:</strong> ${escapar(talla.stock)}
                            <button class="btn-editar editarVariacionTalla" data-id="${talla.id_variacion_talla}" title="Editar talla y stock"><i class="fa-solid fa-pencil-alt"></i></button>
                            <button class="btn-baja eliminarVariacionTalla" data-id="${talla.id_variacion_talla}" title="Quitar talla"><i class="fa-solid fa-xmark"></i></button>
                        </span>
                    `).join('') : '<span>Sin tallas asignadas</span>'}
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
            mostrarToast(error.message || 'Error al cargar imÃ¡genes y tallas', 'danger');
            console.error(error);
        }
    }

    function recargarDatos() {
        return cargarDatos();
    }

    $tabla.off('click.detalle', '.verImagenesVariacion').on('click.detalle', '.verImagenesVariacion', function () {
        const variacion = filas.find(fila => String(fila.id_variacion) === String($(this).data('id')));
        if (!variacion) return;

        $('#galeria_variacion_titulo').text(`Imágenes · ${variacion.nombre_producto} · ${variacion.color || 'Sin color'}`);
        $('#galeria_variacion_contenido').html(variacion.imagenes.length ? variacion.imagenes.map(imagen => `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card h-100">
                    <img src="/${escapar(imagen.imagen)}" alt="Imagen ${escapar(variacion.color)}" class="card-img-top" style="height:180px;object-fit:contain;background:#f8f9fa;">
                    <div class="card-body text-center p-2">
                        <small class="d-block mb-2">Imagen ${escapar(imagen.orden)}</small>
                        <button class="btn-baja eliminarVariacionImagen" data-id="${imagen.id_imagen}" title="Quitar imagen"><i class="fa-solid fa-trash"></i> Quitar</button>
                    </div>
                </div>
            </div>
        `).join('') : '<div class="col-12 text-center py-4">Este color todavía no tiene imágenes.</div>');
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
        $('#formCrearVariacionTalla')[0].reset();
        $('#crear_talla_id_variacion').val(idVariacion);
        $('#crear_id_talla').val('').trigger('change');
        bootstrap.Modal.getOrCreateInstance($modalCrearTalla[0]).show();
    });

    $('#formCrearVariacionTalla').off('submit.detalle').on('submit.detalle', function (event) {
        event.preventDefault();
        const idVariacion = $('#crear_talla_id_variacion').val();
        const idTalla = $('#crear_id_talla').val();
        const repetida = filas.some(fila => String(fila.id_variacion) === String(idVariacion) && fila.tallas.some(talla => String(talla.id_talla) === String(idTalla)));
        if (!idTalla) return mostrarToast('Seleccione una talla del catÃ¡logo', 'warning');
        if (repetida) return mostrarToast('Esa talla ya estÃ¡ asignada a este color', 'warning');

        $.ajax({
            url: '/variacion-tallas/crear',
            type: 'POST',
            data: { id_variacion: idVariacion, id_talla: idTalla, stock: $('#crear_stock_variacion_talla').val(), _token: csrf() },
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
            if (!response.success || !response.variacion_talla) return mostrarToast(response.mensaje || 'No se encontrÃ³ la talla', 'danger');
            $('#editar_id_variacion_talla').val(response.variacion_talla.id_variacion_talla);
            $('#editar_id_variacion_talla').data('variacion', response.variacion_talla.id_variacion);
            $('#editar_id_talla').val(response.variacion_talla.id_talla).trigger('change');
            $('#editar_stock_variacion_talla').val(response.variacion_talla.stock);
            bootstrap.Modal.getOrCreateInstance($modalEditarTalla[0]).show();
        }).fail(xhr => mostrarError(xhr, 'Error al obtener la talla'));
    });

    $('#formEditarVariacionTalla').off('submit.detalle').on('submit.detalle', function (event) {
        event.preventDefault();
        const id = $('#editar_id_variacion_talla').val();
        const idTalla = $('#editar_id_talla').val();
        const repetida = filas.some(fila => String(fila.id_variacion) === String($('#editar_id_variacion_talla').data('variacion')) && fila.tallas.some(talla => String(talla.id_talla) === String(idTalla) && String(talla.id_variacion_talla) !== String(id)));
        if (!idTalla) return mostrarToast('Seleccione una talla del catÃ¡logo', 'warning');
        if (repetida) return mostrarToast('Esa talla ya estÃ¡ asignada a este color', 'warning');

        $.ajax({
            url: `/variacion-tallas/actualizar/${id}`,
            type: 'PUT',
            data: { id_talla: idTalla, stock: $('#editar_stock_variacion_talla').val(), _token: csrf() },
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
        if (!window.confirm('Â¿Deseas quitar esta talla de la variaciÃ³n?')) return;
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
