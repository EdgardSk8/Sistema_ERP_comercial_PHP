<div class="modal fade"
     id="modalCrearVariacionImagen"
     tabindex="-1"
     aria-hidden="true">

    <div class="modal-dialog modal-dialog-centered">

        <div class="modal-content">

            <div class="modal-header">

                <h5 class="modal-title">
                    Agregar Imagen
                </h5>

                <button type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close">
                </button>

            </div>

            <form id="formCrearVariacionImagen" enctype="multipart/form-data">

                @csrf

                <div class="modal-body">

                    <input type="hidden"
                        id="crear_id_variacion"
                        name="id_variacion">

                    <div class="row g-3">

                        <div class="col-12">

                            <label for="crear_imagen" class="form-label">
                                Imagen
                            </label>

                            <input type="file"
                                class="form-control form-control-sm"
                                id="crear_imagen"
                                name="imagen"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                required>
                            <img id="crear_preview_imagen"
                                class="img-thumbnail mt-2 d-none d-block mx-auto"
                                alt="Vista previa de la imagen seleccionada"
                                style="max-height: 120px;">

                        </div>

                        <div class="col-12">

                            <label for="crear_orden" class="form-label">
                                Orden
                            </label>

                            <input type="number"
                                class="form-control form-control-sm"
                                id="crear_orden"
                                name="orden"
                                min="0"
                                value="0"
                                readonly
                                required>

                        </div>

                    </div>

                </div>

                <div class="modal-footer">

                    <button type="button"
                            class="btn cancelar btn-sm-modal"
                            data-bs-dismiss="modal">
                        Cancelar
                    </button>

                    <button type="submit"
                            class="btn actualizar btn-sm-modal">
                        Guardar
                    </button>

                </div>

            </form>

        </div>

    </div>

</div>
