/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Vista del carrito                                   ║
   ╚══════════════════════════════════════════════════════════════╝ */

const IMAGEN_FALLBACK = 'img/producto.png';

let descuentoCliente = null;

function calcularDescuento(subtotal) {
    if (!descuentoCliente) return 0;

    const valor = Number(descuentoCliente.valor) || 0;

    if (descuentoCliente.tipo === 'porcentaje') {
        return Math.min(subtotal, (subtotal * valor) / 100);
    }

    if (descuentoCliente.tipo === 'monto') {
        return Math.min(subtotal, valor);
    }

    return 0;
}

function moneda(valor) {
    return 'C$ ' + Number(valor || 0).toLocaleString('es-NI', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function escapar(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function itemHTML(item) {
    return `
        <article class="carrito-item" data-clave="${escapar(item.clave)}">
            <img class="carrito-item__img" src="${escapar(window.rutaImagen(item.imagen) || IMAGEN_FALLBACK)}" alt="${escapar(item.nombre)}"
                 onerror="this.src='${IMAGEN_FALLBACK}'">

            <div class="carrito-item__datos">
                <a class="carrito-item__nombre" href="producto.html?id=${escapar(item.productoId)}">${escapar(item.nombre)}</a>
                <span class="carrito-item__meta">${escapar(item.color || '')}${item.talla ? ' · Talla ' + escapar(item.talla) : ''}</span>
                <span class="carrito-item__precio">${moneda(item.precio)}</span>
            </div>

            <div class="carrito-item__acciones">
                <div class="stepper">
                    <button type="button" data-accion="restar" aria-label="Quitar una unidad">−</button>
                    <span>${Number(item.cantidad)}</span>
                    <button type="button" data-accion="sumar" aria-label="Agregar una unidad">+</button>
                </div>
                <button type="button" class="carrito-item__quitar" data-accion="quitar" aria-label="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </article>
    `;
}

function pintarCarrito() {
    const contenedor = document.getElementById('carritoLista');
    const resumen = document.getElementById('carritoResumen');
    const vacio = document.getElementById('carritoVacio');
    const items = Carrito.items();

    if (!items.length) {
        contenedor.innerHTML = '';
        vacio.hidden = false;
        resumen.hidden = true;
        return;
    }

    vacio.hidden = true;
    resumen.hidden = false;

    contenedor.innerHTML = items.map(itemHTML).join('');

    const unidades = Carrito.cantidadTotal();
    const subtotal = Carrito.subtotal();
    const descuento = calcularDescuento(subtotal);
    const total = Math.max(0, subtotal - descuento);

    document.getElementById('carritoUnidades').textContent = `${unidades} ${unidades === 1 ? 'artículo' : 'artículos'}`;
    document.getElementById('carritoSubtotal').textContent = moneda(subtotal);
    document.getElementById('carritoTotal').textContent = moneda(total);

    const filaDescuento = document.getElementById('carritoDescuentoFila');

    if (filaDescuento) {
        filaDescuento.hidden = descuento <= 0;
        document.getElementById('carritoDescuento').textContent = `- ${moneda(descuento)}`;
        document.getElementById('carritoDescuentoEtiqueta').textContent = descuentoCliente?.etiqueta
            ? `(${descuentoCliente.etiqueta})`
            : '';
    }
}

function cambiar(clave, accion) {
    const items = Carrito.items();
    const item = items.find(fila => fila.clave === clave);
    if (!item) return;

    if (accion === 'sumar') {
        const stock = Number(item.stock || 0) || 999;
        if (Number(item.cantidad) + 1 > stock) {
            tiendaToast(`Solo hay ${stock} disponibles de este artículo.`, 'aviso');
            return;
        }
        Carrito.cambiarCantidad(clave, Number(item.cantidad) + 1);
    }

    if (accion === 'restar') {
        Carrito.cambiarCantidad(clave, Number(item.cantidad) - 1);
    }

    if (accion === 'quitar') {
        Carrito.quitar(clave);
        tiendaToast('Artículo eliminado del carrito.', 'info');
    }

    pintarCarrito();
}

document.addEventListener('click', (event) => {
    const boton = event.target.closest('[data-accion]');
    if (!boton) return;

    const fila = boton.closest('[data-clave]');
    if (!fila) return;

    cambiar(fila.dataset.clave, boton.dataset.accion);
});

document.addEventListener('DOMContentLoaded', () => {
    pintarCarrito();

    window.sesionTiendaPromise.then((sesion) => {
        descuentoCliente = sesion?.cliente?.descuento || null;
        pintarCarrito();
    });

    document.getElementById('btnVaciar')?.addEventListener('click', () => {
        Carrito.vaciar();
        pintarCarrito();
        tiendaToast('Carrito vaciado.', 'info');
    });

    document.getElementById('btnFinalizar')?.addEventListener('click', () => {
        tiendaToast('El pago en línea estará disponible pronto.', 'info');
    });
});
