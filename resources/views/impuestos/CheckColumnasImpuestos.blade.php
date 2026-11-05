<div class="d-flex justify-content-between align-items-center">

    <div class="d-flex align-items-center gap-3">

        <!-- Dropdown columnas -->
        <div class="dropdown">

            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                Columnas
            </button>

            <div class="dropdown-menu p-3 dropdown-columns">

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="0" id="colNombre" checked>
                    <label class="form-check-label" for="colNombre">Nombre del Impuesto</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colPorcentaje" checked>
                    <label class="form-check-label" for="colPorcentaje">Porcentaje (%)</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="colFechaCreacion" checked>
                    <label class="form-check-label" for="colFechaCreacion">Fecha de Creación</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colEstado" checked>
                    <label class="form-check-label" for="colEstado">Estado</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="4" id="colAcciones" checked>
                    <label class="form-check-label" for="colAcciones">Acciones</label>
                </div>

            </div>

        </div>

        <!-- Botón agregar -->
        <button type="button" class="btn-agregar" data-bs-toggle="modal" data-bs-target="#modalCrearImpuesto">
            + Agregar Impuesto
        </button>

        <!-- Toggle inactivos -->
        <input type="checkbox" id="toggleInactivosImpuestos" class="togglecheck" hidden checked>
        <label for="toggleInactivosImpuestos" class="toggle-btn">
            Ocultar inactivos
        </label>

    </div>

    <button type="button" class="btn-recargar ms-auto" id="recargarImpuestos" data-tabla="#tablaImpuestos"
            title="Actualizar" aria-label="Actualizar tabla">
        <i class="ph ph-arrows-clockwise"></i>
    </button>
</div>