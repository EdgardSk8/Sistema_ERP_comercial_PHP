<div class="d-flex justify-content-between align-items-center mb-2">
    <div class="d-flex align-items-center gap-3">
        <div class="dropdown">
            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                Columnas
            </button>
            <div class="dropdown-menu p-3 dropdown-columns" id="CheckColumnasProductoVariacionDetalle">
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="0" id="colVariacionImagenes" checked>
                    <label class="form-check-label" for="colVariacionImagenes">Imágenes</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colVariacionProducto" checked>
                    <label class="form-check-label" for="colVariacionProducto">Producto</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="colVariacionColor" checked>
                    <label class="form-check-label" for="colVariacionColor">Color</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colVariacionTallas" checked>
                    <label class="form-check-label" for="colVariacionTallas">Tallas</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="4" id="colVariacionUnidades" checked>
                    <label class="form-check-label" for="colVariacionUnidades">Unidades</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="5" id="colVariacionAcciones" checked>
                    <label class="form-check-label" for="colVariacionAcciones">Acciones</label>
                </div>
            </div>
        </div>
    </div>

    <div class="d-flex align-items-center gap-2 ms-auto">

        <button type="button" class="btn-nuevo-color" id="btnNuevoColorVariacion"
                title="Agregar un color nuevo a un producto">
            <i class="ph ph-plus"></i> Color
        </button>

        <button type="button" class="btn-recargar" id="recargarProductoVariacionDetalle" data-tabla="#tablaProductoVariacionDetalle"
                title="Actualizar" aria-label="Actualizar tabla">
            <i class="ph ph-arrows-clockwise"></i>
        </button>

    </div>
</div>