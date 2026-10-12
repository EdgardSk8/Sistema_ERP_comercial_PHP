export default function initMovimientoInventario() {

    document.getElementById('titulo').textContent = 'MOVIMIENTOS DE INVENTARIO';

    $('#tablaKardex').DataTable({

        ajax: { url: '/movimiento-inventario/mostrar', type: 'GET', dataSrc: 'movimientos' },

        columns: [
            { data: 'id_movimiento_inventario' },
            { data: 'nombre_completo_usuario' },
            { data: 'fecha_movimiento', render: function(data){ return formatearFecha(data); } },
            { data: 'nombre_producto' },
            { data: null, render: row => row.talla_variacion
                ? `${row.color_variacion || 'Sin color'} · Talla ${row.talla_variacion}`
                : '—'
            },
            { data: 'tipo_movimiento',
                render: function(data) {
                    if (data === 'ENTRADA') { return `<strong class="text-success">${data}</strong>`; } 
                    else if (data === 'SALIDA') { return `<strong class="text-danger">${data}</strong>`; }
                    else if (data === 'AJUSTE') { return `<strong class="text-black-50">${data}</strong>`; }
                    return data;
                }
            },
            { data: 'tipo_referencia' },
            { data: 'motivo_movimiento' }, 
            { data: 'cantidad_movimiento' },
            { data: 'stock_resultante' },
            { data: 'precio_unitario', render: $.fn.dataTable.render.number(',', '.', 2, 'C$ ') },
            { data: null, render: function(data){ return moneda(data.precio_unitario * data.cantidad_movimiento); } }
        ],

        drawCallback: function () { AnimarFilasVisibles(this.api()); }, order: [[0, 'desc']],
        initComplete: function () { ConfigurarFiltrosDataTable(this, { columnasSelect: [0, 1, 4, 5, 6]}); }

    }); // Fin de DataTables

    configurarToggleColumnas('tablaKardex');

};