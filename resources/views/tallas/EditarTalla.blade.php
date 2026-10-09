<div class="modal fade" id="modalEditarTalla" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Editar talla</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
                <div class="card-responsive">
                    <form id="formEditarTalla">
                        @csrf
                        <input type="hidden" id="editar_id_talla">
                        <input type="hidden" id="editar_estado_talla">
                        <div class="mb-3">
                            <label for="editar_talla" class="form-label">Nombre de la talla</label>
                            <input id="editar_talla" name="talla" type="text" class="form-control form-control-sm" maxlength="20" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Variantes que usan esta talla</label>
                            <input id="editar_variantes_talla" type="text" class="form-control form-control-sm" readonly>
                        </div>
                        <div>
                            <label class="form-label">Estado actual</label>
                            <input id="editar_estado_talla_texto" type="text" class="form-control form-control-sm" readonly>
                            <small class="text-muted">El estado se cambia desde el botón de acciones, con confirmación.</small>
                        </div>
                    </form>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" form="formEditarTalla" class="btn actualizar btn-sm-modal" id="btnActualizarTalla">Guardar cambios</button>
            </div>
        </div>
    </div>
</div>
