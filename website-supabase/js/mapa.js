/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Mapa del pie bajo demanda                           ║
   ║  Evita cargar Google Maps en la carga inicial de la página    ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    document.addEventListener('click', (event) => {
        const boton = event.target.closest('[data-mapa-cargar]');
        if (!boton) return;

        const src = boton.dataset.mapaSrc;
        if (!src) return;

        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.title = 'Ubicación de Tellez Nic Store';
        iframe.loading = 'lazy';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';

        boton.replaceWith(iframe);
    });
})();
