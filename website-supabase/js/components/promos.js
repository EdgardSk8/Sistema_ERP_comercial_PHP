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

    const escapar = window.TiendaUtil.escapar;

    /* ╔══════════════════════════════════════════════════════════╗
       ║  Aviso de registro para visitantes sin sesión            ║
       ╚══════════════════════════════════════════════════════════╝ */

    /* Días que faltan para la fecha de apertura (TIENDA_APERTURA.fecha). */
    function diasParaApertura() {
        const fecha = String(window.TIENDA_APERTURA?.fecha || '').trim();

        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;

        const [anio, mes, dia] = fecha.split('-').map(Number);
        const objetivo = new Date(anio, mes - 1, dia);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const dias = Math.round((objetivo - hoy) / 86400000);

        return Number.isFinite(dias) ? dias : null;
    }

    /* Cuenta atrás del aviso: «Faltan 19 días», «Falta 1 día», «Es hoy»… */
    function cuentaAtras() {
        const dias = diasParaApertura();

        if (dias === null) return 'Próxima apertura';
        if (dias > 1) return `Faltan ${dias} días`;
        if (dias === 1) return 'Falta 1 día';
        if (dias === 0) return '¡Es hoy!';

        return 'Ya abrimos';
    }

    /* Textos del aviso para quien no tiene sesión. Con `TIENDA_APERTURA.activa`
       se pide esperar la gran apertura del 15 de diciembre. */
    function avisoVisitante() {
        if (window.TIENDA_APERTURA && window.TIENDA_APERTURA.activa) {
            return {
                cifra: '15',
                unidad: 'Diciembre',
                etiqueta: cuentaAtras(),
                titulo: 'GRAN APERTURA',
                detalle: 'Te esperamos el 15 de diciembre con el 10% de bienvenida y el sorteo de 3 pares de zapatos.',
                boton: 'Crear mi cuenta',
                /* El registro está cerrado hasta la apertura. */
                mostrarBoton: false,
                lazo: true,
                redes: true,
            };
        }

        return {
            cifra: '10%',
            unidad: 'Descuento',
            etiqueta: 'Solo por registrarte',
            titulo: 'Regístrate y obtén 10% de descuento',
            detalle: 'Tu descuento de bienvenida se aplica en tu primera compra de zapatos.',
            boton: 'Crear mi cuenta',
            mostrarBoton: true,
            lazo: false,
            redes: false,
        };
    }

    /*
       Arranca oculto: solo se muestra cuando la sesión ya se resolvió y no
       hay cliente, para no enseñar la invitación a quien ya tiene cuenta.
    */
    function aplicarSesion(cliente) {
        const aviso = document.getElementById('promosAviso');
        if (!aviso) return;

        const descuento = cliente?.descuento || null;
        const usado = Boolean(cliente?.descuento_primera_compra_usado);

        /* Sin sesión: invita a registrarse. Con sesión y sin descuento:
           invita a activarlo. Si ya lo tiene o ya lo usó, no molesta. */
        if (cliente && (descuento || usado)) {
            aviso.hidden = true;
            return;
        }

        aviso.hidden = false;

        const etiqueta = aviso.querySelector('.promos-aviso__etiqueta');
        const titulo = aviso.querySelector('.promos-aviso__titulo');
        const detalle = aviso.querySelector('.promos-aviso__detalle');
        const boton = aviso.querySelector('.promos-aviso__btn');
        const selloCifra = aviso.querySelector('.promos-aviso__sello-cifra');
        const selloUnidad = aviso.querySelector('.promos-aviso__sello-unidad');

        if (!cliente) {
            const texto = avisoVisitante();
            if (selloCifra) selloCifra.textContent = texto.cifra;
            if (selloUnidad) selloUnidad.textContent = texto.unidad;
            if (etiqueta) etiqueta.textContent = texto.etiqueta;
            if (titulo) titulo.textContent = texto.titulo;
            if (detalle) detalle.textContent = texto.detalle;
            if (boton) {
                boton.href = window.urlTienda ? window.urlTienda('login') : '/login';
                boton.innerHTML = `${texto.boton} <i class="bi bi-arrow-right" aria-hidden="true"></i>`;
                boton.hidden = texto.mostrarBoton === false;
            }
            return;
        }

        if (etiqueta) etiqueta.textContent = 'Tu beneficio';
        if (titulo) titulo.textContent = 'Activa tu 10% de bienvenida';
        if (detalle) detalle.textContent = 'Completa los datos de tu perfil y aplícalo en tu primera compra de zapatos.';
        if (boton) {
            const destino = window.urlTienda ? window.urlTienda('perfil') : '/perfil';
            boton.href = `${destino}#descuentos`;
            boton.innerHTML = 'Activar mi 10% <i class="bi bi-arrow-right" aria-hidden="true"></i>';
            boton.hidden = false;
        }
    }

    function montarAvisoRegistro() {
        if (document.getElementById('promosAviso')) return;

        const destino = window.urlTienda ? window.urlTienda('login') : '/login';
        const texto = avisoVisitante();

        const aviso = document.createElement('div');
        aviso.className = 'promos-aviso';
        aviso.id = 'promosAviso';
        aviso.hidden = true;

        aviso.innerHTML = `
            <span class="promos-aviso__sello" aria-hidden="true">
                <strong class="promos-aviso__sello-cifra">${texto.cifra}</strong>
                <small class="promos-aviso__sello-unidad">${texto.unidad}</small>
            </span>
            <div class="promos-aviso__texto">
                <span class="promos-aviso__etiqueta">${texto.etiqueta}</span>
                <p class="promos-aviso__titulo">${texto.titulo}</p>
                <p class="promos-aviso__detalle">${texto.detalle}</p>
                ${texto.redes ? `
                <div class="promos-aviso__redes">
                    <a class="promos-aviso__red" href="https://www.instagram.com/tellez.store.nic/" target="_blank" rel="noopener noreferrer">
                        <i class="bi bi-instagram" aria-hidden="true"></i>
                        Seguir en Instagram
                    </a>
                    <a class="promos-aviso__red promos-aviso__red--facebook" href="https://www.facebook.com/profile.php?id=61594097712925" target="_blank" rel="noopener noreferrer">
                        <i class="bi bi-facebook" aria-hidden="true"></i>
                        Seguir en Facebook
                    </a>
                </div>` : ''}
            </div>
            <a class="promos-aviso__btn" href="${escapar(destino)}"${texto.mostrarBoton === false ? ' hidden' : ''}>
                ${texto.boton} <i class="bi bi-arrow-right" aria-hidden="true"></i>
            </a>
            ${texto.lazo ? `<img class="promos-aviso__lazo" src="/tienda/recursos/img/lazo.png?v=20261126b" alt="" width="300" height="300" decoding="async">` : ''}
        `;

        /* El contenedor exclusivo queda fuera de #promos para que el aviso
           siga visible cuando no hay promociones que mostrar. */
        const contenedorAviso = document.getElementById('promosAvisoContenedor');

        if (contenedorAviso) {
            contenedorAviso.appendChild(aviso);
            return;
        }

        const ancla = carruselRaiz || contenedor;
        ancla.parentNode.insertBefore(aviso, ancla);
    }

    montarAvisoRegistro();

    /* En la portada Supabase se carga bajo demanda. Si hay una sesión
       guardada, la resolvemos para no mostrar la invitación de registro a
       alguien que ya tiene cuenta. */
    const sesionParaAviso = (() => {
        if (window.sesionTiendaPromise) return window.sesionTiendaPromise;

        try {
            const hayToken = Object.keys(localStorage)
                .some((clave) => /^sb-.*-auth-token$/.test(clave));

            if (hayToken && typeof window.cargarSupabase === 'function') {
                return window.cargarSupabase();
            }
        } catch {
            /* sin almacenamiento: se comporta como visitante */
        }

        return Promise.resolve(null);
    })();

    sesionParaAviso
        .then((datos) => aplicarSesion(datos?.cliente))
        .catch(() => aplicarSesion(null));

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

        const fuente = `src="${escapar(foto.imagen)}" loading="lazy" fetchpriority="low"`;
        const srcset = window.srcsetImagen?.(foto.imagen) || '';
        const tamano = srcset
            ? `srcset="${escapar(srcset)}" sizes="(min-width: 992px) 340px, 270px"`
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
        const texto = String(nombre ?? '').trim();

        if (!texto) return '';
        if (/^https?:\/\//i.test(texto) || texto.startsWith('/')) return texto;
        if (/^[a-z0-9._\-/]+$/i.test(texto)) return `/imagenes/promociones/${encodeURIComponent(texto)}`;

        return '';
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
