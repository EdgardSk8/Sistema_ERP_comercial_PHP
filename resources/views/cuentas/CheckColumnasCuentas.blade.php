<div class="d-flex justify-content-between align-items-center">

    <div class="d-flex align-items-center gap-3">

        <!-- Dropdown columnas -->
        <div class="dropdown">

            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                Columnas
            </button>

            <div class="dropdown-menu p-3 dropdown-columns">

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="0" id="colNombreCuenta" checked>
                    <label class="form-check-label" for="colNombreCuenta">Nombre Cuenta</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colTipo" checked>
                    <label class="form-check-label" for="colTipo">Tipo</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="colDescripcion" checked>
                    <label class="form-check-label" for="colDescripcion">Descripción</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colSaldo" checked>
                    <label class="form-check-label" for="colSaldo">Saldo</label>
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

        <!-- Botón agregar cuenta -->
        <button type="button" class="btn-agregar" data-bs-toggle="modal" data-bs-target="#modalCrearCuenta">
            + Agregar Cuenta
        </button>

        <!-- Botón transferir -->
        <button type="button" class="btn-cuenta-transferir" data-bs-toggle="modal" data-bs-target="#ModalTransferirCuenta">
            Transferir entre cuentas
        </button>

        <!-- Toggle inactivos -->
        <input type="checkbox" id="toggleInactivosCuentas" class="togglecheck" hidden checked>
        <label for="toggleInactivosCuentas" class="toggle-btn">
            Ocultar inactivos
        </label>

    </div>

    <button type="button" class="btn-recargar ms-auto" id="recargarCuentas" data-tabla="#tablaCuentas"
            title="Actualizar" aria-label="Actualizar tabla">
        <i class="ph ph-arrows-clockwise"></i>
    </button>
</div>