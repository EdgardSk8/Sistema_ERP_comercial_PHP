/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Rutas base                                          ║
   ╚══════════════════════════════════════════════════════════════╝ */

/*
   En local la tienda vive en /tienda y en Cloudflare Pages en la raíz.
   BASE_TIENDA se deduce de la URL actual para que enlaces y redirecciones
   apunten siempre al sitio correcto.
*/
const BASE_TIENDA = location.pathname.split('/').filter(Boolean)[0] === 'tienda' ? '/tienda' : '';

function urlTienda(ruta = '') {
    const limpia = String(ruta || '').replace(/^\/+/, '');

    if (!limpia) return BASE_TIENDA || '/';

    return `${BASE_TIENDA}/${limpia}`;
}

/* Normaliza un destino recibido por ?redirect= y evita salir del sitio. */
function destinoInterno(valor, porDefecto = urlTienda('perfil')) {
    const ruta = String(valor || '').trim();

    if (!ruta.startsWith('/') || ruta.startsWith('//')) return porDefecto;

    return BASE_TIENDA === ''
        ? (ruta.replace(/^\/tienda(?=\/|$|#|\?)/, '') || '/')
        : ruta;
}

window.BASE_TIENDA = BASE_TIENDA;
window.urlTienda = urlTienda;
window.destinoInterno = destinoInterno;

/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Carrito (localStorage)                              ║
   ╚══════════════════════════════════════════════════════════════╝ */

const Carrito = (() => {
    const CLAVE = 'tienda_carrito_v1';

    const leer = () => {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE));
            return Array.isArray(datos) ? datos : [];
        } catch {
            return [];
        }
    };

    const guardar = (items) => {
        localStorage.setItem(CLAVE, JSON.stringify(items));
        actualizarBadges();
    };

    const claveDe = (item) => `${item.productoId}-${item.variacionId}-${item.tallaId}`;

    function items() {
        return leer();
    }

    function cantidadTotal() {
        return leer().reduce((total, item) => total + Number(item.cantidad || 0), 0);
    }

    function subtotal() {
        return leer().reduce((total, item) => total + Number(item.precio || 0) * Number(item.cantidad || 0), 0);
    }

    function agregar(datos, cantidad = 1) {
        const items = leer();
        const clave = claveDe(datos);
        const existente = items.find(item => item.clave === clave);
        const stock = Number(datos.stock || 0) || 999;

        if (existente) {
            existente.cantidad = Math.min(Number(existente.cantidad) + cantidad, stock);
        } else {
            items.push({ ...datos, clave, cantidad: Math.min(cantidad, stock) });
        }

        guardar(items);
        return { ok: true, cantidad: cantidadTotal() };
    }

    function cambiarCantidad(clave, cantidad) {
        const items = leer();
        const item = items.find(fila => fila.clave === clave);
        if (!item) return;

        const stock = Number(item.stock || 0) || 999;
        item.cantidad = Math.max(1, Math.min(Number(cantidad), stock));
        guardar(items);
    }

    function quitar(clave) {
        guardar(leer().filter(item => item.clave !== clave));
    }

    function vaciar() {
        guardar([]);
    }

    function actualizarBadges() {
        const total = cantidadTotal();
        document.querySelectorAll('[data-carrito-badge]').forEach(badge => {
            badge.textContent = total;
            badge.hidden = total === 0;
        });
    }

    return { items, agregar, cambiarCantidad, quitar, vaciar, subtotal, cantidadTotal, actualizarBadges, claveDe };
})();

/* ── Aviso flotante ──────────────────────────────────────────── */
const ICONOS_TOAST = {
    exito: 'bi-check2-circle',
    aviso: 'bi-exclamation-circle',
    info: 'bi-info-circle'
};

