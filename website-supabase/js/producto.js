/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Detalle de producto                                 ║
   ╚══════════════════════════════════════════════════════════════╝ */

const IMAGEN_FALLBACK = '/tienda/recursos/img/producto.png';
const API_PRODUCTOS = '/tienda/api/productos';
const TALLAS_REFERENCIA = '/tienda/recursos/data/tallas.json';

window.favoritosTienda = window.favoritosTienda || new Set();

let tallasReferencia = null;

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

/* ── Datos para el carrito ───────────────────────────────────── */
function datosParaCarrito() {
    if (!producto || !variacionActual) return null;

    if (!tallaActual) {
        tiendaToast('Selecciona una talla disponible.', 'aviso');
        return null;
    }

    if (Number(tallaActual.stock) <= 0) {
        tiendaToast('Esa talla está agotada.', 'aviso');
        return null;
    }

    return {
        productoId: producto.id,
        nombre: producto.nombre,
        variacionId: variacionActual.id,
        color: variacionActual.color,
        tallaId: tallaActual.id,
        talla: tallaActual.nombre,
        precio: tallaActual.precio ?? producto.precio,
        imagen: variacionActual.imagenes?.[0] || producto.imagen,
        stock: tallaActual.stock,
    };
}

/* ── Estado ──────────────────────────────────────────────────── */
let producto = null;
let variacionActual = null;
let tallaActual = null;
let carrusel = null;

const $ = (id) => document.getElementById(id);

function actualizarBotonFavorito() {
    const boton = $('btnFavorito');
    if (!boton) return;

    const activo = producto && window.favoritosTienda.has(String(producto.id));

    boton.classList.toggle('is-activo', Boolean(activo));
    boton.innerHTML = activo
        ? '<i class="bi bi-heart-fill me-2"></i> Favoritos'
        : '<i class="bi bi-heart me-2"></i> Favoritos';
}

function animarPulsacionFavorito() {
    const boton = $('btnFavorito');
    if (!boton) return;

    boton.classList.remove('is-pulsado');
    void boton.offsetWidth;
    boton.classList.add('is-pulsado');

    setTimeout(() => boton.classList.remove('is-pulsado'), 430);
}

/* ── Carrusel de la imagen grande (Splide) ───────────────────── */
function marcarMini(indice) {
    document.querySelectorAll('.galeria__mini').forEach((boton, posicion) => {
        boton.classList.toggle('galeria__mini--activo', posicion === Number(indice));
    });
}

function montarCarrusel() {
    const contenedor = $('galeriaCarrusel');
    if (!contenedor || typeof Splide === 'undefined') return;

    if (carrusel) {
        carrusel.destroy(true);
        carrusel = null;
    }

    carrusel = new Splide(contenedor, {
        perPage: 1,
        pagination: false,
        arrows: false,
        drag: 'free',
        snap: true,
        speed: 350,
    });

    carrusel.on('move', indice => marcarMini(Math.round(indice)));
    carrusel.mount();
}

/* ── Render ──────────────────────────────────────────────────── */
function pintarGaleria(imagenes) {
    const slides = $('galeriaPrincipalLista');
    const minis = $('galeriaMinis');
    const lista = imagenes?.length ? imagenes : [IMAGEN_FALLBACK];

    slides.innerHTML = lista.map((imagen, indice) => `
        <li class="splide__slide">
            <img class="galeria__imagen" src="${escapar(imagen)}" alt="Imagen ${indice + 1}" onerror="this.src='${IMAGEN_FALLBACK}'">
        </li>
    `).join('');

    minis.innerHTML = lista.map((imagen, indice) => `
        <button type="button" class="galeria__mini${indice === 0 ? ' galeria__mini--activo' : ''}"
            data-indice="${indice}" data-imagen="${escapar(imagen)}" aria-label="Ver imagen ${indice + 1}">
            <img src="${escapar(imagen)}" alt="Miniatura ${indice + 1}" onerror="this.src='${IMAGEN_FALLBACK}'">
        </button>
    `).join('');

    minis.classList.toggle('galeria__minis--oculto', lista.length <= 1);

    montarCarrusel();
    marcarMini(0);
}

