<div class="modal fade" id="modalPagarGasto" tabindex="-1">

    <div class="modal-dialog modal-dialog-centered">

        <div class="modal-content">

            <div class="modal-header">
                <h5 class="modal-title">Pagar Gasto</h5>
                <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">

                <div class="card-responsive">

                    <form id="formPagarGasto" class="row g-3">

                        <input type="hidden" id="pagar_id_gasto">

                        <div class="col-md-6">
                            <label class="form-label">Nombre del Gasto</label>
                            <input
                                id="pagar_nombre_gasto"
                                type="text"
                                class="form-control form-control-sm"
                                disabled>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Último Pago</label>
                            <input
                                id="pagar_ultimo_pago"
                                type="text"
                                class="form-control form-control-sm"
                                disabled>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Último Monto</label>
                            <input
                                id="pagar_ultimo_monto"
                                type="text"
                                class="form-control form-control-sm"
                                disabled>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Monto a Pagar</label>
                            <input
                                id="pagar_monto"
                                type="number"
                                class="form-control form-control-sm"
                                min="0"
                                step="0.5"
                                required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Pagar con Caja</label>

                            <select
                                id="pagar_id_caja"
                                class="form-select form-select-sm">

                                <option value="">Seleccione</option>

                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Pagar con Cuenta</label>

                            <select
                                id="pagar_id_cuenta"
                                class="form-select form-select-sm">

                                <option value="">Seleccione</option>

                            </select>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label">Próximo vencimiento</label>

                            <select
                                id="pagar_renovar_fecha"
                                class="form-select form-select-sm">

                                <option value="ninguno" selected>
                                    Sin próxima fecha (pago irregular)
                                </option>

                                <option value="auto">
                                    Automático ( +1 mes )
                                </option>

                                <option value="manual">
                                    Elegir fecha manual
                                </option>

                            </select>

                            <div class="form-text">
                                Si no sabes cuándo será el próximo pago, déjalo en “Sin próxima fecha”.
                            </div>
                        </div>

                        <div class="col-12 d-none" id="grupo_fecha_manual">

                            <label class="form-label">Nueva fecha de vencimiento</label>

                            <input
                                id="pagar_nueva_fecha"
                                type="date"
                                placeholder="Nueva Fecha"
                                class="form-control form-control-sm">

                        </div>

                    </form>

                </div>

            </div>

            <div class="modal-footer">

                <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">
                    Cancelar
                </button>

                <button
                    id="btnPagarGasto"
                    type="button"
                    class="btn guardar btn-sm-modal">
                    Pagar
                </button>

            </div>

        </div>

    </div>

</div>