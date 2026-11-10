<turbo-frame id="contenido-dinamico">

    @include('compras.CheckColumnasCompras')

    <div class="card">

        <table id="tablaCompras" class="table  table-bordered">

            <thead>
                <tr>
                    <th>ID</th>
                    <th>Factura</th>
                    <th>Proveedor</th>
                    <th>Usuario</th>
                    <th>Fecha</th>
                    <th>Subtotal</th>
                    <th>Desc</th>
                    <th>Impuesto</th>
                    <th>Gastos</th>
                    <th>Total</th>
                    <th>Método Pago</th>
                    <th>Estado</th>
                    <th>Detalles</th>
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
                    </tr>
                </tfoot>

        </table>

    </div>

    @include('compras.DetalleCompra')

</turbo-frame>