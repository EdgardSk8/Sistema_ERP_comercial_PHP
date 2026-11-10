/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Vista del carrito                                   ║
   ╚══════════════════════════════════════════════════════════════╝ */

const IMAGEN_FALLBACK = '/tienda/recursos/img/producto.png';
const WHATSAPP_TIENDA = '50584774288';

let descuentoCliente = null;
let clienteTienda = null;

/* Descuentos elegibles: uno solo por pedido (no se acumulan). */
const CLAVE_DESCUENTO_MODO = 'tienda_descuento_modo';
let descuentosTienda = { cliente: null, promociones: [] };
let cuponesTienda = [];
let descuentoModo = 'ninguno';

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
const CLAVE_METODO_PAGO = 'tienda_metodo_pago';

const BILLETERA_APP = {
    android: 'https://play.google.com/store/apps/details?id=ni.com.banprogrupopromerica.billeteramovil',
    ios: 'https://apps.apple.com/app/id1614485126',
    web: 'https://www.banprogrupopromerica.com.ni/canales-de-atencion/billetera-movil/',
};

let direccionesEntrega = [];
let direccionEntrega = null;
let envio = 0;
let envioDetalle = null;

const CLAVE_TERMINOS = 'tienda_terminos_aceptados';
const AYUDA_TERMINOS = 'Debes aceptar los términos y condiciones para comprar o pedir por WhatsApp.';
let terminosVersion = '1.1';
let terminosAceptados = false;

function claveTerminosLocal() {
    const responsable = clienteTienda?.id_cliente || 'invitado';
    return `${CLAVE_TERMINOS}:${responsable}:${terminosVersion}`;
}

function leerTerminosLocal() {
    try {
        return localStorage.getItem(claveTerminosLocal()) === '1';
    } catch {
        return false;
    }
}

function guardarTerminosLocal(aceptado) {
    try {
        if (aceptado) {
            localStorage.setItem(claveTerminosLocal(), '1');
        } else {
            localStorage.removeItem(claveTerminosLocal());
        }
    } catch {
        /* Sin almacenamiento: el estado se conserva durante esta visita. */
    }
}

function actualizarBotonWhatsapp() {
    const boton = document.getElementById('btnWhatsappCarrito');
    if (!boton) return;

    const habilitado = terminosAceptados && Boolean(boton.dataset.href);

    if (habilitado) {
        boton.href = boton.dataset.href;
        boton.removeAttribute('aria-disabled');
        boton.removeAttribute('tabindex');
        boton.classList.remove('resumen__wa--deshabilitado');
    } else {
        boton.removeAttribute('href');
        boton.setAttribute('aria-disabled', 'true');
        boton.setAttribute('tabindex', '-1');
        boton.classList.add('resumen__wa--deshabilitado');
    }
}

function actualizarEstadoTerminos(aceptado) {
    terminosAceptados = Boolean(aceptado);

    const checkbox = document.getElementById('aceptaTerminos');
    const botonFinalizar = document.getElementById('btnFinalizar');
    const etiqueta = document.getElementById('terminosLabel');
    const ayuda = document.getElementById('terminosAyuda');

    if (checkbox) checkbox.checked = terminosAceptados;
    if (botonFinalizar) botonFinalizar.disabled = !terminosAceptados;
    if (etiqueta) etiqueta.classList.remove('resumen__terminos--error');

    if (ayuda) {
        ayuda.classList.remove('resumen__legal--error');
        ayuda.textContent = terminosAceptados
            ? `Aceptaste los términos y condiciones (versión ${terminosVersion}).`
            : AYUDA_TERMINOS;
    }

    actualizarBotonWhatsapp();
}

function mostrarErrorTerminos() {
    const checkbox = document.getElementById('aceptaTerminos');
    const etiqueta = document.getElementById('terminosLabel');
    const ayuda = document.getElementById('terminosAyuda');

    etiqueta?.classList.add('resumen__terminos--error');
    if (ayuda) {
        ayuda.classList.add('resumen__legal--error');
        ayuda.textContent = 'Debes aceptar los términos y condiciones para continuar.';
    }

    checkbox?.focus();
    tiendaToast('Acepta los términos y condiciones para continuar.', 'aviso');
}

function sincronizarTerminosConSesion() {
    const aceptadoEnCuenta = Boolean(
        clienteTienda
        && String(clienteTienda.terminos_version_aceptada || '') === terminosVersion
    );

    if (aceptadoEnCuenta) guardarTerminosLocal(true);

    actualizarEstadoTerminos(aceptadoEnCuenta || leerTerminosLocal());
}

function configurarTerminos() {
    const checkbox = document.getElementById('aceptaTerminos');
    if (!checkbox) return;

    terminosVersion = checkbox.dataset.version || terminosVersion;

    checkbox.addEventListener('change', async () => {
        const aceptado = checkbox.checked;
        guardarTerminosLocal(aceptado);
        actualizarEstadoTerminos(aceptado);

        if (!aceptado || !clienteTienda || !window.TiendaAPI?.post) return;

        try {
            await window.TiendaAPI.post('/tienda/api/terminos/aceptar', {
                version: terminosVersion,
            });
            clienteTienda.terminos_version_aceptada = terminosVersion;
        } catch {
            tiendaToast(
                'La aceptación quedó guardada en este dispositivo, pero no pudimos sincronizarla con tu cuenta.',
                'aviso'
            );
        }
    });

    document.getElementById('terminosEnlace')?.addEventListener('click', (evento) => {
        evento.stopPropagation();
    });

    document.getElementById('btnWhatsappCarrito')?.addEventListener('click', (evento) => {
        if (terminosAceptados) return;
        evento.preventDefault();
        mostrarErrorTerminos();
    });

    sincronizarTerminosConSesion();
}

