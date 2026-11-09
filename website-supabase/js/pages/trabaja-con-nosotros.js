/* ╔══════════════════════════════════════════════════════════════╗
   ║  Trabaja con nosotros · avisos y carga local                 ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    const contenedor = document.getElementById('trabajaToast');
    const cargando = document.getElementById('trabajaCargando');

    const escapar = (valor) => String(valor ?? '');

    function mostrarToast(mensaje, tipo = 'exito') {
        if (!contenedor) return;

        const esError = tipo === 'error' || tipo === 'aviso';
        const toast = document.createElement('div');
        toast.className = `trabaja-toast${esError ? ' trabaja-toast--error' : ''}`;

        const icono = document.createElement('i');
        icono.className = `bi ${esError ? 'bi-exclamation-triangle' : 'bi-check2-circle'}`;
        icono.setAttribute('aria-hidden', 'true');

        const texto = document.createElement('span');
        texto.textContent = escapar(mensaje);

        toast.append(icono, texto);
        contenedor.append(toast);
        window.setTimeout(() => toast.remove(), 4600);
    }

    window.tiendaToast = window.tiendaToast || mostrarToast;

    window.tiendaCargando = window.tiendaCargando || ((activo = false) => {
        if (!cargando) return;

        cargando.hidden = !activo;
        document.body.classList.toggle('trabaja-cargando-activo', Boolean(activo));
    });
})();
