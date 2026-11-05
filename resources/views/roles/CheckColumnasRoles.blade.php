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
                    <label class="form-check-label" for="colNombre">Nombre del Rol</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colDescripcion" checked>
                    <label class="form-check-label" for="colDescripcion">Descripción</label>
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

        <!-- Toggle inactivos -->
        <input type="checkbox" id="toggleInactivosRoles" class="togglecheck" hidden checked>
        <label for="toggleInactivosRoles" class="toggle-btn">
            Ocultar inactivos
        </label>

        <!-- Botón agregar -->
        <button type="button" class="btn-agregar" data-bs-toggle="modal" data-bs-target="#modalCrearRol">
            + Agregar Rol
        </button>

    </div>

    <button type="button" class="btn-recargar ms-auto" id="recargarRoles" data-tabla="#tablaRoles"
            title="Actualizar" aria-label="Actualizar tabla">
        <i class="ph ph-arrows-clockwise"></i>
    </button>
</div>