export default function initCuentasPorCobrar() {
    const tabla = document.querySelector('#tablaCuentasPorCobrar');
    if (!tabla) return;
    document.getElementById('titulo').textContent = 'CUENTAS POR COBRAR';

    let planes = [];
    let ventaSeleccionada = null;
    let metodos = [];
    let cuentasMetodoPago = [];
    const tbody = tabla.querySelector('tbody');
    const modalDetalle = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDetalleCartera'));
    const modalAbono = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAbonoCartera'));
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
    const moneda = valor => `C$ ${Number(valor || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const escapar = valor => $('<div>').text(valor ?? '').html();
    const estadoTexto = estado => ({ atrasada: 'Atrasada', pendiente: 'Pendiente', parcial: 'Parcial', pagada: 'Pagada' })[estado] || estado;

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
                ? `<button type="button" class="btn btn-sm btn-success ms-1" data-accion="abono" data-venta="${Number(plan.id_venta)}" title="Registrar abono" aria-label="Registrar abono"><i class="fa-solid fa-hand-holding-dollar"></i></button>`
                : '';
            fila.innerHTML = `
                <td>${escapar(plan.numero_factura)}</td>
                <td>${escapar(plan.cliente)}</td>
                <td>${moneda(plan.total)}</td>
                <td class="fw-semibold">${moneda(plan.saldo)}</td>
                <td>${escapar(fechaProxima)}</td>
                <td><span class="cartera-estado ${escapar(plan.estado)}">${estadoTexto(plan.estado)}</span></td>
                <td class="text-end cartera-acciones">
                    <button type="button" class="btn btn-sm btn-outline-primary" data-accion="detalle" data-venta="${Number(plan.id_venta)}" title="Ver plan e historial" aria-label="Ver plan e historial"><i class="fa-solid fa-eye"></i></button>
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
            renderizar();
        } catch (error) {
            $('#errorCartera').removeClass('d-none').text(error.responseJSON?.mensaje || error.message || 'Error al consultar la cartera.');
        }
    }

    function abrirDetalle(plan) {
        $('#facturaDetalleCartera').text(plan.numero_factura || '—');
        $('#clienteDetalleCartera').text(plan.cliente || '—');
        $('#totalDetalleCartera').text(moneda(plan.total));
        $('#saldoDetalleCartera').text(moneda(plan.saldo));
        const cuotas = $('#cuotasDetalleCartera').empty();
        plan.cuotas.forEach(cuota => {
            cuotas.append(`<tr><td>${Number(cuota.numero)}</td><td>${escapar(cuota.fecha_vencimiento)}</td><td>${moneda(cuota.monto)}</td><td>${moneda(cuota.pagado)}</td><td>${moneda(cuota.saldo)}</td><td><span class="cartera-estado ${escapar(cuota.estado)}">${estadoTexto(cuota.estado)}</span></td></tr>`);
        });
        const pagos = $('#pagosDetalleCartera').empty();
        if (plan.pagos.length === 0) {
            pagos.append('<tr><td colspan="4" class="text-center text-secondary">Aún no hay abonos registrados.</td></tr>');
        } else {
            plan.pagos.forEach(pago => pagos.append(`<tr><td>${escapar(pago.fecha)}</td><td>${escapar(pago.metodo)}${pago.cuenta ? ` · ${escapar(pago.cuenta)}` : ''}</td><td>${escapar(pago.referencia || '—')}</td><td class="text-end">${moneda(pago.monto)}</td></tr>`));
        }
        modalDetalle.show();
    }

    function actualizarCuentas() {
        const metodo = Number($('#metodoAbonoCartera').val());
        const $cuenta = $('#cuentaAbonoCartera').empty();
        if (metodo === 1) {
            $('#contenedorCuentaAbonoCartera').addClass('d-none');
            return;
        }

        const cuentas = cuentasMetodoPago.filter(item => Number(item.id_metodo_pago) === metodo && item.id_cuenta);
        cuentas.forEach(item => $cuenta.append(new Option(item.nombre_cuenta, item.id_cuenta)));
        $('#contenedorCuentaAbonoCartera').removeClass('d-none');
        if (cuentas.length === 0) $('#errorAbonoCartera').text('Este método no tiene cuentas activas configuradas.');
        else $('#errorAbonoCartera').text('');
    }

    function abrirAbono(plan) {
        ventaSeleccionada = plan;
        $('#errorAbonoCartera').text('');
        $('#tituloAbonoCartera').text(`Abono · ${plan.numero_factura}`);
        $('#saldoAbonoCartera').text(`${plan.cliente} · Saldo pendiente ${moneda(plan.saldo)}`);
        $('#montoAbonoCartera').val('').attr('max', Number(plan.saldo).toFixed(2));
        actualizarResumenAbono();
        $('#referenciaAbonoCartera').val('');
        const $metodo = $('#metodoAbonoCartera').empty();
        metodos.forEach(metodo => $metodo.append(new Option(metodo.nombre, metodo.id)));

        if (metodos.length) $metodo.val(String(metodos[0].id));
        actualizarCuentas();
        modalAbono.show();
    }

    function actualizarResumenAbono() {
        if (!ventaSeleccionada) return;
        const montoIngresado = Math.max(0, Number($('#montoAbonoCartera').val() || 0));
        let montoPorAplicar = Math.min(montoIngresado, Number(ventaSeleccionada.saldo) || 0);
        const cuotas = [...(ventaSeleccionada.cuotas || [])]
            .filter(cuota => Number(cuota.saldo) > 0)
            .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento) || Number(a.numero) - Number(b.numero));

        const cuotasRestantes = cuotas.map(cuota => {
            const saldoCuota = Number(cuota.saldo) || 0;
            const aplicado = Math.min(montoPorAplicar, saldoCuota);
            montoPorAplicar -= aplicado;
            return { ...cuota, saldoRestante: Math.max(0, saldoCuota - aplicado) };
        }).filter(cuota => cuota.saldoRestante > 0);

        const saldoRestante = Math.max(0, (Number(ventaSeleccionada.saldo) || 0) - montoIngresado);
        const proximaFecha = cuotasRestantes[0]?.fecha_vencimiento;
        const fechaFormateada = proximaFecha
            ? window.FechaSimple(`${proximaFecha}T12:00:00`)
            : '—';

        $('#previsionMontoAbono').text(moneda(montoIngresado));
        $('#previsionSaldoAbono').text(moneda(saldoRestante));
        $('#previsionCuotasAbono').text(`${cuotasRestantes.length} ${cuotasRestantes.length === 1 ? 'fecha' : 'fechas'}`);
        $('#previsionProximoVencimiento').text(fechaFormateada);
    }

    tabla.addEventListener('click', event => {
        const boton = event.target.closest('[data-accion]');
        if (!boton) return;
        const plan = planes.find(item => Number(item.id_venta) === Number(boton.dataset.venta));
        if (!plan) return;
        if (boton.dataset.accion === 'detalle') abrirDetalle(plan);
        if (boton.dataset.accion === 'abono') abrirAbono(plan);
    });

    $('#metodoAbonoCartera').on('change', actualizarCuentas);
    $('#montoAbonoCartera').off('input.cartera').on('input.cartera', actualizarResumenAbono);
    $('#filtroEstadoCartera').on('change', cargarPlanes);
    $('#recargarCartera').on('click', cargarPlanes);

    $('#formAbonoCartera').on('submit', async function (event) {
        event.preventDefault();
        if (!ventaSeleccionada) return;
        const monto = Number($('#montoAbonoCartera').val());
        const idMetodo = Number($('#metodoAbonoCartera').val());
        const idCuenta = idMetodo === 1 ? null : Number($('#cuentaAbonoCartera').val()) || null;
        if (!Number.isFinite(monto) || monto <= 0 || monto > Number(ventaSeleccionada.saldo)) {
            $('#errorAbonoCartera').text('El importe debe ser mayor que cero y no superar el saldo pendiente.');
            return;
        }
        if (idMetodo !== 1 && !idCuenta) {
            $('#errorAbonoCartera').text('Selecciona una cuenta receptora activa.');
            return;
        }

        const boton = $('#guardarAbonoCartera').prop('disabled', true);
        try {
            const respuesta = await fetch(`/cuentas-por-cobrar/${ventaSeleccionada.id_venta}/pagos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({
                    monto,
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