



window.formatearCedula = function(inputId) {
    
    const cedula = document.getElementById(inputId);
    if (!cedula) return;

    cedula.addEventListener("input", function () {
        let valor = this.value.replace(/[^0-9a-zA-Z]/g, "");

        let numeros = valor.slice(0, 13).replace(/[^0-9]/g, "");
        let letra = valor.slice(13, 14).replace(/[^a-zA-Z]/g, "").toUpperCase();

        valor = numeros + letra;

        if (valor.length > 3) valor = valor.slice(0, 3) + "-" + valor.slice(3);
        if (valor.length > 10) valor = valor.slice(0, 10) + "-" + valor.slice(10);

        this.value = valor;
    });
}

// $(document).on('click', '.btn', function (e) {

//     const btn = $(e.currentTarget);
//     if (btn.prop('disabled')) { e.preventDefault(); e.stopImmediatePropagation(); return false; }
//     btn.prop('disabled', true);
//     setTimeout(() => { btn.prop('disabled', false); }, 500);

// });

window.moneda = function(valor, decimales = 2) {
    return 'C$ ' + parseFloat(valor || 0).toLocaleString('es-NI', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    });
}

function crearToast() {

    if (document.getElementById("toastMensaje")) return;

    document.body.insertAdjacentHTML("beforeend", `
        <div class="toast-container position-fixed top-0 end-0">

            <div id="toastMensaje" class="toast toast-custom fade" role="alert">

                <div class="toast-content">

                    <div class="toast-icon" id="toastIcon"></div>

                    <div class="toast-divider"></div>

                    <div class="toast-text">

                        <div class="toast-title" id="toastTitulo"></div>

                        <div class="toast-message" id="toastTexto"></div>

                    </div>

                    <button type="button"
                            class="btn-close"
                            data-bs-dismiss="toast">
                    </button>

                </div>

            </div>

        </div>
    `);
}

window.mostrarToast = function (mensaje, tipo = "success") {

    crearToast();

    const toast = document.getElementById("toastMensaje");
    const titulo = document.getElementById("toastTitulo");
    const texto = document.getElementById("toastTexto");
    const icono = document.getElementById("toastIcon");


    // Limpiar clases anteriores
    toast.classList.remove(
        "toast-success",
        "toast-danger",
        "toast-warning",
        "toast-info",
        "hide"
    );


    texto.textContent = mensaje;


    switch (tipo) {

        case "success":

            titulo.textContent = "Éxito";

            icono.innerHTML =
                '<i class="ph ph-check-circle"></i>';

            toast.classList.add("toast-success");

            break;


        case "danger":

            titulo.textContent = "Error";

            icono.innerHTML =
                '<i class="ph ph-x-circle"></i>';

            toast.classList.add("toast-danger");

            break;


        case "warning":

            titulo.textContent = "Advertencia";

            icono.innerHTML =
                '<i class="ph ph-warning"></i>';

            toast.classList.add("toast-warning");

            break;


        case "info":

            titulo.textContent = "Información";

            icono.innerHTML =
                '<i class="ph ph-info"></i>';

            toast.classList.add("toast-info");

            break;
    }



    // Animación salida personalizada
    toast.addEventListener("hide.bs.toast", function () {

        toast.classList.add("hide");

    }, { once:true });



    toast.addEventListener("hidden.bs.toast", function () {

        toast.classList.remove("hide");

    }, { once:true });



    const instancia = bootstrap.Toast.getOrCreateInstance(toast, {
        delay: 2000
    });


    instancia.show();

};


window.Traduccion = {
    language: {
        search: "Buscar:",
        lengthMenu: "Mostrar _MENU_ registros",
        info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
        infoEmpty: "Mostrando 0 a 0 de 0 registros",
        infoFiltered: "(filtrado de _MAX_ registros totales)",
        zeroRecords: "No se encontraron resultados",
        emptyTable: "No hay datos disponibles",
        paginate: {
            first: "Primero",
            previous: "Anterior",
            next: "Siguiente",
            last: "Último"
        }
    }
};

$.extend(true, $.fn.dataTable.defaults, {
    scrollY: '100vh',
    // scrollY: true,
    paging: true,
    responsive: true,
    processing: true,
    // serverSide: true,
    lengthMenu: [50, 60, 70, 80, 90, 100, 500, 1000], pageLength: 50,
    ...Traduccion,
    dom: '<"top"lf>rt<"bottom"ip><"clear">',
});


