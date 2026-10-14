export default function initMostrarCajas() {

    document.getElementById('titulo').textContent = 'CONTROL DE CAJAS';

    const fechaInicioInput = document.getElementById('arqueoFechaInicio');
    const fechaFinInput = document.getElementById('arqueoFechaFin');
    const selectorInicio = fechaInicioInput._flatpickr || FlatPickr(fechaInicioInput);
    const selectorFin = fechaFinInput._flatpickr || FlatPickr(fechaFinInput);
    selectorInicio.clear(false);
    selectorFin.clear(false);
    let cajaSeleccionada = null;
    const seleccionadas = new Set();
    let cajasMultiple = [];

    function fechaLocal(fecha) {
        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${anio}-${mes}-${dia}`;
    }

    function escapeHtml(valor) {
        return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        })[caracter]);
    }

    function actualizarResumen(resumen = {}) {
        $('#arqueoTotalCajas').text(resumen.total_cajas ?? 0);
        $('#arqueoTotalTeorico').text(moneda(resumen.monto_teorico ?? 0));
        $('#arqueoTotalReal').text(moneda(resumen.monto_real ?? 0));
        const diferencia = Number(resumen.diferencia ?? 0);
        const elemento = $('#arqueoTotalDiferencia');
        elemento.text(`${diferencia > 0 ? '+' : diferencia < 0 ? '-' : ''}${moneda(Math.abs(diferencia))}`)
            .removeClass('arqueo-diferencia-positiva arqueo-diferencia-negativa arqueo-diferencia-cero')
            .addClass(diferencia > 0 ? 'arqueo-diferencia-positiva' : diferencia < 0 ? 'arqueo-diferencia-negativa' : 'arqueo-diferencia-cero');
    }

    function renderDiferencia(valor) {
        if (valor === null || valor === undefined) return '<span class="text-muted">Sin arqueo</span>';
        const diferencia = Number(valor);
        const clase = diferencia > 0 ? 'arqueo-diferencia-positiva' : diferencia < 0 ? 'arqueo-diferencia-negativa' : 'arqueo-diferencia-cero';
        const signo = diferencia > 0 ? '+' : diferencia < 0 ? '-' : '';
        return `<span class="${clase}">${signo}${moneda(Math.abs(diferencia))}</span>`;
    }

    function renderEstado(caja) {
        if (caja.estado_caja) return '<span class="arqueo-estado arqueo-estado-abierta">Abierta</span>';
        if (caja.monto_real === null || caja.monto_real === undefined) return '<span class="arqueo-estado arqueo-estado-pendiente">Pendiente</span>';
        return '<span class="arqueo-estado arqueo-estado-arqueada">Arqueada</span>';
    }

    const tabla = $('#tablaCajas').DataTable({
        ajax: {
            url: '/cajas/arqueo',
            type: 'GET',
            data: function (consulta) {
                const inicio = $('#arqueoFechaInicio').val();
                const fin = $('#arqueoFechaFin').val();
                if (inicio) consulta.fecha_inicio = inicio;
                if (fin) consulta.fecha_fin = fin;
            },
            dataSrc: function (respuesta) {
                actualizarResumen(respuesta.resumen);
                const cajas = respuesta.cajas ?? [];
                const idsVigentes = new Set(cajas.map(caja => Number(caja.id_caja)));
                [...seleccionadas].forEach(id => { if (!idsVigentes.has(id)) seleccionadas.delete(id); });
                return cajas;
            }
        },
        order: [[1, 'desc']],
        columns: [
            {
                data: 'id_caja',
                orderable: false,
                searchable: false,
                className: 'arqueo-col-check',
                render: function (data, _type, fila) {
                    if (fila.estado_caja) return '';
                    const id = Number(data);
                    return `<input type="checkbox" class="form-check-input arqueo-check" data-id="${id}" ${seleccionadas.has(id) ? 'checked' : ''} aria-label="Seleccionar caja #${id}">`;
                }
            },
            {
                data: 'id_caja',
                render: function (data, type) {
                    if (type === 'sort' || type === 'type') return Number(data);
                    return `<strong class="arqueo-numero">Caja #${Number(data)}</strong>`;
                }
            },
            { data: 'usuario', render: data => escapeHtml(data || '—') },
            { data: 'fecha_apertura', render: data => data ? formatearFechaDiaHora(data) : '—' },
            { data: 'fecha_cierre', render: data => data ? formatearFechaDiaHora(data) : '—' },
            { data: 'monto_inicial', render: data => moneda(data) },
            {
                data: 'monto_teorico',
                render: function (data, _type, fila) {
                    const texto = moneda(data);
                    const teorico = Number(data);
                    const inicial = Number(fila.monto_inicial);

                    if (teorico < inicial) return `<span class="arqueo-monto-bajo">${texto}</span>`;
                    if (teorico > inicial) return `<span class="arqueo-monto-alto">${texto}</span>`;
                    return texto;
                }
            },
            { data: 'monto_real', render: data => (data === null || data === undefined) ? '<span class="text-muted">—</span>' : moneda(data) },
            { data: 'diferencia', render: renderDiferencia },
            { data: null, render: (_data, _type, fila) => renderEstado(fila) },
            {
                data: null,
                orderable: false,
                searchable: false,
                render: function (_data, _type, fila) {
                    if (fila.estado_caja) return '<span class="text-muted">—</span>';

                    const caja = Number(fila.id_caja);
                    const pendiente = fila.monto_real === null || fila.monto_real === undefined;
                    const etiqueta = pendiente ? 'Registrar arqueo' : 'Corregir arqueo';

                    return `<div class="arqueo-acciones">
                        <button type="button" class="btn-arqueo js-abrir-arqueo" data-id="${caja}" title="${etiqueta} de la caja #${caja}" aria-label="${etiqueta} de la caja #${caja}">
                            <i class="fa-solid fa-scale-balanced" aria-hidden="true"></i>
                        </button>
                        ${pendiente ? '' : `<button type="button" class="btn-arqueo btn-arqueo-print js-imprimir-caja" data-id="${caja}" title="Imprimir arqueo de la caja #${caja}" aria-label="Imprimir arqueo de la caja #${caja}"><i class="fa-solid fa-print" aria-hidden="true"></i></button>`}
                    </div>`;
                }
            }
        ],
        drawCallback: function () { AnimarFilasVisibles(this.api()); actualizarEstadoSeleccion(this.api()); }
    });

    function consultarArqueos() {
        let inicio = $('#arqueoFechaInicio').val();
        let fin = $('#arqueoFechaFin').val();
        if (!inicio && !fin) {
            tabla.ajax.reload();
            return;
        }
        if (inicio && !fin) {
            selectorFin.setDate(inicio, false, 'Y-m-d');
            fin = inicio;
        } else if (!inicio && fin) {
            selectorInicio.setDate(fin, false, 'Y-m-d');
            inicio = fin;
        }
        if (inicio > fin) {
            mostrarToast('Seleccione un rango de fechas válido', 'danger');
            return;
        }
        tabla.ajax.reload();
    }

    $('#arqueoFechaInicio, #arqueoFechaFin').off('change.filtroArqueo').on('change.filtroArqueo', consultarArqueos);
    $('#btnArqueoHoy').off('click.filtroArqueo').on('click.filtroArqueo', function () {
        const fecha = fechaLocal(new Date());
        selectorInicio.setDate(fecha, false, 'Y-m-d');
        selectorFin.setDate(fecha, false, 'Y-m-d');
        consultarArqueos();
    });
    $('#btnArqueoSemana').off('click.filtroArqueo').on('click.filtroArqueo', function () {
        const hoySemana = new Date();
        const inicio = new Date(hoySemana.getFullYear(), hoySemana.getMonth(), hoySemana.getDate());
        inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
        const fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
        selectorInicio.setDate(fechaLocal(inicio), false, 'Y-m-d');
        selectorFin.setDate(fechaLocal(fin), false, 'Y-m-d');
        consultarArqueos();
    });

    $('#btnLimpiarFiltros').off('click.limpiarFiltros').on('click.limpiarFiltros', function () {
        selectorInicio.clear(false);
        selectorFin.clear(false);
        tabla.search('');
        tabla.ajax.reload();
    });

    $('#btnImprimirArqueo').off('click.imprimirArqueo').on('click.imprimirArqueo', function () {
        const params = new URLSearchParams();
        const inicio = $('#arqueoFechaInicio').val();
        const fin = $('#arqueoFechaFin').val();
        if (inicio) params.set('fecha_inicio', inicio);
        if (fin) params.set('fecha_fin', fin);
        window.open(`/cajas/arqueo/imprimir?${params.toString()}`, '_blank', 'noopener');
    });

    $('#tablaCajas').off('click.arqueoCaja', '.js-abrir-arqueo').on('click.arqueoCaja', '.js-abrir-arqueo', function () {
        cajaSeleccionada = tabla.row($(this).closest('tr')).data();
        if (!cajaSeleccionada) return;

        const existente = cajaSeleccionada.monto_real !== null && cajaSeleccionada.monto_real !== undefined;
        $('#tituloModalArqueo').text(existente ? 'Corregir Arqueo' : 'Registrar Arqueo');
        $('#arqueoCajaEtiqueta').text(`Caja #${cajaSeleccionada.id_caja}`);
        $('#arqueoCajaInicial').text(moneda(cajaSeleccionada.monto_inicial));
        $('#arqueoCajaTeorico').text(moneda(cajaSeleccionada.monto_teorico));
        $('#arqueoCajaReal').val(existente ? Number(cajaSeleccionada.monto_real).toFixed(2) : '');
        $('#btnGuardarArqueo').text(existente ? 'Guardar corrección' : 'Guardar arqueo');
        actualizarDiferenciaPrevia();
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarArqueo')).show();
    });

    function actualizarDiferenciaPrevia() {
        const valor = $('#arqueoCajaReal').val();
        const salida = $('#arqueoCajaDiferencia');
        if (valor === '' || !Number.isFinite(Number(valor))) {
            salida.text('').removeClass('arqueo-diferencia-positiva arqueo-diferencia-negativa arqueo-diferencia-cero');
            return;
        }

        const diferencia = Math.round((Number(valor) - Number(cajaSeleccionada?.monto_teorico ?? 0)) * 100) / 100;
        const tipo = diferencia > 0 ? 'Sobrante' : diferencia < 0 ? 'Faltante' : 'Sin diferencia';
        const clase = diferencia > 0 ? 'arqueo-diferencia-positiva' : diferencia < 0 ? 'arqueo-diferencia-negativa' : 'arqueo-diferencia-cero';
        salida.text(`${tipo}: ${moneda(Math.abs(diferencia))}`)
            .removeClass('arqueo-diferencia-positiva arqueo-diferencia-negativa arqueo-diferencia-cero')
            .addClass(clase);
    }

    $('#arqueoCajaReal').off('input.previsualizarArqueo').on('input.previsualizarArqueo', actualizarDiferenciaPrevia);

    $('#btnGuardarArqueo').off('click.guardarArqueo').on('click.guardarArqueo', function () {
        const boton = $(this);
        const montoReal = $('#arqueoCajaReal').val();
        if (!cajaSeleccionada || montoReal === '' || !Number.isFinite(Number(montoReal)) || Number(montoReal) < 0) {
            mostrarToast('Ingrese un monto real válido', 'danger');
            return;
        }

        boton.prop('disabled', true);
        $.ajax({
            url: `/cajas/${Number(cajaSeleccionada.id_caja)}/arqueo`,
            method: 'PUT',
            data: {
                monto_real: montoReal,
                _token: $('meta[name="csrf-token"]').attr('content')
            }
        }).done(function () {
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarArqueo')).hide();
            mostrarToast('Arqueo guardado correctamente', 'success');
            tabla.ajax.reload(null, false);
        }).fail(function (xhr) {
            const errores = xhr.responseJSON?.errors;
            const mensaje = errores ? Object.values(errores).flat()[0] : xhr.responseJSON?.mensaje;
            mostrarToast(mensaje || 'No se pudo guardar el arqueo', 'danger');
        }).always(function () {
            boton.prop('disabled', false);
        });
    });

    $('#tablaCajas').off('click.imprimirCaja', '.js-imprimir-caja').on('click.imprimirCaja', '.js-imprimir-caja', function () {
        window.open(`/cajas/arqueo/${Number($(this).data('id'))}/imprimir`, '_blank', 'noopener');
    });

    /* ╔═══════════ Selección múltiple ═══════════╗ */

    function filasSeleccionables(api) {
        const dt = api || tabla;
        return dt.rows({ page: 'current' }).nodes().toArray()
            .map(fila => fila.querySelector('.arqueo-check'))
            .filter(Boolean);
    }

    function actualizarEstadoSeleccion(api) {
        const checks = filasSeleccionables(api);
        const marcados = checks.filter(check => check.checked);
        const todos = document.getElementById('arqueoSeleccionarTodo');

        if (todos) {
            todos.checked = checks.length > 0 && marcados.length === checks.length;
            todos.indeterminate = marcados.length > 0 && marcados.length < checks.length;
            todos.disabled = checks.length === 0;
        }

        const cantidad = document.getElementById('arqueoSeleccionCantidad');
        if (cantidad) cantidad.textContent = seleccionadas.size;

        const boton = document.getElementById('btnArquearSeleccionadas');
        if (boton) boton.disabled = seleccionadas.size === 0;
    }

    $('#tablaCajas').off('change.arqueoCheck', '.arqueo-check').on('change.arqueoCheck', '.arqueo-check', function () {
        const id = Number(this.dataset.id);
        if (this.checked) seleccionadas.add(id); else seleccionadas.delete(id);
        actualizarEstadoSeleccion();
    });

    $('#arqueoSeleccionarTodo').off('change.arqueoTodo').on('change.arqueoTodo', function () {
        const marcar = this.checked;

        filasSeleccionables().forEach(check => {
            check.checked = marcar;
            const id = Number(check.dataset.id);
            if (marcar) seleccionadas.add(id); else seleccionadas.delete(id);
        });

        actualizarEstadoSeleccion();
    });

    /* ╔═══════════ Arqueo múltiple ═══════════╗ */

    function cajasSeleccionadas() {
        return tabla.rows().data().toArray()
            .filter(fila => seleccionadas.has(Number(fila.id_caja)));
    }

    function totalTeoricoMultiple(filas = cajasMultiple) {
        return Math.round(filas.reduce((suma, fila) => suma + Number(fila.monto_teorico || 0), 0) * 100) / 100;
    }

    function actualizarDiferenciaMultiple() {
        const salida = document.getElementById('arqueoMultipleDiferencia');
        const boton = document.getElementById('btnGuardarArqueoMultiple');
        const valor = document.getElementById('arqueoMultipleReal').value;

        if (valor === '' || !Number.isFinite(Number(valor)) || Number(valor) < 0) {
            if (salida) {
                salida.textContent = 'C$ 0.00';
                salida.className = 'arqueo-diferencia-cero';
            }
            if (boton) boton.disabled = true;
            return false;
        }

        const diferencia = Math.round((Number(valor) - totalTeoricoMultiple()) * 100) / 100;

        if (salida) {
            const signo = diferencia > 0 ? '+' : diferencia < 0 ? '-' : '';
            salida.textContent = `${signo}${moneda(Math.abs(diferencia))}`;
            salida.className = diferencia > 0 ? 'arqueo-diferencia-positiva' : diferencia < 0 ? 'arqueo-diferencia-negativa' : 'arqueo-diferencia-cero';
        }

        if (boton) boton.disabled = false;
        return true;
    }

    $('#btnArquearSeleccionadas').off('click.arqueoMultiple').on('click.arqueoMultiple', function () {
        const filas = cajasSeleccionadas();

        if (!filas.length) {
            mostrarToast('Seleccione al menos una caja cerrada', 'warning');
            return;
        }

        cajasMultiple = filas;

        const cantidad = document.getElementById('arqueoMultipleCantidad');
        if (cantidad) cantidad.textContent = filas.length;

        const incluidas = document.getElementById('arqueoMultipleIncluidas');
        if (incluidas) incluidas.textContent = 'Cajas incluidas: ' + filas.map(fila => `#${Number(fila.id_caja)}`).join(', ');

        const teorico = document.getElementById('arqueoMultipleTeorico');
        if (teorico) teorico.textContent = moneda(totalTeoricoMultiple());

        document.getElementById('arqueoMultipleReal').value = '';
        actualizarDiferenciaMultiple();

        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalArqueoMultiple')).show();
    });

    $('#arqueoMultipleReal').off('input.arqueoMultiple').on('input.arqueoMultiple', actualizarDiferenciaMultiple);

    $('#btnGuardarArqueoMultiple').off('click.guardarArqueoMultiple').on('click.guardarArqueoMultiple', function () {
        if (!cajasMultiple.length || !actualizarDiferenciaMultiple()) {
            mostrarToast('Ingrese el efectivo contado total', 'danger');
            return;
        }

        const boton = $(this);
        const token = $('meta[name="csrf-token"]').attr('content');
        const realTotal = Math.round(Number(document.getElementById('arqueoMultipleReal').value) * 100) / 100;
        const diferenciaTotal = Math.round((realTotal - totalTeoricoMultiple()) * 100) / 100;

        const items = cajasMultiple.map(function (fila, indice) {
            const teorico = Number(fila.monto_teorico || 0);
            const montoReal = indice === 0
                ? Math.round((teorico + diferenciaTotal) * 100) / 100
                : teorico;

            return { id: Number(fila.id_caja), monto_real: montoReal };
        });

        const negativa = items.find(item => item.monto_real < 0);
        if (negativa) {
            mostrarToast(`El total ingresado deja la caja #${negativa.id} con un real negativo. Revise el monto.`, 'danger');
            return;
        }

        if (!items.length) return;

        boton.prop('disabled', true).text('Guardando...');

        const peticiones = items.map(item => $.ajax({
            url: `/cajas/${item.id}/arqueo`,
            method: 'PUT',
            data: { monto_real: item.monto_real, _token: token }
        }));

        Promise.allSettled(peticiones).then(function (resultados) {
            const guardados = resultados.filter(resultado => resultado.status === 'fulfilled').length;
            const errores = resultados.length - guardados;

            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalArqueoMultiple')).hide();
            seleccionadas.clear();
            actualizarEstadoSeleccion();
            tabla.ajax.reload(null, false);

            if (errores === 0) {
                mostrarToast(`${guardados} arqueo${guardados === 1 ? '' : 's'} guardado${guardados === 1 ? '' : 's'} correctamente`, 'success');
            } else if (guardados === 0) {
                mostrarToast('No se pudo guardar ningún arqueo', 'danger');
            } else {
                mostrarToast(`${guardados} guardados y ${errores} con error`, 'warning');
            }
        }).finally(function () {
            boton.prop('disabled', false).text('Guardar arqueos');
        });
    });

};
