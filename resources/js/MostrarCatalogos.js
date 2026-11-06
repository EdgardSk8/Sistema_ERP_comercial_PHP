export default function initMostrarCatalogos() {

    /* ════════════════ TÍTULO DINAMICO DE LA VISTA ════════════════ */

    document.getElementById('titulo').textContent = 'CATÁLOGOS DE PRODUCTOS';

    const csrf = () => $('meta[name="csrf-token"]').attr('content');

    const escapar = (valor) => String(valor ?? '').replace(/[&<>"']/g, caracter => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[caracter]));

    const modal = (id) => new bootstrap.Modal(document.getElementById(id));

    /* ════════════════ CARGAR CATÁLOGOS ════════════════ */

    function cargarCatalogos() {

        $.get('/catalogos-producto/mostrar', function (res) {

            pintarMarcas(res.marcas || []);
            pintarAtributos(res.atributos || []);

        }).fail(function () {
            mostrarToast('No se pudieron cargar los catálogos', 'danger');
        });
    }

    function pintarMarcas(marcas) {

        const cuerpo = $('#tablaMarcas tbody');

        if (!marcas.length) {
            cuerpo.html('<tr><td colspan="4" class="text-center text-muted">Sin marcas registradas</td></tr>');
            return;
        }

        cuerpo.html(marcas.map(marca => `
            <tr>
                <td>${escapar(marca.nombre_marca)}</td>
                <td>${Number(marca.productos_count) || 0}</td>
                <td>${marca.estado_marca
                    ? '<span class="estado estado-activo">Activa</span>'
                    : '<span class="estado estado-inactivo">Inactiva</span>'}</td>
                <td>
                    <button class="btn-editar editarMarca" data-id="${marca.id_marca}"
                            data-nombre="${escapar(marca.nombre_marca)}">
                        <i class="ph ph-pencil-simple"></i>
                    </button>

                    <button class="btn-baja cambiarEstadoMarca" data-id="${marca.id_marca}">
                        <i class="ph ${marca.estado_marca ? 'ph-prohibit' : 'ph-check-circle'}"></i>
                    </button>
                </td>
            </tr>
        `).join(''));
    }

    function pintarAtributos(atributos) {

        const cuerpo = $('#tablaAtributos tbody');

        if (!atributos.length) {
            cuerpo.html('<tr><td colspan="4" class="text-center text-muted">Sin atributos registrados</td></tr>');
            return;
        }

        cuerpo.html(atributos.map(atributo => {

            const valores = (atributo.valores || []).filter(valor => valor.estado_valor);
            const lista = valores.map(valor => escapar(valor.valor_atributo)).join(', ');

            return `
                <tr>
                    <td>${escapar(atributo.nombre_atributo)}</td>
                    <td class="small">${lista || '—'}</td>
                    <td>${atributo.estado_atributo
                        ? '<span class="estado estado-activo">Activo</span>'
                        : '<span class="estado estado-inactivo">Inactivo</span>'}</td>
                    <td>
                        <button class="btn-editar editarAtributo" data-id="${atributo.id_atributo}"
                                data-nombre="${escapar(atributo.nombre_atributo)}"
                                data-valores="${escapar(valores.map(valor => valor.valor_atributo).join(', '))}">
                            <i class="ph ph-pencil-simple"></i>
                        </button>

                        <button class="btn-baja cambiarEstadoAtributo" data-id="${atributo.id_atributo}">
                            <i class="ph ${atributo.estado_atributo ? 'ph-prohibit' : 'ph-check-circle'}"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join(''));
    }

    /* ════════════════ MARCAS ════════════════ */

    $('#btnNuevaMarca').on('click', function () {
        $('#marca_id').val('');
        $('#marca_nombre').val('');
        $('#tituloModalMarca').text('Nueva marca');
        modal('modalMarca').show();
    });

    $('#tablaMarcas').on('click', '.editarMarca', function () {
        $('#marca_id').val($(this).data('id'));
        $('#marca_nombre').val($(this).data('nombre'));
        $('#tituloModalMarca').text('Editar marca');
        modal('modalMarca').show();
    });

    $('#btnGuardarMarca').on('click', function () {

        const id = $('#marca_id').val();
        const nombre = $('#marca_nombre').val().trim();

        if (!nombre) {
            mostrarToast('El nombre de la marca es obligatorio', 'danger');
            return;
        }

        $.ajax({
            url: id ? `/catalogos-producto/marca/${id}/actualizar` : '/catalogos-producto/marca/crear',
            type: 'POST',
            data: { _token: csrf(), _method: id ? 'PUT' : 'POST', nombre_marca: nombre },
            success: function (res) {
                mostrarToast(res.mensaje || 'Marca guardada', 'success');
                bootstrap.Modal.getInstance(document.getElementById('modalMarca'))?.hide();
                cargarCatalogos();
            },
            error: function (err) {
                mostrarToast(mensajeError(err, 'No se pudo guardar la marca'), 'danger');
            },
        });
    });

    $('#tablaMarcas').on('click', '.cambiarEstadoMarca', function () {

        const id = $(this).data('id');

        $.post(`/catalogos-producto/marca/cambiar-estado/${id}`, { _token: csrf() }, function (res) {
            mostrarToast(res.mensaje || 'Estado actualizado', 'success');
            cargarCatalogos();
        }).fail(function (err) {
            mostrarToast(mensajeError(err, 'No se pudo cambiar el estado'), 'danger');
        });
    });

    /* ════════════════ ATRIBUTOS ════════════════ */

    $('#btnNuevoAtributo').on('click', function () {
        $('#atributo_id').val('');
        $('#atributo_nombre').val('');
        $('#atributo_valores').val('');
        $('#tituloModalAtributo').text('Nuevo atributo');
        modal('modalAtributo').show();
    });

    $('#tablaAtributos').on('click', '.editarAtributo', function () {
        $('#atributo_id').val($(this).data('id'));
        $('#atributo_nombre').val($(this).data('nombre'));
        $('#atributo_valores').val($(this).data('valores'));
        $('#tituloModalAtributo').text('Editar atributo');
        modal('modalAtributo').show();
    });

    $('#btnGuardarAtributo').on('click', function () {

        const id = $('#atributo_id').val();
        const nombre = $('#atributo_nombre').val().trim();
        const valores = $('#atributo_valores').val()
            .split(',')
            .map(valor => valor.trim())
            .filter(Boolean);

        if (!nombre) {
            mostrarToast('El nombre del atributo es obligatorio', 'danger');
            return;
        }

        if (!valores.length) {
            mostrarToast('Agrega al menos un valor al atributo', 'danger');
            return;
        }

        $.ajax({
            url: id ? `/catalogos-producto/atributo/${id}/actualizar` : '/catalogos-producto/atributo/crear',
            type: 'POST',
            data: {
                _token: csrf(),
                _method: id ? 'PUT' : 'POST',
                nombre_atributo: nombre,
                valores: JSON.stringify(valores),
            },
            success: function (res) {
                mostrarToast(res.mensaje || 'Atributo guardado', 'success');
                bootstrap.Modal.getInstance(document.getElementById('modalAtributo'))?.hide();
                cargarCatalogos();
            },
            error: function (err) {
                mostrarToast(mensajeError(err, 'No se pudo guardar el atributo'), 'danger');
            },
        });
    });

    $('#tablaAtributos').on('click', '.cambiarEstadoAtributo', function () {

        const id = $(this).data('id');

        $.post(`/catalogos-producto/atributo/cambiar-estado/${id}`, { _token: csrf() }, function (res) {
            mostrarToast(res.mensaje || 'Estado actualizado', 'success');
            cargarCatalogos();
        }).fail(function (err) {
            mostrarToast(mensajeError(err, 'No se pudo cambiar el estado'), 'danger');
        });
    });

    /* ════════════════ AUXILIARES ════════════════ */

    function mensajeError(err, porDefecto) {
        const errores = err.responseJSON?.errors;

        if (errores) return Object.values(errores).flat()[0];

        return err.responseJSON?.mensaje || porDefecto;
    }

    cargarCatalogos();
}
