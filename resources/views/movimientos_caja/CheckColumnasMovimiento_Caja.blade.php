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
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colCaja" checked>
                    <label class="form-check-label" for="colCaja">Caja</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="4" id="colTipo" checked>
                    <label class="form-check-label" for="colTipo">Tipo</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="5" id="colMonto" checked>
                    <label class="form-check-label" for="colMonto">Monto</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="6" id="colConcepto" checked>
                    <label class="form-check-label" for="colConcepto">Concepto</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="7" id="colCuentaDestino" checked>
                    <label class="form-check-label" for="colCuentaDestino">Cuenta Destino</label>
                </div>

            </div>

        </div>

    </div>

    <button type="button" class="btn-recargar ms-auto" id="recargarMovimientosCaja" data-tabla="#tablaMovimientosCaja"
            title="Actualizar" aria-label="Actualizar tabla">
        <i class="ph ph-arrows-clockwise"></i>
    </button>
</div>