<!DOCTYPE html>
<html lang="es">

<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Facturación</title>

    <meta name="csrf-token" content="{{ csrf_token() }}">

    <link rel="stylesheet" href="{{ Vite::asset('resources/css/facturacion/Facturacion.css') }}">

    <script src="{{ Vite::asset('resources/js/facturacion/VerificarCaja.js') }}"></script>
    <script src="{{ Vite::asset('resources/js/facturacion/Select.js') }}"></script>
    
    <script src="{{ Vite::asset('resources/js/facturacion/vuelto.js') }}"></script>
    <script src="{{ Vite::asset('resources/js/facturacion/Facturacion.js') }}"></script>

</head>

<body>

    <div class="contenedor-pos">

        <div class="row h-100">
 
            <div class="col-md-6 panel ">

                <div class="d-flex justify-content-between align-items-center">

                    <h3>FACTURACION</h3>

                    <div>
                        <button id="btnAbrirCaja" class="btn btn-sm btn-success">Abrir Caja</button> 
                        <button id="btnCerrarCaja" class="btn btn-danger">Cerrar Caja</button>
                    </div>
                    
                </div>

                

                    <div class="mini-contenedor-pos">

                        <table id="tablaProductos" class="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Precio</th>
                                    <th>Stock</th>
                                    <th>Accion</th>
                                </tr>
                            </thead>
                        </table>

                    </div>

               
                

            </div>


        <!-- ═══════════════ COLUMNA DERECHA ═══════════════════════ -->

            <!-- ══════════ SELECTORES ══════════ -->

            <div class="col-md-6 panel">
            
                <div class="row">
                    
                    <div class="col-6">
                        <h6> Seleccionar Cliente:</h6>
                        <select class="form-select form-select-sm" name="id_cliente" id="clientes"></select>
                    </div>

                    <div class="col-6">
                        <h6> Seleccionar Metodo de Pago:</h6>
                        <select class="form-select form-select-sm" name="id_metodo_pago" id="metodo_pago"></select>
                    </div>

                </div>

                <div class="row">

                    <div class="col-6 d-flex align-items-center">
                        <strong id="tasaImpuesto"></strong>
                    </div>

                    <div class="col-6 d-flex align-items-center">
                        <span id="NumeroCaja"></span>
                    </div>

                </div>

                <!-- ══════════ INPUTS ══════════ -->

                <div class="card card-pago p-2 mb-2">

                    <div class="d-flex justify-content-between mb-2">
                        <strong>Total:</strong>
                        <span id="total">C$ 0.00</span>
                    </div>

                    <!-- 💵 PAGOS -->
                    <div class="row g-1 mb-2">

                        <!-- CÓRDOBAS -->
                        <div class="col-6 position-relative">
                            <span style="
                                position:absolute;
                                left:10px;
                                top:50%;
                                transform:translateY(-50%);
                                font-size: 0.85rem;
                                color: black;">
                                C$
                            </span>

                            <input type="number" min="0" id="pagoCordobas" required
                                class="form-control form-control-sm"
                                style="padding-left: 27px;"
                                placeholder="0">
                        </div>

                        <!-- DÓLARES -->
                        <div class="col-6 position-relative">
                            <span style=" position:absolute; left:10px; top:50%; transform:translateY(-50%);
                                font-size: 0.85rem; color: black;">
                                $
                            </span>

                            <input type="number" min="0" id="pagoDolares" required
                                class="form-control form-control-sm"
                                style="padding-left: 27px;"
                                placeholder="Recibido">
                        </div>

                    </div>

                    <!-- 🔄 VUELTOS -->
                    <div class="row g-1 mb-2">

                        <!-- VUELTO C$ -->
                        <div class="col-6">
                            <input type="text" id="vueltoCordobas"
                                class="form-control form-control-sm"
                                placeholder="Vuelto C$" readonly>
                        </div>

                        <!-- VUELTO $ -->
                        <div class="col-6">
                            <input type="text" id="vueltoDolares"
                                class="form-control form-control-sm"
                                placeholder="Vuelto $" readonly
                            >
                        </div>

                    </div>

                    <!-- 🧾 BOTÓN -->
                    <button class="btn btn-success btn-sm w-100" id="btnFacturar">
                        Facturar
                    </button>

                </div>

                <h6>Carrito</h6>

<!-- ════════════════════ CARRITO ═══════════════════════ -->

                <div class="carrito-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio</th>
                                <th>Sub</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="carrito"></tbody>
                    </table>
                </div>

            </div>

        </div>

    </div>

</body>

</html>