/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · utilidades compartidas                              ║
   ║  Escapado de texto para plantillas y normalización básica.    ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    /* Convierte cualquier valor en texto seguro para innerHTML. */
    const escapar = (valor) => String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const texto = (valor) => String(valor ?? '').trim();

    const moneda = (valor) => 'C$ ' + Number(valor || 0).toLocaleString('es-NI', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    window.TiendaUtil = { escapar, texto, moneda };
})();
