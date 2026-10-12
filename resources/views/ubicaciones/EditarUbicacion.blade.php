<div class="modal fade" id="modalEditarUbicacion" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Editar ubicación</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
                <div class="card-responsive">
                    <form id="formEditarUbicacion" class="row g-3" novalidate>
                        <input type="hidden" id="editar_id_ubicacion">
                        <div class="col-12">
                            <label for="editar_nombre_ubicacion" class="form-label">Nombre de la ubicación</label>
                            <input id="editar_nombre_ubicacion" type="text" class="form-control form-control-sm" placeholder="Nombre de la ubicación" maxlength="100" required>
                        </div>
                        <div class="col-12">
                            <label for="editar_descripcion_ubicacion" class="form-label">Descripción</label>
                            <textarea id="editar_descripcion_ubicacion" class="form-control form-control-sm" placeholder="Descripción opcional" maxlength="150" rows="2"></textarea>
                        </div>
                    </form>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                <button id="btnActualizarUbicacion" type="button" class="btn actualizar btn-sm-modal">Actualizar</button>
            </div>
        </div>
    </div>
</div>