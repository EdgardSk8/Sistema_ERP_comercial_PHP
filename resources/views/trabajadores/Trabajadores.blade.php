<turbo-frame id="contenido-dinamico">
    @vite(['resources/css/trabajadores/Trabajadores.css'])

    <section class="trabajadores-page">
        <div class="trabajadores-toolbar">
            <div class="trabajadores-toolbar__info">
                <h4 class="trabajadores-toolbar__titulo">Trabajadores</h4>
                <span class="trabajadores-toolbar__sub">Solicitudes de repartidores de la tienda</span>
            </div>

            <div class="trabajadores-resumen">
                <button type="button" class="trabajadores-chip is-activo" data-estado="todas">
                    <span>Total</span>
                    <strong id="resumenTrabajadoresTotal">0</strong>
                </button>
                <button type="button" class="trabajadores-chip trabajadores-chip--pendiente" data-estado="pendiente">
                    <span>Pendientes</span>
                    <strong id="resumenTrabajadoresPendientes">0</strong>
                </button>
                <button type="button" class="trabajadores-chip trabajadores-chip--aprobado" data-estado="aprobado">
                    <span>Aprobados</span>
                    <strong id="resumenTrabajadoresAprobados">0</strong>
                </button>
                <button type="button" class="trabajadores-chip trabajadores-chip--rechazado" data-estado="rechazado">
                    <span>Rechazados</span>
                    <strong id="resumenTrabajadoresRechazados">0</strong>
                </button>
                <button type="button" class="trabajadores-chip trabajadores-chip--suspendido" data-estado="suspendido">
                    <span>Suspendidos</span>
                    <strong id="resumenTrabajadoresSuspendidos">0</strong>
                </button>
            </div>

            <div class="trabajadores-filtros">
                <label for="filtroEstadoTrabajador" class="visually-hidden">Estado</label>
                <select id="filtroEstadoTrabajador" class="form-select form-select-sm">
                    <option value="todas">Todos los estados</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="aprobado">Aprobados</option>
                    <option value="rechazado">Rechazados</option>
                    <option value="suspendido">Suspendidos</option>
                </select>

                <div class="trabajadores-busqueda">
                    <input type="search" id="buscarTrabajador" class="form-control form-control-sm"
                        placeholder="Buscar nombre, cédula, placa o teléfono" aria-label="Buscar trabajador">
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="recargarTrabajadores"
                        title="Actualizar" aria-label="Actualizar trabajadores">
                        <i class="ph ph-arrows-clockwise"></i>
                    </button>
                </div>
            </div>
        </div>

        <div class="table-responsive trabajadores-tabla-wrap">
            <table class="table table-sm table-hover align-middle mb-0" id="tablaTrabajadores">
                <thead>
                    <tr>
                        <th class="trabajadores-col-foto">Foto</th>
                        <th>Trabajador</th>
                        <th>Contacto</th>
                        <th>Vehículo</th>
                        <th>Documentos</th>
                        <th class="text-center">Comisión</th>
                        <th>Estado</th>
                        <th>Solicitud</th>
                        <th class="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>

        <p class="trabajadores-vacio" id="trabajadoresVacio" hidden>
            <i class="ph ph-motorcycle"></i>
            No hay solicitudes de trabajadores con esos filtros.
        </p>
    </section>

    <div class="modal fade" id="modalArqueoTrabajador" tabindex="-1" aria-labelledby="modalArqueoTrabajadorTitulo" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalArqueoTrabajadorTitulo">Arqueo del repartidor</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>

                <div class="modal-body">
                    <div class="trabajadores-arqueo__filtros">
                        <label for="arqueoErpDesde">
                            <span>Desde</span>
                            <input type="date" id="arqueoErpDesde" class="form-control form-control-sm">
                        </label>
                        <label for="arqueoErpHasta">
                            <span>Hasta</span>
                            <input type="date" id="arqueoErpHasta" class="form-control form-control-sm">
                        </label>
                        <button type="button" class="btn btn-sm btn-outline-success" id="btnFiltrarArqueoErp">
                            <i class="ph ph-funnel"></i> Ver
                        </button>
                    </div>

                    <div id="trabajadorArqueoErpDetalle">
                        <p class="trabajadores-sub">Selecciona un repartidor para ver su arqueo.</p>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalTrabajador" tabindex="-1" aria-labelledby="modalTrabajadorTitulo" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalTrabajadorTitulo">Solicitud de trabajador</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>

                <div class="modal-body">
                    <div id="trabajadorDetalleInfo"></div>

                    <form id="formTrabajadorErp" class="trabajadores-editor">
                        <input type="hidden" id="trabajadorId">

                        <div class="row g-3">
                            <div class="col-md-4">
                                <label class="form-label" for="trabajadorEstado">Estado</label>
                                <select id="trabajadorEstado" class="form-select">
                                    <option value="pendiente">Pendiente</option>
                                    <option value="aprobado">Aprobado</option>
                                    <option value="rechazado">Rechazado</option>
                                    <option value="suspendido">Suspendido</option>
                                </select>
                            </div>

                            <div class="col-md-4">
                                <label class="form-label" for="trabajadorComision">% que retiene la tienda</label>
                                <input type="number" id="trabajadorComision" class="form-control" min="0" max="100" step="0.01">
                                <div class="form-text">Este porcentaje es individual para cada trabajador.</div>
                            </div>

                            <div class="col-md-4">
                                <label class="form-label">Disponibilidad</label>
                                <div class="trabajadores-disponible" id="trabajadorDisponible">—</div>
                            </div>

                            <div class="col-12" id="trabajadorMotivoWrap">
                                <label class="form-label" for="trabajadorMotivo">Motivo del rechazo</label>
                                <textarea id="trabajadorMotivo" class="form-control" rows="2" maxlength="2000"
                                    placeholder="Explica al trabajador por qué se rechaza la solicitud"></textarea>
                            </div>

                            <div class="col-12">
                                <label class="form-label" for="trabajadorNota">Nota interna</label>
                                <textarea id="trabajadorNota" class="form-control" rows="2" maxlength="2000"
                                    placeholder="Solo la verá el personal del ERP"></textarea>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-danger me-auto" id="btnEliminarTrabajador">
                        <i class="ph ph-trash"></i> Eliminar solicitud
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    <button type="button" class="btn btn-primary" id="btnGuardarTrabajador">
                        <i class="ph ph-floppy-disk"></i> Guardar cambios
                    </button>
                </div>
            </div>
        </div>
    </div>
</turbo-frame>
