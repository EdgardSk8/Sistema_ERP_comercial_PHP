<turbo-frame id="contenido-dinamico">

    <link rel="stylesheet" href="{{ Vite::asset('resources/css/respaldo/Respaldo.css') }}">

    <div class="respaldo-view">

        <div class="respaldo-card-principal">

        <div class="exportacion-body pe-1">

            <!-- HEADER -->
            <div class="respaldo-header">

                <div>
                    <h4 class="fw-bold mb-0">
                        <i class="bi bi-database-fill-gear" aria-hidden="true"></i>
                        Exportaciones
                    </h4>

                    <small class="text-secondary">
                        Respaldos y exportación completa del sistema.
                    </small>
                </div>

            </div>

            <!-- GRID -->
            <div class="row g-3">

                <!-- EXPORTAR -->
                <div class="col-lg-8">

                    <div class="card-respaldo card-exportacion">

                        <div class="card-header-respaldo">
                            <i class="bi bi-file-earmark-arrow-down text-success me-2"></i>
                            Exportar Sistema
                        </div>

                        <div class="card-body d-flex flex-column gap-3">

                            <!-- FORMATOS -->
                            <div>

                                <label class="form-label fw-semibold small mb-2">
                                    Formato de exportación
                                </label>

                                <div class="row g-2">

                                    <div class="col-6 col-md-3">
                                        <input class="btn-check" type="radio" name="formato" id="excel" value="excel">

                                        <label class="btn formato-respaldo w-100 py-3" for="excel">
                                            <i class="bi bi-file-earmark-excel d-block fs-4"></i>
                                            Excel
                                        </label>
                                    </div>

                                    <div class="col-6 col-md-3">
                                        <input class="btn-check" type="radio" name="formato" id="pdf" value="pdf">

                                        <label class="btn formato-respaldo w-100 py-3" for="pdf">
                                            <i class="bi bi-file-earmark-pdf d-block fs-4"></i>
                                            PDF
                                        </label>
                                    </div>

                                    <div class="col-6 col-md-3">
                                        <input class="btn-check" type="radio" name="formato" id="csv" value="csv">

                                        <label class="btn formato-respaldo w-100 py-3" for="csv">
                                            <i class="bi bi-filetype-csv d-block fs-4"></i>
                                            CSV
                                        </label>
                                    </div>

                                    <div class="col-6 col-md-3">
                                        <input class="btn-check" type="radio" name="formato" id="sql" value="sql" checked>

                                        <label class="btn formato-respaldo w-100 py-3" for="sql">
                                            <i class="bi bi-database d-block fs-4"></i>
                                            SQL
                                        </label>
                                    </div>

                                </div>

                            </div>

                            <!-- INFO -->
                            <div class="formatos-info">

                                <div><strong>Excel:</strong> Cada tabla se exporta en una hoja</div>
                                <div><strong>PDF:</strong> Genera un documento con los registros del sistema</div>
                                <div><strong>CSV:</strong> Exporta los datos en formato separado por comas</div>
                                <div><strong>SQL:</strong> Incluye estructura y datos completos</div>

                            </div>

                            <!-- BOTON -->
                            <button
                                type="button"
                                class="btn btn-exportar w-100"
                                id="btnExportarSistema">

                                <i class="bi bi-download me-1"></i>
                                Exportar Todo

                            </button>

                        </div>

                    </div>

                </div>

                <!-- RESTAURAR -->
                <div class="col-lg-4">

                    <div class="card-respaldo card-restaurar">

                        <div class="card-header-respaldo">
                            <i class="bi bi-arrow-repeat text-warning me-2"></i>
                            Restaurar
                        </div>

                        <div class="card-body d-flex flex-column gap-3">

                            <div class="alerta-restauracion">
                                <i class="bi bi-exclamation-triangle-fill me-1"></i>
                                Reemplazará los datos actuales.
                            </div>

                            <div class="upload-respaldo text-center">

                                <i class="bi bi-cloud-arrow-up" aria-hidden="true"></i>

                                <small class="d-block text-secondary mb-3">
                                    Selecciona un respaldo
                                </small>

                                <!-- 🔥 FIX PRINCIPAL -->
                                <input
                                    type="file"
                                    class="form-control archivo-respaldo"
                                    id="archivoSql"
                                    accept=".sql,.txt">

                            </div>

                            <button class="btn btn-restaurar w-100" id="btnImportarSistema">
                                <i class="bi bi-arrow-clockwise me-1"></i>
                                Restaurar
                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>

        </div>

    </div>


</turbo-frame>
