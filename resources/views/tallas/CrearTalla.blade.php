<div class="modal fade" id="modalCrearTalla" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Agregar talla</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
                <div class="card-responsive">
                    <form id="formCrearTalla">
                        @csrf
                        <label for="crear_talla" class="form-label">Nombre de la talla</label>
                        <input id="crear_talla" name="talla" type="text" class="form-control form-control-sm"
                            maxlength="20" placeholder="Ejemplo: 39, M, 355 ml" required>
                        <small class="text-muted d-block mt-2">Las tallas se asignan a variantes; las medidas de productos se administran por separado.</small>
                    </form>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" form="formCrearTalla" class="btn guardar btn-sm-modal" id="btnGuardarTalla">Guardar</button>
            </div>
        </div>
    </div>
</div>
