<div class="d-flex justify-content-between align-items-center gap-3">
    <div class="d-flex align-items-center gap-3">
        <div class="dropdown">
            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                Columnas
            </button>
            <div class="dropdown-menu p-3 dropdown-columns">
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="0" id="colNombreUbicacion" checked>
                    <label class="form-check-label" for="colNombreUbicacion">Ubicación</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colDescripcionUbicacion" checked>
                    <label class="form-check-label" for="colDescripcionUbicacion">Descripción</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="colEstadoUbicacion" checked>
                    <label class="form-check-label" for="colEstadoUbicacion">Estado</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colAccionesUbicacion" checked>
                    <label class="form-check-label" for="colAccionesUbicacion">Acciones</label>
                </div>
            </div>
        </div>

        <button type="button" class="btn-agregar" data-bs-toggle="modal" data-bs-target="#modalCrearUbicacion">
            + Agregar ubicación
        </button>

        <input type="checkbox" id="toggleInactivosUbicaciones" class="togglecheck" hidden checked>
        <label for="toggleInactivosUbicaciones" class="toggle-btn">Ocultar inactivos</label>
    </div>
</div>