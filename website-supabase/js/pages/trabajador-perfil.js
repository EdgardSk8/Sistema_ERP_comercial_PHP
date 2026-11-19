/* ╔══════════════════════════════════════════════════════════════╗
   ║  Perfil del trabajador · datos y contacto con el encargado    ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    const porId = (id) => document.getElementById(id);

    const cargando = porId('perfilTrabajadorCargando');
    const bloqueo = porId('perfilTrabajadorBloqueo');
    const panel = porId('perfilTrabajadorPanel');

    if (!cargando || !bloqueo || !panel) return;

    const ESTADOS = {
        pendiente: { texto: 'Solicitud en revisión', icono: 'bi-hourglass-split' },
        aprobado: { texto: 'Trabajador aprobado', icono: 'bi-patch-check-fill' },
        rechazado: { texto: 'Solicitud rechazada', icono: 'bi-x-circle' },
        suspendido: { texto: 'Cuenta suspendida', icono: 'bi-slash-circle' },
    };

    const TIPOS_CAMBIO = {
        cambio_vehiculo: 'Cambio de vehículo',
        foto_vehiculo: 'Cambio de foto del vehículo',
        foto_circulacion: 'Cambio de foto de circulación',
        baja: 'Darme de baja',
        otro: 'Otro cambio o consulta',
    };

    const ESTADOS_CAMBIO = {
        pendiente: { texto: 'Pendiente', clase: 'pendiente' },
        aprobado: { texto: 'Aprobado', clase: 'aprobado' },
        rechazado: { texto: 'Rechazado', clase: 'rechazado' },
    };

    const escapar = window.TiendaUtil.escapar;

    let clienteActual = null;

    const valor = (dato) => {
        const texto = String(dato ?? '').trim();
        return texto === '' ? '—' : texto;
    };

    const fecha = (dato) => {
        if (!dato) return '—';

        const limpia = String(dato).slice(0, 10);
        const [anio, mes, dia] = limpia.split('-');

        return dia && mes && anio ? `${dia}/${mes}/${anio}` : String(dato);
    };

    const fechaHora = (dato) => {
        if (!dato) return '—';

        const fechaValor = new Date(String(dato).replace(' ', 'T'));

        if (Number.isNaN(fechaValor.getTime())) return '—';

        return fechaValor.toLocaleString('es-NI', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const colorSeguro = (color) => {
        const limpio = String(color ?? '').trim();

        return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(limpio) ? limpio : '#1f6f55';
    };

    const iniciales = (nombre) => String(nombre ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join('') || 'TR';

    const avatar = (persona, clase = '') => {
        const foto = String(persona?.foto_perfil ?? '').trim();
        const fotoValida = /^https?:\/\//i.test(foto) || (foto.startsWith('/') && !foto.startsWith('//'));

        if (fotoValida) {
            return `<img class="${clase}" src="${escapar(foto)}" alt="" loading="lazy" onerror="this.remove()">`;
        }

        return `<span class="${clase}">${escapar(iniciales(persona?.nombre || persona?.nombre_trabajador))}</span>`;
    };

    const telefono = (dato) => String(dato ?? '').replace(/\D/g, '');

    function mostrarBloqueo(titulo, mensaje, enlace = '/tienda/perfil#trabajo', textoEnlace = 'Ir a configuración') {
        cargando.hidden = true;
        panel.hidden = true;
        bloqueo.hidden = false;

        porId('perfilTrabajadorBloqueoTitulo').textContent = titulo;
        porId('perfilTrabajadorBloqueoTexto').textContent = mensaje;

        const boton = porId('perfilTrabajadorBloqueoEnlace');
        boton.href = enlace;
        boton.textContent = textoEnlace;
    }

    function mostrarToast(mensaje, tipo = 'exito') {
        const contenedor = porId('perfilTrabajadorToasts');

        if (!contenedor) return;

        const toast = document.createElement('div');
        toast.className = `trabajador-toast${tipo === 'error' ? ' trabajador-toast--error' : ''}`;
        toast.innerHTML = `<i class="bi ${tipo === 'error' ? 'bi-exclamation-triangle' : 'bi-check2-circle'}" aria-hidden="true"></i>
            <span>${escapar(mensaje)}</span>`;

        contenedor.append(toast);
        window.setTimeout(() => toast.remove(), 4200);
    }

    function pintarHero(trabajador) {
        const estado = ESTADOS[trabajador?.estado_trabajador] || ESTADOS.pendiente;
        const nombre = trabajador?.nombre_trabajador || clienteActual?.nombre_cliente || 'Trabajador';
        const color = colorSeguro(trabajador?.color_usuario);
        const avatarContenedor = porId('perfilTrabajadorAvatar');

        avatarContenedor.style.setProperty('--color-trabajador', color);
        avatarContenedor.innerHTML = avatar({ ...trabajador, nombre }, 'trabajador-hero__avatar-img');

        porId('perfilTrabajadorEstado').innerHTML = `<i class="bi ${estado.icono}" aria-hidden="true"></i> ${escapar(estado.texto)}`;
        porId('perfilTrabajadorNombre').textContent = nombre;
        porId('perfilTrabajadorVehiculo').textContent = [
            trabajador?.vehiculo_marca,
            trabajador?.vehiculo_modelo,
            trabajador?.vehiculo_anio,
        ].filter(Boolean).join(' ') || 'Vehículo por confirmar';

        porId('perfilTrabajadorPlaca').innerHTML = trabajador?.vehiculo_placa
            ? `<i class="bi bi-credit-card-2-front" aria-hidden="true"></i> Placa ${escapar(trabajador.vehiculo_placa)}`
            : '';

        porId('perfilTrabajadorColor').innerHTML = trabajador?.color_usuario
            ? `<span class="trabajador-chip__punto" style="background:${escapar(color)}"></span> Color de identificación`
            : '';

        const comision = Number(trabajador?.porcentaje_comision);
        const ganancia = Number.isFinite(comision) ? Math.max(0, 100 - comision) : null;
        porId('perfilTrabajadorGanancia').textContent = ganancia === null
            ? 'Comisión por confirmar'
            : `Tu ganancia: ${ganancia.toFixed(0)}%`;

        const disponible = porId('perfilTrabajadorDisponible');

        if (trabajador?.estado_trabajador === 'aprobado') {
            disponible.innerHTML = trabajador.disponible
                ? '<i class="bi bi-broadcast" aria-hidden="true"></i> Disponible'
                : '<i class="bi bi-pause-circle" aria-hidden="true"></i> No disponible';
        } else {
            disponible.textContent = '';
        }
    }

    function pintarDatos(trabajador) {
        const cliente = clienteActual || {};

        porId('perfilDatoNombre').textContent = valor(trabajador.nombre_trabajador || cliente.nombre_cliente);
        porId('perfilDatoCedula').textContent = valor(trabajador.cedula_trabajador || cliente.cedula_cliente);

        const numeroTelefono = telefono(trabajador.telefono_trabajador || cliente.telefono_cliente);
        porId('perfilDatoTelefono').innerHTML = numeroTelefono
            ? `<a href="tel:${escapar(numeroTelefono)}">${escapar(trabajador.telefono_trabajador || cliente.telefono_cliente)}</a>`
            : '—';

        const correo = String(trabajador.correo_trabajador || cliente.correo_cliente || '').trim();
        porId('perfilDatoCorreo').innerHTML = correo
            ? `<a href="mailto:${escapar(correo)}">${escapar(correo)}</a>`
            : '—';

        porId('perfilDatoNacimiento').textContent = fecha(trabajador.fecha_nacimiento || cliente.fecha_nacimiento_cliente);
        porId('perfilDatoDireccion').textContent = valor(trabajador.direccion_trabajador);

        porId('perfilDatoVehiculo').textContent = [
            trabajador.vehiculo_marca,
            trabajador.vehiculo_modelo,
            trabajador.vehiculo_anio,
        ].filter(Boolean).join(' ') || '—';
        porId('perfilDatoPlaca').textContent = valor(trabajador.vehiculo_placa);
        porId('perfilDatoColorVehiculo').textContent = valor(trabajador.vehiculo_color);
    }

    function pintarFotos(trabajador) {
        const contenedor = porId('perfilTrabajadorFotos');
        const fotos = [
            [trabajador.foto_perfil, 'Foto de perfil'],
            [trabajador.foto_vehiculo, 'Foto del vehículo'],
        ].filter(([url]) => Boolean(String(url ?? '').trim()));

        if (!fotos.length) {
            contenedor.hidden = true;
            return;
        }

        contenedor.innerHTML = fotos.map(([url, titulo]) => `
            <a class="trabajador-perfil-foto" href="${escapar(url)}" target="_blank" rel="noopener" title="${escapar(titulo)}">
                <img src="${escapar(url)}" alt="${escapar(titulo)}" loading="lazy">
                <span>${escapar(titulo)}</span>
            </a>`).join('');
    }

    function pintarDocumentos(trabajador) {
        const documento = (numero, vencimiento) => {
            const partes = [];

            if (String(numero ?? '').trim()) partes.push(String(numero).trim());
            if (vencimiento) partes.push(`vence ${fecha(vencimiento)}`);

            return partes.join(' · ');
        };

        const seguro = [];

        if (String(trabajador.seguro_aseguradora ?? '').trim()) seguro.push(String(trabajador.seguro_aseguradora).trim());
        if (String(trabajador.seguro_numero ?? '').trim()) seguro.push(String(trabajador.seguro_numero).trim());
        if (trabajador.seguro_vencimiento) seguro.push(`vence ${fecha(trabajador.seguro_vencimiento)}`);

        const documentos = [
            ['perfilFotoLicencia', trabajador.foto_licencia, 'Licencia · frente', documento(trabajador.licencia_numero, trabajador.licencia_vencimiento)],
            ['perfilFotoLicenciaReverso', trabajador.foto_licencia_reverso, 'Licencia · reverso', ''],
            ['perfilFotoCirculacion', trabajador.foto_circulacion, 'Circulación · frente', documento(trabajador.circulacion_numero, trabajador.circulacion_vencimiento)],
            ['perfilFotoCirculacionReverso', trabajador.foto_circulacion_reverso, 'Circulación · reverso', ''],
            ['perfilFotoSeguro', trabajador.foto_seguro, 'Seguro', seguro.join(' · ')],
        ];

        documentos.forEach(([id, url, titulo, detalle]) => {
            const contenedor = porId(id);

            if (!contenedor) return;

            const limpia = String(url ?? '').trim();

            if (limpia) {
                contenedor.innerHTML = `<a class="trabajador-documento" href="${escapar(limpia)}" target="_blank" rel="noopener" title="${escapar(titulo)}">
                    <span class="trabajador-documento__marco"><img src="${escapar(limpia)}" alt="${escapar(titulo)}" loading="lazy"></span>
                    <span class="trabajador-documento__titulo">${escapar(titulo)}</span>
                    ${detalle ? `<span class="trabajador-documento__detalle">${escapar(detalle)}</span>` : ''}
                </a>`;
            } else {
                contenedor.innerHTML = `<div class="trabajador-documento trabajador-documento--vacio">
                    <span class="trabajador-documento__marco"><i class="bi bi-image" aria-hidden="true"></i></span>
                    <span class="trabajador-documento__titulo">${escapar(titulo)}</span>
                    <span class="trabajador-documento__detalle">No registrada</span>
                </div>`;
            }
        });
    }

    function configurarCambios(trabajador) {
        const formulario = porId('formCambioTrabajador');
        const aviso = porId('perfilCambioAviso');

        if (!formulario || !aviso) return;

        if (trabajador.estado_trabajador !== 'aprobado') {
            formulario.hidden = true;
            aviso.hidden = false;
            aviso.innerHTML = '<i class="bi bi-info-circle" aria-hidden="true"></i> Tu cuenta debe estar aprobada para enviar solicitudes de cambio.';
            return;
        }

        aviso.hidden = true;
        formulario.hidden = false;

        const tipo = porId('cambioTipo');
        const detalle = porId('cambioDetalle');
        const campoFoto = porId('cambioFotoCampo');
        const foto = porId('cambioFoto');
        const boton = porId('btnEnviarCambio');

        const requiereDetalle = () => ['cambio_vehiculo', 'baja', 'otro'].includes(tipo.value);
        const requiereFoto = () => ['foto_vehiculo', 'foto_circulacion'].includes(tipo.value);

        const actualizar = () => {
            detalle.required = requiereDetalle();
            campoFoto.hidden = !requiereFoto();
            foto.required = requiereFoto();

            detalle.placeholder = {
                cambio_vehiculo: 'Indica la nueva moto o carro: marca, modelo, año, placa y color.',
                baja: 'Cuéntanos el motivo de tu baja.',
                otro: 'Describe el cambio o consulta que necesitas.',
            }[tipo.value] || 'Puedes agregar una nota (opcional).';

            if (!requiereFoto()) foto.value = '';
        };

        tipo.addEventListener('change', actualizar);
        actualizar();

        formulario.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const tipoValor = tipo.value;
            const detalleValor = detalle.value.trim();
            const archivo = foto.files?.[0] || null;

            if (requiereDetalle() && !detalleValor) {
                mostrarToast('Escribe el detalle de tu solicitud.', 'error');
                return;
            }

            if (requiereFoto() && !archivo) {
                mostrarToast('Adjunta la nueva foto.', 'error');
                return;
            }

            const textoOriginal = boton.innerHTML;
            boton.disabled = true;
            boton.innerHTML = '<i class="bi bi-hourglass-split" aria-hidden="true"></i> Enviando…';

            try {
                let fotoUrl = null;

                if (archivo) {
                    const subida = await window.TiendaAPI.post('/tienda/api/trabajador/foto', {
                        archivo,
                        tipo: tipoValor === 'foto_vehiculo' ? 'vehiculo' : 'circulacion',
                    });

                    fotoUrl = subida?.url || null;

                    if (!fotoUrl) throw new Error('No se pudo subir la foto.');
                }

                const respuesta = await window.TiendaAPI.post('/tienda/api/trabajador/cambios', {
                    tipo: tipoValor,
                    detalle: detalleValor || null,
                    foto_url: fotoUrl,
                });

                mostrarToast(respuesta?.mensaje || 'Solicitud enviada. Queda pendiente de aprobación.');

                formulario.reset();
                actualizar();
                await cargarCambios();
            } catch (error) {
                mostrarToast(error?.message || 'No se pudo enviar la solicitud.', 'error');
            } finally {
                boton.disabled = false;
                boton.innerHTML = textoOriginal;
            }
        });
    }

    function renderCambios(cambios) {
        const contenedor = porId('perfilCambiosLista');

        if (!contenedor) return;

        if (!cambios.length) {
            contenedor.innerHTML = '<p class="trabajador-vacio">No tienes solicitudes de cambio.</p>';
            return;
        }

        contenedor.innerHTML = cambios.map((cambio) => {
            const estado = ESTADOS_CAMBIO[cambio.estado] || ESTADOS_CAMBIO.pendiente;
            const detalle = String(cambio.detalle ?? '').trim();

            return `
                <article class="trabajador-cambio">
                    <div class="trabajador-cambio__cuerpo">
                        <strong>${escapar(TIPOS_CAMBIO[cambio.tipo] || cambio.tipo)}</strong>
                        ${detalle ? `<span>${escapar(detalle)}</span>` : ''}
                        ${cambio.foto_url ? `<a class="trabajador-cambio__foto" href="${escapar(cambio.foto_url)}" target="_blank" rel="noopener">Ver foto enviada</a>` : ''}
                        ${cambio.estado === 'rechazado' && cambio.respuesta ? `<span class="trabajador-cambio__respuesta">Motivo: ${escapar(cambio.respuesta)}</span>` : ''}
                        <span class="trabajador-cambio__fecha">${fechaHora(cambio.fecha_solicitud)}</span>
                    </div>
                    <span class="trabajador-badge trabajador-badge--${estado.clase}">${escapar(estado.texto)}</span>
                </article>`;
        }).join('');
    }

    async function cargarCambios() {
        const contenedor = porId('perfilCambiosLista');

        if (!contenedor) return;

        try {
            const respuesta = await window.TiendaAPI.get('/tienda/api/trabajador/cambios');
            renderCambios(Array.isArray(respuesta?.cambios) ? respuesta.cambios : []);
        } catch {
            contenedor.innerHTML = '<p class="trabajador-vacio">No pudimos cargar tus solicitudes. Intenta de nuevo más tarde.</p>';
        }
    }

    function limpiarModoTrabajador() {
        const id = window.clienteTienda?.id_cliente;

        try {
            localStorage.removeItem('tienda_modo_trabajador');

            if (id) localStorage.removeItem(`tienda_modo_trabajador:${id}`);
        } catch {
            /* Sin almacenamiento local. */
        }
    }

    async function iniciar() {
        try {
            if (typeof window.cargarSupabase === 'function') await window.cargarSupabase();

            const sesion = await (window.sesionTiendaPromise || Promise.resolve(null)).catch(() => null);
            const cliente = sesion?.cliente || window.clienteTienda || null;

            if (!cliente) {
                window.location.replace(`/tienda/login?redirect=${encodeURIComponent('/tienda/trabajador/perfil')}`);
                return;
            }

            clienteActual = cliente;

            const respuesta = await window.TiendaAPI.get('/tienda/api/trabajador');
            const trabajador = respuesta?.trabajador || null;

            if (!trabajador) {
                mostrarBloqueo(
                    'Aún no eres parte del equipo',
                    'Envía tu solicitud desde «Trabaja con nosotros» para ver tu perfil de trabajador.',
                    '/tienda/trabaja-con-nosotros',
                    'Enviar mi solicitud'
                );
                return;
            }

            cargando.hidden = true;
            bloqueo.hidden = true;
            panel.hidden = false;

            pintarHero(trabajador);
            pintarDatos(trabajador);
            pintarFotos(trabajador);
            pintarDocumentos(trabajador);
            configurarCambios(trabajador);
            await cargarCambios();
        } catch (error) {
            mostrarBloqueo(
                'No se pudo abrir tu perfil',
                error?.message || 'Ocurrió un error al cargar tu cuenta de trabajador.',
                '/tienda/trabajador',
                'Volver al panel'
            );
        }
    }

    document.querySelector('.trabajador-modo-cliente')?.addEventListener('click', limpiarModoTrabajador);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();
