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
    return `C$ ${Number(valor || 0).toFixed(2)}`;
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
    const fecha = window.formatearFechaDiaHora
        ? window.formatearFechaDiaHora(fechaOrigen)
        : new Date(fechaOrigen).toLocaleString('es-NI');
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
    const filas = productos.map(producto => `
        <article class="producto">
            <div class="producto-linea">
                <strong>${escaparHTML(producto.nombre)}</strong>
                <strong>${formatoMoneda(producto.total)}</strong>
            </div>
            <div class="producto-detalle">
                ${producto.cantidad} × ${formatoMoneda(producto.precio)}
            </div>
        </article>
    `).join('');

    const ventana = window.open('', '_blank', 'width=420,height=720');
    if (!ventana) {
        window.mostrarToast?.('Permite las ventanas emergentes para imprimir la factura.', 'danger');
        return;
    }

    const filasResumen = `
        <div class="resumen-linea"><span>Subtotal</span><span>${formatoMoneda(subtotal)}</span></div>
        ${descuento > 0 ? `<div class="resumen-linea"><span>Descuento</span><span>- ${formatoMoneda(descuento)}</span></div>` : ''}
        <div class="resumen-linea"><span>Impuesto</span><span>${formatoMoneda(impuesto)}</span></div>
        <div class="resumen-linea resumen-total"><strong>TOTAL</strong><strong>${formatoMoneda(total)}</strong></div>
    `;

    ventana.document.write(`
        <!doctype html>
        <html lang="es">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Factura ${escaparHTML(numeroFactura)}</title>
            <style>
                @page { size: 80mm auto; margin: 0; }
                * { box-sizing: border-box; }
                html, body { width: 80mm; margin: 0; padding: 0; }
                body { color: #161616; background: #fff; font: 10px/1.4 Arial, Helvetica, sans-serif; }
                .ticket { width: 80mm; margin: 0 auto; padding: 4mm; }
                .encabezado { text-align: center; padding-bottom: 3mm; }
                .empresa { font-size: 15px; font-weight: 700; line-height: 1.2; overflow-wrap: anywhere; }
                .datos-empresa { margin-top: 2mm; color: #444; font-size: 9px; }
                .tipo-documento { margin-top: 3mm; font-size: 12px; font-weight: 700; letter-spacing: .08em; }
                .numero { font-size: 11px; font-weight: 700; }
                .separador { border: 0; border-top: 1px dashed #777; margin: 2.5mm 0; }
                .datos-venta { display: grid; gap: 1mm; }
                .dato { display: flex; justify-content: space-between; gap: 3mm; }
                .dato span:last-child { text-align: right; overflow-wrap: anywhere; }
                .seccion-titulo { margin: 2mm 0; font-size: 9px; font-weight: 700; }
                .producto { padding: 2mm 0; border-bottom: 1px dotted #aaa; }
                .producto-linea { display: flex; justify-content: space-between; align-items: flex-start; gap: 3mm; }
                .producto-linea strong:first-child { max-width: 48mm; overflow-wrap: anywhere; }
                .producto-linea strong:last-child { white-space: nowrap; }
                .producto-detalle { margin-top: .5mm; color: #444; font-size: 9px; }
                .resumen { margin-top: 2mm; }
                .resumen-linea { display: flex; justify-content: space-between; gap: 3mm; padding: .5mm 0; }
                .resumen-total { margin-top: 1mm; padding-top: 1.5mm; border-top: 1px solid #333; font-size: 12px; }
                .pago { margin-top: 2mm; }
                .pie { padding-top: 4mm; text-align: center; color: #444; font-size: 9px; }
                @media print {
                    html, body { width: 80mm; }
                    .ticket { margin: 0; }
                    * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <main class="ticket">
                <header class="encabezado">
                    <div class="empresa">${escaparHTML(empresa?.nombre_empresa)}</div>
                    ${empresa?.ruc_empresa ? `<div class="datos-empresa">RUC: ${escaparHTML(empresa.ruc_empresa)}</div>` : ''}
                    ${empresa?.direccion_empresa ? `<div class="datos-empresa">${escaparHTML(empresa.direccion_empresa)}</div>` : ''}
                    ${empresa?.telefono_empresa ? `<div class="datos-empresa">Tel: ${escaparHTML(empresa.telefono_empresa)}</div>` : ''}
                    <div class="tipo-documento">FACTURA</div>
                    <div class="numero">N.º ${escaparHTML(numeroFactura)}</div>
                </header>
                <hr class="separador">
                <section class="datos-venta">
                    <div class="dato"><strong>Fecha</strong><span>${escaparHTML(fecha)}</span></div>
                    <div class="dato"><strong>Cliente</strong><span>${escaparHTML(cliente)}</span></div>
                    ${usuario ? `<div class="dato"><strong>Atendió</strong><span>${escaparHTML(usuario)}</span></div>` : ''}
                </section>
                <hr class="separador">
                <section>
                    <div class="seccion-titulo">DETALLE</div>
                    ${filas}
                </section>
                <section class="resumen">${filasResumen}</section>
                <hr class="separador">
                <section class="pago">
                    ${metodoPago ? `<div class="dato"><strong>Forma de pago</strong><span>${escaparHTML(metodoPago)}</span></div>` : ''}
                    ${esPagoPlazos
                        ? `<div class="dato"><span>Abono recibido</span><span>${formatoMoneda(recibido)}</span></div><div class="dato"><strong>Saldo pendiente</strong><strong>${formatoMoneda(saldoPendiente)}</strong></div>`
                        : `${recibido !== undefined ? `<div class="dato"><span>Recibido</span><span>${formatoMoneda(recibido)}</span></div>` : ''}${vuelto !== undefined ? `<div class="dato"><span>Vuelto</span><span>${formatoMoneda(vuelto)}</span></div>` : ''}`}
                </section>
                <footer class="pie">Gracias por su compra</footer>
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
    setTimeout(imprimirCuandoEsteLista, 500);
}