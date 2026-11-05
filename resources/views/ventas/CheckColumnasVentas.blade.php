<div class="d-flex justify-content-between align-items-center">

    <div class="d-flex align-items-center gap-3">

        <!-- Dropdown columnas -->
        <div class="dropdown">

            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                Columnas
            </button>

            <div class="dropdown-menu dropdown-columns">

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="0" id="colId">
                    <label class="form-check-label" for="colId">Identificador</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colFactura" checked>
                    <label class="form-check-label" for="colFactura">Factura</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="colCliente" checked>
                    <label class="form-check-label" for="colCliente">Cliente</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colUsuario" checked>
                    <label class="form-check-label" for="colUsuario">Usuario</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="4" id="colNCaja" checked>
                    <label class="form-check-label" for="colNCaja">Nº Caja</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="5" id="colFecha" checked>
                    <label class="form-check-label" for="colFecha">Fecha</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="6" id="colSubtotal" checked>
                    <label class="form-check-label" for="colSubtotal">Subtotal</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="7" id="colImpuesto" checked>
                    <label class="form-check-label" for="colImpuesto">Impuesto</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="8" id="colTotal" checked>
                    <label class="form-check-label" for="colTotal">Total</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="9" id="colMetodoPago" checked>
                    <label class="form-check-label" for="colMetodoPago">Método Pago</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="10" id="colEstado" checked>
                    <label class="form-check-label" for="colEstado">Estado</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="11" id="colDetalles" checked>
                    <label class="form-check-label" for="colDetalles">Detalles</label>
                </div>

            </div>

        </div>

        <input type="checkbox" id="toggleFooter" class="togglecheck" hidden>
        <label for="toggleFooter" class="toggle-btn"> Mostrar filtros </label>

    </div>

    <button type="button" class="btn-recargar ms-auto" id="recargarVentas" data-tabla="#tablaVentas"
            title="Actualizar" aria-label="Actualizar tabla">
        <i class="ph ph-arrows-clockwise"></i>
    </button>
</div>
