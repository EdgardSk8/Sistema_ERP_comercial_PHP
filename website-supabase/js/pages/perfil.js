/* ╔══════════════════════════════════════════════════════════════╗
   ║  Perfil · navegación lateral con sombreado por scrollspy     ║
   ╚══════════════════════════════════════════════════════════════╝ */

document.addEventListener('DOMContentLoaded', iniciarPerfil);

function iniciarPerfil() {
    const enlaces = Array.from(document.querySelectorAll('[data-seccion]'));
    const secciones = Array.from(document.querySelectorAll('.perfil-seccion'));

    if (!enlaces.length || !secciones.length) return;

    const mapa = new Map();
    enlaces.forEach((enlace) => {
        const seccion = document.getElementById(enlace.dataset.seccion);
        if (seccion) mapa.set(seccion, enlace);
    });

    function activar(seccion) {
        enlaces.forEach((enlace) => {
            enlace.classList.toggle('is-activo', enlace === mapa.get(seccion));
        });
    }

    /* Sección actual: la última cuyo inicio ya pasó el borde del header. */
    function seccionVisible() {
        const limite = 60 + 24;
        let actual = secciones[0];

        secciones.forEach((seccion) => {
            if (seccion.getBoundingClientRect().top - limite <= 1) {
                actual = seccion;
            }
        });

        return actual;
    }

    function actualizar() {
        activar(seccionVisible());
    }

    let pendiente = false;
    window.addEventListener('scroll', () => {
        if (pendiente) return;
        pendiente = true;

        window.requestAnimationFrame(() => {
            pendiente = false;
            actualizar();
        });
    }, { passive: true });

    /* Clic: scroll suave a la sección y sombreado inmediato. */
    enlaces.forEach((enlace) => {
        enlace.addEventListener('click', (evento) => {
            const destino = document.getElementById(enlace.dataset.seccion);
            if (!destino) return;

            evento.preventDefault();

            /* Si había una guía abierta, se cierra al navegar. */
            window.Chiky?.cerrarGuia?.();

            alinearArriba(destino);
            activar(destino);

            if (window.history.replaceState) {
                window.history.replaceState(null, '', '#' + destino.id);
            }

            /* En móvil, deja visible el ítem pulsado en la barra horizontal. */
            enlace.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        });
    });

    /* Enlace directo con hash (#favoritos, #historial, ...). */
    if (window.location.hash) {
        const inicial = document.getElementById(window.location.hash.slice(1));
        if (inicial) {
            window.setTimeout(() => {
                alinearArriba(inicial);
                activar(inicial);
            }, 60);
        }
    }

    actualizar();
    iniciarCuenta();

    /* En el perfil Chiky vive en el menú: no ocupa pantalla hasta que se pide. */
    window.Chiky?.modoDiscreto();
    conectarAyudaChiky();
    conectarDesplegableAyuda();
    animarBloquesPerfil();
}

/* ╔══════════════════════════════════════════════════════════════╗
   ║  Cuenta del cliente: login, perfil, direcciones y favoritos  ║
   ╚══════════════════════════════════════════════════════════════╝ */

const IMAGEN_FALLBACK = '/tienda/recursos/img/producto.png';

let direccionesCache = [];

function porId(id) {
    return document.getElementById(id);
}

