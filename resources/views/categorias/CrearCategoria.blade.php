<div class="modal fade" id="modalCrearCategoria" tabindex="-1">

    <div class="modal-dialog modal-dialog-centered">

        <div class="modal-content">

            <div class="modal-header">

                <h5 class="modal-title">Crear Categoría</h5>

                <button 
                    class="btn-close" 
                    data-bs-dismiss="modal">
                </button>

            </div>

            <div class="modal-body">

                <div class="card-responsive">

                    <form id="formCrearCategoria" class="row g-3" novalidate>

                        <div class="col-12">

                            <label class="form-label">
                                Nombre de la Categoría
                            </label>

                            <input
                                id="crear_nombre_categoria"
                                type="text"
                                class="form-control form-control-sm"
                                placeholder="Nombre de la Categoría"
                                maxlength="100"
                                required>

                        </div>


                        <div class="col-12">

                            <label class="form-label">
                                Descripción
                            </label>

                            <textarea
                                id="crear_descripcion_categoria"
                                type="text"
                                rows="1"
                                class="form-control form-control-sm"
                                placeholder="Descripción de la Categoría"
                                maxlength="150"></textarea>

                        </div>

                    </form>

                </div>

            </div>


            <div class="modal-footer">

                <button 
                    class="btn cancelar btn-sm-modal" 
                    data-bs-dismiss="modal">
                    Cancelar
                </button>

                <button
                    id="btnGuardarCategoria"
                    type="submit"
                    form="formCrearCategoria"
                    class="btn guardar btn-sm-modal">
                    Guardar
                </button>

            </div>


        </div>

    </div>

</div>