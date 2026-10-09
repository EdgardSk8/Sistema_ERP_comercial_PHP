<div class="d-flex justify-content-between align-items-center">
    <div class="d-flex align-items-center gap-3 flex-wrap">
        <div class="dropdown">
            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                Columnas
            </button>
            <div class="dropdown-menu p-3 dropdown-columns">
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="0" id="colTalla" checked>
                    <label class="form-check-label" for="colTalla">Talla</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="1" id="colVariantesTalla" checked>
                    <label class="form-check-label" for="colVariantesTalla">Variantes asignadas</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="2" id="colEstadoTalla" checked>
                    <label class="form-check-label" for="colEstadoTalla">Estado</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input toggle-col" type="checkbox" data-column="3" id="colAccionesTalla" checked>
                    <label class="form-check-label" for="colAccionesTalla">Acciones</label>
                </div>
            </div>
        </div>

        @if(in_array('crear_tallas', session('permisos', [])))
            <button class="btn-agregar" type="button" data-bs-toggle="modal" data-bs-target="#modalCrearTalla">
                + Agregar talla
            </button>
        @endif

        <input type="checkbox" id="toggleInactivasTallas" class="togglecheck" hidden checked>
        <label for="toggleInactivasTallas" class="toggle-btn">Ocultar inactivas</label>

        <input type="checkbox" id="toggleFooterTallas" class="togglecheck" hidden>
        <label for="toggleFooterTallas" class="toggle-btn">Mostrar filtros</label>
    </div>
</div>