window.toggleFooterDataTable = function() {
    $('.dataTables_scrollFoot')
        .toggleClass('activo', $('#toggleFooter').prop('checked'));
}

$(document).on('change', '#toggleFooter', function () {
    window.toggleFooterDataTable();
});

window.validarRUC = function(ruc) {

    if (!ruc || ruc.trim() === '') { return true; }

    ruc = ruc.trim().toUpperCase();

    const regex = /^[A-Z][0-9]{13}$/;

    if (!regex.test(ruc)) {

        mostrarToast(
            'El RUC debe tener una letra inicial y 13 números',
            'danger'
        );

        return false;
    }

    return true;
}

window.validarInputRUC = function(input) {

    let valor = $(input).val().toUpperCase();
    valor = valor.replace(/[^A-Z0-9]/g, '');
    let resultado = '';

    if (/^[A-Z]/.test(valor)) {

        resultado += valor.charAt(0);
        let resto = valor.slice(1).replace(/[^0-9]/g, '');
        resultado += resto.slice(0, 13);
    }

    $(input).val(resultado);
}

window.validarTelefono = function (telefono, obligatorio = false) {

    telefono = (telefono || '').trim();

    /* VALIDAR VACIO */

    if (telefono === '') {

        if (obligatorio) {

            mostrarToast('El teléfono es obligatorio', 'danger');
            return false;
        }

        return true;
    }

    const telefonoSinSeparadores = telefono.replace(/[\s-]+/g, '');

    /* SOLO CARACTERES VALIDOS */

    if (!/^[0-9+()]+$/.test(telefonoSinSeparadores)) {

        mostrarToast('El teléfono solo puede contener números, espacios, guiones y los símbolos + ( )', 'danger');
        return false;
    }

    /* SOLO UN + */

    if ((telefonoSinSeparadores.match(/\+/g) || []).length > 1) {

        mostrarToast('El signo + solo puede aparecer una vez', 'danger');
        return false;
    }

    /* + SOLO AL INICIO */

    if (telefonoSinSeparadores.includes('+') && !telefonoSinSeparadores.startsWith('+')) {

        mostrarToast('El signo + solo puede ir al inicio', 'danger');
        return false;
    }

    /* SOLO UN ( */

    if ((telefonoSinSeparadores.match(/\(/g) || []).length > 1) {

        mostrarToast('Solo se permite un paréntesis de apertura', 'danger');
        return false;
    }

    /* SOLO UN ) */

    if ((telefonoSinSeparadores.match(/\)/g) || []).length > 1) {

        mostrarToast('Solo se permite un paréntesis de cierre', 'danger');
        return false;
    }

    const tieneApertura = telefonoSinSeparadores.includes('(');
    const tieneCierre = telefonoSinSeparadores.includes(')');

    /* PARENTESIS INCOMPLETOS */

    if (tieneApertura !== tieneCierre) {

        mostrarToast('Los paréntesis deben abrirse y cerrarse correctamente', 'danger');
        return false;
    }

    /* ORDEN INCORRECTO */

    if (tieneCierre && telefonoSinSeparadores.indexOf(')') < telefonoSinSeparadores.indexOf('(')) {

        mostrarToast('Los paréntesis están en orden incorrecto', 'danger');
        return false;
    }

    return true;
};

/* -------------------------------------------------------------------------------- */


