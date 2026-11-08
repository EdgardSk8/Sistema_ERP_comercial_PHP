export default function initPromociones() {
    const tabla = document.getElementById('tablaPromociones');
    if (!tabla) return;

    document.getElementById('titulo').textContent = 'PROMOCIONES';

    const tbody = tabla.querySelector('tbody');
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
    const modalElemento = document.getElementById('modalPromocion');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElemento);
    const modalImagenElemento = document.getElementById('modalImagenPromocion');
    const modalImagen = modalImagenElemento ? bootstrap.Modal.getOrCreateInstance(modalImagenElemento) : null;
    const imagenGrande = document.getElementById('imagenPromocionGrande');
    const tituloImagen = document.getElementById('tituloImagenPromocion');
    const form = document.getElementById('formPromocion');
    const tituloModal = document.getElementById('tituloModalPromocion');
    const inputId = document.getElementById('idPromocion');
    const productoInput = document.getElementById('promocionProducto');
    const productosContenedor = document.getElementById('promocionProductos');
    let productosPromocion = [];
    const fechaInicio = document.getElementById('promocionFechaInicio');
    const fechaFin = document.getElementById('promocionFechaFin');
    const tipoDescuentoSelect = document.getElementById('promocionTipoDescuento');
    const valorDescuentoInput = document.getElementById('promocionValorDescuento');
    const estadoInput = document.getElementById('promocionEstado');
    const precioFinalInput = document.getElementById('promocionPrecioFinalInput');
    let sincronizandoPrecioFinal = false;
    const badgePreview = document.getElementById('promocionBadgePreview');
    const precioCompraEl = document.getElementById('promocionPrecioCompra');
    const precioActualEl = document.getElementById('promocionPrecioActual');
    const descuentoTextoEl = document.getElementById('promocionDescuentoTexto');
    const precioFinalEl = document.getElementById('promocionPrecioFinal');
    const inputImagen = document.getElementById('promocionImagen');
    const preview = document.getElementById('promocionImagenPreview');
    const placeholder = document.getElementById('promocionImagenTexto');
    const btnGuardar = document.getElementById('btnGuardarPromocion');
    const errorForm = document.getElementById('errorFormPromocion');
    const errorPagina = document.getElementById('errorPromociones');
    const vacio = document.getElementById('promocionesVacio');

    const pickerInicio = window.FlatPickr ? window.FlatPickr(fechaInicio) : null;
    const pickerFin = window.FlatPickr ? window.FlatPickr(fechaFin) : null;

    const escapar = (valor) => $('<div>').text(valor ?? '').html();

    function primerError(datos) {
        const errores = datos?.errors;

        if (!errores) return datos?.mensaje || '';

        const primero = Object.values(errores)[0];

        return Array.isArray(primero) ? primero[0] : primero;
    }

    function aplicarFecha(picker, input, valor) {
        if (picker) {
            if (valor) {
                picker.setDate(valor, false);
            } else {
                picker.clear();
            }

            return;
        }

        input.value = valor || '';
    }

    function formatearFechaPromocion(fechaSQL) {
        if (!fechaSQL) return '';

        const texto = String(fechaSQL).trim();
        const fecha = /^\d{4}-\d{2}-\d{2}/.test(texto)
            ? new Date(`${texto.slice(0, 10)}T00:00:00`)
            : new Date(texto);

        if (isNaN(fecha.getTime())) return texto;

        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
            'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        return `${fecha.getDate().toString().padStart(2, '0')}/${meses[fecha.getMonth()]}/${fecha.getFullYear()}`;
    }

    function formatearDescuento(tipo, valor) {
        const numero = Number(valor) || 0;

        if (!tipo || numero <= 0) {
            return { texto: '', clase: '' };
        }

        if (tipo === 'porcentaje') {
            const pct = Math.round(numero * 100) / 100;
            return { texto: `${pct}% DESCUENTO`, clase: 'porcentaje' };
        }

        if (tipo === 'monto') {
            return { texto: `-${moneda(numero)}`, clase: 'monto' };
        }

        if (tipo === 'precio') {
            return { texto: `Ahora ${moneda(numero)}`, clase: 'precio' };
        }

        return { texto: '', clase: '' };
    }

    function actualizarDescuentoPreview() {
        const tipo = tipoDescuentoSelect.value;
        valorDescuentoInput.disabled = !tipo;
        precioFinalInput.disabled = !tipo;

        const descuento = formatearDescuento(tipo, valorDescuentoInput.value);

        badgePreview.textContent = descuento.texto;
        badgePreview.className = 'promociones-descuento-preview' +
            (descuento.clase ? ` promociones-descuento-preview--${descuento.clase}` : '');
        badgePreview.hidden = !descuento.texto;

        actualizarPreciosPromocion();
    }

    function actualizarPreciosPromocion() {
        const producto = productosPromocion.find(
            (item) => String(item.id_producto) === String(productoInput.value)
        );
        const compra = Number(producto?.precio_compra || 0);
        const venta = Number(producto?.precio_venta || 0);
        const tipo = tipoDescuentoSelect.value;
        const valor = Number(valorDescuentoInput.value) || 0;
        let final = venta;

        if (tipo === 'porcentaje' && valor > 0) {
            final = venta * (1 - valor / 100);
        } else if (tipo === 'monto' && valor > 0) {
            final = venta - valor;
        } else if (tipo === 'precio' && valor > 0) {
            final = valor;
        }

        final = Math.max(0, final);

        const descuento = formatearDescuento(tipo, valor);

        precioCompraEl.textContent = producto ? moneda(compra) : '—';
        precioActualEl.textContent = producto ? moneda(venta) : '—';
        descuentoTextoEl.textContent = descuento.texto || 'Sin descuento';
        precioFinalEl.textContent = producto ? moneda(final) : '—';

        if (!sincronizandoPrecioFinal) {
            precioFinalInput.value = (producto && tipo && valor > 0 && final > 0)
                ? String(Number(final.toFixed(6)))
                : '';
        }
    }

    function mostrarPreview(url) {
        if (url) {
            preview.src = url;
            preview.hidden = false;
            placeholder.hidden = true;
        } else {
            preview.src = '';
            preview.hidden = true;
            placeholder.hidden = false;
        }
    }

    function estadoPromocion(promocion) {
        if (!promocion.estado_promocion) {
            return { clase: 'inactiva', texto: 'Inactiva' };
        }

        const hoy = new Date().toISOString().slice(0, 10);
        const inicio = String(promocion.fecha_inicio_promocion || '').slice(0, 10);
        const fin = String(promocion.fecha_fin_promocion || '').slice(0, 10);

        if (fin && fin < hoy) {
            return { clase: 'vencida', texto: 'Vencida' };
        }

        if (inicio && inicio > hoy) {
            return { clase: 'programada', texto: 'Programada' };
        }

        return { clase: 'activa', texto: 'Activa' };
    }

    function diasRestantes(promocion) {
        const fin = promocion.fecha_fin_promocion
            ? String(promocion.fecha_fin_promocion).slice(0, 10)
            : null;

        if (!fin) return { clase: 'sin-fin', texto: 'Sin límite' };

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const fechaFin = new Date(`${fin}T00:00:00`);
        const dias = Math.ceil((fechaFin.getTime() - hoy.getTime()) / 86400000);

        if (dias < 0) return { clase: 'vencida', texto: 'Vencida' };
        if (dias === 0) return { clase: 'hoy', texto: 'Hoy' };

        return { clase: 'activa', texto: `${dias} día${dias === 1 ? '' : 's'}` };
    }

    function pintarProductos() {
        const categoria = document.getElementById('promocionFiltroCategoria').value;
        const texto = window.normalizarBusqueda(document.getElementById('promocionBuscarProducto').value);

        const filtrados = productosPromocion.filter((producto) => {
            const cumpleCategoria = !categoria || String(producto.nombre_categoria || '') === categoria;
            const cumpleTexto = !texto || window.normalizarBusqueda(producto.nombre_producto || '').includes(texto);

            return cumpleCategoria && cumpleTexto;
        });

        if (!filtrados.length) {
            productosContenedor.innerHTML = '<p class="text-secondary small mb-0 p-2">No hay productos que coincidan.</p>';
            return;
        }

        const activo = Number(productoInput.value) || 0;

        productosContenedor.innerHTML = filtrados.map((producto) => `
            <button type="button" class="promociones-producto-opcion"
                data-producto-id="${Number(producto.id_producto)}" role="option">
                ${producto.imagen_producto_url
                    ? `<img class="promociones-producto-opcion__img" src="${escapar(producto.imagen_producto_url)}" alt="${escapar(producto.nombre_producto)}" loading="lazy">`
                    : '<span class="promociones-producto-opcion__vacio"><i class="ph ph-image"></i></span>'}
                <span class="promociones-producto-opcion__info">
                    <strong>${escapar(producto.nombre_producto)}</strong>
                </span>
            </button>`).join('');

        productosContenedor.querySelectorAll('.promociones-producto-opcion').forEach((opcion) => {
            const esActivo = Number(opcion.dataset.productoId) === activo;
            opcion.classList.toggle('is-activo', esActivo);
            opcion.setAttribute('aria-selected', esActivo ? 'true' : 'false');
        });
    }

    async function cargarProductos() {
        try {
            const respuesta = await fetch('/promociones/productos', {
                headers: { Accept: 'application/json' },
            });
            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok || !datos.success) {
                throw new Error(primerError(datos) || 'No se pudieron cargar los productos.');
            }

            productosPromocion = datos.productos || [];

            const categorias = [...new Set(
                productosPromocion.map((producto) => producto.nombre_categoria).filter(Boolean)
            )].sort((a, b) => a.localeCompare(b));

            document.getElementById('promocionFiltroCategoria').innerHTML =
                '<option value="">Todas las categorías</option>'
                + categorias.map((categoria) => `<option value="${escapar(categoria)}">${escapar(categoria)}</option>`).join('');

            pintarProductos();
        } catch (fallo) {
            productosContenedor.innerHTML = `<p class="text-secondary small mb-0 p-2">${escapar(fallo.message || 'No se pudieron cargar los productos.')}</p>`;
        }
    }

    function seleccionarProducto(idProducto) {
        const id = Number(idProducto) || 0;
        productoInput.value = id ? String(id) : '';

        productosContenedor.querySelectorAll('.promociones-producto-opcion').forEach((opcion) => {
            const activo = Number(opcion.dataset.productoId) === id;
            opcion.classList.toggle('is-activo', activo);
            opcion.setAttribute('aria-selected', activo ? 'true' : 'false');
        });

        actualizarPreciosPromocion();
    }

    async function cargarPromociones() {
        errorPagina.classList.add('d-none');
        errorPagina.textContent = '';
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary py-4">Cargando promociones…</td></tr>';

        try {
            const respuesta = await fetch('/promociones/mostrar', {
                headers: { Accept: 'application/json' },
            });
            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok || !datos.success) {
                throw new Error(primerError(datos) || 'No se pudieron cargar las promociones.');
            }

            pintarTabla(datos.promociones || []);
        } catch (fallo) {
            tbody.replaceChildren();
            vacio.classList.add('d-none');
            errorPagina.classList.remove('d-none');
            errorPagina.textContent = fallo.message || 'Error al cargar las promociones.';
        }
    }

    function pintarTabla(promociones) {
        tbody.replaceChildren();

        if (!promociones.length) {
            vacio.classList.remove('d-none');
            return;
        }

        vacio.classList.add('d-none');

        promociones.forEach((promocion) => {
            const estado = estadoPromocion(promocion);
            const dias = diasRestantes(promocion);
            const imagen = promocion.imagen_promocion_url || promocion.imagen_producto_url;
            const descuento = formatearDescuento(
                promocion.tipo_descuento_promocion,
                promocion.valor_descuento_promocion
            );
            const imagenHtml = `
                <div class="promociones-imagen-wrap">
                    ${imagen
                        ? `<img class="promociones-thumb" src="${escapar(imagen)}" alt="${escapar(promocion.nombre_producto)}" loading="lazy" data-imagen="${escapar(imagen)}" data-nombre="${escapar(promocion.nombre_producto)}" title="Ver imagen en grande" role="button" tabindex="0">`
                        : '<span class="promociones-thumb--vacio"><i class="ph ph-image"></i></span>'}
                    ${descuento.texto
                        ? `<span class="promociones-descuento promociones-descuento--${descuento.clase}">${escapar(descuento.texto)}</span>`
                        : ''}
                </div>`;

            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${imagenHtml}</td>
                <td>
                    <div class="promociones-producto">
                        <strong>${escapar(promocion.nombre_producto)}</strong>
                    </div>
                </td>
                <td>
                    <div class="promociones-fechas">
                        ${formatearFechaPromocion(promocion.fecha_inicio_promocion)}
                    </div>
                </td>
                <td>
                    <div class="promociones-fechas">
                        ${promocion.fecha_fin_promocion
                            ? formatearFechaPromocion(promocion.fecha_fin_promocion)
                            : '<small>Sin fecha fin</small>'}
                    </div>
                </td>
                <td>
                    <div class="promociones-dias ${dias.clase}">${dias.texto}</div>
                </td>
                <td>
                    <span class="promociones-badge promociones-badge--${estado.clase}">
                        ${estado.texto}
                    </span>
                </td>
                <td class="text-center">
                    <div class="promociones-acciones">
                        <button type="button" class="btn-editar" data-editar="${Number(promocion.id_promocion)}"
                            title="Editar promoción" aria-label="Editar promoción">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        <button type="button" class="estado ${promocion.estado_promocion ? 'estado-activo' : 'estado-inactivo'}"
                            data-estado="${Number(promocion.id_promocion)}"
                            title="${promocion.estado_promocion ? 'Desactivar' : 'Activar'}"
                            aria-label="${promocion.estado_promocion ? 'Desactivar' : 'Activar'}">
                            <i class="ph ${promocion.estado_promocion ? 'ph-eye' : 'ph-eye-slash'}"></i>
                        </button>
                    </div>
                </td>`;

            tbody.append(fila);
        });
    }

    async function abrirEdicion(id) {
        try {
            const respuesta = await fetch(`/promociones/${id}/editar`, {
                headers: { Accept: 'application/json' },
            });
            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok || !datos.success) {
                throw new Error(primerError(datos) || 'No se pudo cargar la promoción.');
            }

            const promocion = datos.promocion;

            inputId.value = promocion.id_promocion;
            estadoInput.checked = Boolean(promocion.estado_promocion);
            seleccionarProducto(promocion.id_producto);
            tipoDescuentoSelect.value = promocion.tipo_descuento_promocion || '';
            valorDescuentoInput.value = promocion.valor_descuento_promocion || '';
            actualizarDescuentoPreview();
            aplicarFecha(pickerInicio, fechaInicio, promocion.fecha_inicio_promocion);
            aplicarFecha(pickerFin, fechaFin, promocion.fecha_fin_promocion);
            mostrarPreview(promocion.imagen_promocion_url);
            inputImagen.value = '';
            errorForm.textContent = '';
            tituloModal.textContent = 'Editar promoción';
            modal.show();
        } catch (fallo) {
            mostrarToast(fallo.message || 'No se pudo cargar la promoción.', 'danger');
        }
    }

    tipoDescuentoSelect.addEventListener('change', actualizarDescuentoPreview);
    valorDescuentoInput.addEventListener('input', actualizarDescuentoPreview);

    precioFinalInput.addEventListener('input', () => {
        const producto = productosPromocion.find(
            (item) => String(item.id_producto) === String(productoInput.value)
        );
        const venta = Number(producto?.precio_venta || 0);
        const final = Number(precioFinalInput.value) || 0;

        if (venta <= 0 || final <= 0 || final >= venta) return;

        const porcentaje = ((venta - final) / venta) * 100;

        sincronizandoPrecioFinal = true;
        tipoDescuentoSelect.value = 'porcentaje';
        valorDescuentoInput.value = String(Number(porcentaje.toFixed(6)));
        actualizarDescuentoPreview();
        sincronizandoPrecioFinal = false;
    });

    productosContenedor.addEventListener('click', (evento) => {
        const opcion = evento.target.closest('[data-producto-id]');
        if (!opcion) return;

        seleccionarProducto(opcion.dataset.productoId);
    });

    document.getElementById('promocionFiltroCategoria').addEventListener('change', pintarProductos);
    document.getElementById('promocionBuscarProducto').addEventListener('input', pintarProductos);

    document.getElementById('btnNuevaPromocion').addEventListener('click', () => {
        form.reset();
        inputId.value = '';
        estadoInput.checked = true;
        seleccionarProducto(null);
        tipoDescuentoSelect.value = '';
        valorDescuentoInput.value = '';
        actualizarDescuentoPreview();
        aplicarFecha(pickerInicio, fechaInicio, null);
        aplicarFecha(pickerFin, fechaFin, null);
        mostrarPreview(null);
        inputImagen.value = '';
        errorForm.textContent = '';
        tituloModal.textContent = 'Nueva promoción';
        modal.show();
    });

    inputImagen.addEventListener('change', () => {
        const archivo = inputImagen.files[0];

        if (!archivo) {
            mostrarPreview(preview.dataset.actual || null);
            return;
        }

        const url = URL.createObjectURL(archivo);
        mostrarPreview(url);
    });

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        errorForm.textContent = '';
        const id = inputId.value;
        const datos = new FormData();

        if (!productoInput.value) {
            errorForm.textContent = 'Selecciona un producto.';
            return;
        }

        datos.append('id_producto', productoInput.value);
        datos.append('fecha_inicio_promocion', fechaInicio.value);
        datos.append('fecha_fin_promocion', fechaFin.value || '');
        datos.append('tipo_descuento_promocion', tipoDescuentoSelect.value);
        datos.append('valor_descuento_promocion', tipoDescuentoSelect.value ? (valorDescuentoInput.value || '0') : '');
        datos.append('estado_promocion', estadoInput.checked ? '1' : '0');

        if (inputImagen.files[0]) {
            datos.append('imagen_promocion', inputImagen.files[0]);
        }

        if (id) {
            datos.append('_method', 'PUT');
        }

        const textoBoton = btnGuardar.innerHTML;
        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando…';

        try {
            const respuesta = await fetch(id ? `/promociones/${id}/actualizar` : '/promociones/crear', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: datos,
            });
            const resultado = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok || !resultado.success) {
                throw new Error(primerError(resultado) || 'No se pudo guardar la promoción.');
            }

            modal.hide();
            mostrarToast(resultado.mensaje || 'Promoción guardada.', 'success');
            await cargarPromociones();
        } catch (fallo) {
            errorForm.textContent = fallo.message || 'No se pudo guardar la promoción.';
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = textoBoton;
        }
    });

    tbody.addEventListener('click', async (evento) => {
        const editar = evento.target.closest('[data-editar]');

        if (editar) {
            abrirEdicion(Number(editar.dataset.editar));
            return;
        }

        const imagenBoton = evento.target.closest('[data-imagen]');
        if (imagenBoton) {
            if (imagenGrande) imagenGrande.src = imagenBoton.dataset.imagen;
            if (tituloImagen) tituloImagen.textContent = imagenBoton.dataset.nombre || 'Imagen de la promoción';
            if (modalImagen) modalImagen.show();
            return;
        }

        const estado = evento.target.closest('[data-estado]');
        if (!estado) return;

        estado.disabled = true;

        try {
            const respuesta = await fetch(`/promociones/cambiar-estado/${estado.dataset.estado}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
            });
            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok || !datos.success) {
                throw new Error(primerError(datos) || 'No se pudo cambiar el estado.');
            }

            mostrarToast(datos.mensaje || 'Estado actualizado.', 'success');
            await cargarPromociones();
        } catch (fallo) {
            estado.disabled = false;
            mostrarToast(fallo.message || 'No se pudo cambiar el estado.', 'danger');
        }
    });

    tbody.addEventListener('keydown', (evento) => {
        if (evento.key !== 'Enter' && evento.key !== ' ') return;

        const imagenBoton = evento.target.closest('[data-imagen]');
        if (!imagenBoton) return;

        evento.preventDefault();
        imagenBoton.click();
    });

    cargarProductos();
    cargarPromociones();
}
