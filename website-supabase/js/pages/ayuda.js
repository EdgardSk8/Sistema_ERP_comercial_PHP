/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Ayuda con la cuenta (envío por WhatsApp)            ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    const WHATSAPP_NUMERO = '50584774288';
    const CORREO_NEGOCIO = 'tellezstorenic@gmail.com';

    const formulario = document.getElementById('formAyuda');
    if (!formulario) return;

    const aviso = document.getElementById('ayudaAviso');
    const enlaceCorreo = document.getElementById('ayudaCorreoEnlace');

    const valor = (id) => (document.getElementById(id)?.value || '').trim();

    function motivoSeleccionado() {
        return formulario.querySelector('input[name="motivo"]:checked')?.value || '';
    }

    function construirMensaje() {
        const motivo = motivoSeleccionado();
        const nombre = valor('ayudaNombre');
        const correo = valor('ayudaCorreo');
        const telefono = valor('ayudaTelefono');
        const detalle = valor('ayudaDetalle');

        const lineas = [
            'Hola, necesito ayuda con mi cuenta en Tellez Nic Store.',
            '',
            `Motivo: ${motivo}`,
            `Nombre: ${nombre}`,
            `Correo: ${correo}`,
        ];

        if (telefono) lineas.push(`Teléfono: ${telefono}`);
        if (detalle) lineas.push('', `Detalle: ${detalle}`);

        if (motivo === 'Olvidé mi contraseña') {
            lineas.push('', 'Quiero que me asignen una contraseña temporal para cambiarla en mi perfil.');
        }

        return lineas.join('\n');
    }

    function validar() {
        if (!motivoSeleccionado()) {
            aviso.textContent = 'Selecciona qué necesitas para poder ayudarte.';
            aviso.classList.add('ayuda__aviso--error');
            return false;
        }

        if (!valor('ayudaNombre') || !valor('ayudaCorreo')) {
            aviso.textContent = 'Completa tu nombre y el correo de la cuenta.';
            aviso.classList.add('ayuda__aviso--error');
            return false;
        }

        aviso.textContent = 'Al enviar se abrirá WhatsApp con el mensaje listo para el negocio.';
        aviso.classList.remove('ayuda__aviso--error');

        return true;
    }

    /* Actualiza el correo alternativo mientras se escribe. */
    function actualizarEnlaces() {
        const asunto = encodeURIComponent(`Ayuda con mi cuenta${motivoSeleccionado() ? ': ' + motivoSeleccionado() : ''}`);
        const cuerpo = encodeURIComponent(construirMensaje());

        if (enlaceCorreo) {
            enlaceCorreo.href = `mailto:${CORREO_NEGOCIO}?subject=${asunto}&body=${cuerpo}`;
        }
    }

    formulario.addEventListener('input', actualizarEnlaces);
    formulario.addEventListener('change', actualizarEnlaces);

    formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();

        if (!validar()) return;

        const enlace = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(construirMensaje())}`;
        window.open(enlace, '_blank', 'noopener');
    });

    actualizarEnlaces();
})();
