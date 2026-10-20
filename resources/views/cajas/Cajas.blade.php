<turbo-frame id="contenido-dinamico">

    <link rel="stylesheet" href="{{ Vite::asset('resources/css/cajas/Cajas.css') }}">

    <section class="cajas-arqueo-page" aria-labelledby="tituloArqueos">
        <header class="cajas-arqueo-header">
            <div>
                <h2 id="tituloArqueos">Arqueo de cajas</h2>
                <p>Consulta sesiones, registra el efectivo contado y corrige arqueos.</p>
            </div>
            <button type="button" class="btn btn-primary btn-sm arqueo-btn-mini" id="btnImprimirArqueo">
                <i class="ph ph-printer" aria-hidden="true"></i>
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
            <button type="button" class="btn btn-success btn-sm " id="btnArqueoHoy">Hoy</button>
            <button type="button" class="btn btn-primary btn-sm " id="btnArqueoSemana">Esta semana</button>
            <button type="button" class="btn btn-danger btn-sm " id="btnLimpiarFiltros">
                <i class="ph ph-eraser" aria-hidden="true"></i>
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
                <i class="ph ph-scales" aria-hidden="true"></i>
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
                    <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn guardar btn-sm-modal" id="btnGuardarArqueo">Guardar arqueo</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalArqueoMultiple" tabindex="-1" aria-labelledby="tituloModalArqueoMultiple" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title fs-6" id="tituloModalArqueoMultiple">Arqueo múltiple</h2>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <div class="row g-3">

                        <!-- IZQUIERDA: cajas, efectivo contado y totales -->
                        <div class="col-md-5">

                            <div class="arqueo-multiple-bloque">
                                <span class="arqueo-multiple-etiqueta">1 · Cajas a arquear</span>
                                <div class="arqueo-multiple-chips" id="arqueoMultipleIncluidas"></div>
                                <div class="small text-muted mt-2">
                                    <span id="arqueoMultipleCantidad">0</span> cajas · un solo efectivo contado para todo el lote
                                </div>
                            </div>

                            <div class="arqueo-multiple-bloque">
                                <label class="arqueo-multiple-etiqueta" for="arqueoMultipleReal">2 · Efectivo contado (total del lote)</label>
                                <div class="input-group input-group-sm">
                                    <span class="input-group-text">C$</span>
                                    <input type="number" class="form-control form-control-sm" id="arqueoMultipleReal" min="0" step="0.01" inputmode="decimal" placeholder="0.00" required>
                                </div>

                                <div class="arqueo-multiple-totales">
                                    <div class="arqueo-multiple-fila">
                                        <span>Teórico total del lote</span>
                                        <strong id="arqueoMultipleTeorico">C$ 0.00</strong>
                                    </div>

                                    <div class="arqueo-multiple-fila">
                                        <span>Diferencia (contado − teórico)</span>
                                        <strong id="arqueoMultipleDiferencia" class="arqueo-diferencia-cero">C$ 0.00</strong>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <!-- DERECHA: resultado por caja -->
                        <div class="col-md-7">
                            <div class="arqueo-multiple-bloque">
                                <span class="arqueo-multiple-etiqueta">3 · Qué se guardará en cada caja</span>
                                <div class="arqueo-multiple-tabla-wrap">
                                    <table class="arqueo-multiple-tabla">
                                        <thead>
                                            <tr>
                                                <th>Caja</th>
                                                <th>Teórico</th>
                                                <th>Se guardará</th>
                                            </tr>
                                        </thead>
                                        <tbody id="arqueoMultipleDetalle"></tbody>
                                    </table>
                                </div>
                                <p class="arqueo-multiple-nota">
                                    La diferencia del lote se aplica a la <strong>primera caja</strong>;
                                    las demás se guardan con su monto teórico.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn guardar btn-sm-modal" id="btnGuardarArqueoMultiple">Guardar arqueos</button>
                </div>
            </div>
        </div>
    </div>

</turbo-frame>