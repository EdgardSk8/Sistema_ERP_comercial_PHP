/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Sesión del cliente y API compartida                ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    const tokenCsrf = () => {
        const coincidencia = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
        return coincidencia ? decodeURIComponent(coincidencia[1]) : '';
    };

    async function solicitar(url, opciones = {}) {
        const metodo = (opciones.method || 'GET').toUpperCase();
        const headers = { Accept: 'application/json', ...(opciones.headers || {}) };
        const mostrarCarga = Boolean(opciones.cargando);
        let body = opciones.body;

        if (body && typeof body === 'object' && !(body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(body);
        }

        if (!['GET', 'HEAD'].includes(metodo)) {
            const token = tokenCsrf();
            if (token) headers['X-XSRF-TOKEN'] = token;
        }

        // Spinner global solo si la llamada lo solicita.
        if (mostrarCarga && window.tiendaCargando) window.tiendaCargando(true);

        try {
            const respuesta = await fetch(url, {
                ...opciones,
                method: metodo,
                headers,
                body,
                credentials: 'same-origin',
            });

            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok) {
                const error = new Error(datos.mensaje || 'No se pudo completar la solicitud.');
                error.status = respuesta.status;
                error.data = datos;
                throw error;
            }

            return datos;
        } finally {
            if (mostrarCarga && window.tiendaCargando) window.tiendaCargando(false);
        }
    }

    window.TiendaAPI = {
        get: (url, opciones = {}) => solicitar(url, { ...opciones, method: 'GET' }),
        post: (url, body, opciones = {}) => solicitar(url, { ...opciones, method: 'POST', body }),
        put: (url, body, opciones = {}) => solicitar(url, { ...opciones, method: 'PUT', body }),
        delete: (url, opciones = {}) => solicitar(url, { ...opciones, method: 'DELETE' }),
        csrf: tokenCsrf,
    };

    function actualizarHeader(cliente) {
        document.querySelectorAll('.perfil__nombre').forEach((elemento) => {
            elemento.textContent = cliente ? cliente.nombre_cliente : 'Invitado';
        });

        document.querySelectorAll('.perfil__detalle').forEach((elemento) => {
            elemento.textContent = cliente
                ? `@${cliente.usuario_cliente}`
                : 'Sin sesión iniciada';
        });

        document.querySelectorAll('.perfil__item--salir, .perfil-nav__item--salir').forEach((elemento) => {
            elemento.hidden = !cliente;
        });

        // Dos menús distintos en el header: invitado y cliente con sesión.
        const menuInvitado = document.getElementById('menuInvitado');
        const menuCuenta = document.getElementById('menuPerfil');

        if (menuInvitado) {
            menuInvitado.hidden = Boolean(cliente);
            menuInvitado.open = false;
        }

        if (menuCuenta) {
            menuCuenta.hidden = !cliente;
            menuCuenta.open = false;
        }
    }

    window.sesionTiendaPromise = window.TiendaAPI.get('/tienda/api/auth/sesion')
        .then((datos) => {
            const cliente = datos.cliente || null;
            window.clienteTienda = cliente;
            actualizarHeader(cliente);
            document.dispatchEvent(new CustomEvent('tienda:sesion', { detail: { cliente } }));
            return datos;
        })
        .catch((error) => {
            console.error('No se pudo cargar la sesión de la tienda.', error);
            window.clienteTienda = null;
            actualizarHeader(null);
            document.dispatchEvent(new CustomEvent('tienda:sesion', { detail: { cliente: null } }));
            return { success: false, autenticado: false, cliente: null };
        });

    document.addEventListener('click', async (evento) => {
        const enlace = evento.target.closest('.perfil__item--salir, .perfil-nav__item--salir');
        if (!enlace) return;

        evento.preventDefault();

        if (!window.clienteTienda) {
            window.location.href = '/tienda/perfil#perfil';
            return;
        }

        try {
            await window.TiendaAPI.post('/tienda/api/auth/logout');
            if (window.tiendaToast) window.tiendaToast('Sesión cerrada.', 'info');
            window.location.href = '/tienda';
        } catch (error) {
            if (window.tiendaToast) window.tiendaToast(error.message, 'aviso');
        }
    });
})();
