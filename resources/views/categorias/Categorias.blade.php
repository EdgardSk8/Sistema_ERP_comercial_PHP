<turbo-frame id="contenido-dinamico">


    @include('catalogos._tabs', ['activo' => 'categorias'])
    @include('categorias.CheckColumnasCategorias')
    @include('categorias.CrearCategoria') {{-- MODAL CREAR CATEGORIA --}}
    @include('categorias.EditarCategoria') {{-- MODAL EDITAR CATEGORIA --}}

    <div class="card">

        <table id="tablaCategorias" class="table  table-bordered">

            <thead>
                <tr>
                    <th>Nombre de la Categoría</th>
                    <th>Descripción</th>
                    <th>Fecha de Creación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>

            <tbody></tbody>

        </table>

    </div>

</turbo-frame>