function escapar(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function moneda(valor) {
    return 'C$ ' + Number(valor || 0).toLocaleString('es-NI', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatearFecha(fecha) {
    if (!fecha) return '—';

    const valor = new Date(String(fecha).replace(' ', 'T'));

    if (Number.isNaN(valor.getTime())) return fecha;

    return valor.toLocaleDateString('es-NI', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatearFechaHora(fecha) {
    if (!fecha) return '—';

    const valor = new Date(String(fecha).replace(' ', 'T'));

    if (Number.isNaN(valor.getTime())) return fecha;

    return valor.toLocaleString('es-NI', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

function formatearHora(hora) {
    if (!hora) return '';

    const [horas, minutos] = String(hora).split(':').map(Number);

    if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return String(hora);

    const periodo = horas >= 12 ? 'PM' : 'AM';
    const hora12 = horas % 12 || 12;

    return `${String(hora12).padStart(2, '0')}:${String(minutos).padStart(2, '0')} ${periodo}`;
}

function urlSegura(valor) {
    const url = String(valor || '').trim();
    return /^https?:\/\//i.test(url) ? url : '';
}

function mostrarError(error) {
    if (error?.status === 401) {
        window.location.href = urlTienda('login');
        return;
    }

    console.error('Error en la tienda:', error);

    const errores = error?.data?.errors;

    if (errores) {
        const primero = Object.values(errores)[0];
        tiendaToast(Array.isArray(primero) ? primero[0] : primero, 'aviso');
        return;
    }

    tiendaToast(error?.message || 'Ocurrió un error inesperado.', 'aviso');
}

function bloquearBoton(boton, bloqueado) {
    if (!boton) return;

    if (bloqueado) {
        if (!boton.dataset.textoOriginal) {
            boton.dataset.textoOriginal = boton.textContent;
        }

        boton.disabled = true;
        boton.textContent = 'Procesando…';
        return;
    }

    boton.disabled = false;

    if (boton.dataset.textoOriginal) {
        boton.textContent = boton.dataset.textoOriginal;
        delete boton.dataset.textoOriginal;
    }
}

function iniciarCuenta() {
    iniciarFechaNacimientoPerfil();
    iniciarCedulaPerfil();
    conectarFormularios();
    conectarAvatar();
    conectarFondosAvatar();
    conectarMarco();
    conectarDescuento();
    conectarCupones();
    conectarDirecciones();
    conectarFavoritos();
    conectarDeseos();
    conectarPedidos();
    conectarMenuPerfil();
    conectarSesion();
    cargarCuenta();
}

/* ── Menú lateral del perfil (móvil) ─────────────────────────── */
function conectarMenuPerfil() {
    const boton = porId('btnMenuPerfil');
    const panel = porId('navPerfil');
    const fondo = porId('fondoMenuPerfil');

    if (!boton || !panel || !fondo) return;

    let temporizador = 0;

    function abrir() {
        window.clearTimeout(temporizador);

        fondo.hidden = false;
        panel.classList.add('is-abierto');
        boton.setAttribute('aria-expanded', 'true');
        document.body.classList.add('menu-perfil-abierto');

        window.requestAnimationFrame(() => fondo.classList.add('is-visible'));
    }

    function cerrar() {
        if (!panel.classList.contains('is-abierto')) return;

        panel.classList.remove('is-abierto');
        fondo.classList.remove('is-visible');
        boton.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-perfil-abierto');

        temporizador = window.setTimeout(() => {
            fondo.hidden = true;
        }, 500);
    }

    boton.addEventListener('click', () => {
        if (panel.classList.contains('is-abierto')) {
            cerrar();
            return;
        }

        abrir();
    });

    fondo.addEventListener('click', cerrar);

    /* El resumen de Chiky solo despliega; las opciones y los temas sí cierran el panel. */
    panel.addEventListener('click', (evento) => {
        if (evento.target.closest('.perfil-ayuda > summary')) return;

        const opcion = evento.target.closest('a.perfil-nav__item')
            || evento.target.closest('.perfil-ayuda__tema')
            || evento.target.closest('.perfil-ayuda__atajo');

        if (opcion) cerrar();
    });

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape') cerrar();
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 767) cerrar();
    });

    window.addEventListener('hashchange', cerrar);
}

function localeEspanol() {
    const base = window.flatpickr?.l10ns?.es;

    if (!base) return 'es';

    return {
        ...base,
        months: {
            ...base.months,
            longhand: base.months.longhand.map((mes) => mes.toLowerCase()),
        },
    };
}

function iniciarFechaNacimientoPerfil() {
    const input = porId('perfilFechaNacimiento');
    if (!input) return;

    if (typeof window.flatpickr !== 'function') {
        input.type = 'date';
        return;
    }

    window.flatpickr(input, {
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'j \\d\\e F \\d\\e Y',
        altInputClass: 'form-control',
        allowInput: true,
        maxDate: 'today',
        locale: localeEspanol(),
        disableMobile: true,
    });
}

function iniciarCedulaPerfil() {
    window.formatearCedula?.('perfilCedula');
}

async function cargarCuenta() {
    const sesion = await window.sesionTiendaPromise;
    const cliente = sesion?.cliente || null;
    const autenticado = Boolean(sesion?.autenticado && cliente);

    if (!autenticado) {
        window.location.href = urlTienda('login');
        return;
    }

    alternarCuenta(true);
    llenarPerfil(cliente);
    ajustarFormPassword();
    avisarDatosFaltantes(cliente);
    cargarFondosAvatar(cliente);

    await Promise.allSettled([
        cargarDirecciones(),
        cargarFavoritos(),
        cargarDeseos(),
        cargarPedidos(),
        cargarHistorial(),
    ]);

    mostrarDescuento(cliente);
    pintarMarcoPerfil();
}

function alternarCuenta(autenticado) {
    const visibilidad = {
        perfilInvitado: !autenticado,
        perfilLogueado: autenticado,
        btnMenuPerfil: autenticado,
        direccionesInvitado: !autenticado,
        direccionesContenido: autenticado,
        favoritosInvitado: !autenticado,
        deseosInvitado: !autenticado,
        deseosContenido: autenticado,
        pedidosInvitado: !autenticado,
        historialInvitado: !autenticado,
        descuentoInvitado: !autenticado,
        contenidoDescuento: autenticado,
        configuracionInvitado: !autenticado,
        configuracionContenido: autenticado,
    };

    Object.entries(visibilidad).forEach(([id, visible]) => {
        const elemento = porId(id);
        if (elemento) elemento.hidden = !visible;
    });

    const favoritosVacio = porId('favoritosVacio');
    const listaFavoritos = porId('listaFavoritos');
    const deseosVacio = porId('deseosVacio');
    const listaDeseos = porId('listaDeseos');
    const pedidosVacio = porId('pedidosVacio');
    const listaPedidos = porId('listaPedidos');
    const historialVacio = porId('historialVacio');
    const listaHistorial = porId('listaHistorial');

    if (favoritosVacio) favoritosVacio.hidden = true;
    if (listaFavoritos) listaFavoritos.hidden = true;
    if (deseosVacio) deseosVacio.hidden = true;
    if (listaDeseos) listaDeseos.hidden = true;
    if (pedidosVacio) pedidosVacio.hidden = true;
    if (listaPedidos) listaPedidos.hidden = true;
    if (historialVacio) historialVacio.hidden = true;
    if (listaHistorial) listaHistorial.hidden = true;
}

/* Google no comparte teléfono ni fecha de nacimiento: se piden en Perfil. */
function avisarDatosFaltantes(cliente) {
    const campos = [];
    const descuentoUsado = Boolean(cliente?.descuento_primera_compra_usado);

    if (!String(cliente?.telefono_cliente || '').trim()) campos.push('perfilTelefono');
    if (!String(cliente?.fecha_nacimiento_cliente || '').trim()) campos.push('perfilFechaNacimiento');

    if (!campos.length) {
        if (descuentoUsado) {
            window.Chiky?.paso('perfilCompleto');
            return;
        }

        ofrecerDescuento(cliente);
        return;
    }

    let avisar = true;

    try {
        avisar = sessionStorage.getItem('tienda_aviso_datos') !== '0';
        sessionStorage.setItem('tienda_aviso_datos', '0');
    } catch {
        avisar = true;
    }

    if (!avisar) {
        if (descuentoUsado) return;

        ofrecerDescuento(cliente);
        return;
    }

    if (window.Chiky) {
        window.Chiky.paso('perfilIncompleto');
        window.Chiky.accion('Ayúdame', () => ayudarCompletarPerfil(campos));
        return;
    }

    if (typeof window.tiendaToast === 'function') {
        window.tiendaToast('Completa tu teléfono y fecha de nacimiento para tu descuento de primera compra.', 'aviso');
    }
}

function iniciarGuiaCupones() {
    window.Chiky?.guiar([
        {
            element: '#descuentos .perfil-grupo',
            popover: {
                title: 'Tu 10% de bienvenida',
                description: 'Es 10% solo en zapatos y se aplica en tu primera compra. Se activa al completar los datos de tu perfil.',
                side: 'bottom',
                align: 'start',
            },
        },
        {
            element: '.perfil-fidelidad',
            popover: {
                title: 'Cupón de fidelidad',
                description: 'Cada 10 pares completas un ciclo y ganas un cupón del 10% acumulado. La barra te dice cuánto te falta.',
                side: 'bottom',
            },
        },
        {
            element: '#formCuponPerfil',
            popover: {
                title: 'Canjear un cupón',
                description: 'Si tienes un código, escríbelo aquí y pulsa Canjear. Queda guardado en tu cuenta y lo aplicas en el carrito al pagar.',
                side: 'top',
            },
        },
    ], { clave: 'chiky_guia_cupones', forzar: true });
}

function ofrecerDescuento(cliente = window.clienteTienda) {
    const chiky = window.Chiky;
    if (!chiky) return;

    const descuento = cliente?.descuento || null;

    /* Si ya lo reclamó, se felicita en vez de ofrecer la guía otra vez. */
    if (descuento) {
        if (descuento.primera_compra) {
            const vigencia = vigenciaDescuento(descuento.expira);

            chiky.decir(`¡Felicidades! Ya puedes usar tu ${descuento.etiqueta || '10%'} en zapatos.${vigencia ? ` ${vigencia}` : ''}`, { tono: 'festejo' });
        } else {
            chiky.decir('Tienes un descuento especial activo en tu cuenta.', { tono: 'festejo' });
        }

        chiky.accion('Ver mi descuento', () => alinearArriba(porId('descuentos')));
        return;
    }

    /* La tarjeta se abre al pedir ayuda o con la guía del 10%. */
    chiky.paso('descuentoBienvenida');
    chiky.accion('Ver cupones', irACupones);
}

/* El tema del 10% solo existe mientras el descuento esté disponible. */
function ajustarTemasAyuda(cliente = window.clienteTienda) {
    const botonDescuento = document.querySelector('#ayudaChiky [data-ayuda="descuento"]');
    const botonFidelidad = document.querySelector('#ayudaChiky [data-ayuda="fidelidad"]');

    const usado = Boolean(cliente?.descuento_primera_compra_usado);
    const disponible = Boolean(cliente) && !usado;

    if (botonDescuento) botonDescuento.hidden = !disponible;
    if (botonFidelidad) botonFidelidad.hidden = !usado;

    /* La tarjeta de Chiky solo aparece mientras tenga el 10% de bienvenida. */
    window.Chiky?.soloSi(() => Boolean(window.clienteTienda?.descuento?.primera_compra));
}

/* Menú: cada pregunta abre a Chiky y la lleva a guiar por la pantalla. */
function conectarAyudaChiky() {
    document.querySelectorAll('#ayudaChiky [data-ayuda]').forEach((boton) => {
        boton.addEventListener('click', () => atenderAyudaChiky(boton.dataset.ayuda));
    });
}

/* Todo bloque que aparezca en el perfil entra con medio segundo. */
function animarBloquesPerfil() {
    const raiz = document.querySelector('.perfil-pagina');
    if (!raiz) return;

    const excluidos = '.perfil-nav, .perfil-nav-fondo, .perfil-velo, .perfil-modal, .chiky, .chiky-foco';
    /* Listas y tarjetas que se repintan con contenido nuevo. */
    const repintados = '#contenidoDescuento, #listaDirecciones, #listaCupones, #listaPedidos, #listaHistorial, #listaFavoritos, #listaDeseos, #fidelidadPendientes';

    const entrar = (nodo) => {
        if (!(nodo instanceof HTMLElement) || nodo.hidden) return;
        if (nodo.matches(excluidos)) return;

        nodo.classList.remove('perfil-entra');
        void nodo.offsetWidth;
        nodo.classList.add('perfil-entra');
    };

    new MutationObserver((cambios) => {
        cambios.forEach((cambio) => {
            if (cambio.attributeName === 'hidden') {
                entrar(cambio.target);
                return;
            }

            if (!cambio.addedNodes.length) return;

            const contenedor = cambio.target instanceof HTMLElement
                ? cambio.target.closest(repintados)
                : null;

            if (contenedor) entrar(contenedor);
        });
    }).observe(raiz, {
        subtree: true,
        attributes: true,
        attributeFilter: ['hidden'],
        childList: true,
    });
}

/* El desplegable se abre y se cierra en medio segundo. */
function conectarDesplegableAyuda() {
    const detalle = porId('ayudaChiky');
    const lista = detalle?.querySelector('.perfil-ayuda__lista');
    const resumen = detalle?.querySelector('summary');

    if (!detalle || !lista || !resumen) return;

    let animando = false;

    resumen.addEventListener('click', (evento) => {
        evento.preventDefault();

        if (animando) return;

        animando = true;

        if (detalle.open) {
            cerrarDesplegable(detalle, lista, () => { animando = false; });
            return;
        }

        detalle.open = true;
        abrirDesplegable(lista, () => { animando = false; });
    });
}

function abrirDesplegable(lista, alTerminar) {
    clearTimeout(lista._temporizador);

    lista.style.maxHeight = '0px';
    lista.style.opacity = '0';

    const alto = lista.scrollHeight;

    requestAnimationFrame(() => {
        lista.style.transition = 'max-height .5s ease, opacity .5s ease';
        lista.style.maxHeight = `${alto}px`;
        lista.style.opacity = '1';
    });

    /* El cierre del estilo no depende del frame: si rAF se pausa, igual termina. */
    lista._temporizador = setTimeout(() => {
        lista.style.cssText = '';
        alTerminar?.();
    }, 500);
}

function cerrarDesplegable(detalle, lista, alTerminar) {
    clearTimeout(lista._temporizador);

    lista.style.maxHeight = `${lista.scrollHeight}px`;
    lista.style.opacity = '1';

    requestAnimationFrame(() => {
        lista.style.transition = 'max-height .5s ease, opacity .5s ease';
        lista.style.maxHeight = '0px';
        lista.style.opacity = '0';
    });

    lista._temporizador = setTimeout(() => {
        detalle.open = false;
        lista.style.cssText = '';
        alTerminar?.();
    }, 500);
}

function atenderAyudaChiky(tema) {
    if (!window.Chiky) return;

    /* Un tema nuevo cierra cualquier guía o flujo anterior. */
    window.Chiky.cerrarGuia?.();
    flujoDescuento?.observer?.disconnect();
    flujoDescuento = null;

    if (tema.startsWith('seccion:')) {
        explicarSeccion(tema.slice(8));
        return;
    }

    if (tema === 'secciones') {
        explicarSecciones();
        return;
    }

    if (tema === 'descuento') {
        ayudaDescuento();
        return;
    }

    if (tema === 'fidelidad') {
        ayudaFidelidad();
        return;
    }

    if (tema === 'cuenta') {
        recorrerPasos([
            {
                elemento: cabeceraSeccion('perfil'),
                titulo: 'Tus datos',
                mensaje: 'Aquí editas tu nombre, teléfono y fecha de nacimiento.',
            },
            {
                elemento: porId('formPerfil')?.querySelector('button[type="submit"]'),
                titulo: 'Guardar cambios',
                mensaje: 'Al terminar, guarda los cambios con este botón.',
            },
            {
                elemento: cabeceraSeccion('configuracion'),
                titulo: 'Tu contraseña',
                mensaje: 'Con tu correo y esta contraseña entras sin depender de Google.',
            },
            {
                elemento: porId('formPassword')?.querySelector('button[type="submit"]'),
                titulo: 'Actualizar contraseña',
                mensaje: 'Usa 8 caracteres con una mayúscula, una minúscula y un número.',
            },
        ].filter((paso) => paso.elemento));

        return;
    }

    if (tema === 'direcciones') {
        recorrerPasos([
            {
                elemento: porId('btnNuevaDireccion'),
                titulo: 'Nueva dirección',
                mensaje: 'Aquí agregas una dirección con su punto en el mapa.',
            },
            {
                elemento: porId('listaDirecciones'),
                titulo: 'Tus direcciones',
                mensaje: 'Con el lápiz la editas y con el bote la borras. La predeterminada se usa al pagar.',
            },
        ].filter((paso) => paso.elemento));

        return;
    }

    if (tema === 'pedidos') {
        window.Chiky?.mostrar();

        recorrerPasos([
            {
                elemento: cabeceraSeccion('pedidos'),
                titulo: 'Mis pedidos',
                mensaje: 'Aquí sigues tus solicitudes: activas, entregadas o canceladas.',
            },
            {
                elemento: document.querySelector('.perfil-pedidos-filtro'),
                titulo: 'Filtros',
                mensaje: 'Cambia el filtro para ver cada estado.',
            },
            {
                elemento: cabeceraSeccion('historial'),
                titulo: 'Historial de compras',
                mensaje: 'Y aquí queda el detalle de todo lo que ya compraste.',
            },
        ].filter((paso) => paso.elemento));

        return;
    }

    /* Cómo comprar se retiró: no hace falta ese aviso. */
    return;
}

function cabeceraSeccion(id) {
    return document.querySelector(`#${id} .perfil-seccion__cabecera`);
}

/* Secciones del perfil y qué explica cada una. */
const SECCIONES_PERFIL = [
    ['perfil', 'Perfil', 'Tus datos: nombre, teléfono y fecha de nacimiento. Con ellos te contactamos por tus pedidos.'],
    ['direcciones', 'Direcciones', 'Los lugares donde entregamos: casa, trabajo u otro. Marca el punto en el mapa para el delivery.'],
    ['favoritos', 'Favoritos', 'Los zapatos que te gustaron y quieres volver a ver.'],
    ['deseos', 'Lista de Deseos', 'Pares que no tenemos. Los pides y te avisamos cuando lleguen.'],
    ['pedidos', 'Mis pedidos', 'El estado de cada solicitud: activa, entregada o cancelada.'],
    ['historial', 'Historial de compras', 'Todo lo que ya compraste, con su detalle y total.'],
    ['descuentos', 'Descuentos y cupones', 'Tu 10% de bienvenida, los cupones y el avance del cupón de fidelidad.'],
    ['configuracion', 'Configuración', 'Tu contraseña y las preferencias de la cuenta.'],
];

/* Cupones de fidelidad: reemplaza al tema del 10% cuando ya se usó. */
function ayudaFidelidad() {
    window.Chiky?.decir('Cada 10 pares ganas un cupón por el 10% acumulado de esos pares.');

    recorrerPasos([
        {
            elemento: porId('fidelidadBarra'),
            titulo: '10 pares = 1 cupón',
            mensaje: 'La barra avanza con cada par que compras; al llegar a 10 se genera tu cupón.',
        },
        {
            elemento: porId('cuponPerfilCodigo'),
            titulo: 'Canjear un código',
            mensaje: 'Cuando tengas un código, escríbelo aquí y pulsa «Canjear».',
        },
    ].filter((paso) => paso.elemento));
}

/* Recorrido por todas las secciones: para qué sirve cada una. */
function explicarSecciones() {
    window.Chiky?.decir('Eso es todo: cada sección guarda una parte de tu cuenta. Pulsa «Chiky · Ayuda» cuando quieras repasar.');

    recorrerPasos(SECCIONES_PERFIL
        .map(([id, titulo, mensaje]) => ({ elemento: cabeceraSeccion(id), titulo, mensaje }))
        .filter((paso) => paso.elemento));
}

/* Atajo: explica una sola sección, sin recorrer las demás. */
function explicarSeccion(id) {
    const seccion = SECCIONES_PERFIL.find(([clave]) => clave === id);
    if (!seccion) return;

    const [clave, titulo, mensaje] = seccion;

    recorrerPasos([{ elemento: cabeceraSeccion(clave), titulo, mensaje }], { progreso: false });
}

/* «¿Cómo uso mi 10%?» cambia según el estado del descuento. */
function ayudaDescuento() {
    window.Chiky?.mostrar();

    const descuento = window.clienteTienda?.descuento;
    const vigencia = descuento?.primera_compra ? vigenciaDescuento(descuento.expira) : '';

    if (descuento?.primera_compra) {
        window.Chiky?.decir(`¡Felicidades! Ya puedes usar tu 10% en zapatos.${vigencia ? ` ${vigencia}` : ''}`, { tono: 'festejo' });
        window.Chiky?.accion('Ver mi descuento', () => alinearArriba(porId('descuentos')));

        recorrerPasos([
            {
                elemento: porId('contenidoDescuento'),
                titulo: 'Tu 10% de bienvenida',
                mensaje: `Se aplica solo en zapatos al pagar.${vigencia ? ` ${vigencia}` : ''}`,
            },
            {
                elemento: porId('fidelidadBarra'),
                titulo: 'Cupón de fidelidad',
                mensaje: 'Cada 10 pares que compres ganas un cupón por el 10% acumulado.',
            },
            {
                elemento: porId('cuponPerfilCodigo'),
                titulo: 'Canjear un código',
                mensaje: 'Escribe aquí el código de un cupón y pulsa «Canjear».',
            },
        ].filter((paso) => paso.elemento));

        return;
    }

    if (window.clienteTienda?.descuento_primera_compra_usado) {
        window.Chiky?.decir('Ya usaste tu 10% de bienvenida. Ahora ganas cupones por fidelidad.');
        window.Chiky?.accion('Ver cupones', () => alinearArriba(porId('descuentos')));

        recorrerPasos([
            {
                elemento: porId('fidelidadBarra'),
                titulo: '10 pares = 1 cupón',
                mensaje: 'Cada 10 pares ganas un cupón por el 10% acumulado de esos pares.',
            },
            {
                elemento: porId('cuponPerfilCodigo'),
                titulo: 'Canjear un código',
                mensaje: 'Cuando tengas un código, escríbelo aquí y pulsa «Canjear».',
            },
        ].filter((paso) => paso.elemento));

        return;
    }

    irACupones();
}

/* Primero lleva a la sección; la ayuda se ofrece después. */
function irACupones() {
    const seccion = porId('descuentos');
    if (!seccion) return;

    alinearArriba(seccion);

    sombrearContenedor(porId('contenidoDescuento') || seccion);
    window.Chiky?.spotlight(porId('contenidoDescuento') || seccion, { duracion: 1600 });

    window.Chiky?.decir('Estos son los requisitos para activar tu 10%. Si quieres, te guío paso a paso para completarlos.');
    window.Chiky?.accion('Sí, ayúdame', iniciarPasosDescuento);
}

/* Sombra temporal sobre el contenedor al que se navega. */
function sombrearContenedor(elemento) {
    if (!elemento) return;

    elemento.classList.remove('chiky-sombra');
    void elemento.offsetWidth;
    elemento.classList.add('chiky-sombra');

    setTimeout(() => elemento.classList.remove('chiky-sombra'), 1900);
}

/* ── Pasos guiados para completar el 10% ───────────────────── */

const NOMBRES_REQUISITO = {
    'Teléfono registrado': 'tu teléfono',
    'Fecha de nacimiento': 'tu fecha de nacimiento',
    'Dirección con ubicación': 'tu dirección con ubicación',
    'Contraseña de la cuenta': 'tu contraseña',
};

const GRUPOS_DESCUENTO = [
    {
        claves: ['Teléfono registrado', 'Fecha de nacimiento'],
        seccion: 'perfil',
        campos: {
            'Teléfono registrado': 'perfilTelefono',
            'Fecha de nacimiento': 'perfilFechaNacimiento',
        },
        intro: (faltan) => `Okey, iremos paso a paso. Vamos a registrar ${listarRequisitos(faltan)}.`,
    },
    {
        claves: ['Dirección con ubicación'],
        seccion: 'direcciones',
        campos: { 'Dirección con ubicación': 'btnNuevaDireccion' },
        intro: () => 'Vamos con tu dirección. Pulsa «Nueva dirección» para abrir el formulario.',
    },
    {
        claves: ['Contraseña de la cuenta'],
        seccion: 'configuracion',
        campos: { 'Contraseña de la cuenta': 'passwordNueva' },
        intro: () => 'Por último, crea una contraseña para entrar también con tu correo.',    },
];

let flujoDescuento = null;
let avisoDescuentoMostrado = false;

/* Variantes para no sonar repetitivo entre pasos. */
const ANIMOS = ['¡Bien!', '¡Listo!', '¡Genial!', '¡Perfecto!', '¡Vamos bien!'];
let turnoAnimo = 0;

function animo() {
    return ANIMOS[turnoAnimo++ % ANIMOS.length];
}

function pendientesDescuento() {
    return [...document.querySelectorAll('#contenidoDescuento .perfil-descuento__requisito')]
        .filter((item) => !item.classList.contains('is-listo'))
        .map((item) => item.querySelector('span')?.textContent.trim() || '');
}

function listarRequisitos(claves) {
    const nombres = claves.map((clave) => NOMBRES_REQUISITO[clave] || clave);

    if (nombres.length > 1) return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
    return nombres[0] || 'este dato';
}

function iniciarPasosDescuento(preferido = null) {
    const contenedor = porId('contenidoDescuento');

    if (!window.Chiky || !contenedor) return;

    flujoDescuento?.observer?.disconnect();

    flujoDescuento = {
        observer: new MutationObserver(() => continuarPasosDescuento()),
        grupo: null,
        pendientes: pendientesDescuento(),
        preferido,
        esperando: false,
    };

    flujoDescuento.observer.observe(contenedor, { childList: true, subtree: true });

    empezarGrupoDescuento();
}

function empezarGrupoDescuento() {
    const pendientes = pendientesDescuento();
    const preferido = flujoDescuento.preferido;

    flujoDescuento.pendientes = pendientes;
    flujoDescuento.esperando = false;
    flujoDescuento.preferido = null;

    if (!pendientes.length) return terminarDescuento();

    const grupoPreferido = GRUPOS_DESCUENTO.find(
        (item) => item.claves.includes(preferido) && item.claves.some((clave) => pendientes.includes(clave)),
    );
    const grupo = grupoPreferido || GRUPOS_DESCUENTO.find((item) => item.claves.some((clave) => pendientes.includes(clave)));

    if (!grupo) return terminarDescuento();

    flujoDescuento.grupo = grupo;

    const faltan = grupo.claves
        .filter((clave) => pendientes.includes(clave))
        .sort((a, b) => (a === preferido ? -1 : b === preferido ? 1 : 0));

    const campo = porId(grupo.campos[faltan[0]]);
    const visible = campoVisible(campo);
    const destino = visible || porId(grupo.seccion);

    if (!destino) return;

    if (grupo.seccion === 'perfil') {
        const formulario = porId('formPerfil');
        const titulos = {
            'Teléfono registrado': 'Tu teléfono',
            'Fecha de nacimiento': 'Tu fecha de nacimiento',
        };
        const ayudas = {
            'Teléfono registrado': 'Escribe tu número de teléfono; lo usamos para avisarte de tus pedidos.',
            'Fecha de nacimiento': 'Ahora tu fecha de nacimiento: sirve para saludarte en tu cumpleaños.',
        };

        const pasos = faltan.map((clave, indice) => ({
            elemento: campoVisible(porId(grupo.campos[clave])),
            titulo: titulos[clave] || 'Tus datos',
            mensaje: indice === 0 ? `${grupo.intro(faltan)} ${ayudas[clave] || ''}`.trim() : ayudas[clave],
            foco: true,
        }));

        pasos.push({
            elemento: formulario?.querySelector('button[type="submit"]'),
            titulo: 'Guardar cambios',
            mensaje: 'Cuando termines, pulsa «Guardar cambios».',
        });

        recorrerPasos(pasos.filter((paso) => paso.elemento));

        return;
    }

    if (grupo.seccion === 'configuracion') {
        const formulario = porId('formPassword');

        recorrerPasos([
            { elemento: visible || destino, titulo: 'Contraseña', mensaje: REGLA_PASSWORD, foco: true },
            {
                elemento: formulario?.querySelector('button[type="submit"]'),
                titulo: 'Actualizar contraseña',
                mensaje: 'Cuando cumpla la regla, pulsa «Actualizar contraseña».',
            },
        ].filter((paso) => paso.elemento));

        return;
    }

    window.Chiky?.decir(grupo.intro(faltan));
    guiarPista(campo || destino, 'Tu dirección', grupo.intro(faltan));
}

/* Los enlaces «Completar/Agregar/Crear» también arrancan la ayuda de Chiky. */
document.addEventListener('click', (evento) => {
    const enlace = evento.target.closest('#contenidoDescuento .perfil-descuento__requisito a');

    if (!enlace || !window.Chiky) return;

    evento.preventDefault();

    const requisito = enlace.closest('li')?.querySelector('span')?.textContent.trim() || '';

    window.Chiky.mostrar();
    iniciarPasosDescuento(requisito);
});

/* Al abrir el formulario, Chiky señala el botón de ubicación. */
document.addEventListener('click', (evento) => {
    if (!evento.target.closest('#btnNuevaDireccion') || !flujoDescuento) return;
    if (flujoDescuento.grupo?.seccion !== 'direcciones') return;

    const panel = porId('formDireccionDesplegable');
    let avisado = false;

    const avisar = () => {
        if (avisado) return;

        avisado = true;
        guiarPista(
            porId('btnUbicacion'),
            'Ubicación en el mapa',
            'Pulsa «Ubicación actual» y confirma el punto en el mapa.',
        );
    };

    /* El panel se despliega: se avisa cuando ya tiene su tamaño final. */
    const alAbrir = (terminado) => {
        if (terminado.propertyName !== 'grid-template-rows') return;

        panel.removeEventListener('transitionend', alAbrir);

        if (panel.classList.contains('is-abierto')) setTimeout(avisar, 120);
    };

    panel?.addEventListener('transitionend', alAbrir);
    setTimeout(avisar, 700);
});

/* Diálogo con botón: cada paso espera a que el usuario pulse «Siguiente». */
const REGLA_PASSWORD = 'Usa al menos 8 caracteres, con una mayúscula, una minúscula y un número.';

document.addEventListener('click', (evento) => {
    if (!evento.target.closest('#btnUbicacion') || !flujoDescuento) return;

    setTimeout(secuenciaDireccion, 500);
});

function secuenciaDireccion() {
    if (!flujoDescuento) return;

    const formulario = porId('formDireccion');
    if (!formulario) return;

    recorrerPasos([
        {
            elemento: porId('direccionReferencia'),
            titulo: 'Referencia',
            mensaje: 'Añade una referencia para encontrarte: color de la casa, portón o un negocio cercano.',
            foco: true,
        },
        {
            elemento: porId('direccionManual'),
            titulo: 'Dirección escrita',
            mensaje: 'Esta es la dirección escrita; si el mapa no quedó exacto, ajústala aquí.',
        },
        {
            elemento: formulario.querySelector('button[type="submit"]'),
            titulo: 'Guardar dirección',
            mensaje: 'Cuando esté todo bien, pulsa «Guardar dirección».',
        },
    ].filter((paso) => paso.elemento));
}

/* Pista corta sobre un botón, con el mismo popover del login. */
function guiarPista(elemento, titulo, mensaje, lado = 'bottom') {
    if (!elemento || !window.Chiky) return;

    window.Chiky.guiar([
        {
            element: elemento,
            popover: { title: titulo, description: mensaje, side: lado, align: 'start' },
            alEntrar: () => {
                if (elemento.tagName !== 'BUTTON') return;

                elemento.addEventListener('click', () => window.Chiky?.cerrarGuia(), { once: true });
            },
        },
    ], { clave: 'chiky_pista', forzar: true, barra: false, progreso: false, recordar: false });
}

/* Pasos numerados («Paso 1 de N») con el popover de driver.js. */
function recorrerPasos(pasos, { progreso = true } = {}) {
    if (!window.Chiky || !pasos.length) return;

    const guia = pasos.map((paso, indice) => ({
        element: paso.elemento,
        popover: {
            title: paso.titulo,
            description: paso.mensaje,
            side: paso.lado || 'bottom',
            align: 'start',
        },
        alEntrar: () => {
            if (paso.foco) paso.elemento.focus({ preventScroll: true });

            /* Al usar el botón del último paso, la guía se cierra sola. */
            if (indice === pasos.length - 1 && paso.elemento.tagName === 'BUTTON') {
                paso.elemento.addEventListener('click', () => window.Chiky?.cerrarGuia(), { once: true });
            }
        },
    }));

    window.Chiky.guiar(guia, {
        clave: 'chiky_pasos_perfil',
        forzar: true,
        barra: false,
        recordar: false,
        progreso,
        mostrarAlCerrar: true,
    });
}

function continuarPasosDescuento() {
    if (!flujoDescuento || !window.Chiky || flujoDescuento.esperando) return;

    const pendientes = pendientesDescuento();
    const grupo = flujoDescuento.grupo;
    const antes = flujoDescuento.pendientes || [];
    const completadas = grupo
        ? grupo.claves.filter((clave) => antes.includes(clave) && !pendientes.includes(clave))
        : [];

    flujoDescuento.pendientes = pendientes;

    if (!pendientes.length) return terminarDescuento();

    if (!grupo) {
        empezarGrupoDescuento();
        return;
    }

    if (!completadas.length) return;

    const restantes = grupo.claves.filter((clave) => pendientes.includes(clave));

    if (restantes.length) {
        /* Queda otro dato del mismo formulario: seguimos aquí. */
        const campo = porId(grupo.campos[restantes[0]]);

        window.Chiky.decir(`${animo()} Ahora completa ${listarRequisitos(restantes)}.`);

        if (campo) irAlCampoDescuento(campo, campo);
        return;
    }

    volverACupones(completadas, pendientes);
}

function volverACupones(completadas, pendientes) {
    const seccion = porId('descuentos');
    if (!seccion) return;

    flujoDescuento.grupo = null;
    flujoDescuento.esperando = true;

    const destino = window.scrollY + seccion.getBoundingClientRect().top - 150;

    window.scrollTo({ top: Math.max(0, destino), behavior: 'smooth' });

    sombrearContenedor(porId('contenidoDescuento') || seccion);
    window.Chiky?.spotlight(porId('contenidoDescuento') || seccion, { duracion: 1600 });

    if (!pendientes.length) return terminarDescuento();

    window.Chiky.decir(`${animo()} Ya quedó ${listarRequisitos(completadas)}. Falta ${listarRequisitos(pendientes)}.`);
    window.Chiky.accion('Continuar', () => empezarGrupoDescuento());
}

function terminarDescuento() {
    flujoDescuento?.observer?.disconnect();
    flujoDescuento = null;

    const mensaje = `${animo()} Ya completaste los datos. Pulsa «Aplicar descuento» para disfrutar tu 10%.`;

    window.Chiky?.decir(mensaje);

    const boton = porId('btnAplicarDescuento');
    if (!boton) return;

    guiarPista(boton, '¡Listo!', mensaje);
}

function irAlCampoDescuento(campo, destino) {
    const visible = campoVisible(campo) || destino;

    if (!visible) return;

    llevarAlPaso(visible);
    sombrearContenedor(visible.closest('.perfil-card, .perfil-grupo') || visible);
    window.Chiky?.spotlight(visible, { duracion: 1800 });

    if (!campo) return;

    setTimeout(() => {
        visible.focus({ preventScroll: true });
        visible.classList.add('chiky-resalta');
        setTimeout(() => visible.classList.remove('chiky-resalta'), 2300);
    }, 450);
}

/* Flatpickr oculta el input original: se usa el que se ve. */
function campoVisible(campo) {
    if (!campo) return null;
    return campo._flatpickr?.altInput || campo;
}

/* Área libre de la pantalla: debajo del header y de la tarjeta si flota. */
function zonaLibre() {
    const header = 60;
    const tarjeta = document.querySelector('.chiky-montaje .chiky');
    const flotante = tarjeta
        && !tarjeta.hidden
        && !tarjeta.classList.contains('chiky--guardada')
        && getComputedStyle(tarjeta).position === 'fixed';
    const barra = flotante ? tarjeta.getBoundingClientRect().bottom : 0;

    return { arriba: Math.max(header, barra) + 16, abajo: window.innerHeight - 16 };
}

/* Coloca el elemento centrado en la zona libre, sin tapar la barra flotante. */
function llevarAlPaso(elemento) {
    if (!elemento) return;

    const { arriba, abajo } = zonaLibre();
    const caja = elemento.getBoundingClientRect();
    const centro = arriba + Math.max(0, (abajo - arriba - caja.height) / 2);
    const destino = window.scrollY + caja.top - centro;

    window.scrollTo({ top: Math.max(0, destino), behavior: 'smooth' });
}

/* Deja la sección centrada si su contenido cabe; si no, bajo la tarjeta/header. */
function alinearArriba(elemento) {
    if (!elemento) return;

    const { arriba, abajo } = zonaLibre();
    const cabecera = elemento.querySelector('.perfil-seccion__cabecera');
    const cuerpo = elemento.querySelector('.perfil-seccion__cuerpo');

    if (!cabecera || !cuerpo) {
        const destino = window.scrollY + elemento.getBoundingClientRect().top - arriba;
        window.scrollTo({ top: Math.max(0, destino), behavior: 'smooth' });
        return;
    }

    const inicio = cabecera.getBoundingClientRect().top;
    const alto = cuerpo.getBoundingClientRect().bottom - inicio;
    const libre = abajo - arriba;

    const objetivo = alto <= libre - 16
        ? arriba + Math.max(0, (libre - alto) / 2)
        : arriba;

    const destino = window.scrollY + inicio - objetivo;

    window.scrollTo({ top: Math.max(0, destino), behavior: 'smooth' });
}

function ayudarCompletarPerfil(campos) {
    alinearArriba(porId('perfil'));

    sombrearContenedor(porId('formPerfil'));

    const primero = porId(campos[0]);

    if (primero) {
        setTimeout(() => {
            primero.focus({ preventScroll: true });
            primero.classList.add('chiky-resalta');
            setTimeout(() => primero.classList.remove('chiky-resalta'), 2300);
        }, 420);
    }

    const nombres = campos.map((id) => (id === 'perfilTelefono' ? 'teléfono' : 'fecha de nacimiento'));
    window.Chiky?.decir(`Perfecto. Completa tu ${nombres.join(' y tu ')}; con eso activas tu descuento de primera compra.`);
}

function llenarPerfil(cliente) {
    porId('perfilNombre').value = cliente.nombre_cliente || '';
    porId('perfilUsuario').value = cliente.usuario_cliente || '';
    porId('perfilCorreo').value = cliente.correo_cliente || '';
    porId('perfilTelefono').value = cliente.telefono_cliente || '';
    porId('perfilCedula').value = cliente.cedula_cliente || '';

    marcarColorAvatar(cliente.avatar_color || '');
    marcarFondoAvatar(cliente.avatar_fondo || '');
    actualizarInicialesFondo(cliente.nombre_cliente);

    const fecha = porId('perfilFechaNacimiento');
    const valorFecha = cliente.fecha_nacimiento_cliente || '';

    if (fecha?._flatpickr) {
        if (valorFecha) {
            fecha._flatpickr.setDate(valorFecha, false, 'Y-m-d');
        } else {
            fecha._flatpickr.clear();
        }
    } else if (fecha) {
        fecha.value = valorFecha;
    }
}

/* ── Avatar del cliente ─────────────────────────────────────── */

function inicialesFondo(nombre) {
    const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);

    if (!partes.length) return '?';

    return (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase();
}

function actualizarInicialesFondo(nombre) {
    const objetivo = document.querySelector('[data-avatar-fondo-iniciales]');

    if (objetivo) objetivo.textContent = inicialesFondo(nombre);
}

function marcarColorAvatar(color) {
    const grupo = porId('avatarColores');
    if (!grupo) return;

    grupo.querySelectorAll('.perfil-avatar__color').forEach((boton) => {
        const activo = boton.dataset.color === color;

        boton.classList.toggle('is-activo', activo);
        boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
    });
}

function conectarAvatar() {
    const grupo = porId('avatarColores');
    if (!grupo) return;

    grupo.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('.perfil-avatar__color');
        if (!boton || boton.classList.contains('is-activo')) return;

        const color = boton.dataset.color;
        const anterior = grupo.querySelector('.is-activo')?.dataset.color
            || window.clienteTienda?.avatar_color
            || '';

        marcarColorAvatar(color);
        window.previsualizarAvatar?.(color);

        try {
            const datos = await window.TiendaAPI.put('/tienda/api/perfil/avatar', {
                avatar_color: color,
            });

            if (datos?.cliente) {
                window.clienteTienda = datos.cliente;
                window.pintarAvatares?.(datos.cliente);
                marcarColorAvatar(datos.cliente.avatar_color || '');
            }
        } catch (error) {
            marcarColorAvatar(anterior);
            window.previsualizarAvatar?.(anterior);
            window.tiendaToast?.(error?.message || 'No se pudo guardar el color.', 'aviso');
        }
    });
}

/* ── Fotos de fondo del avatar ───────────────────────────────
   Archivos reales en imagenes/avatares/fondos/. Si agregas uno
   nuevo, añade su nombre a esta lista. */

const AVATAR_FONDOS = [
    'fondo-1.png',
    'fondo-2.png',
    'fondo-3.png',
    'fondo-4.png',
    'fondo-5.png',
    'fondo-6.png',
    'fondo-7.png',
];

function marcarFondoAvatar(fondo) {
    const grupo = porId('avatarFondos');
    if (!grupo) return;

    grupo.querySelectorAll('.perfil-avatar__fondo').forEach((boton) => {
        const activo = (boton.dataset.fondo || '') === (fondo || '');

        boton.classList.toggle('is-activo', activo);
        boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
    });
}

async function cargarFondosAvatar(cliente) {
    const grupo = porId('avatarFondos');
    if (!grupo) return;

    const inicialesBoton = grupo.querySelector('[data-avatar-fondo-iniciales]');
    const nombre = cliente?.nombre_cliente || '';

    if (inicialesBoton) inicialesBoton.textContent = inicialesFondo(nombre);

    const detectados = AVATAR_FONDOS;
    const activo = cliente?.avatar_fondo || '';

    grupo.innerHTML = `
        <button type="button" class="perfil-avatar__fondo ${activo ? '' : 'is-activo'}" data-fondo="" aria-pressed="${activo ? 'false' : 'true'}" aria-label="Solo iniciales">
            <span data-avatar-fondo-iniciales>${inicialesBoton?.textContent || '?'}</span>
        </button>
        ${detectados.map((archivo) => `
            <button type="button" class="perfil-avatar__fondo ${archivo === activo ? 'is-activo' : ''}" data-fondo="${escapar(archivo)}" aria-pressed="${archivo === activo}" aria-label="Foto de fondo" style="background-image:url('/tienda/recursos/imagenes/avatares/fondos/${escapar(archivo)}')"></button>`).join('')}`;
}

function conectarFondosAvatar() {
    const grupo = porId('avatarFondos');
    if (!grupo) return;

    grupo.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('.perfil-avatar__fondo');
        if (!boton || boton.classList.contains('is-activo')) return;

        const fondo = boton.dataset.fondo || '';
        const anterior = window.clienteTienda?.avatar_fondo || '';

        marcarFondoAvatar(fondo);
        window.previsualizarAvatarFondo?.(fondo);

        try {
            const datos = await window.TiendaAPI.put('/tienda/api/perfil/avatar', {
                avatar_fondo: fondo,
            });

            if (datos?.cliente) {
                window.clienteTienda = datos.cliente;
                window.pintarAvatares?.(datos.cliente);
                marcarFondoAvatar(datos.cliente.avatar_fondo || '');
            }
        } catch (error) {
            marcarFondoAvatar(anterior);
            window.previsualizarAvatarFondo?.(anterior);
            window.tiendaToast?.(error?.message || 'No se pudo guardar la foto de fondo.', 'aviso');
        }
    });
}

