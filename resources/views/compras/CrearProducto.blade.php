<div class="modal fade" id="modalCrearProducto" tabindex="-1" aria-hidden="true">

    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">

        <div class="modal-content">

            <!-- HEADER -->
            <div class="modal-header d-flex justify-content-between align-items-center">

                <h5 class="modal-title">
                    Crear Producto
                </h5>

                <div class="d-flex align-items-center gap-2">
                    <button type="button"
                            class="btn-close"
                            data-bs-dismiss="modal">
                    </button>
                </div>

            </div>

            <!-- BODY -->
            <div class="modal-body">

                <div class="card-responsive">

                    <form id="formCrearProducto" class="row g-3">

                        <!-- ================= DATOS GENERALES ================= -->

                        <div class="col-md-6">
                            <label class="form-label">Nombre del Producto</label>
                            <input type="text"
                                   id="crear_nombre_producto"
                                   class="form-control form-control-sm"
                                   placeholder="Nombre del producto"
                                   maxlength="100"
                                   required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Descripción</label>
                            <textarea id="crear_descripcion_producto"
                                      class="form-control form-control-sm"
                                      placeholder="Descripción del producto"
                                      maxlength="150"
                                      rows="1"></textarea>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Categoría</label>
                            <select id="crear_id_categoria"
                                    class="form-select form-select-sm"
                                    required>
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Marca</label>
                            <select id="crear_id_marca"
                                    class="form-select form-select-sm">
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Medida</label>
                            <select id="crear_medida_producto"
                                    class="form-select form-select-sm">
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Ubicación</label>
                            <select id="crear_id_ubicacion"
                                    class="form-select form-select-sm"
                                    required>
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Impuesto</label>
                            <select id="crear_id_impuesto"
                                    class="form-select form-select-sm"
                                    required>
                            </select>
                        </div>

                        <!-- ================= ATRIBUTOS ================= -->

                        <div class="col-12">
                            <label class="form-label">Atributos</label>
                            <div class="row g-2" id="crear_atributos_producto"></div>
                        </div>

                        <!-- ================= PRECIOS ================= -->

                        <div class="col-md-3">
                            <label class="form-label">Precio Compra</label>
                            <input type="number"
                                   id="crear_precio_compra"
                                   class="form-control form-control-sm"
                                   placeholder="100.65"
                                   step="0.01"
                                   min="0"
                                   required>
                        </div>

                        <div class="col-md-3 d-flex flex-column justify-content-end">

                            <div class="form-check mb-2">

                                <input class="form-check-input"
                                       type="checkbox"
                                       id="crear_check_venta">

                                <label class="form-check-label small"
                                       for="crear_check_venta">
                                    % Venta
                                </label>

                            </div>

                            <div class="form-check">

                                <input class="form-check-input"
                                       type="checkbox"
                                       id="crear_redondeo_venta">

                                <label class="form-check-label small"
                                       for="crear_redondeo_venta">
                                    Redondeo
                                </label>

                            </div>

                        </div>

                        <div class="col-md-3">
                            <label class="form-label">% Venta</label>
                            <input type="number"
                                   id="crear_porcentaje_venta"
                                   class="form-control form-control-sm"
                                   placeholder="25"
                                   step="0.1"
                                   min="0">
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Precio Venta</label>
                            <input type="number"
                                   id="crear_precio_venta"
                                   class="form-control form-control-sm"
                                   placeholder="100.65"
                                   step="0.01"
                                   min="0"
                                   required>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Ganancia</label>
                            <input type="number"
                                   id="crear_ganancia_producto"
                                   class="form-control form-control-sm"
                                   placeholder="0.00"
                                   step="0.01"
                                   readonly>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Precio Total (+IVA)</label>
                            <input type="number"
                                   id="crear_precio_venta_TOTAL"
                                   class="form-control form-control-sm"
                                   placeholder="126"
                                   min="0">
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Cantidad Inicial</label>
                            <input type="number"
                                   id="crear_stock_actual"
                                   class="form-control form-control-sm"
                                   placeholder="50"
                                   min="0"
                                   required>
                        </div>

                        <!-- ================= IMAGEN ================= -->

                        <div class="col-md-5">
                            <label class="form-label">Imagen del Producto</label>
                            <input type="file"
                                   id="crear_imagen_producto"
                                   class="form-control form-control-sm"
                                   accept="image/*">
                        </div>

                        <div class="text-center justify-content-center">
                            <img id="preview_imagen_producto"
                                 src=""
                                 alt="Vista previa"
                                 class="img-thumbnail d-none"
                                 style="max-height:120px;">
                        </div>

                    </form>

                </div>

            </div>

            <!-- FOOTER -->
            <div class="modal-footer d-flex justify-content-end">

                <div class="d-flex gap-2">
                    <button type="button"
                            class="btn cancelar btn-sm-modal"
                            data-bs-dismiss="modal">
                        Cancelar
                    </button>

                    <button type="button"
                            class="btn guardar btn-sm-modal"
                            id="btnGuardarProducto">
                        Guardar
                    </button>
                </div>

            </div>

        </div>

    </div>

</div>