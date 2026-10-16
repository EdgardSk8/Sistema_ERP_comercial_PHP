export default function initCuentas() {

    document.getElementById('titulo').textContent = 'REGISTRO DE CUENTAS';
    let tabla;

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ═════════════ ( FILTRO ACTIVOS / INACTIVOS ) ═════════════ */

    $.fn.dataTable.ext.search.push(function(settings, data) {

        const ocultar = $('#toggleInactivosCuentas').is(':checked');
        if (!ocultar) return true;

        const estado = data[4]; // Columna de estado
        return estado.includes('Activo');
    });

    $('#toggleInactivosCuentas').on('change', function() { tabla.draw(); }); // Redibujar tabla ocultar inactivos


/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ═════════════ ( DATATABLE ) ═════════════ */

    tabla = $('#tablaCuentas').DataTable({

        // autoWidth: false,
        ajax: { url: '/cuenta/mostrar', type: 'GET', dataSrc: 'cuentas' },

        columns: [

            { data: 'nombre_cuenta' },
            { data: 'tipo_cuenta' },
            { data: 'descripcion', render: function(data){ return data ? data : '—'; } },
            { data: 'saldo_actual', render: renderSaldo },
            { data: 'estado', render: renderEstado },
            { data: 'id_cuenta', render: renderAcciones }

        ], order: [[0, 'asc']], drawCallback: function () { AnimarFilasVisibles(this.api()); }

    });

    configurarToggleColumnas('tablaCuentas');

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ═════════════ ( RENDERERS ) ═════════════ */

    function renderSaldo(data){

        let valor = parseFloat(data);
        let monto = valor.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return valor >= 0 ? `<strong class="text-success">C$ ${monto}</strong>` : `<strong class="text-danger">C$ ${monto}</strong>`;

    }

/* ═════════════════════════════════════════ */

    function renderEstado(data){
        return data == 1 ? '<span class="estado estado-activo">Activo</span>' : '<span class="estado estado-inactivo">Inactivo</span>';
    }

/* ═════════════════════════════════════════ */

    function renderAcciones(data, type, row){

        let botonEstado = row.estado == 1
            ? `<button class="btn-baja bajaCuenta" data-id="${data}">
                <i class="fa-solid fa-ban"></i>
              </button>`
            : `<button class="btn-alta bajaCuenta" data-id="${data}">
                <i class="fa-solid fa-circle-check"></i>
              </button>`;
        let botonesSaldo = '';

        if(row.estado == 1){
            
            botonesSaldo = `
                <button class="agregar-saldo" data-id="${data}">
                    <i class="fa-solid fa-plus"></i>
                </button>

                <button class="retirar-saldo" data-id="${data}">
                    <i class="fa-solid fa-minus"></i>
                </button>
            `;
        }

        return `
            <button class="btn-editar editarCuenta" data-id="${data}">
                <i class="fa-solid fa-pencil-alt"></i>
            </button>

            ${botonesSaldo}
            ${botonEstado}
        `;
    }

    /* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

    /* ═════════════ ( EVENTOS TABLA ) ═════════════ */

    $('#tablaCuentas').on('click', '.editarCuenta', function(){
        abrirModalEditar($(this).data('id'));
    });

    $('#tablaCuentas').on('click', '.agregar-saldo', function(){
        const row = tabla.row($(this).closest('tr')).data();
        abrirModalMovimiento(row, 'AGREGAR');
    });

    $('#tablaCuentas').on('click', '.retirar-saldo', function(){
        const row = tabla.row($(this).closest('tr')).data();
        abrirModalMovimiento(row, 'RETIRAR');
    });

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ═════════════ ( MODAL EDITAR ) ═════════════ */

    function abrirModalEditar(id){

        $.get(`/cuenta/${id}/editar`, function(res){

            const c = res.cuenta;

            $('#editar_id_cuenta').val(c.id_cuenta);
            $('#editar_nombre_cuenta').val(c.nombre_cuenta);
            $('#editar_tipo_cuenta').val(c.tipo_cuenta);
            $('#editar_descripcion_cuenta').val(c.descripcion);
            $('#editar_saldo_cuenta').val(c.saldo_actual);
            $('#editar_estado_cuenta').val(c.estado);

            new bootstrap.Modal('#modalEditarCuenta').show();

        });
    }

/* ═════════════════════════════════════════ */

    $('#btnActualizarCuenta').click(function(){

        const id = $('#editar_id_cuenta').val();

        const datos = {
            nombre_cuenta: $('#editar_nombre_cuenta').val().trim(),
            tipo_cuenta: $('#editar_tipo_cuenta').val().trim(),
            descripcion: $('#editar_descripcion_cuenta').val().trim(),
            saldo_actual: $('#editar_saldo_cuenta').val(),
            estado: $('#editar_estado_cuenta').val(),
            _token: $('meta[name="csrf-token"]').attr('content')
        };

        if(!validarCuenta(datos)) return;

        $.ajax({ url: `/cuenta/${id}/actualizar`, type: 'PUT', data: datos,

            success: function(){

                mostrarToast('Cuenta actualizada correctamente', 'success');
                tabla.ajax.reload();
                bootstrap.Modal.getInstance('#modalEditarCuenta').hide();

            },
            error: manejarErrorAjax
        });

    });

/* ═════════════════════════════════════════ */

    function validarCuenta(d){
        if(d.nombre_cuenta === '') return toastError('El nombre es obligatorio');
        if(d.tipo_cuenta === '') return toastError('El tipo es obligatorio');
        if(d.saldo_actual === '' || parseFloat(d.saldo_actual) < 0) return toastError('Saldo inválido');
        return true;
    }


/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ═════════════ ( MODAL MOVIMIENTOS ) ═════════════ */

    function abrirModalMovimiento(cuenta, tipo){

        $('#modalMovimiento').remove();

        /* ═════════════ ( CONFIGURACIÓN ) ═════════════ */

        let titulo = tipo === 'AGREGAR' ? 'Agregar Saldo' : 'Retirar Saldo';
        let saldoActual = parseFloat(cuenta.saldo_actual);
        let opcionesConcepto = tipo === 'AGREGAR'
            ? `
                <option value="">-- Seleccionar --</option>
                <option>Depósito</option>
                <option>Ingreso por venta</option>
                <option>Transferencia recibida</option>
                <option>Otros ingresos</option>
            `
            : `
                <option value="">-- Seleccionar --</option>
                <option>Pago proveedor</option>
                <option>Gasto operativo</option>
                <option>Retiro de efectivo</option>
                <option>Otros egresos</option>
            `;

        /* ═════════════ ( HTML MODAL ) ═════════════ */

    let html = `
    <div class="modal fade" id="modalMovimiento" tabindex="-1">

        <div class="modal-dialog modal-dialog-centered">

            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title">${titulo}</h5>
                    <button class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">

                    <div class="card-responsive">

                        <form class="row g-3">

                            <input type="hidden" id="movimiento_id_cuenta" value="${cuenta.id_cuenta}">
                            <input type="hidden" id="tipo_movimiento" value="${tipo}">
                            <input type="hidden" id="saldo_base" value="${saldoActual}">

                            <div class="col-12">
                                <label class="form-label">Cuenta</label>
                                <input
                                    type="text"
                                    class="form-control form-control-sm"
                                    value="${cuenta.nombre_cuenta}"
                                    disabled>
                            </div>

                            <div class="col-12">
                                <label class="form-label">Saldo actual</label>
                                <input
                                    type="text"
                                    class="form-control form-control-sm"
                                    value="C$ ${saldoActual.toLocaleString('es-NI',{minimumFractionDigits:2})}"
                                    disabled>
                            </div>

                            <div class="col-12">
                                <label class="form-label">
                                    ${tipo === 'AGREGAR' ? 'Monto a agregar' : 'Monto a retirar'}
                                </label>
                                <input
                                    id="monto_movimiento"
                                    type="number"
                                    step="1"
                                    min="0"
                                    class="form-control form-control-sm">
                            </div>

                            <div class="col-12">

                                <div class="form-check form-switch">

                                    <input
                                        id="checkbox_agregar_retirar"
                                        class="form-check-input"
                                        type="checkbox">

                                    <label class="form-check-label">
                                        Escribir concepto manual
                                    </label>

                                </div>

                            </div>

                            <div class="col-12" id="grupo_selector">

                                <label class="form-label">Concepto</label>

                                <select
                                    id="selector_concepto"
                                    class="form-select form-select-sm">

                                    ${opcionesConcepto}

                                </select>

                            </div>

                            <div class="col-12 d-none" id="grupo_input">

                                <label class="form-label">Concepto manual</label>

                                <textarea
                                    id="input_concepto_acciones"
                                    class="form-control form-control-sm"
                                    rows="1"></textarea>

                            </div>

                            <div class="col-12">

                                <label class="form-label">Saldo resultante</label>

                                <input
                                    id="saldo_resultante"
                                    type="text"
                                    class="form-control form-control-sm fw-bold"
                                    disabled>

                            </div>

                        </form>

                    </div>

                </div>

                <div class="modal-footer">

                    <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">
                        Cancelar
                    </button>

                    <button
                        type="button"
                        id="btnGuardarMovimiento"
                        class="btn guardar btn-sm-modal">
                        Confirmar
                    </button>

                </div>

            </div>

        </div>

    </div>
    `;

        /* ═════════════ ( RENDER MODAL ) ═════════════ */

        $('body').append(html);
        new bootstrap.Modal(document.getElementById('modalMovimiento')).show();
        actualizarResultado();

    }

/* ═════════════ ( EVENTOS MODAL MOVIMIENTO ) ═════════════ */

    $(document).on('input', '#monto_movimiento', actualizarResultado);

    $(document).on('change', '#checkbox_agregar_retirar', function(){
        $('#grupo_selector').toggleClass('d-none', this.checked);
        $('#grupo_input').toggleClass('d-none', !this.checked);
    });

/* ═════════════════════════════════════════ */

    function actualizarResultado(){

        const tipo = $('#tipo_movimiento').val();
        const base = parseFloat($('#saldo_base').val());
        const monto = parseFloat($('#monto_movimiento').val()) || 0;

        let res = tipo === 'AGREGAR' ? base + monto : base - monto;

        let input = $('#saldo_resultante');

        input.val('C$ ' + res.toLocaleString('es-NI', {minimumFractionDigits:2}))
             .removeClass('text-success text-danger')
             .addClass(res >= 0 ? 'text-success' : 'text-danger');
    }


    let procesandoMovimiento = false;

/* ═══════ variable global segura ═══════ */

    //window.procesandoMovimiento = window.procesandoMovimiento || false;

    $(document)
    .off('click', '#btnGuardarMovimiento')
    .on('click', '#btnGuardarMovimiento', function () {

        const btn = $(this);

        //if (window.procesandoMovimiento || btn.prop('disabled')) return; // Evitar doble click

        //window.procesandoMovimiento = true;

        const data = {
            id_cuenta: $('#movimiento_id_cuenta').val(),
            tipo_movimiento: $('#tipo_movimiento').val(),
            monto: parseFloat($('#monto_movimiento').val()),
            descripcion: obtenerDescripcion(),
            _token: $('meta[name="csrf-token"]').attr('content')
        };

        if (!validarMovimiento(data)) { window.procesandoMovimiento = false; return; }
        btn.prop('disabled', true).html('<i class="bi bi-hourglass-split me-1"></i> Procesando...');

        $.ajax({ url: '/cuenta/movimiento', type: 'POST', data,

            success: function (res) {

                mostrarToast(res.mensaje, 'success');
                if (typeof tabla !== 'undefined') { tabla.ajax.reload(null, false); }
                const modalEl = document.getElementById('modalMovimiento');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                modalInstance?.hide();

            }, error: function (xhr) { manejarErrorAjax(xhr); },

            complete: function () { window.procesandoMovimiento = false;
                btn.prop('disabled', false)
                .html('<i class="bi bi-check-circle me-1"></i> Confirmar');
            }

        });
        
    });

/* ═════════════════════════════════════════ */

    function obtenerDescripcion(){
        if($('#checkbox_agregar_retirar').is(':checked')){ return $('#input_concepto_acciones').val().trim(); }
        return $('#selector_concepto').val();
    }

/* ═════════════════════════════════════════ */

    function validarMovimiento(d){
        if(!d.monto || d.monto <= 0) return toastError('Monto inválido');
        if(!d.descripcion) return toastError('Concepto requerido');
        return true;
    }


/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ═════════════ ( HELPERS ) ═════════════ */

    function manejarErrorAjax(err){
        console.error(err);

        if(err.status === 422){
            let e = err.responseJSON.errors;
            for(let k in e) return mostrarToast(e[k][0], 'danger');
        }

        mostrarToast(err.responseJSON?.mensaje || 'Error del servidor', 'danger');
    }

    function toastError(msg){ mostrarToast(msg, 'danger'); return false; }
    $(document).on('hidden.bs.modal', '#modalMovimiento', function () { $(this).remove(); });

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ═════════════ ( Baja Cuenta ) ═════════════ */

    document.addEventListener("click", async function(e) {

        if (e.target.classList.contains("bajaCuenta")) {

            const id = e.target.dataset.id;
            let modalElement = document.getElementById("modalConfirmarEstadoCuenta");

            // Crear modal si no existe
            if (!modalElement) {

                const modalHTML = `
                    <div class="modal fade" id="modalConfirmarEstadoCuenta" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">

                                <div class="modal-header">
                                    <h5 class="modal-title">Confirmar acción</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>

                                <div class="modal-body">
                                    <div class="card-responsive">
                                        ¿Deseas cambiar el estado de esta cuenta?
                                    </div>
                                </div>

                                <div class="modal-footer">
                                    <button class="btn cancelar btn-sm-modal" data-bs-dismiss="modal">Cancelar</button>
                                    <button type="button" class="btn actualizar btn-sm-modal" id="confirmarCambioEstadoCuenta">Confirmar</button>
                                </div>

                            </div>
                        </div>
                    </div>`;

                document.body.insertAdjacentHTML("beforeend", modalHTML);
                modalElement = document.getElementById("modalConfirmarEstadoCuenta");
            }

            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            const botonConfirmar = modalElement.querySelector("#confirmarCambioEstadoCuenta");

            botonConfirmar.onclick = async function () {

                try {

                    const response = await fetch(`/cuenta/cambiar-estado/${id}`, {
                        method: "POST",
                        headers: {
                            "X-CSRF-TOKEN": document
                                .querySelector('meta[name="csrf-token"]')
                                .getAttribute("content")
                        }
                    });

                    const data = await response.json();

                    if (data.success) {

                        mostrarToast("Estado de la cuenta actualizado", "success");

                        $('#tablaCuentas')
                            .DataTable()
                            .ajax.reload(null, false);

                    } else {

                        mostrarToast("Error al cambiar estado", "danger");

                    }

                } catch (error) {

                    mostrarToast("Error de conexión", "danger");
                    console.error(error);

                }

                modal.hide();
            };
        }
    });

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ═════════════ ( Crear Cuenta ) ═════════════ */

/* ═════════ Funcion de Inicializacion ═════════ */

    function inicializarEventos() {
        $('#btnGuardarCuenta').click(GuardarCuenta);
        $('#modalCrearCuenta').on('hidden.bs.modal', limpiarFormulario);
    }inicializarEventos();

    /* ═════════ Funcion Retorno de llamada (Callback) ═════════ */

    function GuardarCuenta() {
        const datosForm = ObtenerDatos();
        const error = Validacion(datosForm);
        if (error) { mostrarToast(error, 'danger'); return; }
        const datos = construirPayload(datosForm);
        const btn = $(this);
        toggleBoton(btn, true);
        CrearCuenta(datos).done(function () {CrearCuentaExitosamente();}).fail(function (err) {manejarError(err);}).always(function () {toggleBoton(btn, false); });
    }

    /* ═════════ Funcion Extractora de datos ═════════ */

    function ObtenerDatos() {

        const saldoInput = $('#crear_saldo_cuenta').val().trim();
        const saldo = saldoInput === '' ? 0 : Number(saldoInput);

        return {
            nombre: $('#crear_nombre_cuenta').val().trim(),
            tipo: $('#crear_tipo_cuenta').val().trim(),
            descripcion: $('#crear_descripcion_cuenta').val().trim(),
            saldo: saldo
        };
    }

    /* ═════════ Funcion Validacion ═════════ */

    function Validacion({ nombre, tipo }) {

        if (nombre === '') return 'El nombre de la cuenta es obligatorio';
        if (tipo === '') return 'El tipo de cuenta es obligatorio';
        return null;
    }

    /* ═════════ Funcion Constructora ═════════ */

    function construirPayload({ nombre, tipo, descripcion, saldo }) {
        return {
            nombre_cuenta: nombre,
            tipo_cuenta: tipo,
            descripcion: descripcion,
            saldo_actual: saldo,
            _token: $('meta[name="csrf-token"]').attr('content')
        };
    }

    /* ═════════ Funcion de Acceso API ═════════ */

    function CrearCuenta(datos) { return $.ajax({ url: '/cuenta/crear', type: 'POST', data: datos }); }

    /* ═════════ Funcion Callback Exitosa ═════════ */

    function CrearCuentaExitosamente() {
        mostrarToast('Cuenta creada correctamente', 'success');
        limpiarFormulario();
        cerrarModal();
        recargarTabla();
    }

    /* ═════════ Funcion Utilitaria ═════════ */

    function limpiarFormulario() { $('#formCrearCuenta')[0].reset(); }
    function toggleBoton(btn, estado) { btn.prop('disabled', estado); }

    /* ═════════ Función utilitaria de UI (DOM) ═════════ */

    function cerrarModal() {
        const modalElement = document.getElementById("modalCrearCuenta");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    }

    /* ═════════ Función utilitaria de UI (DATOS) ═════════ */

    function recargarTabla() { if ($.fn.DataTable.isDataTable('#tablaCuentas')) { $('#tablaCuentas').DataTable().ajax.reload(); } }

    /* ═════════ Función de manejo de errores═════════ */

    function manejarError(err) {

        console.error(err);

        if (err.status === 422) {
            const errores = err.responseJSON.errors;
            const mensaje = Object.values(errores)[0][0];
            mostrarToast(mensaje, 'danger');
        }
        else if (err.responseJSON && err.responseJSON.mensaje) { mostrarToast(err.responseJSON.mensaje, 'danger'); }
        else { mostrarToast('Error inesperado del servidor', 'danger'); }
        
    }

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ═════════════ ( Tranferir entre Cuentas ) ═════════════ */

    function tranferirentrecuentas() { 

        let cuentas = []; // Variable de estado

    /* ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
    /* ═══════════════════════════════════════════════════════ EVENTOS ═══════════════════════════════════════════════════════ */
    /* ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

        /* ═════════ Evento Abrir Modal ═════════ */

        $('#ModalTransferirCuenta').on('show.bs.modal', function () { cargarCuentas(); resetFormulario(); });

        /* ══════════ Evento de Cambio ══════════ */

        $('#cuenta_origen').on('change', function () {

            let origenId = $(this).val();
            let opciones = '<option value="" disabled selected>Seleccione Cuenta</option>';

            cuentas.forEach(c => {
                if (c.id != origenId) { opciones += `<option value="${c.id}" data-saldo="${c.saldo_actual}"> ${c.display} </option>`; }
            });

            $('#cuenta_destino') .html(opciones).prop('disabled', false); //Option deshabilitado

            recalcularUI();

        });

        /* ══════════ Evento de Cambio ══════════ */

        $('#cuenta_destino').on('change', function () { recalcularUI(); });

        /* ══════════ Evento Formatedor ══════════ */

        $('#monto_transferencia').on('input', function () {

            let valor = this.value.replace(/[^0-9.]/g, '');
            let partes = valor.split('.');

            if (partes.length > 2) { valor = partes[0] + '.' + partes[1]; partes = valor.split('.'); }
            if (valor.endsWith('.')) { this.value = 'C$ ' + valor; return; }
            if (!valor) { this.value = ''; calcularResultados(); return; }
            let numero = parseFloat(valor);
            if (isNaN(numero)) return;

            this.value = 'C$ ' + numero.toLocaleString('es-NI', {

                minimumFractionDigits: partes[1] ? partes[1].length : 0,
                maximumFractionDigits: 2

            });

            calcularResultados();

        });

        /* ═════════ Evento de cambio UI ═════════ */

        $('#check_concepto').on('change', function () {
            $('#grupo_selector_concepto').toggleClass('d-none', this.checked); //NO
            $('#grupo_input_concepto').toggleClass('d-none', !this.checked);
        });

        /* ══════ Evento Click con peticion ══════ */

        $('#btnTransferir').on('click', function () {

            let btn = $(this); // Referencia al elemento actual

            /* ══════════════ Objeto de datos ══════════════ */

            let data = { 
                cuenta_origen: $('#cuenta_origen').val(), 
                cuenta_destino: $('#cuenta_destino').val(),
                monto: obtenerMontoLimpio(), 
                descripcion: $('#check_concepto').is(':checked') //No
                    ? $('#input_concepto').val().trim()
                    : $('#selector_concepto').val()
            };

            /*  ════════ Cláusulas de guarda (Validaciones) ════════ */

            if (!data.cuenta_origen) { mostrarToast('Seleccione una Cuenta de salida', 'danger'); return; }
            if (!data.cuenta_destino) { mostrarToast('Seleccione una cuenta entrada', 'danger'); return;}
            if (!data.monto) { mostrarToast('Ingrese saldo a transferir', 'danger'); return; }

            /*  ════════════════════════════════════════════════════ */

            btn.prop('disabled', true).text('Procesando Transferencia'); // Evita doble click deshabilitando

            /*  ═════════════════ LLAMADA HTTP ══════════════════════ */

            $.ajax({ url: '/cuenta/transferir', method: 'POST', data: data, headers:
                { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },

                success: function (res) {

                    if (res.success) { mostrarToast(res.mensaje, 'success'); $('#ModalTransferirCuenta').modal('hide');
                        if ($.fn.DataTable.isDataTable('#tablaCuentas')) { $('#tablaCuentas').DataTable().ajax.reload(); }
                    } else { mostrarToast(res.mensaje || 'Error', 'error'); }

                },
                error: function (xhr) {

                    console.log('❌ ERROR AJAX COMPLETO:', xhr);

                    if (xhr.status === 422) { const errores = xhr.responseJSON?.errors || {}; const mensaje = Object.values(errores)[0]?.[0];
                        console.log('⚠️ ERROR DE VALIDACIÓN:', mensaje);
                    }
                    mostrarToast('Error en la transferencia', 'danger');
                },
                complete: function () { btn.prop('disabled', false).text('Transferir'); }
                
            });

        });

    /* ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
    /* ══════════════════════════════════════════════════════ FUNCIONES ══════════════════════════════════════════════════════ */
    /* ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

        /* ══════════ Reinicio de Interfaz ══════════ */
    
        function resetFormulario() {

            $('#monto_transferencia').val('');
            $('#saldo_origen').val('');
            $('#saldo_destino').val('');
            $('#saldo_origen_resultante').val('');
            $('#saldo_destino_resultante').val('');
            $('#cuenta_origen').prop('selectedIndex', 0);
            $('#check_concepto').prop('checked', false); //NO
            $('#grupo_input_concepto').addClass('d-none');
            $('#grupo_selector_concepto').removeClass('d-none');

        }

        /* ══ Función de retorno (Peticion HTTP) ══ */

        function cargarCuentas() {

            $.get('/cuenta/mostrarselector', function (res) {

                if (!res.success) return;
                cuentas = res.cuentas;
                let opciones = '<option value="" disabled selected>Seleccione Cuenta de Origen</option>';
                cuentas.forEach(c => { opciones += `<option value="${c.id}" data-saldo="${c.saldo_actual}"> ${c.display} </option>`; });
                $('#cuenta_origen').html(opciones);
                $('#cuenta_destino') .html('<option value="" disabled selected>Seleccione Cuenta de Destino</option>') .prop('disabled', true);

            });
        }

        /* ═════════ Funcion Utilitaria ═════════ */

        function obtenerMontoLimpio() {
            let texto = $('#monto_transferencia').val();
            return parseFloat( texto.replace('C$', '').replace(/,/g, '')) || 0;
        }

        /* ═══ Función de sincronizacion de UI ═══ */

        function actualizarSaldos() {

            const setSaldo = (selectorOrigen, selectorDestino) => {

                const valor = $(selectorOrigen).val();
                if (!valor) { $(selectorDestino).val(''); return; }
                const saldo = parseFloat( $(selectorOrigen + ' option:selected').data('saldo')) || 0;
                $(selectorDestino).val(formatear(saldo));

            };

            setSaldo('#cuenta_origen', '#saldo_origen');
            setSaldo('#cuenta_destino', '#saldo_destino');
        }

        /* Funcion híbrida (logica de negocio + actualizacion de UI) */

        function calcularResultados() {

            let monto = obtenerMontoLimpio();
            let saldoOrigen = parseFloat($('#cuenta_origen option:selected').data('saldo')) || 0;
            let saldoDestino = parseFloat($('#cuenta_destino option:selected').data('saldo')) || 0;
            $('#saldo_origen_resultante').val(formatear(saldoOrigen - monto));
            $('#saldo_destino_resultante').val(formatear(saldoDestino + monto));

        }

        /* ═════════ Funcion Utilitaria ═════════ */

        function formatear(valor) {

            return 'C$ ' + Number(valor).toLocaleString('es-NI', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

        }

        /* ════════ Funcion Coordinadora ════════ */

        function recalcularUI() {
            actualizarSaldos();
            calcularResultados();
        }

    }; tranferirentrecuentas();


};