/* ── Marco de ventas ─────────────────────────────────────────── */

function marcarMarcoOpcion(clave) {
    const grupo = porId('marcoOpciones');
    if (!grupo) return;

    grupo.querySelectorAll('.perfil-marco__hito').forEach((boton) => {
        const activo = boton.dataset.marco === clave;
        const bloqueado = boton.classList.contains('is-bloqueado');

        boton.classList.toggle('is-reclamado', activo);
        boton.classList.toggle('is-disponible', !activo && !bloqueado);
        boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
    });
}

function pintarMarcoPerfil() {
    const nivel = porId('marcoNivel');
    const progreso = porId('marcoProgreso');
    const casilla = porId('marcoVisible');
    const relleno = porId('marcoRelleno');
    const barra = porId('marcoBarra');
    const opciones = porId('marcoOpciones');

    if (!nivel || !progreso || !casilla) return;

    const aplicar = (datos) => {
        const ventas = Number(datos?.ventas || 0);
        const marco = datos?.marco || null;
        const siguiente = datos?.siguiente || null;
        const niveles = datos?.niveles || [];
        const desbloqueados = datos?.desbloqueados || [];
        const seleccionado = datos?.marco_estilo || (marco ? marco.clave : '');

        if (datos?.forzado && marco) {
            nivel.textContent = `Nivel ${marco.nombre}`;
            progreso.textContent = '';
            progreso.hidden = true;
        } else {
            progreso.hidden = false;

            if (marco) {
                nivel.textContent = `Nivel ${marco.nombre} · ${ventas} ${ventas === 1 ? 'venta' : 'ventas'}`;
            } else if (desbloqueados.length) {
                const listo = desbloqueados[desbloqueados.length - 1];
                nivel.textContent = `Marco ${listo.nombre} listo para reclamar`;
            } else {
                nivel.textContent = 'Aún sin marco';
            }

            if (siguiente) {
                if (!marco && desbloqueados.length) {
                    const listo = desbloqueados[desbloqueados.length - 1];
                    progreso.textContent = `Reclama tu marco ${listo.nombre} · Te faltan ${datos.faltan} ventas para ${siguiente.nombre}.`;
                } else if (marco) {
                    progreso.textContent = `Te faltan ${datos.faltan} ventas para ${siguiente.nombre}.`;
                } else {
                    progreso.textContent = `Necesitas ${datos.faltan} ventas para ${siguiente.nombre}.`;
                }
            } else if (marco) {
                progreso.textContent = '¡Tienes el marco máximo!';
            } else if (desbloqueados.length) {
                const listo = desbloqueados[desbloqueados.length - 1];
                progreso.textContent = `Reclama tu marco ${listo.nombre} para lucirlo.`;
            } else {
                progreso.textContent = 'Necesitas 5 ventas para tu primer marco.';
            }
        }

        const avance = Math.max(0, Math.min(100, Number(datos?.avance || 0)));
        const total = niveles.length;
        const indiceActual = niveles.reduce((ultimo, item, indice) => (item.desbloqueado ? indice : ultimo), -1);
        /* Los hitos van del 10% al 90% del riel, repartidos en partes iguales. */
        const tramo = total > 1 ? 80 / (total - 1) : 80;
        const rellenoPct = indiceActual >= 0
            ? Math.min(80, indiceActual * tramo + tramo * (avance / 100))
            : 0;

        if (relleno) relleno.style.width = `${rellenoPct}%`;
        if (barra) barra.setAttribute('aria-valuenow', String(avance));

        if (opciones) {
            opciones.innerHTML = niveles.map((item) => {
                const activo = item.clave === seleccionado;
                const bloqueado = !item.desbloqueado;
                const estado = activo ? 'is-reclamado' : bloqueado ? 'is-bloqueado' : 'is-disponible';
                const icono = activo ? 'bi-check-lg' : bloqueado ? 'bi-lock-fill' : 'bi-plus-lg';

                return `<li class="perfil-marco__hito-item">
                            <button type="button" class="perfil-marco__hito ${estado}"
                                data-marco="${item.clave}" ${bloqueado ? 'disabled' : ''} aria-pressed="${activo}"
                                title="${item.nombre} · ${item.ventas} ventas">
                                <span class="perfil-marco__nodo">
                                    <span class="perfil-marco__muestra marco--${item.clave}" aria-hidden="true"></span>
                                    <span class="perfil-marco__sello" aria-hidden="true"><i class="bi ${icono}"></i></span>
                                </span>
                                <span class="perfil-marco__hito-nombre">${item.nombre}</span>
                                <span class="perfil-marco__hito-ventas">${item.ventas} ventas</span>
                            </button>
                        </li>`;
            }).join('');
        }

        casilla.checked = window.clienteTienda?.marco_avatar !== false;
        casilla.disabled = !marco;
    };

    if (window.marcoTienda) {
        aplicar(window.marcoTienda);
        return;
    }

    if (window.marcoTiendaPromise) {
        window.marcoTiendaPromise.then(aplicar).catch(() => aplicar(null));
        return;
    }

    aplicar(null);
}

