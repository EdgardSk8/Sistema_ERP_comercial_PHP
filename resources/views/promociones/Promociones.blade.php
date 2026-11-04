<turbo-frame id="contenido-dinamico">
    @vite(['resources/css/promociones/Promociones.css'])

    <section class="promociones-page">
        <div class="promociones-toolbar">
            <div class="promociones-toolbar__info">
                <h4 class="promociones-toolbar__titulo">Promociones</h4>
                <span class="promociones-toolbar__sub">Productos en descuento con vigencia y banner promocional</span>
            </div>

            <button type="button" class="btn promociones-btn-primario" id="btnNuevaPromocion">
                <i class="ph ph-plus-circle"></i> Nueva promoción
            </button>
        </div>

        <div class="promociones-tabla-wrap">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0" id="tablaPromociones">
                    <thead>
                        <tr>
                            <th>Imagen</th>
                            <th>Producto</th>
                            <th>Inicio</th>
                            <th>Fin</th>
                            <th>Días restantes</th>
                            <th>Estado</th>
                            <th class="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>

        <div id="promocionesVacio" class="text-center text-secondary py-5 d-none">
            No hay promociones registradas. Crea la primera con el botón de arriba.
        </div>

        <div id="errorPromociones" class="alert alert-danger d-none mt-3" role="alert"></div>
    </section>

    <div class="modal fade" id="modalPromocion" tabindex="-1" aria-labelledby="tituloModalPromocion" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content">
                <div class="modal-header d-flex justify-content-between align-items-center">
                    <h5 class="modal-title text-start" id="tituloModalPromocion">Nueva promoción</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>

                <form id="formPromocion">
                    <div class="modal-body">
                        <input type="hidden" id="idPromocion">

                        <div class="row g-4">

                            <div class="col-md-6">
                                <label class="form-label">Producto</label>
                                <input type="hidden" id="promocionProducto">

                                <div class="row g-2 mb-2">
                                    <div class="col-6">
                                        <select id="promocionFiltroCategoria" class="form-select form-select-sm">
                                            <option value="">Todas las categorías</option>
                                        </select>
                                    </div>
                                    <div class="col-6">
                                        <input type="search" id="promocionBuscarProducto" class="form-control form-control-sm"
                                            placeholder="Buscar producto…" autocomplete="off">
                                    </div>
                                </div>

                                <div id="promocionProductos" class="promociones-productos"
                                    role="listbox" aria-label="Selecciona un producto"></div>
                            </div>

                            <div class="col-md-6">
                                <label for="promocionImagen" class="form-label">Imagen de la promoción</label>

                                <label class="promociones-upload" for="promocionImagen">
                                    <img id="promocionImagenPreview" class="promociones-upload__preview" alt="Vista previa" hidden>
                                    <span id="promocionBadgePreview" class="promociones-descuento-preview" hidden></span>
                                    <span class="promociones-upload__placeholder" id="promocionImagenTexto">
                                        <i class="ph ph-image"></i>
                                        Subir imagen llamativa
                                    </span>
                                </label>

                                <input type="file" id="promocionImagen" class="d-none" accept="image/jpeg,image/png,image/webp">
                                <small class="text-secondary">JPG, PNG o WebP. Máximo 4 MB.</small>

                                <div class="row g-2 mt-2">
                                    <div class="col-6">
                                        <label for="promocionFechaInicio" class="form-label">Fecha inicio</label>
                                        <input type="text" id="promocionFechaInicio" class="form-control form-control-sm"
                                            placeholder="Inicio" autocomplete="off">
                                    </div>
                                    <div class="col-6">
                                        <label for="promocionFechaFin" class="form-label">Fecha fin <span class="text-secondary">(opc.)</span></label>
                                        <input type="text" id="promocionFechaFin" class="form-control form-control-sm"
                                            placeholder="Fin" autocomplete="off">
                                    </div>
                                    
                                </div>

                                <div class="row g-2 mt-1">
                                    <div class="col-6">
                                        <label for="promocionTipoDescuento" class="form-label">Descuento en la imagen</label>
                                        <select id="promocionTipoDescuento" class="form-select form-select-sm">
                                            <option value="">Sin descuento</option>
                                            <option value="porcentaje">Porcentaje (%)</option>
                                            <option value="monto">Monto fijo (-C$)</option>
                                            <option value="precio">Precio reducido (C$)</option>
                                        </select>
                                    </div>
                                    <div class="col-3">
                                        <label for="promocionValorDescuento" class="form-label">Valor</label>
                                        <input type="number" id="promocionValorDescuento" class="form-control form-control-sm"
                                            min="0" step="any" placeholder="10" disabled>
                                    </div>
                                    <div class="col-3">
                                        <label for="promocionPrecioFinalInput" class="form-label">Precio final</label>
                                        <input type="number" id="promocionPrecioFinalInput" class="form-control form-control-sm"
                                            min="0" step="any" placeholder="Ej. 700.00" disabled>
                                    </div>
                                </div>

                                <div class="form-check form-switch mt-2">
                                    <input class="form-check-input" type="checkbox" role="switch" id="promocionEstado" checked>
                                    <label class="form-check-label" for="promocionEstado">Promoción activa <span class="text-secondary">(desactiva para dar de baja)</span></label>
                                </div>
                            </div>

                        </div>

                        <div class="promociones-precios">
                            <div class="promociones-precios__item">
                                <span>Precio de compra</span>
                                <strong id="promocionPrecioCompra">—</strong>
                            </div>
                            <div class="promociones-precios__item">
                                <span>Precio actual</span>
                                <strong id="promocionPrecioActual">—</strong>
                            </div>
                            <div class="promociones-precios__item">
                                <span>Descuento</span>
                                <strong id="promocionDescuentoTexto">Sin descuento</strong>
                            </div>
                            <div class="promociones-precios__item promociones-precios__item--final">
                                <span>Precio final</span>
                                <strong id="promocionPrecioFinal">—</strong>
                            </div>
                        </div>

                        <div id="errorFormPromocion" class="small text-danger mt-2" role="alert"></div>
                    </div>

                    <div class="modal-footer d-flex justify-content-end">
                        <button type="button" class="btn promociones-btn-secundario" data-bs-dismiss="modal">
                            Cancelar
                        </button>
                        <button type="submit" class="btn promociones-btn-primario" id="btnGuardarPromocion">
                            <i class="ph ph-floppy-disk"></i> Guardar promoción
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="modal fade" id="modalImagenPromocion" tabindex="-1" aria-labelledby="tituloImagenPromocion" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h6 class="modal-title" id="tituloImagenPromocion">Imagen de la promoción</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body text-center p-2">
                    <img id="imagenPromocionGrande" src="" alt="Imagen de la promoción" class="img-fluid rounded">
                </div>
            </div>
        </div>
    </div>
</turbo-frame>