function importeLinea(item) {
    return Number(item.precio || 0) * Number(item.cantidad || 0);
}

function aplicarDescuento(opcion, base, unidades = 0) {
    if (!opcion || base <= 0) return 0;

    const valor = Number(opcion.valor) || 0;

    if (opcion.tipo === 'porcentaje') {
        return Math.min(base, Math.round((base * valor) / 100 * 100) / 100);
    }

    if (opcion.tipo === 'monto') {
        return Math.min(base, valor);
    }

    if (opcion.tipo === 'precio' && unidades > 0) {
        return Math.min(base, Math.max(0, base - valor * unidades));
    }

    return 0;
}

function itemEsZapatos(item) {
    return window.esCategoriaZapatos?.(item.categoria) ?? false;
}

function textoCategoria(valor) {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function opcionCupon(cupon) {
    const categoria = cupon?.categoria ? String(cupon.categoria).trim() : null;

    return {
        id: `cupon:${cupon.codigo}`,
        codigo: cupon.codigo,
        titulo: cupon.nombre || `Cupón ${cupon.codigo}`,
        detalle: categoria ? `Cupón · solo ${categoria}` : `Cupón ${cupon.codigo}`,
        etiqueta: cupon.etiqueta || '',
        tipo: cupon.tipo,
        valor: Number(cupon.valor) || 0,
        alcance: categoria ? 'categoria' : 'total',
        categorias: categoria ? [categoria] : null,
        fecha_fin: cupon.fecha_fin || null,
    };
}

function itemAplicaOpcion(item, opcion) {
    if (!opcion?.categorias?.length) return true;

    const categoria = textoCategoria(item.categoria);

    return opcion.categorias.some((fila) => textoCategoria(fila) === categoria);
}

/* Precio unitario con el descuento seleccionado (para mostrarlo en cada talla). */
function precioUnitarioConDescuento(item, modo = descuentoModo) {
    const precio = Number(item.precio) || 0;
    if (!modo || modo === 'ninguno' || precio <= 0) return precio;

    const aplicar = (opcion) => {
        if (!opcion) return precio;

        const valor = Number(opcion.valor) || 0;

        if (opcion.tipo === 'porcentaje') {
            return Math.max(0, Math.round(precio * (1 - valor / 100) * 100) / 100);
        }

        if (opcion.tipo === 'monto') {
            return Math.max(0, precio - valor);
        }

        if (opcion.tipo === 'precio') {
            return valor;
        }

        return precio;
    };

    if (modo === 'bienvenida') {
        return itemEsZapatos(item) ? aplicar(descuentosTienda.cliente) : precio;
    }

    if (modo === 'cliente') {
        return aplicar(descuentosTienda.cliente);
    }

    if (modo.startsWith('promocion:')) {
        const promo = descuentosTienda.promociones.find((fila) => fila.id === modo);

        if (promo && String(item.productoId) === String(promo.id_producto)) {
            return aplicar(promo);
        }

        /* La bienvenida sigue aplicando al resto de zapatos. */
        if (descuentosTienda.cliente?.id === 'bienvenida') {
            return itemEsZapatos(item) ? aplicar(descuentosTienda.cliente) : precio;
        }

        return precio;
    }

    if (modo.startsWith('cupon:')) {
        const cupon = cuponesTienda.map(opcionCupon).find((fila) => fila.id === modo);

        return cupon && itemAplicaOpcion(item, cupon) ? aplicar(cupon) : precio;
    }

    return precio;
}

function descuentoDeOpcion(modo, items) {
    if (!modo || modo === 'ninguno') return 0;

    if (modo === 'bienvenida' || modo === 'cliente') {
        /* El 10% de bienvenida solo aplica a Zapatos. */
        const elegibles = modo === 'bienvenida' ? items.filter(itemEsZapatos) : items;
        if (!elegibles.length) return 0;

        const base = elegibles.reduce((total, item) => total + importeLinea(item), 0);
        return aplicarDescuento(descuentosTienda.cliente, base);
    }

    if (modo.startsWith('promocion:')) {
        const promo = descuentosTienda.promociones.find((fila) => fila.id === modo);
        if (!promo) return 0;

        const propios = items.filter((item) => String(item.productoId) === String(promo.id_producto));
        if (!propios.length) return 0;

        const base = propios.reduce((total, item) => total + importeLinea(item), 0);
        const unidades = propios.reduce((total, item) => total + Number(item.cantidad || 0), 0);

        let total = aplicarDescuento(promo, base, unidades);

        /* La bienvenida nunca se cancela: se aplica al resto de zapatos. */
        const opcionCuenta = descuentosTienda.cliente;

        if (opcionCuenta?.id === 'bienvenida') {
            const resto = items.filter(
                (item) => String(item.productoId) !== String(promo.id_producto) && itemEsZapatos(item)
            );

            if (resto.length) {
                total += aplicarDescuento(
                    opcionCuenta,
                    resto.reduce((suma, item) => suma + importeLinea(item), 0)
                );
            }
        }

        return total;
    }

    if (modo.startsWith('cupon:')) {
        const cupon = cuponesTienda.map(opcionCupon).find((fila) => fila.id === modo);
        if (!cupon) return 0;

        const elegibles = items.filter((item) => itemAplicaOpcion(item, cupon));
        if (!elegibles.length) return 0;

        const base = elegibles.reduce((total, item) => total + importeLinea(item), 0);
        const unidades = elegibles.reduce((total, item) => total + Number(item.cantidad || 0), 0);

        return aplicarDescuento(cupon, base, unidades);
    }

    return 0;
}

function opcionesDescuento(items) {
    const opciones = [];

    if (descuentosTienda.cliente) {
        const esBienvenida = descuentosTienda.cliente.id === 'bienvenida';

        if (!esBienvenida || items.some(itemEsZapatos)) opciones.push(descuentosTienda.cliente);
    }

    descuentosTienda.promociones.forEach((promo) => {
        const aplica = items.some((item) => String(item.productoId) === String(promo.id_producto));
        if (aplica) opciones.push(promo);
    });

    cuponesTienda.forEach((cupon) => {
        const opcion = opcionCupon(cupon);

        if (items.some((item) => itemAplicaOpcion(item, opcion))) opciones.push(opcion);
    });

    return opciones;
}

function guardarModoDescuento(manual = false) {
    try {
        localStorage.setItem(CLAVE_DESCUENTO_MODO, descuentoModo);
        if (manual) localStorage.setItem(`${CLAVE_DESCUENTO_MODO}_manual`, '1');
    } catch {
        /* sin almacenamiento: el modo se mantiene en memoria */
    }
}

function eleccionManualDescuento() {
    try {
        return localStorage.getItem(`${CLAVE_DESCUENTO_MODO}_manual`) === '1';
    } catch {
        return false;
    }
}

function pintarDescuentos(items) {
    const caja = document.getElementById('carritoDescuentos');
    const lista = document.getElementById('carritoDescuentoOpciones');
    const aviso = document.getElementById('carritoAvisoDescuento');
    if (!caja || !lista || !aviso) return;

    if (!clienteTienda) {
        caja.hidden = true;
        aviso.hidden = false;
        descuentoModo = 'ninguno';
        return;
    }

    aviso.hidden = true;

    const opciones = opcionesDescuento(items);

    if (!opciones.length) {
        caja.hidden = true;
        descuentoModo = 'ninguno';
        return;
    }

    /* La promoción del producto tiene prioridad; si no hay, va el descuento de la cuenta. */
    seleccionarDescuentoPorDefecto(items);

    if (descuentoModo !== 'ninguno' && !opciones.some((opcion) => opcion.id === descuentoModo)) {
        descuentoModo = 'ninguno';
        guardarModoDescuento();
    }

    caja.hidden = false;

    const tarjeta = (id, titulo, detalle, etiqueta, activo) => `
        <label class="resumen__dto${activo ? ' is-activo' : ''}">
            <input type="radio" name="descuento_carrito" value="${escapar(id)}" ${activo ? 'checked' : ''}>
            <span class="resumen__dto-texto">
                <strong>${escapar(titulo)}</strong>
                <small>${escapar(detalle)}</small>
            </span>
            <span class="resumen__dto-sello">${escapar(etiqueta)}</span>
        </label>`;

    lista.innerHTML = tarjeta('ninguno', 'Sin descuento', 'Pagar el precio normal', '—', descuentoModo === 'ninguno')
        + opciones.map((opcion) => tarjeta(
            opcion.id,
            opcion.titulo,
            opcion.detalle,
            opcion.etiqueta,
            descuentoModo === opcion.id
        )).join('');

    lista.querySelectorAll('input[name="descuento_carrito"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            if (!radio.checked) return;

            descuentoModo = radio.value;
            guardarModoDescuento(true);
            pintarCarrito();
        });
    });
}