function conectarMarco() {
    porId('marcoVisible')?.addEventListener('change', async (evento) => {
        const casilla = evento.target;
        const mostrar = casilla.checked;
        casilla.disabled = true;

        try {
            const datos = await window.TiendaAPI.put('/tienda/api/perfil/marco', { mostrar }, { cargando: true });

            window.clienteTienda = datos.cliente || window.clienteTienda;
            window.pintarAvatares?.(window.clienteTienda);
        } catch (error) {
            casilla.checked = !mostrar;
            window.tiendaToast?.(error?.message || 'No se pudo guardar la preferencia.', 'aviso');
        } finally {
            casilla.disabled = false;
        }
    });

    porId('marcoOpciones')?.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('.perfil-marco__hito');
        if (!boton || boton.disabled || boton.classList.contains('is-reclamado')) return;

        const estilo = boton.dataset.marco;
        const anterior = window.marcoTienda?.marco_estilo || '';

        marcarMarcoOpcion(estilo);

        try {
            const datos = await window.TiendaAPI.put('/tienda/api/perfil/marco', { estilo }, { cargando: true });

            window.clienteTienda = datos.cliente || window.clienteTienda;

            let nivel = null;

            if (window.marcoTienda) {
                nivel = (window.marcoTienda.niveles || []).find((item) => item.clave === estilo) || null;

                window.marcoTienda.marco = nivel;
                window.marcoTienda.marco_estilo = estilo;
            }

            const casilla = porId('marcoVisible');
            if (casilla) casilla.checked = true;

            window.pintarAvatares?.(window.clienteTienda);
            window.tiendaToast?.(`¡Reclamaste el marco ${nivel?.nombre || estilo}!`, 'exito');
        } catch (error) {
            marcarMarcoOpcion(anterior);
            window.tiendaToast?.(error?.message || 'No se pudo cambiar el marco.', 'aviso');
        }
    });
}

/* ── Mostrar u ocultar contraseñas ───────────────────────────── */

function conectarOjosPassword() {
    document.querySelectorAll('[data-toggle-password]').forEach((boton) => {
        boton.addEventListener('click', () => {
            const input = porId(boton.dataset.togglePassword);
            if (!input) return;

            const mostrar = input.type === 'password';
            input.type = mostrar ? 'text' : 'password';
            boton.setAttribute('aria-pressed', mostrar ? 'true' : 'false');
            boton.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');

            const icono = boton.querySelector('i');
            if (icono) icono.className = mostrar ? 'bi bi-eye-slash' : 'bi bi-eye';

            input.focus();
        });
    });
}

function validarPassword(nueva, confirmacion) {
    if (!nueva || nueva.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[a-z]/.test(nueva)) return 'La contraseña debe incluir al menos una letra minúscula.';
    if (!/[A-Z]/.test(nueva)) return 'La contraseña debe incluir al menos una letra mayúscula.';
    if (!/\d/.test(nueva)) return 'La contraseña debe incluir al menos un número.';
    if (nueva !== confirmacion) return 'Las contraseñas no coinciden.';

    return '';
}

function conectarFormularios() {
    conectarOjosPassword();

    porId('formPerfil')?.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const boton = evento.currentTarget.querySelector('button[type="submit"]');
        const texto = boton?.textContent;
        bloquearBoton(boton, true);

        try {
            const datos = await window.TiendaAPI.put('/tienda/api/perfil', {
                nombre_cliente: porId('perfilNombre').value.trim(),
                usuario_cliente: porId('perfilUsuario').value.trim(),
                correo_cliente: porId('perfilCorreo').value.trim(),
                telefono_cliente: porId('perfilTelefono').value.trim(),
                fecha_nacimiento_cliente: porId('perfilFechaNacimiento').value,
                cedula_cliente: porId('perfilCedula').value.trim(),
            }, { cargando: true });

            if (!datos?.cliente) {
                tiendaToast('No se pudo actualizar el perfil. Intenta de nuevo.', 'aviso');
                return;
            }

            window.clienteTienda = datos.cliente;

            document.querySelectorAll('.perfil__nombre').forEach((elemento) => {
                elemento.textContent = datos.cliente.nombre_cliente || '';
            });

            document.querySelectorAll('.perfil__detalle').forEach((elemento) => {
                elemento.textContent = `@${datos.cliente.usuario_cliente || ''}`;
            });

            actualizarInicialesFondo(datos.cliente.nombre_cliente || '');
            tiendaToast('Perfil actualizado correctamente.');
            ofrecerDescuento();
            refrescarDescuento();
        } catch (error) {
            mostrarError(error);
        } finally {
            bloquearBoton(boton, false);
            if (texto) boton.textContent = texto;
        }
    });

    porId('formPassword')?.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        /* OJO: evento.currentTarget se pierde después del await. */
        const formulario = evento.currentTarget;
        const nueva = porId('passwordNueva').value;
        const confirmacion = porId('passwordNuevaConfirm').value;
        const problema = validarPassword(nueva, confirmacion);

        if (problema) {
            tiendaToast(problema, 'aviso');
            (problema.includes('coinciden') ? porId('passwordNuevaConfirm') : porId('passwordNueva')).focus();
            return;
        }

        const boton = formulario.querySelector('button[type="submit"]');
        const texto = boton?.textContent;
        bloquearBoton(boton, true);

        try {
            const datos = await window.TiendaAPI.put('/tienda/api/perfil/password', {
                password_actual: porId('passwordActual')?.value || '',
                password_nueva: porId('passwordNueva').value,
                password_nueva_confirmation: porId('passwordNuevaConfirm').value,
            }, { cargando: true });

            formulario.reset();
            tiendaToast(datos?.mensaje || 'Contraseña actualizada correctamente.');
            ajustarFormPassword();
            refrescarDescuento();
        } catch (error) {
            mostrarError(error);
            ajustarFormPassword();
        } finally {
            bloquearBoton(boton, false);
            if (texto) boton.textContent = texto;
        }
    });
}

