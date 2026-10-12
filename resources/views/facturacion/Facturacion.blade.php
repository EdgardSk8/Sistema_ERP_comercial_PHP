<turbo-frame id="contenido-dinamico">

    <link rel="stylesheet" href="{{ Vite::asset('resources/css/facturacion/Facturacion.css') }}">
<!-- 
    <script src="{{ Vite::asset('resources/js/facturacion/ImprimirFactura.js') }}"></script>
    <script src="{{ Vite::asset('resources/js/facturacion/vuelto.js') }}"></script>
    <script src="{{ Vite::asset('resources/js/facturacion/VerificarCaja.js') }}"></script>
    <script src="{{ Vite::asset('resources/js/facturacion/Select.js') }}"></script>
    
    <script data-ejecutar="true" src="{{ Vite::asset('resources/js/facturacion/Facturacion.js') }}"></script> -->

    <div class="Contenedor-General">

        <div class="MC Izquierda">
            <div class="facturacion-productos-layout">
                <div class="contenedor-botones">
                    
                    <button id="btnAbrirCaja" class="btn btn-sm btn-success">Abrir Caja</button> 
                    <button id="btnCerrarCaja" class="btn btn-sm btn-danger">Cerrar Caja</button>

                    <input type="checkbox" id="toggleFactura" hidden>

                    <label id="BTN-Imprimir-Factura" for="toggleFactura" class="btn-factura">
                        <i class="bi bi-receipt-cutoff"> </i>
                        Imprimir Factura
                    </label>

                    <input type="checkbox" id="toggleProformaFactura" hidden>

                    <label id="BTN-Imprimir-Proforma" for="toggleProformaFactura" class="btn-proforma">
                        <i class="bi-file-earmark-text-fill"> </i>
                        Imprimir Proforma
                    </label>

                    <label id="btnLimpiarCaja" class="btn btn-sm">
                        <i class="bi bi-trash"> </i> 
                        Borrar Filtros
                    </label>

                </div>

                <div class="mini-contenedor-pos">

                <table id="tablaProductos" class="table  table-bordered">
                    <thead>
                        <tr>
                            <th>Producto / SKU</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Accion</th>
                        </tr>
                    </thead>
                </table>

                </div>
            </div>


        </div>

        <div class="MC Derecha">

            <div class="row mb-2">

                <div class="col-12">

                    <div class="d-flex justify-content-between align-items-center">
                        <h6> Seleccionar Cliente:</h6>
                        <h6 id="tasaImpuesto"></h6> 
                        <h6 id="NumeroCaja"></h6> 
                    </div>

                    <div class="row g-2 mb-2">

                        <div class="col-6"> 
                            <select class="form-select form-select-sm" name="id_cliente" id="clientes"></select>
                        </div>

                        <div class="col-6"> 
                            <select class="form-select form-select-sm" id="modalidadVenta">
                                <option value="contado">Contado</option>
                                <option value="plazos">Pago por plazos</option>
                            </select>
                        </div>

                    </div>

                </div>

            </div>

            <div class="row mb-2" id="grupoMetodoCobro">

                <div class="col-6">
                    <h6 id="etiquetaMetodoCobro">Seleccionar método de pago:</h6>
                    <select class="form-select form-select-sm" name="id_metodo_pago" id="metodo_pago"></select>
                </div>

                <div class="col-6">
                    <h6> Seleccionar Cuenta:</h6>
                    <select class="form-select form-select-sm" data-placeholder="Seleccione un Metodo de Pago" name="id_cuenta_metodo_pago" id="id_cuenta_metodo_pago"></select>
                </div>

            </div>

            <div class="card card-pago p-2 mb-2">

                        <div class="d-flex justify-content-between mb-2">
                            <strong>Total:</strong>
                            <span id="total">C$ 0.00</span>
                        </div>

                        <div id="abonoInicialCreditoContenedor" class="d-none mb-2">
                            <!-- <label for="abonoInicialCredito" class="form-label small fw-bold">Abono inicial (opcional)</label> -->
                            <div class="input-group input-group-sm">
                                <span class="input-group-text">C$</span>
                                <input type="number" min="0" step="0.01" id="abonoInicialCredito"
                                    class="form-control" placeholder="0.00">
                            </div>
                        </div>

                        <!-- 💵 PAGOS -->
                        <div class="row g-1 mb-2" id="pagoContadoCampos">

                            <!-- CÓRDOBAS -->
                            <div class="col-6 position-relative">
                                <span style="
                                    position:absolute;
                                    left:10px;
                                    top:50%;
                                    transform:translateY(-50%);
                                    font-size: 0.85rem;
                                    color: var(--text-soft);">
                                    C$
                                </span>

                                <input type="number" min="0" id="pagoCordobas" required
                                    class="form-control form-control-sm"
                                    style="padding-left: 27px;"
                                    placeholder="0">
                            </div>

                            <!-- DÓLARES -->
                            <div class="col-6 position-relative">
                                <span style=" position:absolute; left:10px; top:50%; transform:translateY(-50%);
                                    font-size: 0.85rem; color: var(--text-soft);">
                                    $
                                </span>

                                <input type="number" min="0" id="pagoDolares" required
                                    class="form-control form-control-sm"
                                    style="padding-left: 27px;"
                                    placeholder="Recibido">
                            </div>

                        </div>

                        <!-- 🔄 VUELTOS -->
                        <div class="row g-1 mb-2" id="vueltoContadoCampos">

                            <!-- VUELTO C$ -->
                            <div class="col-6">
                                <input type="text" id="vueltoCordobas"
                                    class="form-control form-control-sm"
                                    placeholder="Vuelto C$" readonly>
                            </div>

                            <!-- VUELTO $ -->
                            <div class="col-6">
                                <input type="text" id="vueltoDolares"
                                    class="form-control form-control-sm"
                                    placeholder="Vuelto $" readonly
                                >
                            </div>

                        </div>

                        <!-- 🧾 BOTÓN -->
                        <button class="btn btn-sm btnFacturar" id="btnFacturar">
                            Facturar
                        </button>

            </div>

            <div class="Facturacion-Carrito">

                <table class="table  table-bordered">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Sub total</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="carrito"></tbody>
                </table>

            </div>

                

        </div>

    </div>

    <div class="modal fade" id="modalPlanPagoVenta" tabindex="-1" aria-labelledby="tituloPlanPagoVenta" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h6 class="modal-title" id="tituloPlanPagoVenta">Programar pagos</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <div class="input-group input-group-sm mb-3">
                        <span class="input-group-text">Descuento C$</span>
                        <input type="number" min="0" step="0.01" id="descuentoPlanPagoVenta" class="form-control" placeholder="Opcional" aria-label="Descuento de la venta a plazos">
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Saldo a financiar</span><strong id="totalPlanPagoVenta">C$ 0.00</strong>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm align-middle mb-2" style="table-layout: fixed;">
                            <colgroup>
                                <col style="width: 10%;">
                                <col style="width: 42%;">
                                <col style="width: 32%;">
                                <col style="width: 16%;">
                            </colgroup>
                            <thead><tr><th>Cuota</th><th>Fecha de vencimiento</th><th>Importe (C$)</th><th></th></tr></thead>
                            <tbody id="filasPlanPagoVenta"></tbody>
                        </table>
                    </div>
                    <button type="button" class="btn btn-sm btn-success" id="agregarCuotaPlanPago">
                        <i class="fa-solid fa-plus me-1"></i>Agregar cuota
                    </button>
                    <div class="d-flex justify-content-between mt-3" role="status">
                        <span>Suma de cuotas</span><strong id="sumaPlanPagoVenta">C$ 0.00</strong>
                    </div>
                    <div id="avisoPlanPagoVenta" class="small mt-1" aria-live="polite"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-danger" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-sm btn-success" id="confirmarPlanPagoVenta" disabled>Confirmar venta a plazos</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalPrecioLiquidacion" tabindex="-1" aria-labelledby="tituloPrecioLiquidacion" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h6 class="modal-title" id="tituloPrecioLiquidacion">Precio de liquidación para esta venta</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <p class="small mb-2">Indica el precio final por unidad. Solo se aplicará a esta venta. El total calculado será el importe registrado en caja, aunque el campo Recibido esté vacío.</p>
                    <div class="table-responsive">
                        <table class="table table-sm align-middle small">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th class="text-end">Cantidad</th>
                                    <th class="text-end">Precio normal</th>
                                    <th style="width: 180px;">Precio de venta</th>
                                </tr>
                            </thead>
                            <tbody id="liquidacionProductos"></tbody>
                        </table>
                    </div>
                    <div class="d-flex justify-content-between fs-6"><span>Nuevo total</span><strong id="liquidacionTotal">C$ 0.00</strong></div>
                    <div id="liquidacionAviso" class="small text-danger mt-2" role="status"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-outline-danger" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-sm btn-success" id="btnAplicarLiquidacion" disabled>Aplicar y facturar</button>
                </div>
            </div>
        </div>
    </div>

</turbo-frame>
