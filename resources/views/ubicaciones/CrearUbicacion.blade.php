<div class="modal fade" id="modalCrearUbicacion" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Crear ubicación</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
                <div class="card-responsive">
                    <form id="formCrearUbicacion" class="row g-3" novalidate>
                        <div class="col-12">
                            <label for="crear_nombre_ubicacion" class="form-label">Nombre de la ubicación</label>
                            <input id="crear_nombre_ubicacion" type="text" class="form-control form-control-sm" placeholder="Nombre de la ubicación" maxlength="100" required>
                        </div>
                        <div class="col-12">
                            <label for="crear_descripcion_ubicacion" class="form-label">Descripción</label>
                            <textarea id="crear_descripcion_ubicacion" class="form-control form-control-sm" placeholder="Descripción opcional" maxlength="150" rows="2"></textarea>
                        </div>
                    </form>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                <button id="btnGuardarUbicacion" type="button" class="btn guardar btn-sm-modal">Guardar</button>
            </div>
        </div>
    </div>
</div>