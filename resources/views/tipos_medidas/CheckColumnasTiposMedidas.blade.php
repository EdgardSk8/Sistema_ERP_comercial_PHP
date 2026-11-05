<div class="d-flex justify-content-between align-items-center">

    <div class="d-flex align-items-center gap-3">

        <!-- Dropdown columnas -->
        <div class="dropdown">

            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                Columnas
            </button>

            <div class="dropdown-menu p-3 dropdown-columns">

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="0" id="colNombreTipoMedida" checked>
                    <label class="form-check-label" for="colNombreTipoMedida">Nombre del Tipo de Medida</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colDescripcionTipoMedida" checked>
                    <label class="form-check-label" for="colDescripcionTipoMedida">Descripción</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="colFechaCreacionTipoMedida">
                    <label class="form-check-label" for="colFechaCreacionTipoMedida">Fecha de Creación</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colEstadoTipoMedida" checked>
                    <label class="form-check-label" for="colEstadoTipoMedida">Estado</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="4" id="colAccionesTipoMedida" checked>
                    <label class="form-check-label" for="colAccionesTipoMedida">Acciones</label>
                </div>

            </div>

        </div>

        <!-- Botón agregar -->
        <button type="button" class="btn-agregar" data-bs-toggle="modal" data-bs-target="#modalCrearTipoMedida">
            + Agregar Tipo de Medida
        </button>

        <!-- Toggle inactivos -->
        <input type="checkbox" id="toggleInactivosTiposMedidas" class="togglecheck" hidden checked>
        <label for="toggleInactivosTiposMedidas" class="toggle-btn">
            Ocultar inactivos
        </label>

    </div>

    <button type="button" class="btn-recargar ms-auto" id="recargarTiposMedidas" data-tabla="#tablaTiposMedidas"
            title="Actualizar" aria-label="Actualizar tabla">
        <i class="ph ph-arrows-clockwise"></i>
    </button>
</div>