function normalizarDescuentoCliente(datos) {
    if (!datos) return null;
    if (datos.id) return datos;

    const bienvenida = Boolean(datos.primera_compra);

    return {
        ...datos,
        id: bienvenida ? 'bienvenida' : 'cliente',
        titulo: datos.titulo || (bienvenida ? 'Descuento de bienvenida' : 'Descuento especial'),
        detalle: datos.motivo || (bienvenida ? '10% solo en zapatos' : 'Se aplica a todo el pedido'),
    };
}

/* Normaliza una promoción del ERP (web_promociones) al formato del selector. */
function normalizarPromocion(fila) {
    const valor = Number(fila?.valor_descuento ?? fila?.valor) || 0;
    const tipo = fila?.tipo_descuento || fila?.tipo || '';
    const idPromocion = fila?.id_promocion;

    return {
        id: fila?.id || `promocion:${idPromocion}`,
        id_promocion: idPromocion,
        id_producto: fila?.id_producto,
        titulo: fila?.producto || fila?.titulo || 'Promoción',
        detalle: 'Se suma a tu bienvenida en el resto',
        etiqueta: tipo === 'porcentaje'
            ? `${Math.round(valor)}%`
            : `C$ ${valor.toFixed(2)}`,
        tipo,
        valor,
        alcance: 'producto',
    };
}

