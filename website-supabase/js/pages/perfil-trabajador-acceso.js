/* ╔══════════════════════════════════════════════════════════════╗
   ║  Trabaja con nosotros · acceso al modo trabajador            ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    const contenedor = document.getElementById('accesoTrabajadorContenido');

    if (!contenedor) return;

    const RUTA_SOLICITUD = '/tienda/trabaja-con-nosotros';
    const RUTA_PANEL = '/tienda/trabajador';

    const ESTADOS = {
        pendiente: { texto: 'Solicitud en revisión', clase: 'pendiente', icono: 'bi-hourglass-split' },
        aprobado: { texto: 'Trabajador aprobado', clase: 'aprobado', icono: 'bi-patch-check-fill' },
        rechazado: { texto: 'Solicitud rechazada', clase: 'rechazado', icono: 'bi-x-circle' },
        suspendido: { texto: 'Cuenta suspendida', clase: 'suspendido', icono: 'bi-slash-circle' },
    };

    const escapar = window.TiendaUtil.escapar;

    let clienteActual = null;

    const modoActivo = () => window.tiendaModoTrabajador?.activo(clienteActual) ?? false;

    const guardarModo = (activo) => window.tiendaModoTrabajador?.definir(clienteActual, activo);

    const enlaceSolicitud = (texto, clase = 'btn-primario') => `
        <div class="perfil-trabajador__acciones">
            <a class="${clase}" href="${RUTA_SOLICITUD}">
                <i class="bi bi-truck" aria-hidden="true"></i> ${escapar(texto)}
            </a>
        </div>`;

    function pintarInvitado() {
        const destino = encodeURIComponent('/tienda/perfil#trabajo');

        contenedor.innerHTML = `
            <p class="perfil-card__texto">
                Inicia sesión para consultar tu solicitud de trabajo.
            </p>
            <div class="perfil-trabajador__acciones">
                <a class="btn-secundario" href="/tienda/login?redirect=${destino}">
                    <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i> Iniciar sesión
                </a>
            </div>`;
    }

    function pintarSinSolicitud() {
        contenedor.innerHTML = `
            <p class="perfil-card__texto">
                Todavía no has enviado tu solicitud. Únete al equipo y elige
                tus propios horarios.
            </p>
            ${enlaceSolicitud('Enviar mi solicitud')}`;
    }

    function pintarEstado(trabajador) {
        const estado = ESTADOS[trabajador?.estado_trabajador] || ESTADOS.pendiente;
        const motivo = trabajador?.motivo_rechazo
            ? `<p class="perfil-trabajador__motivo"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i> ${escapar(trabajador.motivo_rechazo)}</p>`
            : '';

        if (trabajador?.estado_trabajador === 'aprobado') {
            const activo = modoActivo();

            contenedor.innerHTML = `
                <div class="perfil-trabajador__modo">
                    <div class="perfil-trabajador__modo-info">
                        <span class="perfil-trabajador__modo-etiqueta">
                            <i class="bi bi-truck" aria-hidden="true"></i> Modo trabajador
                        </span>
                        <strong>Entra directo a tus pedidos al abrir la tienda</strong>
                    </div>
                    <label class="perfil-trabajador__modo-switch">
                        <input type="checkbox" id="checkModoTrabajador" role="switch" aria-label="Entrar directo al modo trabajador"${activo ? ' checked' : ''}>
                        <span class="perfil-trabajador__modo-slider" aria-hidden="true"></span>
                        <span class="perfil-trabajador__modo-texto">${activo ? 'Activado' : 'Desactivado'}</span>
                    </label>
                </div>
                <p class="perfil-trabajador__modo-ayuda">
                    <i class="bi bi-info-circle" aria-hidden="true"></i>
                    Si está activo, al entrar a la tienda irás directo a tus pedidos de delivery; si lo desactivas, verás la interfaz de cliente.
                </p>
                <div class="perfil-trabajador__acciones">
                    <a class="btn-primario" href="${RUTA_PANEL}">
                        <i class="bi bi-truck" aria-hidden="true"></i> Ir a mis pedidos
                    </a>
                    <a class="btn-secundario" href="${RUTA_SOLICITUD}">
                        <i class="bi bi-person" aria-hidden="true"></i> Ver mi solicitud
                    </a>
                </div>`;
            return;
        }

        const mensajes = {
            pendiente: 'Tu solicitud está en revisión. Te avisaremos cuando la tienda la apruebe.',
            rechazado: 'Puedes revisar el motivo y volver a enviar tus datos.',
            suspendido: 'Tu cuenta no está habilitada para recibir pedidos.',
        };

        contenedor.innerHTML = `
            <div class="perfil-trabajador__cabecera">
                <span class="perfil-trabajador__badge perfil-trabajador__badge--${estado.clase}">
                    <i class="bi ${estado.icono}" aria-hidden="true"></i> ${escapar(estado.texto)}
                </span>
            </div>
            <p class="perfil-card__texto">${escapar(mensajes[trabajador?.estado_trabajador] || '')}</p>
            ${motivo}
            ${enlaceSolicitud(trabajador?.estado_trabajador === 'rechazado' ? 'Volver a enviar' : 'Ver mi solicitud')}`;
    }

    async function iniciar() {
        try {
            if (typeof window.cargarSupabase === 'function') await window.cargarSupabase();

            const sesion = await window.sesionTiendaPromise;
            const cliente = sesion?.cliente || window.clienteTienda || null;

            if (!cliente) {
                pintarInvitado();
                return;
            }

            clienteActual = cliente;

            const respuesta = await window.TiendaAPI.get('/tienda/api/trabajador');
            const trabajador = respuesta?.trabajador || null;

            if (!trabajador) {
                pintarSinSolicitud();
                return;
            }

            pintarEstado(trabajador);
        } catch {
            contenedor.innerHTML = `
                <p class="perfil-card__texto">No pudimos cargar tu cuenta de trabajo.</p>
                ${enlaceSolicitud('Abrir mi solicitud')}`;
        }
    }

    contenedor.addEventListener('change', (evento) => {
        if (evento.target?.id !== 'checkModoTrabajador') return;

        const activo = evento.target.checked;

        guardarModo(activo);

        const texto = contenedor.querySelector('.perfil-trabajador__modo-texto');

        if (texto) texto.textContent = activo ? 'Activado' : 'Desactivado';

        if (activo) {
            window.location.href = RUTA_PANEL;
            return;
        }

        window.tiendaToast?.('Al entrar a la tienda verás la interfaz de cliente.', 'info');
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();
