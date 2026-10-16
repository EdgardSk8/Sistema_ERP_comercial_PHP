<turbo-frame id="contenido-dinamico">

    <link rel="stylesheet" href="{{ Vite::asset('resources/css/dashboard/Dashboard.css') }}">
    
    <div class="Contenedor_graficas">

        <div class="Encabezado">

            <div class="Graficas_elementos_scroll">
                
                <div class="GrupoBotones">

                    <input type="radio" id="ventas" name="dashboard" value="ventas" checked>
                    <label for="ventas" class="BotonGrupo">
                        Ventas
                    </label>

                    <input type="radio" id="compras" name="dashboard" value="compras">
                    <label for="compras" class="BotonGrupo">
                        Compras
                    </label>

                    <input type="radio" id="ganancias" name="dashboard" value="ganancias">
                    <label for="ganancias" class="BotonGrupo">
                        Ganancias
                    </label>

                    <input type="radio" id="cajas" name="dashboard" value="cajas">
                    <label for="cajas" class="BotonGrupo">
                        Cajas
                    </label>

                    <input type="radio" id="tallas" name="dashboard" value="tallas">
                    <label for="tallas" class="BotonGrupo">
                        Tallas
                    </label>

                    <!-- <input type="radio" id="Movimiento_inventario" name="dashboard" value="Movimiento_inventario">
                    <label for="Movimiento_inventario" class="BotonGrupo">
                        Movimiento Inventario
                    </label> -->

                </div>
                
            </div> <!-- CONTENEDOR RADIO BOTONES -->

        </div>

        <div class="CG">

            <div class="Contenedor_graficas_1">

                <div class="Contenedor_kpis">

                    <div class="Card_Kpis"> <i></i> <div id="kpis_1" class="kpis-info"> <label></label> <strong></strong> </div> </div>
                    <div class="Card_Kpis"> <i></i> <div id="kpis_2" class="kpis-info"> <label></label> <strong></strong> </div> </div>
                    <div class="Card_Kpis"> <i></i> <div id="kpis_3" class="kpis-info"> <label></label> <strong></strong> </div> </div>
                    <div class="Card_Kpis"> <i></i> <div id="kpis_4" class="kpis-info"> <label></label> <strong></strong> </div> </div>
                    <!-- <div class="Card_Kpis"> <i></i> <div id="kpis_5" class="kpis-info"> <label></label> <strong></strong> </div> </div> -->
                    <!-- <div class="Card_Kpis"> <i></i> <div id="kpis_6" class="kpis-info"> <label></label> <strong></strong> </div> </div> -->

                </div> <!-- CONTENEDOR DE KPIS -->

                <div class="Contenedor_Grafica">

                    <!-- FILTRO DE GRAFICAS -->
                    <div class="Filtros_Graficas">

                        <div class="btn-group btn-group-sm" role="group" aria-label="Filtro de ventas">

                            <input type="radio" class="btn-check" name="Radio_Filtro" id="Dia" value="dia">
                            <label class="btn btn-outline-success" for="Dia"> Día </label>

                            <input type="radio" class="btn-check" name="Radio_Filtro" id="Mes" value="mes" checked>
                            <label class="btn btn-outline-success" for="Mes"> Mes </label>

                            <input type="radio" class="btn-check" name="Radio_Filtro" id="Anio" value="anio">
                            <label class="btn btn-outline-success" for="Anio"> Año </label>

                            <input type="radio" class="btn-check" name="Radio_Filtro" id="Semana" value="semana">
                            <label class="btn btn-outline-success" for="Semana"> Ultima Semana</label>

                        </div>

                        <input type="date" class="form-control form-control-sm" id="Fecha_Inicio" placeholder="Fecha inicio" autocomplete="off" >
                        <input  type="date" class="form-control form-control-sm" id="Fecha_Fin" placeholder="Fecha fin" autocomplete="off" >
                        <button type="button" class="btn btn-limpiar-filtro" id="Btn_Limpiar_Filtros"> <i class="fa-solid fa-trash-can"></i> </button>

                    </div>

                    <div class="card-responsive Chart_1"> <canvas id="Chart_1"></canvas> </div>
                    <div class="card-responsive"> <canvas id="Chart_3"></canvas>

                </div>

                </div> <!-- CONTENEDOR IZQUIERDO -->

            </div>

            <div class="Contenedor_graficas_2">
                
                <div class="card-responsive Chart_2"> <canvas id="Chart_2"></canvas> </div>
                <div class="card-responsive Tabla_1"> <span class="Titulo-Tabla"></span> <table id="Tabla_1" class="table table-striped table-bordered"></table> </div>

            </div> <!-- CONTENEDOR DERECHO -->

        </div> <!-- CONTENEDOR CG -->
        
    </div> <!-- CONTENEDOR GENERAL DE GRAFICAS -->










</turbo-frame>