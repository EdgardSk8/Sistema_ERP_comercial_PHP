<turbo-frame id="contenido-dinamico">


    @include('catalogos._tabs', ['activo' => 'tipos-medidas'])
    @include('tipos_medidas.CheckColumnasTiposMedidas')
    @include('tipos_medidas.CrearTipoMedida')
    @include('tipos_medidas.EditarTipoMedida')

    <div class="card">

        <table id="tablaTiposMedidas" class="table table-bordered">

            <thead>
                <tr>
                    <th>Nombre del Tipo de Medida</th>
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