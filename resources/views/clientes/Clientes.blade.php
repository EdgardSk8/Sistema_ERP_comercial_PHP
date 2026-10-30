<turbo-frame id="contenido-dinamico">

    @include('clientes.CheckColumnasClientes') 
    @include('clientes.CrearCliente') {{-- MODAL CREAR CLIENTE --}}
    @include('clientes.EditarCliente') {{-- MODAL EDITAR CLIENTE --}}

    <div class="card">

        <table id="tablaClientes" class="table table-bordered text-nowrap">

            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Cédula</th>
                    <th>RUC</th>
                    <th>Fecha nacimiento</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Dirección</th>
                    <th>Usuario web</th>
                    <th>Descuento</th>
                    <th>Estado</th>
                    <th>Fecha creación</th>
                    <th>Acciones</th>

                </tr>
            </thead>

        <tbody></tbody>

        </table>

    </div>

</turbo-frame>
