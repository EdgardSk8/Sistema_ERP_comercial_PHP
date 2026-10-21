<div class="modal fade" id="modalEditarCategoria" tabindex="-1">

    <div class="modal-dialog modal-dialog-centered">

        <div class="modal-content">

            <div class="modal-header">

                <h5 class="modal-title">Editar Categoría</h5>

                <button 
                    class="btn-close" 
                    data-bs-dismiss="modal">
                </button>

            </div>


            <div class="modal-body">

                <div class="card-responsive">

                    <form id="formEditarCategoria" class="row g-3">

                        <input 
                            type="hidden" 
                            id="editar_id_categoria">


                        <div class="col-12">

                            <label class="form-label">
                                Nombre de la Categoría
                            </label>

                            <input
                                id="editar_nombre_categoria"
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
                                id="editar_descripcion_categoria"
                                class="form-control form-control-sm"
                                placeholder="Descripción de la Categoría"
                                maxlength="150"
                                rows="1"></textarea>

                        </div>


                        <div class="col-md-6">

                            <label class="form-label">
                                Estado
                            </label>

                            <select
                                id="editar_estado_categoria"
                                class="form-select form-select-sm">

                                <option value="1">
                                    Activo
                                </option>

                                <option value="0">
                                    Inactivo
                                </option>

                            </select>

                        </div>


                        <div class="col-md-6">

                            <label class="form-label">
                                Fecha de Creación
                            </label>

                            <input
                                id="editar_fecha_creacion_categoria"
                                type="text"
                                class="form-control form-control-sm"
                                disabled>

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
                    id="btnActualizarCategoria"
                    type="button"
                    class="btn actualizar btn-sm-modal">
                    Actualizar
                </button>

            </div>


        </div>

    </div>

</div>