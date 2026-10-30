/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Catálogo                                            ║
   ╚══════════════════════════════════════════════════════════════╝ */

const API_PRODUCTOS = '/tienda/api/productos';
const IMAGEN_FALLBACK = '/tienda/recursos/img/producto.png';
const TALLAS_REFERENCIA = '/tienda/recursos/data/tallas.json';

window.favoritosTienda = new Set();

window.marcarFavoritosTienda = function marcarFavoritosTienda() {
    document.querySelectorAll('.btn-favorito[data-producto]').forEach((boton) => {
        const activo = window.favoritosTienda.has(String(boton.dataset.producto));

        boton.classList.toggle('is-activo', activo);
        boton.setAttribute('aria-label', activo ? 'Quitar de favoritos' : 'Agregar a favoritos');

        const icono = boton.querySelector('i');
        if (icono) icono.className = activo ? 'bi bi-heart-fill' : 'bi bi-heart';
    });
};

const COLORES = {
    negro: '#22252A',
    blanco: '#FFFFFF',
    crudo: '#F1E9D8',
    crema: '#F3ECDD',
    beige: '#E2D5B9',
    arena: '#E6DBC4',
    gris: '#9AA0A6',
    azul: '#2F5D8A',
    celeste: '#8FB8D9',
    rojo: '#C0392B',
    vino: '#7B2231',
    verde: '#3E7C59',
    oliva: '#7C7A45',
    amarillo: '#E3B23C',
    mostaza: '#C9971E',
    naranja: '#E07B39',
    rosa: '#E4A3B8',
    rosado: '#E4A3B8',
    morado: '#6C4A8F',
    violeta: '#7A5AA6',
    cafe: '#7A5230',
    marron: '#7A5230',
    dorado: '#C9A227',
    plateado: '#C0C4C8',
    turquesa: '#3AAFA9',
    caqui: '#A89A6B',
};

