/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Acceso del cliente                                 ║
   ╚══════════════════════════════════════════════════════════════╝ */

document.addEventListener('DOMContentLoaded', iniciarAcceso);

function porId(id) {
    return document.getElementById(id);
}

function mostrarError(error) {
    const errores = error?.data?.errors;

    if (errores) {
        const primero = Object.values(errores)[0];
        tiendaToast(Array.isArray(primero) ? primero[0] : primero, 'aviso');
        return;
    }

    tiendaToast(error?.message || 'Ocurrió un error inesperado.', 'aviso');
}

function bloquearBoton(boton, bloqueado) {
    if (!boton) return;

    if (bloqueado) {
        if (!boton.dataset.textoOriginal) {
            boton.dataset.textoOriginal = boton.textContent;
        }

        boton.disabled = true;
        boton.textContent = 'Procesando…';
        return;
    }

    boton.disabled = false;

    if (boton.dataset.textoOriginal) {
        boton.textContent = boton.dataset.textoOriginal;
        delete boton.dataset.textoOriginal;
    }
}

let destinoGuardado = '';

function destinoSeguro() {
    const parametros = new URLSearchParams(window.location.search);

    try {
        destinoGuardado = sessionStorage.getItem('tienda_redirect') || '';
        sessionStorage.removeItem('tienda_redirect');
    } catch {
        destinoGuardado = '';
    }

    const destino = parametros.get('redirect') || destinoGuardado;

    return destinoInterno(destino, urlTienda('perfil'));
}

function iniciarAcceso() {
    iniciarTabs();
    iniciarLogin();
    iniciarRegistro();
    iniciarSociales();

    const vista = new URLSearchParams(window.location.search).get('vista');

    if (vista === 'registro') {
        document.querySelector('[data-vista="registro"]')?.click();
    }

    window.sesionTiendaPromise?.then((sesion) => {
        if (sesion?.autenticado) {
            window.location.href = destinoSeguro();
        }
    });

    /* Confirmación de correo: Supabase devuelve #type=signup en el enlace. */
    const confirmado = new URLSearchParams(window.location.search).get('confirmado') === '1'
        || String(window.location.hash || '').includes('type=signup');

    if (confirmado) {
        tiendaToast('Correo confirmado. Ya puedes ingresar a tu cuenta.');
    }
}

function iniciarSociales() {
    const parametros = new URLSearchParams(window.location.search);
    const error = parametros.get('error');
    const destino = parametros.get('redirect');

    /* Supabase puede devolver el error en el hash (#error_description=...). */
    const hash = new URLSearchParams(String(window.location.hash || '').replace(/^#/, ''));
    const errorHash = hash.get('error_description') || hash.get('error');

    if (error || errorHash) {
        tiendaToast(error || errorHash, 'aviso');
    }

    if (!destino) return;

    document.querySelectorAll('.acceso__social-btn').forEach((enlace) => {
        const url = new URL(enlace.getAttribute('href'), window.location.origin);
        url.searchParams.set('redirect', destino);
        enlace.href = url.toString();
    });
}

function animarCambioPanel(contenedor, altoAnterior) {
    if (!contenedor || typeof contenedor.animate !== 'function') return;

    const esMovil = window.matchMedia('(max-width: 820px)').matches;
    const prefiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!esMovil || prefiereMenosMovimiento) return;

    const panelNuevo = contenedor.querySelector('.acceso__panel:not([hidden])');

    if (!panelNuevo) return;

    const altoNuevo = contenedor.offsetHeight;

    contenedor.style.overflow = 'hidden';

    contenedor.animate(
        [{ height: `${altoAnterior}px` }, { height: `${altoNuevo}px` }],
        { duration: 500, easing: 'ease' }
    );

    window.clearTimeout(animarCambioPanel.temporizador);
    animarCambioPanel.temporizador = window.setTimeout(() => {
        contenedor.style.overflow = '';
    }, 520);

    panelNuevo.animate(
        [
            { opacity: 0, transform: 'translateY(6px)' },
            { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 500, easing: 'ease' }
    );
}

function iniciarTabs() {
    const botones = Array.from(document.querySelectorAll('[data-vista]'));
    const tarjeta = document.querySelector('.acceso__card');
    const paneles = document.querySelector('.acceso__paneles');

    botones.forEach((boton) => {
        boton.addEventListener('click', () => {
            const vista = boton.dataset.vista;
            const altoAnterior = paneles ? paneles.offsetHeight : 0;

            botones.forEach((otro) => {
                const activo = otro === boton;

                otro.classList.toggle('is-activo', activo);
                otro.setAttribute('aria-selected', activo ? 'true' : 'false');
                otro.tabIndex = activo ? 0 : -1;
            });

            if (porId('panelLogin')) porId('panelLogin').hidden = vista !== 'login';
            if (porId('panelRegistro')) porId('panelRegistro').hidden = vista !== 'registro';

            if (tarjeta) {
                tarjeta.classList.toggle('acceso__card--login', vista === 'login');
                tarjeta.classList.toggle('acceso__card--registro', vista === 'registro');
            }

            animarCambioPanel(paneles, altoAnterior);
        });

        boton.addEventListener('keydown', (evento) => {
            const desplazamiento = {
                ArrowLeft: -1,
                ArrowRight: 1,
                Home: 'inicio',
                End: 'fin',
            }[evento.key];

            if (desplazamiento === undefined) return;

            evento.preventDefault();

            const total = botones.length;
            const indice = botones.indexOf(boton);

            const destino = desplazamiento === 'inicio'
                ? 0
                : desplazamiento === 'fin'
                    ? total - 1
                    : (indice + desplazamiento + total) % total;

            botones[destino].focus();
            botones[destino].click();
        });
    });
}

function iniciarLogin() {
    porId('formLogin')?.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const boton = evento.currentTarget.querySelector('button[type="submit"]');
        bloquearBoton(boton, true);

        try {
            await window.TiendaAPI.post('/tienda/api/auth/login', {
                usuario_cliente: porId('loginUsuario').value.trim(),
                password: porId('loginPassword').value,
            }, { cargando: true });

            tiendaToast('Bienvenido de vuelta.');
            window.location.href = destinoSeguro();
        } catch (error) {
            mostrarError(error);
            bloquearBoton(boton, false);
        }
    });
}

function iniciarRegistro() {
    porId('formRegistro')?.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const boton = evento.currentTarget.querySelector('button[type="submit"]');
        bloquearBoton(boton, true);

        try {
            const datos = await window.TiendaAPI.post('/tienda/api/auth/registro', {
                nombre_cliente: porId('registroNombre').value.trim(),
                usuario_cliente: porId('registroUsuario').value.trim(),
                correo_cliente: porId('registroCorreo').value.trim(),
                telefono_cliente: porId('registroTelefono').value.trim(),
                password: porId('registroPassword').value,
                password_confirmation: porId('registroPasswordConfirm').value,
            }, { cargando: true });

            tiendaToast(datos.mensaje || 'Cuenta creada correctamente.');

            if (!datos.cliente) {
                const correo = porId('registroCorreo')?.value.trim();

                document.querySelector('[data-vista="login"]')?.click();
                bloquearBoton(boton, false);

                if (correo && porId('loginUsuario')) {
                    porId('loginUsuario').value = correo;
                }

                return;
            }

            window.location.href = destinoSeguro();
        } catch (error) {
            mostrarError(error);
            bloquearBoton(boton, false);
        }
    });
}
