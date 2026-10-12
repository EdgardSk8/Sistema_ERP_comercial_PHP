<turbo-frame id="contenido-dinamico">

    <!-- ╔════════════ CARD ════════════╗ -->
    <!-- ╚══════════════════════════════╝ -->

    <div class="card h-auto">

        <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Configuración de la Empresa</h6>

            <div class="credenciales-header-actions">
                <span class="credenciales-version" aria-label="Versión de la aplicación">Versión 1.0.0</span>
                <button class="btn guardar btn-sm-modal" id="btnEditar">
                    Editar
                </button>
            </div>
        </div>

        <div class="card-body">

            <div class="card-responsive">

                <div class="row g-2">

                    <div class="col-md-6">
                        <strong>Nombre:</strong>
                        <span id="nombre_empresa"></span>
                    </div>

                    <div class="col-md-6">
                        <strong>RUC:</strong>
                        <span id="ruc_empresa"></span>
                    </div>

                    <div class="col-md-6">
                        <strong>Dirección:</strong>
                        <span id="direccion_empresa"></span>
                    </div>

                    <div class="col-md-6">
                        <strong>Teléfono:</strong>
                        <span id="telefono_empresa"></span>
                    </div>

                    <div class="col-md-6">
                        <strong>Correo:</strong>
                        <span id="correo_empresa"></span>
                    </div>

                    <div class="col-md-6">
                        <strong>Tasa de Cambio:</strong>
                        <span id="tipo_cambio"></span>
                    </div>

                    <div class="col-12">
                        <strong>Logo de la empresa:</strong>
                        <div class="credencial-logo-preview mt-2">
                            <img id="logoEmpresaActual" class="d-none" alt="Logo de la empresa">
                            <span id="sinLogoEmpresa" class="text-secondary">No hay un logo configurado.</span>
                        </div>
                        <div class="d-flex flex-wrap gap-2 mt-2">
                            <button type="button" class="btn btn-sm credencial-btn credencial-btn-logo" id="btnCambiarLogo">
                                <i class="bi bi-image me-1"></i>Seleccionar logo
                            </button>
                            <button type="button" class="btn btn-sm credencial-btn credencial-btn-eliminar d-none" id="btnEliminarLogo">
                                <i class="bi bi-trash me-1"></i>Eliminar logo
                            </button>
                        </div>
                    </div>

                </div>

            </div>

        </div>

    </div>
        

    @include('credenciales.EditarCredenciales')

    <div class="modal fade" id="modalLogoEmpresa" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Logo de la empresa</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <form id="formLogoEmpresa">
                        <input type="hidden" id="logo_id_empresa">
                        <label for="archivoLogoEmpresa" class="form-label">Imagen (JPG, PNG o WEBP; máximo 4 MB)</label>
                        <input type="file" id="archivoLogoEmpresa" class="form-control" accept="image/jpeg,image/png,image/webp" required>
                        <div class="credencial-logo-preview mt-3 d-none" id="contenedorPreviewLogo">
                            <img id="previewLogoEmpresa" alt="Vista previa del logo seleccionado">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn actualizar btn-sm-modal" id="btnGuardarLogo">Guardar logo</button>
                </div>
            </div>
        </div>
    </div>

</turbo-frame>
