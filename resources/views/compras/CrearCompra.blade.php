<turbo-frame id="contenido-dinamico">

    <link rel="stylesheet" href="{{ Vite::asset('resources/css/compras/Compras.css') }}">

    @include('compras.CrearProducto')

    <!-- ═════════════ ( CONTENEDOR PRINCIPAL ) ═══════════════ -->

    <div class="card card-compras">

        <div class="row g-2">

            <div class="col-12 col-md-4">

                <label class="small">Proveedor</label>

                <select class="form-select form-select-sm" id="proveedor" required>
                    <option value="" selected disabled >Seleccione un proveedor</option>
                </select>

            </div>

            <div class="col-6 col-md-2">

                <label class="form-label small">N° Factura</label>
                <input type="text" class="form-control form-control-sm" id="numero_factura">

            </div>

            <div class="col-6 col-md-3">

                <label class="form-label small">Tipo Factura</label>

                <select class="form-select form-select-sm" id="tipo_factura">
                    <option value="" selected disabled>Seleccione un Tipo de Factura</option>
                </select>

            </div>

            <div class="col-12 col-md-3">
                <label class="form-label small">Método Pago</label>
                <select class="form-select form-select-sm" id="metodo_pago">
                    <option value="" selected disabled>Seleccione Metodo de Pago</option>
                </select>
            </div>

            <div class="col-12 col-md-4">

                <label class="form-label small">Tipo de Pago</label>

                <select class="form-select form-select-sm" id="cajacuentaselect">
                    <option value="" selected disabled>Seleccione un Tipo de Pago</option>
                    <option value="caja">Caja</option>
                    <option value="cuenta">Cuenta</option>
                </select>

            </div>

            <div class="col-6 col-md-4">

                <label class="form-label small">Caja</label>
                <select class="form-select form-select-sm" disabled id="caja_select">
                    <option value="" selected disabled>Seleccione Caja</option>
                </select>

            </div>

            <div class="col-6 col-md-4">

                <label class="form-label small">Cuenta</label>
                <select class="form-select form-select-sm" disabled id="cuenta">
                    <option value="" selected disabled>Seleccione Cuenta</option>
                </select>

            </div>

            <div class="col-12 col-md-8">
                <label class="small">Producto</label>
                <select id="producto_select" data-placeholder="Seleccione un Producto" class="form-select form-select-sm"></select>
            </div>

            <div class="col-4 col-md-1">
                <label class="small">Cantidad</label>
                <input type="number" id="cantidad" class="form-control form-control-sm" min="1">
            </div>

            <div class="col-8 col-md-3">

                <label class="small d-block text-md-center">Acciones</label>

                <div class="Contenedor-Productos">
                    <button type="button" class="btn btn-primary btn-sm" id="btnAgregar">
                        Agregar
                    </button>

                    <button type="button" class="btn btn-success btn-sm"
                            data-bs-toggle="modal"
                            data-bs-target="#modalCrearProducto">
                        Agregar Nuevo Producto
                    </button>
                </div>

            </div>

        </div>

        <div class="Contenedor-CarritoTotales">

            <!-- ═════════════ ( CARRITO ) ═══════════════ -->
            <div class="a col-md m-0">

                <table id="tabla_carrito" class="table table-bordered">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Base</th>
                            <th>Precio Compra</th>
                            <th>Subtotal</th>
                            <th>IVA</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>

            </div>

            <!-- ═════════════ ( TOTALES ) ═══════════════ -->
            <div class="b col-md-2 d-flex">

                <div class="card-body flex-column p-2">

                        <div class="mb-2">
                            <label class="small">Subtotal</label>
                            <input type="text" id="subtotal" class="form-control form-control-sm text-end" readonly>
                        </div>

                        <div class="mb-2">
                            <label class="small">Descuento</label>
                            <input type="number" id="descuento" class="form-control form-control-sm text-end">
                        </div>

                        <div class="mb-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <label class="small mb-0" for="impuesto">Impuesto</label>

                                <!-- ═══ EL PRECIO DEL PROVEEDOR TRAE IVA O NO ═══ -->
                                <div class="form-check form-switch m-0 ps-0 d-flex align-items-center gap-1">
                                    <input class="form-check-input m-0" type="checkbox" role="switch" id="chk_iva_incluido" checked>
                                    <label class="form-check-label small text-nowrap mb-0" for="chk_iva_incluido">
                                        IVA incluido
                                    </label>
                                </div>
                            </div>
                            <input id="impuesto" class="form-control form-control-sm text-end" readonly>
                        </div>

                        <!-- ═══ GASTOS ADICIONALES (TRANSPORTE, COMIDA, ETC.) ═══ -->
                        <div class="mb-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <label class="small mb-0" for="gastos">Gastos</label>
                                <button type="button" class="btn btn-gasto btn-sm" id="btnGastosCompra"
                                        title="Gastos adicionales">
                                    <i class="ph ph-plus"></i>
                                </button>
                            </div>
                            <input type="text" id="gastos" class="form-control form-control-sm text-end" readonly value="0.00">
                        </div>

                        <div class="mb-2">
                            <label class="small fw-bold">Total</label>
                            <input type="text" id="total" class="form-control form-control-sm text-end fw-bold" readonly>
                        </div>

                        <!-- BOTONES -->
                        <div class="mt-auto d-flex justify-content-between gap-2">

                            <button class="btn btn-danger btn-sm" id="btnLimpiar">
                                Limpiar
                            </button>

                            <button class="btn btn-success btn-sm" id="btnRegistrar">
                                Registrar
                            </button>

                        </div>

                    </div>


            </div>

        </div>
        
    </div>

    <!-- ═════════════ ( MODAL GASTOS ADICIONALES ) ═══════════════ -->
    <div class="modal fade" id="modalGastosCompra" tabindex="-1">

        <div class="modal-dialog modal-dialog-centered modal-lg">

            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title">Gastos adicionales de la compra</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">

                    <div class="row g-2 align-items-end">

                        <div class="col-md-4">
                            <label class="small" for="gasto_tipo">Tipo de gasto</label>
                            <select class="form-select form-select-sm" id="gasto_tipo">
                                <option value="" selected disabled>Seleccione un tipo</option>
                            </select>
                        </div>

                        <div class="col-md-2">
                            <label class="small" for="gasto_monto">Monto</label>
                            <input type="number" class="form-control form-control-sm" id="gasto_monto"
                                   min="0.01" step="0.01" placeholder="0.00">
                        </div>

                        <div class="col-md-4">
                            <label class="small" for="gasto_detalle">Detalle (opcional)</label>
                            <input type="text" class="form-control form-control-sm" id="gasto_detalle"
                                   maxlength="200" placeholder="Ej.: flete desde Managua">
                        </div>

                        <div class="col-md-2">
                            <button type="button" class="btn btn-success btn-sm w-100" id="btnAgregarGasto">
                                Agregar
                            </button>
                        </div>

                    </div>

                    <div class="table-responsive mt-3">

                        <table class="table table-sm table-bordered align-middle">

                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Detalle</th>
                                    <th class="text-end">Monto</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody id="tablaGastosCompra"></tbody>

                            <tfoot>
                                <tr>
                                    <th colspan="2" class="text-end">Total gastos</th>
                                    <th class="text-end" id="totalGastosCompra">C$ 0.00</th>
                                    <th></th>
                                </tr>
                            </tfoot>

                        </table>

                    </div>

                    <p class="small text-muted mb-0">
                        Los gastos se reparten entre los productos según su valor y se suman al costo real de cada uno.
                    </p>

                </div>

                <div class="modal-footer">
                    <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">
                        Cerrar
                    </button>
                </div>

            </div>

        </div>

    </div>

</turbo-frame>