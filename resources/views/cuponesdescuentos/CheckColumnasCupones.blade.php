<div class="d-flex justify-content-between align-items-center gap-3 cupones-herramientas">

    <div class="d-flex align-items-center gap-3">

        <div class="dropdown">
            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                Columnas
            </button>

            <div class="dropdown-menu p-3 dropdown-columns">
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="0" id="cuponColCodigo" checked>
                    <label class="form-check-label" for="cuponColCodigo">Código</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="cuponColNombre" checked>
                    <label class="form-check-label" for="cuponColNombre">Nombre</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="cuponColTipo" checked>
                    <label class="form-check-label" for="cuponColTipo">Tipo</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="cuponColValor" checked>
                    <label class="form-check-label" for="cuponColValor">Valor</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="4" id="cuponColCategoria" checked>
                    <label class="form-check-label" for="cuponColCategoria">Categoría</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="5" id="cuponColUsos" checked>
                    <label class="form-check-label" for="cuponColUsos">Usos</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="6" id="cuponColVigencia" checked>
                    <label class="form-check-label" for="cuponColVigencia">Vigencia</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="7" id="cuponColEstado" checked>
                    <label class="form-check-label" for="cuponColEstado">Estado</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="8" id="cuponColClientes" checked>
                    <label class="form-check-label" for="cuponColClientes">Clientes</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="9" id="cuponColAcciones" checked>
                    <label class="form-check-label" for="cuponColAcciones">Acciones</label>
                </div>
            </div>
        </div>

        <button type="button" class="cupones-btn cupones-btn--primario" id="btnNuevoCupon">
            <i class="ph ph-plus"></i> Nuevo cupón
        </button>

    </div>

    <div class="cupones-herramientas__busqueda">
        <input type="search" id="buscarCupon" class="form-control form-control-sm"
               placeholder="Buscar cupón" aria-label="Buscar cupón">

        <button type="button" class="btn-recargar" id="recargarCupones" data-tabla="#tablaCupones"
                title="Actualizar" aria-label="Actualizar cupones">
            <i class="ph ph-arrows-clockwise"></i>
        </button>
    </div>

</div>
