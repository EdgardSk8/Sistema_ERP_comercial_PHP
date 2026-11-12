/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Detalle de producto                                 ║
   ╚══════════════════════════════════════════════════════════════╝ */

const IMAGEN_FALLBACK = '/tienda/recursos/img/producto.png';
const API_PRODUCTOS = '/tienda/api/productos';
const TALLAS_REFERENCIA = '/tienda/recursos/data/tallas.json';

window.favoritosTienda = window.favoritosTienda || new Set();

let tallasReferencia = null;

const TIPOS_TALLA_ESTANDAR = ['calzado', 'ropa adulto', 'ropa nino', 'unica', 'sin talla'];

function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/* "Calzado", "Ropa adulto", etc. se muestran como "Tallas"; el resto usa su tipo. */
function etiquetaTipoTalla(tipo) {
    const nombre = String(tipo || '').trim();

    if (!nombre || TIPOS_TALLA_ESTANDAR.includes(normalizar(nombre))) return 'Tallas';

    return nombre;
}

function etiquetaLineaTalla(talla) {
    const etiqueta = etiquetaTipoTalla(talla?.tipo);

    return etiqueta === 'Tallas' ? 'Talla' : etiqueta;
}

function tipoTallaVariacion(variacion) {
    const tipos = [...new Set((variacion?.tallas || [])
        .map((talla) => String(talla.tipo || '').trim())
        .filter(Boolean))];

    return tipos.length === 1 ? tipos[0] : '';
}

function moneda(valor) {
    return window.TiendaUtil.moneda(valor);
}

function escapar(valor) {
    return window.TiendaUtil.escapar(valor);
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
        tallaEtiqueta: etiquetaLineaTalla(tallaActual),
        precio: tallaActual.precio ?? producto.precio,
        categoria: producto.categoria,
        imagen: variacionActual.imagenes?.[0] || producto.imagen,
        stock: tallaActual.stock,
    };
}

/* ── Estado ──────────────────────────────────────────────────── */
let producto = null;
let variacionActual = null;
let tallaActual = null;
let carrusel = null;
let promocionProducto = null;
let promocionesProductos = [];

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

    // Con arrastre en móvil (drag: 'free') Splide no dispara 'move'/'moved':
    // 'scrolled' llega al terminar el snap y sincroniza la miniatura activa.
    const sincronizarMini = (indice) => {
        if (!carrusel) return;
        marcarMini(Number.isInteger(indice) ? indice : carrusel.index);
    };

    carrusel.on('moved', sincronizarMini);
    carrusel.on('scrolled', sincronizarMini);
    carrusel.mount();
}

