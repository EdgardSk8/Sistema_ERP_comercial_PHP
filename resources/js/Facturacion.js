import { imprimirFacturaTermica } from './ImprimirFacturaTermica';

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

    function calcularTotalConDescuento() {
        return calcularTotalCarrito();
    }

    function actualizarResumenVenta() {
        const total = calcularTotalConDescuento();
        $('#total').text(moneda(total));
        if ($('#modalidadVenta').val() === 'plazos') {
            const abono = Number($('#abonoInicialCredito').val() || 0);
            $('#totalPlanPagoVenta').text(moneda(Math.max(0, total - abono)));
        }
        if (typeof validarCuotasPlan === 'function') {
            validarCuotasPlan();
        }
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

    async function facturarVenta(cliente, metodo, cuenta, recibido, liquidacion = false, credito = null) {
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
            pago_plazos: Boolean(credito),
            abono_inicial: credito?.abono_inicial ?? 0,
            descuento_venta: credito?.descuento_venta ?? 0,
            cuotas: credito?.cuotas ?? [],
            id_metodo_pago: credito && Number(credito.abono_inicial) === 0 ? null : metodo,
            id_cuenta: credito && Number(credito.abono_inicial) === 0 ? null : cuenta
        };

        $.ajax({
            url: '/facturar/pos', method: 'POST', contentType: 'application/json', data: JSON.stringify(data),
            headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
            success: function (res) {
                if (res.success) {
                    mostrarToast(res.pago_plazos
                        ? `Venta a plazos creada. Saldo pendiente: ${moneda(res.saldo_pendiente)}.`
                        : 'Factura realizada', 'success');
                    if (imprimirFacturaActivo) imprimirFactura(res);

                    carrito = [];
                    RenderizarCarrito();
                    $('#pagoCordobas, #pagoDolares, #vueltoCordobas, #vueltoDolares').val('');
                    $('#abonoInicialCredito').val('');
                    $('#metodo_pago').val('1').trigger('change');
                    $('#clientes').val('1').trigger('change');
                    $('#modalidadVenta').val('contado').trigger('change');
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
                    if (type === 'sort' || type === 'type') {
                        const grupoStock = Number(row.stock_actual) > 0 ? '0' : '1';
                        const nombreOrden = String(data ?? '')
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .toLocaleLowerCase('es');
                        return `${grupoStock}|${nombreOrden}`;
                    }
                    return data;
                } },
                { data: 'precio_con_iva', render: function (data) { return moneda(data, 1); } },
                { data: 'stock_actual', render: function (data, type) {
                    const stock = Number(data ?? 0);
                    if (type === 'sort' || type === 'type') return stock;
                    return stock === 0
                        ? '<span class="text-danger fw-bold">0</span>'
                        : stock;
                } },
                { data: 'id_producto',
                    render: function (data, type, row) {

                        const stock = Number(row.stock_actual ?? 0);
                        const deshabilitado = stock <= 0 ? 'disabled' : '';
                        const clase = stock <= 0 ? 'btn-danger' : 'btn-dark';

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
            order: [[0, 'asc']],
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

    function actualizarModalidadVenta() {
        const esCredito = $('#modalidadVenta').val() === 'plazos';
        $('#descuentoPlazosContenedor').toggleClass('d-none', !esCredito);
        $('#abonoInicialCreditoContenedor').toggleClass('d-none', !esCredito);
        $('#pagoContadoCampos, #vueltoContadoCampos').toggleClass('d-none', esCredito);
        $('#etiquetaMetodoCobro').text(esCredito ? 'Método del abono inicial:' : 'Seleccionar método de pago:');

        const mostrarMetodo = !esCredito || Number($('#abonoInicialCredito').val() || 0) > 0;
        $('#grupoMetodoCobro').toggleClass('d-none', !mostrarMetodo);
    }

    function nuevaFilaCuota(numero, fecha = '', monto = '') {
        const fila = document.createElement('tr');
       fila.innerHTML = `
    <td class="numero-cuota-plan text-center align-middle">${numero}</td>
    <td class="px-1 align-middle">
        <input type="date" class="form-control form-control-sm fecha-cuota-plan mx-auto text-center w-100" style="max-width: 10rem;" aria-label="Fecha de vencimiento cuota ${numero}">
    </td>
    <td class="px-1 align-middle">
        <input type="number" class="form-control form-control-sm monto-cuota-plan mx-auto text-center w-100" style="max-width: 5rem;" min="0.01" step="0.01" value="${monto}" aria-label="Importe cuota ${numero}">
    </td>
    <td class="text-center align-middle">
        <button type="button" class="btn btn-sm btn-outline-danger quitar-cuota-plan" title="Quitar cuota" aria-label="Quitar cuota ${numero}"><i class="fa-solid fa-trash fa-xs"></i></button>
    </td>
`;
        const campoFecha = fila.querySelector('.fecha-cuota-plan');
        campoFecha.value = fecha;
        FlatPickr(campoFecha);
        return fila;
    }

    function validarCuotasPlan() {
        const filas = [...document.querySelectorAll('#filasPlanPagoVenta tr')];
        const cuotas = filas.map(fila => ({
            fecha_vencimiento: fila.querySelector('.fecha-cuota-plan').value,
            monto_cuota: Number(fila.querySelector('.monto-cuota-plan').value)
        }));
        const abonoInicial = Number($('#abonoInicialCredito').val() || 0);
        const total = Math.round((calcularTotalConDescuento() - obtenerDescuentoPlanPago() - abonoInicial) * 100);
        const suma = Math.round(cuotas.reduce((acumulado, cuota) => acumulado + (Number.isFinite(cuota.monto_cuota) ? cuota.monto_cuota : 0), 0) * 100);
        const fechasValidas = cuotas.length > 0 && cuotas.every(cuota => cuota.fecha_vencimiento && cuota.monto_cuota > 0);
        const coincide = suma === total;

        $('#sumaPlanPagoVenta').text(moneda(suma / 100));
        $('#avisoPlanPagoVenta')
            .text(!fechasValidas ? 'Completa una fecha y un importe válido para cada cuota.' : (!coincide ? 'La suma debe coincidir con el saldo a financiar.' : ''))
            .toggleClass('text-danger', !fechasValidas || !coincide)
            .toggleClass('text-success', fechasValidas && coincide);
        $('#confirmarPlanPagoVenta').prop('disabled', !fechasValidas || !coincide);
        return { cuotas, valido: fechasValidas && coincide };
    }

    function obtenerDescuentoPlanPago() {
        const descuento = Math.max(0, Number($('#descuentoPlanPagoVenta').val() || 0));
        return Math.min(descuento, calcularTotalCarrito());
    }

    function abrirPlanPago(cliente) {
        $('#descuentoPlanPagoVenta').val('');
        const total = calcularTotalConDescuento();
        const abono = Number($('#abonoInicialCredito').val() || 0);
        const metodo = Number($('#metodo_pago').val());
        const cuenta = $('#id_cuenta_metodo_pago').val();

        if (!Number.isFinite(abono) || abono < 0 || abono >= total) {
            mostrarToast('El abono debe ser menor que el total para que quede un saldo a financiar.', 'danger');
            $('#btnFacturar').prop('disabled', false);
            return;
        }
        if (abono > 0 && (!metodo || (metodo !== 1 && !cuenta))) {
            mostrarToast('Selecciona el método y la cuenta del abono inicial.', 'danger');
            $('#btnFacturar').prop('disabled', false);
            return;
        }

        const saldoFinanciado = Math.round((total - abono) * 100) / 100;
        $('#totalPlanPagoVenta').text(moneda(saldoFinanciado));
        const fechaInicial = new Date();
        fechaInicial.setDate(fechaInicial.getDate() + 30);
        const fechaSegunda = new Date(fechaInicial);
        fechaSegunda.setDate(fechaSegunda.getDate() + 30);
        const formatoFecha = fecha => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
        const saldoCentavos = Math.round(saldoFinanciado * 100);
        const formatoMontoCuota = centavos => centavos % 100 === 0 ? String(centavos / 100) : (centavos / 100).toFixed(2);
        const filasCuotas = [nuevaFilaCuota(1, formatoFecha(fechaInicial)), nuevaFilaCuota(2, formatoFecha(fechaSegunda))];
        $('#filasPlanPagoVenta').empty().append(filasCuotas);

        function redistribuirCuotas() {
            const filas = [...document.querySelectorAll('#filasPlanPagoVenta tr')];
            if (!filas.length) return;
            const descuento = obtenerDescuentoPlanPago();
            const saldoCentavosActual = Math.max(0, Math.round((calcularTotalCarrito() - descuento - abono) * 100));
            const montoBase = Math.floor(saldoCentavosActual / filas.length);
            const centavosRestantes = saldoCentavosActual % filas.length;
            $('#totalPlanPagoVenta').text(moneda(saldoCentavosActual / 100));
            filas.forEach((fila, indice) => {
                const montoCentavos = montoBase + (indice < centavosRestantes ? 1 : 0);
                fila.querySelector('.monto-cuota-plan').value = formatoMontoCuota(montoCentavos);
            });
            validarCuotasPlan();
        }

        const descuentoMaxCentavos = Math.max(0, Math.round((total - abono) * 100) - 1);
        $('#descuentoPlanPagoVenta')
            .attr('max', formatoMontoCuota(descuentoMaxCentavos))
            .off('input.facturacion')
            .on('input.facturacion', function () {
                const valor = Math.max(0, Number($(this).val() || 0));
                const descuento = Math.min(valor, descuentoMaxCentavos / 100);
                if (descuento !== valor) $(this).val(formatoMontoCuota(Math.round(descuento * 100)));
                redistribuirCuotas();
            });

        redistribuirCuotas();
        validarCuotasPlan();

        $('#agregarCuotaPlanPago').off('click.facturacion').on('click.facturacion', function () {
            const numero = $('#filasPlanPagoVenta tr').length + 1;
            const ultimaFecha = $('#filasPlanPagoVenta tr:last .fecha-cuota-plan').val();
            const fechaCuota = ultimaFecha ? new Date(`${ultimaFecha}T12:00:00`) : new Date();
            fechaCuota.setDate(fechaCuota.getDate() + 30);
            const valorFecha = `${fechaCuota.getFullYear()}-${String(fechaCuota.getMonth() + 1).padStart(2, '0')}-${String(fechaCuota.getDate()).padStart(2, '0')}`;
            $('#filasPlanPagoVenta').append(nuevaFilaCuota(numero, valorFecha, '0'));
            redistribuirCuotas();
        });

        $('#filasPlanPagoVenta').off('input.facturacion change.facturacion click.facturacion')
            .on('input.facturacion change.facturacion', '.fecha-cuota-plan, .monto-cuota-plan', validarCuotasPlan)
            .on('click.facturacion', '.quitar-cuota-plan', function () {
                $(this).closest('tr').remove();
                $('#filasPlanPagoVenta tr').each((indice, fila) => $(fila).find('.numero-cuota-plan').text(indice + 1));
                redistribuirCuotas();
            });

        $('#confirmarPlanPagoVenta').off('click.facturacion').on('click.facturacion', async function () {
            const validacion = validarCuotasPlan();
            if (!validacion.valido) return;
            $(this).prop('disabled', true);
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPlanPagoVenta')).hide();
            const descuento = obtenerDescuentoPlanPago();
            await facturarVenta(cliente, metodo, cuenta, abono, false, { abono_inicial: abono, descuento_venta: descuento, cuotas: validacion.cuotas });
        });

        $('#modalPlanPagoVenta').off('hidden.bs.modal.facturacion').on('hidden.bs.modal.facturacion', function () {
            $('#btnFacturar').prop('disabled', false);
        });
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPlanPagoVenta')).show();
    }

    $('#modalidadVenta').off('change.facturacion').on('change.facturacion', function () {
        actualizarModalidadVenta();
        actualizarResumenVenta();
    });
    $('#abonoInicialCredito').off('input.facturacion').on('input.facturacion', function () {
        actualizarModalidadVenta();
        actualizarResumenVenta();
    });
    actualizarModalidadVenta();
    actualizarResumenVenta();

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
        let total = calcularTotalConDescuento();
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

        if ($('#modalidadVenta').val() === 'plazos') {
            abrirPlanPago(cliente);
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
    try {
        const empresa = await obtenerCredencialesEmpresa();
        imprimirFacturaTermica(data, empresa);
    } catch (e) {
        console.error('Error cargando empresa:', e);
        mostrarToast('No fue posible obtener los datos de la empresa. No se pudo generar la impresión de la factura.', 'danger');
    }
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

    if (!window.confirm('¿Cerrar la caja sin arqueo? Podrás registrar o corregir el arqueo después desde Cajas.')) return;

    $.post('/caja/cerrar', {
        _token: $('meta[name="csrf-token"]').attr('content')
    })
        .done(function (res) {
            verificarCajaEstado();
            mostrarToast(res.mensaje || 'Caja cerrada. Puedes arquearla después desde Cajas.', 'success');
        })
        .fail(function (xhr) {
            mostrarToast(xhr.responseJSON?.mensaje || 'Error al cerrar caja', 'danger');
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