/* Prioridad: la promoción del producto manda sobre el descuento de bienvenida. */
function seleccionarDescuentoPorDefecto(items = Carrito.items()) {
    if (eleccionManualDescuento()) return;

    const promo = descuentosTienda.promociones.find((fila) => items.some(
        (item) => String(item.productoId) === String(fila.id_producto)
    ));

    if (promo) {
        descuentoModo = promo.id;
        guardarModoDescuento();
        return;
    }

    if (descuentosTienda.cliente) {
        descuentoModo = descuentosTienda.cliente.id;
        guardarModoDescuento();
    }
}

async function cargarDescuentos() {
    if (!clienteTienda) {
        descuentosTienda = { cliente: null, promociones: [] };
        return;
    }

    let promociones = [];

    try {
        const datos = await window.TiendaAPI.get('/tienda/api/descuentos');
        descuentosTienda = {
            cliente: normalizarDescuentoCliente(datos?.descuento_cliente) || normalizarDescuentoCliente(descuentoCliente),
            promociones: (datos?.promociones || []).map(normalizarPromocion),
        };

        seleccionarDescuentoPorDefecto();
        return;
    } catch {
        /* Sin la función nueva: se usan las promociones que ya publica el ERP. */
    }

    try {
        const datos = await window.TiendaAPI.get('/tienda/api/promociones');
        promociones = (datos?.promociones || []).map(normalizarPromocion);
    } catch {
        promociones = [];
    }

    descuentosTienda = {
        cliente: normalizarDescuentoCliente(descuentoCliente),
        promociones,
    };

    seleccionarDescuentoPorDefecto();
}

async function cargarCupones() {
    if (!clienteTienda) {
        cuponesTienda = [];
        return;
    }

    try {
        const datos = await window.TiendaAPI.get('/tienda/api/cupones');
        cuponesTienda = datos?.cupones || [];
    } catch {
        cuponesTienda = [];
    }
}

/* El carrito guarda el precio al agregar; se refresca con los precios actuales del ERP. */
async function sincronizarPreciosCarrito() {
    const items = Carrito.items();
    if (!items.length) return false;

    const ids = [...new Set(items.map((item) => String(item.productoId)))];
    const mapa = {};

    for (const id of ids) {
        try {
            const respuesta = await fetch(`/tienda/api/productos/${id}`, { headers: { Accept: 'application/json' } });
            if (!respuesta.ok) continue;

            const datos = await respuesta.json();
            const producto = datos?.producto;
            if (!producto) continue;

            (producto.variaciones || []).forEach((variacion) => {
                (variacion.tallas || []).forEach((talla) => {
                    mapa[`${producto.id}-${variacion.id}-${talla.id}`] = {
                        precio: talla.precio ?? producto.precio,
                        stock: talla.stock,
                        nombre: producto.nombre,
                        categoria: producto.categoria,
                        imagen: (variacion.imagenes && variacion.imagenes[0]) || producto.imagen,
                    };
                });
            });
        } catch {
            /* Sin conexión: se mantienen los datos guardados. */
        }
    }

    return Carrito.actualizarDatos(mapa);
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

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
    if (!Number.isFinite(Number(origen.lat)) || !Number.isFinite(Number(origen.lng))) return null;

    const km = distanciaKm(Number(origen.lat), Number(origen.lng), lat, lng);
    const precioPorKm = Number(DELIVERY_CONFIG.precioPorKm) || 0;
    const paso = Number(DELIVERY_CONFIG.redondeo) || 5;
    const minimo = Number(DELIVERY_CONFIG.minimo) || 0;
    const maximoKm = Number(DELIVERY_CONFIG.maximoKm) || 0;
    const bruto = km * precioPorKm;
    const redondeado = Math.max(0, Math.floor(bruto / paso) * paso);
    /* Fuera del radio de delivery solo se envía por Cargo Trans / encomienda.
       Se compara con 2 decimales (los mismos que guarda el servidor) para que
       una dirección justo en el límite no caiga por ruido de punto flotante. */
    const kmLimite = Math.round(km * 100) / 100;
    const excede = maximoKm > 0 && kmLimite > maximoKm;
    const final = excede ? 0 : Math.max(minimo, redondeado);
    const aplicoMinimo = !excede && final > redondeado;

    return {
        km,
        bruto,
        redondeado,
        final,
        paso,
        minimo,
        maximoKm,
        excede,
        metodoEntrega: excede ? 'encomienda' : 'delivery',
        aplicoMinimo,
    };
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

    const { km, bruto, final, aplicoMinimo, excede, maximoKm } = envioDetalle;
    const precioPorKm = Number(DELIVERY_CONFIG.precioPorKm) || 0;

    if (excede) {
        detalle.textContent = `${formatearKm(km)} km · fuera del radio de delivery (${formatearKm(maximoKm)} km): se envía por Cargo Trans / encomienda.`;

        if (envioNodo) {
            envioNodo.textContent = 'Encomienda';
            envioNodo.classList.remove('resumen__gratis');
        }

        return;
    }

    detalle.textContent = aplicoMinimo
        ? `Tarifa mínima de ${moneda(final)} (${formatearKm(km)} km).`
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

    const { km, bruto, redondeado, final, paso, minimo, aplicoMinimo, excede, maximoKm } = envioDetalle;
    const precioPorKm = Number(DELIVERY_CONFIG.precioPorKm) || 0;

    if (excede) {
        info.innerHTML = `
            <div class="carrito-entrega__linea"><span>Distancia</span><strong>${formatearKm(km)} km</strong></div>
            <div class="carrito-entrega__linea carrito-entrega__linea--final"><span>Entrega</span><strong>Cargo Trans / Encomienda</strong></div>
            <p class="carrito-entrega__redondeo">
                Estás a más de ${formatearKm(maximoKm)} km, así que no hacemos delivery a domicilio.
                Tu pedido viaja por Cargo Trans o encomienda y el costo del envío se paga en la transportadora al retirarlo.
            </p>
        `;
        return;
    }

    info.innerHTML = `
        <div class="carrito-entrega__linea"><span>Distancia</span><strong>${formatearKm(km)} km</strong></div>
        ${aplicoMinimo
            ? `<div class="carrito-entrega__linea"><span>Tarifa mínima</span><strong>${moneda(minimo)}</strong></div>`
            : `<div class="carrito-entrega__linea"><span>Cálculo</span><strong>${formatearKm(km)} km × ${moneda(precioPorKm)} = ${moneda(bruto)}</strong></div>
               ${redondeado > 0 ? `<div class="carrito-entrega__linea"><span>Redondeo</span><strong>${moneda(redondeado)}</strong></div>` : ''}`}
        <div class="carrito-entrega__linea carrito-entrega__linea--final"><span>Envío</span><strong>${moneda(final)}</strong></div>
        <p class="carrito-entrega__redondeo">${aplicoMinimo
            ? `Se aplica la tarifa mínima de ${moneda(minimo)}.`
            : `Redondeo a la baja al múltiplo de ${moneda(paso)} más cercano.`}</p>
    `;
}

