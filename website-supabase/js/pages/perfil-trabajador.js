/* ╔══════════════════════════════════════════════════════════════╗
   ║  Trabaja con nosotros · solicitud y estado del trabajador      ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    const card = document.getElementById('cardTrabajador');

    if (!card) return;

    const contenido = document.getElementById('trabajadorContenido');
    const formulario = document.getElementById('formTrabajador');
    const botonEnviar = document.getElementById('btnEnviarTrabajador');
    const botonCancelar = document.getElementById('btnCancelarTrabajador');

    let trabajadorActual = null;
    let clienteActual = null;
    let enviando = false;

    const escapar = window.TiendaUtil.escapar;

    const texto = window.TiendaUtil.texto;

    const fecha = (valor) => {
        if (!valor) return '—';

        const limpia = String(valor).slice(0, 10);
        const [anio, mes, dia] = limpia.split('-');

        return dia && mes && anio ? `${dia}/${mes}/${anio}` : String(valor);
    };

    const ESTADOS = {
        pendiente: { texto: 'Solicitud en revisión', clase: 'pendiente', icono: 'bi-hourglass-split' },
        aprobado: { texto: 'Trabajador aprobado', clase: 'aprobado', icono: 'bi-patch-check-fill' },
        rechazado: { texto: 'Solicitud rechazada', clase: 'rechazado', icono: 'bi-x-circle' },
        suspendido: { texto: 'Cuenta suspendida', clase: 'suspendido', icono: 'bi-slash-circle' },
    };

    function estadoDe(trabajador) {
        return ESTADOS[trabajador?.estado_trabajador] || ESTADOS.pendiente;
    }

    function foto(url, clase, alt) {
        if (!url) return '';

        return `<a class="perfil-trabajador__foto" href="${escapar(url)}" target="_blank" rel="noopener" title="${escapar(alt)}">
            <img class="${clase}" src="${escapar(url)}" alt="${escapar(alt)}" loading="lazy">
        </a>`;
    }

    function pintarCargando() {
        contenido.innerHTML = '<p class="perfil-vacio"><i class="bi bi-hourglass-split"></i> Cargando tu solicitud…</p>';
    }

    function pintarIntroduccion() {
        contenido.innerHTML = `
            <div class="perfil-trabajador__vacio">
                <div>
                    <strong>¿Quieres trabajar con nosotros?</strong>
                    <p>Envía tus datos y los de tu vehículo. Revisaremos tu solicitud y te asignaremos tu porcentaje.</p>
                </div>
                <button type="button" class="btn-primario" data-accion="solicitar">
                    <i class="bi bi-send" aria-hidden="true"></i> Quiero unirme
                </button>
            </div>`;
    }

    function pintarEstado(trabajador) {
        const estado = estadoDe(trabajador);
        const comision = Number(trabajador.porcentaje_comision) || 0;
        const ganancia = Math.max(0, 100 - comision);

        const resumen = `
            <div class="perfil-trabajador__resumen">
                <div class="perfil-trabajador__dato">
                    <span>Vehículo</span>
                    <strong>${escapar([trabajador.vehiculo_marca, trabajador.vehiculo_modelo].filter(Boolean).join(' ') || '—')}</strong>
                </div>
                <div class="perfil-trabajador__dato">
                    <span>Placa</span>
                    <strong>${escapar(trabajador.vehiculo_placa || '—')}</strong>
                </div>
                <div class="perfil-trabajador__dato">
                    <span>Color del vehículo</span>
                    <strong>${escapar(trabajador.vehiculo_color || '—')}</strong>
                </div>
                <div class="perfil-trabajador__dato">
                    <span>Tu color</span>
                    <strong class="perfil-trabajador__color-dato">
                        <i style="background:${escapar(trabajador.color_usuario || '#22c55e')}"></i>
                        ${escapar(trabajador.color_usuario || '#22c55e')}
                    </strong>
                </div>
            </div>`;

        const modoTrabajador = trabajador.estado_trabajador === 'aprobado'
            ? `<div class="perfil-trabajador__modo">
                    <div class="perfil-trabajador__modo-info">
                        <span class="perfil-trabajador__modo-etiqueta"><i class="bi bi-truck" aria-hidden="true"></i> Modo trabajador</span>
                        <strong>Recibe pedidos y revisa los datos de tus clientes</strong>
                    </div>
                    <label class="perfil-trabajador__modo-switch">
                        <input type="checkbox" id="checkModoTrabajador" role="switch" aria-label="Cambiar a modo trabajador">
                        <span class="perfil-trabajador__modo-slider" aria-hidden="true"></span>
                        <span class="perfil-trabajador__modo-texto">Cambiar</span>
                    </label>
                </div>`
            : '';

        const comisionHtml = trabajador.estado_trabajador === 'aprobado'
            ? `<div class="perfil-trabajador__comision">
                    <div>
                        <span>Comisión de la tienda</span>
                        <strong>${comision.toFixed(2)}%</strong>
                    </div>
                    <div>
                        <span>Tu ganancia por envío</span>
                        <strong>${ganancia.toFixed(2)}%</strong>
                    </div>
                    <p>Del costo de envío, la tienda retiene el porcentaje indicado y el resto es para ti.</p>
                </div>`
            : `<div class="perfil-trabajador__comision perfil-trabajador__comision--pendiente">
                    <p>El porcentaje de comisión se asigna de forma individual cuando la tienda aprueba tu solicitud.</p>
                </div>`;

        if (trabajador.estado_trabajador === 'aprobado') {
            document.getElementById('menuModoTrabajador')?.removeAttribute('hidden');
        }

        const fotos = `
            <div class="perfil-trabajador__fotos">
                ${foto(trabajador.foto_perfil, 'perfil-trabajador__foto-img', 'Foto del trabajador')}
                ${foto(trabajador.foto_vehiculo, 'perfil-trabajador__foto-img', 'Foto del vehículo')}
                ${foto(trabajador.foto_licencia, 'perfil-trabajador__foto-img', 'Foto de la licencia')}
                ${foto(trabajador.foto_circulacion, 'perfil-trabajador__foto-img', 'Foto de la circulación')}
                ${foto(trabajador.foto_seguro, 'perfil-trabajador__foto-img', 'Foto del seguro')}
            </div>`;

        const documentos = `
            <div class="perfil-trabajador__documentos">
                <p><span>Licencia</span> ${escapar(trabajador.licencia_numero || '—')} · vence ${fecha(trabajador.licencia_vencimiento)}</p>
                <p><span>Circulación</span> ${escapar(trabajador.circulacion_numero || '—')} · vence ${fecha(trabajador.circulacion_vencimiento)}</p>
                <p><span>Seguro</span> ${escapar(trabajador.seguro_aseguradora || 'Sin seguro registrado')}${trabajador.seguro_numero ? ` · ${escapar(trabajador.seguro_numero)}` : ''}${trabajador.seguro_vencimiento ? ` · vence ${fecha(trabajador.seguro_vencimiento)}` : ''}</p>
            </div>`;

        const acciones = [];

        if (trabajador.estado_trabajador === 'pendiente') {
            acciones.push('<button type="button" class="btn-secundario" data-accion="editar"><i class="bi bi-pencil"></i> Editar solicitud</button>');
        }

        if (trabajador.estado_trabajador === 'rechazado') {
            acciones.push('<button type="button" class="btn-primario" data-accion="editar"><i class="bi bi-arrow-counterclockwise"></i> Volver a enviar</button>');
        }

        if (trabajador.estado_trabajador === 'aprobado') {
            acciones.push('<a href="/tienda/trabajador" class="btn-primario"><i class="bi bi-truck"></i> Ir a mis pedidos</a>');
            acciones.push('<button type="button" class="btn-secundario" data-accion="editar"><i class="bi bi-pencil"></i> Actualizar mis datos</button>');
            acciones.push(`
                <label class="perfil-trabajador__disponible">
                    <input type="checkbox" id="trabDisponible" ${trabajador.disponible ? 'checked' : ''}>
                    <span>Disponible para trabajar</span>
                </label>`);
        }

        const avisoRechazo = trabajador.estado_trabajador === 'rechazado' && trabajador.motivo_rechazo
            ? `<p class="perfil-trabajador__motivo"><i class="bi bi-exclamation-triangle"></i> ${escapar(trabajador.motivo_rechazo)}</p>`
            : '';

        contenido.innerHTML = `
            <div class="perfil-trabajador__cabecera">
                <span class="perfil-trabajador__badge perfil-trabajador__badge--${estado.clase}">
                    <i class="bi ${estado.icono}" aria-hidden="true"></i> ${estado.texto}
                </span>
                <span class="perfil-trabajador__desde">Solicitud del ${fecha(trabajador.fecha_solicitud)}</span>
            </div>
            ${avisoRechazo}
            ${modoTrabajador}
            ${comisionHtml}
            ${resumen}
            ${documentos}
            ${fotos}
            ${acciones.length ? `<div class="perfil-trabajador__acciones">${acciones.join('')}</div>` : ''}`;
    }

    function prefillFormulario(trabajador) {
        const datos = trabajador || {};
        const cliente = clienteActual || {};

        const asignar = (id, valor) => {
            const campo = document.getElementById(id);
            if (campo && valor !== null && valor !== undefined) campo.value = valor;
        };

        asignar('trabNombre', datos.nombre_trabajador || cliente.nombre_cliente);
        asignar('trabCedula', datos.cedula_trabajador || cliente.cedula_cliente);
        asignar('trabTelefono', datos.telefono_trabajador || cliente.telefono_cliente);
        asignar('trabCorreo', datos.correo_trabajador || cliente.correo_cliente);
        asignar('trabNacimiento', (datos.fecha_nacimiento || cliente.fecha_nacimiento_cliente || '').slice(0, 10));
        asignar('trabDireccion', datos.direccion_trabajador);

        asignar('trabLicenciaNumero', datos.licencia_numero);
        asignar('trabLicenciaVence', (datos.licencia_vencimiento || '').slice(0, 10));
        asignar('trabCirculacionNumero', datos.circulacion_numero);
        asignar('trabCirculacionVence', (datos.circulacion_vencimiento || '').slice(0, 10));
        asignar('trabAseguradora', datos.seguro_aseguradora);
        asignar('trabSeguroNumero', datos.seguro_numero);
        asignar('trabSeguroVence', (datos.seguro_vencimiento || '').slice(0, 10));

        asignar('trabMarca', datos.vehiculo_marca);
        asignar('trabModelo', datos.vehiculo_modelo);
        asignar('trabAnio', datos.vehiculo_anio);
        asignar('trabPlaca', datos.vehiculo_placa);
        asignar('trabColorVehiculo', datos.vehiculo_color);
        asignar('trabColorUsuario', datos.color_usuario || '#22c55e');

        /* Las fotos ya subidas se conservan si el trabajador no elige nuevas. */
        ['trabFotoPerfil', 'trabFotoVehiculo', 'trabFotoLicencia', 'trabFotoCirculacion', 'trabFotoSeguro'].forEach((id) => {
            const campo = document.getElementById(id);
            if (campo) campo.value = '';
        });

        document.getElementById('trabFotoPerfil')?.toggleAttribute('required', !datos.foto_perfil);
        document.getElementById('trabFotoVehiculo')?.toggleAttribute('required', !datos.foto_vehiculo);

        if (window.formatearCedula) window.formatearCedula('trabCedula');
    }

    function mostrarFormulario(mostrar, trabajador = trabajadorActual) {
        if (!formulario) return;

        formulario.hidden = !mostrar;

        if (mostrar) {
            prefillFormulario(trabajador);

            if (botonEnviar) {
                botonEnviar.textContent = trabajador?.estado_trabajador === 'aprobado'
                    ? 'Guardar cambios'
                    : 'Enviar solicitud';
            }

            formulario.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function leerFormulario() {
        const valor = (id) => texto(document.getElementById(id)?.value);
        const archivo = (id) => document.getElementById(id)?.files?.[0] || null;

        return {
            nombre_trabajador: valor('trabNombre'),
            cedula_trabajador: valor('trabCedula'),
            telefono_trabajador: valor('trabTelefono'),
            correo_trabajador: valor('trabCorreo'),
            fecha_nacimiento: valor('trabNacimiento'),
            direccion_trabajador: valor('trabDireccion'),
            licencia_numero: valor('trabLicenciaNumero'),
            licencia_vencimiento: valor('trabLicenciaVence'),
            circulacion_numero: valor('trabCirculacionNumero'),
            circulacion_vencimiento: valor('trabCirculacionVence'),
            seguro_aseguradora: valor('trabAseguradora'),
            seguro_numero: valor('trabSeguroNumero'),
            seguro_vencimiento: valor('trabSeguroVence'),
            vehiculo_marca: valor('trabMarca'),
            vehiculo_modelo: valor('trabModelo'),
            vehiculo_anio: valor('trabAnio'),
            vehiculo_placa: valor('trabPlaca'),
            vehiculo_color: valor('trabColorVehiculo'),
            color_usuario: valor('trabColorUsuario') || '#22c55e',
            archivos: {
                foto_perfil: archivo('trabFotoPerfil'),
                foto_vehiculo: archivo('trabFotoVehiculo'),
                foto_licencia: archivo('trabFotoLicencia'),
                foto_circulacion: archivo('trabFotoCirculacion'),
                foto_seguro: archivo('trabFotoSeguro'),
            },
        };
    }

    function validarArchivo(archivo, obligatorio, etiqueta) {
        if (!archivo) {
            if (obligatorio) throw new Error(`Selecciona ${etiqueta}.`);
            return true;
        }

        if (!String(archivo.type || '').startsWith('image/')) {
            throw new Error(`${etiqueta} debe ser una imagen.`);
        }

        if (archivo.size > 5 * 1024 * 1024) {
            throw new Error(`${etiqueta} no puede superar 5 MB.`);
        }

        return true;
    }

    async function subirFoto(archivo, tipo) {
        const respuesta = await window.TiendaAPI.post('/tienda/api/trabajador/foto', { archivo, tipo });

        if (!respuesta?.url) throw new Error('No se pudo subir la imagen.');

        return respuesta.url;
    }

    async function enviarSolicitud(evento) {
        evento.preventDefault();

        if (enviando) return;

        const datos = leerFormulario();

        try {
            validarArchivo(datos.archivos.foto_perfil, !trabajadorActual?.foto_perfil, 'tu foto');
            validarArchivo(datos.archivos.foto_vehiculo, !trabajadorActual?.foto_vehiculo, 'la foto del vehículo');
            validarArchivo(datos.archivos.foto_licencia, false, 'la foto de la licencia');
            validarArchivo(datos.archivos.foto_circulacion, false, 'la foto de la circulación');
            validarArchivo(datos.archivos.foto_seguro, false, 'la foto del seguro');

            enviando = true;
            if (botonEnviar) {
                botonEnviar.disabled = true;
                botonEnviar.textContent = 'Enviando…';
            }
            window.tiendaCargando?.(true, true);

            const fotos = {
                foto_perfil: trabajadorActual?.foto_perfil || '',
                foto_vehiculo: trabajadorActual?.foto_vehiculo || '',
                foto_licencia: trabajadorActual?.foto_licencia || '',
                foto_circulacion: trabajadorActual?.foto_circulacion || '',
                foto_seguro: trabajadorActual?.foto_seguro || '',
            };

            for (const [campo, archivo] of Object.entries(datos.archivos)) {
                if (archivo) fotos[campo] = await subirFoto(archivo, campo.replace('foto_', ''));
            }

            const respuesta = await window.TiendaAPI.post('/tienda/api/trabajador/solicitud', {
                ...datos,
                archivos: undefined,
                ...fotos,
            });

            trabajadorActual = respuesta.trabajador || null;
            mostrarFormulario(false);
            pintarEstado(trabajadorActual);
            window.tiendaToast?.(respuesta.mensaje || 'Solicitud enviada.', 'exito');
        } catch (error) {
            window.tiendaToast?.(error?.message || 'No se pudo enviar la solicitud.', 'aviso');
        } finally {
            enviando = false;
            if (botonEnviar) {
                botonEnviar.disabled = false;
                botonEnviar.textContent = 'Enviar solicitud';
            }
            window.tiendaCargando?.(false);
        }
    }

    async function cambiarDisponibilidad(disponible) {
        try {
            const respuesta = await window.TiendaAPI.put('/tienda/api/trabajador/disponibilidad', { disponible });
            trabajadorActual = respuesta.trabajador || trabajadorActual;
            window.tiendaToast?.(disponible ? 'Estás disponible para trabajar.' : 'Ya no estás disponible.', 'exito');
        } catch (error) {
            window.tiendaToast?.(error?.message || 'No se pudo cambiar tu disponibilidad.', 'aviso');
            pintarEstado(trabajadorActual);
        }
    }

    contenido?.addEventListener('click', (evento) => {
        const accion = evento.target.closest('[data-accion]')?.dataset.accion;

        if (accion === 'solicitar' || accion === 'editar') {
            mostrarFormulario(true);
        }
    });

    contenido?.addEventListener('change', (evento) => {
        if (evento.target?.id === 'trabDisponible') {
            cambiarDisponibilidad(evento.target.checked);
        }

        if (evento.target?.id === 'checkModoTrabajador' && evento.target.checked) {
            window.location.href = '/tienda/trabajador';
        }
    });

    botonCancelar?.addEventListener('click', () => mostrarFormulario(false));

    formulario?.addEventListener('submit', enviarSolicitud);

    document.getElementById('trabColorUsuario')?.addEventListener('input', (evento) => {
        document.querySelector('.perfil-trabajador__color span')?.replaceChildren(
            document.createTextNode(`Así te verá el cliente · ${evento.target.value}`)
        );
    });

    async function iniciar() {
        try {
            if (typeof window.cargarSupabase === 'function') await window.cargarSupabase();
            const sesion = await window.sesionTiendaPromise;
            clienteActual = sesion?.cliente || window.clienteTienda || null;

            if (!clienteActual) {
                const destino = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
                contenido.innerHTML = `
                    <div class="perfil-trabajador__vacio">
                        <div>
                            <strong>Inicia sesión para solicitar</strong>
                            <p>Necesitamos verificar tu cuenta antes de recibir tus datos.</p>
                        </div>
                        <a class="btn-primario" href="/tienda/login?redirect=${destino}">
                            <i class="bi bi-box-arrow-in-right"></i> Iniciar sesión
                        </a>
                    </div>`;
                return;
            }

            pintarCargando();

            const respuesta = await window.TiendaAPI.get('/tienda/api/trabajador');
            trabajadorActual = respuesta?.trabajador || null;

            if (trabajadorActual) {
                pintarEstado(trabajadorActual);
            } else {
                pintarIntroduccion();
            }
        } catch (error) {
            contenido.innerHTML = `<p class="perfil-vacio"><i class="bi bi-exclamation-triangle"></i> ${escapar(error?.message || 'No se pudo cargar tu solicitud.')}</p>`;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();
