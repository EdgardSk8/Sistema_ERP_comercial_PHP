<div class="d-flex justify-content-between align-items-center">

    <div class="d-flex align-items-center gap-3">

        <div class="dropdown">

            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                Columnas
            </button>

            <div class="dropdown-menu p-3 dropdown-columns">

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="0" id="colTipoMedida" checked>
                    <label class="form-check-label" for="colTipoMedida">Tipo de Medida</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colNombreMedida" checked>
                    <label class="form-check-label" for="colNombreMedida">Nombre</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="colAbreviatura" checked>
                    <label class="form-check-label" for="colAbreviatura">Abreviatura</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colOrden" checked>
                    <label class="form-check-label" for="colOrden">Orden</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="4" id="colFecha">
                    <label class="form-check-label" for="colFecha">Fecha de Creación</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="5" id="colEstado" checked>
                    <label class="form-check-label" for="colEstado">Estado</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="6" id="colAcciones" checked>
                    <label class="form-check-label" for="colAcciones">Acciones</label>
                </div>

            </div>

        </div>

        <button class="btn-agregar" data-bs-toggle="modal" data-bs-target="#modalCrearMedida">
            + Agregar Medida
        </button>

        <input type="checkbox" id="toggleInactivosMedidas" class="togglecheck" hidden checked>

        <label for="toggleInactivosMedidas" class="toggle-btn">
            Ocultar inactivos
        </label>

        <input type="checkbox" id="toggleFooter" class="togglecheck" hidden>
        <label for="toggleFooter" class="toggle-btn"> Mostrar filtros </label>

    </div>

    <button type="button" class="btn-recargar ms-auto" id="recargarMedidas" data-tabla="#tablaMedidas"
            title="Actualizar" aria-label="Actualizar tabla">
        <i class="ph ph-arrows-clockwise"></i>
    </button>
</div>