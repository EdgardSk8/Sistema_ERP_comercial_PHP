<div class="d-flex justify-content-between align-items-center">

    <div class="d-flex align-items-center gap-3">

        <!-- Dropdown columnas -->
        <div class="dropdown">

            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                Columnas
            </button>

            <div class="dropdown-menu p-3 dropdown-columns">

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="0" id="colIdentificador">
                    <label class="form-check-label" for="colIdentificador">Identificador</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colUsuario" checked>
                    <label class="form-check-label" for="colUsuario">Usuario</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="colFecha" checked>
                    <label class="form-check-label" for="colFecha">Fecha</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colCuenta" checked>
                    <label class="form-check-label" for="colCuenta">Cuenta</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="4" id="colTipo" checked>
                    <label class="form-check-label" for="colTipo">Tipo</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="5" id="colDescripcion" checked>
                    <label class="form-check-label" for="colDescripcion">Descripción</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="6" id="colMonto" checked>
                    <label class="form-check-label" for="colMonto">Monto</label>
                </div>

            </div>

        </div>

        <input type="checkbox" id="toggleFooter" class="togglecheck" hidden>
        <label for="toggleFooter" class="toggle-btn"> Mostrar filtros </label>

    </div>

    

    <button type="button" class="btn-recargar ms-auto" id="recargarMovimientosCuenta" data-tabla="#tablaMovimientosCuenta"
            title="Actualizar" aria-label="Actualizar tabla">
        <i class="ph ph-arrows-clockwise"></i>
    </button>
</div>