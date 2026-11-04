<turbo-frame id="contenido-dinamico">
    @vite(['resources/css/cuentasporcobrar/CuentasPorCobrar.css'])

    <section class="cartera-page">

        <div class="cartera-toolbar">

            <div class="cartera-toolbar-info">
                <h4 class="cartera-toolbar-titulo">Cuentas por cobrar</h4>
                <span class="cartera-toolbar-sub">Seguimiento de cuotas y abonos</span>
            </div>

            <div class="cartera-toolbar-resumen">
                <div class="cartera-chip">
                    <span>Por cobrar</span>
                    <strong id="resumenCarteraTotal">C$ 0.00</strong>
                </div>
                <div class="cartera-chip cartera-chip-vencido">
                    <span>Vencido</span>
                    <strong id="resumenCarteraVencido">C$ 0.00</strong>
                </div>
                <div class="cartera-chip cartera-chip-porvencer">
                    <span>Por vencer</span>
                    <strong id="resumenCarteraPorVencer">C$ 0.00</strong>
                </div>
                <div class="cartera-chip cartera-chip-clientes">
                    <span>Clientes</span>
                    <strong id="resumenCarteraClientes">0</strong>
                </div>
            </div>

            <div class="cartera-toolbar-filtros">
                <label for="filtroEstadoCartera" class="visually-hidden">Estado</label>
                <select id="filtroEstadoCartera" class="form-select form-select-sm">
                    <option value="todas">Todas</option>
                    <option value="atrasada">Atrasadas</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="parcial">Con abono parcial</option>
                    <option value="pagada">Pagadas</option>
                </select>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="recargarCartera" title="Actualizar" aria-label="Actualizar cartera">
                    <i class="ph ph-arrows-clockwise"></i>
                </button>
            </div>

        </div>

        <div class="table-responsive cartera-tabla-wrap">
            <table class="table table-sm table-hover align-middle mb-0" id="tablaCuentasPorCobrar">
                <thead>
                    <tr>
                        <th>Factura</th>
                        <th>Cliente</th>
                        <th>Total</th>
                        <th>Saldo pendiente</th>
                        <th>Próximo vencimiento</th>
                        <th>Estado</th>
                        <th class="text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
        <div id="estadoVacioCartera" class="text-center text-secondary py-5 d-none">No hay ventas para mostrar con este filtro.</div>
        <div id="errorCartera" class="alert alert-danger d-none mt-3" role="alert"></div>
    </section>

    <div class="modal fade" id="modalDetalleCartera" tabindex="-1" aria-labelledby="tituloDetalleCartera" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header cartera-detalle-header">
                    <div><h5 class="modal-title" id="tituloDetalleCartera">Detalle del plan de pagos</h5></div>
                    <div class="cartera-detalle-acciones">
                        <button type="button" class="btn guardar btn-sm-modal" id="imprimirDetalleCartera" title="Imprimir detalle" aria-label="Imprimir detalle">
                            <i class="ph ph-printer"></i> Imprimir
                        </button>
                        <button type="button" class="btn-close cartera-btn-cerrar" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="cartera-resumen-detalle">
                        <div><span>Factura</span><strong id="facturaDetalleCartera">—</strong></div>
                        <div><span>Total</span><strong id="totalDetalleCartera">—</strong></div>
                        <div><span>Saldo pendiente</span><strong id="saldoDetalleCartera">—</strong></div>
                        <div><span>Cliente</span><strong id="clienteDetalleCartera">—</strong></div>
                    </div>
                    <h6>Productos de la venta</h6>
                    <div class="table-responsive">
                        <table class="table table-sm align-middle cartera-productos">
                            <thead><tr><th>Producto</th><th class="text-center">Cantidad</th><th class="text-end">Precio</th><th class="text-end">Subtotal</th></tr></thead>
                            <tbody id="productosDetalleCartera"></tbody>
                        </table>
                    </div>
                    <h6 class="mt-4">Cuotas</h6>
                    <div class="table-responsive"><table class="table table-sm align-middle"><thead><tr><th>Nº</th><th>Vencimiento</th><th>Importe</th><th>Pagado</th><th>Saldo</th><th>Estado</th></tr></thead><tbody id="cuotasDetalleCartera"></tbody></table></div>
                    <h6 class="mt-4">Abonos recibidos</h6>
                    <div class="table-responsive"><table class="table table-sm align-middle"><thead><tr><th>Fecha</th><th>Método</th><th>Referencia</th><th class="text-end">Importe</th></tr></thead><tbody id="pagosDetalleCartera"></tbody></table></div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalAbonoCartera" tabindex="-1" aria-labelledby="tituloVentanaAbonoCartera" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <form class="modal-content" id="formAbonoCartera">
                <div class="modal-header">
                    <h5 class="modal-title" id="tituloVentanaAbonoCartera">Registrar abono</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <div class="cartera-resumen-abono mb-3" aria-live="polite">
                        <div class="cartera-resumen-abono-intro">
                            <h5 class="modal-title" id="tituloAbonoCartera">Registrar abono</h5>
                            <div class="small" id="saldoAbonoCartera"></div>
                            <p class="small mb-0">Registra el pago recibido. Se aplicará primero a las cuotas con vencimiento más cercano.</p>
                        </div>
                        <div><span>Se abonará</span><strong id="previsionMontoAbono">C$ 0.00</strong></div>
                        <div><span>Saldo restante</span><strong id="previsionSaldoAbono">C$ 0.00</strong></div>
                        <div><span>Fechas pendientes después del abono</span><strong id="previsionCuotasAbono">0</strong></div>
                        <div class="cartera-proximo-vencimiento"><span>Próximo vencimiento</span><strong id="previsionProximoVencimiento">—</strong></div>
                    </div>
                    <div class="row g-1">
                        <div class="col-6">
                            <label for="monedaAbonoCartera" class="form-label">Moneda</label>
                            <select class="form-select form-select-sm" id="monedaAbonoCartera">
                                <option value="NIO">Córdobas (C$)</option>
                                <option value="USD">Dólares ($)</option>
                            </select>
                        </div>
                        <div class="col-6">
                            <label for="metodoAbonoCartera" class="form-label">Método de pago</label>
                            <select class="form-select form-select-sm" id="metodoAbonoCartera" required></select>
                        </div>
                    </div>
                    <div class="" id="montoAbonoContenedor">
                        <label for="montoAbonoCartera" class="form-label" id="labelMontoAbono">Importe recibido</label>
                        <div class="input-group input-group-sm">
                            <span class="input-group-text" id="simboloMontoAbono">C$</span>
                            <input type="number" class="form-control form-control-sm" id="montoAbonoCartera" min="0.01" step="0.01" placeholder="Ej.: 500" required>
                        </div>
                    </div>
                    <div id="efectivoAbonoCampos">
                        <div class="row g-1">
                            <div class="col-6">
                                <label for="vueltoAbonoCordobas" class="form-label">Vuelto C$</label>
                                <input type="text" class="form-control form-control-sm" id="vueltoAbonoCordobas" readonly placeholder="—">
                            </div>
                            <div class="col-6">
                                <label for="vueltoAbonoDolares" class="form-label">Vuelto $</label>
                                <input type="text" class="form-control form-control-sm" id="vueltoAbonoDolares" readonly placeholder="—">
                            </div>
                        </div>
                    </div>
                    <div class="small text-secondary" id="equivalenciaAbonoCartera" aria-live="polite"></div>
                    <div id="contenedorCuentaAbonoCartera" class="d-none">
                        <label for="cuentaAbonoCartera" class="form-label">Cuenta receptora</label>
                        <select class="form-select form-select-sm" id="cuentaAbonoCartera"></select>
                    </div>
                    <label for="referenciaAbonoCartera" class="form-label">Referencia <span class="text-secondary">(opcional)</span></label>
                    <input type="text" class="form-control form-control-sm" id="referenciaAbonoCartera" maxlength="120">
                    <div id="errorAbonoCartera" class="small text-danger mt-2" role="alert"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn guardar btn-sm-modal" id="guardarAbonoCartera">Registrar abono</button>
                </div>
            </form>
        </div>
    </div>
</turbo-frame>