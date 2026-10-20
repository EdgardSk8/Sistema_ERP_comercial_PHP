import { imprimirFacturaTermica } from './ImprimirFacturaTermica';

export default function initMostrarVentas() {

    let ventaActualParaImpresion = null;
    let opcionesFiltros = {};

    document.getElementById('titulo').textContent = 'HISTORIAL DE VENTAS';

    const table = $('#tablaVentas').DataTable({

        serverSide: true,

        ajax: {
            url: '/ventas/mostrar',
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
            { data: 'id_venta' },
            { data: 'numero_factura', render: data => data ? data : '<span>—</span>' },
            { data: 'cliente.nombre_cliente', render: data => data ? data : '<span>—</span>'},
            { data: 'usuario.nombre_usuario', render: data => data ? data : '<span>—</span>' },
            { data: 'id_caja', render: function(data){
                    return `Caja ${data}
                    `;
                } },
            { data: 'fecha_venta', render: function(data){ return formatearFecha(data); } },
            { data: 'subtotal_venta', render: data => moneda(data) },
            { data: 'impuesto_venta', render: data => moneda(data) },
            { data: 'total_venta', render: data => moneda(data) },
            { data: null, render: function (_data, _type, venta) {
                return venta.plan_pago ? 'A plazos' : (venta.metodo_pago?.nombre_metodo_pago ?? '—');
            } },
            { data: 'estado_venta',
                render: function(data){
                    return data == 1
                        ? '<span class="estado estado-activo"><i class="ph ph-check me-1"></i></span>'
                        : '<span class="estado estado-inactivo"><i class="ph ph-prohibit me-1"></i></span>';
                }
            },

            {
                data: 'id_venta',
                render: function(data){
                    return `
                        <button class="detalle-venta btn-detalle" data-id="${data}">
                            <i class="ph ph-eye"></i>
                        </button>
                    `;
                }
            }
            
        ], 
       
        order: [[0, 'desc']],
        initComplete: function () {
            ConfigurarFiltrosDataTable(this, { columnasSelect: [2,3, 9], columnasIgnorar: [11], opciones: opcionesFiltros });
        },

        drawCallback: function () { AnimarFilasVisibles(this.api()); }
        
    }); // Fin de datatables    

    configurarToggleColumnas('tablaVentas');

    async function imprimirVentaDesdeRegistro(data) {
        try {
            const empresa = await obtenerCredencialesEmpresa();
            imprimirFacturaTermica(data, empresa);
        } catch (e) {
            console.error('Error cargando empresa:', e);
            mostrarToast('No fue posible obtener los datos de la empresa. No se pudo imprimir la factura.', 'danger');
        }
    }

    async function obtenerCredencialesEmpresa() {

        return new Promise((resolve, reject) => {

            $.ajax({
                url: '/credenciales/mostrar',
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },

                success: function (res) {

                    if (res.success && res.data) {
                        resolve(res.data);
                    } else {
                        reject('No data');
                    }
                },

                error: function (xhr) {
                    console.error('Error AJAX credenciales:', xhr.responseText);
                    reject('Error servidor');
                }
            });

        });
    }

    $(document).off('click', '.detalle-venta').on('click', '.detalle-venta', function () {

        const btn = $(this); // Solucion Temporal

        let idVenta = btn.data('id');

        $('#tablaDetalles').html('<tr><td colspan="5" class="text-center">Cargando...</td></tr>');

        $.get(`/ventas/${idVenta}/detalle`, function (res) {

            let venta = res.venta;
            ventaActualParaImpresion = venta;

            const btn = $('#btnAnular');

            btn.data('id', venta.id_venta);

            if (venta.estado_venta == 0) { btn.prop('disabled', true).html('<i class="ph ph-x-circle me-1"></i> Factura Anulada');
            } else { btn.prop('disabled', false) .html('<i class="ph ph-x-circle me-1"></i> Anular Factura'); }

            $('#facturaTitulo').text(`Factura: ${venta.numero_factura}`);
            $('#clienteNombre').text(venta.cliente?.nombre_cliente ?? '—');
            $('#usuarioNombre').text(venta.usuario?.nombre_usuario ?? '—');
            $('#fechaVenta').text(venta.fecha_venta);
            $('#metodoPago').text(venta.metodo_pago?.nombre_metodo_pago ?? '—');

            let filas = '';

            venta.detalles.forEach(detalle => {
                filas += `
                    <tr>
                        <td>${detalle.producto?.nombre_producto ?? '—'}${detalle.descripcion_variacion ? ` · ${detalle.descripcion_variacion}` : ''}${detalle.sku_variacion ? `<small class="d-block text-muted">SKU: ${detalle.sku_variacion}</small>` : ''}</td>
                        <td class="text-center">${detalle.cantidad_venta}</td>
                        <td class="text-end">C$ ${parseFloat(detalle.precio_unitario_venta).toFixed(2)}</td>
                        <td class="text-end">C$ ${parseFloat(detalle.monto_impuesto).toFixed(2)}</td>
                        <td class="text-end">C$ ${parseFloat(detalle.subtotal_detalle_venta).toFixed(2)}</td>
                    </tr>
                `;
            });

            $('#tablaDetalles').html(filas);

            $('#subtotalVenta').text(`C$ ${parseFloat(venta.subtotal_venta).toFixed(2)}`);
            $('#impuestoVenta').text(`C$ ${parseFloat(venta.impuesto_venta).toFixed(2)}`);
            $('#totalVenta').text(`C$ ${parseFloat(venta.total_venta).toFixed(2)}`);

            const modalEl = document.getElementById('modalDetalleVenta');
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();

            

        });


    });

