export default function initCajaTransferencia() {

    document.getElementById('titulo').textContent = 'TRANSFERENCIA CAJA → CUENTA';
    

    const tabla = $('#tablaCajaCuenta').DataTable({
        ajax: { url: '/movimientos-caja-cuenta/mostrar', type: 'GET', dataSrc: 'data', },

        columns: [

            { data: 'numero_caja' },

            {
                data: 'fecha_cierre',
                render: function(data){
                    return data 
                        ? `<span>${formatearFechaDia(data)}</span>`
                        : '<span class="estado estado-activo">Abierta</span>';
                }
            },

            { data: 'monto_inicial', render: data => moneda(data) },

            {
                data: 'monto_final',
                render: function(data, type, row) {
                    if (!data) { return '<span class="estado estado-activo">En proceso</span>'; }
                    return moneda(data);
                }
            },

            { 
                data: 'saldo_caja',
                render: function(data){
                    const valor = parseFloat(data || 0);
                    return valor > 0
                        ? '<span class="text-success fw-bold">' + moneda(valor) + '</span>'
                        : '<span class="text-danger fw-bold">' + moneda(valor) + '</span>';
                }
            },
            { 
                data: 'monto_transferido',
                render: function(data){
                    let monto = parseFloat(data) || 0;
                    if (monto === 0) { return '<span>' + moneda(0) + '</span>'; }
                    return '<span class="fw-bold">' + moneda(monto) + '</span>';
                }
            },

            {
                data: 'nombre_cuenta',
                render: function(data){
                    return data ? `<span class="estado-activo">${data}</span>` : '<span>—</span>';
                }
            },

            {
                data: null,
                render: function(data, type, row){

                    const cajaAbierta = !row.fecha_cierre;
                    const saldoCaja = parseFloat(row.saldo_caja) || 0;
                    const deshabilitarTransferir = cajaAbierta || saldoCaja <= 0;

                    return `
                        <button class="${cajaAbierta ? 'text-danger' : 'text-success'} btn-transferir"
                            data-id_caja="${row.numero_caja}"
                            ${deshabilitarTransferir ? 'disabled title="' + (cajaAbierta ? 'La caja aún está abierta' : 'Saldo insuficiente') + '"' : ''}>
                            <i class="ph ph-arrows-left-right"></i>
                        </button>

                        <button class="btn-detalle"
                            data-id_caja="${row.numero_caja}">
                            <i class="ph ph-eye"></i>
                        </button>
                    `;
                }
            }

        ],
        drawCallback: function () { AnimarFilasVisibles(this.api()); },
        order: [[0, 'desc']],
    });

/* ------------------------------------------------------------------------------------------------ */

    window.saldoCaja = window.saldoCaja ?? 0;
    window.saldoCajaActual = 0;

    /* =========================
    EVENTO PRINCIPAL
    ========================= */
    $('#tablaCajaCuenta').on('click', '.btn-transferir', function () {

        const row = obtenerFilaCaja(this);
        if (!row) return;

        llenarModalCaja(row);
        resetModalTransferencia();
        cargarCuentas();

        new bootstrap.Modal(document.getElementById('modalTransferir')).show();
    });


    /* =========================
    OBTENER FILA DATATABLE
        ========================= */
    function obtenerFilaCaja(btn) {
        const tabla = $('#tablaCajaCuenta').DataTable();
        return tabla.row($(btn).closest('tr')).data();
    }


    /* =========================
    LLENAR MODAL
    ========================= */
    function llenarModalCaja(row) {

        $('#id_caja').val(row.numero_caja);
        $('#infoCaja').text('#' + row.numero_caja);

        $('#infoFecha').text(
            row.fecha_cierre ? formatearFechaDia(row.fecha_cierre) : '—'
        );

        $('#infoInicial').text(
            'C$ ' + (parseFloat(row.monto_final) || 0).toFixed(2)
        );

        // =========================
        // SALDO REAL (FUENTE ÚNICA)
        // =========================
        const inicial = parseFloat(row.monto_inicial) || 0;
        const transferido = parseFloat(row.monto_transferido) || 0;

        saldoCajaActual = (row.saldo_caja !== null && row.saldo_caja !== undefined)
            ? parseFloat(row.saldo_caja)
            : (inicial - transferido);

        $('#infoFinal')
            .text('C$ ' + saldoCajaActual.toFixed(2))
            .removeClass('text-success text-danger')
            .addClass(saldoCajaActual > 0 ? 'text-success' : 'text-danger');
    }


/* =========================
   RESET MODAL
========================= */
    function resetModalTransferencia() {
        $('#monto').val('');
        $('#saldo_restante').val('').removeClass('text-success text-danger');
        $('#cuenta').val('');
    }


/* =========================
   CARGAR CUENTAS
========================= */
    function cargarCuentas() {

        $.get('/cuenta-compra/mostrar', function (res) {

            const select = $('#cuenta');
            select.html('<option value="" disabled selected>Seleccione cuenta</option>');

            if (res.success && Array.isArray(res.cuentas)) {
                res.cuentas.forEach(c => {
                    select.append(`<option value="${c.id}">${c.display}</option>`);
                });
            }
        });
    }


/* =========================
   CALCULAR SALDO RESTANTE
========================= */
    $('#monto').on('input', function () {

        const monto = parseFloat($(this).val()) || 0;
        const restante = saldoCajaActual - monto;

        $('#saldo_restante')
            .val('C$ ' + restante.toFixed(2))
            .removeClass('text-success text-danger')
            .addClass(restante >= 0 ? 'text-success' : 'text-danger');
    });


/* =========================
   GUARDAR TRANSFERENCIA
========================= */
    $('#btnGuardarTransferencia').on('click', function () {

        const btn = $(this);
        btn.prop('disabled', true);

        const data = {
            idCaja: $('#id_caja').val(),
            idCuenta: $('#cuenta').val(),
            monto: parseFloat($('#monto').val()) || 0,
            _token: $('meta[name="csrf-token"]').attr('content')
        };

        if (!validarTransferencia(data, btn)) return;

        enviarTransferencia(data, btn);
    });


/* =========================
   VALIDACIÓN
========================= */
    function validarTransferencia(data, btn) {

        if (!data.idCuenta) {
            mostrarToast('Seleccione una cuenta', 'danger');
            btn.prop('disabled', false);
            return false;
        }

        if (!data.monto || data.monto <= 0) {
            mostrarToast('Ingrese un monto válido', 'danger');
            btn.prop('disabled', false);
            return false;
        }

        if (data.monto > saldoCajaActual) {
            mostrarToast('No puedes transferir más de lo disponible en caja', 'danger');
            btn.prop('disabled', false);
            return false;
        }

        return true;
    }


/* =========================
   AJAX TRANSFERENCIA
========================= */
    function enviarTransferencia(data, btn) {

        $.ajax({
            url: '/movimientos-caja-cuenta/transferir',
            type: 'POST',
            data: {
                id_caja: data.idCaja,
                id_cuenta: data.idCuenta,
                monto: data.monto,
                _token: data._token
            },

            success: function (res) {

                if (res.success) {
                    mostrarToast(res.mensaje, 'success');
                    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalTransferir')).hide();
                    $('#tablaCajaCuenta').DataTable().ajax.reload();
                } else {
                    mostrarToast(res.mensaje || 'Error al transferir', 'danger');
                }
            },

            error: function (err) {

                let mensaje = 'Error inesperado';

                if (err.responseJSON?.mensaje) {
                    mensaje = err.responseJSON.mensaje;
                }

                mostrarToast(mensaje, 'danger');
            },

            complete: function () {
                btn.prop('disabled', false);
            }
        });
    }
/* --------------------------------------------------------------------------------------------------------- */ 

    $('#tablaCajaCuenta').on('click', '.btn-detalle', function () {

        const idCaja = $(this).data('id_caja');

        // UI reset
        $('#tablaDetalleTransferencias').html('');
        $('#detalleCantidadTransferencias').text('0');
        $('#detalleTotalTransferido').text('C$ 0.00');

        // títulos
        $('#cajaDetalleTitulo').text('#' + idCaja);
        $('#detalleCajaNumero').text('#' + idCaja);

        cargarDetalleTransferencias(idCaja);

        const modal = new bootstrap.Modal( document.getElementById('modalDetalleTransferencias') );
        modal.show();

    });


    function cargarDetalleTransferencias(idCaja) {

        $.ajax({
            url: '/movimientos-caja-cuenta/detalle/' + idCaja,
            type: 'GET',
            dataType: 'json',

            success: function (res) {

                if (!res.success) {
                    return;
                }

                const tbody = $('#tablaDetalleTransferencias');
                tbody.html('');

                $('#detalleCantidadTransferencias').text(res.cantidad ?? 0);
                $('#detalleTotalTransferido').text( moneda(res.total) );

                if (!res.data || res.data.length === 0) {

                    tbody.html(`
                        <tr>
                            <td colspan="5" class="text-muted">
                                Sin transferencias registradas
                            </td>
                        </tr>
                    `);

                } else {

                    res.data.forEach((t, index) => {

                        tbody.append(`
                            <tr>
                                <td>${index + 1}</td>

                                <td>
                                    <span class="fw-semibold">
                                        ${t.usuario}
                                    </span>
                                </td>

                                <td class="text-success fw-bold">
                                    ${moneda(t.monto)}
                                </td>

                                <td>
                                    <span class="text-muted">
                                        ${t.nombre_cuenta}
                                    </span>
                                </td>


                                <td>
                                    ${formatearFechaDia(t.fecha)}
                                </td>
                            </tr>
                        `);
                    });
                }
            },

            error: function (xhr) {

                console.log('❌ ERROR AJAX:', xhr.responseText);
                alert('Error al cargar transferencias');
            }
        });
    }


};