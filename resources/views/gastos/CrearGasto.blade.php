<div class="modal fade" id="modalCrearGasto" tabindex="-1">

    <div class="modal-dialog modal-dialog-centered">

        <div class="modal-content">

            <div class="modal-header">
                <h5 class="modal-title">Crear Gasto</h5>
                <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">

                <div class="card-responsive">

                    <form id="formCrearGasto" class="row g-3">

                        <div class="col-md-6">
                            <label class="form-label">Nombre del Gasto</label>
                            <input
                                id="crear_nombre_gasto"
                                type="text"
                                class="form-control form-control-sm"
                                placeholder="Ej: Pago de luz"
                                maxlength="150"
                                required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Tipo de Gasto</label>
                            <select
                                id="crear_id_tipo_gasto"
                                class="form-select form-select-sm"
                                required>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Descripción</label>
                            <textarea
                                id="crear_descripcion_gasto"
                                class="form-control form-control-sm"
                                rows="1"
                                placeholder="Detalle opcional"></textarea>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Fecha de pago <span class="text-secondary">(opcional)</span></label>
                            <input
                                id="crear_fecha_pago"
                                type="date"
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
                    id="btnGuardarGasto"
                    type="button"
                    class="btn guardar btn-sm-modal">
                    Guardar
                </button>

            </div>

        </div>

    </div>

</div>