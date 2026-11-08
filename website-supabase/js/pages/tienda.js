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

    // "Celeste con Negro" → toma el primer color conocido del texto.
    // También acepta plurales ("Negros" → "negro").
    const palabra = clave.split(/\s+/).find(parte => COLORES[parte] || COLORES[parte.replace(/s$/, '')]);
    if (palabra) return COLORES[palabra] || COLORES[palabra.replace(/s$/, '')];

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

/* Promoción del producto: mismas reglas de texto que las tarjetas de promos. */
function textoPromocion(promocion) {
    const valor = Number(promocion?.valor) || 0;
    if (!promocion || valor <= 0) return '';

    if (promocion.tipo === 'porcentaje') return `${Math.round(valor)}% DESCUENTO`;
    if (promocion.tipo === 'monto') return `-C$ ${valor.toFixed(2)}`;
    if (promocion.tipo === 'precio') return `Ahora C$ ${valor.toFixed(2)}`;

    return '';
}

function precioConPromocion(precioBase, promocion) {
    const base = Number(precioBase) || 0;
    const valor = Number(promocion?.valor) || 0;
    if (!promocion || base <= 0 || valor <= 0) return base;

    if (promocion.tipo === 'porcentaje') return Math.max(0, Math.round(base * (1 - valor / 100) * 100) / 100);
    if (promocion.tipo === 'monto') return Math.max(0, base - valor);
    if (promocion.tipo === 'precio') return valor;

    return base;
}

/* Producto con una promoción real del ERP (no cuenta el 10% de bienvenida). */
function productoEnDescuento(variante) {
    const base = Number(variante?.precio) || 0;
    const promocion = variante?.promocion;

    return Boolean(promocion) && base > 0 && precioConPromocion(base, promocion) < base;
}

