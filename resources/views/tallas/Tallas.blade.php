<turbo-frame id="contenido-dinamico">

    @include('tallas.CheckColumnasTallas')
    @include('tallas.CrearTalla')
    @include('tallas.EditarTalla')

    <div class="card">
        <table id="tablaTallas" class="table table-bordered"
            data-can-edit="{{ in_array('editar_tallas', session('permisos', [])) && in_array('actualizar_tallas', session('permisos', [])) ? '1' : '0' }}"
            data-can-toggle="{{ in_array('cambiar_estado_tallas', session('permisos', [])) ? '1' : '0' }}">
            <thead>
                <tr>
                    <th>Talla</th>
                    <th>Variantes asignadas</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody></tbody>
            <tfoot>
                <tr><th></th><th></th><th></th><th></th></tr>
            </tfoot>
        </table>
    </div>

</turbo-frame>
