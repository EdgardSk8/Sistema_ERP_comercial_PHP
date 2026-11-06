<turbo-frame id="contenido-dinamico">


    @include('catalogos._tabs', ['activo' => 'medidas'])
    @include('medidas.CheckColumnasMedidas')
    @include('medidas.CrearMedidas')
    @include('medidas.EditarMedidas')

    <div class="card">

        <table id="tablaMedidas" class="table table-bordered">

            <thead>
                <tr>
                    <th>Tipo de Medida</th>
                    <th>Nombre</th>
                    <th>Abreviatura</th>
                    <th>Orden</th>
                    <th>Fecha de Creación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>

            <tbody></tbody>

            <tfoot>
                <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                </tr>
            </tfoot>

        </table>

    </div>

</turbo-frame>