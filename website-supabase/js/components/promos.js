/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Fotos de productos y descuentos                     ║
   ║  Se muestran al final del catálogo y de la ficha de producto  ║
   ║  Carrusel horizontal con Splide (arrastrar y flechas)         ║
   ║  Configuración: data/promociones.json                         ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    const seccion = document.getElementById('promos');
    const contenedor = document.getElementById('promosGrid');

    if (!seccion || !contenedor) return;

    const carruselRaiz = contenedor.closest('.splide');
    let carrusel = null;

    const escapar = (valor) => String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    /* ╔══════════════════════════════════════════════════════════╗
       ║  Aviso de registro para visitantes sin sesión            ║
       ╚══════════════════════════════════════════════════════════╝ */

    /*
       Arranca oculto: solo se muestra cuando la sesión ya se resolvió y no
       hay cliente, para no enseñar la invitación a quien ya tiene cuenta.
    */
    function aplicarSesion(cliente) {
        const aviso = document.getElementById('promosAviso');

        if (aviso) aviso.hidden = Boolean(cliente);
    }

    function montarAvisoRegistro() {
        if (document.getElementById('promosAviso')) return;

        const destino = window.urlTienda ? window.urlTienda('login') : '/login';

        const aviso = document.createElement('div');
        aviso.className = 'promos-aviso';
        aviso.id = 'promosAviso';
        aviso.hidden = true;

        aviso.innerHTML = `
            <span class="promos-aviso__sello" aria-hidden="true">
                <strong>10%</strong>
                <small>Descuento</small>
            </span>
            <div class="promos-aviso__texto">
                <span class="promos-aviso__etiqueta">Solo por registrarte</span>
                <p class="promos-aviso__titulo">Regístrate y obtén 10% de descuento</p>
                <p class="promos-aviso__detalle">Tu descuento de bienvenida se aplica en tu primera compra de zapatos.</p>
            </div>
            <a class="promos-aviso__btn" href="${escapar(destino)}">
                Crear mi cuenta <i class="bi bi-arrow-right" aria-hidden="true"></i>
            </a>
        `;

        const ancla = carruselRaiz || contenedor;
        ancla.parentNode.insertBefore(aviso, ancla);
    }

    montarAvisoRegistro();

    if (window.sesionTiendaPromise) {
        window.sesionTiendaPromise
            .then((datos) => aplicarSesion(datos?.cliente))
            .catch(() => aplicarSesion(null));
    }

    document.addEventListener('tienda:sesion', (evento) => aplicarSesion(evento.detail?.cliente));

    /* ╔══════════════════════════════════════════════════════════╗
       ║  Carrusel horizontal con Splide                          ║
       ╚══════════════════════════════════════════════════════════╝ */

    function montarCarrusel() {
        if (!carruselRaiz || typeof Splide === 'undefined') return;

        if (carrusel) {
            carrusel.destroy(true);
            carrusel = null;
        }

        if (!contenedor.children.length) return;

        /*
           autoWidth respeta el ancho de cada tarjeta definido en CSS:
           se ven varias promociones y la siguiente asoma al deslizar.
        */
        carrusel = new Splide(carruselRaiz, {
            autoWidth: true,
            perMove: 1,
            gap: '12px',
            pagination: false,
            drag: 'free',
            snap: true,
            speed: 400,
            focus: 0,
            omitEnd: true,
            i18n: {
                prev: 'Promociones anteriores',
                next: 'Promociones siguientes',
                slideLabel: '%s de %s',
            },
            breakpoints: { 768: { arrows: false } },
        });

        carrusel.mount();
    }

    function tarjeta(foto, indice) {
        const titulo = foto.titulo
            ? `<span class="promo__titulo">${escapar(foto.titulo)}</span>`
            : '';

        const cta = foto.enlace
            ? '<span class="promo__cta">Ver producto <i class="bi bi-arrow-right" aria-hidden="true"></i></span>'
            : '';

        const descuento = foto.descuento
            ? `<span class="promo__descuento${foto.descuentoClase ? ` promo__descuento--${foto.descuentoClase}` : ''}">${escapar(foto.descuento)}</span>`
            : '';

        const pie = (titulo || cta)
            ? `<span class="promo__pie">${titulo}${cta}</span>`
            : '';

        const contenido = `
            <span class="promo__media">
                ${descuento}
                <img src="${escapar(foto.imagen)}" alt="${escapar(foto.titulo || `Promoción ${indice + 1}`)}" loading="lazy" decoding="async" fetchpriority="low">
            </span>
            ${pie}
        `;

        if (!foto.enlace) {
            return `<div class="promo">${contenido}</div>`;
        }

        const externo = /^https?:\/\//i.test(foto.enlace);
        const extras = externo ? ' target="_blank" rel="noopener noreferrer"' : '';

        return `<a class="promo" href="${escapar(foto.enlace)}"${extras}>${contenido}</a>`;
    }

    function diapositiva(foto, indice) {
        return `<li class="splide__slide">${tarjeta(foto, indice)}</li>`;
    }

    function urlImagenPromocion(nombre) {
        return nombre ? `/imagenes/promociones/${encodeURIComponent(nombre)}` : '';
    }

    function textoDescuento(tipo, valor) {
        const numero = Number(valor) || 0;

        if (!tipo || numero <= 0) return '';

        if (tipo === 'porcentaje') {
            return `${Math.round(numero)}% DESCUENTO`;
        }

        if (tipo === 'monto') {
            return `-C$ ${numero.toFixed(2)}`;
        }

        if (tipo === 'precio') {
            return `Ahora C$ ${numero.toFixed(2)}`;
        }

        return '';
    }

    async function cargarDesdeErp() {
        if (!window.TiendaAPI?.get) return [];

        try {
            const datos = await window.TiendaAPI.get('/tienda/api/promociones');

            return (datos?.promociones || [])
                .map((promocion) => ({
                    imagen: urlImagenPromocion(promocion.imagen),
                    titulo: promocion.producto,
                    descuento: textoDescuento(promocion.tipo_descuento, promocion.valor_descuento),
                    descuentoClase: promocion.tipo_descuento,
                    enlace: `/producto?p=${Number(promocion.id_producto)}`,
                }))
                .filter((promocion) => promocion.imagen);
        } catch (error) {
            console.warn('No se pudieron cargar las promociones del ERP.', error);

            return [];
        }
    }

    async function cargar() {
        try {
            const promocionesErp = await cargarDesdeErp();

            if (promocionesErp.length) {
                contenedor.innerHTML = promocionesErp.map(diapositiva).join('');
                seccion.hidden = false;
                montarCarrusel();
                return;
            }

            const respuesta = await fetch('/tienda/recursos/data/promociones.json', {
                cache: 'no-store',
                headers: { Accept: 'application/json' },
            });

            if (!respuesta.ok) return;

            const datos = await respuesta.json();

            const fotos = (Array.isArray(datos) ? datos : [])
                .map((foto) => (typeof foto === 'string' ? { imagen: foto } : foto))
                .filter((foto) => foto && foto.imagen);

            if (!fotos.length) return;

            contenedor.innerHTML = fotos.map(diapositiva).join('');
            seccion.hidden = false;
            montarCarrusel();
        } catch (error) {
            console.warn('No se pudieron cargar las promociones.', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cargar);
    } else {
        cargar();
    }
})();
