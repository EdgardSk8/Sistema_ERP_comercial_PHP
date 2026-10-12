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
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colProducto" checked>
                    <label class="form-check-label" for="colProducto">Producto</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="4" id="colVariacion" checked>
                    <label class="form-check-label" for="colVariacion">Variación</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="5" id="colMovimiento" checked>
                    <label class="form-check-label" for="colMovimiento">Movimiento</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="6" id="colTipo" checked>
                    <label class="form-check-label" for="colTipo">Tipo</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="7" id="colMotivo" checked>
                    <label class="form-check-label" for="colMotivo">Motivo Movimiento</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="8" id="colCantidad" checked>
                    <label class="form-check-label" for="colCantidad">Cant</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="9" id="colStockActual" checked>
                    <label class="form-check-label" for="colStockActual">Stock Actual</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="10" id="colPrecio" checked>
                    <label class="form-check-label" for="colPrecio">Precio</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="11" id="colTotalVendido" checked>
                    <label class="form-check-label" for="colTotalVendido">Total Vendido C$</label>
                </div>

            </div>

        </div>

        <input type="checkbox" id="toggleFooter" class="togglecheck" hidden>
        <label for="toggleFooter" class="toggle-btn"> Mostrar filtros </label>
        
    </div>

</div>