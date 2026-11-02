/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · API directa contra Supabase (sin backend Laravel)  ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    // Interruptor del tema navideño (definido en supabase-config.js).
    if (window.TEMA_NAVIDAD === false) {
        document.documentElement.classList.remove('tema-navidad');
    }

    if (window.TEMA_NAVIDAD !== false) {
        const logoMini = '/tienda/recursos/img/logonavidad-mini.png?v=20261102d';
        const favicon = '/tienda/recursos/img/favicon-navidad.png?v=20261030h';
        const touchIcon = '/tienda/recursos/img/apple-touch-navidad.png?v=20261030h';

        document.querySelectorAll('img.marca__logo, img.acceso__logo').forEach((imagen) => {
            imagen.src = logoMini;
        });

        document.querySelectorAll('link[rel="icon"]').forEach((enlace) => {
            enlace.href = favicon;
        });

        document.querySelectorAll('link[rel="apple-touch-icon"]').forEach((enlace) => {
            enlace.href = touchIcon;
        });

        const metaTema = document.querySelector('meta[name="theme-color"]');

        if (metaTema) {
            metaTema.setAttribute('content', '#ffffff');
        }
    }

    const config = window.SUPABASE_CONFIG || {};

    if (!config.url || !config.key || !window.supabase) {
        console.error('Supabase no está configurado. Revisa js/supabase-config.js');
        return;
    }

    const supabase = window.supabase.createClient(config.url, config.key, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    });

    const fetchOriginal = window.fetch.bind(window);

    let usuarioActual = null;
    let clienteActual = null;

    /* Marco de ventas del avatar (se calcula desde la base). */
    window.marcoTienda = null;
    window.marcoTiendaPromise = null;

    /* ── Utilidades ─────────────────────────────────────────── */

    function errorApi(mensaje, status = 400, errors = null) {
        const error = new Error(mensaje);
        error.status = status;
        error.data = { success: false, mensaje };

        if (errors) {
            error.data.errors = errors;
        }

        return error;
    }

    function errorDeSupabase(error, mensaje = 'No se pudo completar la solicitud.') {
        const texto = String(error?.message || '');

        if (error?.code === '23505') {
            if (texto.includes('usuario_cliente')) {
                return errorApi('Ese usuario ya está registrado.', 422, { usuario_cliente: ['Ese usuario ya está registrado.'] });
            }
            if (texto.includes('correo_cliente')) {
                return errorApi('Ese correo ya está registrado.', 422, { correo_cliente: ['Ese correo ya está registrado.'] });
            }
            if (texto.includes('cedula_cliente')) {
                return errorApi('Ya existe un cliente con esa cédula.', 422, { cedula_cliente: ['Ya existe un cliente con esa cédula.'] });
            }
            return errorApi('Ya existe un registro con esos datos.', 422);
        }

        return errorApi(mensaje, 400);
    }

    function texto(valor) {
        return String(valor ?? '').trim();
    }

    function descuentoCliente(fila) {
        const tipo = fila?.descuento_tipo_cliente;
        const valor = Number(fila?.descuento_valor_cliente || 0);

        if (!['porcentaje', 'monto'].includes(tipo) || valor <= 0) {
            return descuentoPrimeraCompra();
        }

        return {
            tipo,
            valor,
            etiqueta: tipo === 'porcentaje'
                ? `${String(valor).replace(/\.00$/, '')}%`
                : `C$ ${valor.toFixed(2)}`,
        };
    }

    /* Descuento de primera compra: 10% guardado en metadatos de Auth. */
    function descuentoPrimeraCompra() {
        const meta = usuarioActual?.user_metadata || {};
        const activo = meta.descuento_primera_compra === true
            || texto(meta.descuento_primera_compra) === 'true';

        if (!activo) return null;

        return {
            tipo: 'porcentaje',
            valor: 10,
            etiqueta: '10%',
            primera_compra: true,
        };
    }

    /* ¿La cuenta tiene contraseña? Las creadas con Google no la tienen. */
    function cuentaTienePassword() {
        if (!usuarioActual) return false;

        /* Bandera persistente para cuentas que crearon contraseña desde el perfil. */
        if (usuarioActual.user_metadata?.password_set === true) return true;

        const proveedores = usuarioActual.app_metadata?.providers || [];

        if (proveedores.includes('email')) return true;

        return (usuarioActual.identities || []).some((identidad) => identidad.provider === 'email');
    }

    function marcarPasswordLocal() {
        if (!usuarioActual) return;

        usuarioActual.user_metadata = {
            ...(usuarioActual.user_metadata || {}),
            password_set: true,
        };

        usuarioActual.app_metadata = {
            ...(usuarioActual.app_metadata || {}),
            providers: [...new Set([...(usuarioActual.app_metadata?.providers || []), 'email'])],
        };

        const identities = Array.isArray(usuarioActual.identities) ? usuarioActual.identities : [];

        if (!identities.some((identidad) => identidad.provider === 'email')) {
            usuarioActual.identities = [...identities, { provider: 'email' }];
        }
    }

    window.cuentaTienePassword = cuentaTienePassword;

    function datosCliente(fila) {
        if (!fila) return null;

        return {
            id_cliente: fila.id_cliente,
            nombre_cliente: fila.nombre_cliente,
            usuario_cliente: fila.usuario_cliente,
            correo_cliente: fila.correo_cliente,
            telefono_cliente: fila.telefono_cliente,
            fecha_nacimiento_cliente: fila.fecha_nacimiento_cliente,
            cedula_cliente: fila.cedula_cliente,
            descuento: descuentoCliente(fila),
            ...datosAvatar(),
        };
    }

    /* ── Avatar: color de fondo + ilustración opcional ────────
       Se guarda en los metadatos de Auth, así no hace falta
       tocar la tabla clientes ni pedir migración en Supabase. */

    function datosAvatar() {
        const meta = usuarioActual?.user_metadata || {};
        const color = texto(meta.avatar_color).toLowerCase();

        return {
            avatar_color: /^#[0-9a-f]{6}$/.test(color) ? color : null,
            avatar_imagen: texto(meta.avatar_imagen) || null,
            avatar_fondo: texto(meta.avatar_fondo) || null,
            marco_avatar: !(meta.marco_avatar === false || texto(meta.marco_avatar) === 'false'),
            marco_estilo: /^[a-z0-9_-]{1,20}$/i.test(texto(meta.marco_avatar_estilo))
                ? texto(meta.marco_avatar_estilo).toLowerCase()
                : null,
        };
    }

    /* Niveles de marco según ventas completadas. */
    const MARCOS_AVATAR = [
        { ventas: 5, clave: 'bronce', nombre: 'Bronce' },
        { ventas: 10, clave: 'plata', nombre: 'Plata' },
        { ventas: 20, clave: 'oro', nombre: 'Oro' },
        { ventas: 50, clave: 'esmeralda', nombre: 'Esmeralda' },
        { ventas: 100, clave: 'rubi', nombre: 'Rubí' },
    ];

    function inicialesCliente(nombre) {
        const partes = texto(nombre).split(/\s+/).filter(Boolean);

        if (!partes.length) return '?';

        return (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase();
    }

    function esColorClaro(color) {
        const limpio = String(color || '').replace('#', '');

        if (limpio.length !== 6) return false;

        const r = parseInt(limpio.slice(0, 2), 16);
        const g = parseInt(limpio.slice(2, 4), 16);
        const b = parseInt(limpio.slice(4, 6), 16);

        return (0.299 * r + 0.587 * g + 0.114 * b) > 186;
    }

    function aplicarAvatar(elemento, cliente) {
        if (!elemento) return;

        const color = cliente?.avatar_color || '#d9f2e4';
        const fondo = cliente?.avatar_fondo || '';
        const imagen = elemento.querySelector('[data-avatar-img]');
        const iniciales = elemento.querySelector('[data-avatar-iniciales]');

        elemento.style.setProperty('--avatar-color', color);
        elemento.classList.toggle('avatar--claro', esColorClaro(color));
        elemento.classList.toggle('avatar--foto', Boolean(fondo));

        const marco = cliente?.marco_avatar === false
            ? null
            : (cliente?.marco_estilo || window.marcoTienda?.marco?.clave || null);

        MARCOS_AVATAR.forEach((nivel) => {
            elemento.classList.toggle(`marco--${nivel.clave}`, nivel.clave === marco);
        });

        if (fondo) {
            elemento.style.setProperty('--avatar-foto', `url('/tienda/recursos/imagenes/avatares/fondos/${fondo}')`);
        } else {
            elemento.style.removeProperty('--avatar-foto');
        }

        if (imagen) {
            if (cliente?.avatar_imagen) {
                imagen.src = `/tienda/recursos/imagenes/avatares/${cliente.avatar_imagen}.png`;
                imagen.alt = `Foto de perfil de ${cliente.nombre_cliente || 'cliente'}`;
                imagen.hidden = false;
            } else {
                imagen.hidden = true;
                imagen.removeAttribute('src');
                imagen.alt = '';
            }
        }

        if (iniciales) {
            iniciales.textContent = inicialesCliente(cliente?.nombre_cliente);
            iniciales.hidden = Boolean(cliente?.avatar_imagen || fondo);
        }
    }

    function pintarAvatares(cliente) {
        document.querySelectorAll('[data-avatar]').forEach((elemento) => {
            aplicarAvatar(elemento, cliente);
        });
    }

    function previsualizarAvatar(color) {
        document.querySelectorAll('[data-avatar]').forEach((elemento) => {
            elemento.style.setProperty('--avatar-color', color || '#d9f2e4');
            elemento.classList.toggle('avatar--claro', esColorClaro(color));
        });
    }

    function previsualizarAvatarFondo(fondo) {
        document.querySelectorAll('[data-avatar]').forEach((elemento) => {
            elemento.classList.toggle('avatar--foto', Boolean(fondo));

            if (fondo) {
                elemento.style.setProperty('--avatar-foto', `url('/tienda/recursos/imagenes/avatares/fondos/${fondo}')`);
            } else {
                elemento.style.removeProperty('--avatar-foto');
            }

            const iniciales = elemento.querySelector('[data-avatar-iniciales]');

            if (iniciales) {
                iniciales.hidden = Boolean(fondo) || Boolean(window.clienteTienda?.avatar_imagen);
            }
        });
    }

    window.pintarAvatares = pintarAvatares;
    window.previsualizarAvatar = previsualizarAvatar;
    window.previsualizarAvatarFondo = previsualizarAvatarFondo;

    const GENERADOR_USUARIO = (nombre) => {
        const base = String(nombre || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 50);

        return base || 'cliente';
    };

    async function obtenerOCrearCliente(usuario) {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('auth_id', usuario.id)
            .maybeSingle();

        if (error) throw errorDeSupabase(error, 'No se pudo cargar tu cuenta.');

        if (data) return data;

        const meta = usuario.user_metadata || {};
        const nombre = texto(meta.nombre_cliente || meta.full_name || meta.name) || texto(usuario.email).split('@')[0] || 'Cliente';
        const usuarioWeb = texto(meta.usuario_cliente).slice(0, 60) || GENERADOR_USUARIO(nombre);

        const { data: creado, error: errorCrear } = await supabase
            .from('clientes')
            .insert({
                auth_id: usuario.id,
                nombre_cliente: nombre,
                correo_cliente: texto(usuario.email).toLowerCase() || null,
                usuario_cliente: usuarioWeb,
                telefono_cliente: texto(meta.telefono_cliente) || null,
                estado_cliente: true,
            })
            .select('*')
            .single();

        if (errorCrear) {
            if (errorCrear.code === '23505') {
                const { data: reintento, error: errorReintento } = await supabase
                    .from('clientes')
                    .insert({
                        auth_id: usuario.id,
                        nombre_cliente: nombre,
                        correo_cliente: texto(usuario.email).toLowerCase() || null,
                        usuario_cliente: `${GENERADOR_USUARIO(nombre)}_${Math.random().toString(36).slice(2, 6)}`,
                        telefono_cliente: texto(meta.telefono_cliente) || null,
                        estado_cliente: true,
                    })
                    .select('*')
                    .single();

                if (errorReintento) throw errorDeSupabase(errorReintento, 'No se pudo crear tu cuenta.');
                return reintento;
            }

            // Puede que un trigger ya la haya creado: reintenta leer.
            const { data: existente } = await supabase
                .from('clientes')
                .select('*')
                .eq('auth_id', usuario.id)
                .maybeSingle();

            if (existente) return existente;

            throw errorDeSupabase(errorCrear, 'No se pudo crear tu cuenta.');
        }

        return creado;
    }

    function actualizarHeader(cliente) {
        document.querySelectorAll('.perfil__nombre').forEach((elemento) => {
            elemento.textContent = cliente ? cliente.nombre_cliente : 'Invitado';
        });

        document.querySelectorAll('.perfil__detalle').forEach((elemento) => {
            elemento.textContent = cliente ? `@${cliente.usuario_cliente}` : 'Sin sesión iniciada';
        });

        document.querySelectorAll('.perfil__item--salir, .perfil-nav__item--salir').forEach((elemento) => {
            elemento.hidden = !cliente;
        });

        pintarAvatares(cliente ? datosCliente(cliente) : null);

        const menuInvitado = document.getElementById('menuInvitado');
        const menuCuenta = document.getElementById('menuPerfil');

        if (menuInvitado) {
            menuInvitado.hidden = Boolean(cliente);
            menuInvitado.open = false;
        }

        if (menuCuenta) {
            menuCuenta.hidden = !cliente;
            menuCuenta.open = false;
        }
    }

    /* ── Sesión ─────────────────────────────────────────────── */

    async function cargarSesion() {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            usuarioActual = null;
            clienteActual = null;
            return { success: true, autenticado: false, cliente: null };
        }

        usuarioActual = session.user;

        /* Trae los metadatos frescos: el marco forzado se cambia desde SQL/panel. */
        try {
            const { data: { user: usuarioFresco } } = await supabase.auth.getUser();

            if (usuarioFresco) usuarioActual = usuarioFresco;
        } catch {
            /* Sin red: se usa el usuario de la sesión. */
        }

        clienteActual = await obtenerOCrearCliente(usuarioActual);

        if (!clienteActual.estado_cliente) {
            await supabase.auth.signOut();
            usuarioActual = null;
            clienteActual = null;
            return { success: true, autenticado: false, cliente: null };
        }

        return { success: true, autenticado: true, cliente: datosCliente(clienteActual) };
    }

    window.sesionTiendaPromise = cargarSesion()
        .then((datos) => {
            window.clienteTienda = datos.cliente || null;
            actualizarHeader(clienteActual);

            if (datos.autenticado) cargarMarcoCliente();
            document.dispatchEvent(new CustomEvent('tienda:sesion', { detail: { cliente: datos.cliente } }));
            return datos;
        })
        .catch((error) => {
            console.error('No se pudo cargar la sesión de la tienda.', error);
            window.clienteTienda = null;
            actualizarHeader(null);
            document.dispatchEvent(new CustomEvent('tienda:sesion', { detail: { cliente: null } }));
            return { success: false, autenticado: false, cliente: null };
        });

    document.addEventListener('click', async (evento) => {
        const enlace = evento.target.closest('.perfil__item--salir, .perfil-nav__item--salir');
        if (!enlace) return;

        evento.preventDefault();

        if (!window.clienteTienda) {
            window.location.href = `${urlTienda('perfil')}#perfil`;
            return;
        }

        try {
            await supabase.auth.signOut();
            usuarioActual = null;
            clienteActual = null;
            if (window.tiendaToast) window.tiendaToast('Sesión cerrada.', 'info');
            window.location.href = urlTienda();
        } catch (error) {
            if (window.tiendaToast) window.tiendaToast('No se pudo cerrar la sesión.', 'aviso');
        }
    });

    /* ── Acceso con Google ──────────────────────────────────── */

    document.querySelectorAll('.acceso__social-btn--google').forEach((botonGoogle) => {
        botonGoogle.addEventListener('click', async (evento) => {
            evento.preventDefault();

            /* Guarda el destino para recuperarlo cuando Supabase devuelva el control. */
            try {
                const volver = new URLSearchParams(window.location.search).get('redirect');

                if (volver) sessionStorage.setItem('tienda_redirect', volver);
                else sessionStorage.removeItem('tienda_redirect');
            } catch {
                /* sessionStorage no disponible: continúa sin destino. */
            }

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}${urlTienda('login')}`,
                    queryParams: { prompt: 'select_account' },
                },
            });

            if (error) {
                console.error('Error de Google OAuth:', error.message, error);

                if (window.tiendaToast) {
                    window.tiendaToast(error.message || 'No se pudo abrir Google. Intenta de nuevo.', 'aviso');
                }
            }
        });
    });

    /* ── Autenticación ──────────────────────────────────────── */

    async function loginApi(cuerpo) {
        const email = texto(cuerpo.usuario_cliente).toLowerCase();
        const password = String(cuerpo.password || '');

        if (!email || !password) {
            throw errorApi('Ingresa tu correo y contraseña.', 422, {
                usuario_cliente: ['Ingresa tu correo.'],
                password: ['Ingresa tu contraseña.'],
            });
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            const confirmado = String(error.message || '').toLowerCase().includes('confirm');
            throw errorApi(
                confirmado ? 'Confirma tu correo antes de iniciar sesión.' : 'Correo o contraseña incorrectos.',
                401
            );
        }

        usuarioActual = data.user;
        clienteActual = await obtenerOCrearCliente(data.user);

        if (!clienteActual.estado_cliente) {
            await supabase.auth.signOut();
            throw errorApi('Tu cuenta está desactivada. Contacta a la tienda.', 403);
        }

        return {
            success: true,
            mensaje: 'Sesión iniciada correctamente.',
            cliente: datosCliente(clienteActual),
        };
    }

    async function registroApi(cuerpo) {
        const nombre = texto(cuerpo.nombre_cliente);
        const usuario = texto(cuerpo.usuario_cliente);
        const correo = texto(cuerpo.correo_cliente).toLowerCase();
        const password = String(cuerpo.password || '');
        const confirmacion = String(cuerpo.password_confirmation || '');
        const errores = {};

        if (!nombre) errores.nombre_cliente = ['El nombre es obligatorio.'];
        /* El usuario es opcional: si no viene, la base lo genera del nombre. */
        if (usuario && usuario.length < 4) errores.usuario_cliente = ['El usuario debe tener al menos 4 caracteres.'];
        if (!correo) errores.correo_cliente = ['El correo es obligatorio.'];
        if (!password || password.length < 6) errores.password = ['La contraseña debe tener al menos 6 caracteres.'];
        if (password !== confirmacion) errores.password_confirmation = ['Las contraseñas no coinciden.'];

        if (Object.keys(errores).length) {
            throw errorApi('Revisa los datos del formulario.', 422, errores);
        }

        const datosCuenta = {
            nombre_cliente: nombre,
            telefono_cliente: texto(cuerpo.telefono_cliente) || null,
        };

        if (usuario) datosCuenta.usuario_cliente = usuario;

        const { data, error } = await supabase.auth.signUp({
            email: correo,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}${urlTienda('login')}`,
                data: datosCuenta,
            },
        });

        if (error) {
            const yaExiste = String(error.message || '').toLowerCase().includes('already');
            throw errorApi(
                yaExiste ? 'Ese correo ya está registrado.' : (error.message || 'No se pudo crear la cuenta.'),
                yaExiste ? 422 : 400,
                yaExiste ? { correo_cliente: ['Ese correo ya está registrado.'] } : null
            );
        }

        if (!data.session) {
            /* La cuenta queda pendiente hasta que el cliente confirme el correo.
               TODO: al confirmar, aplicar el descuento de primera compra. */
            return {
                success: true,
                pendiente_confirmacion: true,
                mensaje: 'Cuenta creada. Te enviamos un correo: confírmalo para poder ingresar.',
                cliente: null,
            };
        }

        usuarioActual = data.user;
        clienteActual = await obtenerOCrearCliente(data.user);

        return {
            success: true,
            mensaje: 'Cuenta creada correctamente.',
            cliente: datosCliente(clienteActual),
        };
    }

    async function perfilApi(cuerpo) {
        if (!clienteActual) throw errorApi('Inicia sesión para continuar.', 401);

        const nombre = texto(cuerpo.nombre_cliente);
        const usuario = texto(cuerpo.usuario_cliente);
        const correo = texto(cuerpo.correo_cliente).toLowerCase();

        if (!nombre || !usuario || !correo) {
            throw errorApi('Completa nombre, usuario y correo.', 422);
        }

        const { data, error } = await supabase
            .from('clientes')
            .update({
                nombre_cliente: nombre,
                usuario_cliente: usuario,
                correo_cliente: correo,
                telefono_cliente: texto(cuerpo.telefono_cliente) || null,
                fecha_nacimiento_cliente: texto(cuerpo.fecha_nacimiento_cliente) || null,
                cedula_cliente: texto(cuerpo.cedula_cliente) || null,
            })
            .eq('id_cliente', clienteActual.id_cliente)
            .select('*')
            .single();

        if (error) throw errorDeSupabase(error, 'No se pudo actualizar el perfil.');

        clienteActual = data;
        actualizarHeader(clienteActual);

        return {
            success: true,
            mensaje: 'Perfil actualizado correctamente.',
            cliente: datosCliente(clienteActual),
        };
    }

    async function avatarApi(cuerpo) {
        if (!usuarioActual) throw errorApi('Inicia sesión para continuar.', 401);

        const meta = usuarioActual.user_metadata || {};
        const color = texto(cuerpo.avatar_color || meta.avatar_color).toLowerCase();
        const imagen = 'avatar_imagen' in cuerpo
            ? texto(cuerpo.avatar_imagen)
            : texto(meta.avatar_imagen);
        const fondo = 'avatar_fondo' in cuerpo
            ? texto(cuerpo.avatar_fondo)
            : texto(meta.avatar_fondo);

        if (!/^#[0-9a-f]{6}$/.test(color)) {
            throw errorApi('Elige un color válido para tu avatar.', 422, {
                avatar_color: ['Elige un color válido para tu avatar.'],
            });
        }

        if (imagen && !/^[a-z0-9_-]{1,40}$/i.test(imagen)) {
            throw errorApi('La ilustración del avatar no es válida.', 422);
        }

        if (fondo && !/^[a-z0-9._-]{1,80}$/i.test(fondo)) {
            throw errorApi('La foto de fondo del avatar no es válida.', 422);
        }

        const { data, error } = await supabase.auth.updateUser({
            data: {
                avatar_color: color,
                avatar_imagen: imagen || null,
                avatar_fondo: fondo || null,
            },
        });

        if (error) throw errorDeSupabase(error, 'No se pudo guardar tu avatar.');

        usuarioActual = data.user;
        pintarAvatares(clienteActual ? datosCliente(clienteActual) : null);

        return {
            success: true,
            mensaje: 'Avatar actualizado correctamente.',
            cliente: clienteActual ? datosCliente(clienteActual) : null,
        };
    }

    async function marcosApi() {
        if (!usuarioActual || !clienteActual) throw errorApi('Inicia sesión para continuar.', 401);

        const { data, error } = await supabase.rpc('web_ventas_cliente');

        /* Marco forzado: 'rubi' fuerza uno, 'todos' desbloquea todos. */
        const forzado = texto(usuarioActual?.user_metadata?.marco_avatar_forzado).toLowerCase();
        const todosDesbloqueados = ['todos', 'todos_los_marcos', 'all'].includes(forzado);
        const marcoForzado = MARCOS_AVATAR.find((nivel) => nivel.clave === forzado) || null;

        if (error && !marcoForzado && !todosDesbloqueados) {
            throw errorDeSupabase(error, 'No se pudo cargar tu nivel de compras.');
        }

        const total = error ? 0 : (Number(data?.total ?? data ?? 0) || 0);

        const niveles = MARCOS_AVATAR.map((nivel) => ({
            ...nivel,
            desbloqueado: todosDesbloqueados
                || (marcoForzado ? nivel.ventas <= marcoForzado.ventas : false)
                || total >= nivel.ventas,
        }));

        const desbloqueados = niveles.filter((nivel) => nivel.desbloqueado);
        const siguiente = niveles.find((nivel) => !nivel.desbloqueado) || null;

        const estiloGuardado = texto(usuarioActual?.user_metadata?.marco_avatar_estilo).toLowerCase();
        const marco = desbloqueados.find((nivel) => nivel.clave === estiloGuardado)
            || (desbloqueados.length ? desbloqueados[desbloqueados.length - 1] : null);

        const previo = desbloqueados.length ? desbloqueados[desbloqueados.length - 1].ventas : 0;
        const hasta = siguiente ? siguiente.ventas : (marco ? marco.ventas : 5);
        const avance = siguiente
            ? Math.max(0, Math.min(100, Math.round(((total - previo) / Math.max(1, hasta - previo)) * 100)))
            : 100;

        return {
            success: true,
            ventas: total,
            marco,
            marco_estilo: marco ? marco.clave : null,
            forzado: Boolean(marcoForzado),
            siguiente,
            desbloqueados,
            niveles,
            desde: previo,
            hasta,
            avance,
            faltan: siguiente ? siguiente.ventas - total : 0,
            visible: datosAvatar().marco_avatar,
        };
    }

    async function marcoVisibilidadApi(cuerpo) {
        if (!usuarioActual) throw errorApi('Inicia sesión para continuar.', 401);

        const cambios = {};

        if ('mostrar' in (cuerpo || {})) {
            cambios.marco_avatar = !(cuerpo.mostrar === false || texto(cuerpo.mostrar) === 'false');
        }

        if ('estilo' in (cuerpo || {})) {
            const estilo = texto(cuerpo.estilo).toLowerCase();

            if (estilo) {
                const nivel = MARCOS_AVATAR.find((item) => item.clave === estilo);

                if (!nivel) throw errorApi('Ese marco no existe.', 422);

                const forzado = texto(usuarioActual?.user_metadata?.marco_avatar_forzado).toLowerCase();
                const todos = ['todos', 'todos_los_marcos', 'all'].includes(forzado);
                const nivelForzado = MARCOS_AVATAR.find((item) => item.clave === forzado) || null;
                let total = 0;

                try {
                    const { data } = await supabase.rpc('web_ventas_cliente');
                    total = Number(data?.total ?? data ?? 0) || 0;
                } catch {
                    total = 0;
                }

                if (!todos && !(nivelForzado && nivel.ventas <= nivelForzado.ventas) && total < nivel.ventas) {
                    throw errorApi('Ese marco todavía no está desbloqueado.', 422);
                }
            }

            cambios.marco_avatar_estilo = estilo || null;
            cambios.marco_avatar = true;
        }

        const { data, error } = await supabase.auth.updateUser({ data: cambios });

        if (error) throw errorDeSupabase(error, 'No se pudo guardar la preferencia del marco.');

        usuarioActual = data.user;
        pintarAvatares(clienteActual ? datosCliente(clienteActual) : null);

        return {
            success: true,
            mensaje: cambios.marco_avatar === false ? 'Marco oculto.' : 'Marco actualizado.',
            cliente: clienteActual ? datosCliente(clienteActual) : null,
        };
    }

    function cargarMarcoCliente() {
        window.marcoTiendaPromise = marcosApi()
            .then((datos) => {
                window.marcoTienda = datos;
                pintarAvatares(clienteActual ? datosCliente(clienteActual) : null);
                return datos;
            })
            .catch((error) => {
                console.warn('No se pudo cargar el marco de ventas.', error);
                window.marcoTienda = null;
                return null;
            });

        return window.marcoTiendaPromise;
    }

    async function descuentoPrimeraCompraApi() {
        if (!usuarioActual || !clienteActual) throw errorApi('Inicia sesión para continuar.', 401);

        const faltantes = [];

        if (!texto(clienteActual.telefono_cliente)) faltantes.push('teléfono');
        if (!texto(clienteActual.fecha_nacimiento_cliente)) faltantes.push('fecha de nacimiento');
        if (!cuentaTienePassword()) faltantes.push('contraseña');

        const { count, error } = await supabase
            .from('cliente_direcciones')
            .select('id_direccion_cliente', { count: 'exact', head: true })
            .eq('id_cliente', clienteActual.id_cliente)
            .eq('estado_direccion', true);

        if (error) throw errorDeSupabase(error, 'No se pudieron revisar tus direcciones.');

        if (!count) faltantes.push('dirección');

        if (faltantes.length) {
            throw errorApi(`Completa: ${faltantes.join(', ')}.`, 422);
        }

        const { data, error: errorUpdate } = await supabase.auth.updateUser({
            data: { descuento_primera_compra: true },
        });

        if (errorUpdate) throw errorDeSupabase(errorUpdate, 'No se pudo aplicar el descuento.');

        usuarioActual = data.user;

        return {
            success: true,
            mensaje: 'Descuento de primera compra aplicado: 10% en cualquier producto.',
            cliente: datosCliente(clienteActual),
        };
    }

    async function passwordApi(cuerpo) {
        if (!usuarioActual) throw errorApi('Inicia sesión para continuar.', 401);

        const actual = String(cuerpo.password_actual || '');
        const nueva = String(cuerpo.password_nueva || '');
        const confirmacion = String(cuerpo.password_nueva_confirmation || '');
        const tienePassword = cuentaTienePassword();

        if (!nueva || nueva.length < 6) {
            throw errorApi('La nueva contraseña debe tener al menos 6 caracteres.', 422, {
                password_nueva: ['La nueva contraseña debe tener al menos 6 caracteres.'],
            });
        }

        if (confirmacion && nueva !== confirmacion) {
            throw errorApi('Las contraseñas no coinciden.', 422, {
                password_nueva_confirmation: ['Las contraseñas no coinciden.'],
            });
        }

        /* Una cuenta creada con Google no tiene contraseña: se crea sin pedir la actual. */
        if (tienePassword) {
            if (!actual) {
                throw errorApi('Ingresa tu contraseña actual.', 422, {
                    password_actual: ['Ingresa tu contraseña actual.'],
                });
            }

            const { error: verificacion } = await supabase.auth.signInWithPassword({
                email: usuarioActual.email,
                password: actual,
            });

            if (verificacion) {
                const mensaje = /rate|too many/i.test(String(verificacion.message))
                    ? 'Demasiados intentos. Espera un momento y vuelve a probar.'
                    : 'La contraseña actual no es correcta.';

                throw errorApi(mensaje, 422, { password_actual: [mensaje] });
            }
        }

        const metadata = {
            ...(usuarioActual.user_metadata || {}),
            password_set: true,
        };

        let { data: actualizado, error } = await supabase.auth.updateUser({
            password: nueva,
            data: metadata,
        });

        /* Supabase exige autenticación reciente: se reintenta tras reautenticar. */
        if (error && /reauthentication|reauthenticate|recent|current password/i.test(String(error.message))) {
            if (actual && usuarioActual.email) {
                const { error: reautenticado } = await supabase.auth.signInWithPassword({
                    email: usuarioActual.email,
                    password: actual,
                });

                if (!reautenticado) {
                    ({ data: actualizado, error } = await supabase.auth.updateUser({
                        password: nueva,
                        data: metadata,
                    }));
                }
            }
        }

        if (error) {
            const crudo = String(error.message || '');
            let mensaje = crudo || 'No se pudo actualizar la contraseña.';

            if (/different|same password/i.test(crudo)) {
                mensaje = 'La nueva contraseña debe ser diferente a la actual.';
                marcarPasswordLocal();
            } else if (/already has a password|already set/i.test(crudo)) {
                mensaje = 'Tu cuenta ya tiene contraseña. Ingresa la contraseña actual para cambiarla.';
                marcarPasswordLocal();
            } else if (/reauthentication|reauthenticate|recent|current password/i.test(crudo)) {
                mensaje = 'Por seguridad, ingresa tu contraseña actual para cambiar la contraseña.';
                marcarPasswordLocal();
            }

            throw errorApi(mensaje, 422);
        }

        if (actualizado?.user) {
            usuarioActual = actualizado.user;
        }

        /* La cuenta ya tiene contraseña: el formulario debe pedir la actual
           en el próximo cambio. */
        marcarPasswordLocal();

        return {
            success: true,
            mensaje: tienePassword
                ? 'Contraseña actualizada correctamente.'
                : 'Contraseña creada. Ya puedes entrar también con tu correo.',
        };
    }

    /* ── Direcciones ────────────────────────────────────────── */

    function direccionDatos(fila) {
        return {
            id_direccion_cliente: fila.id_direccion_cliente,
            nombre_direccion: fila.nombre_direccion,
            ubicacion_maps: fila.ubicacion_maps,
            referencia_direccion: fila.referencia_direccion,
            direccion_manual: fila.direccion_manual,
            latitud_direccion: fila.latitud_direccion !== null ? Number(fila.latitud_direccion) : null,
            longitud_direccion: fila.longitud_direccion !== null ? Number(fila.longitud_direccion) : null,
            predeterminada_direccion: Boolean(fila.predeterminada_direccion),
        };
    }

    function enlaceMaps(cuerpo) {
        const enlace = texto(cuerpo.ubicacion_maps);
        if (enlace) return enlace;

        const lat = Number(cuerpo.latitud_direccion);
        const lng = Number(cuerpo.longitud_direccion);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }

    function validarDireccion(cuerpo) {
        if (!texto(cuerpo.nombre_direccion)) {
            throw errorApi('Ponle un nombre a la dirección (Casa, Trabajo, etc.).', 422, {
                nombre_direccion: ['Ponle un nombre a la dirección.'],
            });
        }

        const tieneUbicacion = enlaceMaps(cuerpo)
            || texto(cuerpo.referencia_direccion)
            || texto(cuerpo.direccion_manual);

        if (!tieneUbicacion) {
            throw errorApi('Indica tu ubicación, una referencia o la dirección escrita.', 422, {
                direccion_manual: ['Indica una ubicación, referencia o dirección.'],
            });
        }
    }

    async function listarDireccionesApi() {
        if (!clienteActual) throw errorApi('Inicia sesión para continuar.', 401);

        const { data, error } = await supabase
            .from('cliente_direcciones')
            .select('*')
            .eq('id_cliente', clienteActual.id_cliente)
            .eq('estado_direccion', true)
            .order('predeterminada_direccion', { ascending: false })
            .order('nombre_direccion');

        if (error) throw errorDeSupabase(error, 'No se pudieron cargar las direcciones.');

        return { success: true, direcciones: (data || []).map(direccionDatos) };
    }

    async function guardarDireccionApi(cuerpo, id = null) {
        if (!clienteActual) throw errorApi('Inicia sesión para continuar.', 401);

        validarDireccion(cuerpo);

        const predeterminada = Boolean(cuerpo.predeterminada_direccion) || (!id && !(await tieneDirecciones()));

        if (predeterminada) {
            await supabase
                .from('cliente_direcciones')
                .update({ predeterminada_direccion: false })
                .eq('id_cliente', clienteActual.id_cliente);
        }

        const datos = {
            nombre_direccion: texto(cuerpo.nombre_direccion),
            ubicacion_maps: enlaceMaps(cuerpo),
            referencia_direccion: texto(cuerpo.referencia_direccion) || null,
            direccion_manual: texto(cuerpo.direccion_manual) || null,
            latitud_direccion: Number.isFinite(Number(cuerpo.latitud_direccion)) ? Number(cuerpo.latitud_direccion) : null,
            longitud_direccion: Number.isFinite(Number(cuerpo.longitud_direccion)) ? Number(cuerpo.longitud_direccion) : null,
            predeterminada_direccion: predeterminada,
        };

        if (id) {
            const { data, error } = await supabase
                .from('cliente_direcciones')
                .update(datos)
                .eq('id_direccion_cliente', id)
                .eq('id_cliente', clienteActual.id_cliente)
                .select('*')
                .single();

            if (error) throw errorDeSupabase(error, 'No se pudo actualizar la dirección.');

            return {
                success: true,
                mensaje: 'Dirección actualizada correctamente.',
                direccion: direccionDatos(data),
            };
        }

        const { data, error } = await supabase
            .from('cliente_direcciones')
            .insert({
                ...datos,
                id_cliente: clienteActual.id_cliente,
                estado_direccion: true,
            })
            .select('*')
            .single();

        if (error) throw errorDeSupabase(error, 'No se pudo guardar la dirección.');

        return {
            success: true,
            mensaje: 'Dirección agregada correctamente.',
            direccion: direccionDatos(data),
        };
    }

    async function tieneDirecciones() {
        const { count } = await supabase
            .from('cliente_direcciones')
            .select('id_direccion_cliente', { count: 'exact', head: true })
            .eq('id_cliente', clienteActual.id_cliente)
            .eq('estado_direccion', true);

        return Number(count || 0) > 0;
    }

    async function eliminarDireccionApi(id) {
        if (!clienteActual) throw errorApi('Inicia sesión para continuar.', 401);

        const { data: direccion } = await supabase
            .from('cliente_direcciones')
            .select('predeterminada_direccion')
            .eq('id_direccion_cliente', id)
            .eq('id_cliente', clienteActual.id_cliente)
            .maybeSingle();

        const { error } = await supabase
            .from('cliente_direcciones')
            .delete()
            .eq('id_direccion_cliente', id)
            .eq('id_cliente', clienteActual.id_cliente);

        if (error) throw errorDeSupabase(error, 'No se pudo eliminar la dirección.');

        if (direccion?.predeterminada_direccion) {
            const { data: siguiente } = await supabase
                .from('cliente_direcciones')
                .select('id_direccion_cliente')
                .eq('id_cliente', clienteActual.id_cliente)
                .eq('estado_direccion', true)
                .order('id_direccion_cliente')
                .limit(1)
                .maybeSingle();

            if (siguiente) {
                await supabase
                    .from('cliente_direcciones')
                    .update({ predeterminada_direccion: true })
                    .eq('id_direccion_cliente', siguiente.id_direccion_cliente);
            }
        }

        return { success: true, mensaje: 'Dirección eliminada correctamente.' };
    }

    async function predeterminadaApi(id) {
        if (!clienteActual) throw errorApi('Inicia sesión para continuar.', 401);

        await supabase
            .from('cliente_direcciones')
            .update({ predeterminada_direccion: false })
            .eq('id_cliente', clienteActual.id_cliente);

        const { error } = await supabase
            .from('cliente_direcciones')
            .update({ predeterminada_direccion: true })
            .eq('id_direccion_cliente', id)
            .eq('id_cliente', clienteActual.id_cliente);

        if (error) throw errorDeSupabase(error, 'No se pudo actualizar la dirección.');

        return { success: true, mensaje: 'Dirección predeterminada actualizada.' };
    }

    /* ── Favoritos e historial ──────────────────────────────── */

    async function favoritosApi() {
        if (!clienteActual) throw errorApi('Inicia sesión para continuar.', 401);

        const { data, error } = await supabase.rpc('web_favoritos');

        if (error) throw errorDeSupabase(error, 'No se pudieron cargar los favoritos.');

        return { success: true, favoritos: data || [] };
    }

    async function agregarFavoritoApi(cuerpo) {
        if (!clienteActual) throw errorApi('Inicia sesión para continuar.', 401);

        const idProducto = Number(cuerpo.id_producto);

        if (!Number.isFinite(idProducto)) throw errorApi('Producto no válido.', 422);

        const { error } = await supabase
            .from('cliente_favoritos')
            .upsert({
                id_cliente: clienteActual.id_cliente,
                id_producto: idProducto,
            }, { onConflict: 'id_cliente,id_producto', ignoreDuplicates: true });

        if (error) throw errorDeSupabase(error, 'No se pudo agregar a favoritos.');

        return { success: true, mensaje: 'Producto agregado a favoritos.', id_producto: idProducto };
    }

    async function eliminarFavoritoApi(idProducto) {
        if (!clienteActual) throw errorApi('Inicia sesión para continuar.', 401);

        const { error } = await supabase
            .from('cliente_favoritos')
            .delete()
            .eq('id_cliente', clienteActual.id_cliente)
            .eq('id_producto', Number(idProducto));

        if (error) throw errorDeSupabase(error, 'No se pudo quitar de favoritos.');

        return { success: true, mensaje: 'Producto eliminado de favoritos.' };
    }

    async function historialApi() {
        if (!clienteActual) throw errorApi('Inicia sesión para continuar.', 401);

        const { data, error } = await supabase.rpc('web_historial');

        if (error) throw errorDeSupabase(error, 'No se pudo cargar el historial.');

        return { success: true, compras: data || [] };
    }

    /* ── Reseñas ────────────────────────────────────────────── */

    function fechaResenia(valor) {
        if (!valor) return '';
        const fecha = new Date(valor);
        if (Number.isNaN(fecha.getTime())) return String(valor).slice(0, 16).replace('T', ' ');
        const partes = new Intl.DateTimeFormat('sv-SE', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false,
        }).formatToParts(fecha).reduce((acc, parte) => ({ ...acc, [parte.type]: parte.value }), {});
        return `${partes.year}-${partes.month}-${partes.day} ${partes.hour}:${partes.minute}`;
    }

    async function reseniasApi(idProducto, limite = 0) {
        const { data, error } = await supabase.rpc('web_resenias', { p_id: Number(idProducto) });

        if (error) throw errorDeSupabase(error, 'No se pudieron cargar las opiniones.');

        const datos = data || {};
        const mi = datos.mi_resenia || null;

        const marcoDeResenia = (fila) => {
            if (fila.marco_avatar === false) return null;

            const forzado = texto(fila.marco_forzado).toLowerCase();
            const forzadoNivel = MARCOS_AVATAR.find((nivel) => nivel.clave === forzado);

            if (forzadoNivel) return forzadoNivel.clave;

            const ventas = Number(fila.ventas_total || 0);
            const alcanzado = [...MARCOS_AVATAR].reverse().find((nivel) => ventas >= nivel.ventas);

            return alcanzado ? alcanzado.clave : null;
        };

        const avatarDeResenia = (fila) => ({
            color: /^#[0-9a-f]{6}$/i.test(String(fila.avatar_color || ''))
                ? String(fila.avatar_color).toLowerCase()
                : null,
            fondo: /^[a-z0-9._-]{1,80}$/i.test(String(fila.avatar_fondo || ''))
                ? String(fila.avatar_fondo)
                : null,
            imagen: /^[a-z0-9_-]{1,40}$/i.test(String(fila.avatar_imagen || ''))
                ? String(fila.avatar_imagen)
                : null,
            marco: marcoDeResenia(fila),
        });

        /* El SQL no expone id_cliente: se marca la propia por id_resenia. */
        const lista = (datos.resenias || []).map((resenia) => ({
            ...resenia,
            es_mia: Boolean(mi && Number(resenia.id_resenia) === Number(mi.id_resenia)),
            avatar: avatarDeResenia(resenia),
        }));

        return {
            success: true,
            resumen: datos.resumen || { promedio: 0, total: 0, distribucion: [] },
            resenias: limite > 0 ? lista.slice(0, limite) : lista,
            mi_resenia: mi ? { ...mi, avatar: avatarDeResenia(mi) } : null,
            puede_resenar: Boolean(datos.puede_resenar),
        };
    }

    async function guardarReseniaApi(cuerpo) {
        if (!clienteActual) throw errorApi('Inicia sesión para opinar.', 401);

        const idProducto = Number(cuerpo.id_producto);
        const calificacion = Number(cuerpo.calificacion_resenia);
        const comentario = texto(cuerpo.comentario_resenia);

        if (!Number.isFinite(idProducto) || calificacion < 1 || calificacion > 5) {
            throw errorApi('Selecciona una calificación de 1 a 5 estrellas.', 422);
        }

        const { data: existente } = await supabase
            .from('resenias_productos')
            .select('id_resenia')
            .eq('id_cliente', clienteActual.id_cliente)
            .eq('id_producto', idProducto)
            .maybeSingle();

        if (existente) {
            const { error } = await supabase
                .from('resenias_productos')
                .update({
                    calificacion_resenia: calificacion,
                    comentario_resenia: comentario || null,
                    estado_resenia: true,
                    fecha_actualizacion_resenia: new Date().toISOString(),
                })
                .eq('id_resenia', existente.id_resenia);

            if (error) throw errorDeSupabase(error, 'No se pudo guardar tu opinión.');

            return { success: true, mensaje: 'Opinión actualizada.' };
        }

        const { error } = await supabase
            .from('resenias_productos')
            .insert({
                id_cliente: clienteActual.id_cliente,
                id_producto: idProducto,
                calificacion_resenia: calificacion,
                comentario_resenia: comentario || null,
                estado_resenia: true,
            });

        if (error) throw errorDeSupabase(error, 'No se pudo guardar tu opinión.');

        return { success: true, mensaje: '¡Gracias por tu opinión!' };
    }

    async function eliminarReseniaApi(id) {
        if (!clienteActual) throw errorApi('Inicia sesión para continuar.', 401);

        const { error } = await supabase
            .from('resenias_productos')
            .delete()
            .eq('id_resenia', Number(id))
            .eq('id_cliente', clienteActual.id_cliente);

        if (error) throw errorDeSupabase(error, 'No se pudo eliminar la opinión.');

        return { success: true, mensaje: 'Opinión eliminada.' };
    }

    /* ── Enrutador compatible con la API anterior ───────────── */

    async function solicitar(url, metodo, cuerpo, opciones = {}) {
        const mostrarCarga = Boolean(opciones?.cargando);

        if (mostrarCarga) window.tiendaCargando?.(true, true);

        try {
        const rutas = {
            'GET /tienda/api/auth/sesion': () => cargarSesion(),

            'POST /tienda/api/auth/login': () => loginApi(cuerpo),

            'POST /tienda/api/auth/registro': () => registroApi(cuerpo),

            'POST /tienda/api/auth/logout': async () => {
                await supabase.auth.signOut();
                usuarioActual = null;
                clienteActual = null;
                return { success: true, mensaje: 'Sesión cerrada correctamente.' };
            },

            'PUT /tienda/api/perfil': () => perfilApi(cuerpo),

            'PUT /tienda/api/perfil/avatar': () => avatarApi(cuerpo),

            'GET /tienda/api/perfil/marco': () => marcosApi(),

            'PUT /tienda/api/perfil/marco': () => marcoVisibilidadApi(cuerpo),

            'PUT /tienda/api/perfil/password': () => passwordApi(cuerpo),

            'POST /tienda/api/descuento/primera-compra': () => descuentoPrimeraCompraApi(),

            'GET /tienda/api/direcciones': () => listarDireccionesApi(),

            'POST /tienda/api/direcciones': () => guardarDireccionApi(cuerpo),

            'GET /tienda/api/favoritos': () => favoritosApi(),

            'POST /tienda/api/favoritos': () => agregarFavoritoApi(cuerpo),

            'GET /tienda/api/historial': () => historialApi(),

            'POST /tienda/api/resenias': () => guardarReseniaApi(cuerpo),
        };

        const clave = `${metodo} ${url}`;

        const esRutaAuth = url.startsWith('/tienda/api/auth/');

        if (!esRutaAuth && window.sesionTiendaPromise) {
            try {
                await window.sesionTiendaPromise;
            } catch (error) {
                // Continúa sin sesión.
            }
        }

        if (rutas[clave]) {
            return rutas[clave]();
        }

        const direccionEditar = url.match(/^\/tienda\/api\/direcciones\/(\d+)$/);

        if (direccionEditar && metodo === 'PUT') {
            return guardarDireccionApi(cuerpo, Number(direccionEditar[1]));
        }

        if (direccionEditar && metodo === 'DELETE') {
            return eliminarDireccionApi(Number(direccionEditar[1]));
        }

        const direccionPredeterminada = url.match(/^\/tienda\/api\/direcciones\/(\d+)\/predeterminada$/);

        if (direccionPredeterminada && metodo === 'POST') {
            return predeterminadaApi(Number(direccionPredeterminada[1]));
        }

        const favoritoEliminar = url.match(/^\/tienda\/api\/favoritos\/(\d+)$/);

        if (favoritoEliminar && metodo === 'DELETE') {
            return eliminarFavoritoApi(Number(favoritoEliminar[1]));
        }

        const reseniasListar = url.match(/^\/tienda\/api\/productos\/(\d+)\/resenias(?:\?.*)?$/);

        if (reseniasListar && metodo === 'GET') {
            const limite = Number((url.match(/[?&]limite=(\d+)/) || [])[1] || 0);
            return reseniasApi(Number(reseniasListar[1]), limite);
        }

        const reseniaEliminar = url.match(/^\/tienda\/api\/resenias\/(\d+)$/);

        if (reseniaEliminar && metodo === 'DELETE') {
            return eliminarReseniaApi(Number(reseniaEliminar[1]));
        }

        throw errorApi(`Ruta no disponible: ${clave}`, 404);
        } finally {
            if (mostrarCarga) window.tiendaCargando?.(false);
        }
    }

    window.TiendaAPI = {
        get: (url, opciones = {}) => solicitar(url, 'GET', undefined, opciones),
        post: (url, cuerpo, opciones = {}) => solicitar(url, 'POST', cuerpo, opciones),
        put: (url, cuerpo, opciones = {}) => solicitar(url, 'PUT', cuerpo, opciones),
        delete: (url, opciones = {}) => solicitar(url, 'DELETE', undefined, opciones),
        csrf: () => '',
    };

    /* ── Catálogo: intercepta las rutas del API anterior ────── */

    function respuestaJson(datos, status = 200) {
        return new Response(JSON.stringify(datos), {
            status,
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        });
    }

    window.fetch = async (recurso, opciones = {}) => {
        const urlTexto = typeof recurso === 'string' ? recurso : recurso.url;
        const metodo = String(opciones.method || 'GET').toUpperCase();

        try {
            const url = new URL(urlTexto, window.location.origin);

            if (url.origin === window.location.origin && metodo === 'GET') {
                if (url.pathname === '/tienda/api/productos') {
                    const { data, error } = await supabase.rpc('web_productos');
                    if (error) throw error;
                    return respuestaJson({ success: true, productos: data || [] });
                }

                const detalle = url.pathname.match(/^\/tienda\/api\/productos\/(\d+)$/);

                if (detalle) {
                    const { data, error } = await supabase.rpc('web_producto', { p_id: Number(detalle[1]) });
                    if (error) throw error;

                    if (!data) {
                        return respuestaJson({ success: false, mensaje: 'Producto no encontrado.' }, 404);
                    }

                    return respuestaJson({ success: true, producto: data });
                }

                /* Ruta del API sin controlador: responde JSON en vez de ir a la red. */
                if (url.pathname.startsWith('/tienda/api/')) {
                    return respuestaJson({ success: false, mensaje: 'Ruta no disponible.' }, 404);
                }
            }
        } catch (error) {
            console.error('Error de catálogo en Supabase:', error);
            return respuestaJson({ success: false, mensaje: 'No se pudo cargar el catálogo.' }, 500);
        }

        return fetchOriginal(recurso, opciones);
    };
})();
