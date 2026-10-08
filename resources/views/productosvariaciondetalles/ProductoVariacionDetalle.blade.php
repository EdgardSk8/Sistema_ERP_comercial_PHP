<turbo-frame id="contenido-dinamico">

    @include('productosvariaciondetalles.CheckColumnasProductoVariacionDetalle')
    @include('productosvariaciondetalles.CrearVariacionImagen')
    @include('productosvariaciondetalles.EditarVariacionImagen')

    <div class="card">

        <table id="tablaProductoVariacionDetalle" class="table table-bordered">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Variaciones: colores, imágenes, tallas y stock</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>

    </div>

    <div class="modal fade" id="modalGaleriaVariacionImagenes" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="galeria_variacion_titulo">Imágenes de la variación</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <div id="galeria_variacion_contenido" class="row g-3"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn actualizar btn-sm-modal" id="galeria_variacion_agregar">
                        <i class="fa-solid fa-plus"></i> Agregar imagen
                    </button>
                    <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalCrearVariacionTalla" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <form id="formCrearVariacionTalla">
                    @csrf
                    <div class="modal-header">
                        <h5 class="modal-title">Agregar talla a la variaciÃ³n</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="crear_talla_id_variacion" name="id_variacion">
                        <div class="mb-3">
                            <label for="crear_id_talla" class="form-label">Talla del catÃ¡logo</label>
                            <select id="crear_id_talla" name="id_talla" class="form-select form-select-sm" required>
                                <option value="">Seleccione una talla</option>
                            </select>
                        </div>
                        <div>
                            <label for="crear_stock_variacion_talla" class="form-label">Stock</label>
                            <input type="number" id="crear_stock_variacion_talla" name="stock" class="form-control form-control-sm" min="0" step="1" value="0" required>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn actualizar btn-sm-modal">Guardar talla</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalEditarVariacionTalla" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <form id="formEditarVariacionTalla">
                    @csrf
                    <div class="modal-header">
                        <h5 class="modal-title">Editar talla de la variaciÃ³n</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="editar_id_variacion_talla" name="id_variacion_talla">
                        <div class="mb-3">
                            <label for="editar_id_talla" class="form-label">Talla</label>
                            <select id="editar_id_talla" name="id_talla" class="form-select form-select-sm" required>
                                <option value="">Seleccione una talla</option>
                            </select>
                        </div>
                        <div>
                            <label for="editar_stock_variacion_talla" class="form-label">Stock</label>
                            <input type="number" id="editar_stock_variacion_talla" name="stock" class="form-control form-control-sm" min="0" step="1" required>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn actualizar btn-sm-modal">Guardar cambios</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

</turbo-frame>



