<div class="d-flex justify-content-between align-items-center">

    <div class="d-flex align-items-center gap-3">

        <div class="dropdown">

            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                Columnas
            </button>

            <div class="dropdown-menu p-3 dropdown-columns">

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="0" id="colProducto" checked>
                    <label class="form-check-label" for="colProducto">Producto</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colColor" checked>
                    <label class="form-check-label" for="colColor">Color</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="colEstado" checked>
                    <label class="form-check-label" for="colEstado">Estado</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colAcciones" checked>
                    <label class="form-check-label" for="colAcciones">Acciones</label>
                </div>

            </div>

        </div>

        <button
            class="btn-agregar"
            data-bs-toggle="modal"
            data-bs-target="#modalCrearProductoVariacion">
            + Agregar Variación
        </button>

        <input
            type="checkbox"
            id="toggleInactivosProductoVariaciones"
            class="togglecheck"
            hidden
            checked>

        <label
            for="toggleInactivosProductoVariaciones"
            class="toggle-btn">
            Ocultar inactivos
        </label>

        <input
            type="checkbox"
            id="toggleFooter"
            class="togglecheck"
            hidden>

        <label
            for="toggleFooter"
            class="toggle-btn">
            Mostrar filtros
        </label>

    </div>

</div>