function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function colorHex(nombre) {
    const clave = normalizar(nombre);
    if (COLORES[clave]) return COLORES[clave];

    // "Celeste con Negro" → toma el primer color conocido del texto
    const palabra = clave.split(/\s+/).find(parte => COLORES[parte]);
    if (palabra) return COLORES[palabra];

    // Tono estable para colores no mapeados
    let hash = 0;
    for (let i = 0; i < clave.length; i++) {
        hash = clave.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 45%, 62%)`;
}

function moneda(valor) {
    return 'C$ ' + Number(valor || 0).toLocaleString('es-NI', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function escapar(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ── Calificación compacta (estrellas + opiniones) ───────────── */
function estrellasTarjeta(calificacion) {
    const total = Number(calificacion?.total || 0);
    if (total <= 0) return '';

    const promedio = Math.max(0, Math.min(5, Number(calificacion?.promedio) || 0));
    const icono = '<i class="bi bi-star-fill"></i>';
    const capas = `<span class="estrellas__capa estrellas__capa--fondo" aria-hidden="true">${icono.repeat(5)}</span>`
        + `<span class="estrellas__capa estrellas__capa--relleno" aria-hidden="true">${icono.repeat(5)}</span>`;

    return `
        <div class="card-producto__rating">
            <span class="estrellas estrellas--xs" style="--pct:${(promedio / 5) * 100}%" role="img"
                  aria-label="${promedio.toFixed(1)} de 5 estrellas">${capas}</span>
            <span class="card-producto__rating-num">${promedio.toFixed(1)}</span>
            <span class="card-producto__rating-total">(${total})</span>
        </div>`;
}

/* ── Render de tarjeta ───────────────────────────────────────── */
function tarjetaProducto(variante, indice = 0) {
    const agotado = Number(variante.stock || 0) <= 0;
    const enlace = `/producto?p=${encodeURIComponent(variante.id)}&color=${encodeURIComponent(variante.color || '')}`;

    return `
        <a class="card-producto" href="${escapar(enlace)}" style="--i:${indice}">
            <div class="card-producto__media">
                <img src="${escapar(variante.imagen || IMAGEN_FALLBACK)}" alt="${escapar(variante.nombre)}" loading="lazy"
                     onerror="this.src='${IMAGEN_FALLBACK}'">
                ${agotado ? '<span class="badge-agotado">Agotado</span>' : ''}
                <button class="btn-favorito" type="button" data-producto="${variante.id}" aria-label="Agregar a favoritos">
                    <i class="bi bi-heart"></i>
                </button>
            </div>
            <div class="card-producto__info">
                <h3 class="card-producto__nombre">${escapar(variante.nombre)}</h3>
                ${estrellasTarjeta(variante.calificacion)}
                <span class="card-producto__categoria">${escapar(variante.categoria)}</span>
                <span class="card-producto__color">${escapar(variante.color || 'Único')}</span>
                <div class="card-producto__precios">
                    <span class="precio">${moneda(variante.precio)}</span>
                </div>
            </div>
        </a>
    `;
}

/* Cada color del producto es una tarjeta independiente */
function desagruparPorColor(productos) {
    return productos.flatMap(producto => {
        const colores = producto.colores?.length
            ? producto.colores
            : [{ nombre: 'Único', imagen: producto.imagen, stock: producto.stock }];

        return colores.map(color => ({
            ...producto,
            color: color.nombre,
            imagen: color.imagen || producto.imagen,
            stock: color.stock ?? producto.stock,
            tallas: color.tallas || producto.tallas || [],
        }));
    });
}

/* ── Catálogo ────────────────────────────────────────────────── */
function iniciarCatalogo(productos, tallasReferencia) {
    const grid = document.getElementById('catalogoGrid');
    const contador = document.getElementById('catalogoContador');
    let animacionCatalogo = null;
    const catGrid = document.getElementById('catGrid');
    const buscador = document.getElementById('buscadorProductos');

    const variantes = desagruparPorColor(productos);
    const categorias = [...new Set(variantes.map(variante => variante.categoria).filter(Boolean))];

    let categoriaActual = '';

    /* ── Filtro por rango de precio (slider doble) ────────────── */
    const LIMITE_MIN = 100;
    const LIMITE_MAX = 2000;

    const precioMinInput = document.getElementById('precioMin');
    const precioMaxInput = document.getElementById('precioMax');
    const sliderRango = document.getElementById('sliderRango');
    const etiquetaMin = document.getElementById('precioMinEtiqueta');
    const etiquetaMax = document.getElementById('precioMaxEtiqueta');
    const filtrosCaja = document.getElementById('filtrosCatalogo');
    const filtrosResumen = document.getElementById('filtrosResumen');
    const filtrosAyuda = document.getElementById('filtrosAyuda');

    /* ── Filtro por talla (Select2, 36 a 44) ──────────────────── */
    const TALLAS_FILTRO = Array.from({ length: 9 }, (_, indice) => String(36 + indice));
    const selectTallas = document.getElementById('filtroTallas');
    let tallasSeleccionadas = [];

    const tallasCatalogo = new Set(
        variantes.flatMap(variante => (variante.tallas || []).map(talla => String(talla)))
    );

    const cmDeTalla = (talla) => {
        const ref = tallasReferencia?.tallas?.find(t => Number(t.eu) === Number(talla));
        return ref ? `${ref.cm} cm` : '';
    };

    if (selectTallas) {
        selectTallas.innerHTML = TALLAS_FILTRO.map(talla => {
            const disponible = tallasCatalogo.has(talla);
            const cm = cmDeTalla(talla);
            const detalle = disponible
                ? (cm ? ` · ${cm}` : '')
                : ` · ${cm ? `${cm} · ` : ''}sin productos`;
            return `<option value="${talla}"${disponible ? '' : ' disabled'}>${talla}${detalle}</option>`;
        }).join('');

        if (window.jQuery && window.jQuery.fn.select2) {
            window.jQuery(selectTallas).select2({
                placeholder: 'Todas las tallas',
                width: '100%',
                closeOnSelect: false,
                allowClear: true,
            });
        }
    }

    const leerTallas = () => selectTallas
        ? Array.from(selectTallas.selectedOptions).map(opcion => opcion.value)
        : [];

    let precioMin = null;
    let precioMax = null;

    const preciosCatalogo = variantes
        .map(variante => Number(variante.precio) || 0)
        .filter(precio => precio > 0);

    if (filtrosAyuda && preciosCatalogo.length) {
        filtrosAyuda.textContent = `Precios disponibles: ${moneda(Math.min(...preciosCatalogo))} a ${moneda(Math.max(...preciosCatalogo))}`;
    }

    const valorMin = () => Number(precioMinInput ? precioMinInput.value : LIMITE_MIN);
    const valorMax = () => Number(precioMaxInput ? precioMaxInput.value : LIMITE_MAX);
    const porcentaje = (valor) => ((valor - LIMITE_MIN) / (LIMITE_MAX - LIMITE_MIN)) * 100;

    const pintarSlider = () => {
        const min = valorMin();
        const max = valorMax();

        if (etiquetaMin) etiquetaMin.textContent = moneda(min);
        if (etiquetaMax) etiquetaMax.textContent = moneda(max);

        if (sliderRango) {
            sliderRango.style.left = `${porcentaje(min)}%`;
            sliderRango.style.width = `${porcentaje(max) - porcentaje(min)}%`;
        }
    };

    const actualizarResumen = () => {
        if (!filtrosResumen) return;

        const partes = [];

        if (precioMin !== null && precioMax !== null) {
            partes.push(`${moneda(precioMin)} – ${moneda(precioMax)}`);
        } else if (precioMin !== null) {
            partes.push(`Desde ${moneda(precioMin)}`);
        } else if (precioMax !== null) {
            partes.push(`Hasta ${moneda(precioMax)}`);
        }

        if (tallasSeleccionadas.length) {
            partes.push(`Tallas ${tallasSeleccionadas.join(', ')}`);
        }

        filtrosResumen.hidden = !partes.length;
        filtrosResumen.textContent = partes.join(' · ');
    };

    const aplicarRango = () => {
        const min = valorMin();
        const max = valorMax();

        // Los extremos del slider son "sin filtro".
        precioMin = min > LIMITE_MIN ? min : null;
        precioMax = max < LIMITE_MAX ? max : null;

        actualizarResumen();
        pintar();
    };

    // Círculos de categoría (con "Todos" para quitar el filtro y "Favoritos"
    // cuando el cliente tiene productos guardados).
    const CATEGORIA_FAVORITOS = '__favoritos__';

    const pintarCategorias = () => {
        if (!catGrid) return;

        const opciones = [
            { nombre: 'Todos', valor: '', icono: 'bi bi-grid' },
            { nombre: 'Favoritos', valor: CATEGORIA_FAVORITOS, icono: 'bi bi-heart-fill' },
        ].concat(categorias.map(categoria => ({
            nombre: categoria,
            valor: categoria,
            icono: typeof window.iconoCategoria === 'function' ? window.iconoCategoria(categoria) : 'bi bi-tag'
        })));

        catGrid.innerHTML = opciones.map(opcion => `
            <button class="cat-item${opcion.valor === categoriaActual ? ' cat-item--activo' : ''}" type="button" data-categoria="${escapar(opcion.valor)}">
                <span class="cat-item__circulo"><i class="${opcion.icono}"></i></span>
                ${escapar(opcion.nombre)}
            </button>
        `).join('');
    };

    pintarCategorias();

    const pintar = (animar = false) => {
        const termino = normalizar(buscador ? buscador.value : '');

        const lista = variantes.filter(variante => {
            const coincideCategoria = !categoriaActual
                || (categoriaActual === CATEGORIA_FAVORITOS
                    ? Boolean(window.favoritosTienda?.has(String(variante.id)))
                    : variante.categoria === categoriaActual);
            const coincideTexto = !termino || normalizar(variante.nombre).includes(termino);
            const precio = Number(variante.precio) || 0;
            const coincidePrecio = (precioMin === null || precio >= precioMin)
                && (precioMax === null || precio <= precioMax);
            const coincideTalla = !tallasSeleccionadas.length
                || (variante.tallas || []).some(talla => tallasSeleccionadas.includes(String(talla)));

            return coincideCategoria && coincideTexto && coincidePrecio && coincideTalla;
        });

        const hayFiltro = Boolean(termino) || precioMin !== null || precioMax !== null
            || tallasSeleccionadas.length > 0;

        const sinFavoritos = categoriaActual === CATEGORIA_FAVORITOS && !window.favoritosTienda?.size;

        const mensajeVacio = sinFavoritos
            ? 'No tienes productos favoritos agregados.'
            : hayFiltro
                ? 'No hay productos que coincidan con la búsqueda o el filtro.'
                : 'No hay productos en esta categoría.';

        grid.classList.remove('catalogo-animando');

        if (animar) {
            void grid.offsetWidth;
            grid.classList.add('catalogo-animando');
        }

        grid.innerHTML = lista.length
            ? lista.map(tarjetaProducto).join('')
            : `<p class="catalogo-vacio">${mensajeVacio}</p>`;

        clearTimeout(animacionCatalogo);

        if (animar) {
            animacionCatalogo = window.setTimeout(() => {
                grid.classList.remove('catalogo-animando');
            }, 1200);
        }

        window.marcarFavoritosTienda();

        if (contador) {
            contador.textContent = `${lista.length} ${lista.length === 1 ? 'producto' : 'productos'}`;
        }
    };

    buscador?.addEventListener('input', () => pintar());

    /* ── Eventos del slider de precio ─────────────────────────── */
    precioMinInput?.addEventListener('input', () => {
        // Los pulgares no se cruzan.
        if (valorMin() > valorMax()) precioMinInput.value = precioMaxInput.value;
        pintarSlider();
    });

    precioMaxInput?.addEventListener('input', () => {
        if (valorMax() < valorMin()) precioMaxInput.value = precioMinInput.value;
        pintarSlider();
    });

    document.getElementById('btnAplicarFiltros')?.addEventListener('click', () => {
        aplicarRango();

        // Se cierra el desplegable para ver los resultados (el rango queda en el botón).
        if (filtrosCaja) filtrosCaja.open = false;
    });

    document.getElementById('btnLimpiarFiltros')?.addEventListener('click', () => {
        if (precioMinInput) precioMinInput.value = String(LIMITE_MIN);
        if (precioMaxInput) precioMaxInput.value = String(LIMITE_MAX);
        pintarSlider();
        aplicarRango();

        // Limpia las tallas seleccionadas.
        if (selectTallas) {
            if (window.jQuery && window.jQuery.fn.select2) {
                window.jQuery(selectTallas).val(null).trigger('change');
            } else {
                Array.from(selectTallas.options).forEach(opcion => { opcion.selected = false; });
            }
        }

        tallasSeleccionadas = [];
        actualizarResumen();
        pintar();
    });

    /* Cambio de tallas: se aplica al instante y actualiza el resumen. */
    if (selectTallas) {
        const alCambiarTallas = () => {
            tallasSeleccionadas = leerTallas();
            actualizarResumen();
            pintar();
        };

        if (window.jQuery && window.jQuery.fn.select2) {
            window.jQuery(selectTallas).on('change', alCambiarTallas);
        } else {
            selectTallas.addEventListener('change', alCambiarTallas);
        }
    }

    pintarSlider();

    const marcarActivo = (categoria) => {
        catGrid?.querySelectorAll('.cat-item').forEach(item => {
            item.classList.toggle('cat-item--activo', item.dataset.categoria === categoria);
        });
    };

    catGrid?.addEventListener('click', (event) => {
        const boton = event.target.closest('[data-categoria]');
        if (!boton) return;

        categoriaActual = boton.dataset.categoria || '';
        marcarActivo(categoriaActual);
        pintar(true);

        if (window.innerWidth < 992) {
            document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // Permite refrescar las categorías cuando cambian los favoritos.
    window.refrescarCatalogo = () => {
        pintarCategorias();
        pintar();
    };

    // Cambio de favoritos: sin repintar todo el grid (evita parpadeos).
    window.actualizarFavoritosCatalogo = () => {
        pintarCategorias();

        // Solo se repinta la lista si el filtro activo es "Favoritos".
        if (categoriaActual === CATEGORIA_FAVORITOS) pintar();
    };

    pintar();
}

async function cargarTallasReferencia() {
    try {
        const respuesta = await fetch(TALLAS_REFERENCIA, { headers: { Accept: 'application/json' } });
        if (!respuesta.ok) return null;

        return await respuesta.json();
    } catch (error) {
        console.warn('No se pudo cargar la referencia de tallas', error);
        return null;
    }
}

async function cargarCatalogo() {
    const grid = document.getElementById('catalogoGrid');

    try {
        const respuesta = await fetch(API_PRODUCTOS, { headers: { Accept: 'application/json' } });
        if (!respuesta.ok) throw new Error('No se pudo cargar el catálogo.');

        const data = await respuesta.json();
        const productos = data.productos || [];

        if (!productos.length) {
            if (grid) grid.innerHTML = '<p class="catalogo-vacio">Todavía no hay productos publicados.</p>';
            return;
        }

        const tallasReferencia = await cargarTallasReferencia();
        iniciarCatalogo(productos, tallasReferencia);
    } catch (error) {
        if (grid) grid.innerHTML = '<p class="catalogo-vacio">No se pudo cargar el catálogo. Intenta más tarde.</p>';
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // La marca funciona como "Inicio": vuelve arriba con desplazamiento suave.
    document.querySelector('.app-header .marca')?.addEventListener('click', (event) => {
        if (location.pathname !== urlTienda()) return; // en otras páginas navega normal

        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    cargarCatalogo();

    window.sesionTiendaPromise.then(async (sesion) => {
        if (!sesion?.autenticado) return;

        try {
            const datos = await window.TiendaAPI.get('/tienda/api/favoritos');
            window.favoritosTienda = new Set(
                (datos.favoritos || []).map((favorito) => String(favorito.id_producto))
            );
            window.marcarFavoritosTienda();
            window.refrescarCatalogo?.();
        } catch (error) {
            console.error('No se pudieron cargar los favoritos.', error);
        }
    });
});

document.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('.btn-favorito');
    if (!boton) return;

    evento.preventDefault();
    evento.stopPropagation();

    const idProducto = boton.dataset.producto;
    if (!idProducto) return;

    const sesion = await window.sesionTiendaPromise;

    if (!sesion?.autenticado) {
        tiendaToast('Inicia sesión para guardar tus favoritos.', 'aviso');
        window.location.href = `${urlTienda('perfil')}#perfil`;
        return;
    }

    const activo = window.favoritosTienda.has(String(idProducto));

    // Cambio visual inmediato (optimista) para evitar saltos al confirmar.
    if (activo) {
        window.favoritosTienda.delete(String(idProducto));
    } else {
        window.favoritosTienda.add(String(idProducto));
    }

    window.marcarFavoritosTienda();

    boton.classList.remove('is-pulsado');
    void boton.offsetWidth;
    boton.classList.add('is-pulsado');

    try {
        if (activo) {
            await window.TiendaAPI.delete(`/tienda/api/favoritos/${idProducto}`);
        } else {
            await window.TiendaAPI.post('/tienda/api/favoritos', { id_producto: Number(idProducto) });
        }

        window.actualizarFavoritosCatalogo?.();
    } catch (error) {
        // Revierte el cambio visual si el backend rechazó la acción.
        if (activo) {
            window.favoritosTienda.add(String(idProducto));
        } else {
            window.favoritosTienda.delete(String(idProducto));
        }

        window.marcarFavoritosTienda();
        window.actualizarFavoritosCatalogo?.();

        tiendaToast(
            error?.message || (activo
                ? 'No se pudo quitar de favoritos.'
                : 'No se pudo agregar a favoritos.'),
            'aviso'
        );
    }
});
