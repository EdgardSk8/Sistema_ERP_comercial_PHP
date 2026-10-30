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
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <div>
                        <h5 class="modal-title" id="galeria_variacion_titulo">Imágenes de la variación</h5>
                        <span class="galeria-subtitulo" id="galeria_variacion_subtitulo"></span>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <div id="galeria_variacion_contenido" class="galeria-track"></div>
                    <input type="file" id="reemplazar_imagen_variacion" class="d-none" accept="image/jpeg,image/png,image/gif,image/webp">
                    <input type="file" id="agregar_imagenes_variacion" class="d-none" accept="image/jpeg,image/png,image/gif,image/webp" multiple>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn actualizar btn-sm-modal" id="galeria_variacion_agregar">
                        <i class="ph ph-plus"></i> Agregar imagen
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
                        <h5 class="modal-title">Agregar talla a la variacion</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="crear_talla_id_variacion" name="id_variacion">
                        <div class="row g-2">
                            <div class="col-12 col-md-4">
                                <label for="crear_id_tipo_talla_var" class="form-label">Tipo de talla</label>
                                <select id="crear_id_tipo_talla_var" class="form-select form-select-sm" required>
                                    <option value="">Seleccione un tipo</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-4">
                                <label for="crear_id_talla" class="form-label">Talla</label>
                                <select id="crear_id_talla" name="id_talla" class="form-select form-select-sm" required disabled>
                                    <option value="">Seleccione un tipo primero</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-4">
                                <label for="crear_stock_variacion_talla" class="form-label">Stock</label>
                                <input type="number" id="crear_stock_variacion_talla" name="stock" class="form-control form-control-sm" min="0" step="1" value="0" required>
                            </div>
                        </div>
                        <!-- El SKU se genera automáticamente en el servidor. -->
                        <input type="hidden" id="crear_sku_variacion" name="sku" value="">
                        <div class="row mt-2 g-2">
                            <div class="col-6"><label for="crear_precio_compra_variacion" class="form-label">Costo sin impuesto</label><input type="number" id="crear_precio_compra_variacion" class="form-control form-control-sm" min="0" step="0.01"></div>
                            <div class="col-6"><label for="crear_precio_venta_variacion" class="form-label">Precio de venta</label><input type="number" id="crear_precio_venta_variacion" class="form-control form-control-sm" min="0" step="0.01"></div>
                            <div class="col-12"><label for="crear_modo_precio_variacion" class="form-label">El precio ingresado</label><select id="crear_modo_precio_variacion" class="form-select form-select-sm"><option value="base">Es antes del impuesto</option><option value="incluido">Ya incluye el impuesto</option></select><small class="text-muted">Facturación guardará el precio base y aplicará el impuesto del producto.</small></div>
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
                        <h5 class="modal-title">Editar talla de la variacion</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="editar_id_variacion_talla" name="id_variacion_talla">
                        <div class="row g-2">
                            <div class="col-12 col-md-4">
                                <label for="editar_id_tipo_talla_var" class="form-label">Tipo de talla</label>
                                <select id="editar_id_tipo_talla_var" class="form-select form-select-sm" required>
                                    <option value="">Seleccione un tipo</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-4">
                                <label for="editar_id_talla" class="form-label">Talla</label>
                                <select id="editar_id_talla" name="id_talla" class="form-select form-select-sm" required disabled>
                                    <option value="">Seleccione un tipo primero</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-4">
                                <label for="editar_stock_variacion_talla" class="form-label">Stock</label>
                                <input type="number" id="editar_stock_variacion_talla" name="stock" class="form-control form-control-sm" min="0" step="1" required>
                            </div>
                        </div>
                        <!-- El SKU no se edita: se genera en el servidor (visible solo como referencia). -->
                        <div class="row mt-2 g-2">
                            <div class="col-12">
                                <label for="editar_sku_variacion" class="form-label">SKU</label>
                                <input type="text" id="editar_sku_variacion" class="form-control form-control-sm bg-light" readonly tabindex="-1" aria-readonly="true">
                            </div>
                        </div>
                        <div class="row mt-2 g-2">
                            <div class="col-6"><label for="editar_precio_compra_variacion" class="form-label">Costo sin impuesto</label><input type="number" id="editar_precio_compra_variacion" class="form-control form-control-sm" min="0" step="0.01" required></div>
                            <div class="col-6"><label for="editar_precio_venta_variacion" class="form-label">Precio de venta</label><input type="number" id="editar_precio_venta_variacion" class="form-control form-control-sm" min="0" step="0.01" required></div>
                            <div class="col-12"><label for="editar_modo_precio_variacion" class="form-label">El precio ingresado</label><select id="editar_modo_precio_variacion" class="form-select form-select-sm"><option value="base">Es antes del impuesto</option><option value="incluido">Ya incluye el impuesto</option></select><small class="text-muted">Facturación guardará el precio base y aplicará el impuesto del producto.</small></div>
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