window.formatearFechaDia = function(fechaSQL) {

    if (!fechaSQL) return '';

    const fecha = new Date(fechaSQL);

    const dias = [
        "Domingo","Lunes","Martes","Miércoles",
        "Jueves","Viernes","Sábado"
    ];

    const meses = [
        "Enero", "Febrero", "Marzo", "Abril",
        "Mayo", "Junio", "Julio", "Agosto",
        "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const diaSemana = dias[fecha.getDay()];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();

    return `${diaSemana} ${dia} de ${mes} ${año}`;
}

window.formatearFecha = function(fechaSQL) { 
    if (!fechaSQL) return '';

    const fecha = new Date(fechaSQL);
    
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0'); // 1-12
    const año = fecha.getFullYear();

    let horas = fecha.getHours();
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';

    horas = horas % 12;
    horas = horas ? horas : 12; // Convertir 0 a 12
    const horasFormateadas = horas.toString().padStart(2, '0');

    return `${dia}/${mes}/${año} ${horasFormateadas}:${minutos} ${ampm}`;
}

/* Fecha corta sin hora (dd/mm/aaaa). Acepta 'YYYY-MM-DD' y 'YYYY-MM-DD HH:MM:SS'. */
window.formatearFechaCorta = function(fechaSQL) {

    if (!fechaSQL) return '';

    const texto = String(fechaSQL).trim();

    const fecha = /^\d{4}-\d{2}-\d{2}/.test(texto)
        ? new Date(texto.slice(0, 10) + 'T00:00:00')
        : new Date(texto);

    if (isNaN(fecha.getTime())) return texto;

    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');

    return `${dia}/${mes}/${fecha.getFullYear()}`;
}

window.formatearFechaDiaHora = function(fechaSQL) { 

    if (!fechaSQL) return '';

    const fecha = new Date(fechaSQL);

    const meses = [
        "Enero", "Febrero", "Marzo", "Abril",
        "Mayo", "Junio", "Julio", "Agosto",
        "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();

    let horas = fecha.getHours();
    let minutos = fecha.getMinutes();

    // 🔥 AM / PM
    const periodo = horas >= 12 ? 'PM' : 'AM';

    // 🔥 convertir a 12 horas
    horas = horas % 12;
    horas = horas ? horas : 12; // si es 0 → 12

    minutos = minutos < 10 ? '0' + minutos : minutos;
    horas = horas < 10 ? '0' + horas : horas;

    return `${dia} de ${mes} del ${año} ${horas}:${minutos} ${periodo}`;
}

window.FechaSimple = function(fechaSQL) {

    if (!fechaSQL) return '';

    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(fechaSQL)
        ? new Date(`${fechaSQL}T00:00:00`)
        : new Date(fechaSQL);

    const meses = [
        "Enero", "Febrero", "Marzo", "Abril",
        "Mayo", "Junio", "Julio", "Agosto",
        "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();

    // 🔥 Primera letra en mayúscula
    const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);

    return `${dia} de ${mesCapitalizado} del ${año}`;
}

window.Formato12Horas = function(hora24) {
    let hora = Number(hora24.split(':')[0]);
    const periodo = hora >= 12 ? 'PM' : 'AM';
    hora = hora % 12 || 12;
    return `${hora}${periodo}`;
}

/* -------------------------------------------------------------------------------- */

window.configurarToggleColumnas = function (idTabla) {

    const tabla = $(`#${idTabla}`).DataTable();

    $('.toggle-col').each(function () {
        tabla.column($(this).data('column')).visible(this.checked, false);
    });

    tabla.columns.adjust().draw(false);

    $('.toggle-col')
        .off('change.toggleCol')
        .on('change.toggleCol', function () {

            tabla
                .column($(this).data('column'))
                .visible(this.checked, false);

            tabla.columns.adjust().draw(false);
        });
};

/* -------------------------------------------------------------------------------- */

window.AnimarFilasVisibles = function(api, tiempo = 30, clase = 'animacion-fila') {
    const body = $(api.table().container()).find('.dataTables_scrollBody');

    // Si la tabla no tiene scroll, usa el tbody
    const contenedor = body.length ? body : $(api.table().body());

    const top = contenedor.scrollTop();
    const bottom = top + contenedor.innerHeight();

    $(api.rows({ page: 'current' }).nodes()).each(function () {
        const filaTop = this.offsetTop;
        const filaBottom = filaTop + this.offsetHeight;

        if (filaBottom > top && filaTop < bottom) {
            const indiceVisible = Math.floor((filaTop - top) / this.offsetHeight);

            this.style.animationDelay = `${indiceVisible * tiempo}ms`;
            this.classList.remove(clase);

            requestAnimationFrame(() => {
                this.classList.add(clase);
            });
        }
    });
}

/* -------------------------------------------------------------------------------- */

window.EjeXDashboard = function(fechaSQL) {

    if (!fechaSQL) return '';

    const valor = String(fechaSQL).trim();

    // FORMATO: YYYY-MM
    if (/^\d{4}-\d{2}$/.test(valor)) {

        const [anio, mes] = valor.split('-');

        return `${mes}/${anio}`;
    }

    /* ════════════════
    FORMATO: HH:00
    Resultado: 08:00 AM
    ════════════════ */
    if (/^\d{2}:\d{2}$/.test(valor)) {

        let [horas, minutos] = valor.split(':');

        horas = Number(horas);

        const periodo = horas >= 12 ? 'PM' : 'AM';

        horas = horas % 12;
        horas = horas ? horas : 12;

        horas = horas < 10 ? '0' + horas : horas;

        return `${horas}:${minutos} ${periodo}`;
    }

    // FORMATO: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {

        const fecha = new Date(valor + 'T00:00:00');

        return fecha.toLocaleDateString('es-NI', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    return valor;
}

window.formatearFechaDashboard = function(fechaSQL) {

    if (!fechaSQL) return '';

    const valor = String(fechaSQL).trim();

    const meses = [
        "Enero","Febrero","Marzo","Abril",
        "Mayo","Junio","Julio","Agosto",
        "Septiembre","Octubre","Noviembre","Diciembre"
    ];

    /* ════════════════
       FORMATO: YYYY
       Resultado: 2026
    ════════════════ */
    if (/^\d{4}$/.test(valor)) {

        return valor;
    }

    /* ════════════════
       FORMATO: YYYY-MM
       Resultado: Mayo del 2026
    ════════════════ */
    if (/^\d{4}-\d{2}$/.test(valor)) {

        const [anio, mes] = valor.split('-');

        return `${meses[Number(mes) - 1]} del ${anio}`;
    }

    if (/^\d{2}:\d{2}$/.test(valor)) {

        let [horas, minutos] = valor.split(':');

        horas = Number(horas);

        const periodo = horas >= 12 ? 'PM' : 'AM';

        horas = horas % 12;
        horas = horas ? horas : 12;

        horas = horas < 10 ? '0' + horas : horas;

        return `${horas}:${minutos} ${periodo}`;
    }

    /* ════════════════
       FORMATO: YYYY-MM-DD
       Resultado: 22 de mayo del 2026
    ════════════════ */
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {

        const fecha = new Date(valor + 'T00:00:00');

        const dia = fecha.getDate();
        const mes = meses[fecha.getMonth()];
        const anio = fecha.getFullYear();

        return `${dia} de ${mes} del ${anio}`;
    }

    /* ════════════════
       FORMATO DATETIME
       Resultado:
       22 de mayo del 2026 08:30 PM
    ════════════════ */
    const fecha = new Date(valor);

    if (isNaN(fecha)) return valor;

    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();

    let horas = fecha.getHours();
    let minutos = fecha.getMinutes();

    const periodo = horas >= 12 ? 'PM' : 'AM';

    horas = horas % 12;
    horas = horas ? horas : 12;

    minutos = minutos < 10 ? '0' + minutos : minutos;
    horas = horas < 10 ? '0' + horas : horas;

    return `${dia} de ${mes} del ${anio} ${horas}:${minutos} ${periodo}`;
}

/* -------------------------------------------------------------------------------- */


window.ConfigurarFiltrosDataTable = function(tabla, config = {}) {

    let columnasSelect = config.columnasSelect || [];
    let columnasIgnorar = config.columnasIgnorar || [];

    tabla.api().columns().every(function () {

        let column = this;
        let index = column.index();
        let footer = $(column.footer());
        footer.empty();

        // IGNORAR COLUMNAS
        if(columnasIgnorar.includes(index)){ return; }

        // SELECT
        if(columnasSelect.includes(index)){

            let select = $(` <select class="form-select form-select-sm filtro-columna"> <option value="">Todos</option> </select> `)

            .appendTo(footer).on('change', function () {
                let val = $.fn.dataTable.util.escapeRegex($(this).val());
                column.search(val ? '^' + val + '$' : '', true, false).draw();
            });

            // Las tablas en modo servidor reciben sus opciones del backend
            // (solo conocen la pagina actual, no todas las filas).
            let valores = config.opciones?.[index];

            if (!Array.isArray(valores)) {

                valores = [];
                column.data().each(function (d) { d = $('<div>').html(d).text().trim(); if(d && !valores.includes(d)){ valores.push(d); } });

                valores.sort();
            }

            valores.forEach(function (d) { select.append(`<option value="${d}">${d}</option>`); });

        } else{ //INPUT

            $(`<input type="text" class="form-control form-control-sm filtro-columna" placeholder="Buscar"> `)
            .appendTo(footer).on('keyup change clear', function () {

                let valor = $(this).val().trim();
                let match = valor.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/);

                if (match) { let dia  = match[1]; let mes  = match[2]; let anio = match[3];

                    let regex = '^' +
                        (dia === '00' ? '\\d{2}' : dia) + '\\/' + (mes === '00' ? '\\d{2}' : mes) + '\\/' + (anio === '00' ? '\\d{4}' : anio) +
                        '(\\s+.*)?$';

                    column.search(regex, true, false).draw();

                } else { column.search(valor).draw(); }

            });

        } // FIN DE ELSE

    });

};


/* -------------------------------------------------------------------------------- */


/* FUNCION UTILITARIA*/
window.FlatPickr = function (elemento) {

    return flatpickr(elemento, {
        locale: 'es',
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'j \\d\\e F \\d\\e\\l Y',
        allowInput: true
    });

};

/* -------------------------------------------------------------------------------- */

window.ResetearInputs = function (...elementos) {
    elementos.forEach(elemento => {
        if (elemento) {
            elemento.value = '';
        }
    });
};

window.Colores = {

    // colores_1: ['#6199f5','#3b82f6','#0ea5e9','#06b6d4','#2dd4bf','#22c55e','#10b981','#84cc16','#f59e0b','#eab308'],
    // bordes_1: ['#2563eb','#1d4ed8','#0284c7','#0891b2','#0f766e','#16a34a','#059669','#65a30d','#d97706','#ca8a04'],
    // colores_2: ['#fde047','#f97316','#ef4444','#f43f5e','#ec4899','#fb7185','#c084fc','#a855f7','#8b5cf6'],
    // bordes_2: ['#a16207','#ea580c','#dc2626','#e11d48','#be185d','#fb7185','#9333ea','#7c3aed','#6d28d9']

    // colores_2: ['#FC9F5B','#FBD1A2','#dc3545','#33CA76','#7DCFB6'],
    colores_2: ['#22C55E', '#369157', '#365E45', '#27332C', '#2A332E'],

    // bordes_1: ['#0a58ca','#146c43','#cc9a06','#b02a37','#59359a','#ca6510','#1aa179','#0aa2c0','#565e64','#ab296a','#520dc2','#146c43'],
    // colores_2: ['#3b82f6','#22c55e','#facc15','#ef4444','#8b5cf6','#f97316','#14b8a6','#06b6d4','#64748b','#ec4899','#6366f1','#84cc16'],
    // bordes_2: ['#2563eb','#15803d','#ca8a04','#dc2626','#7c3aed','#ea580c','#0f766e','#0891b2','#475569','#be185d','#4f46e5','#65a30d']

};

window.Meses = [
    'Enero', 'Febrero', 'Marzo',
    'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre',
    'Octubre', 'Noviembre', 'Diciembre'
];

window.PluginSinDatos = {

    id: 'PluginSinDatos',

    afterDraw(chart) {

        const datos = chart.data.datasets;

        const tieneDatos = datos.some(dataset =>
            dataset.data.some(valor => Number(valor) > 0)
        );

        if (tieneDatos) return;

        const { ctx, width, height } = chart;

        ctx.save();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = '16px Arial';

        ctx.fillStyle = '#999';

        ctx.fillText(
            'Sin registros',
            width / 2,
            height / 2
        );

        ctx.restore();
    }
};

/* -------------------------------------------------------------------------------- */

/* RESPUESTAS 401 y 403 EN PETICIONES AJAX

   El backend responde JSON con el motivo real (por ejemplo "No estas autorizado
   para esta accion"). Sin esto, las tablas y los $.ajax mostraban un error
   generico. mostrarToast reutiliza el mismo aviso, asi que el mensaje del
   servidor reemplaza al generico en lugar de acumularse. */

$(document).ajaxError(function (_evento, xhr) {

    if (xhr.status !== 401 && xhr.status !== 403) return;

    mostrarToast(
        xhr.responseJSON?.mensaje
            || (xhr.status === 401
                ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
                : 'No estás autorizado para esta acción.'),
        'danger'
    );

});

/* -------------------------------------------------------------------------------- */

/* PETICIONES FETCH

   Los modulos hacen fetch enviando solo el token CSRF, asi que Laravel no las
   reconocia como AJAX ($request->ajax() y expectsJson() daban false) y respondia
   redirecciones o vistas HTML. De ahi el error
   "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" al hacer response.json().

   Aqui se marca cada peticion como AJAX en un unico punto, para que el backend
   responda siempre JSON (incluidos los mensajes de permiso y de sesion expirada). */

const fetchOriginal = window.fetch.bind(window);

window.fetch = function (recurso, opciones = {}) {

    const marcar = (headers) => {
        if (headers instanceof Headers) {
            headers.set('X-Requested-With', 'XMLHttpRequest');
        } else if (Array.isArray(headers)) {
            headers.push(['X-Requested-With', 'XMLHttpRequest']);
        } else {
            headers['X-Requested-With'] = 'XMLHttpRequest';
        }

        return headers;
    };

    opciones.headers = marcar(opciones.headers || {});

    return fetchOriginal(recurso, opciones);
};

/* -------------------------------------------------------------------------------- */