/* Las cuentas creadas con Google no tienen contraseña: se oculta el campo actual. */
function ajustarFormPassword() {
    const tiene = typeof window.cuentaTienePassword === 'function' ? window.cuentaTienePassword() : true;
    const columna = porId('passwordActualCol');
    const titulo = porId('passwordTitulo');
    const ayuda = porId('passwordAyuda');
    const aviso = porId('avisoPassword');

    /* Ya creó una contraseña antes (aunque la cuenta siga siendo de Google). */
    const yaTiene = Boolean(window.clienteTienda?.password_set);

    if (columna) columna.hidden = !tiene;
    if (aviso) aviso.hidden = tiene || yaTiene;

    if (titulo) titulo.textContent = (tiene || yaTiene) ? 'Cambiar contraseña' : 'Crear contraseña';

    if (ayuda) {
        ayuda.textContent = tiene
            ? 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.'
            : (yaTiene
                ? 'Escribe tu nueva contraseña (mín. 8, mayúscula, minúscula y número).'
                : 'Tu cuenta entra con Google. Crea una contraseña (mín. 8, mayúscula, minúscula y número) para entrar también con tu correo.');
    }

    if (!tiene && !yaTiene) {
        let avisar = false;

        try {
            avisar = sessionStorage.getItem('tienda_aviso_password') === '1';
            sessionStorage.removeItem('tienda_aviso_password');
        } catch {
            avisar = false;
        }

        if (avisar) {
            tiendaToast('Crea una contraseña para entrar también con tu correo.', 'aviso');
        }
    }
}

/* ── Direcciones ─────────────────────────────────────────────── */

let temporizadorCierreDireccion = 0;

function conectarDirecciones() {
    porId('btnNuevaDireccion')?.addEventListener('click', () => abrirFormDireccion());
    porId('btnCancelarDireccion')?.addEventListener('click', cerrarFormDireccion);
    porId('formDireccion')?.addEventListener('submit', guardarDireccion);
    porId('listaDirecciones')?.addEventListener('click', manejarAccionDireccion);
    porId('btnUbicacion')?.addEventListener('click', usarUbicacionActual);

    document.querySelectorAll('input[name="direccionTipo"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            if (radio.checked) seleccionarTipoDireccion(radio.value, { enfocar: true });
        });
    });
}

async function cargarDirecciones() {
    const lista = porId('listaDirecciones');
    if (!lista) return;

    try {
        const datos = await window.TiendaAPI.get('/tienda/api/direcciones');
        direccionesCache = datos.direcciones || [];

        if (!direccionesCache.length) {
            lista.innerHTML = `
                <div class="perfil-vacio">
                    <i class="bi bi-geo-alt"></i>
                    <p>Todavía no tienes direcciones guardadas.</p>
                </div>`;
            refrescarDescuento();
            return;
        }

        lista.innerHTML = direccionesCache.map(direccionHTML).join('');
        refrescarDescuento();
    } catch (error) {
        mostrarError(error);
    }
}

function direccionHTML(direccion) {
    const maps = urlSegura(direccion.ubicacion_maps);

    return `
        <article class="perfil-item-card" data-direccion="${direccion.id_direccion_cliente}">
            <div class="perfil-item-card__cabecera">
                <h3 class="perfil-item-card__titulo">
                    ${escapar(direccion.nombre_direccion)}
                    ${direccion.predeterminada_direccion ? '<span class="perfil-badge">Predeterminada</span>' : ''}
                </h3>

                <div class="perfil-item-card__acciones">
                    ${direccion.predeterminada_direccion ? '' : `
                        <button type="button" class="perfil-btn-icono" data-accion="predeterminada" title="Usar como predeterminada">
                            <i class="bi bi-star"></i>
                        </button>`}
                    <button type="button" class="perfil-btn-icono" data-accion="editar" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="perfil-btn-icono perfil-btn-icono--peligro" data-accion="eliminar" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>

            ${direccion.direccion_manual ? `<p class="perfil-item-card__texto"><i class="bi bi-house"></i> ${escapar(direccion.direccion_manual)}</p>` : ''}
            ${direccion.referencia_direccion ? `<p class="perfil-item-card__texto"><i class="bi bi-info-circle"></i> ${escapar(direccion.referencia_direccion)}</p>` : ''}
            ${!direccionTieneUbicacion(direccion) ? '<p class="perfil-item-card__texto"><i class="bi bi-exclamation-triangle"></i> Marca la ubicación para calcular el delivery.</p>' : ''}
            ${maps ? `<a class="perfil-item-card__enlace" href="${escapar(maps)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-geo"></i> Ver en Google Maps</a>` : ''}
        </article>`;
}

function abrirFormDireccion(direccion = null) {
    const formulario = porId('formDireccion');
    const panel = porId('formDireccionDesplegable');
    if (!formulario || !panel) return;

    window.clearTimeout(temporizadorCierreDireccion);

    formulario.reset();
    porId('direccionId').value = direccion?.id_direccion_cliente || '';
    porId('direccionMaps').value = direccion?.ubicacion_maps || '';
    porId('direccionReferencia').value = direccion?.referencia_direccion || '';
    porId('direccionManual').value = direccion?.direccion_manual || '';
    porId('direccionPredeterminada').checked = Boolean(direccion?.predeterminada_direccion);

    const lat = direccion?.latitud_direccion != null ? Number(direccion.latitud_direccion) : null;
    const lng = direccion?.longitud_direccion != null ? Number(direccion.longitud_direccion) : null;

    if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
        aplicarUbicacion(lat, lng, { conservarEnlace: true });
    } else {
        limpiarUbicacion();
    }

    marcarTipoDireccion(direccion?.nombre_direccion || '');
    mostrarEstadoUbicacion('');

    panel.inert = false;
    panel.classList.add('is-abierto');
    desplazarFormDireccion(panel);
}

function cerrarFormDireccion() {
    const formulario = porId('formDireccion');
    const panel = porId('formDireccionDesplegable');
    if (!formulario || !panel) return;

    panel.classList.remove('is-abierto');
    panel.inert = true;

    /* La limpieza espera al cierre para no vaciar los campos a la vista. */
    window.clearTimeout(temporizadorCierreDireccion);
    temporizadorCierreDireccion = window.setTimeout(() => {
        if (panel.classList.contains('is-abierto')) return;

        formulario.reset();
        porId('direccionId').value = '';
        limpiarUbicacion();
        marcarTipoDireccion('');
        mostrarEstadoUbicacion('');
    }, 500);
}

function desplazarFormDireccion(panel) {
    /* Con Chiky guiando, el centrado lo hace ella sobre el campo que señala. */
    if (flujoDescuento?.grupo?.seccion === 'direcciones') return;

    let desplazado = false;

    const desplazar = () => {
        if (desplazado) return;

        desplazado = true;
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        desplazar();
        return;
    }

    panel.addEventListener('transitionend', (evento) => {
        if (evento.propertyName === 'grid-template-rows') desplazar();
    }, { once: true });

    window.setTimeout(desplazar, 600);
}

async function guardarDireccion(evento) {
    evento.preventDefault();

    const id = porId('direccionId').value;
    const tipo = document.querySelector('input[name="direccionTipo"]:checked')?.value || 'Casa';
    const nombre = tipo === 'Otro' ? porId('direccionNombre').value.trim() : tipo;

    if (!nombre) {
        tiendaToast('Escribe el nombre de la dirección.', 'aviso');
        porId('direccionNombre').focus();
        return;
    }

    const datos = {
        nombre_direccion: nombre,
        ubicacion_maps: porId('direccionMaps').value.trim(),
        referencia_direccion: porId('direccionReferencia').value.trim(),
        direccion_manual: porId('direccionManual').value.trim(),
        latitud_direccion: porId('direccionLat').value || null,
        longitud_direccion: porId('direccionLng').value || null,
        predeterminada_direccion: porId('direccionPredeterminada').checked,
    };

    const boton = evento.currentTarget.querySelector('button[type="submit"]');
    bloquearBoton(boton, true);

    try {
        if (id) {
            await window.TiendaAPI.put(`/tienda/api/direcciones/${id}`, datos, { cargando: true });
            tiendaToast('Dirección actualizada correctamente.');
        } else {
            await window.TiendaAPI.post('/tienda/api/direcciones', datos, { cargando: true });
            tiendaToast('Dirección agregada correctamente.');
        }

        cerrarFormDireccion();
        await cargarDirecciones();
    } catch (error) {
        mostrarError(error);
    } finally {
        bloquearBoton(boton, false);
    }
}

function seleccionarTipoDireccion(tipo, { enfocar = false } = {}) {
    const otro = tipo === 'Otro';
    const desplegable = porId('direccionNombreDesplegable');
    const nombre = porId('direccionNombre');

    if (desplegable) {
        desplegable.classList.toggle('is-abierto', otro);
        desplegable.inert = !otro;
    }

    if (nombre) {
        nombre.setAttribute('aria-required', String(otro));

        if (otro) {
            if (enfocar) nombre.focus();
        } else {
            nombre.value = '';
        }
    }
}

function marcarTipoDireccion(nombre) {
    const tipo = ['Casa', 'Trabajo'].includes(nombre) ? nombre : (nombre ? 'Otro' : 'Casa');

    document.querySelectorAll('input[name="direccionTipo"]').forEach((radio) => {
        radio.checked = radio.value === tipo;
    });

    const campoNombre = porId('direccionNombre');
    if (campoNombre) campoNombre.value = tipo === 'Otro' ? nombre : '';

    seleccionarTipoDireccion(tipo);
}

function mostrarEstadoUbicacion(texto, tipo = '') {
    const estado = porId('estadoUbicacion');
    if (!estado) return;

    estado.textContent = texto;
    estado.hidden = texto === '';
    estado.classList.toggle('is-error', tipo === 'error');
    estado.classList.toggle('is-ok', tipo === 'ok');
}

function usarUbicacionActual() {
    const boton = porId('btnUbicacion');
    if (!boton) return;

    if (!('geolocation' in navigator)) {
        mostrarEstadoUbicacion('Tu navegador no permite obtener la ubicación.', 'error');
        return;
    }

    if (!window.isSecureContext) {
        mostrarEstadoUbicacion('La ubicación solo funciona con HTTPS o en localhost.', 'error');
        return;
    }

    const contenido = boton.innerHTML;

    boton.disabled = true;
    boton.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Buscando…';
    mostrarEstadoUbicacion('Obteniendo tu ubicación…');

    navigator.geolocation.getCurrentPosition(
        async (posicion) => {
            const lat = Number(posicion.coords.latitude.toFixed(7));
            const lng = Number(posicion.coords.longitude.toFixed(7));

            aplicarUbicacion(lat, lng);
            mostrarEstadoUbicacion('Ubicación lista. Revisa la dirección y guarda.', 'ok');

            boton.disabled = false;
            boton.innerHTML = contenido;

            await completarDireccion(lat, lng);
        },
        (error) => {
            const mensajes = {
                1: 'Permiso denegado. Activa la ubicación para este sitio en el navegador.',
                2: 'No se pudo obtener tu ubicación. Intenta en un lugar abierto.',
                3: 'La ubicación tardó demasiado. Intenta de nuevo.',
            };

            mostrarEstadoUbicacion(mensajes[error.code] || 'No se pudo obtener la ubicación.', 'error');

            boton.disabled = false;
            boton.innerHTML = contenido;
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
}

function aplicarUbicacion(lat, lng, opciones = {}) {
    porId('direccionLat').value = lat;
    porId('direccionLng').value = lng;

    const enlace = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const campoMaps = porId('direccionMaps');
    const actual = campoMaps.value.trim();

    if (!opciones.conservarEnlace && (!actual || actual.startsWith('https://www.google.com/maps/search/?api=1&query='))) {
        campoMaps.value = enlace;
    }

    const margen = 0.004;

    porId('mapaUbicacion').src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - margen}%2C${lat - margen}%2C${lng + margen}%2C${lat + margen}&layer=mapnik&marker=${lat}%2C${lng}`;
    porId('coordsUbicacion').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    porId('enlaceUbicacion').href = enlace;
    porId('vistaUbicacion').hidden = false;
}

function limpiarUbicacion() {
    if (!porId('vistaUbicacion')) return;

    porId('direccionLat').value = '';
    porId('direccionLng').value = '';
    porId('vistaUbicacion').hidden = true;
    porId('mapaUbicacion').src = 'about:blank';
    porId('coordsUbicacion').textContent = '';
    porId('enlaceUbicacion').href = '#';
}

async function completarDireccion(lat, lng) {
    try {
        const respuesta = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`
        );

        if (!respuesta.ok) return;

        const datos = await respuesta.json();
        const direccion = String(datos.display_name || '').trim();

        if (!direccion) return;

        const manual = porId('direccionManual');

        if (!manual.value.trim()) {
            manual.value = direccion;
        }
    } catch (error) {
        // Sin geocodificación inversa: el usuario puede escribir la dirección.
    }
}

async function manejarAccionDireccion(evento) {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;

    const tarjeta = boton.closest('[data-direccion]');
    const id = tarjeta?.dataset.direccion;
    if (!id) return;

    const accion = boton.dataset.accion;
    const direccion = direccionesCache.find((fila) => String(fila.id_direccion_cliente) === String(id));

    if (accion === 'editar' && direccion) {
        abrirFormDireccion(direccion);
        return;
    }

    if (accion === 'eliminar') {
        const confirmado = await tiendaConfirmar({
            titulo: 'Eliminar dirección',
            mensaje: '¿Eliminar esta dirección?',
            textoAceptar: 'Eliminar',
            peligro: true,
        });

        if (!confirmado) return;

        try {
            await window.TiendaAPI.delete(`/tienda/api/direcciones/${id}`);
            tiendaToast('Dirección eliminada.', 'info');
            await cargarDirecciones();
        } catch (error) {
            mostrarError(error);
        }
        return;
    }

    if (accion === 'predeterminada') {
        try {
            await window.TiendaAPI.post(`/tienda/api/direcciones/${id}/predeterminada`);
            tiendaToast('Dirección predeterminada actualizada.');
            await cargarDirecciones();
        } catch (error) {
            mostrarError(error);
        }
    }
}

/* ── Favoritos ───────────────────────────────────────────────── */

function conectarFavoritos() {
    porId('listaFavoritos')?.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('[data-quitar-favorito]');
        if (!boton) return;

        const idProducto = boton.dataset.quitarFavorito;

        try {
            await window.TiendaAPI.delete(`/tienda/api/favoritos/${idProducto}`);
            window.favoritosTienda?.delete(String(idProducto));
            tiendaToast('Producto quitado de favoritos.', 'info');
            await cargarFavoritos();
        } catch (error) {
            mostrarError(error);
        }
    });
}

async function cargarFavoritos() {
    const lista = porId('listaFavoritos');
    const vacio = porId('favoritosVacio');
    if (!lista || !vacio) return;

    try {
        const datos = await window.TiendaAPI.get('/tienda/api/favoritos');
        const favoritos = datos.favoritos || [];

        if (!favoritos.length) {
            lista.hidden = true;
            lista.innerHTML = '';
            vacio.hidden = false;
            return;
        }

        vacio.hidden = true;
        lista.hidden = false;
        lista.innerHTML = favoritos.map(favoritoHTML).join('');
    } catch (error) {
        mostrarError(error);
    }
}