function tarjetaProducto(variante, indice = 0) {
    const agotado = Number(variante.stock || 0) <= 0;
    const enlace = `/producto?p=${encodeURIComponent(variante.id)}&color=${encodeURIComponent(variante.color || '')}`;
    const precioBase = Number(variante.precio) || 0;

    /* La promoción del producto manda sobre el 10% de bienvenida. */
    const promocion = variante.promocion || null;
    const precioPromocion = precioConPromocion(precioBase, promocion);
    const selloPromocion = precioPromocion < precioBase ? textoPromocion(promocion) : '';

    const descuento = window.descuentoClienteActivo?.(variante.categoria);
    const precioFinal = selloPromocion
        ? precioPromocion
        : (window.precioConDescuento?.(precioBase, variante.categoria) ?? precioBase);
    const tieneDescuento = Boolean(descuento && precioFinal < precioBase);
    const precioRebajado = precioFinal < precioBase;
    const srcset = window.srcsetImagen?.(variante.imagen) || '';

    return `
        <a class="card-producto" href="${escapar(enlace)}" style="--i:${indice}">
            <div class="card-producto__media">
                <img src="${escapar(variante.imagen || IMAGEN_FALLBACK)}" alt="${escapar(variante.nombre)}"
                     ${srcset ? `srcset="${escapar(srcset)}" sizes="(min-width: 992px) 25vw, (min-width: 560px) 33vw, 50vw"` : ''}
                     loading="lazy" fetchpriority="low" decoding="async"
                     onerror="if(!this.dataset.original){this.dataset.original='1';this.removeAttribute('srcset');this.src='${escapar(variante.imagen || IMAGEN_FALLBACK)}';}else{this.src='${IMAGEN_FALLBACK}';}">
                ${agotado ? '<span class="badge-agotado">Agotado</span>' : ''}
                ${!agotado && selloPromocion ? `<span class="badge-promocion">${escapar(selloPromocion)}</span>` : ''}
                ${!agotado && !selloPromocion && tieneDescuento ? `<span class="badge-descuento">${escapar(descuento.etiqueta)} ${descuento.primera_compra ? 'bienvenida' : 'descuento'}</span>` : ''}
                <button class="btn-favorito" type="button" data-producto="${variante.id}" aria-label="Agregar a favoritos">
                    <i class="bi bi-heart"></i>
                </button>
            </div>
            <div class="card-producto__info">
                <h3 class="card-producto__nombre">${escapar(variante.nombre)}</h3>
                ${variante.marca ? `<span class="card-producto__marca">${escapar(variante.marca)}</span>` : ''}
                ${estrellasTarjeta(variante.calificacion)}
                <div class="card-producto__meta">
                    <span class="card-producto__categoria">${escapar(variante.categoria)}</span>
                    <span class="card-producto__color">
                        <span class="dot" style="--tono:${colorHex(variante.color || 'Único')}" aria-hidden="true"></span>
                        ${escapar(variante.color || 'Único')}
                    </span>
                </div>
                <div class="card-producto__precios">
                    <span class="card-producto__precio-grupo">
                        ${precioRebajado
                            ? `<span class="precio precio--antes">${moneda(precioBase)}</span>
                               <span class="precio precio--dto">${moneda(precioFinal)}</span>`
                            : `<span class="precio">${moneda(precioBase)}</span>`}
                    </span>
                    ${agotado ? '' : `
                    <button type="button" class="card-producto__agregar"
                        data-agregar-carrito data-producto="${variante.id}"
                        data-color="${escapar(variante.color || '')}"
                        aria-label="Agregar ${escapar(variante.nombre)} al carrito"
                        aria-haspopup="dialog" aria-expanded="false"
                        title="Agregar al carrito">
                        <i class="bi bi-bag-plus" aria-hidden="true"></i>
                        <span class="card-producto__agregar-texto">Agregar</span>
                    </button>`}
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

    /* Categorías especiales: no existen como categoría en el ERP. */
    const CATEGORIA_FAVORITOS = '__favoritos__';
    const CATEGORIA_DESEOS = '__deseos__';
    const CATEGORIA_DESCUENTOS = '__descuentos__';

    const variantes = desagruparPorColor(productos);
    const categorias = [...new Set(variantes.map(variante => variante.categoria).filter(Boolean))];

    /* Solo se muestra "Descuentos" si hay promociones reales del ERP. */
    const hayDescuentos = variantes.some(productoEnDescuento);

    /* "Zapatos Segunda Mano" siempre al final de la lista de categorías */
    categorias.sort((a, b) => Number(normalizar(a).includes('segunda mano'))
        - Number(normalizar(b).includes('segunda mano')));

    /* Enlace directo al catálogo ya filtrado: index?categoria=Zapatos */
    const categoriaDesdeUrl = new URLSearchParams(window.location.search).get('categoria');
    const aliasDescuentos = ['descuentos', 'en descuento', 'en descuentos', 'ofertas'];
    let categoriaActual = '';

    if (categoriaDesdeUrl) {
        const buscada = normalizar(categoriaDesdeUrl);

        categoriaActual = aliasDescuentos.includes(buscada)
            ? CATEGORIA_DESCUENTOS
            : (categorias.find(categoria => normalizar(categoria) === buscada) || '');
    }

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

    /* ── Abrir/cerrar filtros (animación 0.5 s) ───────────────── */
    let filtrosCerrando = false;

    const cerrarFiltros = () => {
        if (!filtrosCaja?.open || filtrosCerrando) return;

        const panel = filtrosCaja.querySelector('.filtros__cortina');
        const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!panel || sinMovimiento) {
            filtrosCaja.open = false;
            return;
        }

        filtrosCerrando = true;
        filtrosCaja.classList.add('filtros--cerrando');

        const terminar = () => {
            filtrosCaja.classList.remove('filtros--cerrando');
            filtrosCaja.open = false;
            filtrosCerrando = false;
        };

        panel.addEventListener('animationend', terminar, { once: true });
        window.setTimeout(terminar, 600);
    };

    document.getElementById('btnCerrarFiltros')?.addEventListener('click', cerrarFiltros);

    filtrosCaja?.addEventListener('toggle', () => {
        const abierto = Boolean(filtrosCaja.open);
        document.documentElement.classList.toggle('filtros-abiertos', abierto);
        document.body.classList.toggle('filtros-abiertos', abierto);

        if (abierto) {
            void cargarSelect2();

            if (window.matchMedia('(max-width: 991.98px)').matches) {
                window.setTimeout(() => document.getElementById('btnCerrarFiltros')?.focus(), 60);
            }
        }
    });

    /* Anticipa la librería al pasar el puntero o enfocar el botón de filtros. */
    const botonFiltros = filtrosCaja?.querySelector('.filtros__boton');
    botonFiltros?.addEventListener('pointerenter', () => { void cargarSelect2(); }, { once: true });
    botonFiltros?.addEventListener('focus', () => { void cargarSelect2(); }, { once: true });

    filtrosCaja?.querySelector('.filtros__cortina')?.addEventListener('click', (evento) => {
        if (evento.target !== evento.currentTarget) return;
        if (!window.matchMedia('(max-width: 991.98px)').matches) return;

        cerrarFiltros();
    });

    filtrosCaja?.querySelector('.filtros__boton')?.addEventListener('click', (evento) => {
        if (!filtrosCaja.open) return;

        evento.preventDefault();
        cerrarFiltros();
    });

    document.addEventListener('click', (evento) => {
        if (!filtrosCaja?.open) return;

        /* composedPath() conserva la ruta original aunque Select2 ya haya quitado el nodo (ej. la ×) */
        const ruta = typeof evento.composedPath === 'function' ? evento.composedPath() : [];

        if (ruta.includes(filtrosCaja) || filtrosCaja.contains(evento.target)) return;

        /* El desplegable y los chips de Select2 pueden vivir fuera del panel: no deben cerrarlo */
        const enSelect2 = ruta.some(nodo => nodo instanceof Element
            && nodo.matches?.('.select2-container, .select2-dropdown'))
            || evento.target.closest?.('.select2-container, .select2-dropdown');

        if (enSelect2) return;

        cerrarFiltros();
    });

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape') cerrarFiltros();
    });

    /* ── Filtro por talla (Select2, 36 a 44) ──────────────────── */
    const TALLAS_FILTRO = Array.from({ length: 9 }, (_, indice) => String(36 + indice));
    const selectTallas = document.getElementById('filtroTallas');
    let tallasSeleccionadas = [];
    /* Cambio pendiente hasta pulsar "Aplicar filtro". */
    let tallasPendientes = null;

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
                closeOnSelect: true,
                allowClear: true,
            });
        }
    }

    const leerTallas = () => selectTallas
        ? Array.from(selectTallas.selectedOptions).map(opcion => opcion.value)
        : [];

    /* ── Filtro por color (Select2 con buscador) ──────────────── */
    const selectColores = document.getElementById('filtroColores');
    let coloresSeleccionados = [];
    /* Cambio pendiente hasta pulsar "Aplicar filtro". */
    let coloresPendientes = null;

    const coloresCatalogo = [...new Set(
        variantes.map(variante => String(variante.color || 'Único').trim()).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'es'));

    if (selectColores) {
        selectColores.innerHTML = coloresCatalogo
            .map(color => `<option value="${escapar(color)}">${escapar(color)}</option>`)
            .join('');

        if (window.jQuery && window.jQuery.fn.select2) {
            window.jQuery(selectColores).select2({
                placeholder: 'Todos los colores',
                width: '100%',
                closeOnSelect: true,
                allowClear: true,
            });
        }
    }

    const leerColores = () => selectColores
        ? Array.from(selectColores.selectedOptions).map(opcion => opcion.value)
        : [];

    /* ── Filtro por marca (Select2 con buscador) ──────────────── */
    const selectMarcas = document.getElementById('filtroMarcas');
    let marcasSeleccionadas = [];
    let marcasPendientes = null;

    const marcasCatalogo = [...new Set(
        variantes.map(variante => String(variante.marca || '').trim()).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'es'));

    if (selectMarcas) {
        selectMarcas.innerHTML = marcasCatalogo
            .map(marca => `<option value="${escapar(marca)}">${escapar(marca)}</option>`)
            .join('');

        if (window.jQuery && window.jQuery.fn.select2) {
            window.jQuery(selectMarcas).select2({
                placeholder: 'Todas las marcas',
                width: '100%',
                closeOnSelect: true,
                allowClear: true,
            });
        }
    }

    const leerMarcas = () => selectMarcas
        ? Array.from(selectMarcas.selectedOptions).map(opcion => opcion.value)
        : [];

    /* ── Filtros por atributo (Género, Tipo, ...) ─────────────── */
    const contenedorAtributos = document.getElementById('filtrosAtributos');
    const contenedorTipo = document.getElementById('filtroTipo');
    const contenedoresAtributos = [contenedorAtributos, contenedorTipo].filter(Boolean);

    /* { 'Género': ['Hombre'], 'Tipo': ['Zapatilla'] } */
    let atributosSeleccionados = {};
    let atributosPendientes = null;

    const atributosCatalogo = new Map();

    variantes.forEach(variante => {
        (variante.atributos || []).forEach(atributo => {
            if (!atributo?.atributo || !atributo?.valor) return;

            if (!atributosCatalogo.has(atributo.atributo)) {
                atributosCatalogo.set(atributo.atributo, new Set());
            }

            atributosCatalogo.get(atributo.atributo).add(atributo.valor);
        });
    });

    const nombreAtributo = (texto) => `atributo_${normalizar(texto).replace(/[^a-z0-9]+/g, '_')}`;

    /* Con pocos valores un botón es más rápido que abrir un selector. */
    const MAX_VALORES_CHIPS = 3;

    if (contenedoresAtributos.length) {
        [...atributosCatalogo.entries()]
            .sort((a, b) => a[0].localeCompare(b[0], 'es'))
            .forEach(([nombre, valores]) => {

                const lista = [...valores].sort((a, b) => a.localeCompare(b, 'es'));
                const bloque = document.createElement('div');

                bloque.className = 'filtros__atributo';

                if (lista.length <= MAX_VALORES_CHIPS) {

                    bloque.innerHTML = `
                        <span class="filtros__atributo__nombre">${escapar(nombre)}</span>
                        <div class="filtros__chips" data-atributo="${escapar(nombre)}"
                             role="group" aria-label="Filtrar por ${escapar(nombre)}">
                            ${lista.map(valor => `
                                <button type="button" class="filtros__chip" data-valor="${escapar(valor)}"
                                        aria-pressed="false">${escapar(valor)}</button>
                            `).join('')}
                        </div>
                    `;
                } else {

                    const id = nombreAtributo(nombre);

                    bloque.innerHTML = `
                        <label class="filtros__atributo__nombre" for="${id}">${escapar(nombre)}</label>
                        <select id="${id}" class="filtros__atributo__select" multiple="multiple"
                                data-atributo="${escapar(nombre)}" aria-label="Filtrar por ${escapar(nombre)}">
                            ${lista.map(valor => `<option value="${escapar(valor)}">${escapar(valor)}</option>`).join('')}
                        </select>
                    `;
                }

                const destino = normalizar(nombre) === 'tipo' && contenedorTipo
                    ? contenedorTipo
                    : contenedorAtributos;

                destino?.appendChild(bloque);
            });

        if (contenedorTipo && !contenedorTipo.children.length) {
            contenedorTipo.closest('.filtros__col')?.setAttribute('hidden', '');
        }

        if (window.jQuery && window.jQuery.fn.select2) {
            window.jQuery(contenedoresAtributos).find('select').select2({
                placeholder: 'Todos',
                width: '100%',
                closeOnSelect: true,
                allowClear: true,
            });
        }
    }

    const leerAtributos = () => {
        const elegidos = {};

        contenedoresAtributos.forEach(contenedor => {
            contenedor.querySelectorAll('select[data-atributo]').forEach(select => {
                const valores = Array.from(select.selectedOptions).map(opcion => opcion.value);

                if (valores.length) elegidos[select.dataset.atributo] = valores;
            });

            contenedor.querySelectorAll('.filtros__chips[data-atributo]').forEach(grupo => {
                const activo = grupo.querySelector('.filtros__chip[aria-pressed="true"]');

                if (activo) elegidos[grupo.dataset.atributo] = [activo.dataset.valor];
            });
        });

        return elegidos;
    };

    let precioMin = null;
    let precioMax = null;

    const preciosCatalogo = variantes
        .map(variante => Number(variante.precio) || 0)
        .filter(precio => precio > 0);

    if (filtrosAyuda && preciosCatalogo.length) {
        filtrosAyuda.textContent = `Disponibles: ${moneda(Math.min(...preciosCatalogo))} – ${moneda(Math.max(...preciosCatalogo))}`;
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

        if (coloresSeleccionados.length) {
            partes.push(`Colores ${coloresSeleccionados.join(', ')}`);
        }

        if (marcasSeleccionadas.length) {
            partes.push(`Marcas ${marcasSeleccionadas.join(', ')}`);
        }

        Object.entries(atributosSeleccionados).forEach(([nombre, valores]) => {
            partes.push(`${nombre} ${valores.join(', ')}`);
        });

        filtrosResumen.hidden = !partes.length;
        filtrosResumen.textContent = partes.join(' · ');
    };

    const aplicarRango = () => {
        /* Las tallas elegidas se confirman aquí, no al seleccionarlas. */
        if (tallasPendientes !== null) {
            tallasSeleccionadas = tallasPendientes;
            tallasPendientes = null;
        }

        /* Igual con los colores. */
        if (coloresPendientes !== null) {
            coloresSeleccionados = coloresPendientes;
            coloresPendientes = null;
        }

        if (marcasPendientes !== null) {
            marcasSeleccionadas = marcasPendientes;
            marcasPendientes = null;
        }

        if (atributosPendientes !== null) {
            atributosSeleccionados = atributosPendientes;
            atributosPendientes = null;
        }

        const min = valorMin();
        const max = valorMax();

        // Los extremos del slider son "sin filtro".
        precioMin = min > LIMITE_MIN ? min : null;
        precioMax = max < LIMITE_MAX ? max : null;

        actualizarResumen();
        pintar(true);
    };

    // "Favoritos" y "Lista de Deseos" solo se pintan si hay sesión y datos.
    let deseosCatalogo = new Set();
    let deseosCatalogoCargados = false;
    let deseosAutenticado = false;

    async function cargarDeseosCatalogo() {
        if (deseosCatalogoCargados) return;

        try {
            if (window.cargarSupabase) await window.cargarSupabase();

            const sesion = await window.sesionTiendaPromise;
            deseosAutenticado = Boolean(sesion?.autenticado);

            if (!deseosAutenticado) {
                deseosCatalogo = new Set();
                return;
            }

            const datos = await window.TiendaAPI.get('/tienda/api/deseos');
            deseosCatalogo = new Set(
                (datos?.deseos || []).map((deseo) => String(deseo.id_producto))
            );
        } catch (error) {
            deseosCatalogo = new Set();
        } finally {
            deseosCatalogoCargados = true;
        }
    }

    const ICONO_PORCENTAJE = '<svg class="cat-item__icono" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false"><path d="M205.66,61.64l-144,144a8,8,0,0,1-11.32-11.32l144-144a8,8,0,0,1,11.32,11.31ZM50.54,101.44a36,36,0,0,1,50.92-50.91h0a36,36,0,0,1-50.92,50.91ZM56,76A20,20,0,1,0,90.14,61.84h0A20,20,0,0,0,56,76ZM216,180a36,36,0,1,1-10.54-25.46h0A35.76,35.76,0,0,1,216,180Zm-16,0a20,20,0,1,0-5.86,14.14A19.87,19.87,0,0,0,200,180Z"/></svg>';

    const pintarCategorias = () => {
        if (!catGrid) return;

        const opciones = [
            { nombre: 'Todos', valor: '', icono: '<i class="bi bi-grid" aria-hidden="true"></i>' },
            ...(hayDescuentos
                ? [{ nombre: 'Descuentos', valor: CATEGORIA_DESCUENTOS, icono: ICONO_PORCENTAJE }]
                : []),
            { nombre: 'Favoritos', valor: CATEGORIA_FAVORITOS, icono: '<i class="bi bi-heart-fill" aria-hidden="true"></i>' },
            { nombre: 'Lista de Deseos', valor: CATEGORIA_DESEOS, icono: '<i class="bi bi-star" aria-hidden="true"></i>' },
        ].concat(categorias.map(categoria => ({
            nombre: categoria,
            valor: categoria,
            icono: typeof window.iconoCategoria === 'function'
                ? window.iconoCategoria(categoria)
                : '<i class="bi bi-tag" aria-hidden="true"></i>'
        })));

        catGrid.innerHTML = opciones.map(opcion => `
            <button class="cat-item${opcion.valor === categoriaActual ? ' cat-item--activo' : ''}" type="button" data-categoria="${escapar(opcion.valor)}">
                <span class="cat-item__circulo">${opcion.icono}</span>
                ${escapar(opcion.nombre)}
            </button>
        `).join('');
    };

    pintarCategorias();

    const pintar = (animar = false) => {
        const termino = normalizar(buscador ? buscador.value : '');

        const hayFiltro = Boolean(termino) || precioMin !== null || precioMax !== null
            || tallasSeleccionadas.length > 0 || coloresSeleccionados.length > 0
            || marcasSeleccionadas.length > 0 || Object.keys(atributosSeleccionados).length > 0;

        /* Sin filtros ni categoría se ocultan los agotados; al filtrar se muestran, siempre al final */
        const mostrarAgotados = hayFiltro || Boolean(categoriaActual);

        const lista = variantes.filter(variante => {
            const coincideCategoria = !categoriaActual
                || (categoriaActual === CATEGORIA_FAVORITOS
                    ? Boolean(window.favoritosTienda?.has(String(variante.id)))
                    : categoriaActual === CATEGORIA_DESEOS
                        ? deseosCatalogo.has(String(variante.id))
                        : categoriaActual === CATEGORIA_DESCUENTOS
                            ? productoEnDescuento(variante)
                            : variante.categoria === categoriaActual);
            const coincideTexto = !termino || normalizar(variante.nombre).includes(termino);
            const precio = Number(variante.precio) || 0;
            const coincidePrecio = (precioMin === null || precio >= precioMin)
                && (precioMax === null || precio <= precioMax);
            const coincideTalla = !tallasSeleccionadas.length
                || (variante.tallas || []).some(talla => tallasSeleccionadas.includes(String(talla)));
            const coincideColor = !coloresSeleccionados.length
                || coloresSeleccionados.includes(String(variante.color || 'Único').trim());
            const coincideMarca = !marcasSeleccionadas.length
                || marcasSeleccionadas.includes(String(variante.marca || '').trim());
            const coincideAtributos = Object.entries(atributosSeleccionados).every(([nombre, valores]) => {
                const atributo = (variante.atributos || []).find(item => item?.atributo === nombre);

                return Boolean(atributo) && valores.includes(String(atributo.valor));
            });

            if (!(coincideCategoria && coincideTexto && coincidePrecio && coincideTalla && coincideColor
                && coincideMarca && coincideAtributos)) return false;

            return mostrarAgotados || Number(variante.stock) > 0;
        });

        /* "Zapatos Segunda Mano" siempre al fondo del catálogo. */
        const esSegundaMano = (variante) => normalizar(variante.categoria || '').includes('segunda mano');

        lista.sort((a, b) => {
            const segundaA = esSegundaMano(a) ? 1 : 0;
            const segundaB = esSegundaMano(b) ? 1 : 0;

            if (segundaA !== segundaB) return segundaA - segundaB;

            // Dentro de cada grupo, los agotados van al final (cuando se muestran).
            if (mostrarAgotados) {
                const agotadoA = Number(a.stock) > 0 ? 0 : 1;
                const agotadoB = Number(b.stock) > 0 ? 0 : 1;

                if (agotadoA !== agotadoB) return agotadoA - agotadoB;
            }

            return 0;
        });

        const sinFavoritos = categoriaActual === CATEGORIA_FAVORITOS && !window.favoritosTienda?.size;
        const sinDeseos = categoriaActual === CATEGORIA_DESEOS && !deseosCatalogo.size;
        const sinDescuentos = categoriaActual === CATEGORIA_DESCUENTOS && !hayDescuentos;

        const mensajeVacio = sinFavoritos
            ? 'No tienes productos favoritos agregados.'
            : sinDeseos
                ? (deseosAutenticado
                    ? 'No tienes productos en tu lista de deseos.'
                    : 'Inicia sesión para ver tu lista de deseos.')
                : sinDescuentos
                    ? 'No hay productos en descuento por ahora.'
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

    /* El buscador espera a que dejes de escribir: evita re-renderizar en cada tecla */
    let temporizadorBusqueda = 0;

    buscador?.addEventListener('input', () => {
        window.clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = window.setTimeout(() => pintar(), 250);
    });

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
        cerrarFiltros();
    });

    document.getElementById('btnLimpiarFiltros')?.addEventListener('click', () => {
        if (precioMinInput) precioMinInput.value = String(LIMITE_MIN);
        if (precioMaxInput) precioMaxInput.value = String(LIMITE_MAX);
        pintarSlider();

        // Limpia las tallas seleccionadas (y las pendientes).
        if (selectTallas) {
            if (window.jQuery && window.jQuery.fn.select2) {
                window.jQuery(selectTallas).val(null).trigger('change');
            } else {
                Array.from(selectTallas.options).forEach(opcion => { opcion.selected = false; });
            }
        }

        tallasSeleccionadas = [];
        tallasPendientes = null;

        // Limpia los colores seleccionados (y los pendientes).
        if (selectColores) {
            if (window.jQuery && window.jQuery.fn.select2) {
                window.jQuery(selectColores).val(null).trigger('change');
            } else {
                Array.from(selectColores.options).forEach(opcion => { opcion.selected = false; });
            }
        }

        coloresSeleccionados = [];
        coloresPendientes = null;

        // Limpia las marcas seleccionadas (y las pendientes).
        if (selectMarcas) {
            if (window.jQuery && window.jQuery.fn.select2) {
                window.jQuery(selectMarcas).val(null).trigger('change');
            } else {
                Array.from(selectMarcas.options).forEach(opcion => { opcion.selected = false; });
            }
        }

        marcasSeleccionadas = [];
        marcasPendientes = null;

        // Limpia los atributos seleccionados (y los pendientes).
        contenedoresAtributos.forEach(contenedor => {
            contenedor.querySelectorAll('select[data-atributo]').forEach(select => {
                if (window.jQuery && window.jQuery.fn.select2) {
                    window.jQuery(select).val(null).trigger('change');
                } else {
                    Array.from(select.options).forEach(opcion => { opcion.selected = false; });
                }
            });

            contenedor.querySelectorAll('.filtros__chips .filtros__chip').forEach(chip => {
                chip.setAttribute('aria-pressed', 'false');
            });
        });

        atributosSeleccionados = {};
        atributosPendientes = null;

        aplicarRango();
    });

    /* Los cambios quedan pendientes hasta pulsar "Aplicar filtro". */
    const alCambiarTallas = () => {
        tallasPendientes = leerTallas();
    };

    const alCambiarColores = () => {
        coloresPendientes = leerColores();
    };

    const alCambiarMarcas = () => {
        marcasPendientes = leerMarcas();
    };

    const alCambiarAtributos = () => {
        atributosPendientes = leerAtributos();
    };

    selectTallas?.addEventListener('change', alCambiarTallas);
    selectColores?.addEventListener('change', alCambiarColores);
    selectMarcas?.addEventListener('change', alCambiarMarcas);

    contenedoresAtributos.forEach((contenedor) => {
        contenedor.addEventListener('change', alCambiarAtributos);

        /* Los atributos con pocos valores son botones: uno solo activo a la vez. */
        contenedor.addEventListener('click', (evento) => {

            const chip = evento.target.closest('.filtros__chip');

            if (!chip) return;

            const grupo = chip.closest('.filtros__chips');
            const yaActivo = chip.getAttribute('aria-pressed') === 'true';

            grupo.querySelectorAll('.filtros__chip').forEach(boton => boton.setAttribute('aria-pressed', 'false'));

            if (!yaActivo) chip.setAttribute('aria-pressed', 'true');

            alCambiarAtributos();
        });
    });

    /* ╔══════════════════════════════════════════════════════════╗
       ║  jQuery + Select2 a demanda                              ║
       ║  Solo se descargan al abrir o anticipar los filtros.     ║
       ╚══════════════════════════════════════════════════════════╝ */
    const JQUERY_URL = 'https://code.jquery.com/jquery-3.7.1.min.js';
    const SELECT2_CSS_URL = 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css';
    const SELECT2_JS_URL = 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js';
    let select2Cargando = null;
    let select2Inicializado = false;

    function cargarCss(href) {
        return new Promise((resolver) => {
            const enlace = document.createElement('link');
            enlace.rel = 'stylesheet';
            enlace.href = href;
            enlace.onload = resolver;
            enlace.onerror = resolver;
            document.head.appendChild(enlace);
        });
    }

    function cargarScript(src) {
        return new Promise((resolver, rechazar) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolver;
            script.onerror = rechazar;
            document.head.appendChild(script);
        });
    }

    function inicializarSelect2() {
        const $ = window.jQuery;
        if (!$?.fn?.select2 || select2Inicializado) return;

        select2Inicializado = true;

        const opciones = (placeholder) => ({
            placeholder,
            width: '100%',
            closeOnSelect: true,
            allowClear: true,
        });

        const aplicar = (select, placeholder) => {
            if (!select || $(select).data('select2')) return;
            $(select).select2(opciones(placeholder));
        };

        aplicar(selectTallas, 'Todas las tallas');
        aplicar(selectColores, 'Todos los colores');
        aplicar(selectMarcas, 'Todas las marcas');

        contenedoresAtributos.forEach((contenedor) => {
            $(contenedor).find('select[data-atributo]').each((_, select) => aplicar(select, 'Todos'));
        });

        /* Select2 dispara el change por jQuery; los selects nativos ya tienen su listener. */
        $(selectTallas).on('change.filtros', alCambiarTallas);
        $(selectColores).on('change.filtros', alCambiarColores);
        $(selectMarcas).on('change.filtros', alCambiarMarcas);
        $(contenedoresAtributos).on('change.filtros', 'select[data-atributo]', alCambiarAtributos);
    }

    function cargarSelect2() {
        if (window.jQuery?.fn?.select2) {
            inicializarSelect2();
            return Promise.resolve();
        }

        if (select2Cargando) return select2Cargando;

        select2Cargando = (async () => {
            try {
                const cssListo = cargarCss(SELECT2_CSS_URL);
                await cargarScript(JQUERY_URL);
                await cargarScript(SELECT2_JS_URL);
                await cssListo;
                inicializarSelect2();
            } catch (error) {
                console.warn('No se pudo cargar Select2; se usan los selects nativos.', error);
            }
        })();

        return select2Cargando;
    }

    if (window.jQuery?.fn?.select2) inicializarSelect2();

    pintarSlider();

    const marcarActivo = (categoria) => {
        catGrid?.querySelectorAll('.cat-item').forEach(item => {
            item.classList.toggle('cat-item--activo', item.dataset.categoria === categoria);
        });
    };

    catGrid?.addEventListener('click', async (event) => {
        const boton = event.target.closest('[data-categoria]');
        if (!boton) return;

        categoriaActual = boton.dataset.categoria || '';

        if (categoriaActual === CATEGORIA_DESEOS) {
            await cargarDeseosCatalogo();
        }

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

    /* Si se llegó desde un enlace con ?categoria=, baja al catálogo filtrado. */
    if (categoriaActual) {
        const catalogo = document.getElementById('catalogo');

        if (catalogo) {
            const irAlCatalogo = () => catalogo.scrollIntoView({ behavior: 'smooth', block: 'start' });
            let reajustando = true;
            const observador = new ResizeObserver(() => {
                if (reajustando) irAlCatalogo();
            });
            const detener = () => {
                reajustando = false;
                observador.disconnect();
            };

            /* Promos e imágenes cargan después y empujan el catálogo: se reajusta. */
            observador.observe(document.body);
            irAlCatalogo();

            /* Si la persona se desplaza por su cuenta, se deja de reajustar. */
            ['wheel', 'touchstart', 'keydown'].forEach((evento) => {
                window.addEventListener(evento, detener, { once: true, passive: true });
            });

            window.setTimeout(detener, 3000);
        }
    }
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

async function productosDesdeSupabase(config) {
    const respuesta = await fetch(`${config.url}/rest/v1/rpc/web_productos`, {
        method: 'POST',
        headers: {
            apikey: config.key,
            Authorization: `Bearer ${config.key}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: '{}',
    });

    if (!respuesta.ok) throw new Error('No se pudo cargar el catálogo.');

    return await respuesta.json();
}

