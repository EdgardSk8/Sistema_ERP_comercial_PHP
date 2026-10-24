export default function initManual() {

    const vista = document.querySelector('.manual-view');
    const nav = document.getElementById('manualNav');

    if (!vista || !nav) return;

    const titulo = document.getElementById('titulo');
    if (titulo) titulo.textContent = 'MANUAL DE USO';

    /* ═════════════ NIVEL DE DETALLE ═════════════ */

    const radiosModo = Array.from(document.querySelectorAll('input[name="manualModo"]'));

    const aplicarModo = modo => {
        vista.classList.toggle('modo-simple', modo === 'simple');
        radiosModo.forEach(radio => {
            radio.checked = radio.value === modo;
        });
    };

    let modoGuardado = 'simple';

    try {
        modoGuardado = localStorage.getItem('manualModo') || 'simple';
    } catch (_) {}

    aplicarModo(modoGuardado);

    radiosModo.forEach(radio => {
        radio.addEventListener('change', () => {
            if (!radio.checked) return;
            aplicarModo(radio.value);
            try {
                localStorage.setItem('manualModo', radio.value);
            } catch (_) {}
        });
    });

    const enlacesNav = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const enlaces = Array.from(vista.querySelectorAll('a[href^="#"]'));

    // Son enlaces internos del manual: Turbo no debe interceptarlos ni recargar el frame.
    enlaces.forEach(enlace => enlace.setAttribute('data-turbo', 'false'));

    const irASeccion = (destino, actualizarHash = true) => {
        if (!destino) return;

        destino.scrollIntoView({ behavior: 'smooth', block: 'start' });

        if (actualizarHash) {
            history.replaceState(null, '', `#${destino.id}`);
        }
    };

    // Navegación suave dentro del contenedor del manual (menú lateral y chips).
    enlaces.forEach(enlace => {
        enlace.addEventListener('click', event => {
            const destino = document.querySelector(enlace.getAttribute('href'));
            if (!destino) return;

            event.preventDefault();
            event.stopPropagation();
            irASeccion(destino);
        });
    });

    // Resalta el grupo que se está viendo.
    const destinos = enlacesNav
        .map(enlace => document.querySelector(enlace.getAttribute('href')))
        .filter(Boolean);

    const resaltar = id => {
        enlacesNav.forEach(enlace => {
            enlace.classList.toggle('is-active', enlace.getAttribute('href') === `#${id}`);
        });
    };

    if ('IntersectionObserver' in window) {
        const observador = new IntersectionObserver(entradas => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) resaltar(entrada.target.id);
            });
        }, {
            root: vista,
            rootMargin: '-5% 0px -80% 0px',
            threshold: 0
        });

        destinos.forEach(destino => observador.observe(destino));
    }

    // Si la URL ya trae una sección, se respeta al entrar al manual.
    if (location.hash) {
        const destinoInicial = document.getElementById(location.hash.slice(1));

        if (destinoInicial) {
            requestAnimationFrame(() => irASeccion(destinoInicial, false));
        }
    }

    // Botón para volver al inicio del manual.
    const boton = document.getElementById('manualVolverArriba');

    if (boton) {
        vista.addEventListener('scroll', () => {
            boton.classList.toggle('visible', vista.scrollTop > 400);
        }, { passive: true });

        boton.addEventListener('click', () => {
            vista.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}
