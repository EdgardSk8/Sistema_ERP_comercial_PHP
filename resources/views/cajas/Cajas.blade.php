<turbo-frame id="contenido-dinamico">

    <link rel="stylesheet" href="{{ Vite::asset('resources/css/cajas/Cajas.css') }}">

    <section class="cajas-arqueo-page" aria-labelledby="tituloArqueos">
        <header class="cajas-arqueo-header">
            <div>
                <h2 id="tituloArqueos">Arqueo de cajas</h2>
                <p>Consulta sesiones, registra el efectivo contado y corrige arqueos.</p>
            </div>
            <button type="button" class="btn btn-primary btn-sm arqueo-btn-mini" id="btnImprimirArqueo">
                <i class="fa-solid fa-print" aria-hidden="true"></i>
                Imprimir periodo
            </button>
        </header>

        <div class="arqueo-filtros" role="group" aria-label="Filtrar cajas por fecha">
            <div>
                <label for="arqueoFechaInicio" class="form-label">Desde</label>
                <input type="text" class="form-control form-control-sm" id="arqueoFechaInicio" placeholder="Todas las fechas" autocomplete="off">
            </div>
            <div>
                <label for="arqueoFechaFin" class="form-label">Hasta</label>
                <input type="text" class="form-control form-control-sm" id="arqueoFechaFin" placeholder="Sin límite" autocomplete="off">
            </div>
            <button type="button" class="btn btn-success btn-sm arqueo-btn-mini" id="btnArqueoHoy">Hoy</button>
            <button type="button" class="btn btn-primary btn-sm arqueo-btn-mini" id="btnArqueoSemana">Esta semana</button>
            <button type="button" class="btn btn-danger btn-sm arqueo-btn-mini" id="btnLimpiarFiltros">
                <i class="fa-solid fa-eraser" aria-hidden="true"></i>
                Limpiar
            </button>
        </div>

        <div class="arqueo-resumen" aria-live="polite">
            <div class="arqueo-resumen-item">
                <span>Sesiones</span>
                <strong id="arqueoTotalCajas">0</strong>
            </div>
            <div class="arqueo-resumen-item">
                <span>Saldo teórico</span>
                <strong id="arqueoTotalTeorico">C$ 0.00</strong>
            </div>
            <div class="arqueo-resumen-item">
                <span>Efectivo contado</span>
                <strong id="arqueoTotalReal">C$ 0.00</strong>
            </div>
            <div class="arqueo-resumen-item">
                <span>Diferencia neta</span>
                <strong id="arqueoTotalDiferencia">C$ 0.00</strong>
            </div>
        </div>

        <div class="arqueo-seleccion" id="arqueoSeleccionBarra">
            <label class="arqueo-seleccion-todo">
                <input type="checkbox" class="form-check-input" id="arqueoSeleccionarTodo" aria-label="Seleccionar todas las cajas">
                <span>Seleccionar todas</span>
            </label>
            <span class="arqueo-seleccion-texto"><strong id="arqueoSeleccionCantidad">0</strong> seleccionadas</span>
            <button type="button" class="btn btn-success btn-sm arqueo-btn-mini" id="btnArquearSeleccionadas" disabled>
                <i class="fa-solid fa-scale-balanced" aria-hidden="true"></i>
                Arquear seleccionadas
            </button>
        </div>

        <div class="cajas-arqueo-table-wrap">
            <table id="tablaCajas" class="table table-hover align-middle">
                <thead>
                    <tr>
                        <th class="arqueo-col-check"></th>
                        <th>Caja</th>
                        <th>Usuario</th>
                        <th>Apertura</th>
                        <th>Cierre</th>
                        <th>Monto inicial</th>
                        <th>Monto final</th>
                        <th>Real contado</th>
                        <th>Diferencia</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </section>

    <div class="modal fade" id="modalEditarArqueo" tabindex="-1" aria-labelledby="tituloModalArqueo" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title fs-6" id="tituloModalArqueo">Registrar Arqueo</h2>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <p class="arqueo-modal-caja" id="arqueoCajaEtiqueta">Caja</p>
                    <dl class="arqueo-detalle-valores">
                        <div><dt>Monto inicial</dt><dd id="arqueoCajaInicial">C$ 0.00</dd></div>
                        <div><dt>Monto final / teórico</dt><dd id="arqueoCajaTeorico">C$ 0.00</dd></div>
                    </dl>
                    <label for="arqueoCajaReal" class="form-label">Efectivo contado</label>
                    <div class="input-group input-group-sm">
                        <span class="input-group-text">C$</span>
                        <input type="number" class="form-control form-control-sm" id="arqueoCajaReal" min="0" step="0.01" inputmode="decimal" required>
                    </div>
                    <div class="arqueo-diferencia-preview" id="arqueoCajaDiferencia" aria-live="polite"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-success btn-sm" id="btnGuardarArqueo">Guardar arqueo</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalArqueoMultiple" tabindex="-1" aria-labelledby="tituloModalArqueoMultiple" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <div>
                        <h2 class="modal-title fs-6" id="tituloModalArqueoMultiple">Arqueo múltiple</h2>
                        <div class="small text-muted"><span id="arqueoMultipleCantidad">0</span> cajas seleccionadas</div>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <p class="arqueo-multiple-incluidas" id="arqueoMultipleIncluidas"></p>

                    <div class="arqueo-multiple-fila">
                        <span>Teórico total</span>
                        <strong id="arqueoMultipleTeorico">C$ 0.00</strong>
                    </div>

                    <div class="arqueo-multiple-fila">
                        <label for="arqueoMultipleReal">Efectivo contado (total)</label>
                        <div class="input-group input-group-sm arqueo-multiple-campo">
                            <span class="input-group-text">C$</span>
                            <input type="number" class="form-control form-control-sm" id="arqueoMultipleReal" min="0" step="0.01" inputmode="decimal" placeholder="0.00" required>
                        </div>
                    </div>

                    <div class="arqueo-multiple-fila">
                        <span>Diferencia</span>
                        <strong id="arqueoMultipleDiferencia" class="arqueo-diferencia-cero">C$ 0.00</strong>
                    </div>

                    <p class="arqueo-multiple-nota">El total se registra en la primera caja; las demás quedan con su monto teórico.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-success btn-sm" id="btnGuardarArqueoMultiple">Guardar arqueos</button>
                </div>
            </div>
        </div>
    </div>

</turbo-frame>