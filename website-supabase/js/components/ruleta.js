/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Sorteo de zapatos y ruleta                         ║
   ║  Nombres reales: Supabase público o API del ERP              ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    const seccion = document.getElementById('rifa');

    if (!seccion) return;

    const premio = document.getElementById('rifaPremio');
    const premioCarrusel = document.getElementById('rifaPremioCarrusel');
    const premioAnterior = document.getElementById('rifaPremioAnterior');
    const premioSiguiente = document.getElementById('rifaPremioSiguiente');
    const premioImagen = document.getElementById('rifaPremioImagen');
    const premioImagenSiguiente = document.getElementById('rifaPremioImagenSiguiente');

    const API_CLIENTES = '/tienda/api/ruleta/clientes';
    const API_INSTAGRAM = '/tienda/recursos/data/ruleta-instagram.json';
    const CLAVE_SESION_ADMIN = 'tienda_admin_sesion';
    const VELOCIDAD_GIRO = (Math.PI * 2) / 20000; // Una vuelta cada 50 segundos.
    const INTERVALO_CARRUSEL = 4200;

    /* Paleta oscura: el texto blanco se lee en todos los segmentos. */
    const COLORES = ['#0e5a34', '#c1121f', '#1f6f43', '#9d0208', '#2d6a4f', '#b3261e'];

    const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finSorteo = new Date(seccion.dataset.finSorteo || '');
    const sorteoFinalizado = !Number.isNaN(finSorteo.getTime()) && Date.now() >= finSorteo.getTime();

    /* Una entrada por bloque [data-ruleta]: clientes e Instagram. */
    const ruletas = [];

    let reducido = movimientoReducido.matches;
    let seccionVisible = true;
    let ultimoCuadro = performance.now();
    let imagenesPremio = [];
    let indicePremio = 0;
    let capaVisible = premioImagen;
    let temporizadorPremio = null;
    let cambiandoPremio = false;

    const normalizarTexto = (valor) => String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    /* El logo se preescala una sola vez para no dibujar la imagen
       original de 1512 px en cada cuadro. */
    const logoRuleta = new Image();
    const logoCanvas = document.createElement('canvas');
    let logoListo = false;

    logoCanvas.width = 256;
    logoCanvas.height = 256;

    const logoCtx = logoCanvas.getContext('2d');

    logoRuleta.addEventListener('load', () => {
        if (!logoCtx) return;

        logoCtx.clearRect(0, 0, 256, 256);
        logoCtx.drawImage(logoRuleta, 0, 0, 256, 256);
        logoListo = true;
        ruletas.forEach((ruleta) => dibujar(ruleta));
    });

    logoRuleta.src = '/imagenes/logo/LOGOTIPO-SIN-FONDO.PNG';

    /* ╔══════════════════════════════════════════════════════════╗
       ║  Dibujo de la ruleta                                     ║
       ╚══════════════════════════════════════════════════════════╝ */

    function ajustarLienzo(ruleta) {
        const { canvas, ctx } = ruleta;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const ancho = Math.max(160, Math.round(canvas.clientWidth || 320));

        canvas.width = Math.round(ancho * dpr);
        canvas.height = Math.round(ancho * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ruleta.lado = ancho;
        dibujar(ruleta);
    }

    function dibujarCentro(ruleta, centro, radio) {
        const { ctx } = ruleta;
        const radioCentro = radio * 0.24;

        ctx.beginPath();
        ctx.arc(centro, centro, radioCentro, 0, Math.PI * 2);
        ctx.fillStyle = '#fff8ec';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#e3b341';
        ctx.stroke();

        if (!logoListo) return;

        const ladoLogo = radio * 0.31;

        ctx.drawImage(
            logoCanvas,
            centro - ladoLogo / 2,
            centro - ladoLogo / 2,
            ladoLogo,
            ladoLogo
        );
    }

    function dibujar(ruleta) {
        const { ctx, nombres } = ruleta;
        const centro = ruleta.lado / 2;
        const radio = centro - 6;

        ctx.clearRect(0, 0, ruleta.lado, ruleta.lado);
        ctx.save();
        ctx.translate(centro, centro);

        if (!nombres.length) {
            ctx.beginPath();
            ctx.arc(0, 0, radio, 0, Math.PI * 2);
            ctx.fillStyle = '#efe6d4';
            ctx.fill();
            ctx.restore();
            dibujarCentro(ruleta, centro, radio);
            return;
        }

        const porcion = (Math.PI * 2) / nombres.length;

        ctx.rotate(ruleta.angulo);

        nombres.forEach((nombre, indice) => {
            const inicio = indice * porcion;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radio, inicio, inicio + porcion);
            ctx.closePath();
            ctx.fillStyle = COLORES[indice % COLORES.length];
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 248, 236, .38)';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        /* Con muchos clientes los rótulos se enciman: se ocultan y la
           ruleta sigue girando con los segmentos de color. */
        if (nombres.length <= 32) {
            const fuente = Math.max(8, Math.min(13, (radio * 2.4) / nombres.length + 5));

            nombres.forEach((nombre, indice) => {
                const centroSegmento = indice * porcion + porcion / 2;
                const recortado = nombre.length > 22 ? `${nombre.slice(0, 21)}…` : nombre;

                ctx.save();
                ctx.rotate(centroSegmento);
                ctx.font = `600 ${fuente}px Inter, system-ui, sans-serif`;
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(recortado, radio - 12, 0, radio * 0.66);
                ctx.restore();
            });
        }

        ctx.restore();
        dibujarCentro(ruleta, centro, radio);
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  Giro continuo (hasta la fecha del sorteo)               ║
       ╚══════════════════════════════════════════════════════════╝ */

    function animar() {
        const ahora = performance.now();
        const delta = Math.min(ahora - ultimoCuadro, 100);
        ultimoCuadro = ahora;

        if (!reducido && !document.hidden && seccionVisible) {
            ruletas.forEach((ruleta) => {
                if (ruleta.finalizada) return;

                ruleta.angulo += VELOCIDAD_GIRO * delta;

                /* ~30 fps: suficiente para un giro lento y menos consumo. */
                if (ahora - ruleta.ultimoDibujo > 32) {
                    dibujar(ruleta);
                    ruleta.ultimoDibujo = ahora;
                }
            });
        }

        requestAnimationFrame(animar);
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  Instancias: una ruleta por bloque [data-ruleta]         ║
       ╚══════════════════════════════════════════════════════════╝ */

    function crearRuleta(bloque) {
        const canvas = bloque.querySelector('.ruleta__lienzo');

        if (!canvas) return null;

        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        const limite = new Date(bloque.dataset.finSorteo || seccion.dataset.finSorteo || '');

        const ruleta = {
            bloque,
            fuente: bloque.dataset.fuente === 'instagram' ? 'instagram' : 'clientes',
            canvas,
            ctx,
            mensaje: bloque.querySelector('.ruleta__mensaje'),
            nota: bloque.querySelector('.ruleta__nota'),
            enlaceAdmin: bloque.querySelector('.ruleta__enlace-admin'),
            enlaceRed: bloque.querySelector('.ruleta__enlace-red'),
            finalizada: !Number.isNaN(limite.getTime()) && Date.now() >= limite.getTime(),
            nombres: [],
            angulo: 0,
            lado: 320,
            ultimoDibujo: 0,
        };

        if (ruleta.finalizada && ruleta.mensaje) {
            ruleta.mensaje.textContent = 'Sorteo finalizado. ¡Gracias por participar!';
        }

        if ('ResizeObserver' in window) {
            new ResizeObserver(() => ajustarLienzo(ruleta)).observe(canvas);
        } else {
            window.addEventListener('resize', () => ajustarLienzo(ruleta));
        }

        ajustarLienzo(ruleta);
        ruletas.push(ruleta);

        return ruleta;
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  Datos: clientes reales                                  ║
       ╚══════════════════════════════════════════════════════════╝ */

    function aplicarNombres(ruleta, lista, etiqueta) {
        ruleta.nombres = (lista || [])
            .map((nombre) => String(nombre ?? '').trim())
            .filter(Boolean);

        ruleta.canvas.setAttribute('aria-label', `Ruleta con ${ruleta.nombres.length} nombres participantes`);

        if (ruleta.nota) ruleta.nota.textContent = etiqueta;

        ajustarLienzo(ruleta);
    }

    function leerSesionAdmin() {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE_SESION_ADMIN) || 'null');
            return datos && datos.token && Number(datos.expira) > Date.now() ? datos : null;
        } catch {
            return null;
        }
    }

    function mostrarEnlaceAdmin(ruleta, mostrar) {
        if (ruleta.enlaceAdmin) ruleta.enlaceAdmin.hidden = !mostrar;
    }

    /* Clientes del panel administrativo de la tienda (Supabase).
       Funciona igual en Laravel y en la tienda estática. */
    async function clientesDesdeSupabase() {
        const sesion = leerSesionAdmin();
        const config = window.SUPABASE_CONFIG;

        if (!sesion?.token) return null;

        if (!config?.url || !config?.key) {
            throw new Error('Supabase no está configurado.');
        }

        let respuesta;

        try {
            respuesta = await fetch(`${String(config.url).replace(/\/+$/, '')}/rest/v1/rpc/web_admin_clientes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: config.key,
                    Authorization: `Bearer ${config.key}`,
                },
                body: JSON.stringify({ p_token: sesion.token }),
            });
        } catch {
            throw new Error('No hay conexión con el servidor.');
        }

        const datos = await respuesta.json().catch(() => null);

        if (respuesta.status === 404) {
            throw new Error('Falta habilitar la consulta de clientes en Supabase.');
        }

        if (!respuesta.ok) {
            throw new Error(datos?.mensaje || datos?.message || 'No se pudieron cargar los participantes.');
        }

        if (datos?.sesion === false) {
            try { localStorage.removeItem(CLAVE_SESION_ADMIN); } catch { /* sin storage */ }
            throw new Error('La sesión del panel expiró. Inicia sesión de nuevo.');
        }

        if (!datos?.success) {
            throw new Error(datos?.mensaje || 'No se pudieron cargar los participantes.');
        }

        return (datos.clientes || []).map((cliente) => cliente?.nombre).filter(Boolean);
    }

    /* Participantes públicos de la ruleta (Supabase, sin sesión).
       La función devuelve únicamente nombres de clientes activos. */
    async function clientesPublicosDesdeSupabase() {
        const config = window.SUPABASE_CONFIG;

        if (!config?.url || !config?.key) {
            throw new Error('Supabase no está configurado.');
        }

        let respuesta;

        try {
            respuesta = await fetch(`${String(config.url).replace(/\/+$/, '')}/rest/v1/rpc/web_clientes_ruleta`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: config.key,
                    Authorization: `Bearer ${config.key}`,
                },
                body: JSON.stringify({}),
            });
        } catch {
            throw new Error('No hay conexión con el servidor.');
        }

        const datos = await respuesta.json().catch(() => null);

        if (respuesta.status === 404) {
            throw new Error('Falta habilitar la consulta pública de participantes en Supabase.');
        }

        if (!respuesta.ok || !datos?.success) {
            throw new Error(datos?.mensaje || datos?.message || 'No se pudieron cargar los participantes.');
        }

        return (datos.clientes || []).map((cliente) => cliente?.nombre).filter(Boolean);
    }

    async function cargarClientes(ruleta) {
        if (ruleta.nota) ruleta.nota.textContent = 'Cargando participantes…';

        mostrarEnlaceAdmin(ruleta, false);

        let lista = null;
        let ultimoError = null;

        /* 1) Panel administrativo de la tienda (Supabase), si hay sesión. */
        if (leerSesionAdmin()) {
            try {
                lista = await clientesDesdeSupabase();
            } catch (error) {
                ultimoError = error;
            }
        }

        /* 2) Participantes públicos de Supabase, sin necesidad de sesión. */
        if (lista === null) {
            try {
                lista = await clientesPublicosDesdeSupabase();
            } catch (error) {
                ultimoError = error;
            }
        }

        /* 3) API del ERP cuando la tienda corre bajo Laravel con sesión del personal. */
        if (lista === null) {
            try {
                const respuesta = await fetch(API_CLIENTES, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });
                const datos = await respuesta.json().catch(() => null);

                if (respuesta.ok && datos?.success) {
                    lista = (datos.clientes || []).map((cliente) => cliente?.nombre);
                } else {
                    ultimoError = new Error(datos?.mensaje || 'La API del ERP no respondió.');
                }
            } catch (error) {
                ultimoError = error;
            }
        }

        if (lista === null) {
            if (ruleta.nota) {
                ruleta.nota.textContent = leerSesionAdmin()
                    ? (ultimoError?.message || 'No se pudieron cargar los participantes.')
                    : 'No se pudieron cargar los participantes. Intenta de nuevo en unos minutos.';
            }

            mostrarEnlaceAdmin(ruleta, true);
            console.warn('Ruleta: no se pudieron cargar los participantes.', ultimoError);
            return;
        }

        if (!lista.length) {
            aplicarNombres(ruleta, [], 'No hay participantes registrados para el sorteo.');
            return;
        }

        mostrarEnlaceAdmin(ruleta, false);
        aplicarNombres(ruleta, lista, `${lista.length} participantes registrados.`);
    }

    /* Participantes de Instagram: lista curada en data/ruleta-instagram.json.
       El bloque se oculta mientras no haya nombres cargados. */
    async function cargarInstagram(ruleta) {
        let datos = null;

        try {
            const respuesta = await fetch(API_INSTAGRAM, {
                headers: { Accept: 'application/json' },
                cache: 'no-cache',
            });

            if (respuesta.ok) datos = await respuesta.json();
        } catch {
            datos = null;
        }

        const lista = (datos?.participantes || [])
            .map((nombre) => String(nombre ?? '').trim().replace(/^@+/, ''))
            .filter(Boolean);

        if (!lista.length) {
            ocultarRuleta(ruleta);
            return;
        }

        mostrarRuleta(ruleta);
        aplicarNombres(ruleta, lista, etiquetaInstagram(lista.length, datos?.actualizado));
        mostrarPublicacion(ruleta, datos?.publicacion);
    }

    function mostrarRuleta(ruleta) {
        const panel = ruleta.bloque.closest('.rifa__instagram');

        if (panel) panel.hidden = false;

        ajustarLienzo(ruleta);
    }

    function ocultarRuleta(ruleta) {
        const panel = ruleta.bloque.closest('.rifa__instagram');

        if (panel) panel.hidden = true;
    }

    function etiquetaInstagram(total, actualizado) {
        const participantes = total === 1
            ? '1 seguidor de Instagram'
            : `${total} seguidores de Instagram`;
        const fecha = new Date(actualizado || '');

        if (Number.isNaN(fecha.getTime())) return `${participantes}.`;

        const corta = fecha.toLocaleDateString('es-NI', { day: 'numeric', month: 'short' });

        return `${participantes} · lista del ${corta}.`;
    }

    function mostrarPublicacion(ruleta, publicacion) {
        if (!ruleta.enlaceRed) return;

        if (!/^https:\/\/(www\.)?instagram\.com\//i.test(String(publicacion || ''))) {
            ruleta.enlaceRed.hidden = true;
            return;
        }

        ruleta.enlaceRed.href = publicacion;
        ruleta.enlaceRed.hidden = false;
    }

    /* ╔══════════════════════════════════════════════════════════╗
       ║  Carrusel del premio (solo categoría Zapatos)            ║
       ╚══════════════════════════════════════════════════════════╝ */

    function programarCarrusel() {
        window.clearTimeout(temporizadorPremio);

        if (imagenesPremio.length < 2 || reducido || sorteoFinalizado
            || document.hidden || !seccionVisible) {
            return;
        }

        temporizadorPremio = window.setTimeout(() => {
            mostrarPremio(1);
        }, INTERVALO_CARRUSEL);
    }

    function mostrarPremio(paso = 1) {
        if (cambiandoPremio || imagenesPremio.length < 2) return;

        const siguienteIndice = (indicePremio + paso + imagenesPremio.length) % imagenesPremio.length;
        const siguiente = imagenesPremio[siguienteIndice];
        const entrante = capaVisible === premioImagen ? premioImagenSiguiente : premioImagen;
        const saliente = capaVisible;

        cambiandoPremio = true;
        entrante.onload = null;
        entrante.onerror = null;

        const terminar = () => {
            entrante.onload = null;
            entrante.onerror = null;
            entrante.classList.add('rifa__premio-img--activa');
            saliente.classList.remove('rifa__premio-img--activa');
            saliente.alt = '';
            capaVisible = entrante;
            indicePremio = siguienteIndice;

            window.setTimeout(() => {
                cambiandoPremio = false;
            }, 250);

            programarCarrusel();
        };

        const fallar = () => {
            entrante.onload = null;
            entrante.onerror = null;
            indicePremio = siguienteIndice;
            cambiandoPremio = false;
            programarCarrusel();
        };

        entrante.onload = terminar;
        entrante.onerror = fallar;
        entrante.src = siguiente.src;
        entrante.alt = siguiente.alt;

        if (entrante.complete && entrante.naturalWidth > 0) {
            terminar();
        }
    }

    function iniciarCarruselPremio(lista) {
        imagenesPremio = lista;
        indicePremio = 0;
        capaVisible = premioImagen;
        cambiandoPremio = false;

        premioImagenSiguiente.classList.remove('rifa__premio-img--activa');
        premioImagenSiguiente.removeAttribute('src');
        premioImagenSiguiente.alt = '';
        premioImagenSiguiente.onload = null;
        premioImagenSiguiente.onerror = null;

        premioImagen.onload = null;
        premioImagen.onerror = null;
        premioImagen.src = lista[0].src;
        premioImagen.alt = lista[0].alt;
        premioImagen.classList.add('rifa__premio-img--activa');

        programarCarrusel();
    }

    document.addEventListener('tienda:productos', (evento) => {
        const productos = evento.detail?.productos || [];
        const media = seccion.querySelector('.rifa__media');

        if (!premio || !premioImagen || !premioImagenSiguiente) return;

        const zapatos = productos.filter((producto) => normalizarTexto(producto?.categoria) === 'zapatos'
            && Boolean(producto?.imagen));
        const enStock = zapatos.filter((producto) => Number(producto?.stock) > 0);
        const disponibles = enStock.length ? enStock : zapatos;

        const vistos = new Set();
        const imagenes = [];

        disponibles.forEach((producto) => {
            if (vistos.has(producto.imagen)) return;

            vistos.add(producto.imagen);
            imagenes.push({
                src: producto.imagen,
                alt: `Zapatos del sorteo: ${producto.nombre}`,
            });
        });

        if (!imagenes.length) {
            premio.hidden = true;
            media?.classList.add('rifa__media--sin-premio');
            return;
        }

        media?.classList.remove('rifa__media--sin-premio');
        premio.hidden = false;
        iniciarCarruselPremio(imagenes);
    });

    /* ╔══════════════════════════════════════════════════════════╗
       ║  Arranque                                                ║
       ╚══════════════════════════════════════════════════════════╝ */

    premioAnterior?.addEventListener('click', () => mostrarPremio(-1));
    premioSiguiente?.addEventListener('click', () => mostrarPremio(1));

    premioCarrusel?.addEventListener('keydown', (evento) => {
        if (evento.key === 'ArrowLeft') {
            evento.preventDefault();
            mostrarPremio(-1);
        } else if (evento.key === 'ArrowRight') {
            evento.preventDefault();
            mostrarPremio(1);
        }
    });

    let inicioArrastre = null;

    premioCarrusel?.addEventListener('pointerdown', (evento) => {
        if (evento.target.closest('.rifa__premio-nav')) return;
        inicioArrastre = evento.clientX;
    });

    premioCarrusel?.addEventListener('pointerup', (evento) => {
        if (inicioArrastre === null) return;

        const recorrido = evento.clientX - inicioArrastre;
        inicioArrastre = null;

        if (Math.abs(recorrido) < 30) return;

        mostrarPremio(recorrido < 0 ? 1 : -1);
    });

    premioCarrusel?.addEventListener('pointercancel', () => {
        inicioArrastre = null;
    });

    premioCarrusel?.addEventListener('dragstart', (evento) => {
        evento.preventDefault();
    });

    movimientoReducido.addEventListener?.('change', (evento) => {
        reducido = evento.matches;
        programarCarrusel();
    });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entradas) => {
            seccionVisible = entradas.some((entrada) => entrada.isIntersecting);
            programarCarrusel();
        }).observe(seccion);
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) programarCarrusel();
    });

    document.querySelectorAll('#rifa [data-ruleta]').forEach((bloque) => {
        const ruleta = crearRuleta(bloque);

        if (!ruleta) return;

        void (ruleta.fuente === 'instagram' ? cargarInstagram(ruleta) : cargarClientes(ruleta));
    });

    requestAnimationFrame(animar);
})();
