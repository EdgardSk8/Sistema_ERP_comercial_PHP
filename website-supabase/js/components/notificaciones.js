/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tellez Nic Store · Notificaciones push                       ║
   ║  Registra el service worker y guarda el dispositivo del       ║
   ║  cliente para que le lleguen los avisos (celular y PC).       ║
   ╚══════════════════════════════════════════════════════════════╝ */

(function () {
    const RUTA_SW = '/sw.js';
    const CLAVE_CONFIG = 'PUSH_CONFIG';

    function config() {
        return window[CLAVE_CONFIG] || {};
    }

    function activo() {
        return config().activo !== false && Boolean(config().clavePublica);
    }

    function soportado() {
        return Boolean(window.isSecureContext
            && 'serviceWorker' in navigator
            && 'PushManager' in window
            && 'Notification' in window);
    }

    function esIOS() {
        return /iphone|ipad|ipod/i.test(navigator.userAgent)
            || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    function instalada() {
        return window.matchMedia?.('(display-mode: standalone)')?.matches
            || window.navigator.standalone === true;
    }

    /* En iPhone/iPad las notificaciones solo funcionan con la app en la pantalla de inicio. */
    function requiereInstalacion() {
        return esIOS() && !instalada();
    }

    function plataforma() {
        if (esIOS()) return 'ios';
        if (/android/i.test(navigator.userAgent)) return 'android';
        return 'escritorio';
    }

    function navegador() {
        const ua = navigator.userAgent;

        if (/Edg\//.test(ua)) return 'Edge';
        if (/OPR\//.test(ua)) return 'Opera';
        if (/Firefox\//.test(ua)) return 'Firefox';
        if (/Chrome\//.test(ua)) return 'Chrome';
        if (/Safari\//.test(ua)) return 'Safari';

        return 'Otro';
    }

    function permiso() {
        return soportado() ? Notification.permission : 'no-soportado';
    }

    function aBytes(valor) {
        const relleno = '='.repeat((4 - (valor.length % 4)) % 4);
        const base64 = (valor + relleno).replace(/-/g, '+').replace(/_/g, '/');
        const crudo = window.atob(base64);
        const bytes = new Uint8Array(crudo.length);

        for (let i = 0; i < crudo.length; i += 1) bytes[i] = crudo.charCodeAt(i);

        return bytes;
    }

    async function registrar() {
        if (!soportado()) return null;

        try {
            await navigator.serviceWorker.register(RUTA_SW, { scope: '/' });
            return await navigator.serviceWorker.ready;
        } catch (error) {
            console.warn('No se pudo registrar el service worker', error);
            return null;
        }
    }

    async function suscripcionActual() {
        const registro = await navigator.serviceWorker.getRegistration(RUTA_SW);

        return registro ? registro.pushManager.getSubscription() : null;
    }

    function datosSuscripcion(suscripcion) {
        const json = suscripcion.toJSON();

        return {
            endpoint: json.endpoint,
            p256dh: json.keys?.p256dh || '',
            auth: json.keys?.auth || '',
            plataforma: plataforma(),
            navegador: navegador(),
        };
    }

    async function guardar(suscripcion) {
        return window.TiendaAPI.post('/tienda/api/push', datosSuscripcion(suscripcion));
    }

    async function activar() {
        if (!activo()) throw new Error('Las notificaciones no están activadas en la tienda.');

        if (!soportado()) {
            throw new Error('Este navegador no permite notificaciones. Prueba con Chrome, Edge o Safari actualizado.');
        }

        if (requiereInstalacion()) {
            throw new Error('Para recibirlas en iPhone, primero añade la tienda a la pantalla de inicio y ábrela desde ahí.');
        }

        const permisoActual = await Notification.requestPermission();

        if (permisoActual !== 'granted') {
            throw new Error(permisoActual === 'denied'
                ? 'Bloqueaste las notificaciones. Actívalas en los ajustes del navegador para este sitio.'
                : 'No diste permiso para mostrar notificaciones.');
        }

        const registro = await registrar();

        if (!registro) throw new Error('No se pudo preparar el aviso en este dispositivo.');

        const existente = await registro.pushManager.getSubscription();
        const suscripcion = existente || await registro.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: aBytes(config().clavePublica),
        });

        await guardar(suscripcion);

        registro.showNotification('Notificaciones activadas', {
            body: 'Te avisaremos de las novedades de Tellez Nic Store en este dispositivo.',
            icon: '/icon-192.png',
            badge: '/favicon-32x32.png',
            tag: 'tellez-bienvenida',
            data: { url: '/' },
        }).catch(() => null);

        return datosSuscripcion(suscripcion);
    }

    async function desactivar() {
        const suscripcion = await suscripcionActual();

        if (!suscripcion) return null;

        const datos = datosSuscripcion(suscripcion);

        try {
            await window.TiendaAPI.post('/tienda/api/push/desactivar', { endpoint: datos.endpoint });
        } catch (error) {
            console.warn('No se pudo avisar al servidor que se desactivó', error);
        }

        await suscripcion.unsubscribe();

        return datos;
    }

    /* Vuelve a guardar la suscripción (el navegador pudo renovarla o el usuario entró en otro equipo). */
    async function sincronizar() {
        if (!activo() || !soportado() || permiso() !== 'granted') return false;

        const suscripcion = await suscripcionActual();

        if (!suscripcion) return false;

        try {
            await guardar(suscripcion);
            return true;
        } catch (error) {
            console.warn('No se pudo sincronizar la suscripción push', error);
            return false;
        }
    }

    async function estado() {
        const base = {
            activo: activo(),
            soportado: soportado(),
            permiso: permiso(),
            requiereInstalacion: requiereInstalacion(),
            instalada: instalada(),
            plataforma: plataforma(),
            navegador: navegador(),
            suscrito: false,
            nota: '',
        };

        if (!base.soportado) {
            base.nota = 'Este navegador no admite notificaciones push.';
            return base;
        }

        if (base.requiereInstalacion) {
            base.nota = 'En iPhone o iPad: toca Compartir → Añadir a pantalla de inicio y abre la tienda desde ese icono.';
            return base;
        }

        base.suscrito = Boolean(await suscripcionActual());

        if (base.permiso === 'denied') {
            base.nota = 'Las notificaciones están bloqueadas para este sitio. Actívalas desde los ajustes del navegador.';
        }

        return base;
    }

    navigator.serviceWorker?.addEventListener('message', (evento) => {
        if (evento.data?.tipo === 'push-recuperar') sincronizar();
    });

    window.NotificacionesPush = {
        activo,
        soportado,
        permiso,
        plataforma,
        navegador,
        instalada,
        requiereInstalacion,
        registrar,
        suscripcionActual,
        activar,
        desactivar,
        sincronizar,
        estado,
    };

    /* El service worker se registra al cargar (sin pedir permiso):
       así la tienda queda lista para instalarse en el celular. */
    if (soportado()) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => { registrar(); }, { once: true });
        } else {
            registrar();
        }
    }
}());