function pintarColores() {
    const contenedor = $('productoColores');
    const variaciones = producto.variaciones || [];

    contenedor.innerHTML = variaciones.map(variacion => {
        const activo = variacion.id === variacionActual?.id ? ' color-opcion--activo' : '';
        const imagen = variacion.imagenes?.[0] || producto.imagen || IMAGEN_FALLBACK;
        return `
            <button type="button" class="color-opcion color-opcion--imagen${activo}"
                data-variacion="${variacion.id}" title="${escapar(variacion.color)}"
                aria-label="Color ${escapar(variacion.color)}">
                <img src="${escapar(imagen)}" alt="${escapar(variacion.color)}"
                    onerror="this.src='${IMAGEN_FALLBACK}'">
            </button>
        `;
    }).join('');

    $('colorSeleccionado').textContent = variacionActual?.color || '';
}

/* ── Equivalencias de talla (la talla del sistema es la base) ── */
function referenciaTalla(nombre) {
    const numero = String(nombre ?? '').match(/\d+(?:[.,]\d+)?/);
    if (!numero || !tallasReferencia) return null;

    const eu = Number(numero[0].replace(',', '.'));
    return tallasReferencia.tallas.find(t => Number(t.eu) === eu) || null;
}

function equivalenciaCorta(nombre) {
    const ref = referenciaTalla(nombre);
    return ref ? `${ref.cm} cm` : '';
}

/* Todas las equivalencias de la talla: US hombre, US mujer, UK y cm. */
function equivalenciasTalla(nombre) {
    const ref = referenciaTalla(nombre);
    if (!ref) return [];

    const datos = [];

    if (ref.us_hombre) datos.push({ etiqueta: 'US H', valor: ref.us_hombre });
    if (ref.us_mujer) datos.push({ etiqueta: 'US M', valor: ref.us_mujer });
    if (ref.cm) datos.push({ etiqueta: 'Pie', valor: `${ref.cm} cm` });

    return datos;
}

function pintarGuiaTallas() {
    const cuerpo = $('guiaTallasCuerpo');
    if (!cuerpo || !tallasReferencia) return;

    cuerpo.innerHTML = tallasReferencia.tallas
        .filter(t => Number(t.eu) >= 36 && Number(t.eu) <= 44)
        .map(t => `
        <tr>
            <td><strong>${t.eu}</strong></td>
            <td>${t.us_hombre ?? '—'}</td>
            <td>${t.us_mujer ?? '—'}</td>
            <td>${t.uk ?? '—'}</td>
            <td>${t.cm}</td>
        </tr>
    `).join('');

    const nota = $('guiaTallasNota');
    if (nota) nota.textContent = tallasReferencia.nota || '';

    const caja = $('guiaTallas');
    if (caja) caja.hidden = false;
}

async function cargarTallasReferencia() {
    try {
        const respuesta = await fetch(TALLAS_REFERENCIA, { headers: { Accept: 'application/json' } });
        if (!respuesta.ok) return;

        tallasReferencia = await respuesta.json();
        pintarGuiaTallas();

        // Repinta las tallas del producto con sus equivalencias en cm.
        if (variacionActual) pintarTallas();
    } catch (error) {
        console.warn('No se pudo cargar la guía de tallas', error);
    }
}

function pintarTallas() {
    const contenedor = $('productoTallas');
    const tallas = variacionActual?.tallas || [];

    if (!tallas.length) {
        contenedor.innerHTML = '<span class="tallas__vacio">Sin tallas disponibles para este color.</span>';
        return;
    }

    contenedor.innerHTML = tallas.map(talla => {
        const agotada = Number(talla.stock) <= 0;
        const activa = tallaActual && talla.id === tallaActual.id;
        const equiv = equivalenciaCorta(talla.nombre);

        return `
            <div class="talla-opcion${activa ? ' talla-opcion--activo' : ''}${agotada ? ' talla-opcion--agotada' : ''}"
                 data-talla="${talla.id}" title="${agotada ? 'Agotada' : `Stock: ${talla.stock}`}">
                <span class="talla-opcion__base">${escapar(talla.nombre)}</span>
                <span class="talla-opcion__equiv">${equiv || '&nbsp;'}</span>
            </div>
        `;
    }).join('');

    pintarEquivalencias();
}

/* Etiqueta fija: muestra US H / US M de la talla seleccionada. */
function pintarEquivalencias() {
    const caja = $('tallasEquiv');
    if (!caja) return;

    if (!tallaActual) {
        caja.textContent = 'Selecciona una talla para ver sus equivalencias.';
        return;
    }

    const datos = equivalenciasTalla(tallaActual.nombre)
        .filter(dato => dato.etiqueta !== 'Pie')
        .map(dato => `${dato.etiqueta} ${dato.valor}`);

    caja.textContent = datos.length
        ? `Talla ${tallaActual.nombre} · ${datos.join(' · ')}`
        : `Talla ${tallaActual.nombre}`;
}

