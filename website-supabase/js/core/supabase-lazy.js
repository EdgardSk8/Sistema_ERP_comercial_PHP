/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Supabase bajo demanda                               ║
   ║  El catálogo se pinta sin esperar autenticación.              ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    const SUPABASE_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    const CONFIG_URL = '/tienda/recursos/js/core/supabase-config.js';
    const API_URL = '/tienda/recursos/js/core/supabase-api.js?v=20261111b';

    let carga = null;

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

    window.cargarSupabase = function cargarSupabase() {
        if (window.sesionTiendaPromise && window.TiendaAPI) {
            return Promise.resolve(window.sesionTiendaPromise);
        }

        if (carga) return carga;

        carga = (async () => {
            try {
                if (!window.supabase) await cargarScript(SUPABASE_URL);
                if (!window.SUPABASE_CONFIG) await cargarScript(CONFIG_URL);
                if (!window.TiendaAPI) await cargarScript(API_URL);

                return window.sesionTiendaPromise;
            } catch (error) {
                console.warn('No se pudo cargar la sesión de la tienda.', error);
                return { success: false, autenticado: false, cliente: null };
            }
        })();

        return carga;
    };

    function anticipar() {
        void window.cargarSupabase();
    }

    /* La sesión se pide cuando la persona interactúa, no antes del catálogo. */
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((evento) => {
        window.addEventListener(evento, anticipar, { once: true, passive: true });
    });

    document.addEventListener('pointerover', (evento) => {
        if (evento.target.closest?.('.perfil, .btn-favorito')) anticipar();
    }, { passive: true });
})();
