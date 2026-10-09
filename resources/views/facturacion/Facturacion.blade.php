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

            <div class="d-flex justify-content-between align-items-center">

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

        <div class="MC Derecha">

            <div class="row mb-2">

                <div class="col-12">

                    <div class="d-flex justify-content-between align-items-center">
                        <h6> Seleccionar Cliente:</h6>
                        <h6 id="tasaImpuesto"></h6> 
                        <h6 id="NumeroCaja"></h6> 
                    </div>
                    
                    <select class="form-select form-select-sm" name="id_cliente" id="clientes"></select>

                </div>

                <div class="d-flex">
                   
                </div>
            </div>

            <div class="row mb-2">

                <div class="col-6">
                    <h6> Seleccionar Metodo de Pago:</h6>
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

                        <!-- 💵 PAGOS -->
                        <div class="row g-1 mb-2">

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
                        <div class="row g-1 mb-2">

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

</turbo-frame>
