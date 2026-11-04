<turbo-frame id="contenido-dinamico">
    @vite(['resources/css/pedidosweb/PedidosWeb.css'])

    <section class="pedidos-page">
        <div class="pedidos-toolbar">
            <div class="pedidos-toolbar-info">
                <h4 class="pedidos-toolbar-titulo">Pedidos web</h4>
                <span class="pedidos-toolbar-sub">Solicitudes de la tienda y seguimiento de entrega</span>
            </div>

            <div class="pedidos-toolbar-resumen">
                <button type="button" class="pedidos-chip pedidos-chip-total is-activo" data-estado-filtro="todas">
                    <span>Total</span>
                    <strong id="resumenPedidosTotal">0</strong>
                </button>
                <button type="button" class="pedidos-chip pedidos-chip-solicitado" data-estado-filtro="solicitado">
                    <span>Solicitados</span>
                    <strong id="resumenPedidosSolicitados">0</strong>
                </button>
                <button type="button" class="pedidos-chip pedidos-chip-aceptado" data-estado-filtro="aceptado">
                    <span>Aceptados</span>
                    <strong id="resumenPedidosAceptados">0</strong>
                </button>
                <button type="button" class="pedidos-chip pedidos-chip-enviado" data-estado-filtro="enviado">
                    <span>En camino</span>
                    <strong id="resumenPedidosEnCamino">0</strong>
                </button>
                <button type="button" class="pedidos-chip pedidos-chip-entregado" data-estado-filtro="entregado">
                    <span>Entregados</span>
                    <strong id="resumenPedidosEntregados">0</strong>
                </button>
                <button type="button" class="pedidos-chip pedidos-chip-cancelado" data-estado-filtro="cancelado">
                    <span>Cancelados</span>
                    <strong id="resumenPedidosCancelados">0</strong>
                </button>
            </div>



            <div class="pedidos-toolbar-filtros">

                <div class="dropdown">
                    <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown"
                        data-bs-auto-close="outside" title="Mostrar u ocultar columnas">
                        Columnas
                    </button>

                    <div class="dropdown-menu p-3 dropdown-columns">
                        <div class="form-check">
                            <input class="form-check-input toggle-col-pedido" type="checkbox" data-column="0" id="pedidoColNumero" checked>
                            <label class="form-check-label" for="pedidoColNumero">Pedido</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input toggle-col-pedido" type="checkbox" data-column="2" id="pedidoColCliente" checked>
                            <label class="form-check-label" for="pedidoColCliente">Cliente</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input toggle-col-pedido" type="checkbox" data-column="3" id="pedidoColProductos" checked>
                            <label class="form-check-label" for="pedidoColProductos">Productos</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input toggle-col-pedido" type="checkbox" data-column="4" id="pedidoColTotal" checked>
                            <label class="form-check-label" for="pedidoColTotal">Total</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input toggle-col-pedido" type="checkbox" data-column="5" id="pedidoColEstado" checked>
                            <label class="form-check-label" for="pedidoColEstado">Estado</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input toggle-col-pedido" type="checkbox" data-column="6" id="pedidoColPago" checked>
                            <label class="form-check-label" for="pedidoColPago">Pago</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input toggle-col-pedido" type="checkbox" data-column="7" id="pedidoColMetodoPago" checked>
                            <label class="form-check-label" for="pedidoColMetodoPago">Método de pago</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input toggle-col-pedido" type="checkbox" data-column="8" id="pedidoColPreferida">
                            <label class="form-check-label" for="pedidoColPreferida">Hora preferida</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input toggle-col-pedido" type="checkbox" data-column="9" id="pedidoColAceptado">
                            <label class="form-check-label" for="pedidoColAceptado">Aceptado</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input toggle-col-pedido" type="checkbox" data-column="10" id="pedidoColEntrega">
                            <label class="form-check-label" for="pedidoColEntrega">Entrega estimada</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input toggle-col-pedido" type="checkbox" data-column="11" id="pedidoColAcciones" checked>
                            <label class="form-check-label" for="pedidoColAcciones">Acciones</label>
                        </div>
                    </div>
                </div>


                <label for="filtroEstadoPedido" class="visually-hidden">Estado del pedido</label>
                <select id="filtroEstadoPedido" class="form-select form-select-sm">
                    <option value="todas">Todos los estados</option>
                    <option value="solicitado">Solicitados</option>
                    <option value="aceptado">Aceptados</option>
                    <option value="enviado">En camino</option>
                    <option value="listo_retiro">Listo para retiro</option>
                    <option value="entregado">Entregados</option>
                    <option value="cancelado">Cancelados</option>
                    <option value="rechazado">Rechazados</option>
                    <option value="devuelto">Devueltos</option>
                </select>

                <label for="filtroEstadoPago" class="visually-hidden">Estado del pago</label>
                <select id="filtroEstadoPago" class="form-select form-select-sm">
                    <option value="todos">Todos los pagos</option>
                    <option value="pendiente">Pago pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="reembolsado">Reembolsado</option>
                </select>



                <div class="pedidos-toolbar-busqueda">
                    <input type="search" id="buscarPedidoWeb" class="form-control form-control-sm"
                        placeholder="Buscar pedido, cliente o teléfono" aria-label="Buscar pedido">

                    <button type="button" class="btn btn-sm btn-outline-secondary" id="recargarPedidosWeb"
                        title="Actualizar" aria-label="Actualizar pedidos">
                        <i class="ph ph-arrows-clockwise"></i>
                    </button>
                </div>
            </div>
        </div>

        <div class="table-responsive pedidos-tabla-wrap">
            <table class="table table-sm table-hover align-middle mb-0" id="tablaPedidosWeb">
                <thead>
                    <tr>
                        <th>Pedido</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Productos</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Pago</th>
                        <th>Método de pago</th>
                        <th>Hora preferida</th>
                        <th>Aceptado</th>
                        <th>Entrega estimada</th>
                        <th class="text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>

        <div id="estadoVacioPedidos" class="text-center text-secondary py-5 d-none">
            No hay pedidos para mostrar con este filtro.
        </div>
        <div id="errorPedidos" class="alert alert-danger d-none mt-3" role="alert"></div>
    </section>

    <div class="modal fade" id="modalDetallePedidoWeb" tabindex="-1"
        aria-labelledby="tituloDetallePedidoWeb" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header d-flex justify-content-between align-items-center">
                    <h5 class="modal-title text-start" id="tituloDetallePedidoWeb">
                        Pedido: <span id="numeroDetallePedidoWeb">—</span>
                    </h5>
                    <div class="btns-right d-flex align-items-center gap-2">
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                </div>

                <div class="modal-body">
                    <!-- INFO GENERAL -->
                    <div class="card-responsive mb-3">
                        <div class="row">
                            <div class="col-6">
                                <strong>Cliente:</strong> <span id="clienteDetallePedidoWeb">—</span><br>
                                <strong>Teléfono:</strong> <span id="telefonoDetallePedidoWeb">—</span><br>
                                <strong>Método de pago:</strong> <span id="metodoDetallePedidoWeb">—</span><br>
                                <strong>Dirección:</strong> <span id="direccionDetallePedidoWeb">—</span><br>
                                <strong>Referencia:</strong> <span id="referenciaDetallePedidoWeb">—</span>
                            </div>
                            <div class="col-6 text-end">
                                <strong>Fecha:</strong> <span id="fechaDetallePedidoWeb">—</span><br>
                                <strong>Aceptado:</strong> <span id="aceptadoDetallePedidoWeb">—</span><br>
                                <strong>Hora preferida:</strong> <span id="preferidaDetallePedidoWeb">—</span><br>
                                <strong>Entrega estimada:</strong> <span id="entregaDetallePedidoWeb">—</span><br>
                                <strong>Estado:</strong> <span id="estadoDetallePedidoWeb">—</span><br>
                                <strong>Pago:</strong> <span id="pagoDetallePedidoWeb">—</span>
                            </div>
                        </div>
                    </div>

                    <!-- GESTIONAR -->
                    <div class="card-responsive mb-3">
                        <h6 class="pedidos-subtitulo">Gestionar pedido</h6>

                        <form id="formEstadoPedidoWeb" class="pedidos-form-estado">
                            <input type="hidden" id="idPedidoDetalleWeb">

                            <div class="row g-2 ">
                                <div class="col-6">
                                    <label class="form-label d-block">Estado del pedido</label>
                                    <div class="d-flex flex-wrap gap-2" role="group" aria-label="Estado del pedido">
                                        <button type="button" class="btn-sm-modal pedidos-btn-aceptar" id="btnAceptarPedidoWeb">
                                            <i class="ph ph-check-circle"></i> Aceptar
                                        </button>
                                        <button type="button" class="btn-sm-modal pedidos-btn-rechazar" id="btnCancelarPedidoWeb">
                                            <i class="ph ph-x-circle"></i> Cancelar
                                        </button>
                                        <button type="button" class="btn-sm-modal pedidos-btn-imprimir" id="btnImprimirPedidoWeb">
                                            <i class="ph ph-printer"></i> Imprimir factura
                                        </button>
                                        <button type="button" class="btn-sm-modal pedidos-btn-pagado d-none" id="btnMarcarPagadoPedidoWeb">
                                            <i class="ph ph-currency-dollar"></i> Marcar pagado
                                        </button>
                                    </div>
                                    <div class="mt-2">
                                        <label for="selectEstadoPedidoWeb" class="form-label">Cambiar estado</label>
                                        <select id="selectEstadoPedidoWeb" class="form-select form-select-sm"></select>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <label for="fechaEntregaPedidoWeb" class="form-label">Entrega estimada</label>
                                    <input type="text" id="fechaEntregaPedidoWeb" class="form-control form-control-sm"
                                        placeholder="Selecciona fecha y hora" autocomplete="off">
                                    <small class="text-secondary">Hora preferida por el cliente: <span id="horaPreferidaFormPedidoWeb">—</span></small>
                                </div>
                                <div class="col-md-6" id="grupoEstadoPagoWeb">
                                    <label for="selectEstadoPagoWeb" class="form-label">Estado del pago</label>
                                    <select id="selectEstadoPagoWeb" class="form-select form-select-sm"></select>
                                </div>

                                <div class="col-12">
                                    <label for="notaPedidoWeb" class="form-label">Nota / motivo <span class="text-secondary">(opcional)</span></label>
                                    <input type="text" id="notaPedidoWeb" class="form-control form-control-sm" maxlength="500">
                                </div>
                            </div>

                            <div class="pedidos-acciones-estado">
                                <button type="submit" class="btn pedidos-btn-guardar" id="btnGuardarPedidoWeb">
                                    Guardar cambios
                                </button>
                            </div>

                            <div id="errorEstadoPedidoWeb" class="small text-danger mt-2" role="alert"></div>
                        </form>
                    </div>

                    <!-- PRODUCTOS -->
                    <h6 class="pedidos-subtitulo">Productos</h6>
                    <div class="table-responsive">
                        <table class="table table-bordered table-sm text-center align-middle">
                            <thead class="table-dark">
                                <tr>
                                    <th>Producto</th>
                                    <th>Cant</th>
                                    <th>Precio</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody id="itemsPedidoWeb"></tbody>
                        </table>
                    </div>

                    <!-- TOTALES -->
                    <div class="row mt-3">
                        <div class="col-6"></div>

                        <div class="col-6">
                            <div class="d-flex justify-content-between">
                                <strong>Subtotal:</strong>
                                <span id="subtotalDetallePedidoWeb">C$ 0.00</span>
                            </div>

                            <div class="d-flex justify-content-between">
                                <strong>Descuento:</strong>
                                <span id="descuentoDetallePedidoWeb">C$ 0.00</span>
                            </div>

                            <div class="d-flex justify-content-between">
                                <strong>Envío:</strong>
                                <span id="envioDetallePedidoWeb">C$ 0.00</span>
                            </div>

                            <div class="d-flex justify-content-between border-top pt-2">
                                <strong>Total:</strong>
                                <strong id="totalDetallePedidoWeb">C$ 0.00</strong>
                            </div>

                            <button type="button" class="btn pedidos-btn-whatsapp w-100 mt-2" id="btnWhatsappPedidoWeb">
                                <i class="ph ph-whatsapp-logo"></i> Enviar pedido por WhatsApp
                            </button>
                        </div>
                    </div>

                    <!-- HISTORIAL -->
                    <h6 class="pedidos-subtitulo">Historial de pagos</h6>
                    <div class="table-responsive">
                        <table class="table table-bordered table-sm text-center align-middle pedidos-historial-tabla">
                            <thead class="table-dark">
                                <tr>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                    <th>Pago</th>
                                    <th>Usuario</th>
                                </tr>
                            </thead>
                            <tbody id="historialPedidoWeb"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- CONFIRMACIÓN DE ACCIONES RÁPIDAS -->
    <div class="modal fade" id="modalConfirmarAccionPedidoWeb" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="tituloConfirmarAccionPedidoWeb">Confirmar acción</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <div class="card-responsive" id="mensajeConfirmarAccionPedidoWeb"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn actualizar btn-sm-modal" id="confirmarAccionPedidoWeb">Confirmar</button>
                </div>
            </div>
        </div>
    </div>

</turbo-frame>
