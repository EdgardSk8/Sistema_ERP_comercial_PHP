/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Fotos de productos y descuentos                     ║
   ║  Se muestran al final del catálogo y de la ficha de producto  ║
   ║  Carrusel horizontal con Splide (arrastrar y flechas)         ║
   ║  Configuración: data/promociones.json                         ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    const seccion = document.getElementById('promos');
    const contenedor = document.getElementById('promosGrid');
    const enlaceNav = document.getElementById('navPromociones');

    if (!seccion || !contenedor) return;

    /* El enlace del header solo aparece cuando hay promociones que mostrar. */
    function mostrarSeccion() {
        seccion.hidden = false;
        if (enlaceNav) enlaceNav.hidden = false;
    }

    const carruselRaiz = contenedor.closest('.splide');
    let carrusel = null;
    let promocionesDesdeErp = false;

    /* ╔══════════════════════════════════════════════════════════╗
       ║  Splide a demanda                                         ║
       ║  La sección está bajo el pliegue: no bloquea la carga.    ║
       ╚══════════════════════════════════════════════════════════╝ */
    const SPLIDE_CSS_URL = 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css';
    const SPLIDE_JS_URL = 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js';
    let splideCargando = null;

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

    function cargarSplide() {
        if (typeof Splide !== 'undefined') return Promise.resolve();
        if (splideCargando) return splideCargando;

        splideCargando = (async () => {
            try {
                const cssListo = cargarCss(SPLIDE_CSS_URL);
                await cargarScript(SPLIDE_JS_URL);
                await cssListo;
            } catch (error) {
                console.warn('No se pudo cargar el carrusel de promociones.', error);
            }
        })();

        return splideCargando;
    }

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

    async function montarCarrusel() {
        if (!carruselRaiz) return false;

        if (typeof Splide === 'undefined') await cargarSplide();
        if (typeof Splide === 'undefined') return false;

        if (carrusel) {
            carrusel.destroy(true);
            carrusel = null;
        }

        if (!contenedor.children.length) return false;

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
            lazyLoad: 'nearby',
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
        return true;
    }

    function programarCarrusel() {
        if (!carruselRaiz) return;

        if (carrusel) {
            void montarCarrusel();
            return;
        }

        const visible = () => seccion.getBoundingClientRect().top < window.innerHeight - 40;

        if (visible()) {
            void montarCarrusel();
            return;
        }

        const alDesplazar = () => {
            if (!visible()) return;
            window.removeEventListener('scroll', alDesplazar);
            void montarCarrusel();
        };

        window.addEventListener('scroll', alDesplazar, { passive: true });
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

        const fuente = indice === 0
            ? `src="${escapar(foto.imagen)}" loading="lazy" fetchpriority="low"`
            : `data-splide-lazy="${escapar(foto.imagen)}" loading="lazy" fetchpriority="low"`;
        const srcset = window.srcsetImagen?.(foto.imagen) || '';
        const atributo = indice === 0 ? 'srcset' : 'data-splide-lazy-srcset';
        const tamano = srcset
            ? `${atributo}="${escapar(srcset)}" sizes="(min-width: 992px) 340px, 270px"`
            : '';

        const contenido = `
            <span class="promo__media">
                ${descuento}
                <img ${fuente} ${tamano} alt="${escapar(foto.titulo || `Promoción ${indice + 1}`)}" width="270" height="270" decoding="async"
                     onerror="if(!this.dataset.original){this.dataset.original='1';this.removeAttribute('srcset');this.removeAttribute('data-splide-lazy-srcset');this.src='${escapar(foto.imagen)}';}">
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
                promocionesDesdeErp = true;
                contenedor.innerHTML = promocionesErp.map(diapositiva).join('');
                mostrarSeccion();
                programarCarrusel();
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
            mostrarSeccion();
            programarCarrusel();
        } catch (error) {
            console.warn('No se pudieron cargar las promociones.', error);
        }
    }

    /* Si la home cargó el respaldo estático, se refresca al resolver la sesión. */
    document.addEventListener('tienda:sesion', () => {
        if (!promocionesDesdeErp && window.TiendaAPI?.get) cargar();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cargar);
    } else {
        cargar();
    }
})();
