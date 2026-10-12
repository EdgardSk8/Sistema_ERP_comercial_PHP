<turbo-frame id="contenido-dinamico">
    @include('ubicaciones.CheckColumnasUbicacion')
    @include('ubicaciones.CrearUbicacion')
    @include('ubicaciones.EditarUbicacion')

    <div class="card">
        <table id="tablaUbicaciones" class="table table-bordered">
            <thead>
                <tr>
                    <th>Ubicación</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>

    <div class="modal fade" id="modalConfirmarEstadoUbicacion" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Confirmar cambio de estado</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <div class="card-responsive" id="mensajeConfirmarEstadoUbicacion"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstadoUbicacion">Confirmar</button>
                </div>
            </div>
        </div>
    </div>
</turbo-frame>