<turbo-frame id="contenido-dinamico">

    <link rel="stylesheet" href="{{ Vite::asset('resources/css/manual/Manual.css') }}">

    @php
        $permisos = session('permisos', []);
        $puede = fn (...$nombres) => count(array_intersect($nombres, $permisos)) > 0;

        $gruposNav = [
            ['id' => 'inicio', 'titulo' => 'Inicio', 'icono' => 'ph-book-open-text', 'visible' => true],
            ['id' => 'dashboard', 'titulo' => 'Dashboard', 'icono' => 'ph-chart-pie', 'visible' => $puede('vista_dashboard')],
            ['id' => 'ventas', 'titulo' => 'Ventas', 'icono' => 'ph-receipt', 'visible' => $puede('vista_facturacion', 'vista_ventas', 'vista_cuentas_por_cobrar', 'vista_clientes')],
            ['id' => 'compras', 'titulo' => 'Compras', 'icono' => 'ph-shopping-cart', 'visible' => $puede('vista_crear_compras', 'vista_compras', 'vista_proveedores')],
            ['id' => 'caja', 'titulo' => 'Caja', 'icono' => 'ph-wallet', 'visible' => $puede('vista_cajas', 'vista_movimientos_cajas')],
            ['id' => 'cuentas', 'titulo' => 'Cuentas', 'icono' => 'ph-bank', 'visible' => $puede('vista_cuentas', 'vista_movimientos_cuentas', 'vista_transferenciacajacuenta')],
            ['id' => 'gastos', 'titulo' => 'Gastos', 'icono' => 'ph-receipt-x', 'visible' => $puede('vista_gastos', 'vista_tipos_gasto', 'vista_movimientos_gastos')],
            ['id' => 'inventario', 'titulo' => 'Inventario', 'icono' => 'ph-package', 'visible' => $puede('vista_productos', 'vista_categorias', 'vista_ubicaciones', 'vista_producto_variaciones', 'vista_producto_variaciones_detalle', 'vista_tallas', 'vista_tipos_medidas', 'vista_medidas', 'vista_movimientos_inventario')],
            ['id' => 'administracion', 'titulo' => 'Administración', 'icono' => 'ph-users-three', 'visible' => $puede('vista_usuarios', 'vista_roles', 'vista_permisos')],
            ['id' => 'reportes', 'titulo' => 'Reportes', 'icono' => 'ph-chart-bar', 'visible' => $puede('vista_reportes')],
            ['id' => 'configuracion', 'titulo' => 'Configuración', 'icono' => 'ph-gear-six', 'visible' => $puede('vista_impuestos', 'vista_metodos_pago', 'vista_metodos_pago_cuenta', 'vista_credenciales', 'vista_respaldo')],
        ];

        $gruposNav = array_values(array_filter($gruposNav, fn ($grupo) => $grupo['visible']));
    @endphp

    <div class="manual-view modo-simple">

        {{-- ═════════════ ENCABEZADO ═════════════ --}}

        <header class="manual-hero">
            <span class="manual-hero__icon"><i class="ph ph-book-open-text"></i></span>
            <div>
                <h1>Manual de uso del sistema</h1>
                <p>
                    Elige cómo quieres leer: una explicación rápida para resolver dudas al momento o la explicación
                    completa con campos, pasos y ejemplos. Solo verás los módulos que tu rol tiene habilitados.
                </p>
                <div class="manual-hero__meta">
                    <span class="manual-badge manual-badge--azul"><i class="ph ph-shield-check"></i> Contenido según tus permisos</span>
                    <span class="manual-badge"><i class="ph ph-currency-circle-dollar"></i> Montos en córdobas (C$)</span>
                    <span class="manual-badge"><i class="ph ph-calendar-blank"></i> Fechas dd/mm/aaaa</span>
                </div>

                <div class="manual-modo" role="radiogroup" aria-label="Nivel de detalle del manual">
                    <span class="manual-modo__titulo"><i class="ph ph-sliders-horizontal"></i> Nivel de detalle</span>

                    <label class="manual-modo__opcion">
                        <input type="radio" name="manualModo" value="simple" checked>
                        <i class="ph ph-lightning"></i>
                        <span>Explicación rápida</span>
                    </label>

                    <label class="manual-modo__opcion">
                        <input type="radio" name="manualModo" value="completo">
                        <i class="ph ph-list-magnifying-glass"></i>
                        <span>Explicación completa</span>
                    </label>
                </div>
            </div>
        </header>

        {{-- ═════════════ MINI NAVBAR ═════════════ --}}

        <div class="manual-layout">

            <nav class="manual-nav" id="manualNav" aria-label="Navegación del manual">
                <p class="manual-nav__title">
                    <i class="ph ph-list-bullets"></i>
                    Secciones
                </p>

                @foreach($gruposNav as $grupo)
                    <a href="#{{ $grupo['id'] }}">
                        <i class="ph {{ $grupo['icono'] }}"></i>
                        {{ $grupo['titulo'] }}
                    </a>
                @endforeach
            </nav>

            <div class="manual-main">

        {{-- ═════════════ INICIO ═════════════ --}}

        <section class="manual-group" id="inicio">
            <div class="manual-group__head">
                <i class="ph ph-book-open-text"></i>
                <h2>Inicio</h2>
            </div>

            <div class="manual-chips">
                <a href="#general">Cómo funciona el sistema</a>
                <a href="#estados">Estados y acciones</a>
                <a href="#puesta-en-marcha">Puesta en marcha</a>
            </div>

            <article class="manual-card" id="general">
                <div class="manual-card__head">
                    <span class="manual-card__icon"><i class="ph ph-compass"></i></span>
                    <div>
                        <h3>Cómo funciona el sistema</h3>
                        <p>Lo básico para moverse por cualquier módulo.</p>
                    </div>
                </div>

                <p>
                    Antes de entrar en los módulos, conviene conocer las tres zonas que vas a usar todo el tiempo:
                    el menú de la izquierda, el área de trabajo de la derecha y las tablas con sus botones.
                </p>

                <ul>
                    <li><i class="ph ph-sidebar-simple"></i><strong>Menú lateral:</strong> Es la barra de la izquierda. Ahí están agrupados los módulos por área (Ventas, Compras, Caja, etc.). Al hacer clic en un área se despliegan sus módulos y, al elegir uno, se abre en la pantalla de la derecha.</li>
                    <li><i class="ph ph-desktop"></i><strong>Área de trabajo:</strong> Es el espacio grande de la derecha. Ahí se carga el módulo que elijas sin recargar toda la página. Arriba a la derecha está el botón de sol/luna para cambiar entre modo claro y oscuro.</li>
                    <li><i class="ph ph-table"></i><strong>Tablas:</strong> Casi todos los módulos muestran una tabla. Arriba puedes buscar, ordenar por columna y abrir los filtros de fecha o estado. Con los checkbox decides si quieres ver los registros inactivos y qué columnas mostrar.</li>
                    <li><i class="ph ph-cursor-click"></i><strong>Acciones por fila:</strong> Al final de cada fila están los botones de acción. El lápiz edita, el ojo muestra el detalle y el botón de estado activa o da de baja el registro.</li>
                    <li><i class="ph ph-bell-ringing"></i><strong>Mensajes (toasts):</strong> Cada vez que guardas algo aparece un mensaje indicando si salió bien o si hubo un error. Si la acción es delicada, el sistema primero te pide confirmación en un modal, nunca en una ventana del navegador.</li>
                </ul>
            </article>

            <article class="manual-card" id="estados">
                <div class="manual-card__head">
                    <span class="manual-card__icon"><i class="ph ph-toggle-left"></i></span>
                    <div>
                        <h3>Estados y acciones</h3>
                        <p>Activo, inactivo y por qué no se borran los registros.</p>
                    </div>
                </div>

                <p>
                    En el sistema casi nada se borra: los registros se activan o se inactivan.
                    Así el historial y los reportes se mantienen completos.
                </p>

                <div class="manual-table-wrap">
                    <table class="manual-table">
                        <thead>
                            <tr>
                                <th>Concepto</th>
                                <th>Qué significa</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span class="manual-badge manual-badge--verde"><i class="ph ph-check-circle"></i> Activo</span></td>
                                <td>El registro está disponible para operar: aparece en ventas, compras, selects y reportes.</td>
                            </tr>
                            <tr>
                                <td><span class="manual-badge"><i class="ph ph-pause-circle"></i> Inactivo</span></td>
                                <td>Se oculta para nuevas operaciones, pero conserva su historial (ventas, compras, movimientos).</td>
                            </tr>
                            <tr>
                                <td><span class="manual-badge manual-badge--rojo"><i class="ph ph-arrow-down"></i> Dar de baja</span></td>
                                <td>Cambia el estado a inactivo. No elimina el registro ni sus movimientos.</td>
                            </tr>
                            <tr>
                                <td><span class="manual-badge manual-badge--rojo"><i class="ph ph-trash"></i> Eliminar</span></td>
                                <td>Solo existe en registros que aún no tienen historial (por ejemplo, una imagen o una talla asignada). En documentos contables nunca se elimina: se anula.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="manual-callout manual-callout--info">
                    <i class="ph ph-info"></i>
                    <div>
                        <strong>Regla general</strong>
                        <p>Si un registro ya participó en una venta, compra o movimiento, se inactiva o se anula; así los reportes y el dinero siguen cuadrando.</p>
                    </div>
                </div>
            </article>

            <article class="manual-card" id="puesta-en-marcha">
                <div class="manual-card__head">
                    <span class="manual-card__icon"><i class="ph ph-rocket-launch"></i></span>
                    <div>
                        <h3>Puesta en marcha</h3>
                        <p>Orden recomendado la primera vez que usas el sistema.</p>
                    </div>
                </div>

                <p>
                    Si es tu primera vez, sigue este orden. Te evita crear productos sin categoría o facturar sin caja abierta.
                </p>

                <ol class="manual-steps">
                    <li>Configura <strong>Credenciales</strong>: datos de la empresa, tasa de cambio y logo.</li>
                    <li>Crea los <strong>Impuestos</strong> que uses (por ejemplo, IVA 15%).</li>
                    <li>Carga los catálogos: <strong>Categorías</strong>, <strong>Tipos de medidas</strong>, <strong>Medidas</strong> y <strong>Ubicaciones</strong>.</li>
                    <li>Registra tus <strong>Productos</strong> con costo, precio de venta, impuesto y stock inicial.</li>
                    <li>Si vendes con colores y tallas, crea las <strong>Variaciones</strong> y su detalle.</li>
                    <li>Configura <strong>Métodos de pago</strong> y vincúlalos a sus <strong>cuentas</strong>.</li>
                    <li>Registra <strong>Proveedores</strong> y <strong>Clientes</strong>.</li>
                    <li>Abre la <strong>Caja</strong> desde Facturación y empieza a vender.</li>
                </ol>
            </article>
        </section>

        {{-- ═════════════ DASHBOARD ═════════════ --}}

        @if(in_array('vista_dashboard', $permisos))
            <section class="manual-group" id="dashboard">
                <div class="manual-group__head">
                    <i class="ph ph-chart-pie"></i>
                    <h2>Dashboard</h2>
                </div>

                <article class="manual-card" id="dashboard-panel">
                    <div class="manual-card__head">
                        <span class="manual-card__icon"><i class="ph ph-chart-pie"></i></span>
                        <div>
                            <h3>Panel de indicadores</h3>
                            <p>Resumen visual de la operación del negocio.</p>
                        </div>
                    </div>

                    <p>
                        El dashboard agrupa indicadores y gráficas por tema. Las pestañas disponibles son
                        <strong>Ventas</strong>, <strong>Compras</strong>, <strong>Ganancias</strong>,
                        <strong>Cajas</strong>, <strong>Tallas</strong> y <strong>Movimiento de inventario</strong>.
                    </p>

                    <h4>Filtros de fecha</h4>
                    <ul>
                        <li><strong>Día, Mes, Año y Última semana:</strong> Atajos para el periodo que más consultas.</li>
                        <li><strong>Rango personalizado:</strong> Elige una fecha de inicio y una fecha fin para consultar cualquier periodo.</li>
                    </ul>

                    <h4>Qué muestra cada pestaña</h4>
                    <div class="manual-table-wrap">
                        <table class="manual-table">
                            <thead>
                                <tr>
                                    <th>Pestaña</th>
                                    <th>Uso</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Ventas</td>
                                    <td>Cantidad de ventas y monto vendido en el periodo.</td>
                                </tr>
                                <tr>
                                    <td>Compras</td>
                                    <td>Compras registradas y dinero invertido en mercadería.</td>
                                </tr>
                                <tr>
                                    <td>Ganancias</td>
                                    <td>Diferencia entre lo vendido y el costo registrado en cada venta.</td>
                                </tr>
                                <tr>
                                    <td>Cajas</td>
                                    <td>Aperturas, cierres y montos de las cajas del periodo.</td>
                                </tr>
                                <tr>
                                    <td>Tallas</td>
                                    <td>Distribución de stock y ventas por talla.</td>
                                </tr>
                                <tr>
                                    <td>Movimiento de inventario</td>
                                    <td>Entradas, salidas y ajustes de stock.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="manual-callout manual-callout--example">
                        <i class="ph ph-lightbulb"></i>
                        <div>
                            <strong>Ejemplo</strong>
                            <p>Para saber cuánto vendiste hoy, abre <em>Ventas</em> y pulsa <em>Día</em>. Para comparar el mes contra el anterior, usa el rango personalizado con las dos fechas.</p>
                        </div>
                    </div>
                </article>
            </section>
        @endif

        {{-- ═════════════ VENTAS ═════════════ --}}

        @if($puede('vista_facturacion', 'vista_ventas', 'vista_cuentas_por_cobrar', 'vista_clientes'))
            <section class="manual-group" id="ventas">
                <div class="manual-group__head">
                    <i class="ph ph-receipt"></i>
                    <h2>Ventas</h2>
                </div>

                <div class="manual-chips">
                    @if(in_array('vista_facturacion', $permisos))<a href="#facturacion">Facturación</a>@endif
                    @if(in_array('vista_ventas', $permisos))<a href="#ventas-lista">Ventas</a>@endif
                    @if(in_array('vista_cuentas_por_cobrar', $permisos))<a href="#cuentas-por-cobrar">Cuentas por cobrar</a>@endif
                    @if(in_array('vista_clientes', $permisos))<a href="#clientes">Clientes</a>@endif
                </div>

                @if(in_array('vista_facturacion', $permisos))
                    <article class="manual-card" id="facturacion">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-cash-register"></i></span>
                            <div>
                                <h3>Facturación (punto de venta)</h3>
                                <p>Registrar la venta, cobrar y descontar inventario.</p>
                            </div>
                        </div>

                        <p>
                            Es la caja del negocio. Registra la venta, descuenta el stock, guarda el cobro en la caja o cuenta
                            y genera la factura o la proforma para imprimir.
                        </p>

                        <h4>Antes de facturar</h4>
                        <ul>
                            <li><i class="ph ph-wallet"></i>La <strong>caja debe estar abierta</strong> e indicar el monto inicial en efectivo.</li>
                            <li><i class="ph ph-package"></i>Los productos deben tener precio, impuesto y stock.</li>
                            <li><i class="ph ph-credit-card"></i>El <strong>método de pago</strong> debe estar vinculado a una <strong>cuenta</strong> en “Método Pago Cuenta”.</li>
                            <li><i class="ph ph-user"></i>El cliente debe estar registrado.</li>
                        </ul>

                        <h4>Pasos de una venta</h4>
                        <ol class="manual-steps">
                            <li>Abre la caja si aún no está abierta e ingresa el efectivo inicial.</li>
                            <li>Selecciona el <strong>cliente</strong>.</li>
                            <li>Agrega los productos al carrito y ajusta cantidades. Si cambias el precio, el sistema registra el precio usado.</li>
                            <li>Elige el <strong>método de pago</strong> y la <strong>cuenta</strong> donde entra el dinero.</li>
                            <li>Si es efectivo, escribe el monto <strong>recibido</strong>; el sistema calcula el vuelto en córdobas y dólares con la tasa de cambio configurada.</li>
                            <li>Pulsa <strong>Facturar</strong>. Para imprimir sin registrar la venta, activa <strong>Proforma</strong>.</li>
                        </ol>

                        <h4>Factura y proforma</h4>
                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Opción</th>
                                        <th>Qué hace</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Facturar</td>
                                        <td>Registra la venta, descuenta stock, guarda el cobro en caja/cuenta y genera la factura.</td>
                                    </tr>
                                    <tr>
                                        <td>Proforma</td>
                                        <td>Solo imprime un documento de cotización. No afecta stock, caja ni cuentas por cobrar.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <h4>Pago incompleto: precio de liquidación</h4>
                        <p>
                            Si el efectivo recibido es menor al total, el sistema abre la ventana
                            <strong>“Precio de liquidación para esta venta”</strong>. Puedes bajar el precio de cada producto,
                            nunca subirlo por encima del precio de catálogo. El total ajustado es el que queda registrado en caja.
                        </p>

                        <h4>Venta a plazos</h4>
                        <ul>
                            <li>Cambia la modalidad de venta a <strong>Plazos</strong>.</li>
                            <li>Indica el <strong>abono inicial</strong> (puede ser cero) y, si aplica, un descuento.</li>
                            <li>Programa las cuotas con su fecha de vencimiento y monto. El sistema valida que la suma coincida con el saldo financiado.</li>
                            <li>El saldo pendiente se controla en <strong>Cuentas por cobrar</strong>.</li>
                        </ul>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo de venta a plazos</strong>
                                <p>Venta de C$ 1,000 con abono inicial de C$ 200 y 4 cuotas de C$ 200. Al cobrar cada cuota, registra el abono en Cuentas por cobrar y el saldo baja automáticamente.</p>
                            </div>
                        </div>

                        <div class="manual-callout manual-callout--info">
                            <i class="ph ph-info"></i>
                            <div>
                                <strong>Al terminar el turno</strong>
                                <p>Cierra la caja para calcular el monto final y luego realiza el arqueo en el módulo <em>Cajas</em>.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_ventas', $permisos))
                    <article class="manual-card" id="ventas-lista">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-list-checks"></i></span>
                            <div>
                                <h3>Ventas</h3>
                                <p>Historial de ventas, detalle y anulaciones.</p>
                            </div>
                        </div>

                        <p>Muestra todas las ventas registradas. Cada fila incluye factura, cliente, usuario, caja, fecha, subtotal, impuesto, total, método de pago y estado.</p>

                        <h4>Acciones</h4>
                        <ul>
                            <li><i class="ph ph-eye"></i><strong>Detalle (ojo):</strong> Muestra los productos, las cantidades, los precios y los totales de la venta.</li>
                            <li><i class="ph ph-x-circle"></i><strong>Anular:</strong> Devuelve el stock y revierte los movimientos de caja o cuenta. La venta queda con estado <em>anulada</em>; no se borra del historial.</li>
                        </ul>

                        <div class="manual-callout manual-callout--warning">
                            <i class="ph ph-warning"></i>
                            <div>
                                <strong>Antes de anular</strong>
                                <p>Verifica que la venta no tenga abonos o cuotas pagadas. Si la venta fue a plazos, primero revisa su estado en Cuentas por cobrar.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_cuentas_por_cobrar', $permisos))
                    <article class="manual-card" id="cuentas-por-cobrar">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-calendar-check"></i></span>
                            <div>
                                <h3>Cuentas por cobrar</h3>
                                <p>Seguimiento de ventas a plazos y abonos.</p>
                            </div>
                        </div>

                        <p>
                            Aquí se administran las ventas a plazos: cuánto se debe, qué cuotas están vencidas y qué abonos
                            se han recibido.
                        </p>

                        <h4>Estados</h4>
                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Estado</th>
                                        <th>Significado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><span class="manual-badge manual-badge--rojo"><i class="ph ph-warning-circle"></i> Atrasada</span></td>
                                        <td>Tiene al menos una cuota vencida sin pagar.</td>
                                    </tr>
                                    <tr>
                                        <td><span class="manual-badge"><i class="ph ph-clock"></i> Pendiente</span></td>
                                        <td>No se ha recibido ningún abono.</td>
                                    </tr>
                                    <tr>
                                        <td><span class="manual-badge manual-badge--azul"><i class="ph ph-circle-half"></i> Parcial</span></td>
                                        <td>Se recibieron abonos, pero todavía queda saldo.</td>
                                    </tr>
                                    <tr>
                                        <td><span class="manual-badge manual-badge--verde"><i class="ph ph-check-circle"></i> Pagada</span></td>
                                        <td>El saldo llegó a cero.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <h4>Registrar un abono</h4>
                        <ol class="manual-steps">
                            <li>Abre el detalle de la cuenta por cobrar y pulsa <strong>Registrar abono</strong>.</li>
                            <li>Escribe el <strong>importe recibido</strong>. Debe ser mayor que cero y no superar el saldo pendiente.</li>
                            <li>Selecciona el <strong>método de pago</strong> y la <strong>cuenta receptora</strong>.</li>
                            <li>Agrega una <strong>referencia</strong> si lo necesitas (número de transferencia, recibo, etc.).</li>
                        </ol>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>Saldo pendiente de C$ 800. Registras un abono de C$ 200: la primera cuota queda pagada y el saldo baja a C$ 600.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_clientes', $permisos))
                    <article class="manual-card" id="clientes">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-users"></i></span>
                            <div>
                                <h3>Clientes</h3>
                                <p>Datos de las personas o empresas que compran.</p>
                            </div>
                        </div>

                        <p>El cliente es obligatorio para facturar y es la base de las cuentas por cobrar y de los reportes de ventas por cliente.</p>

                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Campo</th>
                                        <th>Para qué sirve</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Nombre</td><td>Nombre completo o razón social.</td></tr>
                                    <tr><td>Cédula</td><td>Identificación personal (opcional si es empresa).</td></tr>
                                    <tr><td>RUC</td><td>Registro tributario, usado en la factura.</td></tr>
                                    <tr><td>Teléfono</td><td>Contacto del cliente.</td></tr>
                                    <tr><td>Correo</td><td>Correo para envíos o referencias.</td></tr>
                                    <tr><td>Dirección</td><td>Dirección de entrega o fiscal.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>Registra “Comercial López” con RUC y dirección. Al facturar, solo tendrás que seleccionarlo en la lista y la factura saldrá con sus datos.</p>
                            </div>
                        </div>
                    </article>
                @endif
            </section>
        @endif

        {{-- ═════════════ COMPRAS ═════════════ --}}

        @if($puede('vista_crear_compras', 'vista_compras', 'vista_proveedores'))
            <section class="manual-group" id="compras">
                <div class="manual-group__head">
                    <i class="ph ph-shopping-cart"></i>
                    <h2>Compras</h2>
                </div>

                <div class="manual-chips">
                    @if(in_array('vista_crear_compras', $permisos))<a href="#crear-compra">Crear compra</a>@endif
                    @if(in_array('vista_compras', $permisos))<a href="#compras-lista">Lista de compras</a>@endif
                    @if(in_array('vista_proveedores', $permisos))<a href="#proveedores">Proveedores</a>@endif
                </div>

                @if(in_array('vista_crear_compras', $permisos))
                    <article class="manual-card" id="crear-compra">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-shopping-cart-simple"></i></span>
                            <div>
                                <h3>Crear compra</h3>
                                <p>Entrada de mercadería, actualización de stock y salida de dinero.</p>
                            </div>
                        </div>

                        <p>
                            Al registrar una compra, el sistema suma el stock, guarda el costo unitario, crea el movimiento
                            de inventario (entrada) y registra el pago en la caja o cuenta seleccionada.
                        </p>

                        <h4>Campos principales</h4>
                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Campo</th>
                                        <th>Qué significa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Proveedor</td><td>A quién se compra. Debe estar registrado.</td></tr>
                                    <tr><td>N° Factura</td><td>Número del documento del proveedor.</td></tr>
                                    <tr><td>Tipo de factura</td><td>Clasificación de la compra (contado, crédito, etc.).</td></tr>
                                    <tr><td>Método de pago</td><td>Cómo se paga: efectivo, transferencia, tarjeta, etc.</td></tr>
                                    <tr><td>Tipo de pago</td><td>Indica si el dinero sale de <strong>Caja</strong> o de una <strong>Cuenta</strong>.</td></tr>
                                    <tr><td>Producto y cantidad</td><td>Qué se recibe y cuántas unidades.</td></tr>
                                    <tr><td>Descuento</td><td>Rebaja aplicada por el proveedor.</td></tr>
                                    <tr><td>IVA incluido</td><td>Si está marcado, los precios ya incluyen impuesto; si no, se suma al total.</td></tr>
                                    <tr><td>Total</td><td>Monto final de la compra.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>10 camisas a C$ 100 cada una, IVA 15% e IVA incluido desmarcado: subtotal C$ 1,000, impuesto C$ 150, total C$ 1,150. El stock de cada camisa sube 10 unidades y se registra una entrada en el Kardex.</p>
                            </div>
                        </div>

                        <div class="manual-callout manual-callout--info">
                            <i class="ph ph-info"></i>
                            <div>
                                <strong>Producto nuevo durante la compra</strong>
                                <p>Si el producto no existe, puedes crearlo desde el mismo formulario con el botón de crear producto. Quedará asociado a la compra al guardar.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_compras', $permisos))
                    <article class="manual-card" id="compras-lista">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-list-checks"></i></span>
                            <div>
                                <h3>Lista de compras</h3>
                                <p>Historial, detalle y anulación de compras.</p>
                            </div>
                        </div>

                        <p>Cada compra muestra factura, proveedor, usuario, fecha, subtotal, descuento, impuesto, total, método de pago y estado.</p>
                        <ul>
                            <li><i class="ph ph-eye"></i><strong>Detalle:</strong> Muestra los productos recibidos, las cantidades y los costos.</li>
                            <li><i class="ph ph-x-circle"></i><strong>Anular:</strong> Revierte el stock y el movimiento de dinero asociado. La compra queda registrada como anulada.</li>
                        </ul>
                    </article>
                @endif

                @if(in_array('vista_proveedores', $permisos))
                    <article class="manual-card" id="proveedores">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-truck"></i></span>
                            <div>
                                <h3>Proveedores</h3>
                                <p>Empresas o personas que abastecen el negocio.</p>
                            </div>
                        </div>

                        <p>El proveedor es obligatorio al registrar una compra y permite filtrar compras y costos por origen.</p>

                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Campo</th>
                                        <th>Para qué sirve</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Nombre</td><td>Nombre o razón social del proveedor.</td></tr>
                                    <tr><td>Tipo de proveedor</td><td>Clasificación (distribuidor, mayorista, etc.).</td></tr>
                                    <tr><td>RUC</td><td>Registro tributario.</td></tr>
                                    <tr><td>Teléfono / Correo / Dirección</td><td>Datos de contacto y entrega.</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </article>
                @endif
            </section>
        @endif

        {{-- ═════════════ CAJA ═════════════ --}}

        @if($puede('vista_cajas', 'vista_movimientos_cajas'))
            <section class="manual-group" id="caja">
                <div class="manual-group__head">
                    <i class="ph ph-wallet"></i>
                    <h2>Caja</h2>
                </div>

                <div class="manual-chips">
                    @if(in_array('vista_cajas', $permisos))<a href="#cajas">Cajas y arqueos</a>@endif
                    @if(in_array('vista_movimientos_cajas', $permisos))<a href="#movimientos-caja">Movimientos de caja</a>@endif
                </div>

                @if(in_array('vista_cajas', $permisos))
                    <article class="manual-card" id="cajas">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-wallet"></i></span>
                            <div>
                                <h3>Cajas y arqueos</h3>
                                <p>Control del efectivo de cada turno.</p>
                            </div>
                        </div>

                        <p>
                            La caja controla el efectivo de cada turno: se abre con un fondo, se cierra al terminar
                            y se arquea contando el dinero real.
                        </p>

                        <h4>Ciclo de una caja</h4>
                        <ol class="manual-steps">
                            <li><strong>Abrir caja:</strong> Se indica el monto inicial en efectivo (fondo para vueltos).</li>
                            <li><strong>Operar:</strong> Las ventas en efectivo y los gastos pagados con caja entran y salen de ese turno.</li>
                            <li><strong>Cerrar caja:</strong> Guarda el monto final del sistema.</li>
                            <li><strong>Arquear:</strong> Se escribe el efectivo realmente contado y el sistema calcula la diferencia.</li>
                        </ol>

                        <h4>Estados de la caja</h4>
                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Estado</th>
                                        <th>Significado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td><span class="manual-badge manual-badge--verde"><i class="ph ph-lock-open"></i> Abierta</span></td><td>El turno sigue activo; se pueden facturar ventas en efectivo.</td></tr>
                                    <tr><td><span class="manual-badge"><i class="ph ph-hourglass"></i> Pendiente</span></td><td>La caja ya cerró, pero aún no tiene arqueo.</td></tr>
                                    <tr><td><span class="manual-badge manual-badge--azul"><i class="ph ph-check-circle"></i> Arqueada</span></td><td>Ya se registró el efectivo contado y su diferencia.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <h4>Diferencia del arqueo</h4>
                        <div class="manual-formula">Diferencia = Efectivo contado − Monto teórico</div>
                        <ul>
                            <li><i class="ph ph-plus-circle"></i><strong>Positiva (+):</strong> Sobrante de efectivo.</li>
                            <li><i class="ph ph-minus-circle"></i><strong>Negativa (−):</strong> Faltante de efectivo.</li>
                            <li><i class="ph ph-check-circle"></i><strong>Cero:</strong> La caja cuadra.</li>
                        </ul>

                        <h4>Arqueo múltiple</h4>
                        <p>
                            Permite seleccionar varias cajas y registrar un solo conteo. La diferencia total se asigna a la
                            primera caja del lote y las demás quedan con su monto teórico. Úsalo cuando cierras varios turnos
                            al mismo tiempo.
                        </p>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo de arqueo</strong>
                                <p>Caja con inicial de C$ 1,000, ventas en efectivo de C$ 2,500 y un gasto pagado con caja de C$ 200: el teórico es C$ 3,300. Si contaste C$ 3,250, hay un faltante de C$ 50.</p>
                            </div>
                        </div>

                        <p>
                            El botón de impresión genera el comprobante del arqueo. Recuerda que la transferencia del saldo de
                            caja a una cuenta se hace desde el módulo <strong>Transferencias → Caja → Cuenta</strong>.
                        </p>
                    </article>
                @endif

                @if(in_array('vista_movimientos_cajas', $permisos))
                    <article class="manual-card" id="movimientos-caja">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-money"></i></span>
                            <div>
                                <h3>Movimientos de caja</h3>
                                <p>Todos los ingresos y salidas de efectivo.</p>
                            </div>
                        </div>

                        <p>Registra cada entrada o salida de dinero de una caja, con su tipo, monto, concepto y usuario.</p>

                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Columna</th>
                                        <th>Qué muestra</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Tipo</td><td>Entrada (ingreso) o salida (pago o transferencia).</td></tr>
                                    <tr><td>Monto</td><td>Dinero que entró o salió.</td></tr>
                                    <tr><td>Concepto</td><td>Motivo del movimiento: venta, gasto, transferencia, etc.</td></tr>
                                    <tr><td>Caja</td><td>Turno al que pertenece el movimiento.</td></tr>
                                    <tr><td>Cuenta destino</td><td>Cuenta que recibió el dinero, si fue una transferencia.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>Una venta en efectivo aparece como <em>entrada</em>; el pago de la luz con caja aparece como <em>salida</em> con concepto de gasto.</p>
                            </div>
                        </div>
                    </article>
                @endif
            </section>
        @endif

        {{-- ═════════════ CUENTAS ═════════════ --}}

        @if($puede('vista_cuentas', 'vista_movimientos_cuentas', 'vista_transferenciacajacuenta'))
            <section class="manual-group" id="cuentas">
                <div class="manual-group__head">
                    <i class="ph ph-bank"></i>
                    <h2>Cuentas</h2>
                </div>

                <div class="manual-chips">
                    @if(in_array('vista_cuentas', $permisos))<a href="#cuentas-lista">Cuentas</a>@endif
                    @if(in_array('vista_movimientos_cuentas', $permisos))<a href="#movimientos-cuenta">Movimientos de cuenta</a>@endif
                    @if(in_array('vista_transferenciacajacuenta', $permisos))<a href="#transferencia-caja-cuenta">Caja → Cuenta</a>@endif
                </div>

                @if(in_array('vista_cuentas', $permisos))
                    <article class="manual-card" id="cuentas-lista">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-bank"></i></span>
                            <div>
                                <h3>Cuentas</h3>
                                <p>Los “bolsillos” donde se guarda el dinero del negocio.</p>
                            </div>
                        </div>

                        <p>
                            Una cuenta puede representar la caja general, una cuenta bancaria, una reserva para impuestos o
                            un fondo de ahorro. Cada movimiento que entra o sale actualiza su saldo.
                        </p>

                        <h4>Tipos de cuenta</h4>
                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Uso típico</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td><i class="ph ph-wallet"></i> CAJA</td><td>Dinero en efectivo de operación diaria.</td></tr>
                                    <tr><td><i class="ph ph-hand-coins"></i> PAGOS</td><td>Cuenta para pagar proveedores o compromisos.</td></tr>
                                    <tr><td><i class="ph ph-receipt"></i> GASTOS</td><td>Fondo destinado a gastos operativos.</td></tr>
                                    <tr><td><i class="ph ph-percent"></i> IMPUESTOS</td><td>Dinero apartado para obligaciones fiscales.</td></tr>
                                    <tr><td><i class="ph ph-piggy-bank"></i> AHORRO</td><td>Fondo de ahorro.</td></tr>
                                    <tr><td><i class="ph ph-shield-check"></i> RESERVA</td><td>Dinero reservado para contingencias.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <h4>Campos</h4>
                        <ul>
                            <li><strong>Saldo inicial:</strong> Dinero con el que nace la cuenta.</li>
                            <li><strong>Saldo actual:</strong> Saldo inicial más entradas menos salidas y transferencias.</li>
                            <li><strong>Descripción:</strong> Nota para identificar la cuenta.</li>
                        </ul>

                        <h4>Transferir entre cuentas</h4>
                        <p>
                            Selecciona la cuenta origen y destino, escribe el monto y un concepto. La operación descuenta de
                            una cuenta, suma a la otra y deja un movimiento por cada lado.
                        </p>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>Transfieres C$ 5,000 de “Caja General” a “BAC”: Caja General baja C$ 5,000 y BAC sube C$ 5,000. El total del negocio no cambia, solo se mueve de lugar.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_movimientos_cuentas', $permisos))
                    <article class="manual-card" id="movimientos-cuenta">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-arrows-left-right"></i></span>
                            <div>
                                <h3>Movimientos de cuenta</h3>
                                <p>Historial de entradas, salidas y transferencias por cuenta.</p>
                            </div>
                        </div>

                        <p>Cada movimiento indica la cuenta, el tipo, la descripción, el monto, el usuario y la fecha. Es la forma de auditar de dónde salió o entró cada córdoba.</p>

                        <div class="manual-callout manual-callout--info">
                            <i class="ph ph-info"></i>
                            <div>
                                <strong>Para cuadrar una cuenta</strong>
                                <p>Suma las entradas, resta las salidas y compara el resultado con el saldo actual. Si no coincide, revisa los movimientos de transferencia y los gastos pagados con esa cuenta.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_transferenciacajacuenta', $permisos))
                    <article class="manual-card" id="transferencia-caja-cuenta">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-swap"></i></span>
                            <div>
                                <h3>Transferencia Caja → Cuenta</h3>
                                <p>Pasar el efectivo del cierre de caja a una cuenta.</p>
                            </div>
                        </div>

                        <p>
                            Se usa después de cerrar una caja para depositar el efectivo en el banco o moverlo a otra cuenta.
                            Solo aparecen cajas cerradas con saldo disponible.
                        </p>

                        <h4>Campos</h4>
                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Campo</th>
                                        <th>Qué significa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Saldo</td><td>Efectivo disponible de la caja después de lo ya transferido.</td></tr>
                                    <tr><td>Transferido</td><td>Total que ya se pasó a cuentas desde esa caja.</td></tr>
                                    <tr><td>Monto</td><td>Cuánto se transfiere ahora. No puede superar el saldo.</td></tr>
                                    <tr><td>Saldo restante</td><td>Lo que quedará en la caja después de la transferencia.</td></tr>
                                    <tr><td>Cuenta destino</td><td>Cuenta que recibe el dinero.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>Caja cerrada con saldo de C$ 3,000. Transfieres C$ 2,500 a BAC: el saldo restante de la caja queda en C$ 500 y BAC recibe C$ 2,500.</p>
                            </div>
                        </div>

                        <p>El botón <strong>detalle</strong> muestra el historial de transferencias de cada caja: usuario, monto, cuenta y fecha.</p>
                    </article>
                @endif
            </section>
        @endif

        {{-- ═════════════ GASTOS ═════════════ --}}

        @if($puede('vista_gastos', 'vista_tipos_gasto', 'vista_movimientos_gastos'))
            <section class="manual-group" id="gastos">
                <div class="manual-group__head">
                    <i class="ph ph-receipt-x"></i>
                    <h2>Gastos</h2>
                </div>

                <div class="manual-chips">
                    @if(in_array('vista_gastos', $permisos))<a href="#gastos-lista">Gastos</a>@endif
                    @if(in_array('vista_tipos_gasto', $permisos))<a href="#tipos-gasto">Tipos de gasto</a>@endif
                    @if(in_array('vista_movimientos_gastos', $permisos))<a href="#movimientos-gasto">Movimientos de gastos</a>@endif
                </div>

                @if(in_array('vista_gastos', $permisos))
                    <article class="manual-card" id="gastos-lista">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-receipt-x"></i></span>
                            <div>
                                <h3>Gastos</h3>
                                <p>Obligaciones y pagos que no son mercadería.</p>
                            </div>
                        </div>

                        <p>
                            Sirve para registrar la renta, la luz, el agua, internet, servicios y cualquier salida de dinero
                            que no sea una compra de inventario.
                        </p>

                        <h4>Campos</h4>
                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Campo</th>
                                        <th>Qué significa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Nombre</td><td>Descripción corta del gasto (por ejemplo, “Pago de luz”).</td></tr>
                                    <tr><td>Tipo de gasto</td><td>Categoría del gasto (servicios, renta, mantenimiento, etc.).</td></tr>
                                    <tr><td>Fecha de pago</td><td>Cuándo vence o debe pagarse. Es opcional: puedes dejarla vacía si el gasto es irregular.</td></tr>
                                    <tr><td>Estado de pago</td><td>Si está pendiente o ya pagado.</td></tr>
                                    <tr><td>Monto</td><td>Importe del gasto.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <h4>Pagar un gasto</h4>
                        <ol class="manual-steps">
                            <li>Abre el gasto y pulsa <strong>Pagar</strong>.</li>
                            <li>Escribe el <strong>monto a pagar</strong> (puede ser un pago parcial y distinto cada vez).</li>
                            <li>Indica si se paga con <strong>Caja</strong> o con una <strong>Cuenta</strong>.</li>
                            <li>Elige el <strong>próximo vencimiento</strong>: <em>Sin próxima fecha</em> si no sabes cuándo será el siguiente pago, automático (+1 mes) o una fecha manual.</li>
                        </ol>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Gastos irregulares</strong>
                                <p>Puedes pagar C$ 350 hoy, C$ 200 la próxima semana y otro monto dentro de 15 días. Cada pago queda registrado en el historial y no es obligatorio programar la siguiente fecha.</p>
                            </div>
                        </div>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>El recibo de luz vence el 30 y se paga desde la cuenta “Gastos”. Al registrar el pago, el gasto cambia a pagado y se crea el movimiento de salida correspondiente.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_tipos_gasto', $permisos))
                    <article class="manual-card" id="tipos-gasto">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-tag"></i></span>
                            <div>
                                <h3>Tipos de gasto</h3>
                                <p>Catálogo para clasificar los gastos.</p>
                            </div>
                        </div>

                        <p>Agrupa los gastos por categoría para que los reportes y las consultas sean claros. Ejemplos: Servicios básicos, Renta, Mantenimiento, Publicidad, Salarios.</p>

                        <div class="manual-callout manual-callout--info">
                            <i class="ph ph-info"></i>
                            <div>
                                <strong>Consejo</strong>
                                <p>Crea primero los tipos de gasto y luego registra los gastos. Si un tipo deja de usarse, se inactiva; no se elimina.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_movimientos_gastos', $permisos))
                    <article class="manual-card" id="movimientos-gasto">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-list-dashes"></i></span>
                            <div>
                                <h3>Movimientos de gastos</h3>
                                <p>Historial de los pagos realizados.</p>
                            </div>
                        </div>

                        <p>Muestra fecha, gasto, monto, origen (caja o cuenta), caja, cuenta, usuario y observación. Sirve para auditar cuánto se ha pagado por cada gasto y de dónde salió el dinero.</p>
                    </article>
                @endif
            </section>
        @endif

        {{-- ═════════════ INVENTARIO ═════════════ --}}

        @if($puede('vista_productos', 'vista_categorias', 'vista_ubicaciones', 'vista_producto_variaciones', 'vista_producto_variaciones_detalle', 'vista_tallas', 'vista_tipos_medidas', 'vista_medidas', 'vista_movimientos_inventario'))
            <section class="manual-group" id="inventario">
                <div class="manual-group__head">
                    <i class="ph ph-package"></i>
                    <h2>Inventario</h2>
                </div>

                <div class="manual-chips">
                    @if(in_array('vista_productos', $permisos))<a href="#productos">Productos</a>@endif
                    @if(in_array('vista_categorias', $permisos))<a href="#categorias">Categorías</a>@endif
                    @if(in_array('vista_ubicaciones', $permisos))<a href="#ubicaciones">Ubicaciones</a>@endif
                    @if(in_array('vista_producto_variaciones', $permisos))<a href="#variaciones">Variaciones</a>@endif
                    @if(in_array('vista_producto_variaciones_detalle', $permisos))<a href="#detalle-variacion">Detalle de variación</a>@endif
                    @if(in_array('vista_tallas', $permisos))<a href="#tallas">Tallas</a>@endif
                    @if(in_array('vista_tipos_medidas', $permisos))<a href="#tipos-medidas">Tipos de medidas</a>@endif
                    @if(in_array('vista_medidas', $permisos))<a href="#medidas">Medidas</a>@endif
                    @if(in_array('vista_movimientos_inventario', $permisos))<a href="#movimientos-inventario">Movimientos de inventario</a>@endif
                </div>

                @if(in_array('vista_productos', $permisos))
                    <article class="manual-card" id="productos">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-package"></i></span>
                            <div>
                                <h3>Productos</h3>
                                <p>El catálogo central: precios, impuesto, stock y clasificación.</p>
                            </div>
                        </div>

                        <p>
                            Todo lo que vendes o compras nace aquí. Un producto bien configurado evita errores de precio,
                            impuesto y stock en las ventas.
                        </p>

                        <h4>Campos del producto</h4>
                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Campo</th>
                                        <th>Qué significa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Nombre</td><td>Nombre comercial del producto.</td></tr>
                                    <tr><td>Descripción</td><td>Detalle adicional (material, presentación, etc.).</td></tr>
                                    <tr><td>Categoría</td><td>Grupo al que pertenece. Sirve para filtrar y reportar.</td></tr>
                                    <tr><td>Medida</td><td>Unidad en que se vende (unidad, kg, litro, etc.).</td></tr>
                                    <tr><td>Ubicación</td><td>Dónde está físicamente (bodega, estante, sucursal).</td></tr>
                                    <tr><td>Impuesto</td><td>Porcentaje que se aplica al precio de venta (por ejemplo, IVA 15%).</td></tr>
                                    <tr><td>Precio compra</td><td>Lo que te cuesta adquirir una unidad.</td></tr>
                                    <tr><td>% Venta</td><td>Margen que quieres ganar sobre el costo. Al activarlo, calcula el precio de venta automáticamente.</td></tr>
                                    <tr><td>Precio venta</td><td>Precio base <strong>sin impuesto</strong>.</td></tr>
                                    <tr><td>Ganancia</td><td>Diferencia entre el precio de venta y el costo.</td></tr>
                                    <tr><td>Precio total (+IVA)</td><td>Precio final que paga el cliente, con impuesto incluido.</td></tr>
                                    <tr><td>Stock</td><td>Unidades disponibles. Los movimientos lo actualizan.</td></tr>
                                    <tr><td>Imagen</td><td>Foto que se muestra en el catálogo y el punto de venta.</td></tr>
                                    <tr><td>Estado</td><td>Activo o inactivo.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <h4>Cómo se calculan los precios</h4>
                        <div class="manual-formula">
                            Precio venta = Precio compra × (1 + % Venta / 100)<br>
                            Precio total (+IVA) = Precio venta × (1 + Impuesto / 100)<br>
                            Ganancia = Precio venta − Precio compra
                        </div>

                        <h4>¿Qué es el “P.V. Final”?</h4>
                        <p>
                            Es el <strong>precio de venta con impuesto incluido</strong>, es decir, lo que realmente paga el
                            cliente. En la tabla de productos aparece como <strong>P.V.Final</strong> y se calcula con el
                            impuesto asignado al producto.
                        </p>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo completo</strong>
                                <p>
                                    Compra: C$ 100.00 · % Venta: 25% · Impuesto: IVA 15%.<br>
                                    Precio venta = 100 × 1.25 = <strong>C$ 125.00</strong>.<br>
                                    Precio total (+IVA) = 125 × 1.15 = <strong>C$ 143.75</strong>.<br>
                                    Ganancia = 125 − 100 = <strong>C$ 25.00</strong> (25% sobre el costo).
                                </p>
                            </div>
                        </div>

                        <h4>Redondeo del precio final</h4>
                        <p>
                            La casilla <strong>Redondeo</strong> sube el precio total al siguiente número entero y recalcula
                            la base sin IVA para que la suma siga cuadrando. Ejemplo: un total de C$ 143.20 pasa a
                            C$ 144.00 y el precio base se ajusta a C$ 125.22.
                        </p>

                        <h4>Editar el stock</h4>
                        <ul>
                            <li>Si cambias el stock, el sistema registra un movimiento de <strong>AJUSTE</strong> con el motivo indicado.</li>
                            <li>Si el producto tiene tallas, puedes distribuir la baja por talla; el stock total no puede quedar negativo.</li>
                            <li>Las compras generan <strong>ENTRADA</strong> y las ventas generan <strong>SALIDA</strong> automáticamente.</li>
                        </ul>

                        <div class="manual-callout manual-callout--warning">
                            <i class="ph ph-warning"></i>
                            <div>
                                <strong>Producto inactivo</strong>
                                <p>Deja de aparecer en facturación y en los selects de venta, pero conserva ventas, compras y movimientos históricos.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_categorias', $permisos))
                    <article class="manual-card" id="categorias">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-tag"></i></span>
                            <div>
                                <h3>Categorías</h3>
                                <p>Agrupar productos para encontrarlos y reportarlos mejor.</p>
                            </div>
                        </div>

                        <p>
                            La categoría no cambia precios ni stock: solo clasifica. Sirve para filtrar la tabla de productos,
                            armar reportes por rubro y encontrar rápido lo que buscas.
                        </p>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>Categorías “Camisas”, “Pantalones” y “Accesorios”. En el reporte de inventario puedes ver cuánto stock hay en cada rubro.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_ubicaciones', $permisos))
                    <article class="manual-card" id="ubicaciones">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-map-pin"></i></span>
                            <div>
                                <h3>Ubicaciones</h3>
                                <p>Dónde está guardado el producto.</p>
                            </div>
                        </div>

                        <p>Sirve para saber en qué bodega, estante o sucursal se encuentra cada producto. No controla stock por separado; es una referencia física para el personal.</p>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>“Bodega principal”, “Estante 3” o “Sucursal centro”. Al buscar un producto, la ubicación indica dónde ir a buscarlo.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_producto_variaciones', $permisos))
                    <article class="manual-card" id="variaciones">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-squares-four"></i></span>
                            <div>
                                <h3>Variaciones de productos</h3>
                                <p>Colores de un mismo producto.</p>
                            </div>
                        </div>

                        <p>
                            Una variación es una versión del producto, normalmente por <strong>color</strong>. Cada variación
                            tiene sus propias imágenes, tallas, SKU y precios. El producto padre mantiene el stock total.
                        </p>

                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Campo</th>
                                        <th>Qué significa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Producto</td><td>Producto al que pertenece la variación.</td></tr>
                                    <tr><td>Color</td><td>Color o nombre de la variación (Rojo, Azul, Negro...).</td></tr>
                                    <tr><td>Imágenes</td><td>Fotos propias de esa variación.</td></tr>
                                    <tr><td>Tallas</td><td>Tallas disponibles y su stock.</td></tr>
                                    <tr><td>Estado</td><td>Activa o inactiva.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>“Camisa Polo” con variaciones Rojo y Azul. Cada color tiene sus fotos y sus tallas; al vender, eliges color y talla.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_producto_variaciones_detalle', $permisos))
                    <article class="manual-card" id="detalle-variacion">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-list-dashes"></i></span>
                            <div>
                                <h3>Detalle de variación</h3>
                                <p>Tallas, stock, SKU, precios e imágenes de cada color.</p>
                            </div>
                        </div>

                        <p>
                            Aquí terminas de dejar lista cada variación: le agregas tallas, asignas stock, revisas los
                            precios y ordenas las imágenes. Cuando está completa, ya puedes venderla en facturación.
                        </p>

                        <h4>Tallas de la variación</h4>

                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Campo</th>
                                        <th>Qué significa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Talla</td><td>Talla del catálogo (S, M, L, 39...).</td></tr>
                                    <tr><td>Stock</td><td>Unidades disponibles de esa talla. La suma de tallas no puede superar el stock del producto.</td></tr>
                                    <tr><td>SKU</td><td>Código único de la talla; se genera y no se edita manualmente.</td></tr>
                                    <tr><td>Precio compra</td><td>Costo de esa talla (puede variar entre tallas).</td></tr>
                                    <tr><td>Precio venta</td><td>Precio base sin impuesto para esa talla.</td></tr>
                                    <tr><td>Precio final</td><td>Precio con impuesto aplicado.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <h4>Imágenes</h4>
                        <ul>
                            <li><i class="ph ph-images"></i>Agrega varias imágenes desde la galería de la variación.</li>
                            <li><i class="ph ph-arrows-left-right"></i><strong>Arrastra</strong> una imagen para cambiar el orden: el orden define la imagen principal.</li>
                            <li><i class="ph ph-pencil-simple"></i>El lápiz reemplaza la imagen; el basurero la elimina directamente.</li>
                        </ul>

                        <div class="manual-callout manual-callout--info">
                            <i class="ph ph-info"></i>
                            <div>
                                <strong>Al subir imágenes</strong>
                                <p>Verás el aviso “Sus imágenes se están comprimiendo, espere un momento...”. Es normal: el sistema optimiza las fotos antes de guardarlas.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_tallas', $permisos))
                    <article class="manual-card" id="tallas">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-ruler"></i></span>
                            <div>
                                <h3>Tallas</h3>
                                <p>Catálogo de tallas disponibles.</p>
                            </div>
                        </div>

                        <p>
                            Las tallas se crean una vez y se reutilizan en todas las variaciones. Cada talla muestra cuántas
                            variantes la están usando.
                        </p>

                        <ul>
                            <li>Si una talla está en uso, no se borra: se inactiva.</li>
                            <li>Al crear una talla nueva, aparece disponible en “Agregar talla” de cada variación.</li>
                        </ul>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>Creas las tallas S, M, L y XL. Luego, en la variación “Camisa Polo Rojo”, asignas solo las tallas que existen físicamente.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_tipos_medidas', $permisos))
                    <article class="manual-card" id="tipos-medidas">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-ruler"></i></span>
                            <div>
                                <h3>Tipos de medidas</h3>
                                <p>Familias de unidades de medida.</p>
                            </div>
                        </div>

                        <p>
                            Agrupan unidades por familia: Peso, Volumen, Longitud, Unidad, etc. Sirven para ordenar las
                            medidas que luego se asignan a los productos.
                        </p>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>Tipo “Peso” agrupa las medidas kg, lb y g. Tipo “Volumen” agrupa L, ml y galón.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_medidas', $permisos))
                    <article class="manual-card" id="medidas">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-ruler"></i></span>
                            <div>
                                <h3>Medidas</h3>
                                <p>Unidades concretas que se asignan al producto.</p>
                            </div>
                        </div>

                        <p>
                            Una medida es la unidad concreta con la que vendes: kilogramo, litro, unidad, etc.
                            Se asigna al producto y se organiza dentro de un tipo de medida.
                        </p>

                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Campo</th>
                                        <th>Qué significa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Tipo de medida</td><td>Familia a la que pertenece (Peso, Volumen...).</td></tr>
                                    <tr><td>Nombre</td><td>Nombre de la unidad (kilogramo, litro...).</td></tr>
                                    <tr><td>Abreviatura</td><td>Cómo se muestra en pantalla: kg, L, unidad.</td></tr>
                                    <tr><td>Orden</td><td>Posición en que aparece dentro de su tipo.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>Producto “Azúcar”: tipo Peso, medida kg. Producto “Refresco”: tipo Volumen, medida litro.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_movimientos_inventario', $permisos))
                    <article class="manual-card" id="movimientos-inventario">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-arrows-left-right"></i></span>
                            <div>
                                <h3>Movimientos de inventario (Kardex)</h3>
                                <p>Historial de todo lo que entró y salió del stock.</p>
                            </div>
                        </div>

                        <p>
                            Es la trazabilidad del inventario: cada compra, venta o ajuste queda registrado con su cantidad,
                            stock resultante y costo.
                        </p>

                        <h4>Tipos de movimiento</h4>
                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Origen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td><span class="manual-badge manual-badge--verde"><i class="ph ph-arrow-down"></i> ENTRADA</span></td><td>Compras o aumentos de stock.</td></tr>
                                    <tr><td><span class="manual-badge manual-badge--rojo"><i class="ph ph-arrow-up"></i> SALIDA</span></td><td>Ventas o disminuciones de stock.</td></tr>
                                    <tr><td><span class="manual-badge"><i class="ph ph-wrench"></i> AJUSTE</span></td><td>Corrección manual del stock con su motivo.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <h4>Columnas</h4>
                        <ul>
                            <li><strong>Producto / Variación:</strong> Qué artículo y color se movió.</li>
                            <li><strong>Motivo:</strong> Razón del movimiento.</li>
                            <li><strong>Cantidad:</strong> Unidades que entraron o salieron.</li>
                            <li><strong>Stock actual:</strong> Existencia después del movimiento.</li>
                            <li><strong>Precio y total vendido:</strong> Valorización del movimiento.</li>
                        </ul>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>Compra de 10 camisas: se registra una ENTRADA de 10 y el stock pasa de 5 a 15. Venta de 2: se registra una SALIDA de 2 y el stock queda en 13.</p>
                            </div>
                        </div>
                    </article>
                @endif
            </section>
        @endif

        {{-- ═════════════ ADMINISTRACIÓN ═════════════ --}}

        @if($puede('vista_usuarios', 'vista_roles', 'vista_permisos'))
            <section class="manual-group" id="administracion">
                <div class="manual-group__head">
                    <i class="ph ph-users-three"></i>
                    <h2>Administración</h2>
                </div>

                <div class="manual-chips">
                    @if(in_array('vista_usuarios', $permisos))<a href="#usuarios">Usuarios</a>@endif
                    @if(in_array('vista_roles', $permisos))<a href="#roles">Roles</a>@endif
                    @if(in_array('vista_permisos', $permisos))<a href="#permisos">Permisos</a>@endif
                </div>

                @if(in_array('vista_usuarios', $permisos))
                    <article class="manual-card" id="usuarios">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-user-circle"></i></span>
                            <div>
                                <h3>Usuarios</h3>
                                <p>Personas que inician sesión en el sistema.</p>
                            </div>
                        </div>

                        <p>Cada usuario tiene un rol, y el rol define qué módulos y acciones puede usar.</p>

                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Campo</th>
                                        <th>Qué significa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Nombre completo</td><td>Nombre real de la persona.</td></tr>
                                    <tr><td>Cédula</td><td>Identificación del empleado.</td></tr>
                                    <tr><td>Nombre de usuario</td><td>Con el que inicia sesión.</td></tr>
                                    <tr><td>Rol</td><td>Conjunto de permisos (Administrador, Cajero, Bodeguero...).</td></tr>
                                    <tr><td>Contraseña</td><td>Mínimo 6 caracteres. En edición es opcional cambiarla.</td></tr>
                                    <tr><td>Estado</td><td>Activo puede iniciar sesión; inactivo no.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>“María López” con rol Cajero: puede facturar y cobrar, pero no administrar usuarios ni ver reportes si su rol no lo permite.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_roles', $permisos))
                    <article class="manual-card" id="roles">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-identification-badge"></i></span>
                            <div>
                                <h3>Roles</h3>
                                <p>Perfiles de acceso que agrupan permisos.</p>
                            </div>
                        </div>

                        <p>
                            Un rol es una plantilla de permisos. En lugar de asignar permisos uno por uno a cada usuario, se
                            asignan al rol y todos los usuarios de ese rol heredan el acceso.
                        </p>

                        <ul>
                            <li><strong>Nombre:</strong> Identifica el perfil (Administrador, Cajero, Bodeguero).</li>
                            <li><strong>Descripción:</strong> Para qué sirve el rol.</li>
                            <li><strong>Estado:</strong> Un rol inactivo no puede asignarse a nuevos usuarios.</li>
                        </ul>

                        <div class="manual-callout manual-callout--info">
                            <i class="ph ph-info"></i>
                            <div>
                                <strong>Buenas prácticas</strong>
                                <p>Crea roles por función y evita dar permisos de administración a quien solo necesita facturar. Así reduces errores y proteges la información.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_permisos', $permisos))
                    <article class="manual-card" id="permisos">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-shield-check"></i></span>
                            <div>
                                <h3>Permisos por rol</h3>
                                <p>Qué puede ver y hacer cada perfil.</p>
                            </div>
                        </div>

                        <p>
                            En este módulo se selecciona un rol y se marcan los permisos de cada módulo. Los cambios afectan
                            el menú lateral, el acceso a las pantallas y las acciones disponibles.
                        </p>

                        <h4>Cómo se usan</h4>
                        <ol class="manual-steps">
                            <li>Selecciona el rol en la lista.</li>
                            <li>Busca el permiso por nombre o acción.</li>
                            <li>Marca o desmarca los permisos del módulo.</li>
                            <li>Guarda los cambios. El usuario verá el efecto al volver a iniciar sesión.</li>
                        </ol>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>Al rol “Cajero” se le activan <code>vista_facturacion</code>, <code>usar_facturacion</code> y <code>vista_ventas</code>, pero no <code>vista_usuarios</code> ni <code>vista_reportes</code>. El cajero solo verá lo que necesita.</p>
                            </div>
                        </div>
                    </article>
                @endif
            </section>
        @endif

        {{-- ═════════════ REPORTES ═════════════ --}}

        @if(in_array('vista_reportes', $permisos))
            <section class="manual-group" id="reportes">
                <div class="manual-group__head">
                    <i class="ph ph-chart-bar"></i>
                    <h2>Reportes</h2>
                </div>

                <article class="manual-card" id="reportes-panel">
                    <div class="manual-card__head">
                        <span class="manual-card__icon"><i class="ph ph-chart-bar"></i></span>
                        <div>
                            <h3>Reportes y exportaciones</h3>
                            <p>Consultar información y descargarla en Excel o PDF.</p>
                        </div>
                    </div>

                    <p>
                        Los reportes te permiten consultar la información del negocio por periodo y descargarla
                        en Excel o PDF para revisarla con calma.
                    </p>

                    <h4>Tipos de reporte</h4>
                    <div class="manual-table-wrap">
                        <table class="manual-table">
                            <thead>
                                <tr>
                                    <th>Reporte</th>
                                    <th>Qué muestra</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Ventas</td><td>Ventas por periodo, cliente, usuario y totales.</td></tr>
                                <tr><td>Inventario</td><td>Productos, stock, precios y valorización.</td></tr>
                                <tr><td>Movimientos</td><td>Entradas, salidas y ajustes del Kardex.</td></tr>
                                <tr><td>Clientes</td><td>Datos y actividad de los clientes.</td></tr>
                                <tr><td>Usuarios</td><td>Usuarios registrados y su rol.</td></tr>
                                <tr><td>Cajas</td><td>Aperturas, cierres y arqueos.</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <h4>Filtros</h4>
                    <ul>
                        <li><strong>Fecha inicio / Fecha fin:</strong> Limitan el periodo.</li>
                        <li><strong>Cantidad de datos:</strong> Máximo de filas (por defecto 500).</li>
                        <li><strong>Orden:</strong> Ascendente o descendente.</li>
                    </ul>

                    <h4>Exportar</h4>
                    <p>Elige el formato <strong>Excel</strong> o <strong>PDF</strong> y pulsa el botón de exportación. La tabla se genera con los filtros aplicados.</p>

                    <div class="manual-callout manual-callout--example">
                        <i class="ph ph-lightbulb"></i>
                        <div>
                            <strong>Ejemplo</strong>
                            <p>Para revisar las ventas de la semana: selecciona “Ventas”, define las fechas, ordena por total descendente y exporta a Excel.</p>
                        </div>
                    </div>
                </article>
            </section>
        @endif

        {{-- ═════════════ CONFIGURACIÓN ═════════════ --}}

        @if($puede('vista_impuestos', 'vista_metodos_pago', 'vista_metodos_pago_cuenta', 'vista_credenciales', 'vista_respaldo'))
            <section class="manual-group" id="configuracion">
                <div class="manual-group__head">
                    <i class="ph ph-gear-six"></i>
                    <h2>Configuración</h2>
                </div>

                <div class="manual-chips">
                    @if(in_array('vista_impuestos', $permisos))<a href="#impuestos">Impuestos</a>@endif
                    @if(in_array('vista_metodos_pago', $permisos))<a href="#metodos-pago">Métodos de pago</a>@endif
                    @if(in_array('vista_metodos_pago_cuenta', $permisos))<a href="#metodos-pago-cuenta">Método pago cuenta</a>@endif
                    @if(in_array('vista_credenciales', $permisos))<a href="#credenciales">Credenciales</a>@endif
                    @if(in_array('vista_respaldo', $permisos))<a href="#respaldo">Respaldo</a>@endif
                </div>

                @if(in_array('vista_impuestos', $permisos))
                    <article class="manual-card" id="impuestos">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-percent"></i></span>
                            <div>
                                <h3>Impuestos</h3>
                                <p>Porcentajes que se aplican a los productos.</p>
                            </div>
                        </div>

                        <p>
                            Cada impuesto tiene un nombre y un porcentaje. Se asigna en el producto y se usa para calcular el
                            <strong>Precio Total (+IVA)</strong> y el impuesto de cada venta o compra.
                        </p>

                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Campo</th>
                                        <th>Qué significa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Nombre</td><td>Nombre del impuesto, por ejemplo “IVA”.</td></tr>
                                    <tr><td>Porcentaje</td><td>Valor que se suma al precio base, por ejemplo 15.</td></tr>
                                    <tr><td>Estado</td><td>Los impuestos inactivos no se asignan a productos nuevos.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>IVA 15% sobre un precio base de C$ 100: el precio final es C$ 115 y el impuesto de la venta es C$ 15.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_metodos_pago', $permisos))
                    <article class="manual-card" id="metodos-pago">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-credit-card"></i></span>
                            <div>
                                <h3>Métodos de pago</h3>
                                <p>Cómo paga el cliente.</p>
                            </div>
                        </div>

                        <p>Define las formas de cobro: efectivo, tarjeta, transferencia, etc. Cada método se vincula luego a una o varias cuentas.</p>

                        <ul>
                            <li><strong>Nombre:</strong> Cómo se muestra en facturación.</li>
                            <li><strong>Descripción:</strong> Detalle opcional.</li>
                            <li><strong>Estado:</strong> Un método inactivo no aparece al cobrar.</li>
                        </ul>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>“Efectivo”, “Tarjeta BAC” y “Transferencia”. En facturación eliges el método y el sistema sabe a qué cuenta mandar el dinero.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_metodos_pago_cuenta', $permisos))
                    <article class="manual-card" id="metodos-pago-cuenta">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-link"></i></span>
                            <div>
                                <h3>Método pago cuenta</h3>
                                <p>Unir cada método de pago con su cuenta destino.</p>
                            </div>
                        </div>

                        <p>
                            Aquí se define a qué cuenta entra el dinero de cada método. Sin esta vinculación, la facturación no
                            puede registrar correctamente el cobro.
                        </p>

                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Campo</th>
                                        <th>Qué significa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Método de pago</td><td>Efectivo, tarjeta, transferencia, etc.</td></tr>
                                    <tr><td>Cuenta</td><td>Cuenta donde se deposita ese método.</td></tr>
                                    <tr><td>Estado</td><td>Si el vínculo está activo.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>Efectivo → Caja General; Transferencia → BAC; Tarjeta → cuenta de pagos. Al facturar con tarjeta, el dinero se registra en la cuenta de pagos.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_credenciales', $permisos))
                    <article class="manual-card" id="credenciales">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-buildings"></i></span>
                            <div>
                                <h3>Credenciales</h3>
                                <p>Datos de la empresa que salen en la factura y el sistema.</p>
                            </div>
                        </div>

                        <p>
                            Esta información se usa en la factura, la proforma y los encabezados del sistema. Mantenerla
                            actualizada es indispensable para que los documentos sean válidos.
                        </p>

                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Campo</th>
                                        <th>Para qué sirve</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Nombre</td><td>Nombre de la empresa.</td></tr>
                                    <tr><td>RUC</td><td>Registro tributario que aparece en la factura.</td></tr>
                                    <tr><td>Dirección</td><td>Dirección fiscal o comercial.</td></tr>
                                    <tr><td>Teléfono</td><td>Contacto de la empresa.</td></tr>
                                    <tr><td>Correo</td><td>Correo de contacto.</td></tr>
                                    <tr><td>Tasa de cambio</td><td>Valor del dólar en córdobas, usado para vueltos y pagos en dólares.</td></tr>
                                    <tr><td>Logo</td><td>Imagen que se imprime en los documentos.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="manual-callout manual-callout--example">
                            <i class="ph ph-lightbulb"></i>
                            <div>
                                <strong>Ejemplo</strong>
                                <p>Si la tasa de cambio es 36.50 y el cliente paga con un billete de 10 dólares, el sistema calcula el equivalente en córdobas y el vuelto correspondiente.</p>
                            </div>
                        </div>
                    </article>
                @endif

                @if(in_array('vista_respaldo', $permisos))
                    <article class="manual-card" id="respaldo">
                        <div class="manual-card__head">
                            <span class="manual-card__icon"><i class="ph ph-database"></i></span>
                            <div>
                                <h3>Respaldo</h3>
                                <p>Exportar y restaurar la información del sistema.</p>
                            </div>
                        </div>

                        <p>
                            El respaldo sirve para guardar una copia de seguridad de toda la información y poder restaurarla
                            si algo sale mal.
                        </p>

                        <h4>Exportar</h4>
                        <div class="manual-table-wrap">
                            <table class="manual-table">
                                <thead>
                                    <tr>
                                        <th>Formato</th>
                                        <th>Contenido</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Excel</td><td>Cada tabla del sistema en una hoja del libro.</td></tr>
                                    <tr><td>PDF</td><td>Documento con los registros del sistema.</td></tr>
                                    <tr><td>CSV</td><td>Datos separados por comas, útil para otros programas.</td></tr>
                                    <tr><td>SQL</td><td>Estructura y datos completos de la base de datos.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <h4>Restaurar</h4>
                        <p>
                            El archivo de restauración debe ser un respaldo <strong>.sql</strong> o <strong>.txt</strong> generado
                            por el sistema. Al restaurarlo, se reemplazan los datos actuales.
                        </p>

                        <div class="manual-callout manual-callout--danger">
                            <i class="ph ph-warning-octagon"></i>
                            <div>
                                <strong>Antes de restaurar</strong>
                                <p>Haz un respaldo actualizado. La restauración reemplaza la información existente y no se puede deshacer desde el sistema.</p>
                            </div>
                        </div>

                        <div class="manual-callout manual-callout--info">
                            <i class="ph ph-info"></i>
                            <div>
                                <strong>Recomendación</strong>
                                <p>Descarga un respaldo SQL al menos una vez por semana o antes de cada actualización importante.</p>
                            </div>
                        </div>
                    </article>
                @endif
            </section>
        @endif

            </div>
        </div>

    </div>

    <button type="button" class="manual-top" id="manualVolverArriba" aria-label="Volver arriba">
        <i class="ph ph-arrow-up"></i>
    </button>

</turbo-frame>
