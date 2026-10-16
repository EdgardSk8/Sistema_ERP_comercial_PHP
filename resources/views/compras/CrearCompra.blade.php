<turbo-frame id="contenido-dinamico">

    <link rel="stylesheet" href="{{ Vite::asset('resources/css/compras/Compras.css') }}">

    @include('compras.CrearProducto')

    <!-- ═════════════ ( CONTENEDOR PRINCIPAL ) ═══════════════ -->

    <div class="card">

        <div class="row">

            <div class="col-md-4">

                <label class="small">Proveedor</label>

                <select class="form-select form-select-sm" id="proveedor" required>
                    <option value="" selected disabled >Seleccione un proveedor</option>
                </select>

            </div>

            <div class="col-md-2">

                <label class="form-label small">N° Factura</label>
                <input type="text" class="form-control form-control-sm" id="numero_factura">

            </div>

            <div class="col-md-3">

                <label class="form-label small">Tipo Factura</label>

                <select class="form-select form-select-sm" id="tipo_factura">
                    <option value="" selected disabled>Seleccione un Tipo de Factura</option>
                </select>

            </div>

            <div class="col-md-3">
                <label class="form-label small">Método Pago</label>
                <select class="form-select form-select-sm" id="metodo_pago">
                    <option value="" selected disabled>Seleccione Metodo de Pago</option>
                </select>
            </div>

            <div class="col-md-4">

                <label class="form-label small">Tipo de Pago</label>

                <select class="form-select form-select-sm" id="cajacuentaselect">
                    <option value="" selected disabled>Seleccione un Tipo de Pago</option>
                    <option value="caja">Caja</option>
                    <option value="cuenta">Cuenta</option>
                </select>

            </div>

            <div class="col-md-4">

                <label class="form-label small">Caja</label>
                <select class="form-select form-select-sm" disabled id="caja_select">
                    <option value="" selected disabled>Seleccione Caja</option>
                </select>

            </div>

            <div class="col-md-4">

                <label class="form-label small">Cuenta</label>
                <select class="form-select form-select-sm" disabled id="cuenta">
                    <option value="" selected disabled>Seleccione Cuenta</option>
                </select>

            </div>

            <!-- <div class="mb-2"></div> -->

            <div class="col-md-8">
                <label class="small">Producto</label>
                <select id="producto_select" data-placeholder="Seleccione un Producto" class="form-select form-select-sm"></select>
            </div>

            <div class="col-md-1">
                <label class="small">Cantidad</label>
                <input type="number" id="cantidad" class="form-control form-control-sm" min="1">
            </div>

            <div class="col-md-3">

                <label class="small text-center">Acciones</label>

                <div class="Contenedor-Productos">
                    <button class="btn btn-primary btn-sm" id="btnAgregar">
                        Agregar
                    </button>

                    <button class="btn btn-success btn-sm"
                            data-bs-toggle="modal"
                            data-bs-target="#modalCrearProducto">
                        Agregar Nuevo Producto
                    </button>
                </div>

            </div>

        </div>

        <div class="row">

           

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
                            <label class="small">Impuesto</label>
                            <input id="impuesto" class="form-control form-control-sm text-end" readonly>
                        </div>

                        <!-- ═══ EL PRECIO DEL PROVEEDOR TRAE IVA O NO ═══ -->
                        <div class="mb-2">
                            <div class="form-check form-switch">
                                <input class="form-check-input"
                                       type="checkbox"
                                       role="switch"
                                       id="chk_iva_incluido"
                                       checked>
                                <label class="form-check-label small" for="chk_iva_incluido">
                                    IVA incluido
                                </label>
                            </div>
                        </div>

                        <div class="mb-2">
                            <label class="small fw-bold">Total</label>
                            <input type="text" id="total" class="form-control form-control-sm text-end fw-bold" readonly>
                        </div>

                        <!-- BOTONES -->
                        <div class="mt-auto d-flex justify-content-end gap-2">

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


</turbo-frame>