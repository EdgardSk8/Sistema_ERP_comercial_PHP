export default function initMostrarVentas() {

    document.getElementById('titulo').textContent = 'HISTORIAL DE VENTAS';

    const table = $('#tablaVentas').DataTable({

        ajax: { url: '/ventas/mostrar', type: 'GET', dataSrc: 'ventas' },
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
                        ? '<span class="estado estado-activo"><i class="fa-solid fa-check me-1"></i></span>'
                        : '<span class="estado estado-inactivo"><i class="fa-solid fa-ban me-1"></i></span>';
                }
            },

            {
                data: 'id_venta',
                render: function(data){
                    return `
                        <button class="detalle-venta btn-detalle" data-id="${data}">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    `;
                }
            }
            
        ], 
       
        order: [[0, 'desc']],
        initComplete: function () {
            ConfigurarFiltrosDataTable(this, { columnasSelect: [2,3, 9], columnasIgnorar: [11] });
        },

        drawCallback: function () { AnimarFilasVisibles(this.api()); }
        
    }); // Fin de datatables    

    configurarToggleColumnas('tablaVentas');

    async function imprimirVentaDesdeRegistro(data) {

        let empresa;

        try {
            empresa = await obtenerCredencialesEmpresa();
        } catch (e) {
            console.error("❌ Error cargando empresa:", e);
            mostrarToast(
                "No fue posible obtener los datos de la empresa. No se pudo imprimir la factura.",
                "danger"
            );
            return;
        }

        const cliente = data?.cliente ?? {};

        const productos = Array.isArray(data?.productos)
            ? data.productos
            : Array.isArray(data?.detalle)
                ? data.detalle
                : [];

        if (productos.length === 0) {
            console.warn("⚠️ No hay productos para imprimir");
            return;
        }

        const fecha = window.formatearFechaDiaHora(
            data?.fecha_venta ?? data?.fecha ?? new Date()
        );

        const numeroFactura = data?.numero_factura ?? data?.factura ?? 'VENTA';
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

            const totalLinea =
                Number(p.total ?? (precio * cantidad + impuesto * cantidad));

            subtotalGeneral += precio * cantidad;
            impuestoTotal += impuesto * cantidad;
            totalFinal += totalLinea;

            filas += `
                <tr>
                    <td>${nombre}</td>
                    <td style="text-align:center;">${cantidad}</td>
                    <td style="text-align:right;">C$ ${precio.toFixed(2)}</td>
                    <td style="text-align:right;">C$ ${impuesto.toFixed(2)}</td>
                    <td style="text-align:right;">C$ ${totalLinea.toFixed(2)}</td>
                </tr>
            `;
        });

        const recibido = Number(data?.monto_recibido ?? totalFinal);
        const vuelto = Number(data?.vuelto ?? (recibido - totalFinal));

        const ventana = window.open('', '_blank', 'width=900,height=700');

        if (!ventana) {
            console.log("Alerta: Activa ventanas emergentes para imprimir");
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
                        font-size: 11.8px; /* igual que factura */
                    }

                    th, td {
                        border-bottom: 1px solid #ddd;
                        padding: 8px 6px; /* mismo padding exacto */
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

            const btn = $('#btnAnular');

            btn.data('id', venta.id_venta);

            if (venta.estado_venta == 0) { btn.prop('disabled', true).html('<i class="bi bi-x-circle me-1"></i> Factura Anulada');
            } else { btn.prop('disabled', false) .html('<i class="bi bi-x-circle me-1"></i> Anular Factura'); }

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

    // 🔥 Construimos el objeto desde el modal (REUTILIZANDO TU UI)
    const data = {
        cliente: {
            nombre_cliente: $('#clienteNombre').text()
        },
        usuario: {
            nombre_usuario: $('#usuarioNombre').text()
        },
        fecha_venta: $('#fechaVenta').text(),
        numero_factura: $('#facturaTitulo').text().replace('Factura: ', ''),
        subtotal_venta: $('#subtotalVenta').text().replace('C$ ', ''),
        impuesto_venta: $('#impuestoVenta').text().replace('C$ ', ''),
        total_venta: $('#totalVenta').text().replace('C$ ', ''),
        productos: []
    };

    // 🔥 reconstruir productos desde tabla (esto es clave)
    $('#tablaDetalles tr').each(function () {

        const tds = $(this).find('td');

        if (tds.length === 5) {
            data.productos.push({
                nombre: $(tds[0]).text(),
                cantidad: $(tds[1]).text(),
                precio: $(tds[2]).text().replace('C$ ', ''),
                impuesto: $(tds[3]).text().replace('C$ ', ''),
                total: $(tds[4]).text().replace('C$ ', '')
            });
        }
    });

    // 🔥 AQUÍ LLAMAS TU FUNCIÓN NUEVA
    imprimirVentaDesdeRegistro(data);
});


























};
