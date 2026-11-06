<turbo-frame id="contenido-dinamico">

    @include('productos.EditarProducto')
    @include('productos.DetalleProducto')
    @include('productos.CheckColumnasProductos')

    <div class="card">

        <table id="TablaMostrarProductos" class="table  table-bordered">

            <thead>
                <tr>
                    <th>ID</th>
                    <th>Imagen</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Marca</th>
                    <th>Medidas</th>
                    <th>P. Compra</th>
                    <th>P. Venta</th>
                    <th>P.V.Final</th>
                    <th>Ganancia</th>
                    <th>Ganancia %</th>
                    <th>Impuesto</th>
                    <th>Stock</th>
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
                        <th></th>
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