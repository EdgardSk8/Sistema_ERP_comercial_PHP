export default function initCompras() {

/* ------------------------------------------------------------------------------------------------------------------- */
/* 🔹 VARIABLES */
/* ------------------------------------------------------------------------------------------------------------------- */

    let carrito = [];
    let gastosCompra = [];

    let tabla = $('#tabla_carrito').DataTable({
        paging: false,
        searching: false,
        info: false,
        ordering: false,
        scrollX: true,
        responsive: false,
    });

    document.getElementById('titulo').textContent = 'REGISTRO DE COMPRAS';

/* ------------------------------------------------------------------------------------------------------------------- */
/* 🔹 SELECT2 PRODUCTO (BÚSQUEDA REMOTA + PRECIO) */
/* ------------------------------------------------------------------------------------------------------------------- */

    $('#producto_select').select2({
        width: '100%',
        placeholder: 'Buscar por nombre, SKU, color o talla',
        allowClear: true,
        language: {
            searching: () => 'Buscando…',
            noResults: () => 'Sin resultados'
        },
        ajax: {
            url: '/productos-compra/mostrar',
            dataType: 'json',
            delay: 250,
            cache: true,
            data: params => ({ q: params.term }),
            processResults: function (res) {
                const items = Array.isArray(res.data) ? res.data : [];

                return {
                    results: items.map(p => ({
                        id: p.id,
                        id_variacion_talla: p.id_variacion_talla || null,
                        sku: p.sku || null,
                        text: p.text,
                        impuesto: parseFloat(p.impuesto) || 0,
                        precio: parseFloat(p.precio) || 0
                    }))
                };
            }
        },
        templateResult: function (data) {
            if (!data.id) return data.text;

            const $opcion = $('<div class="select2-producto-opcion">');
            $('<span class="select2-producto-nombre">').text(data.text).appendTo($opcion);
            $('<span class="select2-producto-precio">').text(moneda(data.precio || 0)).appendTo($opcion);

            return $opcion;
        }
    });

/* ------------------------------------------------------------------------------------------------------------------- */
/* 🔹 SELECT2 PROVEEDOR */
/* ------------------------------------------------------------------------------------------------------------------- */

    $('#proveedor').select2({
        ajax: {
            url: '/proveedores-compra/mostrar',
            dataType: 'json',
            processResults: function (res) {
                return { results: res.data };
            }
        }
    });

/* ------------------------------------------------------------------------------------------------------------------- */
/* 🔹 SELECTORES AUXILIARES */
/* ------------------------------------------------------------------------------------------------------------------- */

    $('#tipo_factura').select2({
        ajax: {
            url: '/tipo-factura-compra/mostrar',
            dataType: 'json',
            processResults: function (res) {
                return {
                    results: res.data.map(t => ({ id: t.id_tipo_factura, text: t.nombre_tipo_factura }))
                };
            }
        }
    });

    $('#metodo_pago').select2({
        ajax: {
            url: '/metodo-pago-compra/mostrar',
            dataType: 'json',
            processResults: function (res) {
                return {
                    results: res.data.map(m => ({
                        id: m.id_metodo_pago,
                        text: m.nombre_metodo_pago
                    }))
                };
            }
        }
    });

    $('#gasto_tipo').select2({
        ajax: {
            url: '/tipo-gasto-compra/mostrar',
            dataType: 'json',
            processResults: function (res) {

                if (!res.success || !Array.isArray(res.data) || !res.data.length) {
                    return {
                        results: [{
                            id: '',
                            text: 'No hay tipos de gasto configurados',
                            disabled: true
                        }]
                    };
                }

                return { results: res.data };
            }
        },
        width: '100%',
        dropdownParent: $('#modalGastosCompra'),
        placeholder: 'Seleccione un tipo'
    });

    // ⚠️ Las opciones ya vienen del Blade, así que NO se le pasa `data` a Select2
    // (eso reemplazaba/duplicaba el placeholder). Mismo patrón que los demás selectores.
    $('#cajacuentaselect').select2({
        placeholder: 'Seleccione un Tipo de Pago',
        allowClear: false,
        width: '100%'
    });

    $('#crear_medida_producto').select2({
        ajax: {
            url: '/medidas-compra/mostrar',
            dataType: 'json',
            delay: 250,

            processResults: function (res) {

                return {
                    results: res.data.map(med => ({
                        id: med.id_medida,
                        text: `${med.orden_medida}. ${med.nombre_medida} (${med.abreviatura_medida})`
                    }))
                };

            },

            cache: true
        },

        width: '100%',
        dropdownParent: $('#modalCrearProducto'),
        placeholder: 'Seleccione medida',
        allowClear: false
    });

    $('#cajacuentaselect').on('change', function () {

        const tipoPago = $(this).val();

        if (tipoPago === 'caja') {

            $('#caja_select').prop('disabled', false).trigger('change.select2');
            $('#cuenta').prop('disabled', true).val(null).trigger('change');

        } else if (tipoPago === 'cuenta') {

            $('#cuenta').prop('disabled', false).trigger('change.select2');
            $('#caja_select').prop('disabled', true).val(null).trigger('change');

        } else { $('#caja_select, #cuenta').prop('disabled', true).val(null).trigger('change'); }

    });

    $('#cuenta').select2({
        ajax: {
            url: '/cuenta-compra/mostrar',
            dataType: 'json',
            processResults: function (res) {
                return {
                    results: (res.success && Array.isArray(res.cuentas)) ? res.cuentas.map(c => ({ id: c.id, text: c.display })) : []
                };
            }
        }
    });

/* ---------------------------------------------------------------------------------------------------------------------------- */

    $(document).on('producto-creado', function(e, p) {

        carrito.push({
            id: p.id,
            nombre: p.nombre,
            cantidad: p.cantidad || 1,
            precio: p.precio || 0,
            precio_original: p.precio,
            precio_compra: p.precio_compra || 0,
            impuesto: p.impuesto || 0,
            descuento: 0
        });

        renderCarrito();
        recalcularTodo();
    });

/* ------------------------------------------------------------------------------------------------------------------- */


/* ═════════════ ( SELECTOR CAJAS ABIERTAS ) ═══════════════ */

    function cargarCajasAbiertas(total = 0) {

        $('#caja_select').select2({
            ajax: {
                url: '/caja-compra/mostrar',
                dataType: 'json',
                processResults: function (res) {

                    const data = res.data || [];

                    if (!data.length) {
                        return {
                            results: [{
                                id: '',
                                text: 'No hay cajas abiertas',
                                disabled: true
                            }]
                        };
                    }

                    return {
                        results: data.map(c => {
                            const saldoSuficiente = c.saldo_actual >= total;

                            return {
                                id: c.id,
                                text: saldoSuficiente
                                    ? c.text
                                    : `${c.text} (Saldo insuficiente)`,
                                disabled: !saldoSuficiente
                            };
                        })
                    };
                }
            },

            templateResult: function (data) {
                if (data.disabled) {
                    return $('<span style="color:red;">' + data.text + '</span>');
                }

                return $('<span style="color:white;font-weight:bold;">' + data.text + '</span>');
            }
        });
    }

/* --------------------------------------------------------------------------------------------- */

/* ═════════════ ( ACTUALIZADOR DE PRECIO CAJA ) ═══════════════ */

    const actualizarCajas = () => cargarCajasAbiertas(parseFloat($('#total').val()) || 0);

    actualizarCajas();

/* 🔥 AGREGAR PRODUCTO (PRECIO SOLO USUARIO) */
/* ------------------------------------------------------------------------------------------------------------------- */

    $('#btnAgregar').click(function () {

        let data = $('#producto_select').select2('data')[0];

        if (!data) return mostrarToast('Seleccione producto', 'danger');

        let cantidad = parseFloat($('#cantidad').val()) || 0;
        // El costo de compra viene del producto/variante seleccionado; luego
        // se puede ajustar en la columna "Precio Compra" del carrito.
        let precio = Number(data.precio) || 0;

        if (cantidad <= 0) return mostrarToast('Cantidad inválida', 'danger');

        // Fusiona solo si es el mismo producto/variante Y el mismo precio; así un
        // mismo producto puede registrarse en varias líneas (p. ej. 6 pares a C$100
        // y 1 par a C$950), y el costo promedio ponderado se calcula correctamente.
        let existente = carrito.find(p =>
            p.id === data.id &&
            (p.id_variacion_talla || null) === (data.id_variacion_talla || null) &&
            Number(p.precio) === Number(precio)
        );

        if (existente) {

            existente.cantidad += cantidad;
            existente.impuesto = data.impuesto;

        } else {

            carrito.push({
                id: data.id,
                id_variacion_talla: data.id_variacion_talla || null,
                sku: data.sku || null,
                nombre: data.text,
                cantidad,
                precio,
                precio_original: data.precio,
                impuesto: data.impuesto,
                descuento: 0
            });
        }

        renderCarrito();
        recalcularTodo();

        $('#producto_select').val(null).trigger('change');
        $('#cantidad').val(1);
    });

    $('#cantidad').val(1);
    $('#descuento').val(0);
    $('#impuesto').val(0);
    $('#subtotal').val(0);
    $('#gastos').val('0.00');
    $('#total').val(0);

/* ------------------------------------------------------------------------------------------------------------------- */
/* 🔥 RENDER CARRITO */
/* ------------------------------------------------------------------------------------------------------------------- */

    function obtenerPorcentajeImpuesto(producto) {
        const valor = Number(producto?.impuesto ?? 0);
        const nombre = `${producto?.nombre || ''} ${producto?.text || ''}`.toLowerCase();

        if (!Number.isFinite(valor) || valor <= 0) return 0;
        if (nombre.includes('exento')) return 0;

        return valor;
    }

    // 🔥 El precio del proveedor puede traer el IVA incluido (lo normal) o no.
    // Si viene incluido, NO se suma nada y el IVA del cuadro de totales queda en 0.
    function ivaEstaIncluido() {
        return $('#chk_iva_incluido').is(':checked');
    }

    function renderCarrito() {

        tabla.clear();

        carrito.forEach((p, i) => {
            

            let subtotal = (Number(p.precio) || 0) * (Number(p.cantidad) || 0);
            let impuestoPorcentaje = ivaEstaIncluido() ? 0 : obtenerPorcentajeImpuesto(p);
            let impuestoValor = subtotal * (impuestoPorcentaje / 100);
            let totalItem = subtotal + impuestoValor;

            tabla.row.add([
                i + 1,
                p.nombre,

                `<input type="number"
                    class="cantidad"
                    data-index="${i}"
                    placeholder="0"
                    value="${p.cantidad}">`,

                p.precio_original.toFixed(2),

                `<input type="number"
                    class="precio"
                    data-index="${i}"
                    placeholder="0"
                    value="${p.precio > 0 ? p.precio : ''}">`,

                moneda(subtotal),
                moneda(impuestoValor),
                moneda(totalItem),

                `<button class="btn-baja eliminar" data-index="${i}">
                    <i class="ph ph-trash"></i>
                </button>`
            ]);
        });

        tabla.draw();
    }

/* ------------------------------------------------------------------------------------------------------------------- */
/* 🔥 EVENTOS DINÁMICOS */
/* ------------------------------------------------------------------------------------------------------------------- */

    $('#tabla_carrito').on('blur', '.cantidad, .precio', function () {

        let i = $(this).data('index');
        let valor = parseFloat($(this).val()) || 0;

        if (!carrito[i]) return;

        if ($(this).hasClass('cantidad')) carrito[i].cantidad = valor;
        if ($(this).hasClass('precio')) carrito[i].precio = valor;

        recalcularTodo();
        renderCarrito();
    });

    $('#tabla_carrito').on('click', '.eliminar', function () {
        carrito.splice($(this).data('index'), 1);
        recalcularTodo();
    });

/* 🔥 IVA INCLUIDO / NO INCLUIDO (cuadro de totales) */
/* ------------------------------------------------------------------------------------------------------------------- */

    $('#chk_iva_incluido').on('change', function () {
        recalcularTodo();
        renderCarrito();
    });

/* ------------------------------------------------------------------------------------------------------------------- */
/* 🔥 GASTOS ADICIONALES (TRANSPORTE, COMIDA, ETC.) */
/* ------------------------------------------------------------------------------------------------------------------- */

    function escapeHtmlGasto(valor) {
        return $('<div>').text(valor ?? '').html();
    }

    function totalGastosCompra() {
        return gastosCompra.reduce((total, gasto) => total + (Number(gasto.monto) || 0), 0);
    }

    function renderGastosCompra() {

        const filas = gastosCompra.map((gasto, i) => `
            <tr>
                <td>${escapeHtmlGasto(gasto.tipo)}</td>
                <td>${gasto.detalle ? escapeHtmlGasto(gasto.detalle) : '<span class="text-muted">—</span>'}</td>
                <td class="text-end">${moneda(gasto.monto)}</td>
                <td class="text-end">
                    <button type="button" class="btn-baja quitar-gasto" data-index="${i}" title="Quitar">
                        <i class="ph ph-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        $('#tablaGastosCompra').html(
            filas || '<tr><td colspan="4" class="text-center text-muted">Sin gastos adicionales</td></tr>'
        );

        $('#totalGastosCompra').text(moneda(totalGastosCompra()));
    }

    $('#btnGastosCompra').on('click', function () {
        renderGastosCompra();
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalGastosCompra')).show();
    });

    $('#btnAgregarGasto').on('click', function () {

        const tipo = $('#gasto_tipo').select2('data')[0];
        const monto = parseFloat($('#gasto_monto').val()) || 0;
        const detalle = $('#gasto_detalle').val().trim();

        if (!tipo || !tipo.id) return mostrarToast('Seleccione el tipo de gasto', 'danger');
        if (monto <= 0) return mostrarToast('Ingrese un monto válido', 'danger');

        gastosCompra.push({
            id_tipo_gasto: tipo.id,
            tipo: tipo.text,
            detalle: detalle || null,
            monto
        });

        $('#gasto_tipo').val(null).trigger('change');
        $('#gasto_monto').val('');
        $('#gasto_detalle').val('');

        renderGastosCompra();
        recalcularTodo();
    });

    $('#tablaGastosCompra').on('click', '.quitar-gasto', function () {
        gastosCompra.splice($(this).data('index'), 1);
        renderGastosCompra();
        recalcularTodo();
    });

/* ------------------------------------------------------------------------------------------------------------------- */
/* 🔥 CÁLCULO GLOBAL REAL */
/* ------------------------------------------------------------------------------------------------------------------- */

    function recalcularTodo() {

        let subtotalGeneral = 0;
        let impuestoGeneral = 0;

        carrito.forEach(p => {

            let subtotal = (p.precio || 0) * (p.cantidad || 0);
            let impuestoPorcentaje = ivaEstaIncluido() ? 0 : obtenerPorcentajeImpuesto(p);
            let impuesto = subtotal * (impuestoPorcentaje / 100);

            subtotalGeneral += subtotal;
            impuestoGeneral += impuesto;
        });

        let descuento = parseFloat($('#descuento').val()) || 0;
        let gastos = totalGastosCompra();

        let total = subtotalGeneral + impuestoGeneral - descuento + gastos;

        $('#subtotal').val(subtotalGeneral.toFixed(2));
        $('#impuesto').val(impuestoGeneral.toFixed(2));
        $('#gastos').val(gastos.toFixed(2));
        $('#total').val(total.toFixed(2));

        //actualizarCajas();
    }


/* ------------------------------------------------------------------------------------------------------------------- */
/* 🔥 LIMPIAR */
/* ------------------------------------------------------------------------------------------------------------------- */

    $('#btnLimpiar').click(function () {

        carrito = [];
        gastosCompra = [];
        renderCarrito();
        renderGastosCompra();

        $('#proveedor, #tipo_factura, #metodo_pago, #cuenta, #caja_select, #cajacuentaselect').val(null).trigger('change');
        $('#gasto_tipo').val(null).trigger('change');

        $('#numero_factura, #subtotal, #total, #impuesto').val('');
        $('#gastos').val('0.00');
        $('#gasto_monto, #gasto_detalle').val('');
        $('#descuento').val(0);
    });

/* ------------------------------------------------------------------------------------------------------------------- */
/* 🔥 REGISTRAR */
/* ------------------------------------------------------------------------------------------------------------------- */

    $('#btnRegistrar').click(function () {

        let data = {
            numero_factura: $('#numero_factura').val(),
            proveedor: $('#proveedor').val(),
            tipo_factura: $('#tipo_factura').val(),
            metodo_pago: $('#metodo_pago').val(),
            caja: $('#caja_select').val(),
            cuenta: $('#cuenta').val(),
            descuento: parseFloat($('#descuento').val()) || 0,
            impuesto: parseFloat($('#impuesto').val()) || 0,
            gastos: gastosCompra.map(g => ({
                id_tipo_gasto: g.id_tipo_gasto,
                descripcion: g.detalle,
                monto: g.monto
            })),
            carrito
        };

        if (!data.proveedor) return mostrarToast('Seleccione proveedor', 'danger');
        if (carrito.length === 0) return mostrarToast('Agregue productos', 'danger');

            if (!data.caja && !data.cuenta) {
            return mostrarToast('Seleccione caja o cuenta', 'danger');
        }

        $.ajax({
            url: '/compra/crear',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },

            success: function (res) {
                if (res.success) {
                    mostrarToast('Compra registrada correctamente', 'success');
                    $('#btnLimpiar').click();
                } else {
                    mostrarToast('Error desconocido', 'danger');
                }
            },

            error: function () {
                mostrarToast('Error al registrar compra', 'danger');
            }
        });

    });

/* ------------------------------------------------------------------------------------------------------------------- */

    function crearcompra() {
                
        function cargarSelects() {

            $.get('/productos/formulario?solo_activos=1', function(res){

                const data = res.data;

                // SELECTORES
                const selectCategoria = $('#crear_id_categoria');
                const selectMarca = $('#crear_id_marca');
                const selectUbicacion = $('#crear_id_ubicacion');
                const selectImpuesto = $('#crear_id_impuesto');
                const selectMedida = $('#crear_medida_producto');

                // DESTRUIR SELECT2 SI YA EXISTE
                [ selectCategoria, selectMarca, selectUbicacion, selectImpuesto, selectMedida
                ].forEach(select => { if(select.hasClass('select2-hidden-accessible')){ select.select2('destroy'); } });

                // INICIALIZAR SELECT2
                [ selectCategoria, selectMarca, selectUbicacion, selectImpuesto, selectMedida]
                .forEach(select => { select.select2({ width: '100%', dropdownParent: $('#modalCrearProducto'), allowClear: false }); });

                selectCategoria.empty().append('<option value="" disabled selected>Seleccione</option>');
                selectMarca.empty().append('<option value="">Sin marca</option>');
                selectUbicacion.empty().append('<option value="" disabled selected>Seleccione</option>');
                selectImpuesto.empty().append('<option value="" disabled selected>Seleccione</option>');
                selectMedida.empty().append('<option value="" disabled selected>Seleccione</option>');

                data.categorias.forEach(cat => { selectCategoria.append(` <option value="${cat.id_categoria}"> ${cat.nombre_categoria} </option> `); });

                (data.marcas || []).forEach(mar => { selectMarca.append(` <option value="${mar.id_marca}"> ${mar.nombre_marca} </option> `); });

                pintarAtributosCrearProducto(data.atributos);

                data.ubicaciones.forEach(ubi => {
                    selectUbicacion.append(` <option value="${ubi.id_ubicacion}"> ${ubi.nombre_ubicacion} </option> `);
                });

                data.impuestos.forEach(imp => {
                    selectImpuesto.append(`
                        <option value="${imp.id_impuesto}"
                            data-iva="${imp.porcentaje_impuesto}"> ${imp.nombre_impuesto} (${parseFloat(imp.porcentaje_impuesto)}%)
                        </option>
                    `);
                });

                //MEDIDAS   
                const grupos = {};

                data.medidas.forEach(med => {
                    const tipo = med.tipomedida.nombre_tipo_medida;
                    if(!grupos[tipo]){ grupos[tipo] = []; }
                    grupos[tipo].push(med);
                });

                Object.keys(grupos).forEach(tipo => {

                    grupos[tipo].sort((a,b)=>{ return a.orden_medida - b.orden_medida; });
                    const optgroup = $(` <optgroup label="${tipo}"> </optgroup> `);

                    grupos[tipo].forEach(med => {
                        optgroup.append(`
                            <option value="${med.id_medida}"> ${med.orden_medida}.${med.nombre_medida} (${med.abreviatura_medida}) </option>
                        `);
                    });

                    selectMedida.append(optgroup);
                });

                [ selectCategoria, selectUbicacion, selectImpuesto, selectMedida
                ].forEach(select => { select.trigger('change'); });



            }).fail(function(){ mostrarToast('Error al cargar datos del formulario', 'danger'); });

        } cargarSelects();

        $('#crear_imagen_producto').on('change', function(e){

            const file = e.target.files[0];
            const preview = $('#preview_imagen_producto');

            if(file){
                const reader = new FileReader();
                reader.onload = function(e){ preview.attr('src', e.target.result); preview.removeClass('d-none'); };
                reader.readAsDataURL(file);
            }

        });

    function calcularGananciaProducto() {

        const precioCompra = parseFloat($('#crear_precio_compra').val()) || 0;
        const precioVenta = parseFloat($('#crear_precio_venta').val()) || 0;

        $('#crear_ganancia_producto').val(
            (precioVenta - precioCompra).toFixed(2)
        );

    }


    // Escuchar cambios
    $('#crear_precio_compra, #crear_precio_venta, #crear_porcentaje_venta').on('input change', function(){ calcularGananciaProducto(); });


    /* ---------------------------------------------------------------------------------------------------- */

        function inicializarCrearVenta() {

            const checkVenta = $('#crear_check_venta'); 
            const checkRedondeo = $('#crear_redondeo_venta');

            const inputPorcentaje = $('#crear_porcentaje_venta');
            const inputPrecioCompra = $('#crear_precio_compra');
            const inputPrecioVenta = $('#crear_precio_venta'); 
            const inputPrecioTotal = $('#crear_precio_venta_TOTAL');
            const selectImpuesto = $('#crear_id_impuesto');

            // Precio de venta con máximo 2 decimales y sin decimales innecesarios: 150.00 → 150, 150.50 → 150.5
            const precioVentaCorto = valor => {
                const numero = Number(valor);
                if (!Number.isFinite(numero)) return '';
                return String(parseFloat(numero.toFixed(2)));
            };

            let porcentajeOriginal = parseFloat(inputPorcentaje.val()) || 0;
            let bloqueando = false;
            let modoRedondeo = false;

            // Habilitar / deshabilitar inputs
            function toggleInputs() {
                if (checkVenta.is(':checked')) {
                    inputPorcentaje.prop('disabled', false);
                    inputPrecioVenta.prop('disabled', true);
                    inputPrecioTotal.prop('disabled', true);
                } else {
                    inputPorcentaje.prop('disabled', true);
                    inputPrecioVenta.prop('disabled', false);
                    inputPrecioTotal.prop('disabled', false);
                }
            }

            function calcularGanancia() {
                let compra = parseFloat(inputPrecioCompra.val()) || 0;
                let venta = parseFloat(inputPrecioVenta.val()) || 0;

                $('#crear_ganancia_producto').val((venta - compra).toFixed(2));
            }

            // 🔹 Calcular desde % o precio base
            function calcularTodo() {
                if (bloqueando || modoRedondeo) return;
                bloqueando = true;

                let precioCompra = parseFloat(inputPrecioCompra.val()) || 0;
                let iva = parseFloat(selectImpuesto.find(':selected').data('iva')) || 0;

                if (checkVenta.is(':checked')) {
                    let porcentaje = parseFloat(inputPorcentaje.val()) || 0;

                    let precioBase = precioCompra * (1 + porcentaje / 100);
                    let precioTotal = precioBase * (1 + iva / 100);

                    // El precio de venta se muestra con máximo 2 decimales.
                    inputPrecioVenta.val(precioVentaCorto(precioBase));
                    inputPrecioTotal.val(precioTotal.toFixed(2));

                    porcentajeOriginal = porcentaje;

                } else {
                    let precioBase = parseFloat(inputPrecioVenta.val()) || 0;

                    let precioTotal = precioBase * (1 + iva / 100);
                    inputPrecioTotal.val(precioTotal.toFixed(2));
                }
                calcularGanancia();
                bloqueando = false;
            }

            // 🔥 Calcular desde TOTAL
            function calcularDesdeTotal() {
                if (bloqueando) return;
                bloqueando = true;

                modoRedondeo = false;

                let precioCompra = parseFloat(inputPrecioCompra.val()) || 0;
                let total = parseFloat(inputPrecioTotal.val()) || 0;
                let iva = parseFloat(selectImpuesto.find(':selected').data('iva')) || 0;

                if (precioCompra <= 0 || total <= 0) { bloqueando = false; return;}

                let precioBase = total / (1 + iva / 100);
                let porcentaje = ((precioBase / precioCompra) - 1) * 100;

                // El precio de venta se muestra con máximo 2 decimales.
                inputPrecioVenta.val(precioVentaCorto(precioBase));
                inputPorcentaje.val(porcentaje.toFixed(2));

                calcularGanancia();

                porcentajeOriginal = porcentaje;

                bloqueando = false;
            }

            // FUNCION DE REDONDEO
            function redondearTotal() {

                modoRedondeo = true;

                let iva = parseFloat(selectImpuesto.find(':selected').data('iva')) || 0;

                if (checkVenta.is(':checked')) {

                    let precioCompra = parseFloat(inputPrecioCompra.val()) || 0;

                    let totalConIva = precioCompra * (1 + porcentajeOriginal / 100) * (1 + iva / 100);
                    let totalRedondeado = Math.ceil(totalConIva);

                    let baseRedondeada = totalRedondeado / (1 + iva / 100);
                    let nuevoPorcentaje = ((baseRedondeada / precioCompra) - 1) * 100;

                    porcentajeOriginal = nuevoPorcentaje;

                    inputPorcentaje.val(nuevoPorcentaje.toFixed(3));
                    inputPrecioVenta.val(precioVentaCorto(baseRedondeada));
                    inputPrecioTotal.val(totalRedondeado);
                    calcularGanancia();

                } else {

                    let precioBase = parseFloat(inputPrecioVenta.val()) || 0;

                    let totalConIva = precioBase * (1 + iva / 100);
                    let totalRedondeado = Math.ceil(totalConIva);

                    let nuevoPrecioVenta = totalRedondeado / (1 + iva / 100);

                    inputPrecioVenta.val(precioVentaCorto(nuevoPrecioVenta));
                    inputPrecioTotal.val(totalRedondeado);
                    calcularGanancia();
                }
            }

            toggleInputs();
            calcularTodo();

            // 🔄 Eventos
            checkVenta.on('change', () => { modoRedondeo = false; toggleInputs(); calcularTodo(); });
            inputPrecioCompra.on('input', () => { modoRedondeo = false; calcularTodo(); });
            inputPorcentaje.on('input', () => { modoRedondeo = false; calcularTodo(); });
            inputPrecioVenta.on('input', () => { modoRedondeo = false; calcularTodo(); });
            selectImpuesto.on('change', () => { modoRedondeo = false; calcularTodo(); });

            inputPrecioTotal.on('input', calcularDesdeTotal);

            // BTN DE REDONDEO
            checkRedondeo.on('click', function(e) { e.preventDefault(); redondearTotal(); checkRedondeo.prop('checked', false); });

            // CREACION DE MODAL
            $('#modalCrearProducto').on('shown.bs.modal', function () {
                modoRedondeo = false;
                toggleInputs();
                calcularTodo();
            });
        }

        inicializarCrearVenta();

    /* ---------------------------------------------------------------------------------------------------- */

        /* ════════════════ ATRIBUTOS DEL PRODUCTO ════════════════ */

        // Pinta un select por atributo dentro del modal de crear producto.
        function pintarAtributosCrearProducto(atributos) {

            const contenedor = $('#crear_atributos_producto');

            contenedor.empty();

            (atributos || []).forEach(atributo => {

                const valores = atributo.valores || [];

                if (!valores.length) return;

                const opciones = valores
                    .map(valor => `<option value="${valor.id_valor}">${valor.valor_atributo}</option>`)
                    .join('');

                contenedor.append(`
                    <div class="col-md-3">
                        <label class="form-label">${atributo.nombre_atributo}</label>
                        <select class="form-select form-select-sm select-atributo-producto"
                                data-id-atributo="${atributo.id_atributo}">
                            <option value="">Sin especificar</option>
                            ${opciones}
                        </select>
                    </div>
                `);
            });
        }

        // Atributos elegidos en el formato que espera el controlador.
        function obtenerAtributosCrearProducto() {

            return $('#crear_atributos_producto .select-atributo-producto').map(function () {

                return {
                    id_atributo: Number($(this).data('id-atributo')),
                    id_valor: Number($(this).val()) || 0
                };

            }).get().filter(atributo => atributo.id_valor > 0);
        }

        /* form.reset() no limpia los Select2: hay que vaciarlos y refrescar su vista. */
        function limpiarModalCrearProducto() {            const formulario = document.getElementById('formCrearProducto');

            if (formulario) formulario.reset();

            $('#formCrearProducto').find('select').each(function () {
                const $select = $(this);

                $select.val('');

                if ($select.hasClass('select2-hidden-accessible')) {
                    $select.trigger('change.select2');
                }
            });

            $('#preview_imagen_producto').attr('src', '').addClass('d-none');
        }

        // EVENTO GUARDAR PRODUCTO
        $('#btnGuardarProducto').click(function() {

            const nombre = $('#crear_nombre_producto').val().trim();
            const descripcion = $('#crear_descripcion_producto').val().trim();
            const categoria = $('#crear_id_categoria').val();
            const marca = $('#crear_id_marca').val();
            const medida = $('#crear_medida_producto').val();
            const ubicacion = $('#crear_id_ubicacion').val();
            const impuesto = $('#crear_id_impuesto').val();
            const porcentajeImpuesto = Number($('#crear_id_impuesto option:selected').data('iva')) || 0;
            const precioCompra = $('#crear_precio_compra').val();
            const precioVenta = $('#crear_precio_venta').val();
            const stock = $('#crear_stock_actual').val();
            const imagen = $('#crear_imagen_producto')[0].files[0];

            // ✅ VALIDACIÓN DE CAMPOS OBLIGATORIOS
            // Ubicación, medida, descripción e imagen SÍ admiten nulos: no se validan.
            const faltantes = [];

            if(nombre === '') faltantes.push('el nombre del producto');

            if(!categoria) faltantes.push('la categoría');
            if(!impuesto) faltantes.push('el impuesto');

            const precioCompraNum = parseFloat(precioCompra);
            if(precioCompra === '' || precioCompra === null || isNaN(precioCompraNum)){
                faltantes.push('el precio de compra');
            } else if(precioCompraNum < 0){
                mostrarToast('El precio de compra no puede ser negativo', 'danger');
                return;
            }

            const precioVentaNum = parseFloat(precioVenta);
            if(precioVenta === '' || precioVenta === null || isNaN(precioVentaNum)){
                faltantes.push('el precio de venta');
            } else if(precioVentaNum < 0){
                mostrarToast('El precio de venta no puede ser negativo', 'danger');
                return;
            }

            if(stock !== '' && (!Number.isInteger(Number(stock)) || Number(stock) < 0)){
                mostrarToast('La cantidad inicial debe ser un número entero mayor o igual a 0', 'danger');
                return;
            }

            if(faltantes.length > 0){
                mostrarToast('Debe completar: ' + faltantes.join(', '), 'danger');
                return;
            }

            const formData = new FormData();

            formData.append('nombre_producto', nombre);
            formData.append('descripcion_producto', descripcion);
            formData.append('id_categoria', categoria);
            formData.append('id_marca', marca || '');
            formData.append('atributos', JSON.stringify(obtenerAtributosCrearProducto()));
            formData.append('id_ubicacion', ubicacion);
            formData.append('id_impuesto', impuesto);
            formData.append('precio_compra', precioCompra);
            formData.append('precio_venta', precioVenta);
            formData.append('stock_actual', stock);
            formData.append('id_medida', medida);

            if(imagen){ formData.append('imagen_producto', imagen); }

            formData.append('_token', $('meta[name="csrf-token"]').attr('content'));

            $.ajax({ url: '/productos/crear', type: 'POST', data: formData, processData: false, contentType: false,

            success: function(res) {

                mostrarToast('Producto creado correctamente', 'success');

                let producto = res.producto;

                if (!producto) { console.log("No vino producto"); return; }

                let cantidad = parseFloat($('#crear_stock_actual').val()) || 1;
                let precio = parseFloat($('#crear_precio_compra').val()) || 0;

                // EVENTO DIRECTO AL CARRITO
                $(document).trigger('producto-creado', {
                    id: producto.id,
                    nombre: producto.text,
                    cantidad: cantidad,
                    precio: precio,
                    precio_compra: precio,
                    impuesto: porcentajeImpuesto,
                    id_impuesto: impuesto,
                    id_medida: medida
                });

                // 🔥 Agregar al select2 (solo UI)
                let newOption = new Option(producto.text, producto.id, true, true);
                $('#producto_select').append(newOption).trigger('change');

                // 🔥 limpiar modal (incluye los Select2)
                limpiarModalCrearProducto();

                const modalElement = document.getElementById("modalCrearProducto");
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if(modalInstance) modalInstance.hide();

                console.log(producto);
            },

                error: function(err){

                    if(err.status === 422 && err.responseJSON?.errors){

                        const errores = err.responseJSON.errors;
                        let mensaje = '';
                        for(let campo in errores){ mensaje = errores[campo][0]; break; }
                        mostrarToast(mensaje, 'danger');

                    }
                    else if(err.responseJSON && err.responseJSON.mensaje){

                        mostrarToast(err.responseJSON.mensaje, 'danger');

                    }  else { mostrarToast('No se pudo crear el producto. Verifica los datos e intenta de nuevo.', 'danger'); }

                }

            });

        });

        // LIMPIAR MODAL
        $('#modalCrearProducto').on('hidden.bs.modal', function () {
            limpiarModalCrearProducto();
        });

    }; crearcompra();

/* ------------------------------------------------------------------------------------------------------------------- */


    

};