function favoritoHTML(favorito) {
    return `
        <article class="perfil-producto">
            <a class="perfil-producto__media" href="/producto?p=${escapar(favorito.id_producto)}">
                <img src="${escapar(favorito.imagen || IMAGEN_FALLBACK)}" alt="${escapar(favorito.nombre_producto)}"
                    onerror="this.src='${IMAGEN_FALLBACK}'">
            </a>

            <div class="perfil-producto__info">
                <span class="perfil-producto__categoria">${escapar(favorito.categoria)}</span>
                <a class="perfil-producto__nombre" href="/producto?p=${escapar(favorito.id_producto)}">${escapar(favorito.nombre_producto)}</a>
                <span class="perfil-producto__precio">${moneda(favorito.precio)}</span>
            </div>

            <button type="button" class="perfil-btn-icono perfil-btn-icono--peligro" data-quitar-favorito="${favorito.id_producto}" title="Quitar de favoritos">
                <i class="bi bi-trash"></i>
            </button>
        </article>`;
}

/* ── Pedidos web ─────────────────────────────────────────────── */

const ESTADOS_PEDIDO = {
    solicitado: { texto: 'Solicitado', clase: 'celeste', icono: 'bi-hourglass-split' },
    aceptado: { texto: 'Aceptado', clase: 'ok', icono: 'bi-check2-circle' },
    preparando: { texto: 'Preparando', clase: 'proceso', icono: 'bi-box-seam' },
    listo_retiro: { texto: 'Listo para retiro', clase: 'proceso', icono: 'bi-shop' },
    enviado: { texto: 'En camino', clase: 'proceso', icono: 'bi-truck' },
    entregado: { texto: 'Entregado', clase: 'ok', icono: 'bi-check2-circle' },
    rechazado: { texto: 'Rechazado', clase: 'peligro', icono: 'bi-x-circle' },
    cancelado: { texto: 'Cancelado', clase: 'peligro', icono: 'bi-slash-circle' },
    devuelto: { texto: 'Devuelto', clase: 'peligro', icono: 'bi-arrow-counterclockwise' },
};

const ESTADOS_PAGO = {
    pendiente: { texto: 'Pago pendiente', clase: 'aviso' },
    en_revision: { texto: 'Pago en revisión', clase: 'proceso' },
    pagado: { texto: 'Pagado', clase: 'ok' },
    parcial: { texto: 'Pago parcial', clase: 'aviso' },
    reembolsado: { texto: 'Reembolsado', clase: 'peligro' },
};

const METODOS_PAGO_WEB = {
    efectivo: 'Efectivo (contra entrega)',
    billetera_movil: 'Billetera móvil',
    lafise: 'Transferencia Lafise',
};

const WHATSAPP_TIENDA = '50584774288';

const ESTADOS_PEDIDO_CANCELADOS = ['cancelado', 'rechazado', 'devuelto'];
const ESTADOS_PEDIDO_SOLICITADOS = ['solicitado'];
/* "Activos" incluye los recién solicitados: si no, el cliente que acaba de
   comprar entra a Mis pedidos y no ve nada. */
const ESTADOS_PEDIDO_ACTIVOS = ['solicitado', 'aceptado', 'preparando', 'listo_retiro', 'enviado'];
const ESTADOS_PEDIDO_ENTREGADOS = ['entregado'];
const ESTADOS_PAGO_PENDIENTES = ['pendiente', 'en_revision', 'parcial'];

const PRIORIDAD_ESTADO_PEDIDO = {
    solicitado: 0,
    aceptado: 1,
    preparando: 2,
    listo_retiro: 3,
    enviado: 4,
    entregado: 5,
    cancelado: 6,
    rechazado: 7,
    devuelto: 8,
};

function ordenarPedidosWeb(a, b) {
    const pa = PRIORIDAD_ESTADO_PEDIDO[a.estado_pedido] ?? 99;
    const pb = PRIORIDAD_ESTADO_PEDIDO[b.estado_pedido] ?? 99;

    if (pa !== pb) return pa - pb;

    const fa = new Date(a.fecha_pedido || 0).getTime();
    const fb = new Date(b.fecha_pedido || 0).getTime();

    if (fb !== fa) return fb - fa;

    return Number(b.id_pedido || 0) - Number(a.id_pedido || 0);
}
let pedidosWeb = [];
let filtroPedidosWeb = 'activos';

async function cargarPedidos() {
    const lista = porId('listaPedidos');
    const vacio = porId('pedidosVacio');
    if (!lista || !vacio) return;

    try {
        const datos = await window.TiendaAPI.get('/tienda/api/pedidos');
        pedidosWeb = datos.pedidos || [];
        renderPedidos();
    } catch (error) {
        mostrarError(error);
    }
}

function renderPedidos() {
    const lista = porId('listaPedidos');
    const vacio = porId('pedidosVacio');
    if (!lista || !vacio) return;

    const mensajes = {
        todos: 'Aún no tienes pedidos registrados.',
        solicitados: 'No tienes pedidos pendientes de aceptación.',
        activos: 'No tienes pedidos activos.',
        entregados: 'Aún no tienes pedidos entregados.',
        cancelados: 'No tienes pedidos cancelados.',
        pagos_pendientes: 'No tienes pedidos con pago pendiente.',
    };

    const pedidos = pedidosWeb
        .filter((pedido) => {
            if (filtroPedidosWeb === 'solicitados') {
                return ESTADOS_PEDIDO_SOLICITADOS.includes(pedido.estado_pedido);
            }

            if (filtroPedidosWeb === 'entregados') {
                return ESTADOS_PEDIDO_ENTREGADOS.includes(pedido.estado_pedido);
            }

            if (filtroPedidosWeb === 'cancelados') {
                return ESTADOS_PEDIDO_CANCELADOS.includes(pedido.estado_pedido);
            }

            if (filtroPedidosWeb === 'pagos_pendientes') {
                return ESTADOS_PAGO_PENDIENTES.includes(pedido.estado_pago)
                    && !ESTADOS_PEDIDO_CANCELADOS.includes(pedido.estado_pedido);
            }

            if (filtroPedidosWeb === 'activos') {
                return ESTADOS_PEDIDO_ACTIVOS.includes(pedido.estado_pedido);
            }

            return true;
        })
        .sort(ordenarPedidosWeb);

    const mensaje = vacio.querySelector('p');
    if (mensaje) mensaje.textContent = mensajes[filtroPedidosWeb] || mensajes.todos;

    if (!pedidos.length) {
        lista.hidden = true;
        lista.innerHTML = '';
        vacio.hidden = false;
        return;
    }

    vacio.hidden = true;
    lista.hidden = false;
    lista.innerHTML = pedidos.map(pedidoHTML).join('');

    lista.classList.remove('perfil-lista--animar');
    void lista.offsetWidth;
    lista.classList.add('perfil-lista--animar');
}

function estadoPedido(estado) {
    return ESTADOS_PEDIDO[estado] || { texto: estado || '—', clase: '', icono: 'bi-info-circle' };
}

function estadoPago(estado) {
    return ESTADOS_PAGO[estado] || { texto: estado || '—', clase: '' };
}

function pasosPedidoHTML(pedido) {
    if (ESTADOS_PEDIDO_CANCELADOS.includes(pedido.estado_pedido)) return '';

    const estado = pedido.estado_pedido;
    const indiceActual = {
        solicitado: 0,
        aceptado: 1,
        preparando: 2,
        listo_retiro: 2,
        enviado: 2,
        entregado: 3,
    }[estado] ?? 0;

    const tercerPaso = estado === 'listo_retiro'
        ? 'Listo para retiro'
        : estado === 'preparando'
            ? 'En preparación'
            : 'En camino';

    const pasos = [
        { texto: 'Solicitado', fecha: pedido.fecha_pedido },
        { texto: 'Aceptado', fecha: pedido.fecha_aceptado },
        { texto: tercerPaso, fecha: pedido.fecha_enviado },
        { texto: 'Entregado', fecha: pedido.fecha_entregado },
    ];

    return `
        <ol class="perfil-pedido__pasos" aria-label="Seguimiento del pedido">
            ${pasos.map((paso, indice) => {
                const completado = indice < indiceActual || (estado === 'entregado' && indice === indiceActual);
                const actual = indice === indiceActual && !completado;
                const clase = completado ? 'is-hecho' : actual ? 'is-actual' : '';
                const icono = completado ? 'bi-check-circle-fill' : actual ? 'bi-record-circle' : 'bi-circle';

                return `<li class="perfil-pedido__paso ${clase}">
                    <i class="bi ${icono}" aria-hidden="true"></i>
                    <strong>${escapar(paso.texto)}</strong>
                    ${paso.fecha ? `<span>${formatearFechaHora(paso.fecha)}</span>` : ''}
                </li>`;
            }).join('')}
        </ol>`;
}

function pedidoHTML(pedido) {
    const estado = estadoPedido(pedido.estado_pedido);
    const pago = estadoPago(pedido.estado_pago);
    const numero = pedido.numero_pedido || `VTA-${String(pedido.id_pedido).padStart(5, '0')}`;

    const articulos = (pedido.items || []).map((item) => {
        const variantes = [item.color, item.talla ? `Talla ${item.talla}` : ''].filter(Boolean).join(' · ');

        return `
        <li class="perfil-compra__item">
            <span>${escapar(item.producto)}${variantes ? ` (${escapar(variantes)})` : ''} × ${Number(item.cantidad)}</span>
            <span>${moneda(item.subtotal)}</span>
        </li>`;
    }).join('');

    const entrega = pedido.fecha_entrega_estimada
        ? `<span>Entrega estimada: <strong>${formatearFechaHora(pedido.fecha_entrega_estimada)}</strong></span>`
        : '';

    const estaCancelado = ['cancelado', 'rechazado'].includes(pedido.estado_pedido);
    const estaEntregado = pedido.estado_pedido === 'entregado';
    const pagoPendienteDigital = pedido.estado_pago === 'pendiente'
        && ['billetera_movil', 'lafise'].includes(pedido.metodo_pago_web);

    const canceladoFecha = (estaCancelado && pedido.fecha_cancelado)
        ? `<span>Cancelado: <strong>${formatearFechaHora(pedido.fecha_cancelado)}</strong></span>`
        : '';

    const horaPreferida = pedido.hora_entrega_preferida
        ? `<span>Tu hora preferida: <strong>${formatearHora(pedido.hora_entrega_preferida)}</strong></span>`
        : '';

    const kmEntrega = Number(pedido.distancia_km);
    const distancia = Number.isFinite(kmEntrega) && kmEntrega > 0 ? ` · ${kmEntrega.toFixed(1)} km` : '';
    const tipoEntrega = pedido.metodo_entrega_web === 'encomienda'
        ? `<span>Entrega: <strong>Cargo Trans / Encomienda</strong>${distancia}</span>`
        : (distancia ? `<span>Entrega: <strong>Delivery</strong>${distancia}</span>` : '');

    const fechas = [entrega, tipoEntrega, canceladoFecha, horaPreferida].filter(Boolean).join('');

    const exito = estaEntregado
        ? `<div class="perfil-pedido__exito">
               <i class="bi bi-patch-check-fill" aria-hidden="true"></i>
               <div>
                   <strong>Entregado satisfactoriamente</strong>
                   <span>${pedido.fecha_entregado ? `Recibido el ${formatearFechaHora(pedido.fecha_entregado)}` : '¡Gracias por tu compra!'}</span>
               </div>
           </div>`
        : '';

    const motivo = (estaCancelado && pedido.nota_negocio)
        ? `<p class="perfil-pedido__motivo">Motivo de cancelación de pedido: <strong>${escapar(pedido.nota_negocio)}</strong></p>`
        : '';

    const nota = (!estaCancelado && pedido.nota_negocio)
        ? `<p class="perfil-pedido__nota">${escapar(pedido.nota_negocio)}</p>`
        : '';

    const comprobante = (pedido.estado_pago === 'pendiente' && pedido.metodo_pago_web !== 'efectivo')
        ? `<a class="perfil-pedido__wa" target="_blank" rel="noopener noreferrer"
              href="https://wa.me/${WHATSAPP_TIENDA}?text=${encodeURIComponent(`Hola, envío el comprobante del pedido ${numero}.`)}">
              <i class="bi bi-whatsapp"></i> Enviar comprobante
           </a>`
        : '';

    const cancelar = pedido.puede_cancelar
        ? `<button class="perfil-pedido__cancelar" type="button" data-cancelar-pedido="${pedido.id_pedido}">Cancelar pedido</button>`
        : '';

    return `
        <article class="perfil-compra perfil-pedido perfil-pedido--${escapar(pedido.estado_pedido)}${pagoPendienteDigital ? ' perfil-pedido--pago-pendiente' : ''}">
            <header class="perfil-compra__cabecera">
                <div>
                    <strong class="perfil-compra__factura">${escapar(numero)}</strong>
                    <span class="perfil-compra__fecha">${formatearFecha(pedido.fecha_pedido)}</span>
                </div>
                <div class="perfil-pedido__estados">
                    <span class="perfil-badge perfil-badge--${estado.clase}">
                        <i class="bi ${estado.icono}" aria-hidden="true"></i> ${escapar(estado.texto)}
                    </span>
                    <span class="perfil-badge perfil-badge--${pago.clase}">${escapar(pago.texto)}</span>
                </div>
            </header>

            ${exito}
            ${pasosPedidoHTML(pedido)}
            <ul class="perfil-compra__items">${articulos}</ul>
            ${motivo}
            ${nota}
            ${fechas ? `<div class="perfil-pedido__fechas">${fechas}</div>` : ''}

            <footer class="perfil-compra__pie">
                <span>${escapar(METODOS_PAGO_WEB[pedido.metodo_pago_web] || pedido.metodo_pago_web || '—')}</span>
                <div class="perfil-compra__totales">
                    <strong>Total: ${moneda(pedido.total_pedido)}</strong>
                </div>
            </footer>

            ${(comprobante || cancelar)
                ? `<div class="perfil-pedido__acciones">${comprobante}${cancelar}</div>`
                : ''}
        </article>`;
}

function conectarPedidos() {
    const lista = porId('listaPedidos');
    if (!lista) return;

    document.querySelectorAll('input[name="filtroPedidosWeb"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            if (!radio.checked) return;

            filtroPedidosWeb = radio.value;
            renderPedidos();
        });
    });

    lista.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('[data-cancelar-pedido]');
        if (!boton) return;

        const factura = boton.closest('.perfil-compra')?.querySelector('.perfil-compra__factura')?.textContent?.trim() || '';
        if (!(await confirmarCancelacionPedido(factura))) return;

        boton.disabled = true;
        boton.textContent = 'Cancelando…';

        try {
            const datos = await window.TiendaAPI.post(`/tienda/api/pedidos/${boton.dataset.cancelarPedido}/cancelar`);
            tiendaToast(datos?.mensaje || 'Pedido cancelado.', 'exito');
            await cargarPedidos();
        } catch (error) {
            boton.disabled = false;
            boton.textContent = 'Cancelar pedido';
            mostrarError(error);
        }
    });
}

