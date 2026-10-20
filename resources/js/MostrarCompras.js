export default function initMostrarCompras() {

    let opcionesFiltros = {};

    $(document).off('.mostrarCompras');

    document.getElementById('titulo').textContent = 'HISTORIAL DE COMPRAS';

    $('#tablaCompras').DataTable({

        serverSide: true,

        ajax: {
            url: '/compras/mostrar',
            type: 'GET',

            // El backend solo envia la pagina visible; las opciones de los
            // filtros de columna llegan en la misma respuesta.
            dataSrc: function (json) {
                if (json.opciones && Object.keys(opcionesFiltros).length === 0) {
                    opcionesFiltros = json.opciones;
                }

                return json.data;
            }
        },

        deferRender: true,

        columns: [

            { data: 'id_compra'},
            { data: 'numero_factura_compra', render: data => data ? data : '<span>—</span>' },
            { data: 'proveedor.nombre_proveedor', render: data => data ? data : '<span>—</span>' },
            { data: 'usuario.nombre_usuario', render: data => data ? data : '<span>—</span>' },
            { data: 'fecha_compra', render: function (data) { return formatearFecha(data); } },
            { data: 'subtotal_compra', render: data => moneda(data) },
            { data: 'descuento_compra', render: data => moneda(data) },
            { data: 'impuesto_compra', render: data => moneda(data) },
            { data: 'total_compra', render: data => moneda(data) },
            { data: 'metodo_pago.nombre_metodo_pago' },

            {
                data: 'estado_compra',
                render: function (data) {
                    return data == 1
                        ? '<span class="estado estado-activo">Registrada</span>'
                        : '<span class="estado estado-inactivo">Anulada</span>';
                }
            },

            {
                data: 'id_compra',
                render: function (data) {
                    return `
                        <button class="detalle-compra btn-detalle" data-id="${data}">
                            <i class="ph ph-eye"></i>
                        </button>
                    `;
                }
            }
        ], drawCallback: function () { AnimarFilasVisibles(this.api()); }, order: [[0, 'desc']],
        initComplete: function () { ConfigurarFiltrosDataTable(this, { columnasSelect: [2,3,9], columnasIgnorar: [11], opciones: opcionesFiltros }); }
    });

    configurarToggleColumnas('tablaCompras');

    $(document).on('click.mostrarCompras', '.detalle-compra', function () {

        const btn = $(this); // Solucion Temporal

        let idCompra = btn.data('id');

        $('#tablaDetallesCompra').html('<tr><td colspan="5" class="text-center">Cargando...</td></tr>');

        $.get(`/compras/${idCompra}/detalle`, function (res) {

            let compra = res.compra;

            const btnAnular = $('#btnAnularCompra');
            btnAnular.data('id', compra.id_compra);

            if (compra.estado_compra == 0) {
                btnAnular.prop('disabled', true)
                    .html('<i class="ph ph-x-circle me-1"></i> Factura Anulada');
            } else {
                btnAnular.prop('disabled', false)
                    .html('<i class="ph ph-x-circle me-1"></i> Anular Factura');
            }

            $('#facturaTituloCompra').text(`Factura: ${compra.numero_factura_compra ?? 'Sin Numero de Factura' }`);
            $('#proveedorNombre').text(compra.proveedor?.nombre_proveedor ?? '—');
            $('#usuarioNombreCompra').text(compra.usuario?.nombre_usuario ?? '—');
            $('#fechaCompra').text(compra.fecha_compra);
            $('#metodoPagoCompra').text(compra.metodo_pago?.nombre_metodo_pago ?? '—');

            let filas = '';

            compra.detalles.forEach(detalle => {
                filas += `
                    <tr>
                        <td>${detalle.producto?.nombre_producto ?? '—'}${detalle.descripcion_variacion ? ` · ${detalle.descripcion_variacion}` : ''}${detalle.sku_variacion ? `<small class="d-block text-muted">SKU: ${detalle.sku_variacion}</small>` : ''}</td>
                        <td class="text-center">${detalle.cantidad_compra}</td>
                        <td class="text-end">C$ ${parseFloat(detalle.precio_unitario_compra).toFixed(2)}</td>
                        <td class="text-end">C$ ${(detalle.subtotal_detalle_compra - (detalle.precio_unitario_compra * detalle.cantidad_compra)).toFixed(2)}</td>
                        <td class="text-end">C$ ${parseFloat(detalle.subtotal_detalle_compra).toFixed(2)}</td>
                    </tr>
                `;
            });

            $('#tablaDetallesCompra').html(filas);

            $('#subtotalCompra').text(`C$ ${parseFloat(compra.subtotal_compra).toFixed(2)}`);
            $('#descuentoCompra').text(`C$ ${parseFloat(compra.descuento_compra).toFixed(2)}`);
            $('#impuestoCompra').text(`C$ ${parseFloat(compra.impuesto_compra).toFixed(2)}`);
            $('#totalCompra').text(`C$ ${parseFloat(compra.total_compra).toFixed(2)}`);

            const modal = new bootstrap.Modal(document.getElementById('modalDetalleCompra'));
            modal.show();

        });


    });

/* ════════════ MODAL CONFIRMACIÓN ANULAR COMPRA ════════════ */

window.modalAnularCompra = window.modalAnularCompra || null;
window.volverADetalleCompra = window.volverADetalleCompra || false;

function crearModalAnularCompra() {

    const modalHTML = `
    <div class="modal fade" id="modalAnularCompra" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title">Confirmar anulación</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">

                    <div class="card-responsive">
                        ¿Seguro que deseas anular esta compra?
                    </div>

                </div>

                <div class="modal-footer">
                    <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">
                        Cancelar
                    </button>
                    <button type="button" class="btn actualizar btn-sm-modal" id="btnConfirmarAnulacionCompra">
                        Anular
                    </button>
                </div>

            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    modalAnularCompra = document.getElementById("modalAnularCompra");
}


/* ════════════ ABRIR CONFIRMACIÓN ANULAR COMPRA ════════════ */

$(document)
.off('click', '#btnAnularCompra')
.on('click', '#btnAnularCompra', function () {

    const btn = $(this);
    let idCompra = parseInt(btn.data('id'));

    if (!idCompra) {
        mostrarToast('No se encontró el ID de la compra', 'error');
        return;
    }

    if (btn.data('loading')) return;
    btn.data('loading', true);

    volverADetalleCompra = $('#modalDetalleCompra').hasClass('show');

    if (!modalAnularCompra) crearModalAnularCompra();

    $('#modalAnularCompra').attr('data-id-compra', idCompra);

    const detalleModalEl = document.getElementById('modalDetalleCompra');
    const detalleModalInstance = bootstrap.Modal.getInstance(detalleModalEl);

    if (detalleModalInstance) detalleModalInstance.hide();

    setTimeout(() => {
        new bootstrap.Modal(modalAnularCompra).show();
        btn.data('loading', false);
    }, 150);

});


/* ════════════ CONFIRMAR ANULACIÓN COMPRA ════════════ */

$(document)
.off('click', '#btnConfirmarAnulacionCompra')
.on('click', '#btnConfirmarAnulacionCompra', function () {

    const btnConfirm = $(this);

    const idCompra = $('#modalAnularCompra').attr('data-id-compra');

    if (!idCompra) {
        mostrarToast('ID de compra no válido', 'error');
        return;
    }

    if (btnConfirm.data('loading')) return;
    btnConfirm.data('loading', true);

    const textoOriginal = btnConfirm.text();
    btnConfirm.prop('disabled', true).text('Anulando...');

    $.ajax({
        url: `/compras/anular/${idCompra}`,
        method: 'POST',
        data: { _token: $('meta[name="csrf-token"]').attr('content') },

        success: function (res) {

            if (res.success) {

                mostrarToast(res.mensaje, 'success');

                bootstrap.Modal.getInstance(modalAnularCompra)?.hide();
                bootstrap.Modal.getInstance(document.getElementById('modalDetalleCompra'))?.hide();

                $('#tablaCompras').DataTable().ajax.reload(null, false);

            } else {
                mostrarToast(res.mensaje, 'error');
            }
        },

        error: function (xhr) {
            let msg = xhr.responseJSON?.mensaje ?? 'Error al anular la compra';
            mostrarToast(msg, 'error');
        },

        complete: function () {
            btnConfirm.prop('disabled', false).text(textoOriginal);
            btnConfirm.data('loading', false);
        }

    });

});


/* ════════════ CANCELAR Y VOLVER AL DETALLE ════════════ */

$(document)
.off('click', '#modalAnularCompra .btn-danger')
.on('click', '#modalAnularCompra .btn-danger', function () {

    const modal = bootstrap.Modal.getInstance(modalAnularCompra);
    modal?.hide();

    if (volverADetalleCompra) {
        setTimeout(() => {
            new bootstrap.Modal(document.getElementById('modalDetalleCompra')).show();
        }, 200);
    }

});


};
