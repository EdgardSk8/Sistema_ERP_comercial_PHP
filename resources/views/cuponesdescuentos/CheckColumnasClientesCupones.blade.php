<div class="cupones-herramientas cupones-herramientas--clientes">

    <div class="d-flex align-items-center gap-3">
        <div class="dropdown" id="columnasClientesCupones">
            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                Columnas
            </button>

            <div class="dropdown-menu p-3 dropdown-columns">
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="0" id="clienteColCliente" checked>
                    <label class="form-check-label" for="clienteColCliente">Cliente</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="clienteColCorreo" checked>
                    <label class="form-check-label" for="clienteColCorreo">Correo</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="clienteColTelefono" checked>
                    <label class="form-check-label" for="clienteColTelefono">Teléfono</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="clienteColCompras" checked>
                    <label class="form-check-label" for="clienteColCompras">Compras</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="4" id="clienteColTotal" checked>
                    <label class="form-check-label" for="clienteColTotal">Total gastado</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="5" id="clienteColPedidos" checked>
                    <label class="form-check-label" for="clienteColPedidos">Pedidos web</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="6" id="clienteColUltima" checked>
                    <label class="form-check-label" for="clienteColUltima">Última compra</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="7" id="clienteColBienvenida" checked>
                    <label class="form-check-label" for="clienteColBienvenida">Bienvenida</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="8" id="clienteColCupones" checked>
                    <label class="form-check-label" for="clienteColCupones">Cupones</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="9" id="clienteColAcciones" checked>
                    <label class="form-check-label" for="clienteColAcciones">Acciones</label>
                </div>
            </div>
        </div>
    </div>

    <div class="cupones-herramientas__busqueda">
        <input type="search" id="buscarClienteCuponTabla" class="form-control form-control-sm"
               placeholder="Buscar cliente" aria-label="Buscar cliente">

        <button type="button" class="btn-recargar" id="recargarClientesCupones" data-tabla="#tablaClientesCupones"
                title="Actualizar" aria-label="Actualizar clientes">
            <i class="ph ph-arrows-clockwise"></i>
        </button>
    </div>

</div>
