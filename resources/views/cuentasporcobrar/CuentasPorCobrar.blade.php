<turbo-frame id="contenido-dinamico">
    @vite(['resources/css/cuentasporcobrar/CuentasPorCobrar.css'])

    <section class="cartera-page">
        <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
            <div>
                <!-- <h4 class="mb-1">Cuentas por cobrar</h4> -->
                <div class="small text-secondary">Seguimiento de cuotas y abonos</div>
            </div>
            <div class="d-flex align-items-end gap-2">
                <div>
                    <label for="filtroEstadoCartera" class="form-label small mb-1">Estado</label>
                    <select id="filtroEstadoCartera" class="form-select form-select-sm">
                        <option value="todas">Todas</option>
                        <option value="atrasada">Atrasadas</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="parcial">Con abono parcial</option>
                        <option value="pagada">Pagadas</option>
                    </select>
                </div>
                <button type="button" class="btn btn-sm btn-outline-secondary" id="recargarCartera" title="Actualizar" aria-label="Actualizar cartera">
                    <i class="fa-solid fa-rotate"></i>
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
                <div class="modal-header">
                    <div><h5 class="modal-title" id="tituloDetalleCartera">Detalle del plan de pagos</h5></div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <div class="cartera-resumen-detalle mb-3">
                        <div><span>Factura</span><strong id="facturaDetalleCartera">—</strong></div>
                        <div><span>Cliente</span><strong id="clienteDetalleCartera">—</strong></div>
                        <div><span>Total</span><strong id="totalDetalleCartera">—</strong></div>
                        <div><span>Saldo pendiente</span><strong id="saldoDetalleCartera">—</strong></div>
                    </div>
                    <h6>Cuotas</h6>
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
                        <div class="cartera-proximo-vencimiento"><span>Próximo vencimiento</span><strong id="previsionProximoVencimiento">—</strong></div>
                        <div><span>Pagará hoy</span><strong id="previsionMontoAbono">C$ 0.00</strong></div>
                        <div><span>Saldo restante</span><strong id="previsionSaldoAbono">C$ 0.00</strong></div>
                        <div><span>Fechas pendientes después del abono</span><strong id="previsionCuotasAbono">0</strong></div>
                    </div>
                    <div class="row g-2 mb-3">
                        <div class="col-6">
                            <label for="montoAbonoCartera" class="form-label">Importe recibido</label>
                            <div class="input-group"><span class="input-group-text">C$</span><input type="number" class="form-control" id="montoAbonoCartera" min="0.01" step="0.01" required></div>
                        </div>
                        <div class="col-6">
                            <label for="metodoAbonoCartera" class="form-label">Método de pago</label>
                            <select class="form-select" id="metodoAbonoCartera" required></select>
                        </div>
                    </div>
                    <div id="contenedorCuentaAbonoCartera" class="d-none mb-3">
                        <label for="cuentaAbonoCartera" class="form-label">Cuenta receptora</label>
                        <select class="form-select" id="cuentaAbonoCartera"></select>
                    </div>
                    <label for="referenciaAbonoCartera" class="form-label">Referencia <span class="text-secondary">(opcional)</span></label>
                    <input type="text" class="form-control" id="referenciaAbonoCartera" maxlength="120">
                    <div id="errorAbonoCartera" class="small text-danger mt-2" role="alert"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-danger" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-sm btn-success" id="guardarAbonoCartera">Registrar abono</button>
                </div>
            </form>
        </div>
    </div>
</turbo-frame>