/* Configuración pública de Supabase (segura para el navegador con RLS). */
window.SUPABASE_CONFIG = {
    url: 'https://tnzuicefxwowpbjtjdnx.supabase.co',
    key: 'sb_publishable_JzRHC4by1DK9QzUKiFWbwQ_CIqS8z7q',
};

/*
   Modo prueba: simula el envío de pedidos sin escribir en Supabase.
   Déjalo en false en producción. Para probar el checkout ponlo en true.
*/
window.TIENDA_MODO_PRUEBA = false;

/* Tema navideño: pon false para apagarlo sin tocar el HTML ni reconstruir. */
window.TEMA_NAVIDAD = true;

/*
   Apertura: mientras `activa` sea true se oculta la compra online
   (botones marcados con data-compra-online) y la portada muestra el
   aviso de la gran apertura. Las cuentas de cliente SÍ están abiertas
   para que puedan activar sus notificaciones y guardar favoritos.
   Ponlo en false el día de la apertura para habilitar la compra.
*/
window.TIENDA_APERTURA = {
    activa: true,
    fecha: '2026-12-15',
};

if (window.TIENDA_APERTURA.activa) {
    document.documentElement.classList.add('apertura-cerrada');
}

/* Delivery de la tienda: precio por km, redondeo a la baja y tarifa mínima. */
window.TIENDA_DELIVERY = {
    precioPorKm: 15,
    redondeo: 5,
    minimo: 30,
    maximoKm: 20,
    origen: {
        lat: 12.423534455595828,
        lng: -86.84733917589323,
    },
};

/*
   Notificaciones push (celular y PC). `clavePublica` es la llave VAPID pública
   del proyecto; la privada vive como secreto en la Edge Function enviar-push.
   Pon `activo: false` para ocultar el interruptor sin borrar suscripciones.
*/
window.PUSH_CONFIG = {
    activo: true,
    clavePublica: 'BObAC5IM_UuniK-pf8fnfx_KmxFBFDFtTaQLbgBfstSR60V9qG4vELiRmtwABGuABciM-rvKr34BzscBwwmW9Go',
    funcion: 'enviar-push',
};

