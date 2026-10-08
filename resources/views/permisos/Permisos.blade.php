<turbo-frame id="contenido-dinamico">
    <link rel="stylesheet" href="{{ Vite::asset('resources/css/permisos/Permisos.css') }}">

    <div class="card padre-permisos">
        <div class="permisos-header">
            <div class="permisos-heading">
                <h2>Permisos por rol</h2>
                <p>Selecciona un rol para consultar y actualizar sus accesos.</p>
            </div>

            <div class="permisos-controles">
                <div class="permisos-selector">
                    <label for="selectRol">Rol</label>
                    <select id="selectRol" class="Selector-Rol">
                        <option value=""></option>
                    </select>
                </div>
                <div class="permisos-busqueda">
                    <label for="buscarPermiso">Buscar permiso</label>
                    <input id="buscarPermiso" type="search" class="form-control" placeholder="Nombre o acción..." disabled>
                </div>
            </div>
        </div>

        <div class="hijo-permisos">
            <div id="estadoSinRol" class="estado-sin-rol">
                <div class="estado-sin-rol-icono"><i class="fa-solid fa-user-shield"></i></div>
                <h3>Selecciona un rol</h3>
                <p>Al elegirlo, aqu&iacute; aparecer&aacute;n sus permisos agrupados por m&oacute;dulo.</p>
            </div>
            <div id="contenedorPermisos"></div>
        </div>
    </div>
</turbo-frame>
