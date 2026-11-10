/* ============================================================================
   Tienda · Login del panel administrador
   Usuario y contraseña del ERP validados por la RPC web_admin_login.
   ========================================================================== */

(() => {
    'use strict';

    const CLAVE_SESION = 'tienda_admin_sesion';
    const DESTINO = '/tienda/admin';
    const config = window.SUPABASE_CONFIG || {};
    const api = config.url ? `${String(config.url).replace(/\/+$/, '')}/rest/v1/rpc/` : '';

    const form = document.getElementById('adminLoginForm');
    const usuario = document.getElementById('adminUsuario');
    const clave = document.getElementById('adminClave');
    const error = document.getElementById('adminLoginError');
    const boton = document.getElementById('adminLoginBtn');
    const textoBoton = boton?.querySelector('.admin-btn__texto');
    const spinner = document.getElementById('adminLoginSpinner');
    const verClave = document.getElementById('adminVerClave');

    if (!form || !usuario || !clave || !boton) return;

    function sesionGuardada() {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null');
            return datos && datos.token && Number(datos.expira) > Date.now() ? datos : null;
        } catch {
            return null;
        }
    }

    function guardarSesion(datos) {
        const sesion = {
            token: datos.token,
            usuario: datos.usuario || '',
            rol: datos.rol || 'Administrador',
            expira: Date.now() + (Number(datos.expira_horas) || 12) * 60 * 60 * 1000,
        };

        try {
            localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
        } catch {
            /* Sin almacenamiento: la sesión solo vivirá en esta página. */
        }

        return sesion;
    }

    function mostrarError(mensaje) {
        if (!error) return;
        error.textContent = mensaje;
        error.hidden = false;
    }

    function ocultarError() {
        if (error) error.hidden = true;
    }

    function bloquear(activo) {
        boton.disabled = activo;
        if (spinner) spinner.hidden = !activo;
        if (textoBoton) textoBoton.textContent = activo ? 'Verificando…' : 'Entrar al panel';
    }

    async function rpc(nombre, parametros) {
        if (!api) throw new Error('Supabase no está configurado.');

        let respuesta;

        try {
            respuesta = await fetch(api + nombre, {
                method: 'POST',
                headers: {
                    apikey: config.key,
                    Authorization: `Bearer ${config.key}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(parametros),
            });
        } catch {
            throw new Error('No hay conexión con el servidor. Revisa tu internet.');
        }

        let datos = null;

        try {
            datos = await respuesta.json();
        } catch {
            datos = null;
        }

        if (!respuesta.ok) {
            throw new Error(datos?.mensaje || datos?.message || 'No se pudo iniciar sesión.');
        }

        return datos || {};
    }

    /* Si ya hay una sesión válida, no tiene sentido volver a pedir la clave. */
    const existente = sesionGuardada();

    if (existente) {
        window.location.replace(DESTINO);
        return;
    }

    const motivo = new URLSearchParams(window.location.search).get('motivo');

    if (motivo === 'expirada') {
        mostrarError('Tu sesión expiró. Ingresa de nuevo para continuar.');
    } else if (motivo === 'saliste') {
        mostrarError('Sesión cerrada correctamente.');
    }

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        ocultarError();

        const nombreUsuario = usuario.value.trim();
        const contrasena = clave.value;

        if (!nombreUsuario) {
            mostrarError('Escribe tu usuario del ERP.');
            usuario.focus();
            return;
        }

        if (!contrasena) {
            mostrarError('Escribe tu contraseña.');
            clave.focus();
            return;
        }

        bloquear(true);

        try {
            const datos = await rpc('web_admin_login', {
                p_usuario: nombreUsuario,
                p_clave: contrasena,
            });

            if (!datos.success || !datos.token) {
                mostrarError(datos.mensaje || 'Usuario o contraseña incorrectos.');
                clave.value = '';
                clave.focus();
                return;
            }

            guardarSesion(datos);
            window.location.replace(DESTINO);
        } catch (fallo) {
            mostrarError(fallo.message || 'No se pudo iniciar sesión.');
        } finally {
            bloquear(false);
        }
    });

    [usuario, clave].forEach((campo) => {
        campo.addEventListener('input', ocultarError);
    });

    verClave?.addEventListener('click', () => {
        const mostrando = clave.type === 'text';
        clave.type = mostrando ? 'password' : 'text';
        verClave.setAttribute('aria-label', mostrando ? 'Mostrar contraseña' : 'Ocultar contraseña');
        verClave.setAttribute('aria-pressed', String(!mostrando));
        verClave.querySelector('i')?.classList.toggle('bi-eye', mostrando);
        verClave.querySelector('i')?.classList.toggle('bi-eye-slash', !mostrando);
        clave.focus();
    });
})();