async function cargarProductos() {
    const config = window.SUPABASE_CONFIG;
    const esLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

    /* En Cloudflare no hay Laravel: se evita el 404 y se lee directo de Supabase. */
    if (!esLocal && config?.url && config?.key) {
        try {
            return { productos: await productosDesdeSupabase(config) };
        } catch (error) {
            console.warn('No se pudo cargar el catálogo directo de Supabase.', error);
        }
    }

    const respuesta = await fetch(API_PRODUCTOS, { headers: { Accept: 'application/json' } });

    if (respuesta.ok) return await respuesta.json();

    if (respuesta.status === 404 && config?.url && config?.key) {
        return { productos: await productosDesdeSupabase(config) };
    }

    throw new Error('No se pudo cargar el catálogo.');
}

async function cargarCatalogo() {
    const grid = document.getElementById('catalogoGrid');

    try {
        const data = await cargarProductos();
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

/* ╔════════════ Agregar al carrito desde la tarjeta ════════════╗ */

let quickAddActual = null;
let quickAddSolicitud = 0;

async function cargarDetalleProducto(id) {
    const respuesta = await fetch(`/tienda/api/productos/${encodeURIComponent(id)}`, {
        headers: { Accept: 'application/json' },
    });
    const data = await respuesta.json().catch(() => null);

    if (!respuesta.ok || !data?.success || !data.producto) {
        throw new Error(data?.mensaje || 'No se pudo cargar el producto.');
    }

    return data.producto;
}

function cerrarQuickAdd(restaurarFoco = true) {
    if (!quickAddActual) return;

    const { popover, boton, alDesplazar, alRedimensionar, temporizadorScroll } = quickAddActual;
    quickAddSolicitud += 1;
    popover?.remove();
    boton?.setAttribute('aria-expanded', 'false');

    window.clearTimeout(temporizadorScroll);
    if (alDesplazar) window.removeEventListener('scroll', alDesplazar);
    if (alRedimensionar) window.removeEventListener('resize', alRedimensionar);

    quickAddActual = null;

    if (restaurarFoco && boton?.isConnected) {
        boton.focus({ preventScroll: true });
    }
}

function posicionarQuickAdd() {
    if (!quickAddActual) return;

    const { popover, boton } = quickAddActual;
    if (!popover || !boton) return;

    const r = boton.getBoundingClientRect();
    const p = popover.getBoundingClientRect();
    const margen = 8;

    let left = r.left + r.width / 2 - p.width / 2;
    left = Math.max(margen, Math.min(left, window.innerWidth - p.width - margen));

    let top = r.bottom + margen;
    if (top + p.height > window.innerHeight - margen) {
        top = Math.max(margen, r.top - p.height - margen);
    }

    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
}

function crearQuickAdd() {
    const popover = document.createElement('div');
    popover.className = 'quick-add';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', 'Elegir talla');

    const cabecera = document.createElement('div');
    cabecera.className = 'quick-add__cabecera';

    const titulo = document.createElement('p');
    titulo.className = 'quick-add__titulo';
    titulo.textContent = 'Elige tu talla';

    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'quick-add__cerrar';
    cerrar.setAttribute('aria-label', 'Cerrar');
    cerrar.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
    cerrar.addEventListener('click', () => cerrarQuickAdd());

    cabecera.append(titulo, cerrar);

    const contenido = document.createElement('div');
    contenido.className = 'quick-add__contenido';
    contenido.innerHTML = '<p class="quick-add__vacio">Cargando tallas…</p>';

    popover.append(cabecera, contenido);

    return { popover, contenido };
}

function agregarDesdeQuickAdd(producto, variacion, talla) {
    if (!talla || Number(talla.stock) <= 0) {
        tiendaToast('Esa talla está agotada.', 'aviso');
        return;
    }

    Carrito.agregar({
        productoId: producto.id,
        nombre: producto.nombre,
        variacionId: variacion.id,
        color: variacion.color,
        tallaId: talla.id,
        talla: talla.nombre,
        precio: talla.precio ?? producto.precio,
        categoria: producto.categoria,
        imagen: variacion.imagenes?.[0] || producto.imagen,
        stock: talla.stock,
    }, 1);

    tiendaToast(`Agregado al carrito · Talla ${talla.nombre}`, 'exito');
    cerrarQuickAdd();
}

async function abrirQuickAdd(boton) {
    if (quickAddActual?.boton === boton) {
        cerrarQuickAdd();
        return;
    }

    cerrarQuickAdd(false);

    const { popover, contenido } = crearQuickAdd();
    let scrollListo = false;
    const temporizadorScroll = window.setTimeout(() => { scrollListo = true; }, 180);
    const alDesplazar = () => { if (scrollListo) cerrarQuickAdd(false); };
    const alRedimensionar = () => cerrarQuickAdd(false);

    quickAddActual = {
        popover,
        contenido,
        boton,
        alDesplazar,
        alRedimensionar,
        temporizadorScroll,
        solicitud: ++quickAddSolicitud,
    };

    const solicitud = quickAddActual.solicitud;

    boton.setAttribute('aria-expanded', 'true');
    document.body.appendChild(popover);
    window.addEventListener('scroll', alDesplazar, { passive: true, once: true });
    window.addEventListener('resize', alRedimensionar);
    posicionarQuickAdd();

    try {
        const producto = await cargarDetalleProducto(boton.dataset.producto);
        if (!quickAddActual || quickAddActual.solicitud !== solicitud) return;

        const color = boton.dataset.color || '';
        const variacion = (producto.variaciones || []).find(
            (item) => normalizar(item.color) === normalizar(color)
        ) || (producto.variaciones || [])[0];

        if (!variacion) {
            contenido.innerHTML = '<p class="quick-add__vacio">Este producto no tiene colores disponibles.</p>';
            posicionarQuickAdd();
            return;
        }

        const tallas = (variacion.tallas || []).filter((talla) => Number(talla.stock) > 0);

        if (!tallas.length) {
            contenido.innerHTML = '<p class="quick-add__vacio">No hay tallas disponibles para este color.</p>';
            posicionarQuickAdd();
            return;
        }

        if (tallas.length === 1) {
            agregarDesdeQuickAdd(producto, variacion, tallas[0]);
            return;
        }

        contenido.innerHTML = '';

        const lista = document.createElement('div');
        lista.className = 'quick-add__tallas';

        tallas.forEach((talla) => {
            const opcion = document.createElement('button');
            opcion.type = 'button';
            opcion.className = 'quick-add__talla';
            opcion.textContent = talla.nombre;
            opcion.setAttribute('aria-label', `Agregar talla ${talla.nombre} al carrito`);
            opcion.addEventListener('click', () => agregarDesdeQuickAdd(producto, variacion, talla));
            lista.appendChild(opcion);
        });

        contenido.appendChild(lista);
        posicionarQuickAdd();
        lista.querySelector('button')?.focus({ preventScroll: true });
    } catch (error) {
        if (!quickAddActual || quickAddActual.solicitud !== solicitud) return;

        contenido.innerHTML = '<p class="quick-add__vacio">No se pudieron cargar las tallas. Intenta de nuevo.</p>';
        posicionarQuickAdd();
        console.error(error);
    }
}

document.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-agregar-carrito]');

    if (boton) {
        evento.preventDefault();
        evento.stopPropagation();
        abrirQuickAdd(boton);
        return;
    }

    if (quickAddActual && !evento.target.closest('.quick-add')) {
        cerrarQuickAdd(false);
    }
});

