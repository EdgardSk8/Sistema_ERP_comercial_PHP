/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · acceso directo al modo trabajador                  ║
   ║  - Agrega «Modo trabajador» al menú si está aprobado.        ║
   ║  - Si la preferencia está activa, la portada abre el panel.  ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    const RUTA_PANEL = '/tienda/trabajador';
    const CLAVE_PREFERENCIA = 'tienda_modo_trabajador';
    const RUTAS_ENTRADA = ['/', '/tienda', '/tienda/'];

    const clavePreferencia = (cliente) => (cliente?.id_cliente
        ? `${CLAVE_PREFERENCIA}:${cliente.id_cliente}`
        : CLAVE_PREFERENCIA);

    function preferenciaActiva(cliente) {
        try {
            return localStorage.getItem(clavePreferencia(cliente)) === '1';
        } catch {
            return false;
        }
    }

    function definirPreferencia(cliente, activo) {
        try {
            const clave = clavePreferencia(cliente);

            if (activo) localStorage.setItem(clave, '1');
            else localStorage.removeItem(clave);
        } catch {
            /* Sin almacenamiento local: se ignora la preferencia. */
        }
    }

    window.tiendaModoTrabajador = {
        activo: preferenciaActiva,
        definir: definirPreferencia,
    };

    function hayPreferenciaGuardada() {
        try {
            return Object.keys(localStorage).some((clave) => (
                (clave === CLAVE_PREFERENCIA || clave.startsWith(`${CLAVE_PREFERENCIA}:`))
                && localStorage.getItem(clave) === '1'
            ));
        } catch {
            return false;
        }
    }

    function mostrarAccesoMenu() {
        document.querySelectorAll('#menuPerfil .perfil__lista').forEach((lista) => {
            const existente = lista.querySelector('[data-menu-trabajador]');

            if (existente) {
                existente.hidden = false;
                return;
            }

            const item = document.createElement('li');
            item.dataset.menuTrabajador = '';
            item.innerHTML = `<a class="perfil__item" href="${RUTA_PANEL}">
                <i class="bi bi-truck"></i> Modo trabajador
            </a>`;
            lista.prepend(item);
        });
    }

    let carga = null;

    function iniciar() {
        if (carga) return carga;

        carga = (async () => {
            try {
                let sesion = null;

                if (typeof window.cargarSupabase === 'function') {
                    sesion = await window.cargarSupabase().catch(() => null);
                } else if (window.sesionTiendaPromise) {
                    sesion = await window.sesionTiendaPromise.catch(() => null);
                }

                const cliente = sesion?.cliente || window.clienteTienda || null;

                if (!cliente || !window.TiendaAPI) return;

                const respuesta = await window.TiendaAPI.get('/tienda/api/trabajador');
                const trabajador = respuesta?.trabajador || null;

                if (trabajador?.estado_trabajador !== 'aprobado') return;

                mostrarAccesoMenu();

                if (preferenciaActiva(cliente) && RUTAS_ENTRADA.includes(window.location.pathname)) {
                    window.location.replace(RUTA_PANEL);
                }
            } catch {
                /* Sin sesión o sin conexión: la tienda sigue funcionando. */
            }
        })();

        return carga;
    }

    function vigilarMenu() {
        document.querySelectorAll('#menuPerfil').forEach((menu) => {
            menu.addEventListener('toggle', () => {
                if (menu.open) void iniciar();
            });
        });
    }

    function arrancar() {
        vigilarMenu();

        /* Sin preferencia guardada, la sesión se pide al abrir el menú (carga diferida). */
        if (hayPreferenciaGuardada() || document.querySelector('#menuPerfil[open]')) {
            void iniciar();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', arrancar, { once: true });
    } else {
        arrancar();
    }
})();
