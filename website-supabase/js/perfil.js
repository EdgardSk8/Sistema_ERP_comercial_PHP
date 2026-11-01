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
            destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                inicial.scrollIntoView({ block: 'start' });
                activar(inicial);
            }, 60);
        }
    }

    actualizar();
    iniciarCuenta();
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

function urlSegura(valor) {
    const url = String(valor || '').trim();
    return /^https?:\/\//i.test(url) ? url : '';
}

function mostrarError(error) {
    if (error?.status === 401) {
        window.location.href = urlTienda('login');
        return;
    }

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
    conectarDirecciones();
    conectarFavoritos();
    conectarSesion();
    cargarCuenta();
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
        cargarHistorial(),
    ]);

    mostrarDescuento(cliente);
    pintarMarcoPerfil();
}

function alternarCuenta(autenticado) {
    const visibilidad = {
        perfilInvitado: !autenticado,
        perfilLogueado: autenticado,
        direccionesInvitado: !autenticado,
        direccionesContenido: autenticado,
        favoritosInvitado: !autenticado,
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
    const historialVacio = porId('historialVacio');
    const listaHistorial = porId('listaHistorial');

    if (favoritosVacio) favoritosVacio.hidden = true;
    if (listaFavoritos) listaFavoritos.hidden = true;
    if (historialVacio) historialVacio.hidden = true;
    if (listaHistorial) listaHistorial.hidden = true;
}

/* Google no comparte teléfono ni fecha de nacimiento: se piden en Perfil. */
function avisarDatosFaltantes(cliente) {
    const faltan = !String(cliente?.telefono_cliente || '').trim()
        || !String(cliente?.fecha_nacimiento_cliente || '').trim();

    if (!faltan) return;

    let avisar = true;

    try {
        avisar = sessionStorage.getItem('tienda_aviso_datos') !== '0';
        sessionStorage.setItem('tienda_aviso_datos', '0');
    } catch {
        avisar = true;
    }

    if (avisar && typeof window.tiendaToast === 'function') {
        window.tiendaToast('Completa tu teléfono y fecha de nacimiento para tu descuento de primera compra.', 'aviso');
    }
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
   Los archivos van en imagenes/avatares/fondos/ con nombres
   fondo-1.jpg, fondo-2.jpg, ... (hasta fondo-8). */

const AVATAR_FONDOS_SLOTS = 8;
const AVATAR_FONDOS_EXTENSIONES = ['jpg', 'png', 'webp'];

function existeImagenAvatar(url) {
    return new Promise((resolve) => {
        const imagen = new Image();
        imagen.onload = () => resolve(true);
        imagen.onerror = () => resolve(false);
        imagen.src = url;
    });
}

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

    const detectados = [];

    for (let numero = 1; numero <= AVATAR_FONDOS_SLOTS; numero += 1) {
        for (const extension of AVATAR_FONDOS_EXTENSIONES) {
            const archivo = `fondo-${numero}.${extension}`;
            const url = `/tienda/recursos/imagenes/avatares/fondos/${archivo}`;

            if (await existeImagenAvatar(url)) {
                detectados.push(archivo);
                break;
            }
        }
    }

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

    grupo.querySelectorAll('.perfil-marco__opcion').forEach((boton) => {
        const activo = boton.dataset.marco === clave;

        boton.classList.toggle('is-activo', activo);
        boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
    });
}

function pintarMarcoPerfil() {
    const nivel = porId('marcoNivel');
    const progreso = porId('marcoProgreso');
    const casilla = porId('marcoVisible');
    const relleno = porId('marcoRelleno');
    const barra = porId('marcoBarra');
    const desde = porId('marcoDesde');
    const hasta = porId('marcoHasta');
    const opciones = porId('marcoOpciones');

    if (!nivel || !progreso || !casilla) return;

    const aplicar = (datos) => {
        const ventas = Number(datos?.ventas || 0);
        const marco = datos?.marco || null;
        const siguiente = datos?.siguiente || null;
        const niveles = datos?.niveles || [];
        const seleccionado = datos?.marco_estilo || (marco ? marco.clave : '');

        if (datos?.forzado && marco) {
            nivel.textContent = `Nivel ${marco.nombre}`;
            progreso.textContent = '';
            progreso.hidden = true;
        } else {
            progreso.hidden = false;

            nivel.textContent = marco
                ? `Nivel ${marco.nombre} · ${ventas} ${ventas === 1 ? 'venta' : 'ventas'}`
                : 'Aún sin marco';

            if (siguiente) {
                progreso.textContent = marco
                    ? `Te faltan ${datos.faltan} ${datos.faltan === 1 ? 'venta' : 'ventas'} para ${siguiente.nombre}.`
                    : `Necesitas ${datos.faltan} ventas para ${siguiente.nombre}.`;
            } else if (marco) {
                progreso.textContent = '¡Tienes el marco máximo!';
            } else {
                progreso.textContent = 'Necesitas 5 ventas para tu primer marco.';
            }
        }

        const avance = Math.max(0, Math.min(100, Number(datos?.avance || 0)));

        if (relleno) relleno.style.width = `${avance}%`;
        if (barra) barra.setAttribute('aria-valuenow', String(avance));
        if (desde) desde.textContent = `${Number(datos?.desde || 0)} ventas`;
        if (hasta) hasta.textContent = siguiente ? `${datos.hasta} ventas` : 'Máximo';

        if (opciones) {
            opciones.innerHTML = niveles.map((item) => {
                const activo = item.clave === seleccionado;
                const bloqueado = !item.desbloqueado;

                return `<button type="button" class="perfil-marco__opcion ${activo ? 'is-activo' : ''} ${bloqueado ? 'is-bloqueado' : ''}"
                            data-marco="${item.clave}" ${bloqueado ? 'disabled' : ''} aria-pressed="${activo}"
                            title="${item.nombre} · ${item.ventas} ventas">
                            <span class="perfil-marco__muestra marco--${item.clave}" aria-hidden="true"></span>
                            <span class="perfil-marco__nombre">${item.nombre}</span>
                            ${bloqueado ? '<i class="bi bi-lock-fill" aria-hidden="true"></i>' : ''}
                        </button>`;
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
            const datos = await window.TiendaAPI.put('/tienda/api/perfil/marco', { mostrar });

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
        const boton = evento.target.closest('.perfil-marco__opcion');
        if (!boton || boton.disabled || boton.classList.contains('is-activo')) return;

        const estilo = boton.dataset.marco;
        const anterior = window.marcoTienda?.marco_estilo || '';

        marcarMarcoOpcion(estilo);

        try {
            const datos = await window.TiendaAPI.put('/tienda/api/perfil/marco', { estilo });

            window.clienteTienda = datos.cliente || window.clienteTienda;

            if (window.marcoTienda) {
                const nivel = (window.marcoTienda.niveles || []).find((item) => item.clave === estilo) || null;

                window.marcoTienda.marco = nivel;
                window.marcoTienda.marco_estilo = estilo;
            }

            const casilla = porId('marcoVisible');
            if (casilla) casilla.checked = true;

            window.pintarAvatares?.(window.clienteTienda);
        } catch (error) {
            marcarMarcoOpcion(anterior);
            window.tiendaToast?.(error?.message || 'No se pudo cambiar el marco.', 'aviso');
        }
    });
}

function conectarFormularios() {
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
            });

            window.clienteTienda = datos.cliente;

            document.querySelectorAll('.perfil__nombre').forEach((elemento) => {
                elemento.textContent = datos.cliente.nombre_cliente;
            });            document.querySelectorAll('.perfil__detalle').forEach((elemento) => {
                elemento.textContent = `@${datos.cliente.usuario_cliente}`;
            });

            actualizarInicialesFondo(datos.cliente.nombre_cliente);
            tiendaToast('Perfil actualizado correctamente.');
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

        const boton = evento.currentTarget.querySelector('button[type="submit"]');
        const texto = boton?.textContent;
        bloquearBoton(boton, true);

        try {
            const datos = await window.TiendaAPI.put('/tienda/api/perfil/password', {
                password_actual: porId('passwordActual')?.value || '',
                password_nueva: porId('passwordNueva').value,
                password_nueva_confirmation: porId('passwordNuevaConfirm').value,
            });

            evento.currentTarget.reset();
            tiendaToast(datos?.mensaje || 'Contraseña actualizada correctamente.');
            ajustarFormPassword();
            refrescarDescuento();
        } catch (error) {
            mostrarError(error);
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

    if (columna) columna.hidden = !tiene;
    if (aviso) aviso.hidden = tiene;

    if (titulo) titulo.textContent = tiene ? 'Cambiar contraseña' : 'Crear contraseña';

    if (ayuda) {
        ayuda.textContent = tiene
            ? 'Usa una contraseña de al menos 6 caracteres.'
            : 'Tu cuenta entra con Google. Crea una contraseña para poder entrar también con tu correo.';
    }

    if (!tiene) {
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

function conectarDirecciones() {
    porId('btnNuevaDireccion')?.addEventListener('click', () => abrirFormDireccion());
    porId('btnCancelarDireccion')?.addEventListener('click', cerrarFormDireccion);
    porId('formDireccion')?.addEventListener('submit', guardarDireccion);
    porId('listaDirecciones')?.addEventListener('click', manejarAccionDireccion);
    porId('btnUbicacion')?.addEventListener('click', usarUbicacionActual);

    document.querySelectorAll('.dir-chip').forEach((chip) => {
        chip.addEventListener('click', () => seleccionarNombreRapido(chip));
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
            ${maps ? `<a class="perfil-item-card__enlace" href="${escapar(maps)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-geo"></i> Ver en Google Maps</a>` : ''}
        </article>`;
}

function abrirFormDireccion(direccion = null) {
    const formulario = porId('formDireccion');
    if (!formulario) return;

    formulario.reset();
    porId('direccionId').value = direccion?.id_direccion_cliente || '';
    porId('direccionNombre').value = direccion?.nombre_direccion || '';
    porId('direccionMaps').value = direccion?.ubicacion_maps || '';
    porId('direccionReferencia').value = direccion?.referencia_direccion || '';
    porId('direccionManual').value = direccion?.direccion_manual || '';
    porId('direccionPredeterminada').checked = Boolean(direccion?.predeterminada_direccion);

    const lat = direccion?.latitud_direccion != null ? Number(direccion.latitud_direccion) : null;
    const lng = direccion?.longitud_direccion != null ? Number(direccion.longitud_direccion) : null;

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
        aplicarUbicacion(lat, lng, { conservarEnlace: true });
    } else {
        limpiarUbicacion();
    }

    marcarChipNombre(direccion?.nombre_direccion || '');
    mostrarEstadoUbicacion('');

    formulario.hidden = false;
    formulario.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cerrarFormDireccion() {
    const formulario = porId('formDireccion');
    if (!formulario) return;

    formulario.reset();
    porId('direccionId').value = '';
    limpiarUbicacion();
    marcarChipNombre('');
    mostrarEstadoUbicacion('');
    formulario.hidden = true;
}

async function guardarDireccion(evento) {
    evento.preventDefault();

    const id = porId('direccionId').value;
    const datos = {
        nombre_direccion: porId('direccionNombre').value.trim(),
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
            await window.TiendaAPI.put(`/tienda/api/direcciones/${id}`, datos);
            tiendaToast('Dirección actualizada correctamente.');
        } else {
            await window.TiendaAPI.post('/tienda/api/direcciones', datos);
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

function seleccionarNombreRapido(chip) {
    const nombre = chip.dataset.nombre || '';

    porId('direccionNombre').value = nombre;
    marcarChipNombre(nombre);
}

function marcarChipNombre(nombre) {
    document.querySelectorAll('.dir-chip').forEach((chip) => {
        chip.classList.toggle('is-activo', chip.dataset.nombre === nombre);
    });
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
                ${compra.descuento_venta > 0 ? `<span>Descuento: - ${moneda(compra.descuento_venta)}</span>` : ''}
                <strong>Total: ${moneda(compra.total_venta)}</strong>
            </footer>
        </article>`;
}

/* ── Descuento ───────────────────────────────────────────────── */

function requisitosDescuento(cliente) {
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
            texto: 'Una dirección guardada',
            cumple: direccionesCache.length > 0,
            enlace: '#direcciones',
            accion: 'Agregar',
        },
        {
            texto: 'Contraseña de la cuenta',
            cumple: Boolean(window.cuentaTienePassword?.()),
            enlace: '#configuracion',
            accion: 'Crear',
        },
    ];
}

function mostrarDescuento(cliente) {
    const contenedor = porId('contenidoDescuento');
    if (!contenedor) return;

    const descuento = cliente?.descuento || null;

    if (descuento) {
        contenedor.classList.remove('perfil-vacio');
        contenedor.innerHTML = `
            <div class="perfil-descuento">
                <i class="bi bi-ticket-perforated"></i>
                <div>
                    <span class="perfil-descuento__valor">${escapar(descuento.etiqueta)}</span>
                    <p class="perfil-descuento__texto">
                        ${descuento.primera_compra
                            ? 'Descuento de primera compra activo: se aplica a cualquier producto.'
                            : 'Se aplica al subtotal de tu carrito.'}
                    </p>
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
                    <p class="perfil-descuento__titulo">Aplicar descuento de primera compra</p>
                    <p class="perfil-descuento__texto">Completa estos datos para aplicarlo a cualquier producto.</p>
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
        } catch (error) {
            mostrarError(error);
        } finally {
            bloquearBoton(boton, false);
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
