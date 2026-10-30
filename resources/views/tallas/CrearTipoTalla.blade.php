<div class="modal fade" id="modalCrearTipoTalla" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Agregar tipo de talla</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
                <div class="card-responsive">
                    <form id="formCrearTipoTalla">
                        @csrf
                        <div class="mb-2">
                            <label for="crear_nombre_tipo_talla" class="form-label">Nombre del tipo</label>
                            <input id="crear_nombre_tipo_talla" name="nombre_tipo_talla" type="text"
                                class="form-control form-control-sm" maxlength="60"
                                placeholder="Ejemplo: Calzado, Ropa adulto, Ropa niño" required>
                        </div>

                        <div class="mb-2">
                            <label for="crear_descripcion_tipo_talla" class="form-label">Descripción (opcional)</label>
                            <input id="crear_descripcion_tipo_talla" name="descripcion_tipo_talla" type="text"
                                class="form-control form-control-sm" maxlength="150"
                                placeholder="Ejemplo: Tallas numéricas de zapatos (36 a 44)">
                        </div>

                        <small class="text-muted d-block mt-2">Después de crearlo podrás agregar sus tallas desde «Agregar talla».</small>
                    </form>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" form="formCrearTipoTalla" class="btn guardar btn-sm-modal" id="btnGuardarTipoTalla">Guardar</button>
            </div>
        </div>
    </div>
</div>
