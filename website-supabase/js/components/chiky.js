/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Chiky, asistente virtual                            ║
   ║  Componente único de identidad, imagen y mensajes             ║
   ║  Uso: <div data-chiky></div> + Chiky.paso('clave')            ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    /* Identidad y avatar: único punto a cambiar si se reemplaza la imagen. */
    const IDENTIDAD = {
        nombre: 'Chiky',
        rol: 'Asistente virtual de Tellez Store Nic',
        avatar: '/tienda/recursos/imagenes/avatares/Asistente.PNG',
    };

    const MENSAJES = {
        bienvenida: '¡Hola! Soy Chiky, tu asistente virtual. Estoy aquí para ayudarte.',
        login: 'Escribe tu correo y contraseña. Si algo falla, te digo qué revisar.',
        registro: '¿Aún no tienes cuenta? Te acompaño a crear una en un momento.',
        registroCreado: '¡Excelente! Tu cuenta está creada. Revisa tu correo para confirmarla.',
        perfilIncompleto: 'Veo que puedes completar algunos datos de tu perfil. ¿Te ayudo?',
        perfilCompleto: '¡Bien! Tu perfil ya está completo.',
        descuentoBienvenida: '¡Hola! Soy Chiky, tu asistente virtual. Tienes un 10% de bienvenida en zapatos para tu primera compra: en «Descuentos y cupones» te explico cómo activarlo.',
        perfilGuardado: '¡Listo! Tus datos se guardaron correctamente.',
        sinAyuda: 'De acuerdo. Cuando quieras seguir, pulsa sobre mí.',
    };

    const CLAVE_OCULTO = 'chiky_oculto';

    let montaje = null;
    let tarjeta = null;
    let mensajeEl = null;
    let accionesEl = null;
    let discreto = false;
    let despedida = null;

    function estaOculto() {
        try {
            return sessionStorage.getItem(CLAVE_OCULTO) === '1';
        } catch {
            return false;
        }
    }

    function recordarOculto(oculto) {
        try {
            if (oculto) sessionStorage.setItem(CLAVE_OCULTO, '1');
            else sessionStorage.removeItem(CLAVE_OCULTO);
        } catch {
            /* sin almacenamiento: solo aplica a esta vista */
        }
    }

    function limpiarAcciones() {
        if (!accionesEl) return;

        accionesEl.innerHTML = '';
        accionesEl.hidden = true;
    }

    /* Muestra u oculta la tarjeta con la transición de medio segundo. */
    function guardarTarjeta(oculta) {
        if (!tarjeta) return;

        tarjeta.classList.toggle('chiky--guardada', oculta);
        tarjeta.setAttribute('aria-hidden', oculta ? 'true' : 'false');

        if (oculta) descartarDespedida();
    }

    /*
       Un mensaje sencillo (sin botones y sin guía abierta) se despide solo
       a los 5 segundos, desvaneciéndose.
    */
    function programarDespedida() {
        descartarDespedida();

        despedida = setTimeout(() => {
            despedida = null;

            if (!tarjeta || guiaActiva) return;
            if (tarjeta.classList.contains('chiky--guardada')) return;
            if (accionesEl && !accionesEl.hidden) return;

            guardarTarjeta(true);
        }, 5000);
    }

    function descartarDespedida() {
        clearTimeout(despedida);
        despedida = null;
    }

    function montar() {
        if (montaje) return true;

        montaje = document.querySelector('[data-chiky]');

        if (!montaje || montaje.dataset.chikyListo === '1') return Boolean(montaje);

        montaje.dataset.chikyListo = '1';
        montaje.innerHTML = `
            <aside class="chiky" data-tono="info">
                <img class="chiky__avatar" alt="${IDENTIDAD.nombre}, ${IDENTIDAD.rol}" width="56" height="56" decoding="async">
                <div class="chiky__contenido">
                    <p class="chiky__nombre">${IDENTIDAD.nombre}</p>
                    <p class="chiky__mensaje"></p>
                    <div class="chiky__acciones" hidden></div>
                </div>
                <button class="chiky__cerrar" type="button" aria-label="Ocultar a Chiky">
                    <i class="bi bi-x-lg" aria-hidden="true"></i>
                </button>
            </aside>
        `;

        tarjeta = montaje.querySelector('.chiky');
        mensajeEl = montaje.querySelector('.chiky__mensaje');
        accionesEl = montaje.querySelector('.chiky__acciones');

        montaje.querySelector('.chiky__avatar').src = montaje.dataset.chikyAvatar || IDENTIDAD.avatar;

        montaje.querySelector('.chiky__cerrar').addEventListener('click', ocultar);
        tarjeta.title = 'Ver la guía de nuevo';
        tarjeta.addEventListener('click', (evento) => {
            if (evento.target.closest('button, a, input, select, textarea')) return;
            repetirGuia();
        });
        tarjeta.hidden = false;
        tarjeta.classList.toggle('chiky--guardada', estaOculto());
        tarjeta.setAttribute('aria-hidden', estaOculto() ? 'true' : 'false');

        /* Sin guía ni mensaje de página, Chiky saluda por defecto. */
        if (!estaOculto() && !mensajeEl.textContent) decir(MENSAJES.bienvenida);

        return true;
    }

    function decir(texto, { tono = 'info' } = {}) {
        if (!montar() || !texto) return;

        mensajeEl.textContent = texto;
        tarjeta.dataset.tono = tono;

        /* Los botones de un mensaje anterior no aplican al nuevo. */
        limpiarAcciones();

        if (estaOculto() || discreto) return;

        guardarTarjeta(false);
        programarDespedida();
    }

    function paso(clave) {
        if (MENSAJES[clave]) decir(MENSAJES[clave]);
    }

    function error(texto) {
        decir(texto || 'Algo no salió bien. Revisa los datos e inténtalo otra vez.', { tono: 'error' });
    }

    function exito(texto) {
        decir(texto, { tono: 'exito' });
    }

    /* Acción principal + opción de continuar sin ayuda. */
    function accion(etiqueta, manejador) {
        if (!montar() || !accionesEl) return;

        ultimaAccion = { etiqueta, manejador, mensaje: mensajeEl?.textContent || '' };

        limpiarAcciones();
        descartarDespedida();

        const principal = document.createElement('button');
        principal.type = 'button';
        principal.className = 'chiky__btn';
        principal.textContent = etiqueta;
        principal.addEventListener('click', () => {
            limpiarAcciones();
            manejador();
        });

        const omitir = document.createElement('button');
        omitir.type = 'button';
        omitir.className = 'chiky__btn chiky__btn--secundario';
        omitir.textContent = 'Ahora no';
        omitir.addEventListener('click', () => {
            limpiarAcciones();

            /* «Ahora no» guarda a Chiky: se reabre desde el menú cuando se pida. */
            guardarTarjeta(true);
        });

        accionesEl.append(principal, omitir);
        accionesEl.hidden = false;
    }

    function ocultar() {
        recordarOculto(true);
        limpiarAcciones();
        guardarTarjeta(true);
    }

    function mostrar() {
        recordarOculto(false);
        discreto = false;
        guardarTarjeta(false);
        programarDespedida();
    }

    /*
       Modo discreto: la tarjeta queda guardada y solo aparece cuando la
       página llama a mostrar(). Útil donde Chiky vive en el menú.
    */
    function modoDiscreto(activo = true) {
        discreto = activo;

        if (!activo || !montar()) return;

        guardarTarjeta(true);
    }

    /* ── Recorrido guiado (driver.js) ─────────────────────────── */

    let guiaActiva = null;
    let ultimaGuia = null;
    let ultimaAccion = null;
    let foco = null;
    let focoTimer = null;
    let focoObjetivo = null;
    let focoFrame = 0;

    function refrescarGuia() {
        guiaActiva?.refresh();
    }

    /* Repinta el anillo; si el elemento sigue vivo, vuelve a pedir el siguiente frame. */
    function pintarFoco() {
        if (!foco || !focoObjetivo?.isConnected) {
            focoFrame = 0;
            return;
        }

        const r = focoObjetivo.getBoundingClientRect();
        const margen = 6;

        foco.style.left = `${Math.round(r.left + window.scrollX - margen)}px`;
        foco.style.top = `${Math.round(r.top + window.scrollY - margen)}px`;
        foco.style.width = `${Math.round(r.width + margen * 2)}px`;
        foco.style.height = `${Math.round(r.height + margen * 2)}px`;

        focoFrame = requestAnimationFrame(pintarFoco);
    }

    /* Oscurece el entorno y deja iluminado el elemento indicado. */
    function spotlight(elemento, { duracion = 1900 } = {}) {
        if (!elemento) return;

        if (!foco || !foco.isConnected) {
            foco = document.createElement('div');
            foco.className = 'chiky-foco';
            document.body.appendChild(foco);
        }

        focoObjetivo = elemento;
        foco.classList.remove('chiky-foco--oculto');

        cancelAnimationFrame(focoFrame);
        pintarFoco();

        clearTimeout(focoTimer);

        focoTimer = setTimeout(() => {
            focoObjetivo = null;
            cancelAnimationFrame(focoFrame);
            focoFrame = 0;
            foco?.classList.add('chiky-foco--oculto');

            focoTimer = setTimeout(() => {
                foco?.remove();
                foco = null;
            }, 500);
        }, duracion);
    }

    /* Repite la última guía o, si no hay, la última oferta de la tarjeta. */
    function repetirGuia() {
        mostrar();

        if (ultimaGuia) {
            guiar(ultimaGuia.pasos, { clave: ultimaGuia.clave, forzar: true });
            return;
        }

        if (!ultimaAccion) return;

        decir(ultimaAccion.mensaje || MENSAJES.bienvenida);
        accion(ultimaAccion.etiqueta, ultimaAccion.manejador);
    }

    function guiaVista(clave) {
        try {
            return sessionStorage.getItem(clave) === '1';
        } catch {
            return false;
        }
    }

    function marcarGuia(clave) {
        try {
            sessionStorage.setItem(clave, '1');
        } catch {
            /* sin almacenamiento: la guía puede repetirse */
        }
    }

    /*
       Los pasos los define cada página; aquí solo se aplica el estilo de
       Chiky y se sincroniza su mensaje con el del popover.
    */
    function guiar(pasos, { clave = 'chiky_guia', forzar = false, barra = true, progreso = true, recordar = true } = {}) {
        const crearDriver = window.driver?.js?.driver;

        if (!crearDriver || !Array.isArray(pasos) || !pasos.length) return false;

        descartarDespedida();

        /* recordar:false evita que una pista corta sustituya a la guía de la tarjeta. */
        if (recordar) ultimaGuia = { pasos, clave };

        if (estaOculto() || (!forzar && guiaVista(clave))) return false;

        /* Cada paso puede traer un selector o un elemento ya resuelto. */
        const resueltos = pasos
            .map((paso) => ({
                ...paso,
                element: typeof paso.element === 'string'
                    ? document.querySelector(paso.element)
                    : paso.element,
            }))
            .filter((paso) => paso.element);

        if (!resueltos.length) return false;

        marcarGuia(clave);

        /* Si ya había una guía abierta, se cierra antes de abrir esta. */
        guiaActiva?.destroy();

        /* barra:false deja el escenario limpio: el texto va solo en el popover. */
        const volverVisible = !discreto;

        if (!barra) guardarTarjeta(true);

        guiaActiva = crearDriver({
            showProgress: progreso,
            progressText: 'Paso {{current}} de {{total}}',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Listo',
            allowClose: true,
            overlayColor: 'rgba(12, 61, 36, .55)',
            stagePadding: 8,
            stageRadius: 14,
            popoverOffset: 12,
            steps: resueltos,
            onHighlightStarted: (_elemento, paso) => {
                /* Primero cambia la vista si el paso lo pide; después fija el mensaje. */
                if (typeof paso?.alEntrar === 'function') {
                    try {
                        paso.alEntrar();
                    } catch {
                        /* la guía continúa */
                    }
                }

                const texto = paso?.popover?.description;
                if (texto && barra) decir(texto);
            },
            onDestroyed: () => {
                guiaActiva = null;

                if (barra) {
                    decir('Puedes seguir cuando quieras. Pulsa sobre mí para ver la guía otra vez.');
                } else if (volverVisible) {
                    mostrar();
                }
            },
        });

        guiaActiva.drive();

        return true;
    }

    /* Cierra la guía abierta (por ejemplo, al pulsar el botón señalado). */
    function cerrarGuia() {
        guiaActiva?.destroy();
    }

    window.Chiky = { montar, decir, paso, error, exito, accion, guiar, refrescarGuia, cerrarGuia, modoDiscreto, spotlight, ocultar, mostrar, mensajes: MENSAJES, identidad: IDENTIDAD };

    montar();
})();
