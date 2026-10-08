<div class="modal fade" id="modalCrearProductoVariacion" tabindex="-1" aria-hidden="true">

    <div class="modal-dialog modal-dialog-centered">

        <div class="modal-content">

            <form id="formCrearProductoVariacion">

                @csrf

                <div class="modal-header">
                    <h5 class="modal-title">Crear Variación</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">

                    <div class="row g-3">

                        <div class="col-12">
                            <label for="crear_id_producto" class="form-label">
                                Producto
                            </label>

                            <select
                                id="crear_id_producto"
                                name="id_producto"
                                class="form-select form-select-sm"
                                required>
                                <option value="">Seleccione un producto</option>
                            </select>
                        </div>

                        <div class="col-12">
                            <label for="crear_color" class="form-label">
                                Color
                            </label>

                            <input
                                type="text"
                                id="crear_color"
                                name="color"
                                class="form-control form-control-sm"
                                maxlength="100"
                                required>
                        </div>

                    </div>

                </div>

                <div class="modal-footer">

                    <button
                        type="button"
                        class="btn cancelar btn-sm-modal"
                        data-bs-dismiss="modal">
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="btn actualizar btn-sm-modal">
                        Guardar
                    </button>

                </div>

            </form>

        </div>

    </div>

</div>
