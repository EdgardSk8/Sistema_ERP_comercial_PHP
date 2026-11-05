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
                    <label class="form-check-label" for="colNombre">Nombre del Método</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colDescripcion" checked>
                    <label class="form-check-label" for="colDescripcion">Descripción</label>
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
        
        <!-- Botón agregar -->
        <button type="button" class="btn-agregar" data-bs-toggle="modal" data-bs-target="#modalCrearMetodoPago">
            + Agregar Método de Pago
        </button>

        <!-- Toggle inactivos -->
        <input type="checkbox" id="toggleInactivosMetodosPago" class="togglecheck" hidden checked>
        <label for="toggleInactivosMetodosPago" class="toggle-btn">
            Ocultar inactivos
        </label>

    </div>

    <button type="button" class="btn-recargar ms-auto" id="recargarMetodosPago" data-tabla="#tablaMetodosPago"
            title="Actualizar" aria-label="Actualizar tabla">
        <i class="ph ph-arrows-clockwise"></i>
    </button>
</div>