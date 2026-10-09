<div class="modal fade" id="modalCrearMedida" tabindex="-1">

    <div class="modal-dialog modal-dialog-centered">

        <div class="modal-content">

            <div class="modal-header">
                <h5 class="modal-title">Crear Medida</h5>
                <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">

                <div class="card-responsive">

                    <form id="formCrearMedida" class="row g-3">

                        <div class="col-12">
                            <label class="form-label">Tipo de Medida</label>
                            <select id="crear_tipo_medida" class="form-select form-select-sm" required>
                                <option value="">Seleccione un tipo de medida</option>
                            </select>
                        </div>

                        <div class="col-12">
                            <label class="form-label">Nombre</label>
                            <input
                                id="crear_nombre_medida"
                                type="text"
                                class="form-control form-control-sm"
                                placeholder="Nombre de Medida"
                                maxlength="100"
                                required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Abreviatura</label>
                            <input
                                id="crear_abreviatura_medida"
                                type="text"
                                class="form-control form-control-sm"
                                placeholder="Abreviatura Ejemplo: KG"
                                maxlength="20"
                                required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Orden</label>
                            <input
                                id="crear_orden_medida"
                                type="number"
                                class="form-control form-control-sm"
                                min="1"
                                value="1">
                        </div>

                    </form>

                </div>

            </div>

            <div class="modal-footer">

                <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>

                <button class="btn guardar btn-sm-modal" id="btnGuardarMedida">
                    Guardar
                </button>

            </div>

        </div>

    </div>

</div>