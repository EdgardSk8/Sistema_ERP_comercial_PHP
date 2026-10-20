export default function initMostrarMetodosPagosCuenta() {

    $(document).off('.metodoPagoCuenta');

    //MOSTRAR DATOS EN DATATABLES
    const tabla = $('#tablaMetodoPagoCuenta').DataTable({
        ajax: { url: '/metodos-pago-cuenta/mostrar', type: 'GET', dataSrc: 'referencias' },

        columns: [

            { data: 'nombre_metodo_pago' },

            { data: 'cuentas', render: function(data) {
                if (!data || data.length === 0) { return '<span>Sin cuentas</span>'; }
                return data.map(cuenta => `<span class="badge bg-success me-1">${cuenta}</span>` ).join(''); }
            },

            { data: 'estado', render: function(data) { return data == 1
                ? '<span class="estado estado-activo">Activo</span>'
                : '<span class="estado estado-inactivo">Inactivo</span>'; }
            },

            { data: 'id_metodo_pago_cuenta', render: 
                function(data, type, row) {

                    let tieneCuentas = row.cuentas && row.cuentas.length > 0;
                    let botones = 'Sin acciones';

                    if (tieneCuentas) {

                        let botonEstado = row.estado == 1
                            ? `<button class="btn-baja cambiarEstado" data-id="${row.id_metodo_pago_cuenta}">
                                    <i class="ph ph-prohibit"></i>
                            </button>`
                            : `<button class="btn-alta cambiarEstado" data-id="${row.id_metodo_pago_cuenta}">
                                    <i class="ph ph-check-circle"></i>
                            </button>`;

                        let botonEditar = `
                            <button class="btn-editar editarMetodoPagoCuenta"
                                data-id="${row.id_metodo_pago_cuenta}">
                                <i class="ph ph-pencil-simple"></i>
                            </button> `; botones = botonEditar + botonEstado;
                    }

                    return botones;
                }
            }
        ], drawCallback: function () { AnimarFilasVisibles(this.api()); }

    });

    configurarToggleColumnas('tablaMetodoPagoCuenta');
    
    //FUNCIONES DE INTERFAZ CREAR VINCULOS
    $.get('/metodos-pago-cuenta/metodos-cuentas/mostrar', function(response) {

        const $metodo = $('#id_metodo_pago');
        const $cuenta = $('#id_cuenta');
        const $lista = $('#listaCuentasVinculadas');
        const $resumen = $('#resumenVinculosMetodoPago');

        const llenarSelect = ($select, datos, id, nombre) => {
            $select.html('<option value="">Seleccione...</option>');
            datos.forEach(item => { $select.append( `<option value="${item[id]}">${item[nombre]}</option>` ); });
        };

        llenarSelect( $metodo, response.metodos_pago, 'id_metodo_pago', 'nombre_metodo_pago' );
        llenarSelect( $cuenta, response.cuentas, 'id_cuenta', 'nombre_cuenta' );

        $metodo.on('change', function() {

            const idMetodoPago = $(this).val();
            if (!idMetodoPago) { $lista.html( '<div class="text-muted small">Seleccione un método de pago...</div>' ); return actualizarResumenVinculo(); }

            $.get(`/metodos-pago-cuenta/cuentas-vinculadas/mostrar/${idMetodoPago}`, function(response) {

                $lista.html( response.cuentas.length
                    ? response.cuentas.map(cuenta => ` <span class="badge bg-success me-1 mb-1"> ${cuenta.nombre_cuenta} </span> `).join('')
                    : '<div class="text-muted small">No hay cuentas vinculadas</div>'
                );

            });

            actualizarResumenVinculo();

        });

        $cuenta.on('change', actualizarResumenVinculo);

        function actualizarResumenVinculo() {
            if (!$metodo.val() || !$cuenta.val()) { return $resumen.html( '<span class="text-muted">Seleccione un método de pago y una cuenta.</span>' ); }
            $resumen.html(` El método de pago <strong>${$metodo.find(':selected').text()}</strong> se vinculará a la cuenta <strong>${$cuenta.find(':selected').text()}</strong> `);
        }

    });

    //CREAR VINCULO DE METODO DE PAGOS Y CUENTAS
    $(document).on('click.metodoPagoCuenta', '#btnGuardarMetodoPagoCuenta', function() {

        let id_metodo_pago = $('#id_metodo_pago').val();
        let id_cuenta = $('#id_cuenta').val();

        if (!id_metodo_pago) { mostrarToast('Seleccione un método de pago', 'warning'); return; }
        if (!id_cuenta) { mostrarToast('Seleccione una cuenta', 'warning'); return; }

        $.ajax({ url: '/metodos-pago-cuenta/crear', type: 'POST', data: { id_metodo_pago, id_cuenta },

            success: function(response) {

                if (response.success) {

                    bootstrap.Modal.getOrCreateInstance(document.getElementById('ModalCrearMetodoPagoCuenta')).hide();
                    $('#tablaMetodoPagoCuenta').DataTable().ajax.reload(null, false);

                    mostrarToast(response.mensaje || 'Vínculo creado correctamente','success');
                    $('#id_metodo_pago').val(''); $('#id_cuenta').val('');

                }

            },

            error: function(xhr) { let mensaje = 'Ocurrió un error'; 
                if (xhr.responseJSON?.mensaje) { mensaje = xhr.responseJSON.mensaje; } mostrarToast(mensaje, 'error');
            }

        });

    });

    //EDITAR VINCULOS DE LAS CUENTAS ASOCIADAS A METODOS
    $(document).on('click.metodoPagoCuenta', '.editarMetodoPagoCuenta', function() {

        let id = $(this).data('id');
        console.log("id metodo: ", id);
        console.log($(this).data('id'));

        $.get(`/metodos-pago-cuenta/${id}/editar`, function(response) {

            if (!response.success) {
                mostrarToast(response.mensaje, 'error');
                return;
            }

            $('#editar_id_metodo_pago_cuenta').val(response.referencia.id_metodo_pago_cuenta);

            $('#editar_id_metodo_pago')
                .val(response.referencia.id_metodo_pago);

            $('#editar_nombre_metodo_pago')
                .val(response.referencia.nombre_metodo_pago);

            let html = '';

            if (response.cuentas_vinculadas.length === 0) {

                html = `
                    <div class="text-muted small">
                        No existen cuentas vinculadas
                    </div>
                `;

            } else {

                response.cuentas_vinculadas.forEach(cuenta => {

                    html += `
                        <div class="d-flex justify-content-between align-items-center border rounded mb-2" style="padding: 0px 0px 0px 10px">

                            <span>
                                ${cuenta.nombre_cuenta}
                            </span>

                            <button
                                type="button"
                                class="btn-baja quitarCuentaVinculada"
                                data-id="${cuenta.id_metodo_pago_cuenta}"
                                title="Quitar vínculo">

                                <i class="ph ph-x"></i>

                            </button>

                        </div>
                    `;

                });

            }

            $('#editar_listaCuentasVinculadas')
                .html(html);

            bootstrap.Modal.getOrCreateInstance(
                document.getElementById('ModalEditarMetodoPagoCuenta')
            ).show();

        });

    });

    //QUITAR LOS VINCULOS RELACIONADOS
    $(document).on('click.metodoPagoCuenta', '.quitarCuentaVinculada', function() {

        const id = $(this).data('id');

        $(this)
            .closest('.d-flex')
            .addClass('bg-danger-subtle border-danger')
            .attr('data-eliminar', id);

        $(this).replaceWith(`
            <span
                class="badge bg-danger cuenta-eliminada"
                data-id="${id}">
                Se eliminará
            </span>
        `);

    });

    //FUNCION DE ACTUALIZAR VINCULOS
    $(document).on('click.metodoPagoCuenta', '#btnActualizarMetodoPagoCuenta', function() {

        let idMetodoPagoCuenta = $('#editar_id_metodo_pago_cuenta').val();
        let cuentasEliminar = [];

        $('#editar_listaCuentasVinculadas [data-eliminar]').each(function() {
            cuentasEliminar.push( $(this).attr('data-eliminar') );
        });

        if (cuentasEliminar.length === 0) { mostrarToast( 'No hay cambios para guardar', 'info' ); return; }

        $.ajax({ url: `/metodos-pago-cuenta/${idMetodoPagoCuenta}/actualizar`, type: 'PUT',
            data: { cuentas_eliminar: cuentasEliminar },

            success: function(response) {
                mostrarToast( response.mensaje, 'success' );
                bootstrap.Modal.getInstance(document.getElementById('ModalEditarMetodoPagoCuenta')).hide();
                $('#tablaMetodoPagoCuenta').DataTable().ajax.reload(null, false);
            },

            error: function(xhr) {
                console.log(xhr.responseJSON);
                let mensaje = xhr.responseJSON?.mensaje || xhr.responseJSON?.message || 'Ocurrió un error';
                mostrarToast(mensaje, 'error');
            }

        });

    });

    // CAMBIAR ESTADO
    $(document).on(
        'click.metodoPagoCuenta',
        '.cambiarEstado',
        function() {

            let id = $(this).data('id');
            console.log(id)

            $.ajax({

                url: `/metodos-pago-cuenta/cambiar-estado/${id}`,
                type: 'POST',

                success: function(response) {

                    mostrarToast(
                        response.mensaje,
                        'success'
                    );

                    $('#tablaMetodoPagoCuenta')
                        .DataTable()
                        .ajax
                        .reload(null, false);

                },

                error: function(xhr) {

                    mostrarToast(
                        xhr.responseJSON?.mensaje ||
                        'Error al cambiar estado',
                        'error'
                    );

                }

            });

        }
    );

}
