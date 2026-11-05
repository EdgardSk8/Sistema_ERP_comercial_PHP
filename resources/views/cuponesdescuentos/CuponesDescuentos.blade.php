<turbo-frame id="contenido-dinamico">
    @vite(['resources/css/cuponesdescuentos/CuponesDescuentos.css'])

    @include('cuponesdescuentos.CheckColumnasCupones')

    <section class="cupones-page">
        <div class="cupones-toolbar">
            <div class="cupones-toolbar-info">
                <h4 class="cupones-toolbar-titulo">Cupones y descuentos</h4>
                <span class="cupones-toolbar-sub">Cupones de la tienda, fidelidad y descuentos vigentes</span>
            </div>

            <div class="cupones-toolbar-resumen">
                <button type="button" class="cupones-chip is-activo" data-filtro="todos">
                    <span>Total</span>
                    <strong id="resumenCuponesTotal">0</strong>
                </button>
                <button type="button" class="cupones-chip" data-filtro="activos">
                    <span>Activos</span>
                    <strong id="resumenCuponesActivos">0</strong>
                </button>
                <button type="button" class="cupones-chip" data-filtro="fidelidad">
                    <span>Fidelidad</span>
                    <strong id="resumenCuponesFidelidad">0</strong>
                </button>
                <button type="button" class="cupones-chip" data-filtro="usados">
                    <span>Usados</span>
                    <strong id="resumenCuponesUsados">0</strong>
                </button>
            </div>
        </div>

        <div class="cupones-descuentos">
            <article class="cupones-descuento-card">
                <span class="cupones-descuento-card__icono"><i class="ph ph-gift"></i></span>
                <div class="cupones-descuento-card__texto">
                    <strong>Descuento de bienvenida</strong>
                    <span>10% en zapatos · primera compra</span>
                </div>
                <div class="cupones-descuento-card__valores">
                    <div><strong id="bienvenidaDisponibles">0</strong><small>disponibles</small></div>
                    <div><strong id="bienvenidaUsados">0</strong><small>usados</small></div>
                </div>
            </article>

            <article class="cupones-descuento-card">
                <span class="cupones-descuento-card__icono"><i class="ph ph-ticket"></i></span>
                <div class="cupones-descuento-card__texto">
                    <strong>Fidelidad</strong>
                    <span>10% por par · cupón cada 10 pares</span>
                </div>
                <div class="cupones-descuento-card__valores">
                    <div><strong id="fidelidadCupones">0</strong><small>cupones</small></div>
                    <div><strong id="cuponesAsignaciones">0</strong><small>asignaciones</small></div>
                </div>
            </article>

            <article class="cupones-descuento-card">
                <span class="cupones-descuento-card__icono"><i class="ph ph-megaphone"></i></span>
                <div class="cupones-descuento-card__texto">
                    <strong>Promociones</strong>
                    <span>Descuentos por producto</span>
                </div>
                <div class="cupones-descuento-card__valores">
                    <div><strong id="promocionesActivas">0</strong><small>activas</small></div>
                </div>
            </article>
        </div>

        <div class="card cupones-tabla-card">
            <table id="tablaCupones" class="table table-hover align-middle">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Valor</th>
                        <th>Categoría</th>
                        <th>Usos</th>
                        <th>Vigencia</th>
                        <th>Estado</th>
                        <th>Clientes</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </section>

    <div class="modal fade cupones-modal" id="modalDetalleCupon" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="tituloDetalleCupon">Cupón</h5>
                    <div class="d-flex align-items-center gap-2">
                        <button type="button" class="cupones-btn cupones-btn--primario cupones-btn--sm" id="btnAsignarClientes">
                            <i class="ph ph-user-plus"></i> Asignar clientes
                        </button>
                        <button type="button" class="btn-close m-0" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                </div>

                <div class="modal-body">
                    <div class="cupones-detalle">
                        <div class="cupones-detalle__dato"><span>Código</span><strong id="detalleCuponCodigo">—</strong></div>
                        <div class="cupones-detalle__dato"><span>Nombre</span><strong id="detalleCuponNombre">—</strong></div>
                        <div class="cupones-detalle__dato"><span>Origen</span><strong id="detalleCuponOrigen">—</strong></div>
                        <div class="cupones-detalle__dato"><span>Tipo</span><strong id="detalleCuponTipo">—</strong></div>
                        <div class="cupones-detalle__dato"><span>Valor</span><strong id="detalleCuponValor">—</strong></div>
                        <div class="cupones-detalle__dato"><span>Categoría</span><strong id="detalleCuponCategoria">—</strong></div>
                        <div class="cupones-detalle__dato"><span>Usos</span><strong id="detalleCuponUsos">—</strong></div>
                        <div class="cupones-detalle__dato"><span>Estado</span><strong id="detalleCuponEstado">—</strong></div>

                        <div class="cupones-detalle__dato cupones-detalle__dato--ancho"><span>Vigencia</span><strong id="detalleCuponVigencia">—</strong></div>

                        <p class="cupones-detalle__descripcion" id="detalleCuponDescripcion"></p>
                    </div>

                    <h6 class="cupones-detalle__subtitulo">Clientes asignados</h6>

                    <div class="table-responsive">
                        <table class="table table-sm align-middle">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Correo</th>
                                    <th>Estado</th>
                                    <th>Fecha de uso</th>
                                </tr>
                            </thead>
                            <tbody id="detalleCuponClientes"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade cupones-modal" id="modalCupon" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="tituloModalCupon">Nuevo cupón</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>

                <form id="formCupon" novalidate>
                    <div class="modal-body">
                        <div class="cupones-form">
                            <div class="cupones-form__campo">
                                <label class="form-label" for="cuponCodigo">Código</label>
                                <input type="text" id="cuponCodigo" class="form-control form-control-sm"
                                       maxlength="40" placeholder="Ej. PAREJAS20" autocomplete="off">
                            </div>

                            <div class="cupones-form__campo">
                                <label class="form-label" for="cuponNombre">Nombre</label>
                                <input type="text" id="cuponNombre" class="form-control form-control-sm"
                                       maxlength="120" placeholder="Ej. Cupón parejas">
                            </div>

                            <div class="cupones-form__campo">
                                <label class="form-label" for="cuponTipo">Tipo</label>
                                <select id="cuponTipo" class="form-select form-select-sm">
                                    <option value="porcentaje">Porcentaje</option>
                                    <option value="monto">Monto fijo</option>
                                </select>
                            </div>

                            <div class="cupones-form__campo">
                                <label class="form-label" for="cuponValor">Valor</label>
                                <input type="number" id="cuponValor" class="form-control form-control-sm"
                                       min="0.01" step="0.01" placeholder="0.00">
                            </div>

                            <div class="cupones-form__campo">
                                <label class="form-label" for="cuponCategoria">Categoría</label>
                                <select id="cuponCategoria" class="form-select form-select-sm">
                                    <option value="">Todas las categorías</option>
                                </select>
                            </div>

                            <div class="cupones-form__campo">
                                <label class="form-label" for="cuponUsos">Usos máximos</label>
                                <input type="number" id="cuponUsos" class="form-control form-control-sm"
                                       min="1" step="1" value="100">
                            </div>

                            <div class="cupones-form__campo">
                                <label class="form-label" for="cuponInicio">Inicio</label>
                                <input type="text" id="cuponInicio" class="form-control form-control-sm"
                                       placeholder="Hoy" autocomplete="off">
                            </div>

                            <div class="cupones-form__campo">
                                <label class="form-label" for="cuponFin">Fin</label>
                                <input type="text" id="cuponFin" class="form-control form-control-sm"
                                       placeholder="Opcional" autocomplete="off">
                            </div>

                            <div class="cupones-form__campo cupones-form__campo--ancho">
                                <label class="form-label" for="cuponDescripcion">Descripción</label>
                                <input type="text" id="cuponDescripcion" class="form-control form-control-sm"
                                       maxlength="255" placeholder="Opcional">
                            </div>

                            <div class="cupones-form__estado">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" role="switch" id="cuponEstado" checked>
                                    <label class="form-check-label" for="cuponEstado">Cupón activo</label>
                                </div>
                                <div id="errorFormCupon" class="cupones-form__error" role="alert"></div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="cupones-btn cupones-btn--secundario" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="cupones-btn cupones-btn--primario" id="btnGuardarCupon">Guardar cupón</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade cupones-modal" id="modalAsignarClientes" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="tituloAsignarClientes">Asignar clientes</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>

                <div class="modal-body">
                    <div class="cupones-asignar">
                        <div class="cupones-asignar__barra">
                            <input type="search" id="buscarClienteCupon" class="form-control form-control-sm"
                                   placeholder="Buscar cliente o correo" aria-label="Buscar cliente">
                            <label class="cupones-asignar__todos" for="seleccionarTodosClientes">
                                <input class="form-check-input" type="checkbox" id="seleccionarTodosClientes">
                                <span>Todos</span>
                            </label>
                            <span class="cupones-asignar__nota">Los clientes que ya tienen el cupón aparecen marcados.</span>
                        </div>

                        <div class="cupones-clientes-lista" id="listaClientesCupon"></div>
                    </div>
                </div>

                <div class="modal-footer cupones-asignar__pie">
                    <span class="cupones-asignar__conteo" id="conteoClientesCupon">0 seleccionados</span>
                    <div class="d-flex gap-2">
                        <button type="button" class="cupones-btn cupones-btn--secundario" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="cupones-btn cupones-btn--primario" id="btnConfirmarAsignacion">Asignar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</turbo-frame>
