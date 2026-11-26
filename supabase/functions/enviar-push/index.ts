/* ╔══════════════════════════════════════════════════════════════╗
   ║  Edge Function · enviar-push                                  ║
   ║  Envía la notificación a los dispositivos suscritos.          ║
   ║  La llama el panel administrativo con su token de sesión.     ║
   ╚══════════════════════════════════════════════════════════════╝ */

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:tellezstorenic@gmail.com';

const BASE = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
});

const TAMANO_LOTE = 20;

function responder(cuerpo: unknown, estado = 200) {
    return new Response(JSON.stringify(cuerpo), {
        status: estado,
        headers: { ...CORS, 'Content-Type': 'application/json' },
    });
}

function texto(valor: unknown, maximo: number) {
    return String(valor ?? '').trim().slice(0, maximo);
}

async function huellaToken(token: string) {
    const bytes = new TextEncoder().encode(token);
    const resumen = await crypto.subtle.digest('SHA-256', bytes);

    return [...new Uint8Array(resumen)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/* La URL puede ser relativa (/producto?p=5) o absoluta (https://...).
   Para las imágenes se necesita una URL absoluta: se usa el origen del panel. */
function urlSegura(valor: string, origen = '') {
    if (!valor) return '';

    if (valor.startsWith('/')) return origen ? `${origen}${valor}` : valor;

    try {
        const url = new URL(valor);

        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
    if (req.method !== 'POST') return responder({ mensaje: 'Método no permitido.' }, 405);

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
        return responder({ mensaje: 'Faltan las claves VAPID en los secretos de la función.' }, 500);
    }

    let cuerpo: Record<string, unknown>;

    try {
        cuerpo = await req.json();
    } catch {
        return responder({ mensaje: 'No se recibieron datos.' }, 400);
    }

    const token = texto(cuerpo.token, 200);

    if (!token) return responder({ mensaje: 'Falta el token del panel.' }, 401);

    const huella = await huellaToken(token);
    const { data: sesion } = await BASE
        .from('admin_web_sesiones')
        .select('id_usuario, expira')
        .eq('token_hash', huella)
        .maybeSingle();

    if (!sesion || new Date(sesion.expira).getTime() <= Date.now()) {
        return responder({ mensaje: 'Sesión expirada. Inicia sesión de nuevo.' }, 401);
    }

    const titulo = texto(cuerpo.titulo, 80);
    const mensaje = texto(cuerpo.mensaje, 240);
    const destino = texto(cuerpo.destino, 20) === 'cliente' ? 'cliente' : 'todos';
    const tipo = texto(cuerpo.tipo, 20) === 'promocion' ? 'promocion' : 'mensaje';
    const idCliente = Number(cuerpo.id_cliente || 0) || null;

    if (titulo.length < 3) return responder({ mensaje: 'Escribe un título de al menos 3 letras.' }, 422);
    if (mensaje.length < 3) return responder({ mensaje: 'Escribe un mensaje de al menos 3 letras.' }, 422);
    if (destino === 'cliente' && !idCliente) return responder({ mensaje: 'Elige el cliente que recibirá el aviso.' }, 422);

    /* El aviso guarda una ruta (/producto?p=5) que el service worker abre en la tienda. */
    const url = texto(cuerpo.url, 300).startsWith('/') ? texto(cuerpo.url, 300) : urlSegura(texto(cuerpo.url, 300)) || '/';

    /* La imagen sí debe ser absoluta: la descarga el sistema de notificaciones. */
    const origen = req.headers.get('origin') || '';
    const imagen = urlSegura(texto(cuerpo.imagen, 500), origen);

    let consulta = BASE
        .from('push_suscripciones')
        .select('id_suscripcion, endpoint, p256dh, auth')
        .eq('activo', true);

    if (destino === 'cliente') consulta = consulta.eq('id_cliente', idCliente);

    const { data: dispositivos, error: errorConsulta } = await consulta;

    if (errorConsulta) {
        return responder({ mensaje: `No se pudieron leer los dispositivos: ${errorConsulta.message}` }, 500);
    }

    const lista = dispositivos ?? [];

    if (!lista.length) {
        return responder({
            success: true,
            mensaje: destino === 'cliente'
                ? 'Ese cliente todavía no activó las notificaciones.'
                : 'Todavía no hay dispositivos con notificaciones activadas.',
            dispositivos: 0,
            enviados: 0,
            errores: 0,
        });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

    const carga = JSON.stringify({
        titulo,
        mensaje,
        url,
        imagen: imagen || undefined,
        icono: '/icon-192.png',
        tag: `aviso-${Date.now()}`,
    });

    let enviados = 0;
    let errores = 0;
    const caducados: number[] = [];

    for (let i = 0; i < lista.length; i += TAMANO_LOTE) {
        const lote = lista.slice(i, i + TAMANO_LOTE);

        const resultados = await Promise.allSettled(lote.map((fila) => webpush.sendNotification(
            { endpoint: fila.endpoint, keys: { p256dh: fila.p256dh, auth: fila.auth } },
            carga,
            { TTL: 3600, urgency: 'normal' },
        ).then(() => fila.id_suscripcion)));

        resultados.forEach((resultado, indice) => {
            if (resultado.status === 'fulfilled') {
                enviados += 1;
                return;
            }

            const codigo = (resultado.reason as { statusCode?: number })?.statusCode;

            /* 404/410: el navegador ya no existe; se borra para no reintentar. */
            if (codigo === 404 || codigo === 410) {
                caducados.push(lote[indice].id_suscripcion);
            } else {
                errores += 1;
                console.warn('Push fallido', codigo, resultado.reason?.message ?? resultado.reason);
            }
        });
    }

    if (caducados.length) {
        await BASE.from('push_suscripciones').delete().in('id_suscripcion', caducados);
    }

    const { error: errorHistorial } = await BASE.from('push_envios').insert({
        titulo,
        mensaje,
        url,
        tipo,
        imagen: imagen || null,
        destino,
        id_cliente: destino === 'cliente' ? idCliente : null,
        dispositivos: lista.length,
        enviados,
        errores,
        id_admin: sesion.id_usuario,
    });

    if (errorHistorial) console.warn('No se pudo guardar el historial', errorHistorial.message);

    return responder({
        success: true,
        mensaje: enviados
            ? `Aviso enviado a ${enviados} dispositivo${enviados === 1 ? '' : 's'}.`
            : 'No se pudo entregar el aviso. Revisa los dispositivos suscritos.',
        dispositivos: lista.length,
        enviados,
        errores,
        eliminados: caducados.length,
    });
});
