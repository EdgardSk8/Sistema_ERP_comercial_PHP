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
                    <label class="form-check-label" for="colNombre">Nombre</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colCedula" checked>
                    <label class="form-check-label" for="colCedula">Cédula</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="colUsuario" checked>
                    <label class="form-check-label" for="colUsuario">Usuario</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colRol" checked>
                    <label class="form-check-label" for="colRol">Rol</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="4" id="colEstado" checked>
                    <label class="form-check-label" for="colEstado">Estado</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="5" id="colAcciones" checked>
                    <label class="form-check-label" for="colAcciones">Acciones</label>
                </div>

            </div>

        </div>

        <!-- Toggle inactivos -->
        <input type="checkbox" id="toggleInactivosUsuarios" class="togglecheck" hidden checked>
        <label for="toggleInactivosUsuarios" class="toggle-btn">
            Ocultar inactivos
        </label>

        <!-- Botón agregar -->
        <button type="button" class="btn-agregar" data-bs-toggle="modal" data-bs-target="#modalCrearUsuario">
            + Agregar Usuario
        </button>

    </div>

    <button type="button" class="btn-recargar ms-auto" id="recargarUsuarios" data-tabla="#tablaUsuarios"
            title="Actualizar" aria-label="Actualizar tabla">
        <i class="ph ph-arrows-clockwise"></i>
    </button>
</div>