/* Modal de confirmación para cancelar un pedido */
function confirmarCancelacionPedido(factura) {
    return new Promise((resolve) => {
        document.getElementById('modalCancelarPedido')?.remove();

        const modal = document.createElement('div');
        modal.id = 'modalCancelarPedido';
        modal.className = 'modal-perfil';
        modal.innerHTML = `
            <div class="modal-perfil__fondo" data-modal-cerrar></div>
            <div class="modal-perfil__caja" role="dialog" aria-modal="true" aria-labelledby="modalCancelarTitulo">
                <span class="modal-perfil__icono"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i></span>
                <h3 class="modal-perfil__titulo" id="modalCancelarTitulo">¿Cancelar este pedido?</h3>
                <p class="modal-perfil__texto">
                    ${factura ? `El pedido <strong>${escapar(factura)}</strong> quedará cancelado.` : 'El pedido quedará cancelado.'}
                    Esta acción no se puede revertir.
                </p>
                <div class="modal-perfil__acciones">
                    <button type="button" class="btn-secundario" data-modal-cerrar>Volver</button>
                    <button type="button" class="modal-perfil__peligro" data-modal-aceptar>Sí, cancelar</button>
                </div>
            </div>`;

        const cerrar = (resultado) => {
            modal.classList.remove('is-visible');
            document.removeEventListener('keydown', alPresionarTecla);
            setTimeout(() => modal.remove(), 180);
            resolve(resultado);
        };

        const alPresionarTecla = (evento) => {
            if (evento.key === 'Escape') cerrar(false);
        };

        modal.addEventListener('click', (evento) => {
            if (evento.target.closest('[data-modal-aceptar]')) return cerrar(true);
            if (evento.target.closest('[data-modal-cerrar]')) cerrar(false);
        });

        document.addEventListener('keydown', alPresionarTecla);
        document.body.appendChild(modal);
        document.body.classList.add('sin-scroll');

        modal.addEventListener('transitionend', () => document.body.classList.remove('sin-scroll'), { once: true });
        requestAnimationFrame(() => modal.classList.add('is-visible'));
        modal.querySelector('[data-modal-aceptar]').focus();
    });
}

/* ── Lista de deseos ─────────────────────────────────────────── */

async function solicitudesDeseos() {
    const datos = await window.TiendaAPI.get('/tienda/api/deseos');
    const deseos = datos.deseos || [];

    const solicitados = new Set(
        deseos
            .filter((deseo) => deseo.estado === 'pendiente')
            .map((deseo) => `${Number(deseo.id_variacion)}-${String(deseo.talla).trim()}`)
    );

    return { deseos, solicitados };
}

async function cargarDeseos() {
    const lista = porId('listaDeseos');
    const vacio = porId('deseosVacio');
    if (!lista || !vacio) return;

    try {
        const { deseos, solicitados } = await solicitudesDeseos();

        deseosSolicitados = solicitados;
        pintarDeseos(deseos);

        /* El catálogo solo se refresca si el usuario ya lo abrió. */
        if (catalogoDeseosCargado) renderDeseosCatalogo();
    } catch (error) {
        mostrarError(error);
    }
}

async function cargarCatalogoDeseos() {
    const catalogo = porId('deseoCatalogo');
    if (!catalogo || catalogoDeseosCargado || catalogoDeseosCargando) return;

    catalogoDeseosCargando = true;
    catalogo.innerHTML = '<p class="tallas__vacio">Cargando catálogo…</p>';

    try {
        const [opciones, solicitudes] = await Promise.all([
            window.TiendaAPI.get('/tienda/api/deseos/opciones'),
            solicitudesDeseos(),
            cargarEquivalenciasCmDeseo(),
        ]);

        deseosSolicitados = solicitudes.solicitados;
        pintarOpcionesDeseos(opciones.opciones || [], solicitudes.solicitados);
        catalogoDeseosCargado = true;
    } catch (error) {
        catalogo.innerHTML = '<p class="tallas__vacio">No se pudo cargar el catálogo.</p>';
        mostrarError(error);
    } finally {
        catalogoDeseosCargando = false;
    }
}

const TALLAS_DESEO = Array.from({ length: 9 }, (_, indice) => String(36 + indice));
let deseoSeleccionado = null;
let equivalenciasCmDeseo = null;

async function cargarEquivalenciasCmDeseo() {
    if (equivalenciasCmDeseo) return equivalenciasCmDeseo;

    try {
        const respuesta = await fetch('/tienda/recursos/data/tallas.json', {
            headers: { Accept: 'application/json' },
        });
        const datos = await respuesta.json();

        equivalenciasCmDeseo = new Map(
            (datos.tallas || []).map((talla) => [String(talla.eu), talla.cm])
        );
    } catch (error) {
        equivalenciasCmDeseo = new Map();
    }

    return equivalenciasCmDeseo;
}

function cmDeTallaDeseo(talla) {
    const cm = equivalenciasCmDeseo?.get(String(talla));

    return cm ? `${cm} cm` : '';
}

let deseosVariantes = [];
let deseosSolicitados = new Set();
let filtroColorDeseo = '';
let filtroDeseosListo = false;
let catalogoDeseosCargado = false;
let catalogoDeseosCargando = false;

function inicializarFiltroDeseos() {
    const select = porId('filtroColoresDeseos');
    if (!select || filtroDeseosListo) return;

    const colores = [...new Set(
        deseosVariantes
            .map((variante) => String(variante.color || 'Único').trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'es'));

    select.innerHTML = `<option value="">Todos los colores</option>${
        colores.map((color) => `<option value="${escapar(color)}">${escapar(color)}</option>`).join('')
    }`;

    const alCambiar = () => {
        filtroColorDeseo = select.value || '';
        renderDeseosCatalogo();
    };

    if (window.jQuery && window.jQuery.fn.select2) {
        window.jQuery(select).select2({
            placeholder: 'Todos los colores',
            width: '100%',
            allowClear: true,
            closeOnSelect: true,
        });

        window.jQuery(select).on('change', alCambiar);
    } else {
        select.addEventListener('change', alCambiar);
    }

    filtroDeseosListo = true;
}

function pintarOpcionesDeseos(variantes, solicitados = new Set()) {
    deseosVariantes = variantes || [];
    deseosSolicitados = solicitados;

    inicializarFiltroDeseos();
    renderDeseosCatalogo();
}

function renderDeseosCatalogo() {
    const catalogo = porId('deseoCatalogo');
    if (!catalogo) return;

    deseoSeleccionado = null;

    const seleccion = porId('deseoSeleccion');
    const solicitar = porId('btnSolicitarDeseo');
    if (seleccion) seleccion.hidden = true;
    if (solicitar) solicitar.disabled = true;

    const imagen = porId('deseoSeleccionImagen');
    if (imagen) imagen.src = '';
    if (porId('deseoSeleccionProducto')) porId('deseoSeleccionProducto').textContent = '—';
    if (porId('deseoSeleccionTalla')) porId('deseoSeleccionTalla').textContent = '—';
    if (porId('deseoSeleccionColor')) porId('deseoSeleccionColor').textContent = '—';

    const variantes = filtroColorDeseo
        ? deseosVariantes.filter((variante) => String(variante.color || 'Único').trim() === filtroColorDeseo)
        : deseosVariantes;

    if (!variantes.length) {
        catalogo.innerHTML = '<p class="tallas__vacio">No hay zapatos de ese color.</p>';
        return;
    }

    catalogo.innerHTML = variantes.map((variante) => {
        const porNumero = new Map(
            (variante.tallas || []).map((talla) => [String(talla.talla).trim(), talla])
        );

        const botones = TALLAS_DESEO.map((numero) => {
            const talla = porNumero.get(numero);
            const clave = `${Number(variante.id_variacion)}-${numero}`;

            if (talla && Number(talla.stock) > 0) {
                return `<span class="deseo-talla is-disponible" title="Disponible">${numero}</span>`;
            }

            if (deseosSolicitados.has(clave)) {
                return `<span class="deseo-talla is-solicitada" title="Ya solicitado">${numero}</span>`;
            }

            const clase = talla ? 'is-agotada' : 'is-sin-registro';
            const idTalla = talla ? `data-deseo-talla="${Number(talla.id_variacion_talla)}"` : '';

            return `<button type="button" class="deseo-talla ${clase}"
                        ${idTalla}
                        data-producto-id="${Number(variante.id_producto)}"
                        data-variacion="${Number(variante.id_variacion)}"
                        data-producto="${escapar(variante.nombre)}"
                        data-color="${escapar(variante.color || '')}"
                        data-imagen="${escapar(variante.imagen || '')}"
                        data-talla="${escapar(numero)}"
                        title="Solicitar talla ${escapar(numero)}">${numero}</button>`;
        }).join('');

        return `
            <article class="perfil-deseo-card">
                <img class="perfil-deseo-card__media" src="${escapar(variante.imagen || IMAGEN_FALLBACK)}"
                    alt="${escapar(variante.nombre)}" loading="lazy"
                    onerror="this.src='${IMAGEN_FALLBACK}'">
                <div class="perfil-deseo-card__info">
                    <strong class="perfil-deseo-card__nombre">${escapar(variante.nombre)}</strong>
                    <span class="perfil-deseo-card__color">${escapar(variante.color || 'Único')}</span>
                </div>
                <div class="perfil-deseo-tallas">${botones}</div>
            </article>`;
    }).join('');
}

function pintarDeseos(deseos) {
    const lista = porId('listaDeseos');
    const vacio = porId('deseosVacio');
    if (!lista || !vacio) return;

    if (!deseos.length) {
        lista.hidden = true;
        lista.innerHTML = '';
        vacio.hidden = false;
        return;
    }

    vacio.hidden = true;
    lista.hidden = false;
    lista.innerHTML = deseos.map((deseo) => `
        <article class="perfil-deseo-item">
            <img class="perfil-deseo-item__img" src="${escapar(deseo.imagen || IMAGEN_FALLBACK)}"
                alt="${escapar(deseo.producto)}" loading="lazy"
                onerror="this.src='${IMAGEN_FALLBACK}'">

            <div class="perfil-deseo-item__info">
                <strong class="perfil-deseo-item__nombre">${escapar(deseo.producto)}</strong>
                <span class="perfil-deseo-item__meta">
                    Talla ${escapar(deseo.talla)}${cmDeTallaDeseo(deseo.talla) ? ` · ${escapar(cmDeTallaDeseo(deseo.talla))}` : ''} · ${escapar(deseo.color || 'Único')}
                </span>
                ${deseo.nota ? `<span class="perfil-deseo-item__nota">${escapar(deseo.nota)}</span>` : ''}
            </div>

            <div class="perfil-deseo-item__lado">
                <span class="perfil-badge perfil-badge--${deseo.estado === 'atendido' ? 'ok' : 'celeste'}">
                    ${deseo.estado === 'atendido' ? 'Disponible' : 'Solicitado'}
                </span>
                <span class="perfil-deseo-item__fecha">${formatearFecha(deseo.fecha_solicitud)}</span>
                <button type="button" class="perfil-btn-icono perfil-btn-icono--peligro perfil-deseo-item__eliminar"
                    data-eliminar-deseo="${Number(deseo.id_deseo)}" title="Quitar de la lista">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </article>`).join('');
}

async function solicitarDeseo() {
    const nota = porId('deseoNota');
    const boton = porId('btnSolicitarDeseo');

    if (!deseoSeleccionado) {
        tiendaToast('Selecciona una talla agotada.', 'aviso');
        return;
    }

    const texto = boton.innerHTML;
    boton.disabled = true;
    boton.textContent = 'Enviando…';

    try {
        const datos = await window.TiendaAPI.post('/tienda/api/deseos', {
            id_producto: deseoSeleccionado.id_producto,
            id_variacion: deseoSeleccionado.id_variacion,
            id_variacion_talla: deseoSeleccionado.id_variacion_talla,
            talla: deseoSeleccionado.talla,
            nota: nota?.value.trim() || '',
        });

        tiendaToast(datos.mensaje || 'Solicitud enviada.', 'exito');
        if (nota) nota.value = '';
        await cargarDeseos();
    } catch (error) {
        mostrarError(error);
    } finally {
        boton.disabled = false;
        boton.innerHTML = texto;
    }
}

function conectarCatalogoDeseos() {
    const boton = porId('btnCatalogoDeseos');
    const panel = porId('deseoCatalogoDesplegable');
    if (!boton || !panel) return;

    const texto = porId('btnCatalogoDeseosTexto');

    boton.addEventListener('click', async () => {
        const abrir = !panel.classList.contains('is-abierto');

        panel.classList.toggle('is-abierto', abrir);
        panel.inert = !abrir;
        boton.classList.toggle('is-abierto', abrir);
        boton.setAttribute('aria-expanded', String(abrir));

        if (texto) {
            texto.textContent = abrir ? 'Ocultar catálogo de pares' : 'Ver catálogo de pares';
        }

        /* Se carga al abrir para no traer todo el catálogo si el usuario no lo pide. */
        if (abrir) await cargarCatalogoDeseos();
    });
}

function conectarDeseos() {
    conectarCatalogoDeseos();
    porId('btnSolicitarDeseo')?.addEventListener('click', solicitarDeseo);

    porId('deseoCatalogo')?.addEventListener('click', (evento) => {
        const boton = evento.target.closest('.deseo-talla.is-agotada, .deseo-talla.is-sin-registro');
        if (!boton) return;

        document.querySelectorAll('.deseo-talla.is-activa').forEach((elemento) => {
            elemento.classList.remove('is-activa');
        });

        boton.classList.add('is-activa');

        deseoSeleccionado = {
            id_producto: Number(boton.dataset.productoId),
            id_variacion: Number(boton.dataset.variacion),
            id_variacion_talla: boton.dataset.deseoTalla ? Number(boton.dataset.deseoTalla) : null,
            producto: boton.dataset.producto,
            color: boton.dataset.color,
            imagen: boton.dataset.imagen,
            talla: boton.dataset.talla,
        };

        const seleccion = porId('deseoSeleccion');
        const solicitar = porId('btnSolicitarDeseo');
        const imagen = porId('deseoSeleccionImagen');

        if (seleccion) seleccion.hidden = false;
        if (imagen) {
            imagen.src = deseoSeleccionado.imagen || IMAGEN_FALLBACK;
            imagen.alt = deseoSeleccionado.producto;
            imagen.onerror = () => { imagen.src = IMAGEN_FALLBACK; };
        }
        if (porId('deseoSeleccionProducto')) porId('deseoSeleccionProducto').textContent = deseoSeleccionado.producto;
        if (porId('deseoSeleccionTalla')) {
            const cm = cmDeTallaDeseo(deseoSeleccionado.talla);
            porId('deseoSeleccionTalla').textContent = `${deseoSeleccionado.talla}${cm ? ` · ${cm}` : ''}`;
        }
        if (porId('deseoSeleccionColor')) porId('deseoSeleccionColor').textContent = deseoSeleccionado.color || 'Único';
        if (solicitar) solicitar.disabled = false;
    });

    porId('listaDeseos')?.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('[data-eliminar-deseo]');
        if (!boton) return;

        boton.disabled = true;

        try {
            await window.TiendaAPI.delete(`/tienda/api/deseos/${boton.dataset.eliminarDeseo}`);
            tiendaToast('Solicitud eliminada.', 'exito');
            await cargarDeseos();
        } catch (error) {
            boton.disabled = false;
            mostrarError(error);
        }
    });
}

