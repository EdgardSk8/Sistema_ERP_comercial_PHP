/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tellez Nic Store · Service worker                            ║
   ║  Recibe las notificaciones push y abre la tienda al tocarlas. ║
   ╚══════════════════════════════════════════════════════════════╝ */

const ICONO = '/icon-192.png';
const INSIGNIA = '/favicon-32x32.png';
const TITULO_POR_DEFECTO = 'Tellez Nic Store';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
    evento.waitUntil((async () => {
        if (self.registration.navigationPreload) {
            try { await self.registration.navigationPreload.enable(); } catch { /* sin precarga */ }
        }

        await self.clients.claim();
    })());
});

/* Sin caché propia: todo se pide a la red como siempre.
   El manejador es necesario para que el navegador permita instalar la app. */
self.addEventListener('fetch', () => {});

self.addEventListener('push', (evento) => {
    let datos = {};

    try {
        datos = evento.data ? evento.data.json() : {};
    } catch {
        datos = { mensaje: evento.data ? evento.data.text() : '' };
    }

    const titulo = datos.titulo || TITULO_POR_DEFECTO;
    const opciones = {
        body: datos.mensaje || 'Tenemos algo nuevo para ti.',
        icon: datos.icono || ICONO,
        badge: datos.insignia || INSIGNIA,
        image: datos.imagen || undefined,
        tag: datos.tag || 'tellez-aviso',
        renotify: true,
        vibrate: [90, 50, 90],
        lang: 'es',
        actions: [{ action: 'abrir', title: 'Ver' }],
        data: { url: datos.url || '/' },
    };

    evento.waitUntil(self.registration.showNotification(titulo, opciones));
});

self.addEventListener('notificationclick', (evento) => {
    evento.notification.close();

    const destino = new URL(evento.notification.data?.url || '/', self.location.origin).href;

    evento.waitUntil((async () => {
        const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

        for (const ventana of ventanas) {
            if (!ventana.url.startsWith(self.location.origin)) continue;

            await ventana.focus();

            if ('navigate' in ventana) {
                try { await ventana.navigate(destino); } catch { /* otra pestaña abierta */ }
            }

            return;
        }

        await self.clients.openWindow(destino);
    })());
});

/* El navegador renovó o canceló la suscripción: se pide a la página que la vuelva a guardar. */
self.addEventListener('pushsubscriptionchange', (evento) => {
    evento.waitUntil((async () => {
        const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

        ventanas.forEach((ventana) => ventana.postMessage({ tipo: 'push-recuperar' }));
    })());
});
