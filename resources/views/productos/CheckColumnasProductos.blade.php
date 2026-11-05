<div class="d-flex justify-content-between align-items-center">

    <div class="d-flex align-items-center gap-3">

        <!-- Dropdown columnas -->
        <div class="dropdown">

            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                Columnas
            </button>

            <div class="dropdown-menu p-3 dropdown-columns">

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="0" id="colId">
                    <label class="form-check-label" for="colId">Identificador</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colImagen">
                    <label class="form-check-label" for="colImagen">Imagen</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="colNombre" checked>
                    <label class="form-check-label" for="colNombre">Nombre</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colCategoria" checked>
                    <label class="form-check-label" for="colCategoria">Categoría</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="4" id="colPrecioCompra" checked>
                    <label class="form-check-label" for="colPrecioCompra">P. Compra</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="5" id="colPrecioVenta" checked>
                    <label class="form-check-label" for="colPrecioVenta">P. Venta</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="6" id="colPrecioVenta" checked>
                    <label class="form-check-label" for="colPrecioVenta">P. Venta Final (Impuesto)</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="7" id="colGanancia" checked>
                    <label class="form-check-label" for="colGanancia">Ganancia</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="8" id="colGananciaPorcentaje" checked>
                    <label class="form-check-label" for="colGananciaPorcentaje">Ganancia %</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="9" id="colImpuesto" checked>
                    <label class="form-check-label" for="colImpuesto">Impuesto</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="10" id="colStock" checked>
                    <label class="form-check-label" for="colStock">Stock</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="11" id="colEstado" checked>
                    <label class="form-check-label" for="colEstado">Estado</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="12" id="colAcciones" checked>
                    <label class="form-check-label" for="colAcciones">Acciones</label>
                </div>

            </div>

        </div>

        <input type="checkbox" id="toggleInactivosProductos" class="togglecheck" hidden checked>
        <label for="toggleInactivosProductos" class="toggle-btn">
            Ocultar inactivos
        </label>

        <input type="checkbox" id="toggleFooter" class="togglecheck" hidden>
        <label for="toggleFooter" class="toggle-btn"> Mostrar filtros </label>

    </div>

    <button type="button" class="btn-recargar ms-auto" id="recargarProductos" data-tabla="#TablaMostrarProductos"
            title="Actualizar" aria-label="Actualizar tabla">
        <i class="ph ph-arrows-clockwise"></i>
    </button>
</div>