function actualizarDetallePago(valor) {
    document.querySelectorAll('[data-pago-detalle]').forEach((detalle) => {
        detalle.hidden = detalle.dataset.pagoDetalle !== valor;
    });
}

function marcarMetodoPago(valor) {
    document.querySelectorAll('.pago-opcion').forEach((opcion) => {
        const input = opcion.querySelector('input[name="metodo_pago"]');
        if (!input) return;

        const activo = input.value === valor;
        input.checked = activo;
        opcion.classList.toggle('is-activo', activo);
    });

    actualizarDetallePago(valor);
}

function configurarEnlaceBilletera() {
    const enlace = document.getElementById('btnAbrirBilletera');
    if (!enlace) return;

    const navegador = navigator.userAgent || '';

    if (/android/i.test(navegador)) {
        enlace.href = BILLETERA_APP.android;
    } else if (/iphone|ipad|ipod/i.test(navegador)) {
        enlace.href = BILLETERA_APP.ios;
    } else {
        enlace.href = BILLETERA_APP.web;
    }
}

function copiarTextoFallback(valor) {
    const area = document.createElement('textarea');
    area.value = valor;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();

    try {
        return document.execCommand('copy');
    } finally {
        area.remove();
    }
}

async function copiarTexto(valor) {
    if (!valor) return false;

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(valor);
            return true;
        }
    } catch {
        // Intenta el método clásico si el navegador bloquea la API moderna.
    }

    try {
        return copiarTextoFallback(valor);
    } catch {
        return false;
    }
}

function actualizarMotivoTransferencia() {
    const campo = document.getElementById('motivoTransferencia');
    if (!campo) return;

    const nombre = String(clienteTienda?.nombre_cliente || '').trim() || 'Cliente sin identificar';
    const telefono = String(clienteTienda?.telefono_cliente || '').trim() || 'Sin teléfono';
    const horaEntrega = String(document.getElementById('carritoHoraEntrega')?.value || '').trim();

    const productos = Carrito.items().map((item) => {
        const variantes = [item.color, item.talla ? `Talla ${item.talla}` : '']
            .filter(Boolean)
            .join(', ');
        const cantidad = Number(item.cantidad) || 1;

        return `${item.nombre || 'Producto'}${variantes ? ` (${variantes})` : ''} x${cantidad}`;
    }).join('; ');

    campo.value = `Pago Tellez Nic Store | Cliente: ${nombre} | Teléfono: ${telefono} | Productos: ${productos || 'Sin productos'}${horaEntrega ? ` | Entrega: ${horaEntrega}` : ''}`;
}

async function copiarDato(boton) {
    const valor = boton.dataset.copiarCampo
        ? document.querySelector(boton.dataset.copiarCampo)?.value || ''
        : boton.dataset.copiar || '';

    if (!valor) return;

    const copiado = await copiarTexto(valor);

    if (!copiado) {
        tiendaToast('No se pudo copiar. Selecciona el dato manualmente.', 'aviso');
        return;
    }

    const textoOriginal = boton.textContent;
    boton.textContent = 'Copiado';
    setTimeout(() => {
        boton.textContent = textoOriginal;
    }, 1600);

    tiendaToast('Dato copiado.', 'exito');
}

