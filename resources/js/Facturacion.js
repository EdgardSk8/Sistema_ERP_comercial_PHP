let tablaProductosPOSActiva = null;

function limpiarFacturacion() {
    $(document).off('.facturacion');

    if (tablaProductosPOSActiva) {
        if ($.fn.DataTable.isDataTable(tablaProductosPOSActiva.table().node())) {
            tablaProductosPOSActiva.destroy();
        }
        tablaProductosPOSActiva = null;
    }
}

document.addEventListener('turbo:before-frame-render', (event) => {
    if (event.target.id === 'contenido-dinamico' && event.target.querySelector('#btnFacturar')) {
        limpiarFacturacion();
    }
});

export default function initFacturacion() {

    const tablaActual = document.getElementById('tablaProductos');
    if (tablaProductosPOSActiva && tablaProductosPOSActiva.table().node() === tablaActual) return;

    limpiarFacturacion();

    let carrito = [];
    let imprimirFacturaActivo = false;
    let imprimirProformaActivo = false;
    document.getElementById('titulo').textContent = 'SISTEMA DE FACTURACION';

    const tablaProductos = inicializarTablaProductos();
    tablaProductosPOSActiva = tablaProductos;
    eventosProductos(tablaProductos);

/*-------------------------------------------------------------------------------------------------------------------*/

/* ════════════════════════════ FUNCIONES ════════════════════════════ */
    
    function eventosProductos() {

        $('#tablaProductos').on('click', '.agregarProducto', function () {

            const producto = {
                id: $(this).data('id'),
                id_variacion_talla: $(this).data('variacion-talla') || null,
                nombre: $(this).data('nombre'),
                precio: parseFloat($(this).data('precio')),
                stock: parseInt($(this).data('stock')),
                 porcentaje_impuesto: parseFloat($(this).data('porcentaje')) || 0
            }; agregarProductoCarrito(producto);

        });
    }

    /* --- AGREGAR PRODUCTOS AL CARRITO --- */
    function agregarProductoCarrito(producto) {

        let existente = carrito.find(p => p.id === producto.id && p.id_variacion_talla === producto.id_variacion_talla);
        if (existente) {
            if (existente.cantidad >= existente.stock) { mostrarToast(`No hay más stock de ${existente.nombre}`, 'danger'); return; }
            existente.cantidad++;
        } else { carrito.push({ ...producto, precioCatalogo: producto.precio, cantidad: 1 }); }
        RenderizarCarrito();

    }

    /* --- RENDERIZAR TABLA CARRITO --- */
    function RenderizarCarrito() {

        let html = '';
        let total = 0;

        carrito.forEach((p, i) => {

            let subtotal = p.precio * p.cantidad;
            total += subtotal;

            html += `
                <tr>
                    <td>${p.nombre}</td>
                    <td class="col-cantidad">
                        <input type="number" value="${p.cantidad}" min="1"
                            class="cantidad"
                            data-index="${i}">
                    </td>
                    <td>C$ ${p.precio.toFixed(2)}</td>
                    <td>C$ ${subtotal.toFixed(2)}</td>
                    <td>
                        <button class="eliminar" data-index="${i}">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        $('#carrito').html(html);
        $('#total').text('C$ ' + total.toFixed(2));
        calcularVueltos();
    }

    /* --- FORMATO DE MONEDA --- */
    function moneda(valor, decimales = 2) {
        const numero = parseFloat(valor || 0);
        const numeroFormateado = numero.toLocaleString('en-US', {
            minimumFractionDigits: decimales, maximumFractionDigits: decimales
        });
        return 'C$ ' + numeroFormateado;
    }

    /* --- VALIDAR FACTURACION --- */
    function validarFactura(cliente) {

        if (carrito.length === 0) { mostrarToast('Agregue productos al carrito', 'danger'); return false; }
        if (!cliente) { mostrarToast('Seleccione cliente', 'danger'); return false; }
        for (let p of carrito) { if (p.cantidad > p.stock) { mostrarToast(`Stock insuficiente para ${p.nombre}`, 'danger'); return false; } }
        return true;

    }

    function calcularTotalCarrito() {
        return carrito.reduce((total, producto) => total + Number(producto.precio) * Number(producto.cantidad), 0);
    }

    function abrirModalPrecioLiquidacion(cliente, metodo, cuenta) {
        const $filas = $('#liquidacionProductos').empty();

        carrito.forEach((producto, indice) => {
            const precioCatalogo = Number(producto.precioCatalogo ?? producto.precio);
            const $fila = $('<tr>');
            const $precio = $('<input>', {
                type: 'number',
                min: '0.01',
                max: precioCatalogo.toFixed(2),
                step: '0.01',
                class: 'form-control form-control-sm precio-liquidacion',
                'data-index': indice,
                'aria-label': `Precio de venta de ${producto.nombre}`
            }).val(Number(producto.precio).toFixed(2));

            $fila.append($('<td>').text(producto.nombre));
            $fila.append($('<td class="text-end">').text(producto.cantidad));
            $fila.append($('<td class="text-end">').text(moneda(precioCatalogo)));
            $fila.append($('<td>').append($precio));
            $filas.append($fila);
        });

        const actualizarTotalModal = () => {
            let total = 0;
            let preciosValidos = true;

            $('#liquidacionProductos .precio-liquidacion').each(function () {
                const indice = Number($(this).data('index'));
                const precio = Number($(this).val());
                const maximo = Number(carrito[indice].precioCatalogo ?? carrito[indice].precio);

                if (!Number.isFinite(precio) || precio <= 0 || precio > maximo) {
                    preciosValidos = false;
                    return;
                }

                total += precio * Number(carrito[indice].cantidad);
            });

            total = Math.round(total * 100) / 100;
            $('#liquidacionTotal').text(moneda(total));

            $('#liquidacionAviso').text(preciosValidos
                ? `Este total se registrará en caja: ${moneda(total)}.`
                : 'Cada precio debe ser mayor que cero y no superar el precio normal.');
            $('#liquidacionAviso')
                .toggleClass('text-success', preciosValidos)
                .toggleClass('text-danger', !preciosValidos);
            $('#btnAplicarLiquidacion').prop('disabled', !preciosValidos);
            return { total, preciosValidos };
        };

        $('#liquidacionProductos').off('input.facturacion', '.precio-liquidacion')
            .on('input.facturacion', '.precio-liquidacion', actualizarTotalModal);

        $('#btnAplicarLiquidacion').off('click.facturacion').on('click.facturacion', async function () {
            const validacion = actualizarTotalModal();
            if (!validacion.preciosValidos) {
                mostrarToast('Revisa los precios ingresados.', 'danger');
                return;
            }

            $('#liquidacionProductos .precio-liquidacion').each(function () {
                const producto = carrito[Number($(this).data('index'))];
                producto.precio = Number($(this).val());
                producto.precioLiquidacion = producto.precio < Number(producto.precioCatalogo ?? producto.precio);
            });

            RenderizarCarrito();
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPrecioLiquidacion')).hide();
            await facturarVenta(cliente, metodo, cuenta, validacion.total, true);
        });

        $('#modalPrecioLiquidacion').off('hidden.bs.modal.facturacion').on('hidden.bs.modal.facturacion', function () {
            $('#btnFacturar').prop('disabled', false);
        });

        actualizarTotalModal();
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPrecioLiquidacion')).show();
    }

    async function facturarVenta(cliente, metodo, cuenta, recibido, liquidacion = false) {
        const total = calcularTotalCarrito();
        const stockOk = await validarStockBD();

        if (!stockOk) {
            $('#btnFacturar').prop('disabled', false);
            return;
        }

        const data = {
            cliente,
            carrito: carrito.map(producto => ({
                id: producto.id,
                id_variacion_talla: producto.id_variacion_talla,
                cantidad: producto.cantidad,
                ...(liquidacion || producto.precioLiquidacion ? { precio_venta_final: producto.precio } : {})
            })),
            total,
            recibido: liquidacion && metodo === 1 ? total : recibido,
            liquidacion,
            id_metodo_pago: metodo,
            id_cuenta: cuenta
        };

        $.ajax({
            url: '/facturar/pos', method: 'POST', contentType: 'application/json', data: JSON.stringify(data),
            headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
            success: function (res) {
                if (res.success) {
                    mostrarToast('Factura realizada', 'success');
                    if (imprimirFacturaActivo) imprimirFactura(res);

                    carrito = [];
                    RenderizarCarrito();
                    $('#pagoCordobas, #pagoDolares, #vueltoCordobas, #vueltoDolares').val('');
                    $('#metodo_pago').val('1').trigger('change');
                    $('#clientes').val('1').trigger('change');
                    tablaProductos.ajax.reload(null, false);
                } else {
                    mostrarToast(res.error || 'No fue posible completar la factura', 'danger');
                }
                $('#btnFacturar').prop('disabled', false);
            },
            error: function (xhr) {
                mostrarToast(xhr.responseJSON?.error || 'Error al facturar', 'danger');
                $('#btnFacturar').prop('disabled', false);
            }
        });
    }

    /* --- VALIDACION DE STOCK --- */
    async function validarStockBD() {

        let res = await fetch('/validar-stock-carrito', { method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
            body: JSON.stringify({ carrito })
        });

        let data = await res.json();

        if (!data.ok) { mostrarToast(data.mensaje, 'danger');
            let p = carrito.find(x => x.id == data.id && (x.id_variacion_talla || null) == (data.id_variacion_talla || null));
            if (p) p.stock = data.stock; return false;
        }
        return true;
    }


/*-------------------------------------------------------------------------------------------------------------------*/

/* ════════════════════ INICIALIZACION ══════════════════════ */

    function inicializarTablaProductos() {

        return $('#tablaProductos').DataTable({

            ajax: { url: '/productos/pos', type: 'GET', dataSrc: 'data' },
            deferRender: true,

            columns: [

                { data: 'nombre_producto', render: function (data, type, row) {
                    if (type === 'filter' && row.sku) return `${data} ${row.sku}`;
                    if (type !== 'display' || !row.sku) return data;
                    return `${data}<small class="d-block text-muted">SKU: ${row.sku}</small>`;
                } },
                { data: 'precio_con_iva', render: function (data) { return moneda(data, 1); } },
                { data: 'stock_actual' },
                { data: 'id_producto',
                    render: function (data, type, row) {

                        let deshabilitado = row.stock_actual <= 0 ? 'disabled' : '';
                        let clase = row.stock_actual <= 0 ? 'btn-danger' : 'btn-dark';

                        return `
                            <button class="${clase} agregarProducto"
                                data-id="${row.id_producto}"
                                data-variacion-talla="${row.id_variacion_talla ?? ''}"
                                data-nombre="${row.nombre_producto}"
                                data-precio="${row.precio_con_iva}"
                                data-stock="${row.stock_actual}"
                                data-porcentaje="${row.iva}"
                                ${deshabilitado}>
                                <i class="fa-solid fa-cart-shopping"></i>
                            </button>
                        `;
                    }
                },
            ],
        });
    }

    const buscadorProductos = $('#tablaProductos_filter input');
    buscadorProductos.attr('placeholder', 'Buscar producto o SKU…')
        .off('keydown.facturacion')
        .on('keydown.facturacion', function (event) {
            if (event.key !== 'Enter') return;
            const sku = String($(this).val() || '').trim().toUpperCase();
            if (!sku) return;

            const coincidencias = tablaProductos.rows().data().toArray()
                .filter(producto => String(producto.sku || '').toUpperCase() === sku);
            if (coincidencias.length !== 1) return;

            event.preventDefault();
            const producto = coincidencias[0];
            agregarProductoCarrito({
                id: producto.id_producto,
                id_variacion_talla: producto.id_variacion_talla || null,
                nombre: producto.nombre_producto,
                precio: Number(producto.precio_con_iva),
                stock: Number(producto.stock_actual),
                porcentaje_impuesto: Number(producto.iva || 0),
            });
            $(this).val('');
            tablaProductos.search('').draw();
        });

/*-------------------------------------------------------------------------------------------------------------------*/

/* ════════════════════ EVENTOS ══════════════════════ */

    $('#toggleFactura').on('change', function () {

        imprimirFacturaActivo = $(this).is(':checked');

        if ($(this).is(':checked')) {
            $('#toggleProformaFactura').prop('checked', false);
            imprimirProformaActivo = false;
            let metodo = parseInt($('#metodo_pago').val()) || 0;
            if (metodo === 1) {
                $('#pagoCordobas').prop('disabled', false);
                $('#pagoDolares').prop('disabled', false);
                $('#vueltoCordobas').prop('disabled', false);
                $('#vueltoDolares').prop('disabled', false);
                $('#btnFacturar').css('background', '#22C55E');
                $('#btnFacturar').css('none');
                $('#btnFacturar').text('Facturar e Imprimir Factura');
            }
            calcularVueltos();
        }

    });

    $('#toggleProformaFactura').on('change', function () {

        imprimirProformaActivo = $(this).is(':checked');

        if (imprimirProformaActivo) {

            $('#toggleFactura').prop('checked', false);
            imprimirFacturaActivo = false;
            $('#pagoCordobas, #pagoDolares, #vueltoCordobas, #vueltoDolares').prop('disabled', true);
            $('#btnFacturar').css({ background: '#0d6efd' }).text('Imprimir Proformas');
            $('#btnFacturar').css('none');

        } else {

            let metodo = parseInt($('#metodo_pago').val()) || 0;

            $('#vueltoCordobas, #vueltoDolares').prop('disabled', false);
            if (metodo === 1) { $('#pagoCordobas, #pagoDolares').prop('disabled', false); }
            $('#btnFacturar').css({ background: '#22C55E'});
            $('#btnFacturar').css({ border: 'none' }).text('Facturar');
            $('#btnFacturar').text('Facturar');
        }

    });

    $('#btnLimpiarCaja').on('click', function () {

        carrito = [];
        RenderizarCarrito();

        $('#pagoCordobas').val('');
        $('#pagoDolares').val('');
        $('#vueltoCordobas').val('');
        $('#vueltoDolares').val('');

        $('#clientes').val('1').trigger('change');
        $('#metodo_pago').val('1').trigger('change');
        $('#btnFacturar').css({ background: '#22C55E', border: 'none' }).text('Facturar');

        imprimirFacturaActivo = false;
        imprimirProformaActivo = false;

        $('#toggleFactura').prop('checked', false);
        $('#toggleProformaFactura').prop('checked', false);

        mostrarToast('Limpieza realizada con éxito', 'success');
    });


    $('#metodo_pago').val(null).trigger('change');

    $('#carrito').on('click', '.eliminar', function () { carrito.splice($(this).data('index'), 1); RenderizarCarrito(); });

    $('#carrito').on('keydown', '.cantidad', function (e) { if (e.key === 'Enter') $(this).blur(); });

    $('#carrito').on('blur', '.cantidad', function () {

        let i = $(this).data('index');
        let valor = parseInt($(this).val());

        if (isNaN(valor) || valor < 1) valor = 1;

        carrito[i].cantidad = valor;
        RenderizarCarrito();

    });

    $('#metodo_pago').on('change', function () {

        let metodo = parseInt($(this).val()) || 0;
        if (window.setMetodoPago) window.setMetodoPago(metodo);
        if (metodo === 1) {$('#pagoCordobas, #pagoDolares, #vueltoCordobas, #vueltoDolares').prop('disabled', false);
        } else {$('#pagoCordobas, #pagoDolares, #vueltoCordobas, #vueltoDolares').prop('disabled', true).val(''); }

    });

    $(document).on('keydown.facturacion', '#pagoCordobas, #pagoDolares', function (e) {
        if (document.activeElement !== this) return;
        if (e.key === 'Enter') { e.preventDefault(); $('#btnFacturar').trigger('click'); }
    });

    $('#btnFacturar').off('click').on('click', async function () {

        $('#btnFacturar').prop('disabled', true);

        let cliente = $('#clientes').val();
        let total = calcularTotalCarrito();
        let metodo = parseInt($('#metodo_pago').val());

        let cuenta = $('#id_cuenta_metodo_pago').val();

        console.log('Método:', metodo);
        console.log('Cuenta:', cuenta);

        let recibido = (metodo === 1) ? parseFloat($('#pagoCordobas').val()) || 0 : total;

        if (!validarFactura(cliente)) { $('#btnFacturar').prop('disabled', false); return; }

        if (imprimirProformaActivo) {

            imprimirProforma({
                cliente: $('#clientes option:selected').text(),
                carrito: carrito,
                total: total
            });

            $('#btnFacturar').prop('disabled', false);
            return;
        }

        if (metodo === 1 && recibido < total) {
            abrirModalPrecioLiquidacion(cliente, metodo, cuenta);
            return;
        }

        await facturarVenta(cliente, metodo, cuenta, recibido);

    });

/* IMPRIMIR FACTURA */

async function imprimirFactura(data) {

    let empresa;

    try {
        empresa = await obtenerCredencialesEmpresa();
    } catch (e) {
        console.error("❌ Error cargando empresa:", e);
        mostrarToast("No fue posible obtener los datos de la empresa. No se pudo generar la impresión de la factura.", "danger");
        //alert("No se pudieron cargar datos de la empresa");
        return;
    }

    const cliente = data?.cliente ?? {};
    const productos = Array.isArray(data?.productos)
        ? data.productos
        : Array.isArray(data?.carrito)
            ? data.carrito
            : [];

    if (productos.length === 0) {
        console.warn("⚠️ No hay productos para imprimir");
        return;
    }

    // 🔥 FECHA CON TU FUNCION GLOBAL
    const fecha = window.formatearFechaDiaHora(data?.fecha_venta ?? new Date());

    // 🔥 TITULO FACTURA DESDE BACKEND
    const numeroFactura = data?.numero_factura ?? data?.factura ?? 'FACTURA';
    const tituloFactura = `Factura ${numeroFactura}`;

    let filas = "";
    let subtotalGeneral = 0;
    let impuestoTotal = 0;
    let totalFinal = 0;

    productos.forEach(p => {

        const nombre = p.nombre ?? p.nombre_producto ?? '';
        const cantidad = Number(p.cantidad ?? 0);
        const precio = Number(p.precio ?? 0);
        const impuesto = Number(p.impuesto ?? 0);
        const totalLinea = Number(p.total ?? (precio * cantidad + impuesto * cantidad));

        subtotalGeneral += precio * cantidad;
        impuestoTotal += impuesto * cantidad;
        totalFinal += totalLinea;

        filas += `
            <tr>
                <td>${nombre}</td>
                <td style="text-align:center;">${cantidad}</td>
                <td style="text-align:right;">C$ ${precio.toFixed(2)}</td>
                <td style="text-align:right;">C$ ${impuesto}</td>
                <td style="text-align:right;">C$ ${totalLinea.toFixed(2)}</td>
            </tr>
        `;
    });

    const recibido = Number(data?.monto_recibido ?? totalFinal);
    const vuelto = Number(data?.vuelto ?? (recibido - totalFinal));

    const ventana = window.open('', '_blank', 'width=900,height=700');

    if (!ventana) {
        alert("Activa ventanas emergentes para imprimir");
        return;
    }

    ventana.document.write(`
        <html>
        <head>
            <title>${tituloFactura}</title>

            <style>
                body {
                    font-family: Arial;
                    font-size: 12.5px;
                    padding: 12px;
                    color: #111;
                }

                .header {
                    text-align: center;
                    margin-bottom: 12px;
                }

                .header strong {
                    font-size: 14px;
                }

                .empresa {
                    font-size: 11px;
                    line-height: 1.3;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 12px;
                    font-size: 11.8px; /* 🔥 +2px visual */
                }

                th, td {
                    border-bottom: 1px solid #ddd;
                    padding: 8px 6px; /* 🔥 +2px en padding */
                }

                th {
                    background: #f2f2f2;
                    font-size: 11px;
                    font-weight: bold;
                }

                .cliente {
                    margin-top: 12px;
                    font-size: 11px;
                    line-height: 1.4;
                }

                .resumen {
                    margin-top: 12px;
                    font-size: 12px;
                    line-height: 1.5;
                }

                .totales {
                    margin-top: 10px;
                    font-size: 12.5px;
                    text-align: right;
                    font-weight: bold;
                }
            </style>
        </head>

        <body>

            <div class="header">
                <strong>${empresa?.nombre_empresa ?? ''}</strong><br>
                <div class="empresa">
                    RUC: ${empresa?.ruc_empresa ?? ''}<br>
                    ${empresa?.direccion_empresa ?? ''}<br>
                    Tel: ${empresa?.telefono_empresa ?? ''}
                </div>
            </div>

            <div class="cliente">
                Cliente: ${cliente?.nombre_cliente ?? 'Consumidor final'}<br>
                Fecha: ${fecha}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Impuesto</th>
                        <th>Total</th>
                    </tr>
                </thead>

                <tbody>
                    ${filas}
                </tbody>
            </table>

            <div class="resumen">
                Subtotal: C$ ${subtotalGeneral.toFixed(2)}<br>
                Impuesto: C$ ${impuestoTotal.toFixed(2)}<br>
                <strong>Total: C$ ${totalFinal.toFixed(2)}</strong>
            </div>

            <div class="totales">
                Pagó: C$ ${recibido.toFixed(2)}<br>
                Vuelto: C$ ${vuelto.toFixed(2)}
            </div>

        </body>
        </html>
    `);

    ventana.document.close();

    ventana.onload = () => {
        ventana.focus();
        ventana.print();

        ventana.onafterprint = () => ventana.close();

        setTimeout(() => {
            if (!ventana.closed) ventana.close();
        }, 3000);
    };
}

async function imprimirProforma(data) {

    let empresa;

    try {

        empresa = await obtenerCredencialesEmpresa();

    } catch (e) {

        console.error("❌ Error cargando empresa:", e);

        mostrarToast(
            "No fue posible obtener los datos de la empresa. No se pudo generar la impresión de la proforma.",
            "danger"
        );

        return;
    }

    const productos = Array.isArray(data?.productos)
        ? data.productos
        : Array.isArray(data?.carrito)
            ? data.carrito
            : [];

    if (productos.length === 0) {

        console.warn("⚠️ No hay productos para imprimir");
        return;

    }

    // ═════════════ CLIENTE ═════════════
    const nombreCliente =
        typeof data?.cliente === 'string'
            ? data.cliente
            : data?.cliente?.nombre_cliente ?? 'Consumidor final';

    // ═════════════ FECHA ═════════════
    const fecha = window.formatearFechaDiaHora(new Date());

    // ═════════════ NUMERO PROFORMA ═════════════
    const numeroProforma =
        'PRO-' +
        new Date().getFullYear() +
        String(new Date().getMonth() + 1).padStart(2, '0') +
        String(new Date().getDate()).padStart(2, '0') +
        '-' +
        Math.floor(Math.random() * 99999)
            .toString()
            .padStart(5, '0');

    const tituloProforma = `Proforma ${numeroProforma}`;

    let filas = "";

    let subtotalGeneral = 0;
    let impuestoTotal = 0;
    let totalFinal = 0;

    productos.forEach(p => {

        const nombre = p.nombre ?? p.nombre_producto ?? '';

        const cantidad = Number(p.cantidad ?? 0);

        // PRECIO CON IMPUESTO
        const precio = Number(
            p.precio ??
            p.precio_unitario_venta ??
            0
        );

        // PORCENTAJE IMPUESTO
        const porcentajeImpuesto = Number(
            p.porcentaje_impuesto ?? 0
        );

        // PRECIO SIN IMPUESTO
        const precioSinImpuesto =
            porcentajeImpuesto > 0
                ? precio / (1 + (porcentajeImpuesto / 100))
                : precio;

        // IMPUESTO UNITARIO
        const impuesto = precio - precioSinImpuesto;

        // TOTAL LINEA
        const totalLinea = precio * cantidad;

        subtotalGeneral += precioSinImpuesto * cantidad;

        impuestoTotal += impuesto * cantidad;

        totalFinal += totalLinea;

        filas += `
            <tr>

                <td style="text-align:left;">${nombre}</td>

                <td style="text-align:center;">
                    ${cantidad}
                </td>

                <td style="text-align:center;">
                    C$ ${precioSinImpuesto.toFixed(2)}
                </td>

                <td style="text-align:center;">
                    C$ ${impuesto.toFixed(2)}
                </td>

                <td style="text-align:center;">
                    C$ ${totalLinea.toFixed(2)}
                </td>

            </tr>
        `;
    });

    const ventana = window.open('', '_blank', 'width=900,height=700');

    if (!ventana) {

        alert("Activa ventanas emergentes para imprimir");
        return;

    }

    ventana.document.write(`

        <html>

        <head>

            <title>${tituloProforma}</title>

            <style>

                body {

                    font-family: Arial;
                    font-size: 12.5px;
                    padding: 12px;
                    color: #111;

                }

                .header {

                    text-align: center;
                    margin-bottom: 12px;

                }

                .header strong {

                    font-size: 14px;

                }

                .empresa {

                    font-size: 11px;
                    line-height: 1.3;

                }

                .tipo-documento {

                    margin-top: 8px;
                    font-size: 15px;
                    font-weight: bold;
                    letter-spacing: 1px;

                }

                table {

                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 12px;
                    font-size: 11.8px;

                }

                th, td {

                    border-bottom: 1px solid #ddd;
                    padding: 8px 6px;

                }

                th {

                    background: #f2f2f2;
                    font-size: 11px;
                    font-weight: bold;

                }

                .cliente {

                    margin-top: 12px;
                    font-size: 11px;
                    line-height: 1.4;

                }

                .resumen {

                    margin-top: 12px;
                    font-size: 12px;
                    line-height: 1.5;

                }

                .totales {

                    margin-top: 10px;
                    font-size: 13px;
                    text-align: right;
                    font-weight: bold;

                }

            </style>

        </head>

        <body>

            <div class="header">

                <strong>
                    ${empresa?.nombre_empresa ?? ''}
                </strong>

                <br>

                <div class="empresa">

                    RUC: ${empresa?.ruc_empresa ?? ''}<br>

                    ${empresa?.direccion_empresa ?? ''}<br>

                    Tel: ${empresa?.telefono_empresa ?? ''}

                </div>

                <div class="tipo-documento">

                    PROFORMA

                </div>

                <div style="font-size:11px; margin-top:4px;">

                    ${numeroProforma}

                </div>

            </div>

            <div class="cliente">

                Cliente: ${nombreCliente}<br>

                Fecha: ${fecha}

            </div>

            <table>

                <thead>

                    <tr>

                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Impuesto</th>
                        <th>Total</th>

                    </tr>

                </thead>

                <tbody>

                    ${filas}

                </tbody>

            </table>

            <div class="resumen">

                Subtotal: C$ ${subtotalGeneral.toFixed(2)}<br>

                Impuesto: C$ ${impuestoTotal.toFixed(2)}<br>

                <strong>
                    Total: C$ ${totalFinal.toFixed(2)}
                </strong>

            </div>

        </body>

        </html>

    `);

    ventana.document.close();

    ventana.onload = () => {

        ventana.focus();

        ventana.print();

        ventana.onafterprint = () => ventana.close();

        setTimeout(() => {

            if (!ventana.closed) {
                ventana.close();
            }

        }, 3000);

    };

}

async function obtenerCredencialesEmpresa() {

    return new Promise((resolve, reject) => {

        $.ajax({

            url: '/credenciales/pos', method: 'GET',
            headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },

            success: function (res) {
                if (res.success && res.data) { resolve(res.data); } else { reject('No data'); }
            }, error: function (xhr) { console.error('Error AJAX credenciales:', xhr.responseText); reject('Error servidor'); }

        });

    });
}

/* ------------------------------------------------------------------------------------------------------------------------------------ */

/* SELECT */

    function Selectores() {

        $.get('/clientes/pos', function (res) {

            if (!res.success) return;
            let select = $('#clientes');
            select.empty();
            let idSeleccionado = null;

            res.data.forEach(cliente => {
                if (cliente.id_cliente == 1 || cliente.nombre_cliente === 'Cliente Generico') { idSeleccionado = cliente.id_cliente; }
                select.append(`<option value="${cliente.id_cliente}">${cliente.nombre_cliente}</option>`);
            });

            if ($.fn.select2) { select.select2(); }
            if (idSeleccionado) { select.val(idSeleccionado).trigger('change'); }
            
        });

        let metodosPagoPOS = [];

        $.get('/metodo-pago/pos', function (res) {

            if (!res.success) return;
            metodosPagoPOS = res.data;
            let selectMetodo = $('#metodo_pago');
            selectMetodo.empty();
            let metodosUnicos = [];
            res.data.forEach(item => {

                if (!metodosUnicos.some(m => m.id_metodo_pago == item.id_metodo_pago)) {
                    metodosUnicos.push({ id_metodo_pago: item.id_metodo_pago, nombre_metodo_pago: item.nombre_metodo_pago });
                    selectMetodo.append(` <option value="${item.id_metodo_pago}"> ${item.nombre_metodo_pago} </option> `);
                }

            });

            if ($.fn.select2) { selectMetodo.select2(); }
            selectMetodo.trigger('change');

        });


        $('#metodo_pago').on('change', function () {

            let idMetodoPago = $(this).val();
            let selectCuenta = $('#id_cuenta_metodo_pago');
            selectCuenta.empty();

            if (idMetodoPago == 1) {
                selectCuenta.append(`<option value="">Seleccione un Metodo de Pago</option>`);
                selectCuenta.prop('disabled', true); return;
            }
            selectCuenta.prop('disabled', false);

            let cuentas = metodosPagoPOS.filter( item => item.id_metodo_pago == idMetodoPago );

            if (cuentas.length === 0) { selectCuenta.append(` <option value=""> Sin cuentas </option> `); return; }

            if ($.fn.select2) { selectCuenta.select2(); }

            cuentas.forEach(cuenta => {
                if (cuenta.id_cuenta) { selectCuenta.append(` <option value="${cuenta.id_cuenta}"> ${cuenta.nombre_cuenta} </option> `); }
            }); selectCuenta.prop('selectedIndex', 0); //Selecciona primer elemento

        });

    }; Selectores();

/* ------------------------------------------------------------------------------------------------------------------------------------ */

/* VERIFICAR CAJA */

    function verificarcaja() {

    /*  ═════════ Creacion del Modal ══════════  */

    $('body').append(`
        <div class="modal fade" id="modalAbrirCaja" tabindex="-1">

            <div class="modal-dialog modal-dialog-centered">

                <div class="modal-content">

                    <div class="modal-header bg-success text-white py-2">

                        <h6 class="modal-title mb-0">
                            <i class="fa-solid fa-cash-register"></i>
                            Apertura de Caja
                        </h6>

                    </div>


                    <div class="modal-body p-2">

                        <div class="row g-2">


                            <div class="col-md-6">

                                <label class="form-label small fw-bold mb-1">
                                    Usuario
                                </label>

                                <div class="form-control form-control-sm bg-light">
                                    <span id="usuarioNombre"></span>
                                </div>

                            </div>


                            <div class="col-md-6">

                                <label class="form-label small fw-bold mb-1">
                                    Rol
                                </label>

                                <div class="form-control form-control-sm bg-light">
                                    <span id="usuarioRol"></span>
                                </div>

                            </div>


                            <div class="col-md-6">

                                <label class="form-label small fw-bold mb-1">
                                    Caja
                                </label>

                                <div class="form-control form-control-sm bg-light">
                                    <span id="nombreCaja">
                                        Caja Principal
                                    </span>
                                </div>

                            </div>


                            <div class="col-md-6">

                                <label class="form-label small fw-bold mb-1">
                                    Fecha apertura
                                </label>

                                <div class="form-control form-control-sm bg-light">
                                    ${formatearFechaDiaHora(new Date())}
                                </div>

                            </div>


                            <div class="col-12">

                                <hr>

                            </div>


                            <div class="col-md-6">

                                <label class="form-label small fw-bold mb-1">
                                    Monto inicial
                                </label>

                                <div class="input-group input-group-sm">

                                    <span class="input-group-text">
                                        C$
                                    </span>

                                    <input 
                                        type="number"
                                        id="montoInicialCaja"
                                        placeholder="5000"
                                        min="0"
                                        class="form-control">

                                </div>

                            </div>


                        </div>

                    </div>


                    <div class="modal-footer">

                        <button 
                            class="btn btn-danger btn-sm"
                            data-bs-dismiss="modal">
                            Cancelar
                        </button>


                        <button 
                            class="btn btn-success btn-sm"
                            id="confirmarAbrirCaja">

                            <i class="fa-solid fa-lock-open"></i>
                            Abrir Caja

                        </button>

                    </div>

                </div>

            </div>

        </div>
    `);

        verificarCajaEstado(); //Funcion verificar caja

    }; verificarcaja();

/* ══════════════════════════════════════════════════════════════════════════════════════════  */

/*  ═════════ Función para habilitar/deshabilitar botones según estado de caja ══════════  */

    function verificarCajaEstado() {
        $.get('/caja/verificar', function(res) {

            if (res.abierta && res.id_caja) { $('#NumeroCaja').html(`<strong class="text-success">Caja N.º ${res.id_caja} Abierta</strong>`); } 
            else { $('#NumeroCaja').html(`<strong class="text-danger">Caja no activa</strong>`); }

            if (res.usuario) { $('#usuarioNombre').text(res.usuario.nombre); $('#usuarioRol').text(res.usuario.rol); }

            // Abrir/Cerrar botones
            if (res.abierta) { $('#btnAbrirCaja').prop('disabled', true); $('#btnCerrarCaja').prop('disabled', false); } 
            else { $('#btnAbrirCaja').prop('disabled', false); $('#btnCerrarCaja').prop('disabled', true); }

            setFacturacionEstado(res.abierta); // Funcion de habilitar o deshabilitar 
        });
    }

/* ══════════════════════════════════════════════════════════════════════════════════════════  */

/*  ═════════ Habilitar/deshabilitar inputs y botones de facturación ══════════  */

    function setFacturacionEstado(habilitado = true) {
        $('#pagoCordobas, #vueltoCordobas, #vueltoDolares, #pagoDolares, #clientes, #metodo_pago, #btnFacturar').prop('disabled', !habilitado);
        $('#tablaProductos tbody button, #carrito button').prop('disabled', !habilitado);
        $('#carrito input').prop('readonly', !habilitado);
    }

/* ══════════════════════════════════════════════════════════════════════════════════════════  */

/*  ═════════ Abrir Caja ══════════  */

// 🔥 Elimina el listener anterior
    $(document).off('click.abrirCaja', '#btnAbrirCaja');

    // 🔥 Registrar SOLO UNA VEZ
    $(document).on('click.facturacion', '#btnAbrirCaja', function () {

        const btn = $(this);

        // 🚫 Evitar doble ejecución
        if (btn.data('ejecutando')) return;

        btn.data('ejecutando', true);

        const modalEl = document.getElementById('modalAbrirCaja');
        const modal = new bootstrap.Modal(modalEl);

        modal.show();

        modalEl.addEventListener('shown.bs.modal', function () {

            $('#montoInicialCaja').trigger('focus').select();

            // 🔓 Liberar cuando termine de abrir
            btn.data('ejecutando', false);

        }, { once: true });

    });

/* ══════════════════════════════════════════════════════════════════════════════════════════  */

    $(document).on('keydown.facturacion', '#montoInicialCaja', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            $('#confirmarAbrirCaja').trigger('click');
        }
    });

/* ══════════════════════════════════════════════════════════════════════════════════════════  */

    $(document).on('click.facturacion', '#confirmarAbrirCaja', function () {

        let monto = $('#montoInicialCaja').val();

        if (!monto || monto <= 0) { mostrarToast('Ingrese un monto válido', 'danger'); return; }

        $.post('/caja/abrir', {
            monto_inicial: monto,
            _token: $('meta[name="csrf-token"]').attr('content')
        })
        .done(function(res) {
            bootstrap.Modal.getInstance(document.getElementById('modalAbrirCaja')).hide();
            verificarCajaEstado();
            mostrarToast(res.mensaje || 'Caja abierta correctamente', 'success');
            document.getElementById('montoInicialCaja').value = '';
        })
        .fail(function(xhr) {

            let mensaje = 'Error al abrir caja';

            if (xhr.responseJSON) {

                if (xhr.responseJSON.mensaje) mensaje = xhr.responseJSON.mensaje;
                if (xhr.responseJSON.errors) mensaje = Object.values(xhr.responseJSON.errors).flat().join('<br>');

            }

            mostrarToast(mensaje, 'danger');

        });
    });

/* ══════════════════════════════════════════════════════════════════════════════════════════  */

/*  ═════════ Cerrar Caja ══════════  */

$(document).on('click.facturacion', '#btnCerrarCaja', function () {

    $.post('/caja/cerrar', {
        _token: $('meta[name="csrf-token"]').attr('content')
    })
    .done(function(res) {
        verificarCajaEstado();
        mostrarToast('Caja cerrada: C$ ' + res.total, 'success');

    })
    .fail(function(xhr) {

        let mensaje = 'Error al cerrar caja';

        if (xhr.responseJSON) {

            if (xhr.responseJSON.mensaje) mensaje = xhr.responseJSON.mensaje;
            if (xhr.responseJSON.errors) mensaje = Object.values(xhr.responseJSON.errors).flat().join('<br>');

        }

        mostrarToast(mensaje, 'danger');

    });
});

/* VUELTO */

(function () {

    /* ═══════ Variables Globales POS ═════════ */

    let TASA = 0;
    let bloqueando = false;
    let ultimaMoneda = 'C';
    let metodoPagoActual = 'efectivo';

    /*  ════════ Inicialización ═════════ */

    function init() { cargarTipoCambio(); eventos(); }

    /*  ════════ Obtener Tipo de Cambio ═════════ */

    function cargarTipoCambio() {

        $.get('/tipo-cambio/pos', function (res) {

            if (res.success) {

                TASA = parseFloat(res.tasa) || 0;
                $('#tasaImpuesto').html( 'Cambio: 1 Dolar = ' + TASA + ' Córdobas' );

            }

        });
    }

    /* ═══════ Cálculo de Vueltos ═════════ */

   window.calcularVueltos = function() {

        if (metodoPagoActual !== 'efectivo') {

            $('#vueltoCordobas').val('C$ 0.00');
            $('#vueltoDolares').val('$ 0.00');
            return;
        }

        if (!TASA) return;

        let total = parseFloat( $('#total').text().replace(/[^\d.-]/g, '') ) || 0;
        let pagoC = parseFloat($('#pagoCordobas').val()) || 0;
        let pagoD = parseFloat($('#pagoDolares').val()) || 0;

        let totalPagadoC = (ultimaMoneda === 'C') ? pagoC : pagoD * TASA;
        let vueltoC = totalPagadoC - total;

        if (vueltoC < 0) {
            $('#vueltoCordobas').val('C$ 0.00'); $('#vueltoDolares').val('$ 0.00'); return;
        }

        let vueltoD = vueltoC / TASA;
        $('#vueltoCordobas').val('C$ ' + vueltoC.toFixed(2));
        $('#vueltoDolares').val('$ ' + vueltoD.toFixed(2));

    }

    /* ════════ Cambiar Método de Pago ═════════ */

    function setMetodoPago(metodo) {

        metodoPagoActual = metodo;

        if (metodo === 'efectivo') {

            $('#pagoCordobas').prop('disabled', false);
            $('#pagoDolares').prop('disabled', false);

            calcularVueltos();

        } else {

            $('#pagoCordobas').prop('disabled', true);
            $('#pagoDolares').prop('disabled', true);

            $('#vueltoCordobas').val('C$ 0.00');
            $('#vueltoDolares').val('$ 0.00');
        }
    }

    /* ════════ Eventos ═════════ */

    function eventos() {

        $('#pagoCordobas').off('input').on('input', function () {

            if (
                bloqueando ||
                !TASA ||
                metodoPagoActual !== 'efectivo'
            ) return;

            bloqueando = true;
            ultimaMoneda = 'C';

            let valor = parseFloat($(this).val()) || 0;
            let enDolares = valor / TASA;

            $('#pagoDolares').val(enDolares.toFixed(2));

            calcularVueltos();

            bloqueando = false;
        });

        $('#pagoDolares').off('input').on('input', function () {

            if (
                bloqueando ||
                !TASA ||
                metodoPagoActual !== 'efectivo'
            ) return;

            bloqueando = true;
            ultimaMoneda = 'D';

            let valor = parseFloat($(this).val()) || 0;
            let enCordobas = valor * TASA;

            $('#pagoCordobas').val(enCordobas.toFixed(2));

            calcularVueltos();

            bloqueando = false;
        });

        $('.metodo-pago').off('click').on('click', function () {
            let metodo = $(this).data('metodo');
            setMetodoPago(metodo);
        });
        
    }

    init();

})();

};