/* ════════════════════════════════════════════════════════════════════════════════════ */

    window.modalAnularVenta = window.modalAnularVenta || null;
    window.volverADetalle = window.volverADetalle || false;

    function crearModalAnularVenta() {

        const modalHTML = `
        <div class="modal fade" id="modalAnularVenta" tabindex="-1" aria-hidden="true">

            <div class="modal-dialog modal-dialog-centered">

                <div class="modal-content">

                    <div class="modal-header">
                        <h5 class="modal-title">Confirmar anulación</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body">

                        <div class="card-responsive">
                            ¿Seguro que deseas anular esta factura?
                        </div>

                    </div>

                    <div class="modal-footer">
                        <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">
                            Cancelar
                        </button>

                        <button type="button" class="btn actualizar btn-sm-modal" id="btnConfirmarAnulacion">
                            Anular
                        </button>
                    </div>

                </div>

            </div>

        </div>`;

        document.body.insertAdjacentHTML("beforeend", modalHTML);
        modalAnularVenta = document.getElementById("modalAnularVenta");
    }

/* ════════════ ABRIR MODAL DE CONFIRMACIÓN DE ANULACIÓN ════════════ */

    $(document)
    .off('click', '#btnAnular')
    .on('click', '#btnAnular', function () {

        const btn = $(this);
        let idVenta = parseInt(btn.data('id'));

        if (!idVenta) { mostrarToast('No se encontró el ID de la venta', 'danger'); return; }

        if (btn.data('loading')) return;
        btn.data('loading', true);

        volverADetalle = $('#modalDetalleVenta').hasClass('show');

        if (!modalAnularVenta) { crearModalAnularVenta(); }

        $('#modalAnularVenta').attr('data-id-venta', idVenta);

        const detalleModalEl = document.getElementById('modalDetalleVenta');
        const detalleModalInstance = bootstrap.Modal.getInstance(detalleModalEl);

        if (detalleModalInstance) { detalleModalInstance.hide(); }

        setTimeout(() => { new bootstrap.Modal(modalAnularVenta).show(); btn.data('loading', false); }, 150);

    });


/* ════════════ CONFIRMAR Y PROCESAR ANULACIÓN DE VENTA ════════════ */

    $(document)
    .off('click', '#btnConfirmarAnulacion')
    .on('click', '#btnConfirmarAnulacion', function () {

        const btnConfirm = $(this);

        const idVenta = $('#modalAnularVenta').attr('data-id-venta');

        if (!idVenta) {
            mostrarToast('ID de venta no válido', 'danger');
            return;
        }

        if (btnConfirm.data('loading')) return;
        btnConfirm.data('loading', true);

        const textoOriginal = btnConfirm.text();
        btnConfirm.prop('disabled', true).text('Anulando...');

        $.ajax({ url: `/ventas/anular/${idVenta}`, method: 'POST', data: { _token: $('meta[name="csrf-token"]').attr('content') },

            success: function (res) {

                if (res.success) {

                    mostrarToast(res.mensaje, 'success');
                    bootstrap.Modal.getInstance(modalAnularVenta)?.hide();
                    bootstrap.Modal.getInstance( document.getElementById('modalDetalleVenta') )?.hide();
                    $('#tablaVentas').DataTable().ajax.reload(null, false);

                } else { mostrarToast("Error al anular Factura", 'danger'); }
            },
            error: function (xhr) {

                let msg = xhr.responseJSON?.mensaje ?? 'Error al anular la venta';
                mostrarToast(msg, 'danger');
            },
            complete: function () {

                btnConfirm.prop('disabled', false).text(textoOriginal);
                btnConfirm.data('loading', false);

            }

        });

    });

/* ════════════ CANCELAR ANULACIÓN Y VOLVER AL DETALLE ════════════ */

    $(document)
    .off('click', '#modalAnularVenta .btn-danger')
    .on('click', '#modalAnularVenta .btn-danger', function () {

        const modal = bootstrap.Modal.getInstance(modalAnularVenta);
        modal?.hide();
        if (volverADetalle) { setTimeout(() => { new bootstrap.Modal( document.getElementById('modalDetalleVenta') ).show(); }, 200); }

    });

$(document).off('click', '#btnImprimir').on('click', '#btnImprimir', function () {
    if (!ventaActualParaImpresion) {
        mostrarToast('No se encontraron los datos de la venta.', 'danger');
        return;
    }

    imprimirVentaDesdeRegistro(ventaActualParaImpresion);
});


























};
