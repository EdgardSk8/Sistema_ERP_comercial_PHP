<div class="modal fade"
     id="modalEditarVariacionImagen"
     tabindex="-1"
     aria-hidden="true">

    <div class="modal-dialog modal-dialog-centered">

        <div class="modal-content">

            <div class="modal-header">

                <h5 class="modal-title">
                    Editar Imagen
                </h5>

                <button type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close">
                </button>

            </div>

            <form id="formEditarVariacionImagen" enctype="multipart/form-data">

                @csrf

                <div class="modal-body">

                    <input type="hidden"
                        id="editar_id_imagen"
                        name="id_imagen">

                    <input type="hidden"
                        id="editar_id_variacion"
                        name="id_variacion">

                    <div class="row g-3">

                        <div class="col-12">

                            <label for="editar_imagen" class="form-label">
                                Imagen
                            </label>

                            <input type="file"
                                class="form-control form-control-sm"
                                id="editar_imagen"
                                name="imagen"
                                accept="image/jpeg,image/png,image/gif,image/webp">
                            <img id="editar_preview_imagen" class="img-thumbnail mt-2 d-none" alt="Imagen actual" style="max-height: 120px;">

                        </div>

                        <div class="col-12">

                            <label for="editar_orden" class="form-label">
                                Orden
                            </label>

                            <input type="number"
                                class="form-control form-control-sm"
                                id="editar_orden"
                                name="orden"
                                min="0"
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
                        Actualizar
                    </button>

                </div>

            </form>

        </div>

    </div>

</div>
