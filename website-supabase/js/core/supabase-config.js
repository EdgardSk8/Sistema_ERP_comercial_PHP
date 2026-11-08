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