function pintarPrecio() {
    const precio = tallaActual?.precio ?? variacionActual?.tallas?.[0]?.precio ?? producto.precio;
    $('productoPrecio').textContent = moneda(precio);

    const impuesto = Number(producto.impuesto || 0);
    $('productoImpuesto').textContent = impuesto > 0 ? `IVA ${impuesto}% incluido` : '';

    actualizarWhatsapp();
}

/* ── Pedido por WhatsApp ─────────────────────────────────────── */
const WHATSAPP_NUMERO = '50584774288';

function enlaceWhatsappProducto() {
    if (!producto) return `https://wa.me/${WHATSAPP_NUMERO}`;

    const lineas = [`Hola, quiero pedir: ${producto.nombre}`];

    if (variacionActual?.color) lineas.push(`Color: ${variacionActual.color}`);
    if (tallaActual?.nombre) lineas.push(`Talla: ${tallaActual.nombre}`);

    const precio = tallaActual?.precio ?? producto.precio;

    if (precio) lineas.push(`Precio: ${moneda(precio)}`);

    lineas.push(
        `${location.origin}${urlTienda('producto')}?p=${producto.id}`
        + (variacionActual?.color ? `&color=${encodeURIComponent(variacionActual.color)}` : '')
    );

    return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(lineas.join('\n'))}`;
}

function actualizarWhatsapp() {
    const boton = document.getElementById('btnWhatsapp');

    if (!boton || !producto) return;

    boton.href = enlaceWhatsappProducto();
}

/* ── Selección ───────────────────────────────────────────────── */
function seleccionarVariacion(id) {
    const variacion = producto.variaciones.find(v => String(v.id) === String(id));
    if (!variacion) return;

    variacionActual = variacion;
    tallaActual = variacion.tallas.find(t => Number(t.stock) > 0) || null;

    pintarGaleria(variacion.imagenes);
    pintarColores();
    pintarTallas();
    pintarPrecio();
}

function seleccionarTalla(id) {
    const talla = variacionActual?.tallas.find(t => String(t.id) === String(id));
    if (!talla || Number(talla.stock) <= 0) return;

    tallaActual = talla;
    pintarTallas();
    pintarPrecio();
}

/* ── Datos ───────────────────────────────────────────────────── */
function mostrarProductoNoDisponible(mensaje) {
    document.getElementById('productoDetalle').innerHTML = `
        <div class="producto__panel">
            <h1 class="producto__nombre">Producto no disponible</h1>
            <p class="producto__descripcion">${escapar(mensaje)}</p>
            <a class="btn-primario" href="${urlTienda()}#catalogo">Volver a la tienda</a>
        </div>`;
}

/* ── Metadatos para compartir el enlace ──────────────────────── */
function actualizarMetaProducto() {
    const poner = (selector, contenido) => {
        const etiqueta = document.querySelector(selector);

        if (etiqueta) etiqueta.setAttribute('content', contenido);
    };

    poner('meta[property="og:title"]', `${producto.nombre} · Tellez Nic Store`);
    poner('meta[property="og:description"]', producto.descripcion || 'Producto disponible en Tellez Nic Store.');
    poner('meta[name="description"]', producto.descripcion || 'Producto disponible en Tellez Nic Store.');

    if (producto.imagen) {
        poner('meta[property="og:image"]', new URL(producto.imagen, location.origin).href);
    }
}

async function cargarProducto() {
    const parametros = new URLSearchParams(location.search);
    const segmentos = location.pathname.split('/').filter(Boolean);
    const ultimoSegmento = segmentos[segmentos.length - 1] || '';

    /* El ID puede venir en la ruta o en ?p= (algunos hostings redirigen y pierden la ruta). */
    const idQuery = parametros.get('p') || parametros.get('id') || '';
    const id = /^\d+$/.test(idQuery) ? idQuery : (/^\d+$/.test(ultimoSegmento) ? ultimoSegmento : '');

    /* Sin ID numérico no hay producto: evita pedir /tienda/api/productos/producto */
    if (!id) {
        document.title = 'Producto no disponible · Tellez Nic Store';
        mostrarProductoNoDisponible('El enlace del producto está incompleto o el producto ya no existe.');
        return;
    }

    try {
        const respuesta = await fetch(`/tienda/api/productos/${id}`, { headers: { Accept: 'application/json' } });
        const texto = await respuesta.text();

        let data = null;

        try {
            data = texto ? JSON.parse(texto) : null;
        } catch {
            data = null;
        }

        if (!respuesta.ok || !data || !data.success) {
            throw new Error(data?.mensaje || 'Producto no encontrado.');
        }

        producto = data.producto;

        // El catálogo enlaza cada color con ?color=Nombre.
        const colorBuscado = new URLSearchParams(location.search).get('color') || '';

        document.title = `${producto.nombre} · Tellez Nic Store`;
        actualizarMetaProducto();
        $('productoCategoria').textContent = producto.categoria;
        $('productoNombre').textContent = producto.nombre;
        $('productoDescripcion').textContent = producto.descripcion || 'Producto disponible en nuestra tienda.';

        if (!producto.variaciones?.length) {
            $('productoColores').innerHTML = '<span class="tallas__vacio">Sin colores registrados.</span>';
            $('productoTallas').innerHTML = '';
            pintarGaleria([producto.imagen]);
            pintarPrecio();
            cargarRelacionados();
            actualizarBotonFavorito();
            return;
        }

        seleccionarVariacion(
            producto.variaciones.find(variacion => normalizar(variacion.color) === normalizar(colorBuscado))?.id
            ?? producto.variaciones[0].id
        );

        cargarRelacionados();
        actualizarBotonFavorito();
    } catch (error) {
        mostrarProductoNoDisponible(error.message || 'No se pudo cargar el producto.');
        console.error(error);
    }
}

/* ── Productos relacionados (estilo Amazon) ──────────────────── */
let carruselRelacionados = null;

function montarCarruselRelacionados() {
    const contenedor = $('relacionadosCarrusel');
    if (!contenedor || typeof Splide === 'undefined') return;

    if (carruselRelacionados) {
        carruselRelacionados.destroy(true);
        carruselRelacionados = null;
    }

    const total = contenedor.querySelectorAll('.splide__slide').length;
    if (!total) return;

    carruselRelacionados = new Splide(contenedor, {
        type: total > 2 ? 'loop' : 'slide',
        perPage: 5,
        perMove: 1,
        gap: '12px',
        arrows: total > 2,
        pagination: false,
        drag: 'free',
        snap: true,
        breakpoints: {
            1200: { perPage: 4 },
            992: { perPage: 3 },
            768: { perPage: 2, arrows: false },
            576: { perPage: 2, arrows: false },
        },
    });

    carruselRelacionados.mount();
}

function ratingRelacionado(item) {
    const calificacion = item.calificacion || {};
    const total = Number(calificacion.total || 0);
    const promedio = Number(calificacion.promedio || 0);

    if (!total) {
        return '<span class="card-compacta__rating card-compacta__rating--vacio">Sin opiniones</span>';
    }

    return `<span class="card-compacta__rating">
        <i class="bi bi-star-fill"></i>
        <span class="card-compacta__rating-num">${promedio.toFixed(1)}</span>
        <span class="card-compacta__rating-total">(${total})</span>
    </span>`;
}

async function cargarRelacionados() {
    const seccion = $('relacionados');
    const lista = $('relacionadosGrid');
    if (!seccion || !lista || !producto) return;
    try {
        const respuesta = await fetch(API_PRODUCTOS, { headers: { Accept: 'application/json' } });
        if (!respuesta.ok) throw new Error('No se pudo cargar el catálogo.');

        const data = await respuesta.json();
        const mismaCategoria = [];
        const otras = [];

        (data.productos || []).forEach(item => {
            if (String(item.id) === String(producto.id)) return;

            const colores = item.colores?.length ? item.colores : [{ nombre: '', imagen: item.imagen }];

            colores.forEach(color => {
                if (!color.imagen) return;

                const tarjeta = {
                    id: item.id,
                    nombre: item.nombre,
                    precio: item.precio,
                    color: color.nombre,
                    imagen: color.imagen,
                    calificacion: item.calificacion || { promedio: 0, total: 0 },
                };

                if (item.categoria === producto.categoria) mismaCategoria.push(tarjeta);
                else otras.push(tarjeta);
            });
        });

        // Con catálogos pequeños completamos con otros productos para que el bucle tenga contenido.
        const tarjetas = [...mismaCategoria, ...otras].slice(0, 12);
        if (!tarjetas.length) return;

        lista.innerHTML = tarjetas.map(item => `
            <li class="splide__slide">
                <a class="card-compacta" href="/producto?p=${encodeURIComponent(item.id)}&color=${encodeURIComponent(item.color || '')}">
                    <div class="card-compacta__media">
                        <img src="${escapar(item.imagen || IMAGEN_FALLBACK)}" alt="${escapar(item.nombre)}" loading="lazy"
                             onerror="this.src='${IMAGEN_FALLBACK}'">
                    </div>
                    <div class="card-compacta__info">
                        <span class="card-compacta__nombre">${escapar(item.nombre)}</span>
                        ${ratingRelacionado(item)}
                        <span class="card-compacta__precio">${moneda(item.precio)}</span>
                    </div>
                </a>
            </li>
        `).join('');

        seccion.hidden = false;
        montarCarruselRelacionados();
    } catch (error) {
        console.error(error);
    }
}

/* ── Eventos ─────────────────────────────────────────────────── */
document.addEventListener('click', (event) => {
    const color = event.target.closest('[data-variacion]');
    if (color) {
        seleccionarVariacion(color.dataset.variacion);
        return;
    }

    const talla = event.target.closest('[data-talla]');
    if (talla) {
        seleccionarTalla(talla.dataset.talla);
        return;
    }

    const mini = event.target.closest('.galeria__mini');
    if (mini) {
        const indice = Number(mini.dataset.indice || 0);
        if (carrusel) carrusel.go(indice);
        marcarMini(indice);
        return;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const copiarConRespaldo = (texto) => {
        // Respaldo para navegadores sin Clipboard API o sin permiso.
        const campo = document.createElement('textarea');
        campo.value = texto;
        campo.setAttribute('readonly', '');
        campo.style.position = 'fixed';
        campo.style.opacity = '0';
        document.body.appendChild(campo);
        campo.select();
        document.execCommand('copy');
        document.body.removeChild(campo);
    };

    $('btnCompartir')?.addEventListener('click', async () => {
        const enlace = window.location.href;
        const titulo = producto?.nombre ? `${producto.nombre} · Tellez Nic Store` : document.title;

        // En móvil abre la hoja nativa (WhatsApp, Instagram, etc.).
        if (navigator.share) {
            try {
                await navigator.share({ title: titulo, text: titulo, url: enlace });
                return;
            } catch (error) {
                // El usuario canceló la hoja: no hacemos nada.
                if (error?.name === 'AbortError') return;
            }
        }

        // Respaldo en escritorio: copiar el enlace.
        try {
            if (navigator.clipboard?.writeText) {
                try {
                    await navigator.clipboard.writeText(enlace);
                } catch {
                    copiarConRespaldo(enlace);
                }
            } else {
                copiarConRespaldo(enlace);
            }

            tiendaToast('Enlace copiado al portapapeles');
        } catch (error) {
            tiendaToast('No se pudo compartir el producto', 'aviso');
            console.error(error);
        }
    });

    $('btnAgregar')?.addEventListener('click', () => {
        const datos = datosParaCarrito();
        if (!datos) return;

        Carrito.agregar(datos, 1);
        tiendaToast('Producto agregado al carrito.');
    });

    $('btnComprar')?.addEventListener('click', () => {
        const datos = datosParaCarrito();
        if (!datos) return;

        Carrito.agregar(datos, 1);
        window.location.href = urlTienda('carrito');
    });

    $('btnFavorito')?.addEventListener('click', async () => {
        if (!producto) return;

        const sesion = await window.sesionTiendaPromise;

        if (!sesion?.autenticado) {
            tiendaToast('Inicia sesión para guardar favoritos.', 'aviso');
            window.location.href = `${urlTienda('perfil')}#perfil`;
            return;
        }

        const idProducto = String(producto.id);
        const activo = window.favoritosTienda.has(idProducto);

        animarPulsacionFavorito();

        try {
            if (activo) {
                await window.TiendaAPI.delete(`/tienda/api/favoritos/${idProducto}`);
                window.favoritosTienda.delete(idProducto);
            } else {
                await window.TiendaAPI.post('/tienda/api/favoritos', { id_producto: Number(idProducto) });
                window.favoritosTienda.add(idProducto);
            }

            actualizarBotonFavorito();
        } catch (error) {
            tiendaToast(error.message, 'aviso');
        }
    });

    cargarTallasReferencia();
    cargarProducto();

    window.sesionTiendaPromise.then(async (sesion) => {
        if (!sesion?.autenticado) return;

        try {
            const datos = await window.TiendaAPI.get('/tienda/api/favoritos');
            window.favoritosTienda = new Set(
                (datos.favoritos || []).map((favorito) => String(favorito.id_producto))
            );
            actualizarBotonFavorito();
        } catch (error) {
            console.error('No se pudieron cargar los favoritos.', error);
        }
    });
});