function inicializarMetodoPago() {
    const opciones = [...document.querySelectorAll('input[name="metodo_pago"]')];
    if (!opciones.length) return;

    let guardado = '';

    try {
        guardado = localStorage.getItem(CLAVE_METODO_PAGO) || '';
    } catch {
        guardado = '';
    }

    const elegido = opciones.find((opcion) => opcion.value === guardado)?.value || 'efectivo';
    marcarMetodoPago(elegido);

    opciones.forEach((opcion) => {
        opcion.addEventListener('change', () => {
            if (!opcion.checked) return;

            marcarMetodoPago(opcion.value);

            try {
                localStorage.setItem(CLAVE_METODO_PAGO, opcion.value);
            } catch {
                // Sin localStorage: la elección queda solo para esta visita.
            }
        });
    });
}

function metodoPagoSeleccionado() {
    return document.querySelector('input[name="metodo_pago"]:checked')?.value || 'efectivo';
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
    return window.TiendaUtil.moneda(valor);
}

function escapar(valor) {
    return window.TiendaUtil.escapar(valor);
}

/* Agrupa las tallas de un mismo producto+color en una sola tarjeta. */
function claveGrupo(item) {
    return `${item.productoId}|${item.variacionId || item.color || ''}`;
}

function gruposCarrito(items) {
    const mapa = new Map();

    items.forEach((item) => {
        const clave = claveGrupo(item);

        if (!mapa.has(clave)) mapa.set(clave, { clave, items: [] });
        mapa.get(clave).items.push(item);
    });

    return [...mapa.values()];
}

function tallaHTML(item) {
    const base = Number(item.precio) || 0;
    const final = precioUnitarioConDescuento(item);
    const cantidad = Number(item.cantidad) || 0;
    const conDescuento = final < base;

    return `
        <div class="carrito-talla" data-clave="${escapar(item.clave)}">
            <span class="carrito-talla__nombre">Talla ${escapar(item.talla || 'Única')}</span>

            <span class="carrito-talla__precio${conDescuento ? ' is-descuento' : ''}">
                ${conDescuento
                    ? `<s>${moneda(base)}</s><strong>${moneda(final)}</strong>`
                    : moneda(base)}
                ${cantidad > 1 ? `<small>×${cantidad} = ${moneda(final * cantidad)}</small>` : ''}
            </span>

            <div class="stepper">
                <button type="button" data-accion="restar" aria-label="Quitar una unidad">−</button>
                <span>${cantidad}</span>
                <button type="button" data-accion="sumar" aria-label="Agregar una unidad">+</button>
            </div>

            <button type="button" class="carrito-item__quitar" data-accion="quitar" aria-label="Eliminar talla ${escapar(item.talla || '')}">
                <i class="bi bi-trash"></i>
            </button>
        </div>`;
}

function itemHTML(grupo) {
    const primero = grupo.items[0];
    const tallas = grupo.items.map((item) => item.talla).filter(Boolean);
    const detalle = [primero.color, tallas.length ? `Tallas ${tallas.join(' ')}` : '']
        .filter(Boolean)
        .join(' · ');

    const base = Number(primero.precio) || 0;
    const final = precioUnitarioConDescuento(primero);
    const conDescuento = final < base;
    const unidad = conDescuento
        ? `<s class="carrito-item__precio-antes">${moneda(base)}</s> ${moneda(final)}`
        : moneda(base);

    return `
        <article class="carrito-item carrito-item--grupo" data-grupo="${escapar(grupo.clave)}">
            <img class="carrito-item__img" src="${escapar(primero.imagen || IMAGEN_FALLBACK)}" alt="${escapar(primero.nombre)}"
                 onerror="this.src='${IMAGEN_FALLBACK}'">

            <div class="carrito-item__datos">
                <a class="carrito-item__nombre" href="/producto?p=${escapar(primero.productoId)}">${escapar(primero.nombre)}</a>
                <span class="carrito-item__meta">${escapar(detalle)}</span>
                <span class="carrito-item__precio">${unidad}</span>
                ${conDescuento ? `<span class="carrito-item__ahorro">Ahorras ${moneda((base - final) * grupo.items.reduce((t, i) => t + Number(i.cantidad || 0), 0))}</span>` : ''}
            </div>

            <div class="carrito-item__tallas">
                ${grupo.items.map(tallaHTML).join('')}
            </div>
        </article>
    `;
}

