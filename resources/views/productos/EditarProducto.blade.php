<div class="modal fade" id="modalEditarProducto" tabindex="-1" aria-hidden="true">

    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">

        <div class="modal-content">

            <!-- HEADER -->
            <div class="modal-header d-flex justify-content-between align-items-center">

                <h5 class="modal-title">
                    Editar Producto
                </h5>

                <div class="d-flex align-items-center gap-2">

                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>

                </div>

            </div>

            <!-- BODY -->
            <div class="modal-body">

                <div class="card-responsive">

                    <form id="formEditarProducto" class="row g-2">

                        <!-- ID -->
                        <input type="hidden" id="editar_id_producto">

                        <!-- ================= DATOS GENERALES ================= -->

                        <div class="col-md-6">
                            <label class="form-label">Nombre del Producto</label>
                            <input type="text"
                                   id="editar_nombre_producto"
                                   class="form-control form-control-sm"
                                   placeholder="Nombre del producto"
                                   maxlength="100"
                                   required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Descripción</label>
                            <textarea id="editar_descripcion_producto"
                              class="form-control form-control-sm"
                              placeholder="Descripción del producto"
                              maxlength="150"
                              rows="1"></textarea>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Categoría</label>
                            <select id="editar_id_categoria" class="form-select form-select-sm">
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Medida</label>
                            <select id="editar_medida_producto" class="form-select form-select-sm">
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Ubicación</label>
                            <select id="editar_id_ubicacion" class="form-select form-select-sm">
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Impuesto</label>
                            <select id="editar_id_impuesto"
                                    class="form-select form-select-sm"
                                    required>
                            </select>
                        </div>

                        <!-- ================= PRECIOS ================= -->

                        <div class="col-md-3">
                            <label class="form-label">Precio Compra</label>
                            <input type="number"
                                   id="editar_precio_compra"
                                   class="form-control form-control-sm"
                                   placeholder="100.65"
                                   step="0.01"
                                   required>
                        </div>

                        <div class="col-md-3 d-flex flex-column justify-content-end">

                            <div class="form-check mb-2">

                                <input class="form-check-input"
                                       type="checkbox"
                                       id="editar_check_venta">

                                <label class="form-check-label small"
                                       for="editar_check_venta">
                                    % Venta
                                </label>

                            </div>

                            <div class="form-check">

                                <input class="form-check-input"
                                       type="checkbox"
                                       id="editar_redondeo_venta">

                                <label class="form-check-label small"
                                       for="editar_redondeo_venta">
                                    Redondeo
                                </label>

                            </div>

                        </div>

                        <div class="col-md-3">
                            <label class="form-label">% Venta</label>
                            <input type="number"
                                   id="editar_porcentaje_venta"
                                   class="form-control form-control-sm"
                                   placeholder="25"
                                   step="0.1">
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Precio Venta</label>
                            <input type="number"
                                   id="editar_precio_venta"
                                   class="form-control form-control-sm"
                                   placeholder="100.65"
                                   step="0.01"
                                   required>
                        </div>

                        <div class="col-md-3">
                          <label class="form-label">Ganancia</label>
                          <input type="number"
                                id="editar_ganancia_producto"
                                class="form-control form-control-sm"
                                placeholder="0.00"
                                step="0.01"
                                readonly>
                      </div>

                        <div class="col-md-3">
                            <label class="form-label">Precio Total (+IVA)</label>
                            <input type="number"
                                   id="editar_precio_venta_TOTAL"
                                   class="form-control form-control-sm"
                                   placeholder="126">
                        </div>

                        <div class="col-md-1">
                            <label class="form-label">Stock</label>
                            <input type="text"
                              id="editar_stock_actual"
                              class="form-control form-control-sm text-center"
                              readonly>
                        </div>

                        <div class="col-md-2">
                            <label class="form-label">Ajuste</label>
                            <input type="number"
                              id="ajustar_stock_actual"
                              class="form-control form-control-sm text-center fw-bold">
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Motivo</label>

                            <select id="editar_stock_motivo"
                                    class="form-select form-select-sm"
                                    required
                                    disabled>

                                <!-- 🔴 DISMINUCIONES -->
                                <optgroup label="Disminución de inventario">
                                    <option value="Producto dañado">Producto dañado</option>
                                    <option value="Producto vencido">Producto vencido</option>
                                    <option value="Pérdida / Extraviado">Pérdida / Extraviado</option>
                                    <option value="Consumo interno">Consumo interno</option>
                                    <option value="Error de inventario">Error de inventario</option>
                                    <option value="Robo">Robo</option>
                                </optgroup>

                                <!-- 🟢 AUMENTOS -->
                                <optgroup label="Aumento de inventario">
                                    <option value="Producto encontrado">Producto encontrado</option>
                                    <option value="Sobrante de inventario">Sobrante de inventario</option>
                                    <option value="Devolución no registrada">Devolución no registrada</option>
                                    <option value="Ingreso no registrado">Ingreso no registrado</option>
                                </optgroup>

                            </select>
                        </div>

                        <!-- ================= IMAGEN ================= -->

                        <div class="col-md-4">
                            <label class="form-label">Imagen del Producto</label>
                            <input type="file" id="editar_imagen_producto" class="form-control form-control-sm" accept="image/*">
                        </div>

                        <div class=" text-center justify-content-center">
                            <!-- <label class="form-label"> Vista previa </label> -->
                            <img id="preview_editar_imagen_producto" src="" alt="Sin imagen del producto" class="img-thumbnail d-none" style="max-height:120px;">
                        </div>

                    </form>

                </div>

            </div>

            <!-- FOOTER -->
            <div class="modal-footer d-flex justify-content-end">

                <div class="d-flex gap-2">
                    <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal"> Cancelar </button>
                    <button type="button" class="btn guardar btn-sm-modal" id="btnActualizarProducto"> Actualizar </button>
                </div>

            </div>

        </div>

    </div>

</div>

<div class="modal fade" id="modalDistribuirAjusteVariacion" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Distribuir la baja por talla</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
                <p class="mb-2">
                    Se retirarán <strong id="cantidadTotalAjusteVariacion">0</strong> unidades.
                    Indica de qué tallas salen.
                </p>
                <div class="table-responsive">
                    <table class="table table-sm align-middle">
                        <thead>
                            <tr>
                                <th>Color</th>
                                <th>Talla</th>
                                <th>SKU</th>
                                <th>Disponible</th>
                                <th>Retirar</th>
                            </tr>
                        </thead>
                        <tbody id="filasAjusteStockVariacion"></tbody>
                    </table>
                </div>
                <div id="resumenAjusteStockVariacion" class="small text-muted" aria-live="polite"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn actualizar btn-sm-modal" id="btnConfirmarAjusteVariacion" disabled>
                    Confirmar baja
                </button>
            </div>
        </div>
    </div>
</div>