/* ── Render ──────────────────────────────────────────────────── */
function pintarGaleria(imagenes) {
    const slides = $('galeriaPrincipalLista');
    const minis = $('galeriaMinis');
    const lista = imagenes?.length ? imagenes : [IMAGEN_FALLBACK];

    slides.innerHTML = lista.map((imagen, indice) => {
        const srcset = window.srcsetImagen?.(imagen) || '';
        return `
        <li class="splide__slide">
            <img class="galeria__imagen" src="${escapar(imagen)}" alt="Imagen ${indice + 1}" draggable="false"
                 ${srcset ? `srcset="${escapar(srcset)}" sizes="(min-width: 992px) 45vw, 100vw"` : ''}
                 ${indice === 0 ? 'fetchpriority="high"' : 'fetchpriority="low"'} decoding="async"
                 onerror="if(!this.dataset.original){this.dataset.original='1';this.removeAttribute('srcset');this.src='${escapar(imagen)}';}else{this.src='${IMAGEN_FALLBACK}';}">
        </li>`;
    }).join('');

    minis.innerHTML = lista.map((imagen, indice) => {
        const srcset = window.srcsetImagen?.(imagen) || '';
        return `
        <button type="button" class="galeria__mini${indice === 0 ? ' galeria__mini--activo' : ''}"
            data-indice="${indice}" data-imagen="${escapar(imagen)}" aria-label="Ver imagen ${indice + 1}">
            <img src="${escapar(imagen)}" alt="Miniatura ${indice + 1}" draggable="false" decoding="async" fetchpriority="low"
                ${srcset ? `srcset="${escapar(srcset)}" sizes="72px"` : ''} onerror="this.src='${IMAGEN_FALLBACK}'">
        </button>`;
    }).join('');

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
        const srcset = window.srcsetImagen?.(imagen) || '';
        return `
            <button type="button" class="color-opcion color-opcion--imagen${activo}"
                data-variacion="${variacion.id}" title="${escapar(variacion.color)}"
                aria-label="Color ${escapar(variacion.color)}">
                <img src="${escapar(imagen)}" alt="${escapar(variacion.color)}"
                    ${srcset ? `srcset="${escapar(srcset)}" sizes="72px"` : ''}
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
    if (caja) caja.hidden = normalizar(tipoTallaVariacion(variacionActual)) !== 'calzado';
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
    const tallas = (variacionActual?.tallas || []).filter(talla => Number(talla.stock) > 0);
    const tipo = tipoTallaVariacion(variacionActual);
    const etiqueta = etiquetaTipoTalla(tipo);
    const titulo = $('productoTallasTitulo');
    const guia = $('guiaTallas');

    if (titulo) titulo.textContent = etiqueta;
    if (guia) guia.hidden = normalizar(tipo) !== 'calzado';

    // Productos que no son ropa: una sola "talla" genérica → no se muestra el selector.
    const bloqueTallas = contenedor?.closest('.opcion--tallas');
    const soloTallaUnica = tallas.length === 1
        && ['unica', 'unico', 'sin talla'].includes(normalizar(tallas[0].nombre));

    if (bloqueTallas) bloqueTallas.hidden = soloTallaUnica;

    if (!tallas.length) {
        contenedor.innerHTML = '<span class="tallas__vacio">Sin opciones disponibles para este color.</span>';
        return;
    }

    contenedor.innerHTML = tallas.map(talla => {
        const activa = tallaActual && talla.id === tallaActual.id;
        const equiv = equivalenciaCorta(talla.nombre);

        return `
            <div class="talla-opcion${activa ? ' talla-opcion--activo' : ''}"
                 data-talla="${talla.id}" title="Stock: ${talla.stock}">
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
        caja.textContent = 'Selecciona una opción para ver sus equivalencias.';
        return;
    }

    const etiqueta = etiquetaLineaTalla(tallaActual);

    if (etiqueta !== 'Talla') {
        caja.textContent = `${etiqueta}: ${tallaActual.nombre}`;
        return;
    }

    const datos = equivalenciasTalla(tallaActual.nombre)
        .filter(dato => dato.etiqueta !== 'Pie')
        .map(dato => `${dato.etiqueta} ${dato.valor}`);

    caja.textContent = datos.length
        ? `Talla ${tallaActual.nombre} · ${datos.join(' · ')}`
        : `Talla ${tallaActual.nombre}`;
}

/* ── Promoción del producto y aviso de registro ─────────────── */
async function cargarPromocionProducto() {
    promocionProducto = null;
    promocionesProductos = [];

    if (!producto) return;

    try {
        const datos = await window.TiendaAPI.get('/tienda/api/promociones');
        const promociones = (datos?.promociones || [])
            .filter((fila) => Number(fila.valor_descuento) > 0);

        promocionesProductos = promociones;
        promocionProducto = promociones.find(
            (fila) => String(fila.id_producto) === String(producto.id)
        ) || null;
    } catch {
        promocionProducto = null;
        promocionesProductos = [];
    }
}

function etiquetaPromocion(promocion = promocionProducto) {
    if (!promocion) return '';

    const valor = Number(promocion.valor_descuento) || 0;

    return promocion.tipo_descuento === 'porcentaje'
        ? `${Math.round(valor)}%`
        : moneda(valor);
}

