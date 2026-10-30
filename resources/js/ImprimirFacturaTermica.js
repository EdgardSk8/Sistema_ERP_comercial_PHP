import logoEmpresa from '../img/minilogo.PNG';

function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caracter]);
}

function formatoMoneda(valor) {
    return `C$ ${monto(valor)}`;
}

function monto(valor) {
    const numero = Number(valor || 0);
    return Number.isInteger(numero) ? String(numero) : numero.toFixed(2);
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES_ANIO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatearFechaLarga(fecha) {
    return `${DIAS_SEMANA[fecha.getDay()]} ${fecha.getDate()} de ${MESES_ANIO[fecha.getMonth()]} del ${fecha.getFullYear()}`;
}

function normalizarProducto(producto) {
    const cantidad = Number(producto.cantidad ?? producto.cantidad_venta ?? 0);
    const precio = Number(producto.precio ?? producto.precio_unitario_venta ?? 0);
    const nombreBase = producto.producto?.nombre_producto
        ?? producto.nombre_producto
        ?? producto.nombre
        ?? 'Producto';
    const variacion = producto.descripcion_variacion ?? '';
    const nombreSinSku = `${nombreBase} ${variacion}`
        .replace(/\s*[·|,-]?\s*SKU\s*:.*/i, '')
        .trim();
    const subtotal = Number(producto.subtotal ?? producto.subtotal_detalle_venta ?? precio * cantidad);
    const impuesto = Number(producto.impuesto ?? producto.monto_impuesto ?? 0);
    const total = Number(producto.total ?? subtotal + impuesto);

    return { nombre: nombreSinSku || 'Producto', cantidad, precio, subtotal, impuesto, total };
}

export function imprimirFacturaTermica(data, empresa) {
    const productosOrigen = Array.isArray(data?.productos)
        ? data.productos
        : Array.isArray(data?.detalles)
            ? data.detalles
            : Array.isArray(data?.detalle)
                ? data.detalle
                : [];

    if (!productosOrigen.length) {
        window.mostrarToast?.('No hay productos para imprimir.', 'danger');
        return;
    }

    const productos = productosOrigen.map(normalizarProducto);
    const subtotalCalculado = productos.reduce((suma, producto) => suma + producto.subtotal, 0);
    const impuestoCalculado = productos.reduce((suma, producto) => suma + producto.impuesto, 0);
    const subtotal = Number(data.subtotal_venta ?? subtotalCalculado);
    const impuesto = Number(data.impuesto_venta ?? impuestoCalculado);
    const total = Number(data.total_venta ?? data.total ?? subtotal + impuesto);
    const descuento = Number(data.descuento_venta ?? Math.max(0, subtotal + impuesto - total));
    const fechaOrigen = data.fecha_venta ?? data.fecha ?? new Date();
    const fechaObj = fechaOrigen instanceof Date ? fechaOrigen : new Date(fechaOrigen);
    const fechaValida = !Number.isNaN(fechaObj.getTime());
    const fecha = fechaValida ? formatearFechaLarga(fechaObj) : String(fechaOrigen);
    const hora = fechaValida
        ? `${String(fechaObj.getHours() % 12 || 12).padStart(2, '0')}:${String(fechaObj.getMinutes()).padStart(2, '0')} ${fechaObj.getHours() < 12 ? 'AM' : 'PM'}`
        : '';
    const cliente = data.cliente?.nombre_cliente ?? 'Consumidor final';
    const usuario = data.usuario?.nombre_usuario;
    const metodoPago = data.metodo_pago?.nombre_metodo_pago
        ?? data.metodoPago?.nombre_metodo_pago
        ?? data.metodo_pago;
    const esPagoPlazos = Boolean(data.pago_plazos || data.plan_pago);
    const recibido = data.monto_recibido ?? data.recibido ?? data.abono_inicial;
    const vuelto = data.vuelto;
    const saldoPendiente = data.saldo_pendiente ?? Math.max(0, total - Number(recibido || 0));
    const numeroFactura = data.numero_factura ?? data.factura ?? 'FACTURA';
    const urlLogo = new URL(logoEmpresa, window.location.href).href;
    const filas = productos.map(producto => `
        <div class="producto">
            <span class="cant">${producto.cantidad}</span>
            <span class="desc">${escaparHTML(producto.nombre)}</span>
            <span class="importe">${monto(producto.total)}</span>
            <span class="unitario">a ${monto(producto.precio)} c/u</span>
        </div>
    `).join('');

    const ventana = window.open('', '_blank', 'width=420,height=720');
    if (!ventana) {
        window.mostrarToast?.('Permite las ventanas emergentes para imprimir la factura.', 'danger');
        return;
    }

    const filasResumen = `
        <div class="resumen-linea"><span>Subtotal</span><span>${formatoMoneda(subtotal)}</span></div>
        ${descuento > 0 ? `<div class="resumen-linea"><span>Descuento</span><span>-${formatoMoneda(descuento)}</span></div>` : ''}
        ${impuesto > 0 ? `<div class="resumen-linea"><span>Impuesto</span><span>${formatoMoneda(impuesto)}</span></div>` : ''}
        <div class="resumen-linea total"><span>TOTAL</span><span>${formatoMoneda(total)}</span></div>
    `;

    ventana.document.write(`
        <!doctype html>
        <html lang="es">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Factura ${escaparHTML(numeroFactura)}</title>
            <style>
                /* ==== Configuracion base 58 mm (48 mm utiles de cabezal) ==== */
                :root {
                    --fuente: 'DejaVu Sans', 'Bitstream Vera Sans', Verdana, sans-serif;
                    --cuerpo: 9pt;
                    --datos: 7.5pt;
                    --producto: 8.25pt;
                    --direccion: 7.5pt;
                    --encabezado: 13pt;
                    --fiscal: 12pt;
                    --totales: 12pt;
                }
                @page { size: 58mm 210mm; margin: 0 0 20mm; }
                * { box-sizing: border-box; }
                html, body {
                    width: 58mm;
                    margin: 0;
                    padding: 0;
                    color: #000;
                    background: #fff;
                    font-family: var(--fuente);
                    font-size: var(--cuerpo);
                    font-weight: 400;
                    line-height: 1.35;
                }
                .ticket { width: 58mm; margin: 0; padding: 0; }

                /* ==== 1. Encabezado centrado ==== */
                .logo { text-align: center; }
                .logo img { display: block; width: 16mm; height: auto; margin: 0 auto 1mm; }
                .centro { text-align: center; }
                .empresa { font-size: var(--encabezado); font-weight: 700; line-height: 1.15; overflow-wrap: anywhere; }
                .fiscal { font-size: var(--fiscal); font-weight: 700; overflow-wrap: anywhere; }
                .fiscal-chico { font-size: var(--direccion); font-weight: 400; }

                /* ==== 2. Datos de la venta alineados a la izquierda ==== */
                .datos { text-align: left; font-size: var(--datos); }
                .datos div { overflow-wrap: anywhere; }

                /* ==== 3. Tabla de productos con columnas fijas ==== */
                .tabla-encabezado,
                .producto { display: grid; grid-template-columns: 10mm minmax(0, 1fr) 12mm; column-gap: 1mm; }
                .tabla-encabezado { font-size: 8pt; font-weight: 700; border-bottom: 1px solid #000; padding-bottom: 1mm; }
                .producto { padding: 1.5mm 0; border-bottom: 1px dotted #000; font-size: var(--producto); }
                .cant { text-align: left; white-space: nowrap; }
                .desc { min-width: 0; overflow-wrap: anywhere; text-align: center; }
                .importe { text-align: right; white-space: nowrap; }
                .unitario { grid-column: 2; text-align: center; }

                /* ==== 4. Totales destacados ==== */
                .resumen { margin-top: 2mm; }
                .resumen-linea { display: flex; justify-content: space-between; gap: 2mm; }
                .resumen-linea span:last-child { text-align: right; white-space: nowrap; }
                .total { margin-top: 1mm; padding-top: 1.5mm; border-top: 1px solid #000; font-size: var(--totales); font-weight: 700; }

                /* ==== 5. Pie centrado y zona de corte ==== */
                .pie { margin-top: 3.5mm; padding-bottom: 0; text-align: center; }
                .guia { height: 12mm; font-size: 9pt; line-height: 12mm; text-align: center; }
                .mensaje { margin-top: 1mm; font-size: 7.5pt; }
                .corte { margin-top: 3mm; text-align: center; }
                .linea-corte { border: 0; border-top: 1px dashed #000; margin: 2mm 0; height: 0; }

                @media print {
                    html, body { width: 58mm; }
                    .ticket { margin: 0; }
                    * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <main class="ticket">
                <div class="logo"><img src="${escaparHTML(urlLogo)}" alt=""></div>
                <header class="centro">
                    <div class="empresa">${escaparHTML(empresa?.nombre_empresa ?? 'MI NEGOCIO')}</div>
                    ${empresa?.ruc_empresa ? `<div class="fiscal">RUC: ${escaparHTML(empresa.ruc_empresa)}</div>` : ''}
                    ${empresa?.direccion_empresa ? `<div class="fiscal fiscal-chico">Dirección: ${escaparHTML(empresa.direccion_empresa)}</div>` : ''}
                    ${empresa?.telefono_empresa ? `<div class="fiscal fiscal-chico">Teléfono: ${escaparHTML(empresa.telefono_empresa)}</div>` : ''}
                </header>
                <hr class="linea-corte">
                <section class="datos">
                    <div>Fecha: ${escaparHTML(fecha)} a las ${escaparHTML(hora)}</div>
                    <div>Factura: ${escaparHTML(numeroFactura)}</div>
                    <div>Cliente: ${escaparHTML(cliente)}</div>
                    ${usuario ? `<div>Facturó: ${escaparHTML(usuario)}</div>` : ''}
                    ${metodoPago ? `<div>Pago: ${escaparHTML(metodoPago)}</div>` : ''}
                </section>
                <hr class="linea-corte">
                <div class="tabla-encabezado">
                    <span>Nº</span>
                    <span class="desc">INFO</span>
                    <span class="importe">TOTAL</span>
                </div>
                <section>${filas}</section>
                <section class="resumen">${filasResumen}</section>
                <hr class="linea-corte">
                <section class="datos">
                    ${esPagoPlazos
                        ? `<div class="resumen-linea"><span>Abono</span><span>${formatoMoneda(recibido)}</span></div><div class="resumen-linea"><span>Saldo</span><span>${formatoMoneda(saldoPendiente)}</span></div>`
                        : `${recibido !== undefined ? `<div class="resumen-linea"><span>Recibido</span><span>${formatoMoneda(recibido)}</span></div>` : ''}${vuelto !== undefined ? `<div class="resumen-linea"><span>Vuelto</span><span>${formatoMoneda(vuelto)}</span></div>` : ''}`}
                </section>
                <footer class="pie">
                    <div>¡Gracias por su compra!</div>
                    <div class="mensaje">Para nosotros, tu experiencia es lo más importante</div>
                    <div class="guia">·</div>
                    <div class="guia">·</div>
                </footer>
            </main>
        </body>
        </html>
    `);

    let impresionIniciada = false;
    const imprimirCuandoEsteLista = () => {
        if (impresionIniciada) return;
        impresionIniciada = true;
        setTimeout(() => {
            if (ventana.closed) return;
            ventana.focus();
            ventana.print();
            ventana.onafterprint = () => ventana.close();
            setTimeout(() => { if (!ventana.closed) ventana.close(); }, 60000);
        }, 250);
    };

    ventana.onload = imprimirCuandoEsteLista;
    ventana.document.close();
    setTimeout(imprimirCuandoEsteLista, 900);
}

/**
 * Envía el ticket en ESC/POS crudo (32 columnas, avance y corte reales).
 * Lanza un error si la impresora no responde, para que el llamador decida
 * si usa window.print() como respaldo.
 */
export async function imprimirFacturaEscPos(data) {
    const token = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

    const respuesta = await fetch('/facturar/ticket-termico', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': token,
        },
        body: JSON.stringify({ ...data, _token: token }),
    });

    let resultado = {};

    try {
        resultado = await respuesta.json();
    } catch {
        resultado = {};
    }

    if (!respuesta.ok || !resultado.success) {
        throw new Error(resultado.error ?? 'La impresora no respondió.');
    }

    return resultado;
}