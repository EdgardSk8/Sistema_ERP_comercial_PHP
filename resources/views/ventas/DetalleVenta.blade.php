<div class="modal fade" id="modalDetalleVenta" tabindex="-1">

    <div class="modal-dialog modal-dialog-centered modal-lg">

        <div class="modal-content">

            <!-- HEADER -->
            <div class="modal-header d-flex justify-content-between align-items-center">

                <h5 class="modal-title text-start" id="facturaTitulo">
                    Factura: —
                </h5>

                <div class="btns-right d-flex align-items-center gap-2">

                <button type="button" class="btn guardar btn-sm-modal" id="btnImprimir">
                    <i class="ph ph-printer"></i> Imprimir Factura
                </button>

                <button type="button" data-id="" class="btn cancelar btn-sm-modal" id="btnAnular">
                    <i class="ph ph-x-circle"></i> Anular Factura
                </button>

                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>

                </div>

            </div>

            <!-- BODY -->
            <div class="modal-body" id="areaImprimir">

                <div class="card-responsive">
 
                

                    <!-- INFO GENERAL -->
                    <div class="row mb-3">
                        <div class="col-6">
                            <strong>Cliente:</strong> <span id="clienteNombre">—</span> <br>
                            <strong>Usuario:</strong> <span id="usuarioNombre">—</span>
                        </div>

                        <div class="col-6 text-end">
                            <strong>Fecha:</strong> <span id="fechaVenta">—</span> <br>
                            <strong>Método Pago:</strong> <span id="metodoPago">—</span>
                        </div>
                    </div>

                    <!-- TABLA DE PRODUCTOS -->
                    <div class="table-responsive">
                        <table class="table text-center align-middle">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cant</th>
                                    <th>Precio</th>
                                    <th>Impuesto</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody id="tablaDetalles">
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
                                <span id="subtotalVenta">C$ 0.00</span>
                            </div>

                            <div class="d-flex justify-content-between">
                                <strong>Impuesto:</strong>
                                <span id="impuestoVenta">C$ 0.00</span>
                            </div>

                            <div class="d-flex justify-content-between border-top pt-2">
                                <strong>Total:</strong>
                                <strong id="totalVenta">C$ 0.00</strong>
                            </div>
                        </div>
                    </div>

                    </div>

            </div>

        </div>
    </div>
</div>