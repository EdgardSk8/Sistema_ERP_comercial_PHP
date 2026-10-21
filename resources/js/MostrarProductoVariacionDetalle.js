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
    let previewImagenCrearUrls = [];
    let arrastreImagenGaleria = null;

    if (!$tabla.length) return;
    if ($.fn.DataTable.isDataTable($tabla[0])) $tabla.DataTable().destroy();

    // Los precios de la variación se limitan a 2 decimales mientras se escriben.
    ['#crear_precio_compra_variacion', '#crear_precio_venta_variacion',
     '#editar_precio_compra_variacion', '#editar_precio_venta_variacion'].forEach(selector => {
        $(selector).off('input.dosDecimales').on('input.dosDecimales', function () {
            const [entero, decimales] = String(this.value).split('.');
            if (decimales !== undefined && decimales.length > 2) {
                this.value = `${entero}.${decimales.slice(0, 2)}`;
            }
        });
    });

    function escapar(valor) {
        return $('<div>').text(valor ?? '').html();
    }

    // Números sin decimales innecesarios: 5.00 → 5, 5.50 → 5.5
    function numeroCorto(valor) {
        if (valor === null || valor === undefined || valor === '') return '';
        const numero = Number(valor);
        if (!Number.isFinite(numero)) return '';
        return String(parseFloat(numero.toFixed(2)));
    }

    function calcularStockMaximoPorVariacion(idVariacion, idTallaActual = null) {
        const variacion = filas.find(item => String(item.id_variacion) === String(idVariacion));
        const stockReal = Number(variacion?.producto?.stock_actual ?? 0);

        if (!Number.isFinite(stockReal)) return null;

        const tallasDelProducto = filas
            .filter(item => String(item.id_producto) === String(variacion?.id_producto))
            .flatMap(item => item.tallas || []);
        const totalEnOtrasTallas = tallasDelProducto.reduce((total, talla) => {
            return total + (String(talla.id_variacion_talla) === String(idTallaActual) ? 0 : Number(talla.stock || 0));
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
                mensaje: `El stock disponible para todas las tallas y colores de este producto es ${maximo}.`
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
    <section class="p-2 ml-2 rounded small"
        style="background:var(--celeste-soft); border:1px solid var(--celeste-soft-border);">

        <div class="mb-2">
            <strong>Color:</strong> ${escapar(variacion.color || 'Sin especificar')}
        </div>

        <div class="d-flex flex-column gap-2">
            ${variacion.tallas.length ? variacion.tallas.map(talla => {
                const porcentajeImpuesto = Number(variacion.producto?.impuesto?.porcentaje_impuesto || 0);
                const precioVentaBase = Number(talla.precio_venta ?? variacion.producto?.precio_venta ?? 0);

                return `
                    <div class="d-flex flex-wrap align-items-center gap-3 p-2 rounded"
                        style="background:var(--bs-body-bg); border:1px solid var(--celeste-soft-border);">

                        <span><strong>Talla:</strong> ${escapar(talla.nombre_talla)}</span>
                        <span><strong>Stock:</strong> ${escapar(numeroCorto(talla.stock))}</span>
                        <span><strong>SKU:</strong> ${escapar(talla.sku || '—')}</span>
                        <span><strong>Compra:</strong> C$ ${Number(talla.precio_compra || 0).toFixed(2)}</span>
                        <span><strong>Venta neta:</strong> C$ ${precioVentaBase.toFixed(2)}</span>
                        <span><strong>Final:</strong> C$ ${(precioVentaBase * (1 + porcentajeImpuesto / 100)).toFixed(2)}</span>

                        <div class="d-flex align-items-center gap-1 ms-auto">
                            <button class="btn-editar editarVariacionTalla"
                                data-id="${talla.id_variacion_talla}" title="Editar talla y stock">
                                <i class="ph ph-pencil-simple"></i>
                            </button>
                            <button class="btn-baja eliminarVariacionTalla"
                                data-id="${talla.id_variacion_talla}" title="Quitar talla">
                                <i class="ph ph-x"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('') : '<span>Sin tallas asignadas</span>'}
        </div>

        <div class="d-flex flex-wrap align-items-center justify-content-center gap-4 mt-2">
            <button class="btn-transferir verImagenesVariacion"
                data-id="${variacion.id_variacion}" title="Ver imágenes">
                <i class="ph ph-images"></i> ${variacion.imagenes.length}
                ${variacion.imagenes.length === 1 ? 'Imagen' : 'Imágenes'}
            </button>
            <button class="btn-alta agregarTallaVariacion"
                data-id="${variacion.id_variacion}" title="Agregar talla">
                <i class="ph ph-ruler"></i> Tallas
            </button>
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

        $('#galeria_variacion_titulo').text(`${variacion.nombre_producto} · ${variacion.color || 'Sin color'}`);
        $('#galeria_variacion_subtitulo').text(variacion.imagenes.length
            ? `${variacion.imagenes.length} ${variacion.imagenes.length === 1 ? 'imagen' : 'imágenes'} · arrastra una imagen para cambiar el orden`
            : 'Este color todavía no tiene imágenes');

        $('#galeria_variacion_contenido').html(variacion.imagenes.length ? variacion.imagenes.map(imagen => `
            <article class="variacion-imagen-item" data-id="${imagen.id_imagen}">
                <div class="variacion-imagen-item__media">
                    <img src="/${escapar(imagen.imagen)}" alt="Imagen ${escapar(imagen.orden)} de ${escapar(variacion.nombre_producto)}" draggable="false">
                </div>

                <span class="variacion-imagen-item__nombre">Imagen ${escapar(imagen.orden)}</span>

                <div class="variacion-imagen-item__acciones">
                    <button type="button" class="btn-editar reemplazarVariacionImagen"
                        data-id="${imagen.id_imagen}" data-variacion="${variacion.id_variacion}" title="Reemplazar imagen" aria-label="Reemplazar imagen ${escapar(imagen.orden)}">
                        <i class="ph ph-pencil-simple-line"></i>
                    </button>
                    <button type="button" class="btn-baja eliminarVariacionImagen"
                        data-id="${imagen.id_imagen}" title="Eliminar imagen" aria-label="Eliminar imagen ${escapar(imagen.orden)}">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </article>
        `).join('') : '<p class="galeria-vacia">Este color todavía no tiene imágenes.</p>');

        $('#galeria_variacion_contenido').scrollLeft(0);
        $('#galeria_variacion_agregar').data('id', variacion.id_variacion);
        bootstrap.Modal.getOrCreateInstance($modalGaleriaImagenes[0]).show();
    });

    function guardarOrdenGaleria(arrastre) {
        const ids = Array.from(arrastre.contenedor.querySelectorAll('.variacion-imagen-item'))
            .map(elemento => Number(elemento.dataset.id));
        const cambioOrden = ids.some((id, indice) => id !== arrastre.idsOriginales[indice]);

        arrastre.elemento.classList.remove('imagen-en-arrastre');
        arrastre.contenedor.classList.remove('arrastrando');
        arrastre.destino?.classList.remove('imagen-destino-arrastre');
        if (!cambioOrden) return;

        arrastre.contenedor.classList.add('guardando-orden-imagenes');
        $.ajax({
            url: `/variacion-imagenes/ordenar/${arrastre.idVariacion}`,
            type: 'PUT',
            data: { ids, _token: csrf() },
            headers: { 'X-CSRF-TOKEN': csrf() },
            success: response => {
                if (!response.success) {
                    mostrarToast(response.mensaje || 'No se pudo guardar el orden de las imágenes.', 'danger');
                } else {
                    mostrarToast('Orden de imágenes actualizado.', 'success');
                }
            },
            error: xhr => mostrarError(xhr, 'Error al guardar el orden de las imágenes.'),
            complete: () => {
                arrastre.contenedor.classList.remove('guardando-orden-imagenes');
                recargarDatos().then(() => {
                    $tabla.find(`.verImagenesVariacion[data-id="${arrastre.idVariacion}"]`).trigger('click');
                });
            }
        });
    }

    function cancelarArrastreGaleria(arrastre) {
        arrastre.elemento.classList.remove('imagen-en-arrastre');
        arrastre.contenedor.classList.remove('arrastrando');
        arrastre.destino?.classList.remove('imagen-destino-arrastre');
        recargarDatos().then(() => {
            $tabla.find(`.verImagenesVariacion[data-id="${arrastre.idVariacion}"]`).trigger('click');
        });
    }

    $modalGaleriaImagenes.off('pointerdown.detalle', '.variacion-imagen-item')
        .on('pointerdown.detalle', '.variacion-imagen-item', function (event) {
            // Los botones de editar/eliminar siguen funcionando con clic normal.
            if (event.target.closest('button, a, input')) return;

            const pointer = event.originalEvent;
            if (pointer.pointerType === 'mouse' && pointer.button !== 0) return;

            const elemento = this;
            const contenedor = elemento.parentElement;

            arrastreImagenGaleria = {
                elemento,
                contenedor,
                idVariacion: Number($('#galeria_variacion_agregar').data('id')),
                pointerId: pointer.pointerId,
                destino: null,
                inicioX: pointer.clientX,
                activo: false,
                idsOriginales: Array.from(contenedor.querySelectorAll('.variacion-imagen-item'))
                    .map(item => Number(item.dataset.id))
            };
        });

    function elementoGaleriaEnPunto(x, y, excluir) {
        return (document.elementsFromPoint(x, y) || [])
            .map(nodo => nodo.closest?.('.variacion-imagen-item'))
            .find(item => item && item !== excluir) || null;
    }

    function moverArrastreGaleria(event) {
        if (!arrastreImagenGaleria || event.pointerId !== arrastreImagenGaleria.pointerId) return;

        const arrastre = arrastreImagenGaleria;
        const contenedor = arrastre.contenedor;

        // Se activa al mover 6px: un clic normal no arrastra nada.
        if (!arrastre.activo) {
            if (Math.abs(event.clientX - arrastre.inicioX) < 6) return;
            arrastre.activo = true;
            arrastre.elemento.classList.add('imagen-en-arrastre');
            arrastre.contenedor.classList.add('arrastrando');
        }

        // Desplazamiento automático al acercarse a los bordes.
        const rectContenedor = contenedor.getBoundingClientRect();
        if (event.clientX > rectContenedor.right - 60) contenedor.scrollLeft += 14;
        else if (event.clientX < rectContenedor.left + 60) contenedor.scrollLeft -= 14;

        const objetivo = elementoGaleriaEnPunto(event.clientX, event.clientY, arrastre.elemento);
        if (!objetivo || objetivo === arrastre.destino || objetivo.parentElement !== contenedor) return;

        const rectangulo = objetivo.getBoundingClientRect();
        const despues = event.clientX > rectangulo.left + rectangulo.width / 2;
        if ((despues && objetivo.nextElementSibling === arrastre.elemento) ||
            (!despues && objetivo.previousElementSibling === arrastre.elemento)) return;

        const elementos = Array.from(contenedor.querySelectorAll('.variacion-imagen-item'));
        const posiciones = new Map(elementos.map(elemento => [elemento, elemento.getBoundingClientRect()]));
        arrastre.destino?.classList.remove('imagen-destino-arrastre');
        contenedor.insertBefore(arrastre.elemento, despues ? objetivo.nextSibling : objetivo);
        objetivo.classList.add('imagen-destino-arrastre');
        arrastre.destino = objetivo;

        elementos.forEach(elemento => {
            if (elemento === arrastre.elemento) return;
            const posicionAnterior = posiciones.get(elemento);
            const desplazamiento = posicionAnterior.left - elemento.getBoundingClientRect().left;
            if (Math.abs(desplazamiento) < 1) return;

            elemento.animate([
                { transform: `translateX(${desplazamiento}px)` },
                { transform: 'translateX(0)' }
            ], {
                duration: 160,
                easing: 'cubic-bezier(.2,.75,.25,1)'
            });
        });

        event.preventDefault();
    }

    function finalizarArrastreGaleria(event) {
        if (!arrastreImagenGaleria || event.pointerId !== arrastreImagenGaleria.pointerId) return;

        const arrastre = arrastreImagenGaleria;
        arrastreImagenGaleria = null;

        if (!arrastre.activo) return; // fue un clic, no un arrastre

        guardarOrdenGaleria(arrastre);
    }

    function cancelarArrastrePorEvento(event) {
        if (!arrastreImagenGaleria || event.pointerId !== arrastreImagenGaleria.pointerId) return;

        const arrastre = arrastreImagenGaleria;
        arrastreImagenGaleria = null;

        if (arrastre.activo) cancelarArrastreGaleria(arrastre);
    }

    $(document)
        .off('.galeriaDrag')
        .on('pointermove.galeriaDrag', moverArrastreGaleria)
        .on('pointerup.galeriaDrag', finalizarArrastreGaleria)
        .on('pointercancel.galeriaDrag', cancelarArrastrePorEvento);

    // Agregar imágenes directo desde la galería (sin abrir otro modal).
    $('#galeria_variacion_agregar').off('click.detalle').on('click.detalle', function () {
        const input = document.getElementById('agregar_imagenes_variacion');
        input.dataset.idVariacion = $(this).data('id');
        input.value = '';
        input.click();
    });

    $('#agregar_imagenes_variacion').off('change.detalle').on('change.detalle', async function () {
        const archivos = Array.from(this.files || []);
        const idVariacion = this.dataset.idVariacion;
        if (!archivos.length || !idVariacion) return;

        const maximoBytes = 5 * 1024 * 1024;
        const invalido = archivos.find(archivo => !archivo.type.startsWith('image/') || archivo.size > maximoBytes);
        if (invalido) {
            this.value = '';
            return mostrarToast(`${invalido.name} no es una imagen válida o supera 5 MB.`, 'danger');
        }

        const $boton = $('#galeria_variacion_agregar');
        const textoOriginal = $boton.html();
        const imagenes = filas.find(fila => String(fila.id_variacion) === String(idVariacion))?.imagenes || [];
        const ordenes = imagenes.map(imagen => Number(imagen.orden)).filter(Number.isFinite);
        const ordenInicial = ordenes.length ? Math.max(...ordenes) + 1 : 1;

        let subidas = 0;
        $boton.prop('disabled', true);

        try {
            for (const [indice, archivo] of archivos.entries()) {
                $boton.html(`<i class="ph ph-spinner-gap"></i> Subiendo ${indice + 1}/${archivos.length}...`);

                const formData = new FormData();
                formData.append('id_variacion', idVariacion);
                formData.append('imagen', archivo);
                formData.append('orden', String(ordenInicial + indice));
                formData.append('_token', csrf());

                const response = await $.ajax({
                    url: '/variacion-imagenes/crear',
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    headers: { 'X-CSRF-TOKEN': csrf() }
                });

                if (!response.success) throw new Error(response.mensaje || 'No se pudo guardar la imagen.');
                subidas++;
            }

            mostrarToast(`${subidas} ${subidas === 1 ? 'imagen agregada' : 'imágenes agregadas'} correctamente.`, 'success');
        } catch (error) {
            mostrarToast(`Se agregaron ${subidas} de ${archivos.length} imágenes. ${error.responseJSON?.mensaje || error.message || 'Ocurrió un error al subir.'}`, 'warning');
        } finally {
            $boton.prop('disabled', false).html(textoOriginal);
            this.value = '';
            recargarDatos().then(() => {
                $tabla.find(`.verImagenesVariacion[data-id="${idVariacion}"]`).trigger('click');
            });
        }
    });

    // Rueda vertical → desplazamiento horizontal de la tira.
    $('#galeria_variacion_contenido').off('wheel.detalle').on('wheel.detalle', function (event) {
        if (this.scrollWidth <= this.clientWidth) return;
        const original = event.originalEvent;
        const delta = Math.abs(original.deltaY) > Math.abs(original.deltaX) ? original.deltaY : original.deltaX;
        this.scrollLeft += delta;
        event.preventDefault();
    });

    $modalGaleriaImagenes.off('click.detalle', '.reemplazarVariacionImagen').on('click.detalle', '.reemplazarVariacionImagen', function () {
        const input = document.getElementById('reemplazar_imagen_variacion');
        input.dataset.idImagen = $(this).data('id');
        input.dataset.idVariacion = $(this).data('variacion');
        input.value = '';
        input.click();
    });

    $('#reemplazar_imagen_variacion').off('change.detalle').on('change.detalle', function () {
        const input = this;
        const archivo = input.files?.[0];
        if (!archivo) return;

        if (!archivo.type.startsWith('image/') || archivo.size > 5 * 1024 * 1024) {
            input.value = '';
            return mostrarToast('Selecciona una imagen válida de máximo 5 MB.', 'danger');
        }

        const idImagen = input.dataset.idImagen;
        const idVariacion = input.dataset.idVariacion;
        const variacion = filas.find(item => String(item.id_variacion) === String(idVariacion));
        const imagen = variacion?.imagenes.find(item => String(item.id_imagen) === String(idImagen));
        if (!imagen) return mostrarToast('No se encontró la imagen que deseas reemplazar.', 'danger');

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('_token', csrf());
        formData.append('imagen', archivo);
        formData.append('orden', imagen.orden);

        $.ajax({
            url: `/variacion-imagenes/actualizar/${idImagen}`,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: { 'X-CSRF-TOKEN': csrf() },
            success: response => {
                if (!response.success) return mostrarToast(response.mensaje || 'No se pudo reemplazar la imagen.', 'danger');
                mostrarToast('Imagen reemplazada correctamente.', 'success');
                input.value = '';
                recargarDatos().then(() => {
                    $tabla.find(`.verImagenesVariacion[data-id="${idVariacion}"]`).trigger('click');
                });
            },
            error: xhr => mostrarError(xhr, 'Error al reemplazar la imagen.')
        });
    });

    function abrirModalAgregarImagen(idVariacion) {
        limpiarPreviewImagenCrear();
        $('#formCrearVariacionImagen')[0].reset();
        $('#crear_id_variacion').val(idVariacion);
        const imagenes = filas.find(fila => String(fila.id_variacion) === String(idVariacion))?.imagenes || [];
        const ordenes = imagenes.map(imagen => Number(imagen.orden)).filter(Number.isFinite);
        $('#crear_orden').val(ordenes.length ? Math.max(...ordenes) + 1 : 1);
        $('#crear_imagen').val('');
        bootstrap.Modal.getOrCreateInstance($modalCrearImagen[0]).show();
    }

    function limpiarPreviewImagenCrear() {
        previewImagenCrearUrls.forEach(url => URL.revokeObjectURL(url));
        previewImagenCrearUrls = [];
        $('#crear_preview_imagenes').empty();
    }

    $('#crear_imagen').off('change.detalle').on('change.detalle', function () {
        limpiarPreviewImagenCrear();
        Array.from(this.files || []).forEach(archivo => {
            if (!archivo.type.startsWith('image/')) return;

            const url = URL.createObjectURL(archivo);
            previewImagenCrearUrls.push(url);

            const $vistaPrevia = $('<div>', { class: 'text-center' });
            $vistaPrevia.append($('<img>', {
                src: url,
                alt: `Vista previa de ${archivo.name}`,
                class: 'img-thumbnail',
                css: { width: '96px', height: '96px', objectFit: 'cover' }
            }));
            $vistaPrevia.append($('<small>', {
                class: 'd-block text-muted text-truncate',
                text: archivo.name,
                css: { maxWidth: '96px' }
            }));
            $('#crear_preview_imagenes').append($vistaPrevia);
        });
    });

    $modalCrearImagen.off('hidden.bs.modal.preview').on('hidden.bs.modal.preview', limpiarPreviewImagenCrear);

    $tabla.off('click.detalle', '.agregarImagenVariacion').on('click.detalle', '.agregarImagenVariacion', function () {
        abrirModalAgregarImagen($(this).data('id'));
    });

    $('#formCrearVariacionImagen').off('submit.detalle').on('submit.detalle', async function (event) {
        event.preventDefault();
        const archivos = Array.from($('#crear_imagen')[0].files || []);
        const idVariacion = $('#crear_id_variacion').val();
        const ordenInicial = Number($('#crear_orden').val()) || 0;
        const maximoBytes = 5 * 1024 * 1024;

        if (!archivos.length) return mostrarToast('Selecciona al menos una imagen.', 'warning');

        const archivoInvalido = archivos.find(archivo => !archivo.type.startsWith('image/') || archivo.size > maximoBytes);
        if (archivoInvalido) {
            return mostrarToast(`${archivoInvalido.name} no es una imagen válida o supera 5 MB.`, 'danger');
        }

        const $botonGuardar = $(this).find('button[type="submit"]');
        const textoOriginal = $botonGuardar.text();
        let subidas = 0;
        $botonGuardar.prop('disabled', true);

        try {
            for (const [indice, archivo] of archivos.entries()) {
                $botonGuardar.text(`Subiendo ${indice + 1} de ${archivos.length}...`);

                const formData = new FormData();
                formData.append('id_variacion', idVariacion);
                formData.append('imagen', archivo);
                formData.append('orden', String(ordenInicial + indice));
                formData.append('_token', csrf());

                const response = await $.ajax({
                    url: '/variacion-imagenes/crear',
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    headers: { 'X-CSRF-TOKEN': csrf() }
                });

                if (!response.success) throw new Error(response.mensaje || 'No se pudo guardar la imagen.');
                subidas++;
            }

            mostrarToast(`${subidas} ${subidas === 1 ? 'imagen agregada' : 'imágenes agregadas'} correctamente.`, 'success');
            bootstrap.Modal.getOrCreateInstance($modalCrearImagen[0]).hide();
            $('#formCrearVariacionImagen')[0].reset();
            limpiarPreviewImagenCrear();
            recargarDatos();
        } catch (error) {
            if (subidas > 0) {
                mostrarToast(`Se agregaron ${subidas} de ${archivos.length} imágenes. ${error.responseJSON?.mensaje || error.message || 'Ocurrió un error al subir la siguiente imagen.'}`, 'warning');
                bootstrap.Modal.getOrCreateInstance($modalCrearImagen[0]).hide();
                $('#formCrearVariacionImagen')[0].reset();
                limpiarPreviewImagenCrear();
                recargarDatos();
            } else if (error.responseJSON) {
                mostrarError(error, 'Error al agregar imágenes.');
            } else {
                mostrarToast(error.message || 'Error al agregar imágenes.', 'danger');
            }
        } finally {
            $botonGuardar.prop('disabled', false).text(textoOriginal);
        }
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
        $('#crear_precio_compra_variacion').val(numeroCorto(variacion?.producto?.precio_compra));
        $('#crear_precio_venta_variacion').val(numeroCorto(variacion?.producto?.precio_venta));
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
            $('#editar_stock_variacion_talla').val(numeroCorto(response.variacion_talla.stock));
            $('#editar_sku_variacion').val(response.variacion_talla.sku);
            $('#editar_precio_compra_variacion').val(numeroCorto(response.variacion_talla.precio_compra ?? variacion?.producto?.precio_compra));
            $('#editar_precio_venta_variacion').val(numeroCorto(response.variacion_talla.precio_venta ?? variacion?.producto?.precio_venta));
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
                // El SKU no se envía: no es editable y el servidor lo regenera si cambia la talla.
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
