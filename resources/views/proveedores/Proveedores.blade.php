<turbo-frame id="contenido-dinamico">

    @include('proveedores.CheckColumnasProveedor')
    @include('proveedores.CrearProveedor') {{-- MODAL CREAR --}}
    @include('proveedores.EditarProveedor') {{-- MODAL EDITAR --}}

    <div class="card">

        <table id="tablaProveedores" class="table table-bordered">

            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>RUC</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Dirección</th>
                    <!-- <th>Fecha de Creación</th> -->
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>

            <tbody></tbody>

        </table>

    </div>



</turbo-frame>