function tiendaToast(mensaje, tipo = 'exito') {
    let toast = document.querySelector('.tienda-toast');

    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'tienda-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = `
            <span class="tienda-toast__icono" aria-hidden="true"><i class="bi"></i></span>
            <span class="tienda-toast__texto"></span>
            <span class="tienda-toast__barra" aria-hidden="true"></span>
        `;
        document.body.appendChild(toast);
    }

    toast.classList.toggle('tienda-toast--aviso', tipo === 'aviso');
    toast.querySelector('.tienda-toast__texto').textContent = mensaje;
    toast.querySelector('.tienda-toast__icono i').className = `bi ${ICONOS_TOAST[tipo] || ICONOS_TOAST.info}`;

    // Reinicia las animaciones aunque el aviso ya esté visible.
    toast.classList.remove('tienda-toast--visible');
    void toast.offsetWidth;
    toast.classList.add('tienda-toast--visible');

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('tienda-toast--visible'), 2600);
}

/* ── Indicador de carga global (spinner) ─────────────────────── */
let cargasActivas = 0;
let temporizadorCarga = null;
let temporizadorOcultarCarga = null;

function tiendaCargando(mostrar = true) {
    let capa = document.querySelector('.tienda-cargando');

    if (mostrar) {
        cargasActivas++;
        if (cargasActivas > 1) return;

        clearTimeout(temporizadorOcultarCarga);

        // Pequeña espera para evitar parpadeos en peticiones rápidas.
        temporizadorCarga = setTimeout(() => {
            if (!capa) {
                capa = document.createElement('div');
                capa.className = 'tienda-cargando';
                capa.setAttribute('role', 'status');
                capa.setAttribute('aria-live', 'polite');
                capa.innerHTML = `
                    <div class="tienda-cargando__caja">
                        <span class="spinner-border tienda-cargando__spinner" aria-hidden="true"></span>
                        <span class="tienda-cargando__texto">Cargando…</span>
                    </div>
                `;
                document.body.appendChild(capa);
            }

            requestAnimationFrame(() => capa.classList.add('tienda-cargando--visible'));
        }, 160);
        return;
    }

    cargasActivas = Math.max(0, cargasActivas - 1);
    if (cargasActivas > 0) return;

    clearTimeout(temporizadorCarga);

    if (capa) {
        capa.classList.remove('tienda-cargando--visible');
        temporizadorOcultarCarga = setTimeout(() => capa.remove(), 200);
    }
}

window.tiendaCargando = tiendaCargando;

/* ── Confirmación con modal (reemplaza window.confirm) ───────── */
function tiendaConfirmar(opciones = {}) {
    const {
        titulo = '¿Estás seguro?',
        mensaje = '',
        textoAceptar = 'Aceptar',
        textoCancelar = 'Cancelar',
        peligro = false,
    } = opciones;

    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'tienda-modal';
        modal.innerHTML = `
            <div class="tienda-modal__fondo" data-modal-cancelar></div>
            <div class="tienda-modal__caja" role="dialog" aria-modal="true" aria-labelledby="tiendaModalTitulo" aria-describedby="tiendaModalMensaje">
                <span class="tienda-modal__icono" aria-hidden="true"><i class="bi ${peligro ? 'bi-exclamation-triangle' : 'bi-question-circle'}"></i></span>
                <h3 class="tienda-modal__titulo" id="tiendaModalTitulo"></h3>
                <p class="tienda-modal__mensaje" id="tiendaModalMensaje"></p>
                <div class="tienda-modal__acciones">
                    <button type="button" class="tienda-modal__boton tienda-modal__boton--cancelar" data-modal-cancelar></button>
                    <button type="button" class="tienda-modal__boton tienda-modal__boton--aceptar"></button>
                </div>
            </div>
        `;

        modal.querySelector('.tienda-modal__titulo').textContent = titulo;
        modal.querySelector('.tienda-modal__mensaje').textContent = mensaje;

        const botonCancelar = modal.querySelector('.tienda-modal__boton--cancelar');
        const botonAceptar = modal.querySelector('.tienda-modal__boton--aceptar');
        const focoAnterior = document.activeElement;

        botonCancelar.textContent = textoCancelar;
        botonAceptar.textContent = textoAceptar;
        botonAceptar.classList.toggle('tienda-modal__boton--peligro', peligro);

        function cerrar(resultado) {
            document.removeEventListener('keydown', alPresionarTecla);
            modal.classList.remove('tienda-modal--visible');

            setTimeout(() => {
                modal.remove();
                if (focoAnterior instanceof HTMLElement) focoAnterior.focus();
                resolve(resultado);
            }, 180);
        }

        function alPresionarTecla(evento) {
            if (evento.key === 'Escape') {
                evento.preventDefault();
                cerrar(false);
            } else if (evento.key === 'Enter') {
                evento.preventDefault();
                cerrar(true);
            }
        }

        modal.addEventListener('click', (evento) => {
            if (evento.target.closest('[data-modal-cancelar]')) cerrar(false);
            else if (evento.target.closest('.tienda-modal__boton--aceptar')) cerrar(true);
        });

        document.addEventListener('keydown', alPresionarTecla);
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('tienda-modal--visible'));
        botonAceptar.focus();
    });
}

document.addEventListener('DOMContentLoaded', () => Carrito.actualizarBadges());
window.addEventListener('storage', (event) => {
    if (event.key === 'tienda_carrito_v1') Carrito.actualizarBadges();
});

/* ── Menús del header (invitado / cuenta) ───────────────────── */
const menusHeader = () => Array.from(document.querySelectorAll('details.perfil'));

function cerrarMenuPerfil(menu) {
    if (!menu || !menu.open) return;

    const panel = menu.querySelector('.perfil__menu');
    if (!panel) {
        menu.open = false;
        return;
    }

    // Se desliza hacia la derecha y, al terminar, se cierra.
    panel.classList.add('perfil__menu--saliendo');

    clearTimeout(menu._cerrarTimer);
    menu._cerrarTimer = setTimeout(() => {
        menu.open = false;
        panel.classList.remove('perfil__menu--saliendo');
    }, 180);
}

function cerrarMenusHeader(excepto = null) {
    menusHeader().forEach((menu) => {
        if (menu !== excepto) cerrarMenuPerfil(menu);
    });
}

document.addEventListener('click', (event) => {
    const menu = event.target.closest('details.perfil');

    if (event.target.closest('.perfil__boton') && menu) {
        // Controlamos la apertura y el cierre para poder animar ambos.
        event.preventDefault();

        if (menu.open) {
            cerrarMenuPerfil(menu);
        } else {
            cerrarMenusHeader(menu);
            menu.open = true;
        }
        return;
    }

    // Al elegir una opción del menú se cierra, pero se deja navegar.
    if (event.target.closest('.perfil__menu .perfil__item')) {
        cerrarMenusHeader();
        return;
    }

    if (!menu) cerrarMenusHeader();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') cerrarMenusHeader();
});
