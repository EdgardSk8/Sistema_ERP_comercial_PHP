<div class="modal fade" id="modalDetalleCompra" tabindex="-1">

    <div class="modal-dialog modal-dialog-centered modal-lg">

        <div class="modal-content">

            <!-- HEADER -->
            <div class="modal-header d-flex justify-content-between align-items-center">

                <h5 class="modal-title" id="facturaTituloCompra">
                    Factura: —
                </h5>

                <div class="btns-right d-flex align-items-center gap-2">

                    <button type="button" data-id="" class="btn btn-danger btn-sm" id="btnAnularCompra">
                        <i class="bi bi-x-circle"></i> Anular Factura
                    </button>

                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>

                </div>

            </div>

            <!-- BODY -->
            <div class="modal-body" id="areaImprimirCompra">

                <!-- INFO GENERAL -->
                <div class="row mb-3">
                    <div class="col-6">
                        <strong>Proveedor:</strong> <span id="proveedorNombre">—</span> <br>
                        <strong>Usuario:</strong> <span id="usuarioNombreCompra">—</span>
                    </div>

                    <div class="col-6 text-end">
                        <strong>Fecha:</strong> <span id="fechaCompra">—</span> <br>
                        <strong>Método Pago:</strong> <span id="metodoPagoCompra">—</span>
                    </div>
                </div>

                <!-- TABLA DE PRODUCTOS -->
                <div class="table-responsive">
                    <table class="table table-bordered table-sm text-center align-middle">
                        <thead class="table-dark">
                            <tr>
                                <th>Producto</th>
                                <th>Cant</th>
                                <th>Precio</th>
                                <th>Impuesto</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody id="tablaDetallesCompra">
                            <!-- JS inserta aquí -->
                        </tbody>
                    </table>
                </div>

                <!-- TOTALES -->
                <div class="row mt-3">
                    <div class="col-6"></div>

                    <div class="col-6">

                        <div class="d-flex justify-content-between">
                            <strong>Subtotal:</strong>
                            <span id="subtotalCompra">C$ 0.00</span>
                        </div>

                        <div class="d-flex justify-content-between">
                            <strong>Descuento:</strong>
                            <span id="descuentoCompra">C$ 0.00</span>
                        </div>

                        <div class="d-flex justify-content-between">
                            <strong>Impuesto:</strong>
                            <span id="impuestoCompra">C$ 0.00</span>
                        </div>

                        <div class="d-flex justify-content-between border-top pt-2">
                            <strong>Total:</strong>
                            <strong id="totalCompra">C$ 0.00</strong>
                        </div>

                    </div>
                </div>

            </div>

        </div>
    </div>
</div>