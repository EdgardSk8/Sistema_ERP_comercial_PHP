<turbo-frame id="contenido-dinamico">

<link rel="stylesheet" href="{{ Vite::asset('resources/css/reportes/Reportes.css') }}">

<div class="contenedor-principal">



    <!-- ╔════════════════════════════════════╗
        ║         CARDS REPORTES            ║
        ╚════════════════════════════════════╝ -->

        <div class="contenedor-reportes">

            <!-- VENTAS -->
            <input type="radio" name="reporte" id="ventas" value="ventas" hidden>

            <label for="ventas" class="card-reporte ventas">
                <i class="ph ph-chart-line"></i>
                <small>Ventas</small>
            </label>

            <!-- INVENTARIO -->
            <input type="radio" name="reporte" id="inventario" value="inventario" hidden>

            <label for="inventario" class="card-reporte inventario">
                <i class="ph ph-package"></i>
                <small>Inventario</small>
            </label>

            <!-- MOVIMIENTOS -->
            <input type="radio" name="reporte" id="movimientos" value="movimientoinventario" hidden>

            <label for="movimientos" class="card-reporte movimientos">
                <i class="ph ph-arrows-left-right"></i>
                <small>Movimientos</small>
            </label>

            <!-- CLIENTES -->
            <input type="radio" name="reporte" id="clientes" value="clientes" hidden>

            <label for="clientes" class="card-reporte clientes">
                <i class="ph ph-user"></i>
                <small>Clientes</small>
            </label>

            <!-- USUARIOS -->
            <input type="radio" name="reporte" id="usuarios" value="usuarios" hidden>

            <label for="usuarios" class="card-reporte usuarios">
                <i class="ph ph-users"></i>
                <small>Usuarios</small>
            </label>

            <!-- CAJAS -->
            <input type="radio" name="reporte" id="cajas" value="cajas" hidden>

            <label for="cajas" class="card-reporte cajas">
                <i class="ph ph-wallet"></i>
                <small>Cajas</small>
            </label>

            <!-- ---------------------------------------------------------------------------------------- -->


            <!-- <div class="contenedor-radio-exportar">

                <input type="radio" name="tipo_exportacion" id="exportExcel" value="excel" hidden>
                <label for="exportExcel" class="radio-exportacion excel"> 📊 Excel </label>

                <input type="radio" name="tipo_exportacion" id="exportPDF" value="pdf" hidden >
                <label for="exportPDF" class="radio-exportacion pdf"> 📄 PDF </label>
                
                <button id="btnGenerarReporte" class="btn-reporte" disabled> Generar </button>

            </div> -->

            <!-- ---------------------------------------------------------------------------------------- -->

        </div>

   <!-- ╔════════════════════════════════════╗
        ║             FILTROS               ║
        ╚════════════════════════════════════╝ -->



    <section class="reportes-panel">

        <div class="reportes-panel-heading">
            <div>
                <h3>Resultado del reporte</h3>
                <p>Filtra los resultados y utiliza las opciones de exportación.</p>
            </div>
        </div>

        <div class="contenedor-filtros">

            <!-- FECHA INICIO -->
            <div class="grupo-filtro">

                <label class="label-filtro" for="FechaInicio">Fecha inicio</label>
                <input type="date" id="FechaInicio" placeholder="Fecha inicio"
                    autocomplete="off" class="Fecha-Input-Reporte">

            </div>

            <!-- FECHA FIN -->
            <div class="grupo-filtro">

                <label class="label-filtro" for="FechaFin">Fecha fin</label>
                
                <input type="date" id="FechaFin"  autocomplete="off"  placeholder="Fecha Fin"  class="Fecha-Input-Reporte">

            </div>

            <!-- LIMITE -->
            <div class="grupo-filtro">

                <label class="label-filtro" for="LimiteDatos">Cantidad de datos</label>
                <input type="number" id="LimiteDatos" class="form-control form-control-sm" min="1" value="">

            </div>


            <div class="grupo-filtro grupo-filtro-orden">

                <label class="label-filtro" for="Orden-Datos">Orden</label>
                <select class="select" name="Orden-Datos" id="Orden-Datos">

                    <option value="desc">Descendente</option>
                    <option value="asc">Ascendente</option>

                </select>
            </div>

            <div class="grupo-filtro grupo-acciones">
                <button id="limpiafiltroreporte" type="button" class="btn-reporte">Limpiar filtros</button>
            </div>

        </div>


        <table id="Reportes" class="table  table-bordered">

            <thead></thead>
            <tbody></tbody>

        </table>

    </section>

</div>

</turbo-frame>