/* ── Historial de compras ────────────────────────────────────── */

async function cargarHistorial() {
    const lista = porId('listaHistorial');
    const vacio = porId('historialVacio');
    if (!lista || !vacio) return;

    try {
        const datos = await window.TiendaAPI.get('/tienda/api/historial');
        const compras = datos.compras || [];

        if (!compras.length) {
            lista.hidden = true;
            lista.innerHTML = '';
            vacio.hidden = false;
            return;
        }

        vacio.hidden = true;
        lista.hidden = false;
        lista.innerHTML = compras.map(compraHTML).join('');
    } catch (error) {
        mostrarError(error);
    }
}

function compraHTML(compra) {
    const articulos = (compra.items || []).map((item) => `
        <li class="perfil-compra__item">
            <span>${escapar(item.producto)} × ${Number(item.cantidad)}</span>
            <span>${moneda(item.subtotal)}</span>
        </li>`).join('');

    return `
        <article class="perfil-compra ${compra.estado_venta ? '' : 'perfil-compra--anulada'}">
            <header class="perfil-compra__cabecera">
                <div>
                    <strong class="perfil-compra__factura">${escapar(compra.numero_factura)}</strong>
                    <span class="perfil-compra__fecha">${formatearFecha(compra.fecha_venta)}</span>
                </div>
                <span class="perfil-badge ${compra.estado_venta ? '' : 'perfil-badge--peligro'}">
                    ${compra.estado_venta ? 'Activa' : 'Anulada'}
                </span>
            </header>

            <ul class="perfil-compra__items">${articulos}</ul>

            <footer class="perfil-compra__pie">
                <span>${escapar(compra.metodo_pago)}</span>
                <div class="perfil-compra__totales">
                    ${compra.descuento_venta > 0 ? `<span>Descuento: - ${moneda(compra.descuento_venta)}</span>` : ''}
                    <strong>Total: ${moneda(compra.total_venta)}</strong>
                </div>
            </footer>
        </article>`;
}

/* ── Descuento ───────────────────────────────────────────────── */

function direccionTieneUbicacion(direccion) {
    const latTexto = String(direccion?.latitud_direccion ?? '').trim();
    const lngTexto = String(direccion?.longitud_direccion ?? '').trim();

    if (!latTexto || !lngTexto) return false;

    const lat = Number(latTexto);
    const lng = Number(lngTexto);

    return Number.isFinite(lat)
        && Number.isFinite(lng)
        && !(lat === 0 && lng === 0);
}

function requisitosDescuento(cliente) {
    const tieneDireccion = direccionesCache.some(direccionTieneUbicacion);

    return [
        {
            texto: 'Teléfono registrado',
            cumple: Boolean(String(cliente?.telefono_cliente || '').trim()),
            enlace: '#perfil',
            accion: 'Completar',
        },
        {
            texto: 'Fecha de nacimiento',
            cumple: Boolean(String(cliente?.fecha_nacimiento_cliente || '').trim()),
            enlace: '#perfil',
            accion: 'Completar',
        },
        {
            texto: 'Dirección con ubicación',
            cumple: tieneDireccion,
            enlace: '#direcciones',
            accion: direccionesCache.length ? 'Completar' : 'Agregar',
        },
        {
            texto: 'Contraseña de la cuenta',
            cumple: Boolean(window.cuentaTienePassword?.()),
            enlace: '#configuracion',
            accion: 'Crear',
        },
    ];
}

/* «Válido hasta el 5 de diciembre de 2026 · quedan 29 días». */
function vigenciaDescuento(expira) {
    if (!expira) return '';

    const fecha = new Date(expira);
    if (Number.isNaN(fecha.getTime())) return '';

    const hasta = fecha.toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' });
    const dias = Math.ceil((fecha.getTime() - Date.now()) / 86400000);

    if (dias <= 0) return `Venció el ${hasta}.`;
    if (dias === 1) return `Válido hasta el ${hasta} · queda 1 día.`;

    return `Válido hasta el ${hasta} · quedan ${dias} días.`;
}

function mostrarDescuento(cliente) {
    const contenedor = porId('contenidoDescuento');
    if (!contenedor) return;

    ajustarTemasAyuda(cliente);

    /* Con el 10% activo, Chiky se queda arriba del perfil (una vez por carga). */
    if (!avisoDescuentoMostrado && cliente?.descuento?.primera_compra) {
        avisoDescuentoMostrado = true;
        window.Chiky?.mostrar();
    }

    const descuento = cliente?.descuento || null;

    if (descuento) {
        const vigencia = vigenciaDescuento(descuento.expira);

        contenedor.classList.remove('perfil-vacio');
        contenedor.innerHTML = `
            <div class="perfil-descuento">
                <i class="bi bi-ticket-perforated"></i>
                <div>
                    <span class="perfil-descuento__titulo">${escapar(descuento.titulo || 'Descuento')}</span>
                    <span class="perfil-descuento__valor">${escapar(descuento.etiqueta)}</span>
                    <p class="perfil-descuento__texto">
                        ${escapar(descuento.motivo || (descuento.primera_compra
                            ? 'Descuento de bienvenida activo: 10% en zapatos.'
                            : 'Se aplica al subtotal de tu carrito.'))}
                    </p>
                    ${vigencia ? `<p class="perfil-descuento__vigencia">${escapar(vigencia)}</p>` : ''}
                </div>
            </div>`;
        return;
    }

    if (cliente?.descuento_primera_compra_usado) {
        contenedor.classList.remove('perfil-vacio');
        contenedor.innerHTML = `
            <div class="perfil-descuento perfil-descuento--pendiente">
                <div class="perfil-descuento__cabecera">
                    <span class="perfil-descuento__sello">10%</span>
                    <div>
                        <p class="perfil-descuento__titulo">Descuento de bienvenida</p>
                        <p class="perfil-descuento__texto">Ya usaste tu descuento de bienvenida en una compra.</p>
                    </div>
                </div>
            </div>`;
        return;
    }

    const requisitos = requisitosDescuento(cliente);
    const listo = requisitos.every((requisito) => requisito.cumple);

    contenedor.classList.remove('perfil-vacio');
    contenedor.innerHTML = `
        <div class="perfil-descuento perfil-descuento--pendiente">
            <div class="perfil-descuento__cabecera">
                <span class="perfil-descuento__sello">10%</span>
                <div>
                    <p class="perfil-descuento__titulo">Descuento de bienvenida</p>
                    <p class="perfil-descuento__texto">10% en tu primera compra. Completa estos datos para aplicarlo en zapatos; al activarlo tienes 30 días para usarlo.</p>
                </div>
            </div>

            <ul class="perfil-descuento__requisitos">
                ${requisitos.map((requisito) => `
                    <li class="perfil-descuento__requisito ${requisito.cumple ? 'is-listo' : ''}">
                        <i class="bi ${requisito.cumple ? 'bi-check-circle-fill' : 'bi-circle'}" aria-hidden="true"></i>
                        <span>${requisito.texto}</span>
                        ${requisito.cumple ? '' : `<a href="${requisito.enlace}">${requisito.accion}</a>`}
                    </li>`).join('')}
            </ul>

            <button type="button" class="btn-primario w-100" id="btnAplicarDescuento" ${listo ? '' : 'disabled'}>
                Aplicar descuento
            </button>
        </div>`;
}

function refrescarDescuento() {
    if (window.clienteTienda) mostrarDescuento(window.clienteTienda);
}

function conectarDescuento() {
    porId('contenidoDescuento')?.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('#btnAplicarDescuento');
        if (!boton || boton.disabled) return;

        bloquearBoton(boton, true);

        try {
            const datos = await window.TiendaAPI.post('/tienda/api/descuento/primera-compra');

            window.clienteTienda = datos.cliente || window.clienteTienda;
            mostrarDescuento(window.clienteTienda);
            tiendaToast(datos.mensaje || 'Descuento aplicado.');
            window.Chiky?.modoDiscreto();
        } catch (error) {
            mostrarError(error);
        } finally {
            bloquearBoton(boton, false);
        }
    });
}

/* ── Cupones ─────────────────────────────────────────────────── */

async function cargarCuponesPerfil() {
    const lista = porId('listaCupones');
    if (!lista) return;

    if (!window.clienteTienda) {
        lista.innerHTML = '<p class="perfil-vacio">Inicia sesión para ver tus cupones.</p>';
        return;
    }

    try {
        const datos = await window.TiendaAPI.get('/tienda/api/cupones');
        pintarCuponesPerfil(datos?.cupones || []);
    } catch {
        lista.innerHTML = '<p class="perfil-vacio">No se pudieron cargar tus cupones.</p>';
    }
}

function pintarCuponesPerfil(cupones) {
    const lista = porId('listaCupones');
    if (!lista) return;

    if (!cupones.length) {
        lista.innerHTML = '<p class="perfil-vacio">No tienes cupones disponibles. Canjea uno con su código.</p>';
        return;
    }

    lista.innerHTML = cupones.map((cupon) => `
        <div class="perfil-cupon">
            <div class="perfil-cupon__datos">
                <strong>${escapar(cupon.nombre || 'Cupón')}</strong>
                <span class="perfil-cupon__codigo">${escapar(cupon.codigo)}</span>
                <span class="perfil-cupon__meta">
                    ${cupon.categoria ? `Solo ${escapar(cupon.categoria)} · ` : ''}Vence ${formatearFecha(cupon.fecha_fin)}
                </span>
            </div>

            <span class="perfil-cupon__valor">${escapar(cupon.etiqueta || '')}</span>

            <button type="button" class="perfil-btn-icono" data-copiar-cupon="${escapar(cupon.codigo)}"
                    aria-label="Copiar código ${escapar(cupon.codigo)}">
                <i class="bi bi-clipboard"></i>
            </button>
        </div>`).join('');

    lista.querySelectorAll('[data-copiar-cupon]').forEach((boton) => {
        boton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(boton.dataset.copiarCupon);
                window.tiendaToast?.('Código copiado.', 'exito');
            } catch {
                window.tiendaToast?.('No se pudo copiar el código.', 'aviso');
            }
        });
    });
}

/* ── Cupón de fidelidad ──────────────────────────────────────── */

async function cargarFidelidadPerfil() {
    const pendientes = porId('fidelidadPendientes');
    if (!pendientes) return;

    if (!window.clienteTienda) {
        pendientes.innerHTML = '<p class="perfil-vacio">Inicia sesión para ver tu progreso de fidelidad.</p>';
        return;
    }

    try {
        const datos = await window.TiendaAPI.get('/tienda/api/fidelidad');
        pintarFidelidadPerfil(datos || {});
    } catch {
        pendientes.innerHTML = '<p class="perfil-vacio">No se pudo cargar tu progreso de fidelidad.</p>';
    }
}

function pintarFidelidadPerfil(datos) {
    const pares = Number(datos?.pares_ciclo || 0);
    const aporte = Number(datos?.aporte_ciclo || 0);
    const pendientes = datos?.pendientes || [];
    const faltan = 10 - pares;

    const paresTexto = porId('fidelidadPares');
    const texto = porId('fidelidadTexto');
    const monto = porId('fidelidadMonto');
    const relleno = porId('fidelidadRelleno');
    const barra = porId('fidelidadBarra');
    const lista = porId('fidelidadPendientes');

    if (paresTexto) paresTexto.textContent = `${pares} de 10 pares`;
    if (monto) monto.textContent = moneda(aporte);
    if (relleno) relleno.style.width = `${Math.min(100, pares * 10)}%`;
    if (barra) barra.setAttribute('aria-valuenow', String(pares));

    if (texto) {
        texto.textContent = pares === 0
            ? 'Cada 10 pares ganas un cupón por el 10% acumulado.'
            : `Te faltan ${faltan} ${faltan === 1 ? 'par' : 'pares'} para tu próximo cupón.`;
    }

    if (!lista) return;

    if (!pendientes.length) {
        lista.innerHTML = '<p class="perfil-vacio">Aún no tienes cupones de fidelidad por reclamar.</p>';
        return;
    }

    lista.innerHTML = pendientes.map((item) => `
        <div class="perfil-fidelidad__cupon">
            <div class="perfil-fidelidad__cupon-datos">
                <strong>Cupón de fidelidad</strong>
                <small>Ciclo ${Number(item.ciclo)} · 10 pares completados</small>
            </div>

            <span class="perfil-fidelidad__valor">${moneda(item.valor)}</span>

            <button type="button" class="btn-primario" data-reclamar-fidelidad="${Number(item.ciclo)}">
                Reclamar
            </button>
        </div>`).join('');

    lista.querySelectorAll('[data-reclamar-fidelidad]').forEach((boton) => {
        boton.addEventListener('click', async () => {
            boton.disabled = true;

            try {
                const datosCupon = await window.TiendaAPI.post('/tienda/api/fidelidad/reclamar', {
                    ciclo: Number(boton.dataset.reclamarFidelidad),
                });

                window.tiendaToast?.(datosCupon?.mensaje || '¡Reclamaste tu cupón!', 'exito');

                await cargarFidelidadPerfil();
                await cargarCuponesPerfil();
            } catch (error) {
                boton.disabled = false;
                mostrarError(error);
            }
        });
    });
}

function conectarCupones() {
    cargarCuponesPerfil();
    cargarFidelidadPerfil();

    document.addEventListener('tienda:sesion', () => {
        cargarCuponesPerfil();
        cargarFidelidadPerfil();
    });

    porId('formCuponPerfil')?.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const campo = porId('cuponPerfilCodigo');
        const codigo = String(campo?.value || '').trim();

        if (!codigo) {
            tiendaToast('Escribe el código del cupón.', 'aviso');
            return;
        }

        try {
            const datos = await window.TiendaAPI.post('/tienda/api/cupones/canjear', { codigo });
            tiendaToast(datos?.mensaje || 'Cupón agregado a tu cuenta.', 'exito');

            if (campo) campo.value = '';

            await cargarCuponesPerfil();
        } catch (error) {
            mostrarError(error);
        }
    });
}

/* ── Sesión ──────────────────────────────────────────────────── */

function conectarSesion() {
    porId('btnCerrarSesion')?.addEventListener('click', async () => {
        try {
            await window.TiendaAPI.post('/tienda/api/auth/logout');
            window.location.href = urlTienda();
        } catch (error) {
            mostrarError(error);
        }
    });
}
