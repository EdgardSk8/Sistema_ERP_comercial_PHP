<div class="modal fade" id="modalEditarTipoTalla" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Editar tipo de talla</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
                <div class="card-responsive">
                    <form id="formEditarTipoTalla">
                        @csrf
                        <input type="hidden" id="editar_id_tipo_talla">
                        <input type="hidden" id="editar_estado_tipo_talla">

                        <div class="mb-2">
                            <label for="editar_nombre_tipo_talla" class="form-label">Nombre del tipo</label>
                            <input id="editar_nombre_tipo_talla" name="nombre_tipo_talla" type="text"
                                class="form-control form-control-sm" maxlength="60" required>
                        </div>

                        <div class="mb-2">
                            <label for="editar_descripcion_tipo_talla" class="form-label">Descripción (opcional)</label>
                            <input id="editar_descripcion_tipo_talla" name="descripcion_tipo_talla" type="text"
                                class="form-control form-control-sm" maxlength="150">
                        </div>

                        <div class="mb-2">
                            <label class="form-label">Tallas asignadas</label>
                            <input id="editar_tallas_tipo_talla" type="text" class="form-control form-control-sm" readonly>
                        </div>

                        <div>
                            <label class="form-label">Estado actual</label>
                            <input id="editar_estado_tipo_talla_texto" type="text" class="form-control form-control-sm" readonly>
                            <small class="text-muted">El estado se cambia desde el botón de acciones, con confirmación.</small>
                        </div>
                    </form>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" form="formEditarTipoTalla" class="btn actualizar btn-sm-modal" id="btnActualizarTipoTalla">Guardar cambios</button>
            </div>
        </div>
    </div>
</div>
