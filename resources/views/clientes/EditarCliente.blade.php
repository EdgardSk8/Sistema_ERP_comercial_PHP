<div class="modal fade" id="modalEditarCliente" tabindex="-1">

    <div class="modal-dialog modal-dialog-centered">

        <div class="modal-content">

            <div class="modal-header">
                <h5 class="modal-title">Editar Cliente</h5>
                <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">

                <div class="card-responsive">

                    <form id="formEditarCliente" class="row g-3">

                        <input type="hidden" id="editar_id_cliente">

                        <div class="col-12">
                            <label class="form-label">Nombre del Cliente</label>
                            <input
                                id="editar_nombre_cliente"
                                type="text"
                                class="form-control form-control-sm"
                                placeholder="Nombre del Cliente"
                                maxlength="150"
                                required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Cédula</label>
                            <input
                                id="editar_cedula_cliente"
                                type="text"
                                class="form-control form-control-sm"
                                placeholder="000-000000-0000A"
                                maxlength="16">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">RUC</label>
                            <input
                                id="editar_ruc_cliente"
                                type="text"
                                class="form-control form-control-sm"
                                placeholder="RUC del Cliente"
                                maxlength="20">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Teléfono</label>
                            <input
                                id="editar_telefono_cliente"
                                type="text"
                                class="form-control form-control-sm"
                                placeholder="Teléfono del Cliente"
                                maxlength="20">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Correo</label>
                            <input
                                id="editar_correo_cliente"
                                type="email"
                                class="form-control form-control-sm"
                                placeholder="Correo del Cliente"
                                maxlength="100">
                        </div>

                        <div class="col-12">
                            <label class="form-label">Dirección</label>
                            <input
                                id="editar_direccion_cliente"
                                type="text"
                                class="form-control form-control-sm"
                                placeholder="Dirección del Cliente"
                                maxlength="200">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Fecha de nacimiento</label>
                            <input
                                id="editar_fecha_nacimiento_cliente"
                                type="date"
                                class="form-control form-control-sm">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Usuario web</label>
                            <input
                                id="editar_usuario_cliente"
                                type="text"
                                class="form-control form-control-sm"
                                placeholder="Usuario para la tienda"
                                maxlength="60"
                                autocomplete="off">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Nueva contraseña web</label>
                            <input
                                id="editar_password_cliente"
                                type="password"
                                class="form-control form-control-sm"
                                placeholder="Dejar vacío para no cambiar"
                                autocomplete="new-password">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Tipo de descuento</label>
                            <select id="editar_descuento_tipo_cliente" class="form-select form-select-sm">
                                <option value="">Sin descuento</option>
                                <option value="porcentaje">Porcentaje (%)</option>
                                <option value="monto">Monto fijo (C$)</option>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Valor del descuento</label>
                            <input
                                id="editar_descuento_valor_cliente"
                                type="number"
                                class="form-control form-control-sm"
                                min="0"
                                step="0.01"
                                placeholder="0.00">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Estado</label>
                            <select
                                id="editar_estado_cliente"
                                class="form-select form-select-sm">

                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>

                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Fecha de Creación</label>
                            <input
                                id="editar_fecha_creacion_cliente"
                                type="datetime-local"
                                class="form-control form-control-sm"
                                disabled>
                        </div>

                    </form>

                </div>

            </div>

            <div class="modal-footer">

                <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">
                    Cancelar
                </button>

                <button
                    id="btnActualizarCliente"
                    type="button"
                    class="btn actualizar btn-sm-modal">
                    Actualizar
                </button>

            </div>

        </div>

    </div>

</div>