document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape' || !quickAddActual) return;

    evento.preventDefault();
    cerrarQuickAdd();
});

/* ╚═════════════════════════════════════════════════════════════╝ */

document.addEventListener('DOMContentLoaded', () => {
    // La marca funciona como "Inicio": vuelve arriba con desplazamiento suave.
    document.querySelector('.app-header .marca')?.addEventListener('click', (event) => {
        if (location.pathname !== urlTienda()) return; // en otras páginas navega normal

        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    cargarCatalogo();

    let favoritosSesionCargados = false;

    async function cargarFavoritosDeSesion() {
        if (favoritosSesionCargados) return;
        favoritosSesionCargados = true;

        if (window.cargarSupabase) await window.cargarSupabase();

        const sesion = await window.sesionTiendaPromise;

        if (!sesion?.autenticado) {
            window.refrescarCatalogo?.();
            return;
        }

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
    }

    document.addEventListener('tienda:sesion', cargarFavoritosDeSesion);

    if (window.sesionTiendaPromise) void cargarFavoritosDeSesion();
});

document.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('.btn-favorito');
    if (!boton) return;

    evento.preventDefault();
    evento.stopPropagation();

    const idProducto = boton.dataset.producto;
    if (!idProducto) return;

    if (window.cargarSupabase) await window.cargarSupabase();

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
