/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Vista del carrito                                   ║
   ╚══════════════════════════════════════════════════════════════╝ */

const IMAGEN_FALLBACK = '/tienda/recursos/img/producto.png';

let descuentoCliente = null;

const DELIVERY_CONFIG = window.TIENDA_DELIVERY || {
    precioPorKm: 15,
    redondeo: 5,
    origen: {
        lat: 12.423534455595828,
        lng: -86.84733917589323,
    },
};

const CLAVE_DIRECCION_ENTREGA = 'tienda_delivery_direccion';
const CLAVE_UBICACION_ENTREGA = 'tienda_delivery_ubicacion';

let direccionesEntrega = [];
let direccionEntrega = null;
let envio = 0;
let envioDetalle = null;

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

function formatearKm(km) {
    return Number(km || 0).toLocaleString('es-NI', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
    });
}

function distanciaKm(lat1, lng1, lat2, lng2) {
    const radio = 6371;
    const radianes = (valor) => (Number(valor) * Math.PI) / 180;
    const dLat = radianes(lat2 - lat1);
    const dLng = radianes(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(radianes(lat1)) * Math.cos(radianes(lat2)) * Math.sin(dLng / 2) ** 2;

    return 2 * radio * Math.asin(Math.sqrt(a));
}

function calcularEnvio(direccion) {
    const origen = DELIVERY_CONFIG.origen || {};
    const lat = Number(direccion?.latitud_direccion);
    const lng = Number(direccion?.longitud_direccion);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (!Number.isFinite(Number(origen.lat)) || !Number.isFinite(Number(origen.lng))) return null;

    const km = distanciaKm(Number(origen.lat), Number(origen.lng), lat, lng);
    const precioPorKm = Number(DELIVERY_CONFIG.precioPorKm) || 0;
    const paso = Number(DELIVERY_CONFIG.redondeo) || 5;
    const minimo = Number(DELIVERY_CONFIG.minimo) || 0;
    const bruto = km * precioPorKm;
    const redondeado = Math.max(0, Math.floor(bruto / paso) * paso);
    const final = Math.max(minimo, redondeado);
    const aplicoMinimo = final > redondeado;

    return { km, bruto, redondeado, final, paso, minimo, aplicoMinimo };
}

function pintarDetalleResumen() {
    const detalle = document.getElementById('carritoDeliveryDetalle');
    const envioNodo = document.getElementById('carritoEnvio');

    if (!detalle) return;

    if (!direccionEntrega) {
        detalle.textContent = 'Selecciona una dirección para calcular el envío.';
        if (envioNodo) {
            envioNodo.textContent = '—';
            envioNodo.classList.remove('resumen__gratis');
        }
        return;
    }

    if (!envioDetalle) {
        detalle.textContent = 'Dirección sin ubicación; no se puede calcular el envío.';
        if (envioNodo) {
            envioNodo.textContent = '—';
            envioNodo.classList.remove('resumen__gratis');
        }
        return;
    }

    const { km, bruto, final, aplicoMinimo } = envioDetalle;
    const precioPorKm = Number(DELIVERY_CONFIG.precioPorKm) || 0;

    detalle.textContent = aplicoMinimo
        ? `${formatearKm(km)} km × ${moneda(precioPorKm)} = ${moneda(bruto)} → ${moneda(final)} (tarifa mínima)`
        : `${formatearKm(km)} km × ${moneda(precioPorKm)} = ${moneda(bruto)} → ${moneda(final)} (redondeado a la baja)`;

    if (envioNodo) {
        envioNodo.textContent = final > 0 ? moneda(final) : 'Gratis';
        envioNodo.classList.toggle('resumen__gratis', final <= 0);
    }
}

function pintarEntregaInfo(mensaje = '') {
    const info = document.getElementById('carritoEntregaInfo');
    if (!info) return;

    if (mensaje) {
        info.innerHTML = mensaje;
        return;
    }

    if (!direccionEntrega) {
        info.textContent = 'Selecciona una dirección para calcular el envío.';
        return;
    }

    if (!envioDetalle) {
        info.innerHTML = 'Esta dirección no tiene ubicación. <a href="/tienda/perfil#direcciones">Edita la dirección</a> y marca tu ubicación para calcular el envío.';
        return;
    }

    const { km, bruto, redondeado, final, paso, minimo, aplicoMinimo } = envioDetalle;
    const precioPorKm = Number(DELIVERY_CONFIG.precioPorKm) || 0;

    info.innerHTML = `
        <div class="carrito-entrega__linea"><span>Distancia</span><strong>${formatearKm(km)} km</strong></div>
        <div class="carrito-entrega__linea"><span>Cálculo</span><strong>${formatearKm(km)} km × ${moneda(precioPorKm)} = ${moneda(bruto)}</strong></div>
        ${aplicoMinimo && redondeado > 0 ? `<div class="carrito-entrega__linea"><span>Redondeo</span><strong>${moneda(redondeado)}</strong></div>` : ''}
        <div class="carrito-entrega__linea carrito-entrega__linea--final"><span>Envío</span><strong>${moneda(final)}</strong></div>
        <p class="carrito-entrega__redondeo">${aplicoMinimo
            ? `Se aplica la tarifa mínima de ${moneda(minimo)}.`
            : `Redondeo a la baja al múltiplo de ${moneda(paso)} más cercano.`}</p>
    `;
}

function seleccionarDireccion(id) {
    const direccion = direccionesEntrega.find(
        (fila) => String(fila.id_direccion_cliente) === String(id)
    ) || null;

    direccionEntrega = direccion;
    envioDetalle = direccion ? calcularEnvio(direccion) : null;
    envio = envioDetalle ? envioDetalle.final : 0;

    try {
        if (direccion) {
            localStorage.setItem(CLAVE_DIRECCION_ENTREGA, String(direccion.id_direccion_cliente));
            localStorage.setItem(CLAVE_UBICACION_ENTREGA, JSON.stringify({
                lat: direccion.latitud_direccion,
                lng: direccion.longitud_direccion,
            }));
        } else {
            localStorage.removeItem(CLAVE_DIRECCION_ENTREGA);
            localStorage.removeItem(CLAVE_UBICACION_ENTREGA);
        }
    } catch {
        // Sin localStorage: se calcula igual para esta visita.
    }

    pintarEntregaInfo();
    actualizarResumen();
}

function inicializarSelect2Direccion() {
    const select = document.getElementById('carritoDireccion');
    if (!select || !window.jQuery?.fn?.select2) return;

    const $select = window.jQuery(select);

    if ($select.data('select2')) {
        $select.select2('destroy');
    }

    $select.select2({
        width: '100%',
        placeholder: 'Selecciona una dirección',
        minimumResultsForSearch: 6,
        language: {
            noResults: () => 'No hay direcciones',
            searching: () => 'Buscando…',
        },
    });

    $select.off('change.delivery').on('change.delivery', (evento) => {
        seleccionarDireccion(evento.target.value);
    });
}

async function cargarEntrega(sesion) {
    const contenedor = document.getElementById('carritoEntrega');
    const aviso = document.getElementById('carritoEntregaAviso');
    const select = document.getElementById('carritoDireccion');

    if (!contenedor || !aviso || !select) return;

    if (!Carrito.items().length) {
        contenedor.hidden = true;
        aviso.hidden = true;
        return;
    }

    if (!sesion?.autenticado) {
        contenedor.hidden = true;
        aviso.hidden = false;
        direccionEntrega = null;
        envio = 0;
        envioDetalle = null;
        pintarEntregaInfo();
        actualizarResumen();
        return;
    }

    aviso.hidden = true;
    contenedor.hidden = false;

    try {
        const datos = await window.TiendaAPI.get('/tienda/api/direcciones');
        direccionesEntrega = datos.direcciones || [];
    } catch {
        direccionesEntrega = [];
    }

    if (!direccionesEntrega.length) {
        select.innerHTML = '<option value="">No tienes direcciones guardadas</option>';
        select.disabled = true;
        direccionEntrega = null;
        envio = 0;
        envioDetalle = null;
        pintarEntregaInfo('No tienes direcciones guardadas. <a href="/tienda/perfil#direcciones">Agrega una dirección</a> para calcular el envío.');
        actualizarResumen();
        return;
    }

    select.disabled = false;
    select.innerHTML = direccionesEntrega.map((direccion) => {
        const detalle = [direccion.nombre_direccion, direccion.direccion_manual]
            .filter(Boolean)
            .join(' · ');

        return `<option value="${escapar(direccion.id_direccion_cliente)}">${escapar(detalle || 'Dirección')}</option>`;
    }).join('');

    let guardada = '';

    try {
        guardada = localStorage.getItem(CLAVE_DIRECCION_ENTREGA) || '';
    } catch {
        guardada = '';
    }

    const predeterminada = direccionesEntrega.find((direccion) => direccion.predeterminada_direccion);
    const elegida = direccionesEntrega.find(
        (direccion) => String(direccion.id_direccion_cliente) === String(guardada)
    ) || predeterminada || direccionesEntrega[0];

    inicializarSelect2Direccion();

    const valorElegido = String(elegida.id_direccion_cliente);
    select.value = valorElegido;

    if (window.jQuery?.fn?.select2) {
        window.jQuery(select).val(valorElegido).trigger('change');
    } else {
        seleccionarDireccion(valorElegido);
    }
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
            <img class="carrito-item__img" src="${escapar(item.imagen || IMAGEN_FALLBACK)}" alt="${escapar(item.nombre)}"
                 onerror="this.src='${IMAGEN_FALLBACK}'">

            <div class="carrito-item__datos">
                <a class="carrito-item__nombre" href="/producto?p=${escapar(item.productoId)}">${escapar(item.nombre)}</a>
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

function actualizarResumen(items = Carrito.items()) {
    const contenedor = document.getElementById('carritoLista');
    const resumen = document.getElementById('carritoResumen');
    const vacio = document.getElementById('carritoVacio');

    if (!items.length) {
        if (contenedor) contenedor.innerHTML = '';
        if (vacio) vacio.hidden = false;
        if (resumen) resumen.hidden = true;
        document.getElementById('carritoUnidades').textContent = '';
        return;
    }

    if (vacio) vacio.hidden = true;
    if (resumen) resumen.hidden = false;

    const unidades = items.reduce((total, item) => total + Number(item.cantidad || 0), 0);
    const subtotal = items.reduce((total, item) => total + Number(item.precio || 0) * Number(item.cantidad || 0), 0);
    const descuento = calcularDescuento(subtotal);
    const total = Math.max(0, subtotal - descuento + envio);

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

    pintarDetalleResumen();
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
        document.getElementById('carritoUnidades').textContent = '';

        const entrega = document.getElementById('carritoEntrega');
        const avisoEntrega = document.getElementById('carritoEntregaAviso');
        if (entrega) entrega.hidden = true;
        if (avisoEntrega) avisoEntrega.hidden = true;
        return;
    }

    vacio.hidden = true;
    resumen.hidden = false;

    contenedor.innerHTML = items.map(itemHTML).join('');
    actualizarResumen(items);
}

function actualizarCantidadFila(fila, cantidad) {
    const valor = fila?.querySelector('.stepper span');

    if (valor) valor.textContent = String(cantidad);
}

function quitarFila(clave, fila, mensaje) {
    Carrito.quitar(clave);
    tiendaToast(mensaje, 'info');

    const restantes = Carrito.items();

    if (!restantes.length) {
        // Espera el desvanecido antes de mostrar el estado vacío.
        setTimeout(() => {
            fila?.remove();
            pintarCarrito();
        }, 200);
        return;
    }

    actualizarResumen(restantes);

    if (fila) {
        fila.classList.add('carrito-item--saliendo');
        setTimeout(() => fila.remove(), 200);
    }
}

function cambiar(clave, accion) {
    const items = Carrito.items();
    const item = items.find(fila => fila.clave === clave);
    if (!item) return;

    const fila = [...document.querySelectorAll('.carrito-item')]
        .find(nodo => nodo.dataset.clave === clave);

    if (accion === 'sumar') {
        const stock = Number(item.stock || 0) || 999;
        const nueva = Number(item.cantidad) + 1;

        if (nueva > stock) {
            tiendaToast(`Solo hay ${stock} disponibles de este artículo.`, 'aviso');
            return;
        }

        Carrito.cambiarCantidad(clave, nueva);
        actualizarCantidadFila(fila, nueva);
        actualizarResumen();
        return;
    }

    if (accion === 'restar') {
        const nueva = Number(item.cantidad) - 1;

        if (nueva <= 0) {
            quitarFila(clave, fila, 'Artículo eliminado del carrito.');
            return;
        }

        Carrito.cambiarCantidad(clave, nueva);
        actualizarCantidadFila(fila, nueva);
        actualizarResumen();
        return;
    }

    if (accion === 'quitar') {
        quitarFila(clave, fila, 'Artículo eliminado del carrito.');
    }
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

    window.sesionTiendaPromise.then(async (sesion) => {
        const descuento = sesion?.cliente?.descuento || null;

        // Solo actualiza totales: repintar la lista completa causaba parpadeo.
        if (JSON.stringify(descuento) !== JSON.stringify(descuentoCliente)) {
            descuentoCliente = descuento;
            actualizarResumen();
        }

        await cargarEntrega(sesion);
    });

    document.getElementById('carritoDireccion')?.addEventListener('change', (evento) => {
        seleccionarDireccion(evento.target.value);
    });

    document.getElementById('btnVaciar')?.addEventListener('click', () => {
        Carrito.vaciar();
        pintarCarrito();
        tiendaToast('Carrito vaciado.', 'info');
    });

    document.getElementById('btnFinalizar')?.addEventListener('click', () => {
        if (!direccionEntrega) {
            tiendaToast('Selecciona una dirección para calcular el envío.', 'aviso');
            return;
        }

        if (!envioDetalle) {
            tiendaToast('La dirección no tiene ubicación. Edítala para calcular el envío.', 'aviso');
            return;
        }

        tiendaToast('El pago en línea estará disponible pronto.', 'info');
    });
});