function textoPromocion(promocion = promocionProducto) {
    if (!promocion) return '';

    const valor = Number(promocion.valor_descuento) || 0;
    if (valor <= 0) return '';

    if (promocion.tipo_descuento === 'porcentaje') return `${Math.round(valor)}% DESCUENTO`;
    if (promocion.tipo_descuento === 'monto') return `-C$ ${valor.toFixed(2)}`;
    if (promocion.tipo_descuento === 'precio') return `Ahora C$ ${valor.toFixed(2)}`;

    return '';
}

function precioConPromocion(precioBase, promocion = promocionProducto) {
    const base = Number(precioBase) || 0;
    if (!promocion || base <= 0) return base;

    const valor = Number(promocion.valor_descuento) || 0;
    if (valor <= 0) return base;

    if (promocion.tipo_descuento === 'porcentaje') {
        return Math.max(0, Math.round(base * (1 - valor / 100) * 100) / 100);
    }

    if (promocion.tipo_descuento === 'monto') {
        return Math.max(0, base - valor);
    }

    if (promocion.tipo_descuento === 'precio') {
        return valor;
    }

    return base;
}

function pintarAvisoDescuento() {
    const caja = $('productoAvisoDescuento');
    if (!caja) return;

    const cliente = window.clienteTienda;
    const descuento = cliente?.descuento || null;
    const usado = Boolean(cliente?.descuento_primera_compra_usado);

    if (cliente && (descuento || usado)) {
        caja.hidden = true;
        caja.innerHTML = '';
        return;
    }

    caja.hidden = false;

    if (cliente) {
        caja.innerHTML = `
            <i class="bi bi-percent" aria-hidden="true"></i>
            <p>Activa tu 10% de bienvenida en zapatos para tu primera compra.</p>
            <a class="producto__aviso-dto-link" href="${escapar(`${urlTienda('perfil')}#descuentos`)}">
                Completar y activar
            </a>
        `;
        return;
    }

    const mensaje = promocionProducto
        ? `Regístrate para aplicar el descuento de ${etiquetaPromocion()} en este producto.`
        : 'Regístrate y obtén 10% de descuento en tu primera compra.';

    caja.innerHTML = `
        <i class="bi bi-percent" aria-hidden="true"></i>
        <p>${escapar(mensaje)}</p>
        <a class="producto__aviso-dto-link" href="/tienda/login">Crear cuenta o iniciar sesión</a>
    `;
}

function pintarPrecio() {
    const precioBase = Number(tallaActual?.precio ?? variacionActual?.tallas?.[0]?.precio ?? producto.precio) || 0;
    const descuento = window.descuentoClienteActivo?.(producto.categoria);
    const precioCuenta = window.precioConDescuento?.(precioBase, producto.categoria) ?? precioBase;
    const precioPromo = precioConPromocion(precioBase);
    const nodo = $('productoPrecio');

    if (!nodo) return;

    /* No se acumulan: se muestra el mejor precio y en el carrito se elige. */
    let precioFinal = precioBase;
    let etiqueta = '';
    let esBienvenida = false;

    if (precioPromo < precioFinal) {
        precioFinal = precioPromo;
        etiqueta = etiquetaPromocion();
    }

    if (descuento && precioCuenta < precioFinal) {
        precioFinal = precioCuenta;
        etiqueta = descuento.etiqueta;
        esBienvenida = Boolean(descuento.primera_compra);
    }

    if (precioFinal < precioBase) {
        nodo.innerHTML = `
            <span class="producto__precio--antes">${moneda(precioBase)}</span>
            <span class="producto__precio--dto">${moneda(precioFinal)}</span>
            <span class="producto__descuento">${escapar(etiqueta)} ${esBienvenida ? 'BIENVENIDA' : 'DESCUENTO'}</span>
        `;
    } else {
        nodo.textContent = moneda(precioBase);
    }

    const impuesto = Number(producto.impuesto || 0);
    $('productoImpuesto').textContent = impuesto > 0 ? `IVA ${impuesto}% incluido` : '';

    pintarAvisoDescuento();
    actualizarWhatsapp();
}

/* ── Pedido por WhatsApp ─────────────────────────────────────── */
const WHATSAPP_NUMERO = '50584774288';

function enlaceWhatsappProducto() {
    if (!producto) return `https://wa.me/${WHATSAPP_NUMERO}`;

    const lineas = [`Hola, quiero pedir: ${producto.nombre}`];

    if (variacionActual?.color) lineas.push(`Color: ${variacionActual.color}`);
    if (tallaActual?.nombre) lineas.push(`${etiquetaLineaTalla(tallaActual)}: ${tallaActual.nombre}`);

    const precioBase = Number(tallaActual?.precio ?? producto.precio) || 0;
    const descuento = window.descuentoClienteActivo?.(producto.categoria);
    const precioCuenta = window.precioConDescuento?.(precioBase, producto.categoria) ?? precioBase;
    const precioPromo = precioConPromocion(precioBase);
    const precioFinal = Math.min(precioCuenta, precioPromo);

    if (precioBase) lineas.push(`Precio: ${moneda(precioFinal)}`);
    if (precioFinal < precioBase) lineas.push(`Descuento ${descuento?.etiqueta || etiquetaPromocion()} aplicado.`);

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

    /* Canonical y og:url propios del producto (evita que todos apunten a /producto). */
    const canonica = document.querySelector('link[rel="canonical"]');
    const base = canonica ? canonica.href.split('?')[0] : `${location.origin}${location.pathname}`;
    const urlProducto = `${base}?p=${encodeURIComponent(producto.id)}`;

    canonica?.setAttribute('href', urlProducto);
    poner('meta[property="og:url"]', urlProducto);

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

        // Espera la sesión para mostrar el descuento del cliente desde el primer render.
        await (window.sesionTiendaPromise || Promise.resolve()).catch(() => null);

        // Promoción activa del producto (los descuentos no se acumulan).
        await cargarPromocionProducto();

        // El catálogo enlaza cada color con ?color=Nombre.
        const colorBuscado = new URLSearchParams(location.search).get('color') || '';

        document.title = `${producto.nombre} · Tellez Nic Store`;
        actualizarMetaProducto();
        $('productoCategoria').textContent = producto.categoria;
        $('productoNombre').textContent = producto.nombre;

        const marcaProducto = $('productoMarca');
        if (marcaProducto) {
            marcaProducto.textContent = producto.marca || '';
            marcaProducto.hidden = !producto.marca;
        }

        const atributosProducto = $('productoAtributos');
        if (atributosProducto) {
            const listaAtributos = (producto.atributos || [])
                .filter(atributo => atributo?.atributo && atributo?.valor)
                .map(atributo => `${atributo.atributo}: ${atributo.valor}`);

            atributosProducto.textContent = listaAtributos.join(' · ');
            atributosProducto.hidden = !listaAtributos.length;
        }

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
                    categoria: item.categoria,
                    precio: item.precio,
                    color: color.nombre,
                    imagen: color.imagen,
                    calificacion: item.calificacion || { promedio: 0, total: 0 },
                    promocion: promocionesProductos.find(
                        (fila) => String(fila.id_producto) === String(item.id)
                    ) || null,
                };

                if (item.categoria === producto.categoria) mismaCategoria.push(tarjeta);
                else otras.push(tarjeta);
            });
        });

        // Con catálogos pequeños completamos con otros productos para que el bucle tenga contenido.
        const tarjetas = [...mismaCategoria, ...otras].slice(0, 12);
        if (!tarjetas.length) return;

        lista.innerHTML = tarjetas.map(item => {
            const precioBase = Number(item.precio) || 0;
            const promo = item.promocion;
            const precioPromo = precioConPromocion(precioBase, promo);
            const descuento = window.descuentoClienteActivo?.(item.categoria);
            const precioCuenta = window.precioConDescuento?.(precioBase, item.categoria) ?? precioBase;
            let precioFinal = precioBase;
            let etiqueta = '';
            let tipoDescuento = '';
            let esBienvenida = false;

            /* La promoción y el descuento de cuenta no se acumulan. */
            if (precioPromo < precioFinal) {
                precioFinal = precioPromo;
                etiqueta = textoPromocion(promo);
                tipoDescuento = 'promocion';
            }

            if (descuento && precioCuenta < precioFinal) {
                precioFinal = precioCuenta;
                etiqueta = descuento.etiqueta;
                tipoDescuento = 'cuenta';
                esBienvenida = Boolean(descuento.primera_compra);
            }

            const rebajado = precioFinal < precioBase;
            const sello = tipoDescuento === 'promocion'
                ? `<span class="badge-promocion">${escapar(etiqueta)}</span>`
                : (rebajado ? `<span class="badge-descuento">${escapar(etiqueta)} ${esBienvenida ? 'bienvenida' : 'descuento'}</span>` : '');
            const srcset = window.srcsetImagen?.(item.imagen) || '';

            return `
                <li class="splide__slide">
                    <a class="card-compacta" href="/producto?p=${encodeURIComponent(item.id)}&color=${encodeURIComponent(item.color || '')}">
                        <div class="card-compacta__media">
                            ${rebajado ? sello : ''}
                            <img src="${escapar(item.imagen || IMAGEN_FALLBACK)}" alt="${escapar(item.nombre)}" loading="lazy" decoding="async" fetchpriority="low"
                                 ${srcset ? `srcset="${escapar(srcset)}" sizes="(min-width: 992px) 270px, 45vw"` : ''} onerror="this.src='${IMAGEN_FALLBACK}'">
                        </div>
                        <div class="card-compacta__info">
                            <span class="card-compacta__nombre">${escapar(item.nombre)}</span>
                            ${ratingRelacionado(item)}
                            <span class="card-compacta__precio">
                                ${rebajado ? `<span class="precio--antes">${moneda(precioBase)}</span> ` : ''}
                                <span class="${rebajado ? 'precio--dto' : ''}">${moneda(precioFinal)}</span>
                            </span>
                        </div>
                    </a>
                </li>
            `;
        }).join('');

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

    /* ── Términos antes de pedir por WhatsApp ────────────────── */
    const btnWhatsapp = $('btnWhatsapp');
    const modalTerminos = $('modalTerminosWhatsapp');
    const checkTerminos = $('aceptarTerminosWhatsapp');
    const btnContinuarTerminos = $('btnContinuarWhatsapp');
    let focoAntesTerminos = null;
    let overflowAntesTerminos = '';

    const abrirTerminosWhatsapp = () => {
        if (!modalTerminos) return;

        focoAntesTerminos = document.activeElement;
        overflowAntesTerminos = document.body.style.overflow;

        if (checkTerminos) checkTerminos.checked = false;
        if (btnContinuarTerminos) btnContinuarTerminos.disabled = true;

        modalTerminos.hidden = false;
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => modalTerminos.classList.add('tienda-modal--visible'));
        checkTerminos?.focus({ preventScroll: true });
    };

    const cerrarTerminosWhatsapp = () => {
        if (!modalTerminos || modalTerminos.hidden) return;

        modalTerminos.classList.remove('tienda-modal--visible');
        document.body.style.overflow = overflowAntesTerminos;

        window.setTimeout(() => {
            modalTerminos.hidden = true;
            if (focoAntesTerminos instanceof HTMLElement) focoAntesTerminos.focus({ preventScroll: true });
        }, 180);
    };

    btnWhatsapp?.addEventListener('click', (evento) => {
        evento.preventDefault();
        abrirTerminosWhatsapp();
    });

    checkTerminos?.addEventListener('change', () => {
        if (btnContinuarTerminos) btnContinuarTerminos.disabled = !checkTerminos.checked;
    });

    modalTerminos?.querySelectorAll('[data-cerrar-terminos]').forEach((elemento) => {
        elemento.addEventListener('click', cerrarTerminosWhatsapp);
    });

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && modalTerminos && !modalTerminos.hidden) {
            evento.preventDefault();
            cerrarTerminosWhatsapp();
        }
    });

    btnContinuarTerminos?.addEventListener('click', () => {
        if (!checkTerminos?.checked || !btnWhatsapp) return;

        cerrarTerminosWhatsapp();
        window.open(btnWhatsapp.href, '_blank', 'noopener');
    });

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
