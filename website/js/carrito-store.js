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

document.addEventListener('DOMContentLoaded', () => Carrito.actualizarBadges());
window.addEventListener('storage', (event) => {
    if (event.key === 'tienda_carrito_v1') Carrito.actualizarBadges();
});

/* ── Menú de perfil: abre y cierra con animación ────────────── */
const menuPerfil = () => document.querySelector('.perfil');

function cerrarMenuPerfil() {
    const menu = menuPerfil();
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

document.addEventListener('click', (event) => {
    const menu = menuPerfil();
    if (!menu) return;

    if (event.target.closest('.perfil__boton')) {
        // Controlamos la apertura y el cierre para poder animar ambos.
        event.preventDefault();

        if (menu.open) {
            cerrarMenuPerfil();
        } else {
            menu.open = true;
        }
        return;
    }

    if (event.target.closest('.perfil__item')) {
        event.preventDefault();
        cerrarMenuPerfil();
        return;
    }

    if (menu.open && !menu.contains(event.target)) cerrarMenuPerfil();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') cerrarMenuPerfil();
});
