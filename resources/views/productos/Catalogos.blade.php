<turbo-frame id="contenido-dinamico">

    @include('catalogos._tabs', ['activo' => 'marcas'])


    <div class="row g-3">

        <!-- ══════════ MARCAS ══════════ -->

        <div class="col-lg-6">

            <div class="card p-3">

                <div class="d-flex justify-content-between align-items-center mb-2">

                    <h5 class="mb-0">Marcas</h5>

                    <button type="button" class="btn guardar btn-sm-modal" id="btnNuevaMarca">
                        Nueva marca
                    </button>

                </div>

                <table class="table table-sm align-middle" id="tablaMarcas">

                    <thead>
                        <tr>
                            <th>Marca</th>
                            <th>Productos</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody></tbody>

                </table>

            </div>

        </div>

        <!-- ══════════ ATRIBUTOS ══════════ -->

        <div class="col-lg-6">

            <div class="card p-3">

                <div class="d-flex justify-content-between align-items-center mb-2">

                    <h5 class="mb-0">Atributos</h5>

                    <button type="button" class="btn guardar btn-sm-modal" id="btnNuevoAtributo">
                        Nuevo atributo
                    </button>

                </div>

                <table class="table table-sm align-middle" id="tablaAtributos">

                    <thead>
                        <tr>
                            <th>Atributo</th>
                            <th>Valores</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody></tbody>

                </table>

            </div>

        </div>

    </div>

    <!-- ══════════ MODAL MARCA ══════════ -->

    <div class="modal fade" id="modalMarca" tabindex="-1" aria-hidden="true">

        <div class="modal-dialog modal-dialog-centered">

            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title" id="tituloModalMarca">Nueva marca</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">

                    <input type="hidden" id="marca_id">

                    <label class="form-label">Nombre de la marca</label>

                    <input type="text" id="marca_nombre" class="form-control form-control-sm"
                           placeholder="Ej. Nike" maxlength="100">

                </div>

                <div class="modal-footer">

                    <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn guardar btn-sm-modal" id="btnGuardarMarca">Guardar</button>

                </div>

            </div>

        </div>

    </div>

    <!-- ══════════ MODAL ATRIBUTO ══════════ -->

    <div class="modal fade" id="modalAtributo" tabindex="-1" aria-hidden="true">

        <div class="modal-dialog modal-dialog-centered">

            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title" id="tituloModalAtributo">Nuevo atributo</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">

                    <input type="hidden" id="atributo_id">

                    <div class="mb-2">

                        <label class="form-label">Nombre del atributo</label>

                        <input type="text" id="atributo_nombre" class="form-control form-control-sm"
                               placeholder="Ej. Género" maxlength="80">

                    </div>

                    <label class="form-label">Valores (separados por coma)</label>

                    <textarea id="atributo_valores" class="form-control form-control-sm" rows="2"
                              placeholder="Ej. Hombre, Mujer, Unisex"></textarea>

                </div>

                <div class="modal-footer">

                    <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn guardar btn-sm-modal" id="btnGuardarAtributo">Guardar</button>

                </div>

            </div>

        </div>

    </div>

</turbo-frame>