function actualizarResumen(items = Carrito.items()) {
    const contenedor = document.getElementById('carritoLista');
    const resumen = document.getElementById('carritoResumen');
    const vacio = document.getElementById('carritoVacio');

    actualizarMotivoTransferencia();

    if (!items.length) {
        if (contenedor) contenedor.innerHTML = '';
        if (vacio) vacio.hidden = false;
        if (resumen) resumen.hidden = true;
        document.getElementById('carritoUnidades').textContent = '';

        const pago = document.getElementById('carritoPago');
        if (pago) pago.hidden = true;
        return;
    }

    if (vacio) vacio.hidden = true;
    if (resumen) resumen.hidden = false;

    const pago = document.getElementById('carritoPago');
    if (pago) pago.hidden = false;

    pintarDescuentos(items);

    const unidades = items.reduce((total, item) => total + Number(item.cantidad || 0), 0);
    const subtotal = items.reduce((total, item) => total + Number(item.precio || 0) * Number(item.cantidad || 0), 0);
    const descuento = descuentoDeOpcion(descuentoModo, items);
    const total = Math.max(0, subtotal - descuento + envio);

    document.getElementById('carritoUnidades').textContent = `${unidades} ${unidades === 1 ? 'artículo' : 'artículos'}`;
    document.getElementById('carritoSubtotal').textContent = moneda(subtotal);
    document.getElementById('carritoTotal').textContent = moneda(total);

    const filaDescuento = document.getElementById('carritoDescuentoFila');

    if (filaDescuento) {
        const opcion = opcionesDescuento(items).find((fila) => fila.id === descuentoModo);

        let etiqueta = opcion?.etiqueta || '';

        /* Promoción + bienvenida: se muestra el detalle combinado. */
        if (descuentoModo.startsWith('promocion:') && descuentosTienda.cliente?.id === 'bienvenida') {
            const promo = descuentosTienda.promociones.find((fila) => fila.id === descuentoModo);
            const hayResto = items.some(
                (item) => String(item.productoId) !== String(promo?.id_producto) && itemEsZapatos(item)
            );

            if (hayResto) etiqueta = `${etiqueta} + ${descuentosTienda.cliente.etiqueta}`;
        }

        filaDescuento.hidden = descuento <= 0;
        document.getElementById('carritoDescuento').textContent = `- ${moneda(descuento)}`;
        document.getElementById('carritoDescuentoEtiqueta').textContent = etiqueta
            ? `(${etiqueta})`
            : '';
    }

    pintarDetalleResumen();
    actualizarWhatsappCarrito(items, subtotal, descuento, total);
}

function actualizarWhatsappCarrito(items, subtotal, descuento, total) {
    const boton = document.getElementById('btnWhatsappCarrito');
    if (!boton) return;

    const lineas = ['Hola, quiero hacer este pedido:', ''];

    items.forEach((item) => {
        const detalle = [item.nombre, item.color, item.talla ? `Talla ${item.talla}` : ''].filter(Boolean).join(' · ');
        const importe = precioUnitarioConDescuento(item) * Number(item.cantidad || 0);
        lineas.push(`• ${item.cantidad} × ${detalle} — ${moneda(importe)}`);
    });

    lineas.push('', `Subtotal: ${moneda(subtotal)}`);
    if (descuento > 0) lineas.push(`Descuento: - ${moneda(descuento)}`);
    if (envio > 0) {
        lineas.push(`Envío: ${moneda(envio)}`);
    } else if (envioDetalle?.excede) {
        lineas.push('Entrega: Cargo Trans / Encomienda (envío por cobrar en la transportadora)');
    }
    lineas.push(`Total: ${moneda(total)}`);

    boton.dataset.href = `https://wa.me/${WHATSAPP_TIENDA}?text=${encodeURIComponent(lineas.join('\n'))}`;
    actualizarBotonWhatsapp();
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
        const pago = document.getElementById('carritoPago');
        if (entrega) entrega.hidden = true;
        if (avisoEntrega) avisoEntrega.hidden = true;
        if (pago) pago.hidden = true;
        return;
    }

    vacio.hidden = true;
    resumen.hidden = false;

    const pago = document.getElementById('carritoPago');
    if (pago) pago.hidden = false;

    contenedor.innerHTML = gruposCarrito(items).map(itemHTML).join('');
    actualizarResumen(items);
}

function actualizarCantidadFila(fila, cantidad) {
    const valor = fila?.querySelector('.stepper span');

    if (valor) valor.textContent = String(cantidad);
}

function quitarFila(clave, fila, mensaje) {
    Carrito.quitar(clave);
    tiendaToast(mensaje, 'info');

    /* Se repinta el listado para reagrupar tallas y actualizar totales. */
    pintarCarrito();
}

