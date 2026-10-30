<div class="modal fade" id="modalTiposTalla" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <h5 class="modal-title mb-0">Tipos de talla</h5>
                    
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>

            <div class="modal-body">
                <div class="d-flex justify-content-start mb-2">
                    @if(in_array('crear_tipos_tallas', session('permisos', [])))
                        <button class="btn-agregar" type="button" id="btnNuevoTipoTalla">
                            + Agregar tipo
                        </button>
                    @endif
                </div>

                <div class="table-responsive">
                    <table id="tablaTiposTalla" class="table table-bordered mb-0"
                        data-can-edit="{{ in_array('editar_tipos_tallas', session('permisos', [])) && in_array('actualizar_tipos_tallas', session('permisos', [])) ? '1' : '0' }}"
                        data-can-toggle="{{ in_array('cambiar_estado_tipos_tallas', session('permisos', [])) ? '1' : '0' }}">
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Descripción</th>
                                <th>Tallas</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>

            <div class="modal-footer">
                <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cerrar</button>
            </div>
        </div>
    </div>
</div>
