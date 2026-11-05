<div class="d-flex justify-content-between align-items-center">

    <div class="d-flex align-items-center gap-3">

        <!-- Dropdown columnas -->
        <div class="dropdown">

            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                Columnas
            </button>

            <div class="dropdown-menu p-3 dropdown-columns">

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="0" id="colCaja" checked>
                    <label class="form-check-label" for="colCaja">Caja</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colFecha" checked>
                    <label class="form-check-label" for="colFecha">Fecha</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="colAbreCaja" checked>
                    <label class="form-check-label" for="colAbreCaja">Abre Caja</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colCierraCaja" checked>
                    <label class="form-check-label" for="colCierraCaja">Cierra Caja</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="4" id="colSaldo" checked>
                    <label class="form-check-label" for="colSaldo">Saldo</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="5" id="colTransferido" checked>
                    <label class="form-check-label" for="colTransferido">Transferido</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="6" id="colCuentaTransferida" checked>
                    <label class="form-check-label" for="colCuentaTransferida">Cuenta Transferida</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="7" id="colAcciones" checked>
                    <label class="form-check-label" for="colAcciones">Acciones</label>
                </div>

            </div>

        </div>

    </div>

    <button type="button" class="btn-recargar ms-auto" id="recargarTransferencias" data-tabla="#tablaCajaCuenta"
            title="Actualizar" aria-label="Actualizar tabla">
        <i class="ph ph-arrows-clockwise"></i>
    </button>
</div>