function cambiar(clave, accion) {
    const items = Carrito.items();
    const item = items.find(fila => fila.clave === clave);
    if (!item) return;

    const fila = [...document.querySelectorAll('.carrito-talla, .carrito-item')]
        .find(nodo => nodo.dataset.clave === clave);

    if (accion === 'sumar') {
        const stock = Number(item.stock || 0) || 999;
        const nueva = Number(item.cantidad) + 1;

        if (nueva > stock) {
            tiendaToast(`Solo hay ${stock} ${stock === 1 ? 'disponible' : 'disponibles'} de este artículo.`, 'aviso');
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
    configurarTerminos();
    configurarEnlaceBilletera();
    inicializarMetodoPago();

    try {
        descuentoModo = localStorage.getItem(CLAVE_DESCUENTO_MODO) || 'ninguno';
    } catch {
        descuentoModo = 'ninguno';
    }

    pintarCarrito();

    /* Los precios pueden haber cambiado en el ERP: se refrescan al abrir el carrito. */
    sincronizarPreciosCarrito().then((cambios) => {
        if (!cambios) return;

        pintarCarrito();
        tiendaToast('Actualizamos los precios de tu carrito.', 'info');
    });

    document.querySelectorAll('[data-copiar], [data-copiar-campo]').forEach((boton) => {
        boton.addEventListener('click', () => copiarDato(boton));
    });

    window.sesionTiendaPromise.then(async (sesion) => {
        clienteTienda = sesion?.cliente || null;
        sincronizarTerminosConSesion();
        actualizarMotivoTransferencia();

        const descuento = sesion?.cliente?.descuento || null;

        // Solo actualiza totales: repintar la lista completa causaba parpadeo.
        if (JSON.stringify(descuento) !== JSON.stringify(descuentoCliente)) {
            descuentoCliente = descuento;
            actualizarResumen();
        }

        await cargarDescuentos();
        await cargarCupones();
        pintarCarrito();

        await cargarEntrega(sesion);
    });

    document.getElementById('carritoDireccion')?.addEventListener('change', (evento) => {
        seleccionarDireccion(evento.target.value);
    });

    document.getElementById('carritoHoraEntrega')?.addEventListener('change', () => {
        actualizarMotivoTransferencia();
    });

    document.getElementById('formCupon')?.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const campo = document.getElementById('cuponCodigo');
        const codigo = String(campo?.value || '').trim();

        if (!codigo) {
            tiendaToast('Escribe el código del cupón.', 'aviso');
            return;
        }

        try {
            const datos = await window.TiendaAPI.post('/tienda/api/cupones/canjear', { codigo });
            tiendaToast(datos?.mensaje || 'Cupón agregado a tu cuenta.', 'exito');

            if (campo) campo.value = '';

            await cargarCupones();

            const cupon = cuponesTienda.find(
                (fila) => String(fila.codigo).toUpperCase() === codigo.toUpperCase()
            );

            if (cupon) {
                descuentoModo = `cupon:${cupon.codigo}`;
                guardarModoDescuento(true);
            }

            pintarCarrito();
        } catch (error) {
            tiendaToast(error?.data?.mensaje || error?.message || 'No se pudo usar el cupón.', 'aviso');
        }
    });

    document.getElementById('btnVaciar')?.addEventListener('click', () => {
        Carrito.vaciar();
        pintarCarrito();
        tiendaToast('Carrito vaciado.', 'info');
    });

    document.getElementById('btnFinalizar')?.addEventListener('click', async () => {
        const boton = document.getElementById('btnFinalizar');
        const items = Carrito.items();

        if (!items.length) {
            tiendaToast('Tu carrito está vacío.', 'aviso');
            return;
        }

        if (!terminosAceptados) {
            mostrarErrorTerminos();
            return;
        }

        if (!clienteTienda) {
            try {
                sessionStorage.setItem('tienda_redirect', urlTienda('carrito'));
            } catch {
                /* sin almacenamiento: el login vuelve al inicio */
            }

            tiendaToast('Inicia sesión para enviar tu pedido.', 'aviso');
            window.location.href = urlTienda('login');
            return;
        }

        if (!direccionEntrega) {
            tiendaToast('Selecciona una dirección para calcular el envío.', 'aviso');
            return;
        }

        if (!envioDetalle) {
            tiendaToast('La dirección no tiene ubicación. Edítala para calcular el envío.', 'aviso');
            return;
        }

        if (boton) {
            boton.disabled = true;
            boton.textContent = 'Enviando pedido…';
        }

        try {
            const datos = await window.TiendaAPI.post('/tienda/api/pedidos', {
                metodo_pago: metodoPagoSeleccionado(),
                metodo_entrega: envioDetalle?.metodoEntrega || 'delivery',
                descuento_modo: descuentoModo,
                cupon_codigo: descuentoModo.startsWith('cupon:') ? descuentoModo.slice(6) : null,
                hora_entrega_preferida: document.getElementById('carritoHoraEntrega')?.value || null,
                direccion: {
                    nombre: clienteTienda.nombre_cliente,
                    telefono: clienteTienda.telefono_cliente,
                    direccion: direccionEntrega.direccion_manual || direccionEntrega.nombre_direccion,
                    referencia: direccionEntrega.referencia_direccion,
                    lat: direccionEntrega.latitud_direccion,
                    lng: direccionEntrega.longitud_direccion,
                },
                items: items.map((item) => ({
                    id_variacion_talla: Number(item.tallaId),
                    cantidad: Number(item.cantidad),
                })),
            });

            const numero = datos?.pedido?.numero_pedido || 'tu pedido';

            Carrito.vaciar();
            pintarCarrito();

            const campoHora = document.getElementById('carritoHoraEntrega');
            if (campoHora) campoHora.value = '';

            tiendaToast(`Pedido ${numero} recibido. Te confirmaremos cuando llegue el pago.`, 'exito');

            setTimeout(() => {
                window.location.href = `${urlTienda('perfil')}#pedidos`;
            }, 1200);
        } catch (error) {
            const errores = error?.data?.errors;
            const mensaje = errores ? Object.values(errores)[0] : error?.message;

            tiendaToast(
                Array.isArray(mensaje) ? mensaje[0] : (mensaje || 'No se pudo enviar el pedido.'),
                'aviso'
            );

            if (boton) {
                boton.disabled = !terminosAceptados;
                boton.textContent = 'Finalizar compra';
            }
        }
    });

    if (window.TIENDA_MODO_PRUEBA) {
        const boton = document.getElementById('btnFinalizar');

        if (boton) {
            const aviso = document.createElement('p');
            aviso.className = 'resumen__aviso';
            aviso.textContent = 'Modo prueba: este pedido no se guardará.';
            boton.before(aviso);
        }
    }
});
