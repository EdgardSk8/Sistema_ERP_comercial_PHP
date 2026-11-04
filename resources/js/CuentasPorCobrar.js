export default function initCuentasPorCobrar() {
    const tabla = document.querySelector('#tablaCuentasPorCobrar');
    if (!tabla) return;
    document.getElementById('titulo').textContent = 'CUENTAS POR COBRAR';

    let planes = [];
    let ventaSeleccionada = null;
    let planDetalleActual = null;
    let metodos = [];
    let cuentasMetodoPago = [];
    let tasaDolar = 0;
    const tbody = tabla.querySelector('tbody');
    const modalDetalle = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDetalleCartera'));
    const modalAbono = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAbonoCartera'));
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
    const moneda = valor => `C$ ${Number(valor || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const monedaDolar = valor => `$ ${Number(valor || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const monedaEn = (valor, codigo) => codigo === 'USD' ? monedaDolar(valor) : moneda(valor);
    const escapar = valor => $('<div>').text(valor ?? '').html();
    const estadoTexto = estado => ({ atrasada: 'Atrasada', pendiente: 'Pendiente', parcial: 'Parcial', pagada: 'Pagada' })[estado] || estado;

    const $filtroEstado = $('#filtroEstadoCartera');

    // SELECT2 PARA EL FILTRO DE ESTADO (MISMO TEMA QUE EL RESTO DEL SISTEMA)
    $filtroEstado.select2({
        width: '100%',
        dropdownCssClass: 'cartera-select2-dropdown'
    });

    // RESUMEN DE CARTERA (TODAS LAS CUENTAS, SIN IMPORTAR EL FILTRO)
    function actualizarResumen() {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        let total = 0;
        let vencido = 0;
        const clientes = new Set();

        planes.forEach(plan => {
            const saldo = Number(plan.saldo) || 0;
            if (saldo <= 0) return;

            total += saldo;
            clientes.add(plan.cliente);

            (plan.cuotas || []).forEach(cuota => {
                const saldoCuota = Number(cuota.saldo) || 0;
                if (saldoCuota <= 0 || !cuota.fecha_vencimiento) return;

                const vence = new Date(`${cuota.fecha_vencimiento}T00:00:00`);
                if (vence < hoy) vencido += saldoCuota;
            });
        });

        $('#resumenCarteraTotal').text(moneda(total));
        $('#resumenCarteraVencido').text(moneda(vencido));
        $('#resumenCarteraPorVencer').text(moneda(Math.max(0, total - vencido)));
        $('#resumenCarteraClientes').text(clientes.size);
    }

    async function cargarMetodos() {
        const respuesta = await $.getJSON('/metodo-pago/pos');
        cuentasMetodoPago = respuesta.data || [];
        const unicos = new Map();
        cuentasMetodoPago.forEach(item => {
            const id = Number(item.id_metodo_pago);
            if (!unicos.has(id)) unicos.set(id, { id, nombre: item.nombre_metodo_pago });
        });
        metodos = [...unicos.values()];
    }

    function renderizar() {
        tbody.replaceChildren();
        const filtro = $('#filtroEstadoCartera').val();
        const visibles = filtro === 'pagada'
            ? planes.filter(plan => Number(plan.saldo) <= 0)
            : planes.filter(plan => Number(plan.saldo) > 0);
        visibles.forEach(plan => {
            const proxima = plan.cuotas.find(cuota => Number(cuota.saldo) > 0);
            const fechaProxima = proxima
                ? window.FechaSimple(`${proxima.fecha_vencimiento}T12:00:00`)
                : '—';
            const fila = document.createElement('tr');
            const botonAbono = Number(plan.saldo) > 0
                ? `<button type="button" class="btn-abonar" data-accion="abono" data-venta="${Number(plan.id_venta)}" title="Registrar abono" aria-label="Registrar abono"><i class="ph ph-hand-coins"></i></button>`
                : '';
            fila.innerHTML = `
                <td>${escapar(plan.numero_factura)}</td>
                <td>${escapar(plan.cliente)}</td>
                <td>${moneda(plan.total)}</td>
                <td class="fw-semibold">${moneda(plan.saldo)}</td>
                <td>${escapar(fechaProxima)}</td>
                <td><span class="cartera-estado ${escapar(plan.estado)}">${estadoTexto(plan.estado)}</span></td>
                <td class="text-end cartera-acciones">
                    <button type="button" class="btn-detalle" data-accion="detalle" data-venta="${Number(plan.id_venta)}" title="Ver plan e historial" aria-label="Ver plan e historial"><i class="ph ph-eye"></i></button>
                    ${botonAbono}
                </td>`;
            tbody.append(fila);
        });
        $('#estadoVacioCartera').toggleClass('d-none', visibles.length > 0);
    }

    async function cargarPlanes() {
        $('#errorCartera').addClass('d-none').text('');
        try {
            const estado = $('#filtroEstadoCartera').val();
            const respuesta = await $.getJSON('/cuentas-por-cobrar/mostrar', { estado });
            if (!respuesta.success) throw new Error('No se pudo consultar la cartera.');
            planes = respuesta.planes || [];
            tasaDolar = Number(respuesta.tipo_cambio) || 0;
            $('#monedaAbonoCartera option[value="USD"]').prop('disabled', !tasaDolar);
            if (!tasaDolar && $('#monedaAbonoCartera').val() === 'USD') {
                $('#monedaAbonoCartera').val('NIO');
            }
            actualizarResumen();
            renderizar();
        } catch (error) {
            $('#errorCartera').removeClass('d-none').text(error.responseJSON?.mensaje || error.message || 'Error al consultar la cartera.');
        }
    }

    function abrirDetalle(plan) {
        planDetalleActual = plan;
        $('#facturaDetalleCartera').text(plan.numero_factura || '—');
        $('#clienteDetalleCartera').text(plan.cliente || '—');
        $('#totalDetalleCartera').text(moneda(plan.total));
        $('#saldoDetalleCartera').text(moneda(plan.saldo));

        const productos = $('#productosDetalleCartera').empty();
        if (!plan.productos?.length) {
            productos.append('<tr><td colspan="4" class="text-center text-secondary">Sin productos registrados.</td></tr>');
        } else {
            plan.productos.forEach(producto => {
                const detalle = [producto.descripcion, producto.sku ? `SKU ${producto.sku}` : '']
                    .filter(Boolean)
                    .join(' · ');

                productos.append(`
                    <tr>
                        <td>
                            <div>${escapar(producto.nombre)}</div>
                            ${detalle ? `<div class="small text-secondary">${escapar(detalle)}</div>` : ''}
                        </td>
                        <td class="text-center">${Number(producto.cantidad || 0)}</td>
                        <td class="text-end">${moneda(producto.precio_unitario)}</td>
                        <td class="text-end">${moneda(producto.subtotal)}</td>
                    </tr>`);
            });
        }

        const cuotas = $('#cuotasDetalleCartera').empty();
        plan.cuotas.forEach(cuota => {
            cuotas.append(`<tr><td>${Number(cuota.numero)}</td><td>${formatearFechaCorta(cuota.fecha_vencimiento)}</td><td>${moneda(cuota.monto)}</td><td>${moneda(cuota.pagado)}</td><td>${moneda(cuota.saldo)}</td><td><span class="cartera-estado ${escapar(cuota.estado)}">${estadoTexto(cuota.estado)}</span></td></tr>`);
        });
        const pagos = $('#pagosDetalleCartera').empty();
        if (plan.pagos.length === 0) {
            pagos.append('<tr><td colspan="4" class="text-center text-secondary">Aún no hay abonos registrados.</td></tr>');
        } else {
            plan.pagos.forEach(pago => pagos.append(`<tr><td>${formatearFechaCorta(pago.fecha)}</td><td>${escapar(pago.metodo)}${pago.cuenta ? ` · ${escapar(pago.cuenta)}` : ''}</td><td>${escapar(pago.referencia || '—')}</td><td class="text-end">${moneda(pago.monto)}</td></tr>`));
        }
        modalDetalle.show();
    }

    async function obtenerCredencialesEmpresa() {
        try {
            const respuesta = await $.getJSON('/credenciales/mostrar');
            return respuesta?.data || {};
        } catch (_) {
            return {};
        }
    }

    async function imprimirDetalle(plan) {
        const empresa = await obtenerCredencialesEmpresa();
        const totalPagado = plan.cuotas.reduce((suma, cuota) => suma + Number(cuota.pagado || 0), 0);

        const filasProductos = (plan.productos || []).map(producto => {
            const detalle = [producto.descripcion, producto.sku ? `SKU ${producto.sku}` : '']
                .filter(Boolean)
                .join(' · ');

            return `
                <tr>
                    <td>${escapar(producto.nombre)}${detalle ? `<div class="detalle">${escapar(detalle)}</div>` : ''}</td>
                    <td class="c">${Number(producto.cantidad || 0)}</td>
                    <td class="r">${moneda(producto.precio_unitario)}</td>
                    <td class="r">${moneda(producto.subtotal)}</td>
                </tr>`;
        }).join('') || '<tr><td colspan="4" class="c">Sin productos registrados</td></tr>';

        const filasCuotas = plan.cuotas.map(cuota => `
            <tr>
                <td class="c">${Number(cuota.numero)}</td>
                <td>${escapar(formatearFechaCorta(cuota.fecha_vencimiento))}</td>
                <td class="r">${moneda(cuota.monto)}</td>
                <td class="r">${moneda(cuota.pagado)}</td>
                <td class="r">${moneda(cuota.saldo)}</td>
                <td class="c">${escapar(estadoTexto(cuota.estado))}</td>
            </tr>`).join('');

        const filasPagos = plan.pagos.length
            ? plan.pagos.map(pago => `
                <tr>
                    <td>${escapar(formatearFechaCorta(pago.fecha))}</td>
                    <td>${escapar(pago.metodo)}${pago.cuenta ? ' · ' + escapar(pago.cuenta) : ''}</td>
                    <td>${escapar(pago.referencia || '—')}</td>
                    <td class="r">${moneda(pago.monto)}</td>
                </tr>`).join('')
            : '<tr><td colspan="4" class="c">Sin abonos registrados</td></tr>';

        const ventana = window.open('', '_blank', 'width=900,height=800');

        if (!ventana) {
            mostrarToast('Permite las ventanas emergentes para imprimir el detalle.', 'danger');
            return;
        }

        ventana.document.write(`
            <!doctype html>
            <html lang="es">
            <head>
                <meta charset="utf-8">
                <title>Plan de pagos ${escapar(plan.numero_factura || '')}</title>
                <style>
                    @page { size: A4; margin: 12mm; }
                    * { box-sizing: border-box; }
                    body { margin: 0; color: #1f2328; font: 12px/1.45 Arial, Helvetica, sans-serif; }
                    .detalle { color: #555; font-size: 10px; }
                    header { display: flex; justify-content: space-between; gap: 16px; padding-bottom: 10px; border-bottom: 2px solid #333; }
                    .empresa { font-size: 16px; font-weight: 700; }
                    .datos-empresa, .datos-doc { color: #555; font-size: 11px; }
                    .datos-doc { text-align: right; }
                    h1 { margin: 14px 0 8px; font-size: 14px; letter-spacing: .06em; text-transform: uppercase; }
                    .resumen { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 20px; margin-bottom: 14px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
                    .resumen div { display: flex; justify-content: space-between; gap: 10px; }
                    .resumen span { color: #555; }
                    h2 { margin: 16px 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 5px 6px; border: 1px solid #ccc; }
                    th { background: #f1f3f5; text-align: left; font-size: 11px; text-transform: uppercase; }
                    .c { text-align: center; }
                    .r { text-align: right; white-space: nowrap; }
                    tfoot td { font-weight: 700; background: #fafafa; }
                    footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #ccc; color: #666; font-size: 10px; display: flex; justify-content: space-between; }
                    @media print { * { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <header>
                    <div>
                        <div class="empresa">${escapar(empresa?.nombre_empresa || 'Empresa')}</div>
                        ${empresa?.ruc_empresa ? `<div class="datos-empresa">RUC: ${escapar(empresa.ruc_empresa)}</div>` : ''}
                        ${empresa?.direccion_empresa ? `<div class="datos-empresa">${escapar(empresa.direccion_empresa)}</div>` : ''}
                        ${empresa?.telefono_empresa ? `<div class="datos-empresa">Tel: ${escapar(empresa.telefono_empresa)}</div>` : ''}
                    </div>
                    <div class="datos-doc">
                        <div>Impreso: ${escapar(formatearFechaDiaHora(new Date()))}</div>
                    </div>
                </header>

                <h1>Plan de pagos</h1>

                <section class="resumen">
                    <div><span>Factura</span><strong>${escapar(plan.numero_factura || '—')}</strong></div>
                    <div><span>Cliente</span><strong>${escapar(plan.cliente || '—')}</strong></div>
                    <div><span>Total de la venta</span><strong>${moneda(plan.total)}</strong></div>
                    <div><span>Total abonado</span><strong>${moneda(totalPagado)}</strong></div>
                    <div><span>Saldo pendiente</span><strong>${moneda(plan.saldo)}</strong></div>
                    <div><span>Estado</span><strong>${escapar(estadoTexto(plan.estado))}</strong></div>
                </section>

                <h2>Productos</h2>
                <table>
                    <thead>
                        <tr><th>Producto</th><th class="c">Cantidad</th><th class="r">Precio</th><th class="r">Subtotal</th></tr>
                    </thead>
                    <tbody>${filasProductos}</tbody>
                </table>

                <h2>Cuotas</h2>
                <table>
                    <thead>
                        <tr><th class="c">N.º</th><th>Vencimiento</th><th class="r">Importe</th><th class="r">Pagado</th><th class="r">Saldo</th><th class="c">Estado</th></tr>
                    </thead>
                    <tbody>${filasCuotas}</tbody>
                    <tfoot>
                        <tr><td colspan="4" class="r">Totales</td><td class="r">${moneda(plan.saldo)}</td><td></td></tr>
                    </tfoot>
                </table>

                <h2>Abonos recibidos</h2>
                <table>
                    <thead>
                        <tr><th>Fecha</th><th>Método</th><th>Referencia</th><th class="r">Importe</th></tr>
                    </thead>
                    <tbody>${filasPagos}</tbody>
                </table>

                <footer>
                    <span>${escapar(empresa?.nombre_empresa || '')}</span>
                    <span>Saldo pendiente: ${moneda(plan.saldo)}</span>
                </footer>
            </body>
            </html>`);

        ventana.document.close();
        ventana.focus();
        ventana.print();
    }

    function actualizarCuentas() {
        const metodo = Number($('#metodoAbonoCartera').val());
        const $cuenta = $('#cuentaAbonoCartera').empty();
        if (metodo === 1) {
            $('#contenedorCuentaAbonoCartera').addClass('d-none');
            actualizarVueltoAbono();
            return;
        }

        const cuentas = cuentasMetodoPago.filter(item => Number(item.id_metodo_pago) === metodo && item.id_cuenta);
        cuentas.forEach(item => $cuenta.append(new Option(item.nombre_cuenta, item.id_cuenta)));
        $('#contenedorCuentaAbonoCartera').removeClass('d-none');
        if (cuentas.length === 0) $('#errorAbonoCartera').text('Este método no tiene cuentas activas configuradas.');
        else $('#errorAbonoCartera').text('');
        actualizarVueltoAbono();
    }

    function monedaAbono() {
        return $('#monedaAbonoCartera').val() === 'USD' ? 'USD' : 'NIO';
    }

    function esMetodoEfectivo() {
        return Number($('#metodoAbonoCartera').val()) === 1;
    }

    function montosAbono() {
        const codigo = monedaAbono();
        const saldo = Number(ventaSeleccionada?.saldo) || 0;
        const recibidoMoneda = Math.max(0, Number($('#montoAbonoCartera').val() || 0));
        const recibidoCordobas = codigo === 'USD'
            ? (tasaDolar ? recibidoMoneda * tasaDolar : 0)
            : recibidoMoneda;
        const aplicadoCordobas = Math.min(recibidoCordobas, saldo);
        const vueltoCordobas = esMetodoEfectivo()
            ? Math.max(0, recibidoCordobas - aplicadoCordobas)
            : 0;
        const aplicadoMoneda = codigo === 'USD' && tasaDolar ? aplicadoCordobas / tasaDolar : aplicadoCordobas;
        const vueltoDolares = tasaDolar ? vueltoCordobas / tasaDolar : 0;

        return {
            codigo,
            saldo,
            recibidoMoneda,
            recibidoCordobas,
            aplicadoCordobas,
            aplicadoMoneda,
            vueltoCordobas,
            vueltoDolares
        };
    }

    function actualizarSimbolosAbono() {
        let codigo = monedaAbono();

        if (codigo === 'USD' && !tasaDolar) {
            $('#monedaAbonoCartera').val('NIO');
            codigo = 'NIO';
        }

        const simbolo = codigo === 'USD' ? '$' : 'C$';
        $('#simboloMontoAbono').text(simbolo);
        $('#monedaAbonoCartera option[value="USD"]').prop('disabled', !tasaDolar);
    }

    function actualizarMaximoAbono() {
        if (!ventaSeleccionada) return;

        const saldo = Number(ventaSeleccionada.saldo) || 0;
        const codigo = monedaAbono();

        if (esMetodoEfectivo()) {
            $('#montoAbonoCartera').removeAttr('max');
            return;
        }

        const maximo = codigo === 'USD' && tasaDolar ? saldo / tasaDolar : saldo;
        $('#montoAbonoCartera').attr('max', maximo.toFixed(2));
    }

    function actualizarVueltoAbono() {
        const efectivo = esMetodoEfectivo();

        $('#efectivoAbonoCampos').toggleClass('d-none', !efectivo);
        $('#labelMontoAbono').text(efectivo ? 'Importe recibido' : 'Importe a abonar');

        if (!efectivo) {
            $('#vueltoAbonoCordobas, #vueltoAbonoDolares').val('');
            return;
        }

        const montos = montosAbono();

        if (montos.recibidoMoneda <= 0) {
            $('#vueltoAbonoCordobas, #vueltoAbonoDolares').val('');
            return;
        }

        $('#vueltoAbonoCordobas').val(moneda(montos.vueltoCordobas));
        $('#vueltoAbonoDolares').val(tasaDolar ? monedaDolar(montos.vueltoDolares) : '—');
    }

    function abrirAbono(plan) {
        ventaSeleccionada = plan;
        $('#errorAbonoCartera').text('');
        $('#tituloAbonoCartera').text(`Abono · ${plan.numero_factura}`);
        $('#saldoAbonoCartera').text(`${plan.cliente} · Saldo pendiente ${moneda(plan.saldo)}${tasaDolar ? ` · ${monedaDolar(Number(plan.saldo) / tasaDolar)}` : ''}`);
        $('#montoAbonoCartera').val('').removeAttr('max');
        $('#vueltoAbonoCordobas, #vueltoAbonoDolares').val('');
        $('#referenciaAbonoCartera').val('');
        $('#monedaAbonoCartera').val('NIO');

        const $metodo = $('#metodoAbonoCartera').empty();
        metodos.forEach(metodo => $metodo.append(new Option(metodo.nombre, metodo.id)));

        if (metodos.length) $metodo.val(String(metodos[0].id));
        actualizarSimbolosAbono();
        actualizarCuentas();
        actualizarResumenAbono();
        modalAbono.show();
    }

    function actualizarResumenAbono() {
        if (!ventaSeleccionada) return;

        actualizarSimbolosAbono();
        actualizarMaximoAbono();

        const montos = montosAbono();
        let montoPorAplicar = montos.aplicadoCordobas;
        const cuotas = [...(ventaSeleccionada.cuotas || [])]
            .filter(cuota => Number(cuota.saldo) > 0)
            .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento) || Number(a.numero) - Number(b.numero));

        const cuotasRestantes = cuotas.map(cuota => {
            const saldoCuota = Number(cuota.saldo) || 0;
            const aplicado = Math.min(montoPorAplicar, saldoCuota);
            montoPorAplicar -= aplicado;
            return { ...cuota, saldoRestante: Math.max(0, saldoCuota - aplicado) };
        }).filter(cuota => cuota.saldoRestante > 0);

        const saldoRestante = Math.max(0, montos.saldo - montos.aplicadoCordobas);
        const proximaFecha = cuotasRestantes[0]?.fecha_vencimiento;
        const fechaFormateada = proximaFecha
            ? window.FechaSimple(`${proximaFecha}T12:00:00`)
            : '—';

        $('#previsionMontoAbono').text(monedaEn(montos.aplicadoMoneda, montos.codigo));
        $('#previsionSaldoAbono').text(moneda(saldoRestante));
        $('#previsionCuotasAbono').text(`${cuotasRestantes.length} ${cuotasRestantes.length === 1 ? 'fecha' : 'fechas'}`);
        $('#previsionProximoVencimiento').text(fechaFormateada);

        const equivalencia = $('#equivalenciaAbonoCartera');
        if (montos.codigo === 'USD') {
            equivalencia.text(tasaDolar
                ? `Se aplicarán ${moneda(montos.aplicadoCordobas)} al saldo. Tipo de cambio: ${moneda(tasaDolar)} por $1.`
                : 'El tipo de cambio no está configurado en credenciales.');
        } else {
            equivalencia.text(tasaDolar ? `Tipo de cambio: ${moneda(tasaDolar)} por $1.` : '');
        }

        if (!esMetodoEfectivo() && montos.recibidoCordobas > montos.saldo + 0.001) {
            equivalencia.text(`El importe supera el saldo pendiente (${moneda(montos.saldo)}).`);
        }

        actualizarVueltoAbono();
    }

    tabla.addEventListener('click', event => {
        const boton = event.target.closest('[data-accion]');
        if (!boton) return;
        const plan = planes.find(item => Number(item.id_venta) === Number(boton.dataset.venta));
        if (!plan) return;
        if (boton.dataset.accion === 'detalle') abrirDetalle(plan);
        if (boton.dataset.accion === 'abono') abrirAbono(plan);
    });

    $('#metodoAbonoCartera').on('change', function () {
        actualizarCuentas();
        actualizarResumenAbono();
    });
    $('#monedaAbonoCartera').on('change', function () {
        $('#montoAbonoCartera, #vueltoAbonoCordobas, #vueltoAbonoDolares').val('');
        actualizarResumenAbono();
    });
    $('#montoAbonoCartera').off('input.cartera').on('input.cartera', actualizarResumenAbono);
    $('#filtroEstadoCartera').on('change', cargarPlanes);
    $('#recargarCartera').on('click', cargarPlanes);

    $('#imprimirDetalleCartera').on('click', function () {
        if (planDetalleActual) imprimirDetalle(planDetalleActual);
    });

    $('#formAbonoCartera').on('submit', async function (event) {
        event.preventDefault();
        if (!ventaSeleccionada) return;

        const montos = montosAbono();
        const idMetodo = Number($('#metodoAbonoCartera').val());
        const idCuenta = idMetodo === 1 ? null : Number($('#cuentaAbonoCartera').val()) || null;

        if (montos.codigo === 'USD' && !tasaDolar) {
            $('#errorAbonoCartera').text('El tipo de cambio no está configurado en credenciales.');
            return;
        }

        if (!Number.isFinite(montos.recibidoMoneda) || montos.recibidoMoneda <= 0 || montos.aplicadoCordobas <= 0) {
            $('#errorAbonoCartera').text('El importe debe ser mayor que cero.');
            return;
        }

        if (!esMetodoEfectivo() && montos.recibidoCordobas > montos.saldo + 0.001) {
            $('#errorAbonoCartera').text('El importe no puede superar el saldo pendiente.');
            return;
        }

        if (idMetodo !== 1 && !idCuenta) {
            $('#errorAbonoCartera').text('Selecciona una cuenta receptora activa.');
            return;
        }

        const montoCordobas = Math.round(montos.aplicadoCordobas * 100) / 100;

        const boton = $('#guardarAbonoCartera').prop('disabled', true);
        try {
            const respuesta = await fetch(`/cuentas-por-cobrar/${ventaSeleccionada.id_venta}/pagos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({
                    monto: montoCordobas,
                    id_metodo_pago: idMetodo,
                    id_cuenta: idCuenta,
                    referencia: $('#referenciaAbonoCartera').val().trim() || null
                })
            });
            const resultado = await respuesta.json();
            if (!respuesta.ok || !resultado.success) throw new Error(resultado.mensaje || 'No se pudo registrar el abono.');
            modalAbono.hide();
            mostrarToast(resultado.mensaje, 'success');
            await cargarPlanes();
        } catch (error) {
            $('#errorAbonoCartera').text(error.message);
        } finally {
            boton.prop('disabled', false);
        }
    });

    cargarMetodos().then(cargarPlanes).catch(() => {
        $('#errorCartera').removeClass('d-none').text('No se pudieron cargar los métodos de pago.');
    });
}