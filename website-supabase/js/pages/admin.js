/* ============================================================================
   Tienda · Panel administrador móvil
   - Login con usuario/contraseña del ERP (token propio).
   - Pedidos: consulta y logística segura.
   - Promociones, cupones y repartidores: control rápido.
   - Cierre de delivery: arqueo por periodo.
   - Cuentas por cobrar: consulta y contacto.
   ========================================================================== */

(() => {
    'use strict';

    const CLAVE_SESION = 'tienda_admin_sesion';
    const RUTA_LOGIN = '/tienda/admin-login';
    const config = window.SUPABASE_CONFIG || {};
    const API = config.url ? `${String(config.url).replace(/\/+$/, '')}/rest/v1/rpc/` : '';

    const $ = (selector, contexto = document) => contexto.querySelector(selector);
    const $$ = (selector, contexto = document) => [...contexto.querySelectorAll(selector)];

    const estado = {
        vista: 'pedidos',
        cargada: { pedidos: false, promociones: false, cupones: false, trabajadores: false, cambios: false, cierre: false, cobros: false, sorteo: false, avisos: false },
        pedidos: [],
        promociones: [],
        cupones: [],
        trabajadores: [],
        cambios: [],
        cierre: { repartidores: [], totales: {} },
        cuentas: [],
        sorteo: [],
        avisos: { dispositivos: 0, clientes: 0, historial: [], lista: [], destino: 'todos', tipo: 'mensaje', promociones: [], enviando: false },
        productos: null,
        filtros: { pedidos: 'solicitado', pedidosDia: hoyISO(), promociones: '', trabajadores: 'pendiente', cambios: 'pendiente', cobros: 'todas', sorteo: 'todos' },
        busquedas: { pedidos: '', cobros: '', cierre: '', sorteo: '' },
        resumenCobros: {},
        config: { autoAceptar: false, cargada: false },
    };

    let temporizadorBusqueda = null;
    let resolverDialogo = null;
    let ultimoFoco = null;
    let selectorFechaPedidos = null;
    let selectorCierreDesde = null;
    let selectorCierreHasta = null;

    /* ───────────────────────── Utilidades ───────────────────────── */

    function escapar(valor) {
        return String(valor ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizar(valor) {
        return String(valor ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    /* Cada palabra debe aparecer en algún dato; los dígitos también coinciden
       sin guiones ni espacios (teléfonos). */
    function coincideBusqueda(consulta, valores) {
        const terminos = normalizar(consulta).split(/\s+/).filter(Boolean);
        if (!terminos.length) return true;

        const texto = valores.filter(Boolean).join(' ');
        const indice = normalizar(texto);
        const digitos = soloDigitos(texto);

        return terminos.every((parte) => indice.includes(parte) || (digitos && digitos.includes(parte)));
    }

    function moneda(valor) {
        const numero = Number(valor) || 0;
        const formato = new Intl.NumberFormat('es-NI', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numero);

        return `C$ ${formato}`;
    }

    function fecha(valor) {
        if (!valor) return null;

        const texto = String(valor).trim();
        const fechaLocal = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(texto)
            ? new Date(texto.replace(' ', 'T'))
            : new Date(texto);

        return Number.isNaN(fechaLocal.getTime()) ? null : fechaLocal;
    }

    function fechaCorta(valor) {
        const dato = fecha(valor);
        if (!dato) return '—';

        const dia = dato.getDate();
        const mes = dato.toLocaleDateString('es-NI', { month: 'short' }).replace('.', '');
        const hora = dato.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });

        return `${dia} ${mes} · ${hora}`;
    }

    function fechaDia(valor) {
        const texto = String(valor ?? '').trim();

        if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
            const [anio, mes, dia] = texto.split('-');
            return `${dia}/${mes}/${anio}`;
        }

        const dato = fecha(valor);
        if (!dato) return '—';

        return dato.toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function fechaCompleta(valor) {
        const texto = String(valor ?? '').trim();
        let dato = null;

        if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
            const [anio, mes, dia] = texto.split('-').map(Number);
            dato = new Date(anio, mes - 1, dia);
        } else {
            dato = fecha(valor);
        }

        if (!dato || Number.isNaN(dato.getTime())) return '—';

        const dia = dato.getDate();
        const mes = dato.toLocaleDateString('es-NI', { month: 'long' });
        const anio = dato.getFullYear();

        return `${dia} de ${mes} del ${anio}`;
    }

    function fechaISO(valor) {
        const dato = fecha(valor);
        if (!dato) return '';

        return [
            dato.getFullYear(),
            String(dato.getMonth() + 1).padStart(2, '0'),
            String(dato.getDate()).padStart(2, '0'),
        ].join('-');
    }

    function fechaDesdeISO(valor) {
        const [anio, mes, dia] = String(valor ?? '').split('-').map(Number);
        if (!anio || !mes || !dia) return new Date();
        return new Date(anio, mes - 1, dia);
    }

    function hoyISO() {
        return fechaISO(new Date());
    }

    function soloDigitos(valor) {
        return String(valor ?? '').replace(/\D+/g, '');
    }

    function telefonoWa(valor) {
        let digitos = soloDigitos(valor);
        if (!digitos) return '';
        if (digitos.length === 8) digitos = `505${digitos}`;
        return digitos;
    }

    function enlaceWhatsApp(valor, texto) {
        const numero = telefonoWa(valor);
        if (!numero) return '';
        return `https://wa.me/${numero}?text=${encodeURIComponent(texto || 'Hola, te escribimos de Tellez Nic Store.')}`;
    }

    function enlaceMapa(pedido) {
        const lat = Number(pedido?.latitud);
        const lng = Number(pedido?.longitud);

        if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return '';

        return `https://www.google.com/maps?q=${lat},${lng}`;
    }

    function urlImagenPromocion(valor) {
        const texto = String(valor ?? '').trim();
        if (!texto) return '';
        if (/^https?:\/\//i.test(texto) || texto.startsWith('/')) return texto;
        if (/^[a-z0-9._\-/]+$/i.test(texto)) return `/imagenes/promociones/${encodeURIComponent(texto)}`;
        return '';
    }

    function inicial(nombre) {
        return String(nombre || '?').trim().charAt(0).toUpperCase() || '?';
    }

    function etiquetaEstado(valor) {
        return {
            solicitado: 'Solicitado',
            aceptado: 'Aceptado',
            preparando: 'Preparando',
            enviado: 'Enviado',
            listo_retiro: 'Listo para retiro',
            entregado: 'Entregado',
            rechazado: 'Rechazado',
            cancelado: 'Cancelado',
            devuelto: 'Devuelto',
        }[valor] || valor || '—';
    }

    function claseEstado(valor) {
        if (['entregado'].includes(valor)) return 'admin-badge--verde';
        if (['solicitado', 'preparando'].includes(valor)) return 'admin-badge--ambar';
        if (['cancelado', 'rechazado', 'devuelto'].includes(valor)) return 'admin-badge--rojo';
        if (['aceptado', 'enviado', 'listo_retiro'].includes(valor)) return 'admin-badge--azul';
        return '';
    }

    function etiquetaPago(valor) {
        return {
            pendiente: 'Pendiente',
            en_revision: 'En revisión',
            pagado: 'Pagado',
            parcial: 'Parcial',
            reembolsado: 'Reembolsado',
        }[valor] || valor || '—';
    }

    function clasePago(valor) {
        if (valor === 'pagado') return 'admin-badge--verde';
        if (['pendiente', 'en_revision', 'parcial'].includes(valor)) return 'admin-badge--ambar';
        if (valor === 'reembolsado') return 'admin-badge--rojo';
        return '';
    }

    function etiquetaEntrega(valor) {
        return {
            delivery: 'Delivery',
            encomienda: 'Encomienda',
            retiro: 'Retiro',
        }[valor] || valor || '—';
    }

    function etiquetaMetodoPago(valor) {
        return {
            efectivo: 'Efectivo',
            lafise: 'Lafise',
            billetera_movil: 'Billetera móvil',
            transferencia: 'Transferencia',
            tarjeta: 'Tarjeta',
        }[valor] || valor || '—';
    }

    function etiquetaTrabajador(valor) {
        return {
            pendiente: 'Pendiente',
            aprobado: 'Aprobado',
            rechazado: 'Rechazado',
            suspendido: 'Suspendido',
        }[valor] || valor || '—';
    }

    function claseTrabajador(valor) {
        if (valor === 'aprobado') return 'admin-badge--verde';
        if (valor === 'pendiente') return 'admin-badge--ambar';
        if (['rechazado', 'suspendido'].includes(valor)) return 'admin-badge--rojo';
        return '';
    }

    function etiquetaCuenta(valor) {
        return {
            pendiente: 'Pendiente',
            parcial: 'Parcial',
            atrasada: 'Atrasada',
            pagada: 'Pagada',
        }[valor] || valor || '—';
    }

    function claseCuenta(valor) {
        if (valor === 'pagada') return 'admin-badge--verde';
        if (valor === 'atrasada') return 'admin-badge--rojo';
        if (['pendiente', 'parcial'].includes(valor)) return 'admin-badge--ambar';
        return '';
    }

    function valorDescuento(tipo, valor) {
        const numero = Number(valor) || 0;

        if (!tipo) return 'Sin descuento';
        if (tipo === 'porcentaje') return `${numero % 1 === 0 ? numero : numero.toFixed(2)}%`;
        if (tipo === 'precio') return `${moneda(numero)} final`;
        return `${moneda(numero)} menos`;
    }

    function rangoPromocion(promocion) {
        const fechaInicio = fecha(promocion?.fecha_inicio);
        const fechaFin = fecha(promocion?.fecha_fin);

        if (!fechaInicio) {
            return {
                fecha: 'Sin fecha asignada',
                detalle: 'Sin duración',
                estado: 'neutral',
            };
        }

        const fechaTexto = fechaFin
            ? `${escapar(fechaCompleta(promocion.fecha_inicio))} al ${escapar(fechaCompleta(promocion.fecha_fin))}`
            : `${escapar(fechaCompleta(promocion.fecha_inicio))} · sin fecha final`;

        if (!fechaFin) {
            return {
                fecha: fechaTexto,
                detalle: 'Sin fecha final',
                estado: 'neutral',
            };
        }

        const msDia = 1000 * 60 * 60 * 24;
        const totalDias = Math.max(1, Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / msDia) + 1);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const diasRestantes = Math.max(0, Math.ceil((fechaFin.getTime() - hoy.getTime()) / msDia));
        const vencida = diasRestantes <= 0;

        return {
            fecha: fechaTexto,
            detalle: `${totalDias} días · quedan ${diasRestantes}`,
            estado: vencida ? 'rojo' : 'verde',
        };
    }

    function estadoPromocion(promocion) {
        const fechaFin = fecha(promocion?.fecha_fin);
        const vencida = fechaFin ? new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate(), 23, 59, 59).getTime() < Date.now() : false;

        if (vencida) return { nombre: 'Vencida', icono: 'bi-clock', clase: 'estado-vencida', filtro: 'vencida' };
        if (promocion?.activa === false || promocion?.estado === false) return { nombre: 'Pausada', icono: 'bi-slash-circle', clase: 'estado-pausada', filtro: 'pausada' };
        return { nombre: 'Disponible', icono: 'bi-check-circle-fill', clase: 'estado-disponible', filtro: 'disponible' };
    }

    /* ───────────────────────── Sesión y API ───────────────────────── */

    function leerSesion() {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null');
            return datos && datos.token && Number(datos.expira) > Date.now() ? datos : null;
        } catch {
            return null;
        }
    }

    function cerrarSesionLocal(motivo = '') {
        try { localStorage.removeItem(CLAVE_SESION); } catch { /* sin storage */ }

        const destino = motivo
            ? `${RUTA_LOGIN}?motivo=${encodeURIComponent(motivo)}`
            : RUTA_LOGIN;

        window.location.replace(destino);
    }

    async function rpc(nombre, parametros) {
        if (!API) throw new Error('Supabase no está configurado.');

        let respuesta;

        try {
            respuesta = await fetch(API + nombre, {
                method: 'POST',
                headers: {
                    apikey: config.key,
                    Authorization: `Bearer ${config.key}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(parametros),
            });
        } catch {
            throw new Error('No hay conexión con el servidor. Revisa tu internet.');
        }

        let datos = null;

        try {
            datos = await respuesta.json();
        } catch {
            datos = null;
        }

        if (!respuesta.ok) {
            throw new Error(datos?.mensaje || datos?.message || 'No se pudo completar la solicitud.');
        }

        return datos || {};
    }

    async function adminRpc(nombre, parametros = {}) {
        const sesion = leerSesion();

        if (!sesion) {
            cerrarSesionLocal('expirada');
            throw new Error('Sesión expirada.');
        }

        const datos = await rpc(nombre, { p_token: sesion.token, ...parametros });

        if (datos?.sesion === false) {
            cerrarSesionLocal('expirada');
            throw new Error(datos.mensaje || 'Sesión expirada.');
        }

        if (datos?.success === false) {
            throw new Error(datos.mensaje || 'No se pudo completar la solicitud.');
        }

        return datos;
    }

    /* ───────────────────────── UI base ───────────────────────── */

    function actualizarContador(contador, cantidad) {
        if (!contador) return;

        const singular = contador.dataset.singular || 'resultado';
        const plural = contador.dataset.plural || 'resultados';
        const etiqueta = `${cantidad} ${cantidad === 1 ? singular : plural}`;

        contador.textContent = etiqueta;
        contador.setAttribute('aria-label', etiqueta);
    }

    function cargando(contenedor, cantidad = 3) {
        if (!contenedor) return;
        contenedor.innerHTML = Array.from({ length: cantidad }, () => '<div class="admin-esqueleto"></div>').join('');
    }

    function vacio(contenedor, icono, titulo, texto) {
        if (!contenedor) return;
        contenedor.innerHTML = `
            <div class="admin-vacio">
                <i class="bi ${icono}" aria-hidden="true"></i>
                <strong>${escapar(titulo)}</strong>
                <p>${escapar(texto)}</p>
            </div>
        `;
    }

    function mostrarToast(mensaje, tipo = 'exito') {
        const toast = $('#adminToast');
        if (!toast) return;

        toast.textContent = mensaje;
        toast.classList.toggle('admin-toast--error', tipo === 'error');
        toast.hidden = false;

        clearTimeout(mostrarToast.temporizador);
        mostrarToast.temporizador = setTimeout(() => { toast.hidden = true; }, 3400);
    }

    function abrirSheet(titulo, subtitulo, contenido, opciones = {}) {
        const sheet = $('#adminSheet');
        if (!sheet) return;

        ultimoFoco = document.activeElement;
        $('#adminSheetTitulo').textContent = titulo || 'Detalle';
        $('#adminSheetSubtitulo').textContent = subtitulo || '';
        $('#adminSheetContenido').innerHTML = contenido || '';
        sheet.hidden = false;
        document.body.classList.add('admin-sheet-abierto');
        $('#adminSheetContenido').scrollTop = 0;

        setTimeout(() => {
            const primerCampo = opciones.enfocar === false
                ? null
                : $('#adminSheetContenido input, #adminSheetContenido select, #adminSheetContenido textarea, #adminSheetContenido button');
            (primerCampo || $('.admin-sheet__cerrar'))?.focus();
        }, 30);
    }

    function cerrarSheet() {
        const sheet = $('#adminSheet');
        if (!sheet) return;

        sheet.hidden = true;
        document.body.classList.remove('admin-sheet-abierto');
        $('#adminSheetContenido').innerHTML = '';

        if (ultimoFoco && typeof ultimoFoco.focus === 'function') {
            setTimeout(() => ultimoFoco.focus(), 10);
        }
    }

    function cerrarAyudas(excepto = null) {
        $$('.admin-ayuda').forEach((contenedor) => {
            if (contenedor === excepto) return;

            const boton = $('[data-ayuda-boton]', contenedor);
            const panel = $('.admin-ayuda__panel', contenedor);

            if (!boton || !panel) return;

            boton.setAttribute('aria-expanded', 'false');
            panel.hidden = true;
        });
    }

    function alternarAyuda(boton) {
        const contenedor = boton.closest('.admin-ayuda');
        const panel = contenedor ? $('.admin-ayuda__panel', contenedor) : null;

        if (!contenedor || !panel) return;

        const abrir = panel.hidden;

        cerrarAyudas(contenedor);
        panel.hidden = !abrir;
        boton.setAttribute('aria-expanded', abrir ? 'true' : 'false');

        if (abrir) {
            panel.focus({ preventScroll: true });
        } else {
            boton.focus({ preventScroll: true });
        }
    }

    function confirmar(mensaje, textoAceptar = 'Confirmar') {
        return new Promise((resolver) => {
            $('#adminDialogoMensaje').textContent = mensaje;
            $('#adminDialogoAceptar').textContent = textoAceptar;
            $('#adminDialogo').hidden = false;
            resolverDialogo = resolver;
            $('#adminDialogoCancelar').focus();
        });
    }

    function cerrarDialogo(valor) {
        $('#adminDialogo').hidden = true;
        if (resolverDialogo) {
            const resolver = resolverDialogo;
            resolverDialogo = null;
            resolver(valor);
        }
    }

    /* ───────────────────────── Resumen ───────────────────────── */

    async function cargarResumen() {
        try {
            const datos = await adminRpc('web_admin_resumen');
            const resumen = datos.resumen || {};
            const badgePedidos = $('#navBadgePedidos');
            const badgeTrabajadores = $('#navBadgeTrabajadores');

            const pedidos = Number(resumen.pedidos_solicitados) || 0;
            const trabajadores = Number(resumen.trabajadores_pendientes) || 0;

            if (badgePedidos) {
                badgePedidos.textContent = pedidos > 9 ? '9+' : String(pedidos);
                badgePedidos.hidden = pedidos <= 0;
            }

            if (badgeTrabajadores) {
                badgeTrabajadores.textContent = trabajadores > 9 ? '9+' : String(trabajadores);
                badgeTrabajadores.hidden = trabajadores <= 0;
            }
        } catch (error) {
            if (!String(error.message).toLowerCase().includes('sesión')) {
                mostrarToast(error.message, 'error');
            }
        }
    }

    /* ───────────────────────── Navegación ───────────────────────── */

    function mostrarVista(vista) {
        if (!['pedidos', 'promociones', 'cupones', 'trabajadores', 'cambios', 'cierre', 'cobros', 'sorteo', 'avisos'].includes(vista)) vista = 'pedidos';

        cerrarAyudas();
        estado.vista = vista;

        $$('.admin-vista').forEach((seccion) => {
            seccion.hidden = seccion.dataset.vista !== vista;
        });

        $$('.admin-nav__item').forEach((boton) => {
            const activo = boton.dataset.vista === vista;
            boton.classList.toggle('is-activo', activo);
            boton.setAttribute('aria-current', activo ? 'page' : 'false');
        });

        try { history.replaceState(null, '', `#${vista}`); } catch { /* sin history */ }

        if (!estado.cargada[vista]) {
            cargarVista(vista);
        }
    }

    function cargarVista(vista = estado.vista) {
        switch (vista) {
            case 'promociones': return cargarPromociones();
            case 'cupones': return cargarCupones();
            case 'trabajadores': return cargarTrabajadores();
            case 'cambios': return cargarCambios();
            case 'cierre': return cargarCierre();
            case 'cobros': return cargarCobros();
            case 'sorteo': return cargarSorteo();
            case 'avisos': return cargarAvisos();
            default: return cargarPedidos();
        }
    }

    async function refrescar() {
        estado.cargada[estado.vista] = false;
        await Promise.all([cargarResumen(), cargarVista(), cargarConfiguracionPedidos()]);
        mostrarToast('Datos actualizados.');
    }

    /* ───────────────────────── Pedidos ───────────────────────── */

    async function cargarPedidos() {
        const contenedor = $('#listaPedidos');
        cargando(contenedor);

        try {
            const datos = await adminRpc('web_admin_pedidos', { p_estado: 'todos' });
            estado.pedidos = Array.isArray(datos.pedidos) ? datos.pedidos : [];
            estado.cargada.pedidos = true;
            renderPedidos();
            cargarResumen();
        } catch (error) {
            vacio(contenedor, 'bi-exclamation-triangle', 'No se pudieron cargar los pedidos', error.message);
        }
    }

    function fechaRelativa(valor) {
        const fechaBase = new Date();
        const dias = valor === 'ayer' ? 1 : (valor === 'antier' ? 2 : 0);
        fechaBase.setDate(fechaBase.getDate() - dias);
        return fechaBase;
    }

    function presetParaFecha(diaISO) {
        if (!diaISO) return 'todos';
        if (diaISO === hoyISO()) return 'hoy';
        if (diaISO === fechaISO(fechaRelativa('ayer'))) return 'ayer';
        if (diaISO === fechaISO(fechaRelativa('antier'))) return 'antier';
        return 'otro';
    }

    function iniciarFechaPedidos() {
        const input = $('#pedidosFechaEspecifica');
        const preset = $('#pedidosRangoDia');
        if (!input) return;

        estado.filtros.pedidosDia = estado.filtros.pedidosDia || hoyISO();
        if (preset) preset.value = presetParaFecha(estado.filtros.pedidosDia);

        if (!window.flatpickr) {
            input.value = fechaDia(estado.filtros.pedidosDia);
            input.addEventListener('change', () => {
                if (!input.value.trim()) {
                    estado.filtros.pedidosDia = null;
                    if (preset) preset.value = 'todos';
                    renderPedidos();
                    return;
                }

                const partes = input.value.split('/');
                if (partes.length !== 3) return;

                const iso = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
                if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return;

                estado.filtros.pedidosDia = iso;
                if (preset) preset.value = presetParaFecha(iso);
                renderPedidos();
            });
            return;
        }

        selectorFechaPedidos = window.flatpickr(input, {
            locale: window.flatpickr.l10ns?.es || 'es',
            dateFormat: 'd/m/Y',
            allowInput: true,
            disableMobile: true,
            maxDate: 'today',
            defaultDate: fechaDesdeISO(estado.filtros.pedidosDia),
            onChange: (fechas) => {
                if (!fechas.length) {
                    estado.filtros.pedidosDia = null;
                    if (preset) preset.value = 'todos';
                    renderPedidos();
                    return;
                }

                const diaISO = fechaISO(fechas[0]);
                estado.filtros.pedidosDia = diaISO;
                if (preset) preset.value = presetParaFecha(diaISO);
                renderPedidos();
            },
            onClose: () => {
                if (preset) preset.value = presetParaFecha(estado.filtros.pedidosDia);
            },
        });
    }

    function iniciarFechasPromocion() {
        if (!window.flatpickr) return;

        ['promoInicio', 'promoFin'].forEach((id) => {
            const input = document.getElementById(id);
            if (!input || input._flatpickr) return;

            const botonLimpiar = document.getElementById(`${id}Limpiar`);

            const aplicarFormato = (fechas, _texto, instancia) => {
                if (!instancia?.altInput) return;

                instancia.altInput.value = fechas?.length
                    ? fechaCompleta(instancia.formatDate(fechas[0], 'Y-m-d'))
                    : '';

                if (botonLimpiar) botonLimpiar.hidden = !fechas?.length;
            };

            const selector = window.flatpickr(input, {
                locale: window.flatpickr.l10ns?.es || 'es',
                dateFormat: 'Y-m-d',
                altInput: true,
                altFormat: 'd/m/Y',
                altInputClass: '',
                allowInput: false,
                disableMobile: true,
                defaultDate: input.value || null,
                onReady: aplicarFormato,
                onClose: aplicarFormato,
            });

            botonLimpiar?.addEventListener('click', () => {
                selector.clear(false);
                if (selector.altInput) selector.altInput.value = '';
                botonLimpiar.hidden = true;
            });
        });
    }

    function iniciarFechasCierre() {
        if (!window.flatpickr) return;

        const configuracion = {
            locale: window.flatpickr.l10ns?.es || 'es',
            dateFormat: 'Y-m-d',
            altInput: true,
            altFormat: 'd/m/Y',
            altInputClass: '',
            allowInput: false,
            disableMobile: true,
            maxDate: 'today',
        };

        const aplicarFormato = (fechas, _texto, instancia) => {
            if (!instancia?.altInput) return;

            instancia.altInput.value = fechas?.length
                ? fechaCompleta(instancia.formatDate(fechas[0], 'Y-m-d'))
                : '';
        };

        const desde = $('#cierreDesde');
        const hasta = $('#cierreHasta');

        if (desde) {
            selectorCierreDesde = window.flatpickr(desde, {
                ...configuracion,
                defaultDate: desde.value || hoyISO(),
                onReady: aplicarFormato,
                onClose: aplicarFormato,
            });
        }

        if (hasta) {
            selectorCierreHasta = window.flatpickr(hasta, {
                ...configuracion,
                defaultDate: hasta.value || hoyISO(),
                onReady: aplicarFormato,
                onClose: aplicarFormato,
            });
        }
    }

    function pintarAutoAceptar() {
        const boton = $('#btnAutoAceptar');
        if (!boton) return;

        const activo = Boolean(estado.config.autoAceptar);
        const texto = $('#autoAceptarEstado');

        boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
        boton.disabled = !estado.config.cargada;
        boton.title = estado.config.cargada
            ? (activo ? 'Desactivar aceptación automática' : 'Activar aceptación automática')
            : 'Configuración no disponible. Ejecuta supabase/autoaceptar-pedidos.sql en Supabase y recarga.';

        if (texto) texto.textContent = activo ? 'Sí' : 'No';
    }

    async function cargarConfiguracionPedidos() {
        const boton = $('#btnAutoAceptar');
        if (!boton) return;

        try {
            const datos = await adminRpc('web_admin_configuracion');
            estado.config.autoAceptar = Boolean(datos.auto_aceptar_pedidos);
            estado.config.cargada = true;
        } catch {
            estado.config.cargada = false;
        }

        pintarAutoAceptar();
    }

    async function alternarAutoAceptar() {
        if (!estado.config.cargada) return;

        const boton = $('#btnAutoAceptar');
        if (!boton) return;

        const nuevo = !estado.config.autoAceptar;
        boton.disabled = true;

        try {
            const datos = await adminRpc('web_admin_configuracion_actualizar', { p_auto_aceptar: nuevo });
            estado.config.autoAceptar = Boolean(datos.auto_aceptar_pedidos ?? nuevo);
            estado.config.cargada = true;
            mostrarToast(estado.config.autoAceptar ? 'Aceptación automática activada.' : 'Aceptación automática desactivada.');
        } catch (error) {
            mostrarToast(error?.message || 'No se pudo guardar la configuración.', 'error');
        } finally {
            pintarAutoAceptar();
        }
    }

    function renderPedidos() {
        const contenedor = $('#listaPedidos');
        if (!contenedor) return;

        const filtro = estado.filtros.pedidos;
        const dia = estado.filtros.pedidosDia;

        const lista = estado.pedidos.filter((pedido) => {
            if (dia && fechaISO(pedido.fecha) !== dia) return false;

            if (filtro === 'en_camino') {
                if (!['enviado', 'listo_retiro'].includes(pedido.estado)) return false;
            } else if (filtro !== 'todos' && pedido.estado !== filtro) {
                return false;
            }

            return coincideBusqueda(estado.busquedas.pedidos, [
                pedido.numero,
                pedido.cliente,
                pedido.telefono,
                pedido.recibe,
            ]);
        });

        actualizarContador($('#pedidosContador'), lista.length);

        if (!lista.length) {
            vacio(
                contenedor,
                'bi-bag',
                estado.pedidos.length ? 'Sin pedidos con ese filtro' : 'Todavía no hay pedidos web',
                estado.pedidos.length ? 'Prueba con otro estado, otro día o borra la búsqueda.' : 'Cuando un cliente compre, el pedido aparecerá aquí.'
            );
            return;
        }

        contenedor.innerHTML = lista.map((pedido) => {
            const wa = enlaceWhatsApp(pedido.telefono, `Hola ${pedido.cliente || ''}, te escribimos de Tellez Nic Store por tu pedido ${pedido.numero || ''}.`);
            const puedeCobrar = Boolean(pedido.puede_cobrar);
            const puedeAceptar = Boolean(pedido.puede_aceptar);
            const puedePagar = Boolean(pedido.puede_pagar);
            const puedeCancelar = Boolean(pedido.puede_cancelar);
            const esAceptado = pedido.estado === 'aceptado';
            const etiquetaAceptar = esAceptado ? 'Facturar' : 'Aceptar';
            const estadoCancelar = esAceptado ? 'cancelado' : 'rechazado';
            const etiquetaCancelar = esAceptado ? 'Cancelar' : 'Rechazar';
            const etiquetaPendiente = puedeCobrar
                ? 'Por cobrar'
                : (puedeAceptar ? (esAceptado ? 'Por facturar' : 'Por aceptar') : (puedePagar ? 'Cobro en delivery' : ''));
            const puedeEnviar = pedido.facturado && pedido.estado === 'aceptado' && pedido.pago === 'pagado';
            const puedeEntregar = pedido.facturado && ['enviado', 'listo_retiro'].includes(pedido.estado) && pedido.pago === 'pagado';

            return `
                <article class="admin-card">
                    <div class="admin-card__fila">
                        <div class="admin-card__titulo">
                            <strong>${escapar(pedido.numero || 'Pedido sin número')}</strong>
                            <span>${escapar(fechaCorta(pedido.fecha))}</span>
                        </div>
                        <span class="admin-badge ${claseEstado(pedido.estado)}">${escapar(etiquetaEstado(pedido.estado))}</span>
                    </div>

                    <div class="admin-meta">
                        <i class="bi bi-person" aria-hidden="true"></i>
                        <span>${escapar(pedido.cliente || 'Cliente')}</span>
                        ${wa ? `<a class="admin-texto-suave" href="${wa}" target="_blank" rel="noopener" aria-label="WhatsApp de ${escapar(pedido.cliente || 'cliente')}"><i class="bi bi-whatsapp" aria-hidden="true"></i></a>` : ''}
                    </div>

                    <div class="admin-meta admin-meta--sep">
                        <span>
                            ${Number(pedido.items_total) || 0} artículo(s)
                            ${pedido.items_resumen ? ` · ${escapar(pedido.items_resumen)}` : ''}
                        </span>
                        <strong class="admin-monto">${moneda(pedido.total)}</strong>
                    </div>

                    <div class="admin-card__pie">
                        <span class="admin-badge ${clasePago(pedido.pago)}">Pago: ${escapar(etiquetaPago(pedido.pago))}</span>
                        <span class="admin-texto-suave">${escapar(etiquetaEntrega(pedido.metodo_entrega))} · ${escapar(etiquetaMetodoPago(pedido.metodo_pago))}</span>
                        ${etiquetaPendiente ? `<span class="admin-badge admin-badge--azul">${escapar(etiquetaPendiente)}</span>` : ''}
                    </div>

                    <div class="admin-acciones">
                        ${puedeAceptar ? `
                            <button class="admin-btn admin-btn--verde" type="button" data-accion="pedido-aceptar" data-modo="${esAceptado ? 'facturar' : 'aceptar'}" data-id="${Number(pedido.id_pedido)}">
                                <i class="bi bi-check2-circle" aria-hidden="true"></i> ${escapar(etiquetaAceptar)}
                            </button>` : ''}
                        ${puedeCobrar ? `
                            <button class="admin-btn admin-btn--verde" type="button" data-accion="pedido-cobrar" data-id="${Number(pedido.id_pedido)}">
                                <i class="bi bi-cash-coin" aria-hidden="true"></i> Cobrar
                            </button>` : ''}
                        <button class="admin-btn admin-btn--suave" type="button" data-accion="pedido-detalle" data-id="${Number(pedido.id_pedido)}">
                            <i class="bi bi-receipt" aria-hidden="true"></i> Detalle
                        </button>
                        ${puedeCancelar ? `
                            <button class="admin-btn admin-btn--peligro" type="button" data-accion="pedido-estado" data-id="${Number(pedido.id_pedido)}" data-estado="${estadoCancelar}">
                                <i class="bi bi-x-circle" aria-hidden="true"></i> ${escapar(etiquetaCancelar)}
                            </button>` : ''}
                        ${puedeEnviar ? `
                            <button class="admin-btn admin-btn--verde" type="button" data-accion="pedido-estado" data-id="${Number(pedido.id_pedido)}" data-estado="enviado">
                                <i class="bi bi-truck" aria-hidden="true"></i> Marcar enviado
                            </button>` : ''}
                        ${puedeEntregar ? `
                            <button class="admin-btn admin-btn--verde" type="button" data-accion="pedido-estado" data-id="${Number(pedido.id_pedido)}" data-estado="entregado">
                                <i class="bi bi-check2" aria-hidden="true"></i> Entregado
                            </button>` : ''}
                    </div>
                </article>
            `;
        }).join('');
    }

    async function abrirPedido(id) {
        abrirSheet('Pedido', '', '<div class="admin-esqueleto"></div>');

        try {
            const datos = await adminRpc('web_admin_pedido', { p_id: id });
            const pedido = datos.pedido || {};
            const items = Array.isArray(datos.items) ? datos.items : [];
            const historial = Array.isArray(datos.historial) ? datos.historial : [];
            const pagos = Array.isArray(datos.pagos) ? datos.pagos : [];
            const transiciones = Array.isArray(pedido.transiciones) ? pedido.transiciones : [];
            const wa = enlaceWhatsApp(pedido.telefono, `Hola ${pedido.cliente || ''}, te escribimos de Tellez Nic Store por tu pedido ${pedido.numero || ''}.`);
            const mapa = enlaceMapa(pedido);
            const nombreCliente = pedido.cliente || 'Cliente';
            const recibe = pedido.recibe || '';
            const recibeDistinto = recibe && normalizar(recibe) !== normalizar(nombreCliente);

            const itemsHtml = items.length
                ? items.map((item) => `
                    <div class="admin-linea">
                        <span>
                            ${escapar(item.nombre || 'Producto')}
                            ${item.color || item.talla ? ` · ${escapar([item.color, item.talla].filter(Boolean).join(' · '))}` : ''}
                            <br><small>${Number(item.cantidad) || 0} × ${moneda(item.precio)}</small>
                        </span>
                        <strong>${moneda(item.subtotal)}</strong>
                    </div>
                `).join('')
                : '<p class="admin-texto-suave">Sin artículos registrados.</p>';

            const historialHtml = historial.length
                ? historial.slice().reverse().slice(0, 6).map((evento) => `
                    <div class="admin-linea">
                        <span>
                            ${escapar(etiquetaEstado(evento.estado_nuevo))}
                            <br><small>${escapar(fechaCorta(evento.fecha))}${evento.usuario ? ` · ${escapar(evento.usuario)}` : ''}</small>
                            ${evento.pago_nuevo && evento.pago_nuevo !== evento.pago_anterior
                                ? `<br><small>Pago: ${escapar(etiquetaPago(evento.pago_nuevo))}</small>`
                                : ''}
                            ${evento.nota ? `<br><small>${escapar(evento.nota)}</small>` : ''}
                        </span>
                        <strong class="admin-badge ${claseEstado(evento.estado_nuevo)}">${escapar(evento.origen || 'sistema')}</strong>
                    </div>
                `).join('')
                : '<p class="admin-texto-suave">Sin movimientos registrados.</p>';

            const pagosHtml = pagos.length
                ? pagos.map((pago) => `
                    <div class="admin-linea">
                        <span>
                            ${escapar(pago.metodo || 'Pago')}
                            <br><small>
                                ${escapar(fechaCorta(pago.fecha))}
                                ${pago.referencia ? ` · ${escapar(pago.referencia)}` : ''}
                                ${pago.usuario ? ` · ${escapar(pago.usuario)}` : ''}
                            </small>
                        </span>
                        <strong>${moneda(pago.monto)}</strong>
                    </div>
                `).join('')
                : '<p class="admin-texto-suave">Aún no hay pagos registrados.</p>';

            const botonesEstado = transiciones.map((nuevoEstado) => {
                const esDestructivo = ['rechazado', 'cancelado'].includes(nuevoEstado);
                const etiqueta = {
                    rechazado: 'Rechazar pedido',
                    cancelado: 'Cancelar pedido',
                    enviado: 'Marcar enviado',
                    entregado: 'Marcar entregado',
                }[nuevoEstado] || `Pasar a ${etiquetaEstado(nuevoEstado)}`;

                return `
                    <button class="admin-btn ${esDestructivo ? 'admin-btn--peligro' : 'admin-btn--verde'}" type="button"
                        data-accion="pedido-estado" data-id="${Number(pedido.id_pedido)}" data-estado="${escapar(nuevoEstado)}">
                        ${escapar(etiqueta)}
                    </button>
                `;
            }).join('');

            const esAceptado = pedido.estado === 'aceptado';
            const botonAceptar = pedido.puede_aceptar
                ? `<button class="admin-btn admin-btn--verde" type="button" data-accion="pedido-aceptar" data-modo="${esAceptado ? 'facturar' : 'aceptar'}" data-id="${Number(pedido.id_pedido)}"><i class="bi bi-check2-circle" aria-hidden="true"></i> ${esAceptado ? 'Facturar pedido' : 'Aceptar y facturar'}</button>`
                : '';
            const botonCobrar = pedido.puede_cobrar
                ? `<button class="admin-btn admin-btn--verde" type="button" data-accion="pedido-cobrar" data-id="${Number(pedido.id_pedido)}"><i class="bi bi-cash-coin" aria-hidden="true"></i> Cobrar y facturar</button>`
                : '';
            const acciones = botonAceptar + botonCobrar + botonesEstado;

            const contenido = `
                <div class="admin-card__fila">
                    <div class="admin-card__titulo">
                        <strong>${escapar(pedido.numero || 'Pedido sin número')}</strong>
                        <span>${escapar(fechaCorta(pedido.fecha))}</span>
                    </div>
                    <span class="admin-badge ${claseEstado(pedido.estado)}">${escapar(etiquetaEstado(pedido.estado))}</span>
                </div>

                <div class="admin-detalle__contacto">
                    ${wa ? `<a class="admin-btn admin-btn--suave" href="${wa}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> WhatsApp</a>` : ''}
                    ${pedido.telefono ? `<a class="admin-btn admin-btn--ghost" href="tel:${escapar(soloDigitos(pedido.telefono))}"><i class="bi bi-telephone"></i> Llamar</a>` : ''}
                    ${mapa ? `<a class="admin-btn admin-btn--ghost" href="${mapa}" target="_blank" rel="noopener"><i class="bi bi-geo-alt"></i> Mapa</a>` : ''}
                </div>

                <div class="admin-detalle__bloque">
                    <h3>Cliente y entrega</h3>
                    <div class="admin-entrega">
                        <div class="admin-entrega__dato">
                            <span>Cliente</span>
                            <strong>${escapar(nombreCliente)}</strong>
                        </div>
                        ${recibeDistinto ? `
                            <div class="admin-entrega__dato">
                                <span>Recibe</span>
                                <strong>${escapar(recibe)}</strong>
                            </div>` : ''}
                        <div class="admin-entrega__dato">
                            <span>Teléfono</span>
                            <strong>${escapar(pedido.telefono || 'Sin teléfono')}</strong>
                        </div>
                        <div class="admin-entrega__dato">
                            <span>Dirección</span>
                            <strong>${escapar(pedido.direccion || 'Sin dirección registrada')}</strong>
                        </div>
                        ${pedido.referencia ? `
                            <div class="admin-entrega__dato">
                                <span>Referencia</span>
                                <strong>${escapar(pedido.referencia)}</strong>
                            </div>` : ''}
                        <div class="admin-entrega__dato">
                            <span>Entrega</span>
                            <strong>${escapar(etiquetaEntrega(pedido.metodo_entrega))}${pedido.hora_preferida ? ` · ${escapar(pedido.hora_preferida)}` : ''}</strong>
                        </div>
                        <div class="admin-entrega__dato">
                            <span>Pago</span>
                            <strong>${escapar(etiquetaMetodoPago(pedido.metodo_pago))} · ${escapar(etiquetaPago(pedido.pago))}</strong>
                        </div>
                        ${pedido.factura ? `
                            <div class="admin-entrega__dato">
                                <span>Factura</span>
                                <strong>${escapar(pedido.factura)}</strong>
                            </div>` : ''}
                    </div>
                </div>

                ${pedido.nota_cliente ? `
                    <div class="admin-detalle__bloque">
                        <h3>Nota del cliente</h3>
                        <p class="admin-texto-suave">${escapar(pedido.nota_cliente)}</p>
                    </div>` : ''}

                <div class="admin-detalle__bloque">
                    <h3>Productos</h3>
                    <div class="admin-lista-lineas">${itemsHtml}</div>
                </div>

                <div class="admin-detalle__bloque">
                    <div class="admin-linea"><span>Subtotal</span><strong>${moneda(pedido.subtotal)}</strong></div>
                    <div class="admin-linea"><span>Descuento</span><strong>− ${moneda(pedido.descuento)}</strong></div>
                    <div class="admin-linea"><span>Impuesto</span><strong>${moneda(pedido.impuesto)}</strong></div>
                    <div class="admin-linea"><span>Envío</span><strong>${moneda(pedido.envio)}</strong></div>
                    <div class="admin-linea admin-linea--total"><span>Total</span><strong>${moneda(pedido.total)}</strong></div>
                </div>

                <div class="admin-detalle__bloque">
                    <h3>Pagos</h3>
                    <div class="admin-linea"><span>Pagado</span><strong>${moneda(pedido.pagado)}</strong></div>
                    <div class="admin-linea"><span>Saldo</span><strong>${moneda(pedido.saldo)}</strong></div>
                    <div class="admin-lista-lineas">${pagosHtml}</div>
                    ${pedido.puede_pagar ? `
                        <p class="admin-pago__nota">
                            <i class="bi bi-info-circle" aria-hidden="true"></i>
                            <span>El cobro se registra al cerrar el delivery, no pedido por pedido.</span>
                        </p>` : ''}
                </div>

                <div class="admin-detalle__bloque">
                    <h3>Historial</h3>
                    <div class="admin-lista-lineas">${historialHtml}</div>
                </div>

                ${acciones ? `<div class="admin-detalle__bloque"><h3>Acciones</h3><div class="admin-acciones">${acciones}</div></div>` : `
                    <p class="admin-nota">
                        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
                        <span>No hay acciones disponibles para este pedido en este momento.</span>
                    </p>`}
            `;

            abrirSheet(pedido.numero || 'Pedido', `${etiquetaEstado(pedido.estado)} · ${fechaDia(pedido.fecha)}`, contenido);
        } catch (error) {
            abrirSheet('Pedido', '', `<p class="admin-alerta">${escapar(error.message)}</p>`);
        }
    }

    async function aceptarPedido(id, boton, soloFacturar = false) {
        const etiqueta = soloFacturar ? 'Facturar pedido' : 'Aceptar y facturar';
        const confirmado = await confirmar(
            soloFacturar
                ? '¿Facturar este pedido? Se creará la factura y se descontará inventario.'
                : '¿Aceptar y facturar este pedido? Se creará la factura y se descontará inventario.',
            etiqueta
        );

        if (!confirmado) return;

        if (boton) {
            boton.disabled = true;
            boton.setAttribute('aria-busy', 'true');
            boton.innerHTML = '<span class="admin-btn__spinner" aria-hidden="true"></span><span>Facturando…</span>';
        }

        try {
            const datos = await adminRpc('web_admin_pedido_aceptar', { p_id: id });

            mostrarToast(datos.mensaje || 'Pedido aceptado y facturado.');
            estado.cargada.pedidos = false;
            await Promise.all([cargarPedidos(), cargarResumen()]);
            await abrirPedido(id);
        } catch (error) {
            mostrarToast(error.message, 'error');

            if (boton) {
                boton.disabled = false;
                boton.removeAttribute('aria-busy');
                boton.innerHTML = `<i class="bi bi-check2-circle" aria-hidden="true"></i><span>${etiqueta}</span>`;
            }
        }
    }

    async function abrirCobroPedido(id, modo = 'cobrar') {
        const esPago = modo === 'pagar';
        const titulo = esPago ? 'Registrar pago' : 'Cobrar pedido';

        abrirSheet(titulo, '', '<div class="admin-esqueleto"></div>');

        try {
            const datos = await adminRpc('web_admin_pedido', { p_id: id });
            const pedido = datos.pedido || {};
            const permitido = esPago ? Boolean(pedido.puede_pagar) : Boolean(pedido.puede_cobrar);

            if (!permitido) {
                abrirSheet(titulo, '', `
                    <p class="admin-alerta">
                        ${escapar(esPago
                            ? 'Este pedido no tiene un pago pendiente.'
                            : (pedido.facturado
                                ? 'Este pedido ya fue facturado.'
                                : 'Este pedido ya no tiene un cobro pendiente.'))}
                    </p>
                `);
                return;
            }

            const total = Number(esPago ? (pedido.saldo || pedido.total) : pedido.total) || 0;
            const metodo = etiquetaMetodoPago(pedido.metodo_pago);

            const contenido = `
                <div class="admin-pago">
                    <div class="admin-pago__resumen">
                        <div>
                            <span>Cliente</span>
                            <strong>${escapar(pedido.cliente || 'Cliente')}</strong>
                        </div>
                        <div>
                            <span>Método</span>
                            <strong>${escapar(metodo)}</strong>
                        </div>
                    </div>

                    <div class="admin-pago__total">
                        <span>${esPago ? 'Saldo a pagar' : 'Total a cobrar'}</span>
                        <strong>${moneda(total)}</strong>
                    </div>

                    <form class="admin-form" id="formPagoPedido" data-id="${Number(pedido.id_pedido)}" novalidate>
                        <div class="admin-form__campo">
                            <label for="pagoMonto">${esPago ? 'Monto a pagar' : 'Monto recibido'}</label>
                            <input id="pagoMonto" name="monto" type="number" inputmode="decimal" step="0.01" min="0.01"
                                value="${total.toFixed(2)}" required>
                            <small>${esPago ? 'Debe ser igual al saldo pendiente.' : 'Debe ser igual al total del pedido. No se permiten montos mayores.'}</small>
                        </div>

                        <div class="admin-form__campo">
                            <label for="pagoReferencia">Referencia <span class="admin-texto-suave">(opcional)</span></label>
                            <input id="pagoReferencia" name="referencia" type="text" maxlength="80" autocomplete="off"
                                placeholder="N.º de transacción o comprobante">
                        </div>

                        <p class="admin-alerta admin-pago__error" id="pagoError" role="alert" hidden></p>

                        <div class="admin-form__acciones">
                            <button class="admin-btn admin-btn--ghost" type="button" data-cerrar-sheet>Cancelar</button>
                            <button class="admin-btn admin-btn--verde" type="submit" id="btnRegistrarPago">
                                <i class="bi bi-check2-circle" aria-hidden="true"></i>
                                <span>${esPago ? 'Registrar pago' : 'Cobrar y facturar'}</span>
                            </button>
                        </div>
                    </form>

                    <p class="admin-pago__nota">
                        <i class="bi bi-info-circle" aria-hidden="true"></i>
                        <span>${esPago
                            ? 'Al confirmar se registra el pago y el pedido queda listo para enviar.'
                            : 'Al confirmar se crea la factura, se descuenta el inventario y el pedido queda listo para enviar.'}</span>
                    </p>
                </div>
            `;

            abrirSheet(titulo, `${pedido.numero || 'Pedido'} · ${moneda(total)}`, contenido);

            const inputMonto = $('#pagoMonto');
            const cajaError = $('#pagoError');

            const ocultarError = () => {
                if (!cajaError) return;
                cajaError.hidden = true;
                cajaError.textContent = '';
                inputMonto?.removeAttribute('aria-invalid');
            };

            $('#formPagoPedido')?.addEventListener('submit', (evento) => {
                registrarPagoPedido(evento, Number(pedido.id_pedido), total, modo);
            });
            inputMonto?.addEventListener('input', ocultarError);

            setTimeout(() => {
                inputMonto?.focus();
                inputMonto?.select();
            }, 60);
        } catch (error) {
            abrirSheet(titulo, '', `<p class="admin-alerta">${escapar(error.message)}</p>`);
        }
    }

    async function registrarPagoPedido(evento, id, total, modo = 'cobrar') {
        evento.preventDefault();

        const esPago = modo === 'pagar';
        const form = evento.currentTarget;
        const boton = $('#btnRegistrarPago', form);
        const cajaError = $('#pagoError', form);
        const inputMonto = $('#pagoMonto', form);
        const inputReferencia = $('#pagoReferencia', form);

        const mostrarError = (mensaje) => {
            if (cajaError) {
                cajaError.textContent = mensaje;
                cajaError.hidden = false;
            }
            inputMonto?.setAttribute('aria-invalid', 'true');
            inputMonto?.focus();
            inputMonto?.select();
        };

        if (cajaError) {
            cajaError.hidden = true;
            cajaError.textContent = '';
        }
        inputMonto?.removeAttribute('aria-invalid');

        const monto = Number.parseFloat(String(inputMonto?.value || '').replace(',', '.'));
        const totalCentavos = Math.round((Number(total) || 0) * 100);
        const montoCentavos = Number.isFinite(monto) ? Math.round(monto * 100) : 0;

        if (!Number.isFinite(monto) || montoCentavos <= 0) {
            mostrarError('Ingresa un monto mayor que cero.');
            return;
        }

        if (Math.abs(monto * 100 - montoCentavos) > 0.000001) {
            mostrarError('Usa como máximo dos decimales en el monto.');
            return;
        }

        if (montoCentavos < totalCentavos) {
            mostrarError(`El monto no cubre ${esPago ? 'el saldo pendiente' : 'el total'}. Faltan ${moneda((totalCentavos - montoCentavos) / 100)}.`);
            return;
        }

        if (montoCentavos > totalCentavos) {
            mostrarError(`El monto no puede superar ${esPago ? 'el saldo pendiente' : 'el total'}. Sobran ${moneda((montoCentavos - totalCentavos) / 100)}.`);
            return;
        }

        if (boton) {
            boton.disabled = true;
            boton.setAttribute('aria-busy', 'true');
            boton.innerHTML = `<span class="admin-btn__spinner" aria-hidden="true"></span><span>${esPago ? 'Registrando…' : 'Facturando…'}</span>`;
        }

        try {
            const datos = await adminRpc('web_admin_pedido_pagar', {
                p_id: id,
                p_monto: montoCentavos / 100,
                p_referencia: inputReferencia?.value?.trim() || null,
                p_solo_facturar: false,
            });

            mostrarToast(datos.mensaje || (esPago ? 'Pago registrado.' : 'Pago registrado y pedido facturado.'));
            estado.cargada.pedidos = false;
            await Promise.all([cargarPedidos(), cargarResumen()]);
            await abrirPedido(id);
        } catch (error) {
            mostrarError(error.message);
            mostrarToast(error.message, 'error');

            if (boton) {
                boton.disabled = false;
                boton.removeAttribute('aria-busy');
                boton.innerHTML = `<i class="bi bi-check2-circle" aria-hidden="true"></i><span>${esPago ? 'Registrar pago' : 'Cobrar y facturar'}</span>`;
            }
        }
    }

    async function cambiarEstadoPedido(id, nuevoEstado, boton) {
        const etiquetas = { rechazado: 'Rechazar', cancelado: 'Cancelar', enviado: 'Marcar enviado', entregado: 'Marcar entregado' };
        const esDestructivo = ['rechazado', 'cancelado'].includes(nuevoEstado);

        if (esDestructivo) {
            const confirmado = await confirmar(
                `¿${etiquetas[nuevoEstado] || 'Cambiar'} el pedido? Esta acción queda registrada en el historial.`,
                etiquetas[nuevoEstado] || 'Confirmar'
            );
            if (!confirmado) return;
        }

        boton.disabled = true;

        try {
            const datos = await adminRpc('web_admin_pedido_estado', {
                p_id: id,
                p_estado: nuevoEstado,
                p_nota: null,
            });

            mostrarToast(datos.mensaje || 'Pedido actualizado.');
            estado.cargada.pedidos = false;
            cerrarSheet();
            await Promise.all([cargarPedidos(), cargarResumen()]);
        } catch (error) {
            mostrarToast(error.message, 'error');
        } finally {
            boton.disabled = false;
        }
    }

    /* ───────────────────────── Promociones ───────────────────────── */

    async function cargarPromociones() {
        const contenedor = $('#listaPromos');
        cargando(contenedor);

        try {
            const datos = await adminRpc('web_admin_promociones');
            estado.promociones = Array.isArray(datos.promociones) ? datos.promociones : [];
            estado.cargada.promociones = true;
            renderPromociones();
        } catch (error) {
            vacio(contenedor, 'bi-exclamation-triangle', 'No se pudieron cargar las promociones', error.message);
        }
    }

    function renderPromociones() {
        const contenedor = $('#listaPromos');
        if (!contenedor) return;

        const conteos = { pausada: 0, vencida: 0, disponible: 0 };
        estado.promociones.forEach((promocion) => {
            conteos[estadoPromocion(promocion).filtro] += 1;
        });

        $('#conteoPromosPausadas').textContent = String(conteos.pausada);
        $('#conteoPromosVencidas').textContent = String(conteos.vencida);
        $('#conteoPromosDisponibles').textContent = String(conteos.disponible);
        $('#btnMostrarTodasPromos').hidden = !estado.filtros.promociones;
        $$('input[name="filtroPromociones"]').forEach((control) => {
            control.checked = control.value === estado.filtros.promociones;
        });

        if (!estado.promociones.length) {
            vacio(contenedor, 'bi-tag', 'Sin promociones', 'Crea una oferta para que aparezca en la tienda.');
            return;
        }

        const promocionesVisibles = estado.filtros.promociones
            ? estado.promociones.filter((promocion) => estadoPromocion(promocion).filtro === estado.filtros.promociones)
            : estado.promociones;

        if (!promocionesVisibles.length) {
            const estadoFiltro = {
                pausada: 'pausadas',
                vencida: 'vencidas',
                disponible: 'disponibles',
            }[estado.filtros.promociones];
            vacio(contenedor, 'bi-funnel', 'Sin promociones en este estado', `No hay promociones ${estadoFiltro} en este momento.`);
            return;
        }

        contenedor.innerHTML = promocionesVisibles.map((promocion) => {
            const imagen = urlImagenPromocion(promocion.imagen);
            const precios = Number(promocion.precio_venta) || 0;
            const oferta = Number(promocion.precio_oferta) || 0;
            const mostrarOferta = promocion.tipo && oferta > 0 && Math.abs(oferta - precios) > 0.009;
            const rango = rangoPromocion(promocion);
            const estadoActual = estadoPromocion(promocion);

            return `
                <article class="admin-card">
                    <div class="admin-ficha">
                        <div class="admin-ficha__producto-media">
                            <div class="admin-ficha__media">
                                ${imagen
                                    ? `<img src="${escapar(imagen)}" alt="" loading="lazy" onerror="this.style.display='none'"><i class="bi bi-tag"></i>`
                                    : '<i class="bi bi-tag" aria-hidden="true"></i>'}
                            </div>
                            <span class="admin-descuento-imagen">${escapar(valorDescuento(promocion.tipo, promocion.valor))}</span>
                        </div>

                        <div class="admin-ficha__cuerpo">
                            <h2>${escapar(promocion.producto || 'Producto')}</h2>
                            <div class="admin-precio">
                                <strong>${moneda(mostrarOferta ? oferta : precios)}</strong>
                                ${mostrarOferta ? `<del>${moneda(precios)}</del>` : ''}
                            </div>
                            <div class="admin-datos">
                                <span>${rango.fecha}</span>
                                <span class="admin-rango-promocion ${rango.estado === 'verde' ? 'admin-rango-promocion--verde' : 'admin-rango-promocion--rojo'}">${rango.detalle}</span>
                            </div>
                        </div>

                        <div class="admin-ficha__acciones">
                            <label class="admin-switch" title="${promocion.estado ? 'Pausar promoción' : 'Activar promoción'}">
                                <input type="checkbox" data-accion="promo-estado" data-id="${Number(promocion.id_promocion)}"
                                    ${promocion.estado ? 'checked' : ''} aria-label="Activar o pausar la promoción">
                                <span></span>
                            </label>

                            <button class="admin-btn admin-btn--suave admin-btn--icono" type="button" data-accion="promo-editar" data-id="${Number(promocion.id_promocion)}" aria-label="Editar promoción" title="Editar promoción">
                                <i class="bi bi-pencil" aria-hidden="true"></i>
                            </button>

                            <div class="admin-estado-radial ${estadoActual.clase}" aria-label="Estado de la promoción">
                                <i class="${estadoActual.icono}" aria-hidden="true"></i>
                                <span>${estadoActual.nombre}</span>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    async function cargarProductos() {
        if (Array.isArray(estado.productos)) return estado.productos;
        const datos = await adminRpc('web_admin_productos');
        estado.productos = Array.isArray(datos.productos) ? datos.productos : [];
        return estado.productos;
    }

    async function abrirFormularioPromocion(promocion = null) {
        abrirSheet(promocion ? 'Editar promoción' : 'Nueva promoción', 'El precio de oferta se calcula automáticamente.', '<div class="admin-esqueleto"></div>');

        try {
            const productos = await cargarProductos();

            if (!productos.length) {
                abrirSheet('Promoción', '', '<p class="admin-alerta">No hay productos activos. Crea o activa un producto en el ERP antes de armar una promoción.</p>');
                return;
            }

            const seleccionado = promocion?.id_producto || productos[0]?.id_producto || '';

            const opciones = productos.map((producto) => `
                <option value="${Number(producto.id_producto)}" ${Number(producto.id_producto) === Number(seleccionado) ? 'selected' : ''}>
                    ${escapar(producto.nombre)} · ${moneda(producto.precio_venta)}
                </option>
            `).join('');

            const contenido = `
                <form class="admin-form" id="formPromocion">
                    <div class="admin-form__campo">
                        <label for="promoProducto">Producto</label>
                        <select id="promoProducto" name="id_producto" required>${opciones}</select>
                        <small>La imagen se administra desde el ERP; no se puede cambiar ni ingresar aquí.</small>
                    </div>

                    <div class="admin-form__fila admin-form__fila--dos-columnas">
                        <div class="admin-form__campo">
                            <label for="promoTipo">Tipo de descuento</label>
                            <select id="promoTipo" name="tipo">
                                <option value="">Sin descuento (destacar)</option>
                                <option value="porcentaje" ${promocion?.tipo === 'porcentaje' ? 'selected' : ''}>Porcentaje (%)</option>
                                <option value="monto" ${promocion?.tipo === 'monto' ? 'selected' : ''}>Monto fijo (C$)</option>
                                <option value="precio" ${promocion?.tipo === 'precio' ? 'selected' : ''}>Precio final (C$)</option>
                            </select>
                        </div>

                        <div class="admin-form__campo">
                            <label for="promoValor">Valor</label>
                            <input id="promoValor" name="valor" type="number" min="0" step="any" inputmode="decimal"
                                value="${promocion?.valor != null ? escapar(promocion.valor) : ''}" placeholder="10">
                        </div>
                    </div>

                    <p class="admin-form__calculo" id="promoCalculo" aria-live="polite" hidden></p>

                    <label class="admin-form__check" id="promoMostrarPorcentajeFila" hidden>
                        <input type="checkbox" id="promoMostrarPorcentaje" name="mostrar_porcentaje">
                        Mostrar el descuento como porcentaje (%) en la tienda
                    </label>

                    <div class="admin-form__fila admin-form__fila--dos-columnas admin-form__fila--fechas">
                        <div class="admin-form__campo">
                            <label for="promoInicio">Inicio</label>
                            <input id="promoInicio" name="inicio" type="text" placeholder="19 de noviembre del 2026" autocomplete="off" required
                                value="${escapar(promocion?.fecha_inicio || new Date().toISOString().slice(0, 10))}">
                        </div>

                        <div class="admin-form__campo">
                            <label for="promoFin">Fin (opcional)</label>
                            <div class="admin-form__fecha-campo">
                                <input id="promoFin" name="fin" type="text" placeholder="19 de noviembre del 2026" autocomplete="off"
                                    value="${escapar(promocion?.fecha_fin || '')}">
                                <button class="admin-form__fecha-limpiar" type="button" id="promoFinLimpiar"
                                    aria-label="Quitar fecha final" title="Quitar fecha final" hidden>
                                    <i class="bi bi-x-lg" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <label class="admin-form__check">
                        <input type="checkbox" id="promoEstado" name="estado" ${promocion?.estado === false ? '' : 'checked'}>
                        Promoción activa
                    </label>

                    <div class="admin-form__acciones">
                        <button class="admin-btn admin-btn--ghost" type="button" data-cerrar-sheet>Cancelar</button>
                        <button class="admin-btn admin-btn--primario" type="submit">Guardar promoción</button>
                    </div>
                </form>
            `;

            abrirSheet(promocion ? 'Editar promoción' : 'Nueva promoción', 'El precio de oferta se calcula automáticamente.', contenido);

            const selectProducto = $('#promoProducto');
            const tipoControl = $('#promoTipo');
            const valorControl = $('#promoValor');
            const calculoControl = $('#promoCalculo');
            const checkPorcentaje = $('#promoMostrarPorcentaje');
            const checkPorcentajeFila = $('#promoMostrarPorcentajeFila');

            const productoSeleccionado = () => productos.find((producto) => (
                Number(producto.id_producto) === Number(selectProducto?.value)
            ));

            const calcularPromocion = () => {
                if (!tipoControl || !valorControl || !calculoControl) return;

                const tipo = tipoControl.value;
                const numero = Number(valorControl.value);
                const base = Number(productoSeleccionado()?.precio_venta) || 0;
                const permitePorcentaje = tipo === 'monto' || tipo === 'precio';

                if (checkPorcentajeFila) checkPorcentajeFila.hidden = !permitePorcentaje;
                if (!permitePorcentaje && checkPorcentaje) checkPorcentaje.checked = false;

                if (!tipo || !valorControl.value.trim() || !Number.isFinite(numero) || numero < 0 || base <= 0) {
                    calculoControl.hidden = true;
                    calculoControl.textContent = '';
                    return;
                }

                let precioFinal = base;
                if (tipo === 'porcentaje') precioFinal = base * (1 - numero / 100);
                else if (tipo === 'monto') precioFinal = base - numero;
                else if (tipo === 'precio') precioFinal = numero;

                precioFinal = Math.max(0, Math.min(base, precioFinal));
                const ahorro = Math.max(0, base - precioFinal);
                const porcentaje = base > 0 ? (ahorro / base) * 100 : 0;
                const partes = [`Precio final: ${moneda(precioFinal)}`];

                if (tipo === 'porcentaje') {
                    partes.push(`Ahorro: ${moneda(ahorro)}`);
                    if (numero > 100) partes.push('El porcentaje no puede superar 100');
                } else {
                    partes.push(`Descuento: ${porcentaje.toFixed(2)}%`);
                    if (tipo === 'precio') {
                        partes.push(`Ahorro: ${moneda(ahorro)}`);
                        if (numero > base) partes.push('El precio final no puede superar el precio del producto');
                    }
                }

                if (permitePorcentaje && checkPorcentaje?.checked) {
                    partes.push(`Se mostrará como ${porcentaje.toFixed(2)}%`);
                }

                calculoControl.textContent = `Cálculo: ${partes.join(' · ')}`;
                calculoControl.hidden = false;
            };

            [selectProducto, tipoControl, checkPorcentaje].forEach((control) => {
                control?.addEventListener('change', calcularPromocion);
            });
            valorControl?.addEventListener('input', calcularPromocion);
            calcularPromocion();
            iniciarFechasPromocion();

            $('#formPromocion')?.addEventListener('submit', async (evento) => {
                evento.preventDefault();

                const tipo = $('#promoTipo')?.value || '';
                const valor = $('#promoValor')?.value;

                if (tipo && (valor === '' || Number(valor) < 0)) {
                    mostrarToast('Escribe un valor de descuento válido.', 'error');
                    return;
                }

                if (tipo === 'porcentaje' && Number(valor) > 100) {
                    mostrarToast('El porcentaje no puede superar 100.', 'error');
                    return;
                }

                const baseProducto = Number(productoSeleccionado()?.precio_venta) || 0;

                if (tipo === 'precio' && baseProducto > 0 && Number(valor) > baseProducto) {
                    mostrarToast('El precio final no puede superar el precio del producto.', 'error');
                    return;
                }

                let tipoGuardado = tipo;
                let valorGuardado = tipo ? Number(valor) : null;

                if ((tipo === 'monto' || tipo === 'precio') && $('#promoMostrarPorcentaje')?.checked) {
                    if (baseProducto > 0) {
                        const numero = Number(valor) || 0;
                        const precioFinal = tipo === 'monto' ? Math.max(baseProducto - numero, 0) : Math.max(numero, 0);
                        const porcentaje = Math.min(100, Math.max(0, (1 - precioFinal / baseProducto) * 100));

                        tipoGuardado = 'porcentaje';
                        valorGuardado = Number(porcentaje.toFixed(2));
                    }
                }

                const boton = $('#formPromocion button[type="submit"]');
                if (boton) boton.disabled = true;

                try {
                    await adminRpc('web_admin_promocion_guardar', {
                        p_id: promocion?.id_promocion ? Number(promocion.id_promocion) : null,
                        p_id_producto: Number(selectProducto.value),
                        p_tipo: tipoGuardado || null,
                        p_valor: tipoGuardado ? valorGuardado : null,
                        p_inicio: $('#promoInicio')?.value || null,
                        p_fin: $('#promoFin')?.value || null,
                        p_imagen: null,
                        p_estado: Boolean($('#promoEstado')?.checked),
                    });

                    mostrarToast('Promoción guardada.');
                    estado.cargada.promociones = false;
                    cerrarSheet();
                    await Promise.all([cargarPromociones(), cargarResumen()]);
                } catch (error) {
                    mostrarToast(error.message, 'error');
                } finally {
                    if (boton) boton.disabled = false;
                }
            });
        } catch (error) {
            abrirSheet('Promoción', '', `<p class="admin-alerta">${escapar(error.message)}</p>`);
        }
    }

    async function cambiarEstadoPromocion(id, activo, control) {
        control.disabled = true;

        try {
            await adminRpc('web_admin_promocion_estado', {
                p_id: Number(id),
                p_estado: Boolean(activo),
            });

            mostrarToast(activo ? 'Promoción activada.' : 'Promoción pausada.');
            estado.cargada.promociones = false;
            await Promise.all([cargarPromociones(), cargarResumen()]);
        } catch (error) {
            control.checked = !activo;
            mostrarToast(error.message, 'error');
        } finally {
            control.disabled = false;
        }
    }

    /* ───────────────────────── Cupones ───────────────────────── */

    async function cargarCupones() {
        const contenedor = $('#listaCupones');
        cargando(contenedor);

        try {
            const datos = await adminRpc('web_admin_cupones');
            estado.cupones = Array.isArray(datos.cupones) ? datos.cupones : [];
            estado.cargada.cupones = true;
            renderCupones();
        } catch (error) {
            vacio(contenedor, 'bi-exclamation-triangle', 'No se pudieron cargar los cupones', error.message);
        }
    }

    function renderCupones() {
        const contenedor = $('#listaCupones');
        if (!contenedor) return;

        if (!estado.cupones.length) {
            vacio(contenedor, 'bi-ticket-perforated', 'Sin cupones', 'Crea un código de descuento para tus clientes.');
            return;
        }

        contenedor.innerHTML = estado.cupones.map((cupon) => `
            <article class="admin-card">
                <div class="admin-ficha">
                    <div class="admin-ficha__media"><i class="bi bi-ticket-perforated" aria-hidden="true"></i></div>

                    <div class="admin-ficha__cuerpo">
                        <h2>${escapar(cupon.codigo)}</h2>
                        <div class="admin-datos">
                            <span>${escapar(cupon.nombre)}</span>
                            <span><strong>${escapar(valorDescuento(cupon.tipo, cupon.valor))}</strong>${cupon.categoria ? ` · ${escapar(cupon.categoria)}` : ' · toda la tienda'}</span>
                            <span>Usos: ${Number(cupon.usados) || 0}/${Number(cupon.usos_maximos) || 0}</span>
                            <span>${cupon.fecha_fin ? `Vence ${escapar(fechaDia(cupon.fecha_fin))}` : 'Sin vencimiento'}</span>
                            <span class="admin-badge ${cupon.activo ? 'admin-badge--verde' : 'admin-badge--rojo'}">${cupon.activo ? 'Activo' : 'Pausado'}</span>
                        </div>
                    </div>

                    <label class="admin-switch" title="${cupon.estado ? 'Pausar cupón' : 'Activar cupón'}">
                        <input type="checkbox" data-accion="cupon-estado" data-id="${Number(cupon.id_cupon)}"
                            ${cupon.estado ? 'checked' : ''} aria-label="Activar o pausar el cupón">
                        <span></span>
                    </label>
                </div>

                <div class="admin-acciones">
                    <button class="admin-btn admin-btn--suave" type="button" data-accion="cupon-editar" data-id="${Number(cupon.id_cupon)}">
                        <i class="bi bi-pencil" aria-hidden="true"></i> Editar
                    </button>
                </div>
            </article>
        `).join('');
    }

    function valorFechaHora(valor) {
        const dato = fecha(valor);
        if (!dato) return '';

        const desfase = dato.getTimezoneOffset() * 60000;
        return new Date(dato.getTime() - desfase).toISOString().slice(0, 16);
    }

    function abrirFormularioCupon(cupon = null) {
        const contenido = `
            <form class="admin-form" id="formCupon">
                <div class="admin-form__fila">
                    <div class="admin-form__campo">
                        <label for="cuponCodigo">Código</label>
                        <input id="cuponCodigo" name="codigo" maxlength="40" required
                            value="${escapar(cupon?.codigo || '')}" placeholder="BIENVENIDA10"
                            autocapitalize="characters" spellcheck="false">
                    </div>

                    <div class="admin-form__campo">
                        <label for="cuponNombre">Nombre</label>
                        <input id="cuponNombre" name="nombre" maxlength="120" required
                            value="${escapar(cupon?.nombre || '')}" placeholder="Descuento de bienvenida">
                    </div>
                </div>

                <div class="admin-form__fila">
                    <div class="admin-form__campo">
                        <label for="cuponTipo">Tipo</label>
                        <select id="cuponTipo" name="tipo">
                            <option value="porcentaje" ${cupon?.tipo === 'monto' ? '' : 'selected'}>Porcentaje (%)</option>
                            <option value="monto" ${cupon?.tipo === 'monto' ? 'selected' : ''}>Monto fijo (C$)</option>
                        </select>
                    </div>

                    <div class="admin-form__campo">
                        <label for="cuponValor">Valor</label>
                        <input id="cuponValor" name="valor" type="number" min="0.01" step="0.01" inputmode="decimal" required
                            value="${cupon?.valor != null ? escapar(cupon.valor) : ''}" placeholder="10">
                    </div>
                </div>

                <div class="admin-form__fila">
                    <div class="admin-form__campo">
                        <label for="cuponCategoria">Categoría (opcional)</label>
                        <input id="cuponCategoria" name="categoria" maxlength="80"
                            value="${escapar(cupon?.categoria || '')}" placeholder="Zapatos">
                    </div>

                    <div class="admin-form__campo">
                        <label for="cuponTope">Tope (opcional)</label>
                        <input id="cuponTope" name="tope" type="number" min="0" step="0.01" inputmode="decimal"
                            value="${cupon?.tope != null ? escapar(cupon.tope) : ''}" placeholder="500">
                    </div>
                </div>

                <div class="admin-form__fila">
                    <div class="admin-form__campo">
                        <label for="cuponUsos">Usos máximos</label>
                        <input id="cuponUsos" name="usos" type="number" min="1" step="1" inputmode="numeric" required
                            value="${Number(cupon?.usos_maximos) || 1}">
                    </div>

                    <div class="admin-form__campo">
                        <label for="cuponEstado">Estado</label>
                        <label class="admin-form__check">
                            <input type="checkbox" id="cuponEstado" name="estado" ${cupon?.estado === false ? '' : 'checked'}>
                            Activo
                        </label>
                    </div>
                </div>

                <div class="admin-form__fila">
                    <div class="admin-form__campo">
                        <label for="cuponInicio">Inicio</label>
                        <input id="cuponInicio" name="inicio" type="datetime-local"
                            value="${escapar(cupon ? valorFechaHora(cupon.fecha_inicio) : valorFechaHora(new Date().toISOString()))}">
                    </div>

                    <div class="admin-form__campo">
                        <label for="cuponFin">Fin (opcional)</label>
                        <input id="cuponFin" name="fin" type="datetime-local"
                            value="${escapar(cupon ? valorFechaHora(cupon.fecha_fin) : '')}">
                    </div>
                </div>

                <div class="admin-form__acciones">
                    <button class="admin-btn admin-btn--ghost" type="button" data-cerrar-sheet>Cancelar</button>
                    <button class="admin-btn admin-btn--primario" type="submit">Guardar cupón</button>
                </div>
            </form>
        `;

        abrirSheet(cupon ? 'Editar cupón' : 'Nuevo cupón', 'Los cupones se validan al aplicarlos en el carrito.', contenido);

        $('#formCupon')?.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const boton = $('#formCupon button[type="submit"]');
            if (boton) boton.disabled = true;

            try {
                await adminRpc('web_admin_cupon_guardar', {
                    p_id: cupon?.id_cupon ? Number(cupon.id_cupon) : null,
                    p_codigo: $('#cuponCodigo').value.trim().toUpperCase(),
                    p_nombre: $('#cuponNombre').value.trim(),
                    p_tipo: $('#cuponTipo').value,
                    p_valor: Number($('#cuponValor').value),
                    p_categoria: $('#cuponCategoria').value.trim() || null,
                    p_tope: $('#cuponTope').value ? Number($('#cuponTope').value) : null,
                    p_usos: Number($('#cuponUsos').value) || 1,
                    p_inicio: $('#cuponInicio').value || null,
                    p_fin: $('#cuponFin').value || null,
                    p_estado: Boolean($('#cuponEstado').checked),
                });

                mostrarToast('Cupón guardado.');
                estado.cargada.cupones = false;
                cerrarSheet();
                await Promise.all([cargarCupones(), cargarResumen()]);
            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                if (boton) boton.disabled = false;
            }
        });
    }

    async function cambiarEstadoCupon(id, activo, control) {
        control.disabled = true;

        try {
            await adminRpc('web_admin_cupon_estado', {
                p_id: Number(id),
                p_estado: Boolean(activo),
            });

            mostrarToast(activo ? 'Cupón activado.' : 'Cupón pausado.');
            estado.cargada.cupones = false;
            await Promise.all([cargarCupones(), cargarResumen()]);
        } catch (error) {
            control.checked = !activo;
            mostrarToast(error.message, 'error');
        } finally {
            control.disabled = false;
        }
    }

    /* ───────────────────────── Repartidores ───────────────────────── */

    async function cargarTrabajadores() {
        const contenedor = $('#listaTrabajadores');
        cargando(contenedor);

        try {
            const datos = await adminRpc('web_admin_trabajadores', { p_estado: 'todos' });
            estado.trabajadores = Array.isArray(datos.trabajadores) ? datos.trabajadores : [];
            estado.cargada.trabajadores = true;
            renderTrabajadores();
        } catch (error) {
            vacio(contenedor, 'bi-exclamation-triangle', 'No se pudieron cargar los repartidores', error.message);
        }
    }

    function renderTrabajadores() {
        const contenedor = $('#listaTrabajadores');
        if (!contenedor) return;

        const filtro = estado.filtros.trabajadores;
        const lista = estado.trabajadores.filter((trabajador) => filtro === 'todos' || trabajador.estado === filtro);
        actualizarContador($('#trabajadoresContador'), lista.length);

        if (!lista.length) {
            vacio(contenedor, 'bi-truck', 'Sin solicitudes en este estado', 'Cuando alguien solicite ser repartidor aparecerá aquí.');
            return;
        }

        contenedor.innerHTML = lista.map((trabajador) => {
            const wa = enlaceWhatsApp(trabajador.telefono, `Hola ${trabajador.nombre || ''}, te escribimos de Tellez Nic Store.`);
            const foto = String(trabajador.foto || '').trim();
            const puedeAprobar = trabajador.estado !== 'aprobado';
            const puedeRechazar = trabajador.estado === 'pendiente' || trabajador.estado === 'suspendido';
            const puedeSuspender = trabajador.estado === 'aprobado';

            return `
                <article class="admin-card">
                    <div class="admin-ficha">
                        <div class="admin-foto">
                            ${foto
                                ? `<i class="bi bi-person" aria-hidden="true"></i><img src="${escapar(foto)}" alt="" loading="lazy" onerror="this.style.display='none'">`
                                : `<span class="admin-foto__inicial">${escapar(inicial(trabajador.nombre))}</span>`}
                        </div>

                        <div class="admin-ficha__cuerpo">
                            <h2>${escapar(trabajador.nombre || 'Repartidor')}</h2>
                            <div class="admin-datos">
                                <span>${escapar(trabajador.vehiculo || 'Vehículo')}${trabajador.placa ? ` · ${escapar(trabajador.placa)}` : ''}</span>
                                <span>${escapar(trabajador.telefono || 'Sin teléfono')} · ${Number(trabajador.comision) || 0}% comisión</span>
                                <span class="admin-badge ${claseTrabajador(trabajador.estado)}">${escapar(etiquetaTrabajador(trabajador.estado))}${trabajador.disponible ? ' · disponible' : ''}</span>
                                ${trabajador.motivo_rechazo ? `<span>Motivo: ${escapar(trabajador.motivo_rechazo)}</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="admin-acciones">
                        ${puedeAprobar ? `<button class="admin-btn admin-btn--verde" type="button" data-accion="trabajador-form" data-modo="aprobar" data-id="${Number(trabajador.id_trabajador)}"><i class="bi bi-check2"></i> Aprobar</button>` : ''}
                        ${puedeSuspender ? `<button class="admin-btn admin-btn--ghost" type="button" data-accion="trabajador-form" data-modo="suspender" data-id="${Number(trabajador.id_trabajador)}"><i class="bi bi-x-circle"></i> Suspender</button>` : ''}
                        ${puedeRechazar ? `<button class="admin-btn admin-btn--peligro" type="button" data-accion="trabajador-form" data-modo="rechazar" data-id="${Number(trabajador.id_trabajador)}"><i class="bi bi-x-circle"></i> Rechazar</button>` : ''}
                        ${wa ? `<a class="admin-btn admin-btn--suave" href="${wa}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> WhatsApp</a>` : ''}
                    </div>
                </article>
            `;
        }).join('');
    }

    function abrirFormularioTrabajador(trabajador, modo) {
        const esRechazo = modo === 'rechazar';
        const esSuspension = modo === 'suspender';
        const titulo = esRechazo ? 'Rechazar solicitud' : (esSuspension ? 'Suspender repartidor' : 'Aprobar repartidor');

        const contenido = `
            <form class="admin-form" id="formTrabajador">
                <div class="admin-datos">
                    <span><strong>${escapar(trabajador.nombre || 'Repartidor')}</strong></span>
                    <span>${escapar(trabajador.vehiculo || 'Vehículo')}${trabajador.placa ? ` · ${escapar(trabajador.placa)}` : ''}</span>
                    <span>Estado actual: ${escapar(etiquetaTrabajador(trabajador.estado))}</span>
                </div>

                ${!esRechazo && !esSuspension ? `
                    <div class="admin-form__campo">
                        <label for="trabajadorComision">Comisión que retiene la tienda (%)</label>
                        <input id="trabajadorComision" type="number" min="0" max="100" step="0.01" inputmode="decimal"
                            value="${Number(trabajador.comision) || 20}">
                        <small>El repartidor recibe el resto del costo de envío.</small>
                    </div>` : ''}

                <div class="admin-form__campo">
                    <label for="trabajadorNota">${esRechazo ? 'Motivo del rechazo' : 'Nota interna (opcional)'}</label>
                    <textarea id="trabajadorNota" maxlength="2000" ${esRechazo ? 'required' : ''}
                        placeholder="${esRechazo ? 'Explica brevemente por qué se rechaza la solicitud.' : 'Nota visible solo en el ERP.'}"></textarea>
                </div>

                <div class="admin-form__acciones">
                    <button class="admin-btn admin-btn--ghost" type="button" data-cerrar-sheet>Cancelar</button>
                    <button class="admin-btn ${esRechazo ? 'admin-btn--peligro' : 'admin-btn--primario'}" type="submit">
                        ${esRechazo ? 'Rechazar solicitud' : (esSuspension ? 'Suspender' : 'Aprobar')}
                    </button>
                </div>
            </form>
        `;

        abrirSheet(titulo, 'El cambio de rol se aplica al instante.', contenido);

        $('#formTrabajador')?.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const nota = $('#trabajadorNota').value.trim();

            if (esRechazo && !nota) {
                mostrarToast('Escribe el motivo del rechazo.', 'error');
                return;
            }

            const boton = $('#formTrabajador button[type="submit"]');
            if (boton) boton.disabled = true;

            try {
                await adminRpc('web_admin_trabajador_actualizar', {
                    p_id: Number(trabajador.id_trabajador),
                    p_estado: esRechazo ? 'rechazado' : (esSuspension ? 'suspendido' : 'aprobado'),
                    p_comision: $('#trabajadorComision') ? Number($('#trabajadorComision').value) : null,
                    p_nota: nota || null,
                    p_motivo: esRechazo ? nota : null,
                });

                mostrarToast(esRechazo ? 'Solicitud rechazada.' : (esSuspension ? 'Repartidor suspendido.' : 'Repartidor aprobado.'));
                estado.cargada.trabajadores = false;
                cerrarSheet();
                await Promise.all([cargarTrabajadores(), cargarResumen()]);
            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                if (boton) boton.disabled = false;
            }
        });
    }

    /* ───────────────────── Solicitudes de cambio ───────────────────── */

    function etiquetaCambio(valor) {
        return {
            cambio_vehiculo: 'Cambio de vehículo',
            foto_vehiculo: 'Foto del vehículo',
            foto_circulacion: 'Foto de circulación',
            baja: 'Baja',
            otro: 'Otro cambio o consulta',
        }[valor] || valor || 'Solicitud';
    }

    async function cargarCambios() {
        const contenedor = $('#listaCambios');
        if (!contenedor) return;

        cargando(contenedor);

        try {
            const datos = await adminRpc('web_admin_trabajador_cambios', { p_estado: 'todas' });
            estado.cambios = Array.isArray(datos.cambios) ? datos.cambios : [];
            estado.cargada.cambios = true;
            renderCambios();
            cargarBadgeCambios();
        } catch (error) {
            vacio(contenedor, 'bi-exclamation-triangle', 'No se pudieron cargar las solicitudes', error.message);
        }
    }

    async function cargarBadgeCambios() {
        const badge = $('#navBadgeCambios');
        if (!badge) return;

        try {
            const datos = await adminRpc('web_admin_trabajador_cambios', { p_estado: 'pendiente' });
            const total = Array.isArray(datos.cambios) ? datos.cambios.length : 0;
            badge.textContent = total > 9 ? '9+' : String(total);
            badge.hidden = total <= 0;
        } catch {
            badge.hidden = true;
        }
    }

    function renderCambios() {
        const contenedor = $('#listaCambios');
        if (!contenedor) return;

        const filtro = estado.filtros.cambios;
        const lista = estado.cambios.filter((cambio) => filtro === 'todas' || cambio.estado === filtro);
        actualizarContador($('#cambiosContador'), lista.length);

        if (!lista.length) {
            vacio(contenedor, 'bi-arrow-counterclockwise', 'Sin solicitudes en este estado', 'Cuando un repartidor envíe un cambio aparecerá aquí.');
            return;
        }

        contenedor.innerHTML = lista.map((cambio) => {
            const pendiente = cambio.estado === 'pendiente';
            const foto = String(cambio.foto_url || '').trim();
            const fotoActual = String(cambio.foto_actual || '').trim();

            return `
                <article class="admin-card">
                    <div class="admin-ficha">
                        <div class="admin-ficha__cuerpo">
                            <h2>${escapar(cambio.nombre || 'Repartidor')}</h2>
                            <div class="admin-datos">
                                <span>${escapar(cambio.vehiculo || 'Vehículo')}${cambio.placa ? ` · ${escapar(cambio.placa)}` : ''}</span>
                                <span>${escapar(cambio.telefono || 'Sin teléfono')}</span>
                                <span class="admin-badge ${claseTrabajador(cambio.estado)}">${escapar(etiquetaTrabajador(cambio.estado))}</span>
                                <span><strong>${escapar(etiquetaCambio(cambio.tipo))}</strong></span>
                                ${cambio.detalle ? `<span>${escapar(cambio.detalle)}</span>` : ''}
                                ${cambio.respuesta ? `<span>Respuesta: ${escapar(cambio.respuesta)}</span>` : ''}
                                <span>${fechaCorta(cambio.fecha_solicitud)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="admin-acciones">
                        ${foto ? `<a class="admin-btn admin-btn--suave" href="${escapar(foto)}" target="_blank" rel="noopener"><i class="bi bi-eye"></i> Ver foto nueva</a>` : ''}
                        ${foto && fotoActual ? `<a class="admin-btn admin-btn--ghost" href="${escapar(fotoActual)}" target="_blank" rel="noopener"><i class="bi bi-eye"></i> Foto actual</a>` : ''}
                        ${pendiente ? `<button class="admin-btn admin-btn--verde" type="button" data-accion="cambio-form" data-modo="aprobar" data-id="${Number(cambio.id_cambio)}"><i class="bi bi-check2"></i> Aprobar</button>
                        <button class="admin-btn admin-btn--peligro" type="button" data-accion="cambio-form" data-modo="rechazar" data-id="${Number(cambio.id_cambio)}"><i class="bi bi-x-circle"></i> Rechazar</button>` : ''}
                    </div>
                </article>`;
        }).join('');
    }

    function abrirFormularioCambio(cambio, modo) {
        const esRechazo = modo === 'rechazar';

        const contenido = `
            <form class="admin-form" id="formCambio">
                <div class="admin-datos">
                    <span><strong>${escapar(cambio.nombre || 'Repartidor')}</strong></span>
                    <span>${escapar(etiquetaCambio(cambio.tipo))}</span>
                    ${cambio.detalle ? `<span>${escapar(cambio.detalle)}</span>` : ''}
                    ${cambio.foto_url ? `<span><a href="${escapar(cambio.foto_url)}" target="_blank" rel="noopener">Ver foto enviada</a></span>` : ''}
                </div>

                <div class="admin-form__campo">
                    <label for="cambioRespuesta">${esRechazo ? 'Motivo del rechazo' : 'Nota (opcional)'}</label>
                    <textarea id="cambioRespuesta" maxlength="2000" ${esRechazo ? 'required' : ''}
                        placeholder="${esRechazo ? 'Explica por qué se rechaza la solicitud.' : 'Nota visible para el repartidor.'}"></textarea>
                </div>

                <div class="admin-form__acciones">
                    <button class="admin-btn admin-btn--ghost" type="button" data-cerrar-sheet>Cancelar</button>
                    <button class="admin-btn ${esRechazo ? 'admin-btn--peligro' : 'admin-btn--primario'}" type="submit">
                        ${esRechazo ? 'Rechazar solicitud' : 'Aprobar solicitud'}
                    </button>
                </div>
            </form>`;

        abrirSheet(
            esRechazo ? 'Rechazar solicitud' : 'Aprobar solicitud',
            esRechazo ? 'El repartidor verá el motivo en su perfil.' : 'La solicitud quedará aprobada.',
            contenido
        );

        $('#formCambio')?.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const respuesta = $('#cambioRespuesta').value.trim();

            if (esRechazo && !respuesta) {
                mostrarToast('Escribe el motivo del rechazo.', 'error');
                return;
            }

            const boton = $('#formCambio button[type="submit"]');
            if (boton) boton.disabled = true;

            try {
                await adminRpc('web_admin_trabajador_cambio_resolver', {
                    p_id: Number(cambio.id_cambio),
                    p_estado: esRechazo ? 'rechazado' : 'aprobado',
                    p_respuesta: respuesta || null,
                });

                mostrarToast(esRechazo ? 'Solicitud rechazada.' : 'Solicitud aprobada.');
                estado.cargada.cambios = false;
                cerrarSheet();
                await cargarCambios();
                await cargarBadgeCambios();
            } catch (error) {
                mostrarToast(error.message, 'error');
            } finally {
                if (boton) boton.disabled = false;
            }
        });
    }

    /* ───────────────────────── Cierre de delivery ───────────────────────── */

    async function cargarCierre() {
        const contenedor = $('#listaCierre');
        if (!contenedor) return;

        const desdeInput = $('#cierreDesde');
        const hastaInput = $('#cierreHasta');
        const hoy = hoyISO();

        if (desdeInput && !desdeInput.value) {
            if (selectorCierreDesde) {
                selectorCierreDesde.setDate(hoy, false);
                if (selectorCierreDesde.altInput) selectorCierreDesde.altInput.value = fechaCompleta(hoy);
            } else {
                desdeInput.value = hoy;
            }
        }

        if (hastaInput && !hastaInput.value) {
            if (selectorCierreHasta) {
                selectorCierreHasta.setDate(hoy, false);
                if (selectorCierreHasta.altInput) selectorCierreHasta.altInput.value = fechaCompleta(hoy);
            } else {
                hastaInput.value = hoy;
            }
        }

        const desde = desdeInput?.value || hoy;
        const hasta = hastaInput?.value || hoy;

        if (hasta < desde) {
            vacio(contenedor, 'bi-exclamation-triangle', 'Fechas incorrectas', 'La fecha final no puede ser anterior a la inicial.');
            return;
        }

        cargando(contenedor);

        try {
            const datos = await adminRpc('web_admin_cierre_delivery', { p_desde: desde, p_hasta: hasta });

            estado.cierre.repartidores = Array.isArray(datos.repartidores) ? datos.repartidores : [];
            estado.cierre.totales = datos.totales || {};
            estado.cargada.cierre = true;

            renderCierre();
        } catch (error) {
            vacio(contenedor, 'bi-exclamation-triangle', 'No se pudo cargar el cierre', error.message);
        }
    }

    function renderCierre() {
        const contenedor = $('#listaCierre');
        if (!contenedor) return;

        const totales = estado.cierre.totales || {};
        const listaBase = estado.cierre.repartidores.filter((repartidor) => (
            Number(repartidor.pedidos) > 0 || Number(repartidor.cerrados) > 0
        ));
        const lista = listaBase.filter((repartidor) => coincideBusqueda(estado.busquedas.cierre, [
            repartidor.nombre,
            repartidor.telefono,
        ]));

        actualizarContador($('#cierreContador'), lista.length);
        $('#cierrePedidos').textContent = String(Number(totales.pedidos) || 0);
        $('#cierreProductos').textContent = moneda(totales.productos);
        $('#cierreTotal').textContent = moneda(totales.total_empresa);
        $('#cierreGlobalEfectivo').textContent = moneda(totales.efectivo);
        $('#cierreGlobalBilletera').textContent = moneda(totales.billetera);
        $('#cierreGlobalLafise').textContent = moneda(totales.lafise);
        $('#cierreGlobalDelivery').textContent = moneda(totales.delivery);
        $('#cierreGlobalEmpresa').textContent = moneda(totales.comision_empresa);
        $('#cierreGlobalGanancia').textContent = moneda(totales.ganancia_delivery);

        if (!lista.length) {
            vacio(
                contenedor,
                'bi-clipboard',
                listaBase.length ? 'Sin repartidores con esa búsqueda' : 'Sin entregas por cerrar',
                listaBase.length
                    ? 'Prueba con otro nombre o teléfono.'
                    : 'No hay pedidos entregados pendientes en el periodo seleccionado.'
            );
            return;
        }

        contenedor.innerHTML = `
            <table class="admin-cierre__tabla" aria-label="Repartidores con entregas en el periodo">
                <thead>
                    <tr>
                        <th scope="col">Repartidor</th>
                        <th scope="col">Pedidos</th>
                        <th scope="col" class="admin-cierre__tabla-total">Total a entregar</th>
                        <th scope="col">Estado</th>
                        <th scope="col" class="admin-cierre__tabla-acciones">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${lista.map((repartidor) => {
                        const comision = Number(repartidor.comision) || 0;
                        const pendientes = Number(repartidor.pedidos) || 0;
                        const cerrados = Number(repartidor.cerrados) || 0;
                        const totalPedidos = pendientes + cerrados;
                        const nombre = repartidor.nombre || 'Repartidor';
                        const telefono = repartidor.telefono ? escapar(repartidor.telefono) : '';

                        return `
                            <tr>
                                <td class="admin-cierre__tabla-persona">
                                    <strong>${escapar(nombre)}</strong>
                                    <small>${telefono ? `${telefono} · ` : ''}Comisión ${comision.toFixed(2)}%</small>
                                </td>
                                <td class="admin-cierre__tabla-pedidos">
                                    <strong>${totalPedidos}</strong>
                                    <small>${pendientes > 0
                                        ? `${pendientes} por cerrar${cerrados > 0 ? ` · ${cerrados} cerrado${cerrados === 1 ? '' : 's'}` : ''}`
                                        : `${cerrados} cerrado${cerrados === 1 ? '' : 's'}`}</small>
                                </td>
                                <td class="admin-cierre__tabla-total">${moneda(repartidor.total_empresa)}</td>
                                <td class="admin-cierre__tabla-estado">
                                    <span class="admin-badge ${pendientes > 0 ? 'admin-badge--azul' : 'admin-badge--verde'}">${pendientes > 0 ? `${pendientes} por cerrar` : 'Cerrado'}</span>
                                </td>
                                <td class="admin-cierre__tabla-acciones">
                                    <div class="admin-cierre__acciones">
                                        <button class="admin-btn admin-btn--ghost admin-cierre__accion" type="button"
                                            data-accion="cierre-detalle" data-modo="detalle" data-id="${Number(repartidor.id_trabajador)}"
                                            aria-label="Ver detalles de ${escapar(nombre)}">
                                            <i class="bi bi-eye" aria-hidden="true"></i><span>Detalles</span>
                                        </button>
                                        ${pendientes > 0 ? `
                                            <button class="admin-btn admin-btn--primario admin-cierre__accion" type="button"
                                                data-accion="cierre-detalle" data-modo="arquear" data-id="${Number(repartidor.id_trabajador)}"
                                                aria-label="Arquear a ${escapar(nombre)}">
                                                <i class="bi bi-cash-coin" aria-hidden="true"></i><span>Arquear</span>
                                            </button>` : ''}
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    function abrirCierre(idTrabajador, modo = 'detalle') {
        const repartidor = estado.cierre.repartidores.find((fila) => Number(fila.id_trabajador) === Number(idTrabajador));
        if (!repartidor) return;

        const detalle = Array.isArray(repartidor.detalle) ? repartidor.detalle : [];
        const total = Number(repartidor.total_empresa) || 0;
        const otros = Number(repartidor.otros) || 0;
        const comision = Number(repartidor.comision) || 0;
        const pendientes = Number(repartidor.pedidos) || 0;

        const grupos = detalle.reduce((mapa, pedido) => {
            const clave = String(pedido.fecha || '').slice(0, 10);
            if (!mapa[clave]) mapa[clave] = [];
            mapa[clave].push(pedido);

            return mapa;
        }, {});

        const detalleHtml = Object.keys(grupos).length
            ? Object.entries(grupos)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([dia, pedidos]) => {
                    const totalDia = pedidos.reduce((suma, pedido) => {
                        const productos = Number(pedido.productos) || 0;
                        const delivery = Number(pedido.delivery) || 0;

                        return suma + productos + (delivery * comision / 100);
                    }, 0);

                    return `
                        <details class="admin-cierre__dia">
                            <summary>
                                <span>
                                    <strong>${escapar(fechaDia(dia))}</strong>
                                    <small>${pedidos.length} pedido(s) · Delivery ${moneda(pedidos.reduce((suma, pedido) => suma + (Number(pedido.delivery) || 0), 0))}</small>
                                </span>
                                <strong>${moneda(totalDia)}</strong>
                                <i class="bi bi-chevron-down" aria-hidden="true"></i>
                            </summary>
                            <div class="admin-cierre__dia-cuerpo">
                                ${pedidos.map((pedido) => `
                                    <div class="admin-linea">
                                        <span>
                                            ${escapar(pedido.numero || 'Pedido')} · ${escapar(etiquetaMetodoPago(pedido.metodo))}
                                            <br><small>Productos ${moneda(pedido.productos)} · Delivery ${moneda(pedido.delivery)}</small>
                                        </span>
                                        <strong>${moneda(pedido.total)}</strong>
                                    </div>`).join('')}
                            </div>
                        </details>`;
                }).join('')
            : '<p class="admin-texto-suave">Sin pedidos pendientes en el periodo.</p>';

        const detalleBloque = pendientes > 0 ? `
            <div class="admin-detalle__bloque">
                <h3>Pendiente por día</h3>
                <div class="admin-cierre__dias">${detalleHtml}</div>
            </div>
        ` : '';

        const formularioHtml = pendientes > 0 ? `
            <form class="admin-form" id="formCierreDelivery" data-id="${Number(repartidor.id_trabajador)}">
                <div class="admin-form__campo">
                    <label for="cierreMonto">Monto entregado</label>
                    <input id="cierreMonto" name="monto" type="number" inputmode="decimal" step="0.01" min="0"
                        value="${total.toFixed(2)}" required>
                </div>

                <p class="admin-cierre__diferencia" id="cierreDiferencia"></p>

                <div class="admin-form__campo">
                    <label for="cierreNota">Nota (opcional)</label>
                    <input id="cierreNota" name="nota" type="text" maxlength="255" placeholder="Observaciones del cierre">
                </div>

                <p class="admin-alerta admin-pago__error" id="cierreError" role="alert" hidden></p>

                <div class="admin-form__acciones">
                    <button class="admin-btn admin-btn--ghost" type="button" data-cerrar-sheet>Cancelar</button>
                    <button class="admin-btn admin-btn--primario" type="submit" id="btnCerrarDelivery">
                        <i class="bi bi-check2-circle" aria-hidden="true"></i>
                        <span>Registrar cierre</span>
                    </button>
                </div>
            </form>

            <p class="admin-pago__nota">
                <i class="bi bi-info-circle" aria-hidden="true"></i>
                <span>El delivery entrega los productos más la comisión de la empresa por el envío; su ganancia es el resto del delivery.</span>
            </p>
        ` : `
            <p class="admin-texto-suave admin-cierre__sin-pendiente">
                <i class="bi bi-check2-circle" aria-hidden="true"></i>
                Sin pedidos pendientes en el periodo.
            </p>
        `;

        const historialBloque = `
            <div class="admin-detalle__bloque admin-cierre__historial-bloque">
                <div class="admin-cierre__historial-cabecera">
                    <h3>Historial de cierres</h3>
                    <button class="admin-btn admin-btn--ghost admin-cierre__historial-btn" type="button"
                        data-accion="cierre-historial" data-id="${Number(repartidor.id_trabajador)}" data-cargado="0"
                        aria-controls="cierreHistorialTrabajador">
                        <i class="bi bi-arrow-clockwise" aria-hidden="true"></i><span>Cargar</span>
                    </button>
                </div>
                <div class="admin-cierre__historial-trabajador" id="cierreHistorialTrabajador"
                    data-id-trabajador="${Number(repartidor.id_trabajador)}" aria-live="polite">
                    <p class="admin-texto-suave admin-cierre__historial-aviso">
                        <i class="bi bi-clock" aria-hidden="true"></i>
                        <span>Presiona <strong>Cargar</strong> para consultar los últimos cierres de este repartidor.</span>
                    </p>
                </div>
            </div>
        `;

        const contenido = `
            <div class="admin-cierre__metodos">
                <div>
                    <span>Efectivo</span>
                    <strong>${moneda(repartidor.efectivo)}</strong>
                </div>
                <div>
                    <span>Billetera móvil</span>
                    <strong>${moneda(repartidor.billetera)}</strong>
                </div>
                <div>
                    <span>Lafise</span>
                    <strong>${moneda(repartidor.lafise)}</strong>
                </div>
            </div>

            ${otros > 0 ? `<p class="admin-texto-suave">Otros métodos: ${moneda(otros)}</p>` : ''}

            <div class="admin-cierre__delivery">
                <div>
                    <span>Total delivery</span>
                    <strong>${moneda(repartidor.delivery)}</strong>
                </div>
                <div>
                    <span>Pago a la empresa</span>
                    <strong>${moneda(repartidor.comision_empresa)}</strong>
                </div>
                <div>
                    <span>Ganancia delivery</span>
                    <strong>${moneda(repartidor.ganancia_delivery)}</strong>
                </div>
            </div>

            <div class="admin-cierre__total">
                <span>Total a entregar a la empresa</span>
                <strong>${moneda(total)}</strong>
            </div>

            ${detalleBloque}
            ${modo === 'arquear' ? formularioHtml + historialBloque : historialBloque + formularioHtml}
        `;

        const desde = $('#cierreDesde')?.value || hoyISO();
        const hasta = $('#cierreHasta')?.value || hoyISO();

        const titulo = `${modo === 'arquear' ? 'Cierre' : 'Detalles'} · ${repartidor.nombre || 'Delivery'}`;
        abrirSheet(titulo, `${fechaDia(desde)} al ${fechaDia(hasta)}`, contenido, { enfocar: modo === 'arquear' });

        const formulario = $('#formCierreDelivery');

        if (formulario) {
            const inputMonto = $('#cierreMonto', formulario);
            const cajaError = $('#cierreError', formulario);
            const diferencia = $('#cierreDiferencia', formulario);

            const actualizarDiferencia = () => {
                const monto = Number(inputMonto?.value) || 0;
                const diferenciaCentavos = Math.round((monto - total) * 100);

                if (!diferencia) return;

                diferencia.classList.remove('admin-cierre__diferencia--ok', 'admin-cierre__diferencia--falta', 'admin-cierre__diferencia--sobra');

                if (diferenciaCentavos === 0) {
                    diferencia.textContent = 'Cuadra exacto.';
                    diferencia.classList.add('admin-cierre__diferencia--ok');
                } else if (diferenciaCentavos > 0) {
                    diferencia.textContent = `Sobran ${moneda(diferenciaCentavos / 100)}.`;
                    diferencia.classList.add('admin-cierre__diferencia--sobra');
                } else {
                    diferencia.textContent = `Faltan ${moneda(Math.abs(diferenciaCentavos) / 100)}.`;
                    diferencia.classList.add('admin-cierre__diferencia--falta');
                }
            };

            inputMonto?.addEventListener('input', () => {
                if (cajaError) {
                    cajaError.hidden = true;
                    cajaError.textContent = '';
                }
                inputMonto.removeAttribute('aria-invalid');
                actualizarDiferencia();
            });

            actualizarDiferencia();

            formulario.addEventListener('submit', (evento) => {
                registrarCierreDelivery(evento, repartidor, total);
            });
        }
    }

    async function cargarHistorialTrabajador(idTrabajador, boton = null) {
        const destino = $('#cierreHistorialTrabajador');
        if (!destino) return;

        const yaCargado = boton?.dataset.cargado === '1' || Boolean(destino.querySelector('.admin-cierre__historial-linea'));

        const restaurarBoton = (cargado) => {
            if (!boton || !boton.isConnected) return;

            boton.disabled = false;
            boton.removeAttribute('aria-busy');
            boton.dataset.cargado = cargado ? '1' : '0';
            boton.innerHTML = `<i class="bi bi-arrow-clockwise" aria-hidden="true"></i><span>${cargado ? 'Actualizar' : 'Cargar'}</span>`;
        };

        if (boton) {
            boton.disabled = true;
            boton.setAttribute('aria-busy', 'true');
            boton.innerHTML = `<span class="admin-btn__spinner admin-cierre__historial-spinner" aria-hidden="true"></span><span>${yaCargado ? 'Actualizando…' : 'Cargando…'}</span>`;
        }

        try {
            const datos = await adminRpc('web_admin_cierres_trabajador', {
                p_id_trabajador: Number(idTrabajador),
                p_limite: 50,
            });

            const actual = $('#cierreHistorialTrabajador');
            if (!actual || actual.dataset.idTrabajador !== String(idTrabajador)) return;

            renderHistorialTrabajador(actual, Array.isArray(datos.cierres) ? datos.cierres : []);
            restaurarBoton(true);
        } catch (error) {
            const actual = $('#cierreHistorialTrabajador');
            if (!actual || actual.dataset.idTrabajador !== String(idTrabajador)) return;

            if (yaCargado) {
                mostrarToast(`No se pudo actualizar el historial: ${error.message}`, 'error');
            } else {
                actual.innerHTML = `<p class="admin-texto-suave admin-cierre__historial-error">No se pudo cargar el historial: ${escapar(error.message)}</p>`;
            }

            restaurarBoton(yaCargado);
        }
    }

    function renderHistorialTrabajador(contenedor, cierres) {
        if (!cierres.length) {
            contenedor.innerHTML = '<p class="admin-texto-suave">Aún no hay cierres registrados para este repartidor.</p>';
            return;
        }

        contenedor.innerHTML = cierres.map((cierre) => {
            const diferencia = Number(cierre.diferencia) || 0;
            const cuadra = Math.abs(diferencia) < 0.005;
            const clase = cuadra ? 'ok' : (diferencia > 0 ? 'sobra' : 'falta');
            const etiqueta = cuadra
                ? 'Cuadra'
                : (diferencia > 0 ? `Sobra ${moneda(diferencia)}` : `Falta ${moneda(Math.abs(diferencia))}`);

            return `
                <div class="admin-cierre__historial-linea">
                    <div class="admin-cierre__historial-fecha">
                        <strong>${escapar(fechaCorta(cierre.fecha_cierre))}</strong>
                        <small>${escapar(fechaDia(cierre.desde))} al ${escapar(fechaDia(cierre.hasta))} · ${Number(cierre.pedidos) || 0} pedido(s)</small>
                        ${cierre.nota ? `<small class="admin-cierre__historial-nota">${escapar(cierre.nota)}</small>` : ''}
                    </div>
                    <div class="admin-cierre__historial-montos">
                        <strong>${moneda(cierre.monto_entregado)}</strong>
                        <small>Total ${moneda(cierre.total_empresa)}</small>
                        <span class="admin-cierre__historial-estado admin-cierre__historial-estado--${clase}">${escapar(etiqueta)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function registrarCierreDelivery(evento, repartidor, total) {
        evento.preventDefault();

        const form = evento.currentTarget;
        const boton = $('#btnCerrarDelivery', form);
        const cajaError = $('#cierreError', form);
        const inputMonto = $('#cierreMonto', form);
        const inputNota = $('#cierreNota', form);

        const mostrarError = (mensaje) => {
            if (cajaError) {
                cajaError.textContent = mensaje;
                cajaError.hidden = false;
            }
            inputMonto?.setAttribute('aria-invalid', 'true');
            inputMonto?.focus();
        };

        if (cajaError) {
            cajaError.hidden = true;
            cajaError.textContent = '';
        }
        inputMonto?.removeAttribute('aria-invalid');

        const monto = Number.parseFloat(String(inputMonto?.value || '').replace(',', '.'));
        const montoCentavos = Number.isFinite(monto) ? Math.round(monto * 100) : 0;

        if (!Number.isFinite(monto) || montoCentavos < 0) {
            mostrarError('Ingresa un monto entregado válido.');
            return;
        }

        if (Math.abs(monto * 100 - montoCentavos) > 0.000001) {
            mostrarError('Usa como máximo dos decimales en el monto entregado.');
            return;
        }

        const desde = $('#cierreDesde')?.value || hoyISO();
        const hasta = $('#cierreHasta')?.value || hoyISO();

        if (boton) {
            boton.disabled = true;
            boton.setAttribute('aria-busy', 'true');
            boton.innerHTML = '<span class="admin-btn__spinner" aria-hidden="true"></span><span>Registrando…</span>';
        }

        try {
            const datos = await adminRpc('web_admin_cierre_delivery_guardar', {
                p_id_trabajador: Number(repartidor.id_trabajador),
                p_desde: desde,
                p_hasta: hasta,
                p_monto_entregado: montoCentavos / 100,
                p_nota: inputNota?.value?.trim() || null,
            });

            mostrarToast(datos.mensaje || 'Cierre registrado.');
            estado.cargada.cierre = false;
            estado.cargada.pedidos = false;
            cerrarSheet();
            await Promise.all([cargarCierre(), cargarResumen()]);
        } catch (error) {
            mostrarError(error.message);
            mostrarToast(error.message, 'error');

            if (boton) {
                boton.disabled = false;
                boton.removeAttribute('aria-busy');
                boton.innerHTML = '<i class="bi bi-check2-circle" aria-hidden="true"></i><span>Registrar cierre</span>';
            }
        }
    }

    /* ───────────────────────── Cuentas por cobrar ───────────────────────── */

    async function cargarCobros() {
        const contenedor = $('#listaCobros');
        cargando(contenedor);

        try {
            const datos = await adminRpc('web_admin_cuentas', { p_estado: 'todas' });
            estado.cuentas = Array.isArray(datos.cuentas) ? datos.cuentas : [];
            estado.cargada.cobros = true;
            renderCobros(datos.resumen || {});
        } catch (error) {
            vacio(contenedor, 'bi-exclamation-triangle', 'No se pudieron cargar las cuentas', error.message);
        }
    }

    function renderCobros(resumen = null) {
        if (resumen) estado.resumenCobros = resumen;

        const datosResumen = estado.resumenCobros || {};
        const saldo = $('#cobrosSaldo');
        const abiertas = $('#cobrosAbiertas');
        const vencidas = $('#cobrosVencidas');

        if (saldo) saldo.textContent = moneda(datosResumen.saldo_total);
        if (abiertas) abiertas.textContent = String(Number(datosResumen.cuentas_abiertas) || 0);
        if (vencidas) vencidas.textContent = String(Number(datosResumen.cuentas_vencidas) || 0);

        const contenedor = $('#listaCobros');
        if (!contenedor) return;

        const filtro = estado.filtros.cobros;

        const lista = estado.cuentas.filter((cuenta) => {
            if (filtro !== 'todas' && cuenta.estado !== filtro) return false;

            return coincideBusqueda(estado.busquedas.cobros, [
                cuenta.cliente,
                cuenta.factura,
                cuenta.telefono,
            ]);
        });

        if (!lista.length) {
            vacio(contenedor, 'bi-cash-coin', 'Sin cuentas con ese filtro', 'Prueba con otro estado o borra la búsqueda.');
            return;
        }

        contenedor.innerHTML = lista.map((cuenta) => {
            const wa = Number(cuenta.saldo) > 0
                ? enlaceWhatsApp(
                    cuenta.telefono,
                    `Hola ${cuenta.cliente || ''}, te recordamos el saldo de tu compra ${cuenta.factura || ''} en Tellez Nic Store.`
                )
                : '';

            return `
                <article class="admin-card">
                    <div class="admin-card__fila">
                        <div class="admin-card__titulo">
                            <strong>${escapar(cuenta.cliente || 'Cliente')}</strong>
                            <span>${escapar(cuenta.factura || 'Sin factura')} · ${escapar(fechaDia(cuenta.fecha_venta))}</span>
                        </div>
                        <span class="admin-badge ${claseCuenta(cuenta.estado)}">${escapar(etiquetaCuenta(cuenta.estado))}</span>
                    </div>

                    <div class="admin-meta admin-meta--sep">
                        <span>Saldo pendiente</span>
                        <strong class="admin-monto">${moneda(cuenta.saldo)}</strong>
                    </div>

                    <div class="admin-datos">
                        <span>Total de la venta: ${moneda(cuenta.total)} · Pagado: ${moneda(cuenta.pagado)}</span>
                        <span>${cuenta.proximo_vencimiento ? `Próximo vencimiento: ${escapar(fechaDia(cuenta.proximo_vencimiento))}` : 'Sin próximos vencimientos'}</span>
                        ${Number(cuenta.cuotas_vencidas) > 0 ? `<span class="admin-badge admin-badge--rojo">${Number(cuenta.cuotas_vencidas)} cuota(s) vencida(s)</span>` : ''}
                        ${cuenta.productos ? `<span>${escapar(cuenta.productos)}</span>` : ''}
                    </div>

                    <div class="admin-acciones">
                        ${Number(cuenta.saldo) > 0 ? `
                            <button class="admin-btn admin-btn--verde" type="button" data-accion="cuenta-pagar" data-id="${Number(cuenta.id_venta)}">
                                <i class="bi bi-cash-coin" aria-hidden="true"></i> Pagar
                            </button>` : ''}
                        <button class="admin-btn admin-btn--suave" type="button" data-accion="cuenta-detalle" data-id="${Number(cuenta.id_venta)}">
                            <i class="bi bi-receipt" aria-hidden="true"></i> Ver cuotas
                        </button>
                        ${wa ? `<a class="admin-btn admin-btn--ghost" href="${wa}" target="_blank" rel="noopener"><i class="bi bi-whatsapp" aria-hidden="true"></i> Recordar</a>` : ''}
                    </div>
                </article>
            `;
        }).join('');
    }

    async function abrirCuenta(idVenta) {
        abrirSheet('Cuenta por cobrar', '', '<div class="admin-esqueleto"></div>');

        try {
            const datos = await adminRpc('web_admin_cuenta_detalle', { p_id_venta: idVenta });
            const cuenta = datos.cuenta || {};
            const cuotas = Array.isArray(cuenta.cuotas) ? cuenta.cuotas : [];
            const pagos = Array.isArray(cuenta.pagos) ? cuenta.pagos : [];
            const saldoPendiente = Number(cuenta.saldo) > 0;
            const wa = saldoPendiente
                ? enlaceWhatsApp(cuenta.telefono, `Hola ${cuenta.cliente || ''}, te escribimos por el saldo de tu compra ${cuenta.factura || ''}.`)
                : '';

            const cuotasHtml = cuotas.length
                ? cuotas.map((cuota) => `
                    <div class="admin-linea">
                        <span>
                            Cuota ${Number(cuota.numero) || ''}
                            <br><small>Vence ${escapar(fechaDia(cuota.fecha_vencimiento))}</small>
                        </span>
                        <span style="text-align:right">
                            <strong>${moneda(cuota.saldo)}</strong>
                            <br><small class="admin-badge ${claseCuenta(cuota.estado)}">${escapar(etiquetaCuenta(cuota.estado))}</small>
                        </span>
                    </div>
                `).join('')
                : '<p class="admin-texto-suave">Sin cuotas registradas.</p>';

            const pagosHtml = pagos.length
                ? pagos.map((pago) => `
                    <div class="admin-linea">
                        <span>${escapar(fechaDia(pago.fecha))} · ${escapar(pago.metodo || 'Pago')}${pago.referencia ? ` · ${escapar(pago.referencia)}` : ''}</span>
                        <strong>${moneda(pago.monto)}</strong>
                    </div>
                `).join('')
                : '<p class="admin-texto-suave">Sin pagos registrados.</p>';

            const contenido = `
                <div class="admin-card__fila">
                    <div class="admin-card__titulo">
                        <strong>${escapar(cuenta.cliente || 'Cliente')}</strong>
                        <span>${escapar(cuenta.factura || 'Sin factura')} · ${escapar(fechaDia(cuenta.fecha_venta))}</span>
                    </div>
                </div>

                <div class="admin-cuenta__resumen">
                    <div>
                        <span>Total de la venta</span>
                        <strong>${moneda(cuenta.total)}</strong>
                    </div>
                    <div>
                        <span>Saldo pendiente</span>
                        <strong class="${saldoPendiente ? 'saldo-pendiente' : 'saldo-pagado'}">${moneda(cuenta.saldo)}</strong>
                    </div>
                </div>

                ${cuenta.puede_pagar ? `
                    <div class="admin-acciones">
                        <button class="admin-btn admin-btn--verde" type="button" data-accion="cuenta-pagar" data-id="${Number(cuenta.id_venta)}">
                            <i class="bi bi-cash-coin" aria-hidden="true"></i> Registrar abono
                        </button>
                    </div>` : ''}

                <div class="admin-detalle__contacto">
                    ${wa ? `<a class="admin-btn admin-btn--suave" href="${wa}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Recordar por WhatsApp</a>` : ''}
                    ${cuenta.telefono ? `<a class="admin-btn admin-btn--ghost" href="tel:${escapar(soloDigitos(cuenta.telefono))}"><i class="bi bi-telephone"></i> Llamar</a>` : ''}
                </div>

                <div class="admin-detalle__bloque">
                    <h3>Cuotas</h3>
                    <div class="admin-lista-lineas">${cuotasHtml}</div>
                </div>

                <div class="admin-detalle__bloque">
                    <h3>Pagos registrados</h3>
                    <div class="admin-lista-lineas">${pagosHtml}</div>
                </div>

                <p class="admin-nota">
                    <i class="bi bi-info-circle" aria-hidden="true"></i>
                    <span>${cuenta.puede_pagar
                        ? 'Los abonos se aplican a las cuotas más antiguas y actualizan caja/cuentas al instante.'
                        : (saldoPendiente
                            ? 'No hay una caja abierta ni una cuenta activa para registrar abonos.'
                            : 'Esta cuenta ya está pagada.')}</span>
                </p>
            `;

            abrirSheet(cuenta.factura || 'Cuenta por cobrar', cuenta.cliente || '', contenido);
        } catch (error) {
            abrirSheet('Cuenta por cobrar', '', `<p class="admin-alerta">${escapar(error.message)}</p>`);
        }
    }

    async function abrirPagoCuenta(idVenta) {
        abrirSheet('Registrar abono', '', '<div class="admin-esqueleto"></div>');

        try {
            const datos = await adminRpc('web_admin_cuenta_detalle', { p_id_venta: idVenta });
            const cuenta = datos.cuenta || {};
            const saldo = Number(cuenta.saldo) || 0;

            if (!cuenta.puede_pagar) {
                abrirSheet('Registrar abono', '', `
                    <p class="admin-alerta">
                        ${escapar(saldo <= 0
                            ? 'Esta cuenta ya está pagada.'
                            : 'No hay una caja abierta ni una cuenta activa para registrar el abono.')}
                    </p>
                `);
                return;
            }

            const opciones = [];

            if (cuenta.caja) {
                opciones.push({ valor: 'efectivo', texto: 'Efectivo (caja)' });
            }

            (Array.isArray(cuenta.cuentas) ? cuenta.cuentas : []).forEach((opcion) => {
                opciones.push({
                    valor: `cuenta:${Number(opcion.id_cuenta)}`,
                    texto: opcion.nombre || `Cuenta ${opcion.id_cuenta}`,
                });
            });

            if (!opciones.length) {
                abrirSheet('Registrar abono', '', '<p class="admin-alerta">No hay una forma de pago disponible.</p>');
                return;
            }

            const contenido = `
                <div class="admin-pago">
                    <div class="admin-pago__resumen">
                        <div>
                            <span>Cliente</span>
                            <strong>${escapar(cuenta.cliente || 'Cliente')}</strong>
                        </div>
                        <div>
                            <span>Factura</span>
                            <strong>${escapar(cuenta.factura || 'Sin factura')}</strong>
                        </div>
                    </div>

                    <div class="admin-pago__total">
                        <span>Saldo pendiente</span>
                        <strong>${moneda(saldo)}</strong>
                    </div>

                    <form class="admin-form" id="formPagoCuenta" data-id="${Number(cuenta.id_venta)}" novalidate>
                        <div class="admin-form__campo">
                            <label for="cuentaMonto">Monto del abono</label>
                            <input id="cuentaMonto" name="monto" type="number" inputmode="decimal" step="0.01" min="0.01"
                                max="${saldo.toFixed(2)}" value="${saldo.toFixed(2)}" required>
                            <small>Puedes abonar una parte o el saldo total.</small>
                        </div>

                        <div class="admin-form__campo">
                            <label for="cuentaFormaPago">Forma de pago</label>
                            <select id="cuentaFormaPago" name="forma_pago" required>
                                ${opciones.map((opcion) => `<option value="${escapar(opcion.valor)}">${escapar(opcion.texto)}</option>`).join('')}
                            </select>
                        </div>

                        <div class="admin-form__campo">
                            <label for="cuentaReferencia">Referencia <span class="admin-texto-suave">(opcional)</span></label>
                            <input id="cuentaReferencia" name="referencia" type="text" maxlength="80" autocomplete="off"
                                placeholder="N.º de transacción o comprobante">
                        </div>

                        <p class="admin-alerta admin-pago__error" id="cuentaError" role="alert" hidden></p>

                        <div class="admin-form__acciones">
                            <button class="admin-btn admin-btn--ghost" type="button" data-cerrar-sheet>Cancelar</button>
                            <button class="admin-btn admin-btn--verde" type="submit" id="btnRegistrarAbono">
                                <i class="bi bi-cash-coin" aria-hidden="true"></i>
                                <span>Registrar abono</span>
                            </button>
                        </div>
                    </form>

                    <p class="admin-pago__nota">
                        <i class="bi bi-info-circle" aria-hidden="true"></i>
                        <span>El abono se aplica primero a las cuotas más antiguas.</span>
                    </p>
                </div>
            `;

            abrirSheet('Registrar abono', `${cuenta.factura || 'Cuenta'} · ${moneda(saldo)}`, contenido);

            $('#formPagoCuenta')?.addEventListener('submit', (evento) => {
                registrarPagoCuenta(evento, idVenta, saldo);
            });

            const inputMonto = $('#cuentaMonto');
            const cajaError = $('#cuentaError');

            inputMonto?.addEventListener('input', () => {
                if (!cajaError) return;
                cajaError.hidden = true;
                cajaError.textContent = '';
                inputMonto.removeAttribute('aria-invalid');
            });

            setTimeout(() => {
                inputMonto?.focus();
                inputMonto?.select();
            }, 60);
        } catch (error) {
            abrirSheet('Registrar abono', '', `<p class="admin-alerta">${escapar(error.message)}</p>`);
        }
    }

    async function registrarPagoCuenta(evento, idVenta, saldo) {
        evento.preventDefault();

        const form = evento.currentTarget;
        const boton = $('#btnRegistrarAbono', form);
        const cajaError = $('#cuentaError', form);
        const inputMonto = $('#cuentaMonto', form);
        const selectForma = $('#cuentaFormaPago', form);
        const inputReferencia = $('#cuentaReferencia', form);

        const mostrarError = (mensaje) => {
            if (cajaError) {
                cajaError.textContent = mensaje;
                cajaError.hidden = false;
            }
            inputMonto?.setAttribute('aria-invalid', 'true');
            inputMonto?.focus();
            inputMonto?.select();
        };

        if (cajaError) {
            cajaError.hidden = true;
            cajaError.textContent = '';
        }
        inputMonto?.removeAttribute('aria-invalid');

        const monto = Number.parseFloat(String(inputMonto?.value || '').replace(',', '.'));
        const saldoCentavos = Math.round((Number(saldo) || 0) * 100);
        const montoCentavos = Number.isFinite(monto) ? Math.round(monto * 100) : 0;

        if (!Number.isFinite(monto) || montoCentavos <= 0) {
            mostrarError('Ingresa un monto mayor que cero.');
            return;
        }

        if (Math.abs(monto * 100 - montoCentavos) > 0.000001) {
            mostrarError('Usa como máximo dos decimales en el monto.');
            return;
        }

        if (montoCentavos > saldoCentavos) {
            mostrarError(`El abono no puede superar el saldo pendiente. Sobran ${moneda((montoCentavos - saldoCentavos) / 100)}.`);
            return;
        }

        const forma = selectForma?.value || 'efectivo';
        const idCuenta = forma.startsWith('cuenta:') ? Number(forma.split(':')[1]) : null;

        if (forma.startsWith('cuenta:') && !idCuenta) {
            mostrarError('Selecciona una cuenta válida.');
            return;
        }

        if (boton) {
            boton.disabled = true;
            boton.setAttribute('aria-busy', 'true');
            boton.innerHTML = '<span class="admin-btn__spinner" aria-hidden="true"></span><span>Registrando…</span>';
        }

        try {
            const datos = await adminRpc('web_admin_cuenta_pagar', {
                p_id_venta: idVenta,
                p_monto: montoCentavos / 100,
                p_id_cuenta: idCuenta,
                p_referencia: inputReferencia?.value?.trim() || null,
            });

            mostrarToast(datos.mensaje || 'Abono registrado.');
            estado.cargada.cobros = false;
            await Promise.all([cargarCobros(), cargarResumen()]);
            await abrirCuenta(idVenta);
        } catch (error) {
            mostrarError(error.message);
            mostrarToast(error.message, 'error');

            if (boton) {
                boton.disabled = false;
                boton.removeAttribute('aria-busy');
                boton.innerHTML = '<i class="bi bi-cash-coin" aria-hidden="true"></i><span>Registrar abono</span>';
            }
        }
    }

    /* ───────────────────────── Sorteo (temporal) ───────────────────────── */

    async function cargarSorteo() {
        const contenedor = $('#listaSorteo');
        cargando(contenedor);

        try {
            const datos = await adminRpc('web_admin_sorteo_lista');
            estado.sorteo = Array.isArray(datos.participantes) ? datos.participantes : [];
            estado.cargada.sorteo = true;
            renderSorteo();
        } catch (error) {
            const mensaje = String(error.message || '');
            const faltaSql = /could not find the function|function .* does not exist/i.test(mensaje);

            vacio(
                contenedor,
                'bi-exclamation-triangle',
                faltaSql ? 'Falta preparar el sorteo en Supabase' : 'No se pudo cargar el sorteo',
                faltaSql
                    ? 'Ejecuta supabase/ruleta-participantes.sql en el SQL Editor de Supabase y vuelve a intentar.'
                    : mensaje
            );
        }
    }

    function sorteoFiltrado() {
        const filtro = estado.filtros.sorteo;

        return estado.sorteo.filter((fila) => {
            if (filtro === 'aprobados' && !fila.aprobado) return false;
            if (filtro === 'pendientes' && fila.aprobado) return false;

            return coincideBusqueda(estado.busquedas.sorteo, [fila.nombre, fila.correo, fila.instagram, fila.usuario]);
        });
    }

    function renderSorteo() {
        const contenedor = $('#listaSorteo');
        if (!contenedor) return;

        const aprobados = estado.sorteo.filter((fila) => fila.aprobado).length;

        actualizarContador($('#sorteoContador'), aprobados);

        const badge = $('#navBadgeSorteo');

        if (badge) {
            badge.textContent = aprobados > 9 ? '9+' : String(aprobados);
            badge.hidden = aprobados <= 0;
        }

        if (!estado.sorteo.length) {
            vacio(contenedor, 'bi-star', 'Sin cuentas registradas', 'Cuando alguien cree su cuenta en la tienda aparecerá aquí para aprobarla.');
            return;
        }

        const lista = sorteoFiltrado();

        if (!lista.length) {
            vacio(contenedor, 'bi-search', 'Sin resultados', 'Prueba con otro filtro o cambia la búsqueda.');
            return;
        }

        contenedor.innerHTML = lista.map((fila) => {
            const id = Number(fila.id_cliente);
            const nombre = escapar(fila.nombre);
            const correo = fila.correo ? escapar(fila.correo) : 'Sin correo';
            const usuario = fila.instagram ? `@${escapar(fila.instagram)}` : '';

            return `
                <article class="admin-card admin-sorteo">
                    <div class="admin-ficha">
                        <div class="admin-ficha__media"><i class="bi bi-person" aria-hidden="true"></i></div>

                        <div class="admin-ficha__cuerpo">
                            <h2>${nombre}</h2>
                            <div class="admin-datos">
                                <span>${correo}</span>
                                ${fila.alta ? `<span>Cuenta creada el ${escapar(fechaDia(fila.alta))}</span>` : ''}
                                <span class="admin-badge ${fila.aprobado ? 'admin-badge--verde' : 'admin-badge--ambar'}">${fila.aprobado ? 'Aprobado' : 'Pendiente'}</span>
                            </div>
                        </div>

                        <label class="admin-switch" title="${fila.aprobado ? 'Quitar del sorteo' : 'Aprobar para el sorteo'}">
                            <input type="checkbox" data-accion="sorteo-estado" data-id="${id}" ${fila.aprobado ? 'checked' : ''}
                                aria-label="${fila.aprobado ? 'Quitar del sorteo a' : 'Aprobar para el sorteo a'} ${nombre}">
                            <span></span>
                        </label>
                    </div>

                    <div class="admin-sorteo__ig">
                        <label for="sorteoIg${id}">Instagram</label>
                        <div class="admin-campo__control">
                            <i class="bi bi-instagram" aria-hidden="true"></i>
                            <input id="sorteoIg${id}" type="text" value="${usuario}" placeholder="@usuario"
                                maxlength="60" autocomplete="off" spellcheck="false"
                                data-accion="sorteo-instagram" data-id="${id}"
                                aria-label="Usuario de Instagram de ${nombre}">
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    async function cambiarSorteo(id, aprobado, control) {
        const fila = estado.sorteo.find((item) => Number(item.id_cliente) === Number(id));

        control.disabled = true;

        try {
            await adminRpc('web_admin_sorteo_participante', {
                p_id_cliente: Number(id),
                p_aprobado: Boolean(aprobado),
                p_instagram: fila?.instagram || '',
            });

            if (fila) fila.aprobado = Boolean(aprobado);

            mostrarToast(aprobado ? 'Cuenta aprobada para el sorteo.' : 'Cuenta retirada del sorteo.');
            renderSorteo();
        } catch (error) {
            control.checked = !aprobado;
            mostrarToast(error.message, 'error');
        } finally {
            control.disabled = false;
        }
    }

    async function guardarInstagramSorteo(id, control) {
        const fila = estado.sorteo.find((item) => Number(item.id_cliente) === Number(id));
        if (!fila) return;

        const actual = fila.instagram ? `@${fila.instagram}` : '';
        const valor = control.value.trim();

        if (valor === actual) return;

        control.disabled = true;

        try {
            const datos = await adminRpc('web_admin_sorteo_participante', {
                p_id_cliente: Number(id),
                p_aprobado: Boolean(fila.aprobado),
                p_instagram: valor,
            });

            fila.instagram = datos.instagram || '';
            control.value = fila.instagram ? `@${fila.instagram}` : '';
            mostrarToast('Usuario de Instagram guardado.');
        } catch (error) {
            control.value = actual;
            mostrarToast(error.message, 'error');
        } finally {
            control.disabled = false;
        }
    }

    /* ───────────────────────── Eventos globales ───────────────────────── */

    function iniciarEventos() {
        $$('.admin-nav__item').forEach((boton) => {
            boton.addEventListener('click', () => mostrarVista(boton.dataset.vista));
        });

        $('#adminRefrescar')?.addEventListener('click', refrescar);

        conectarAvisos();

        $('#adminSalir')?.addEventListener('click', async () => {
            const confirmado = await confirmar('¿Cerrar la sesión del panel en este dispositivo?', 'Cerrar sesión');
            if (!confirmado) return;

            const sesion = leerSesion();

            try {
                if (sesion?.token) {
                    await rpc('web_admin_logout', { p_token: sesion.token });
                }
            } catch {
                /* Si falla la red, igual se borra la sesión local. */
            }

            cerrarSesionLocal('saliste');
        });

        /* Filtros de pedidos */
        $('#pedidosFiltros')?.addEventListener('click', (evento) => {
            const chip = evento.target.closest('[data-estado]');
            if (!chip) return;

            estado.filtros.pedidos = chip.dataset.estado;
            $$('#pedidosFiltros .admin-chip').forEach((boton) => boton.classList.toggle('is-activo', boton === chip));
            renderPedidos();
        });

        $('#pedidosRangoDia')?.addEventListener('change', (evento) => {
            const valor = evento.target.value;

            if (valor === 'otro') {
                selectorFechaPedidos?.open();
                return;
            }

            if (valor === 'todos') {
                estado.filtros.pedidosDia = null;

                if (selectorFechaPedidos) {
                    selectorFechaPedidos.clear();
                } else {
                    const input = $('#pedidosFechaEspecifica');
                    if (input) input.value = '';
                }

                renderPedidos();
                return;
            }

            const fechaBase = fechaRelativa(valor);
            const diaISO = fechaISO(fechaBase);
            estado.filtros.pedidosDia = diaISO;

            if (selectorFechaPedidos) {
                selectorFechaPedidos.setDate(fechaBase, false);
            } else {
                const input = $('#pedidosFechaEspecifica');
                if (input) input.value = fechaDia(diaISO);
            }

            renderPedidos();
        });

        /* Filtros de repartidores */
        $('#trabajadoresFiltros')?.addEventListener('click', (evento) => {
            const chip = evento.target.closest('[data-estado]');
            if (!chip) return;

            estado.filtros.trabajadores = chip.dataset.estado;
            $$('#trabajadoresFiltros .admin-chip').forEach((boton) => boton.classList.toggle('is-activo', boton === chip));
            renderTrabajadores();
        });

        /* Filtros de solicitudes de cambio */
        $('#cambiosFiltros')?.addEventListener('click', (evento) => {
            const chip = evento.target.closest('[data-estado]');
            if (!chip) return;

            estado.filtros.cambios = chip.dataset.estado;
            $$('#cambiosFiltros .admin-chip').forEach((boton) => boton.classList.toggle('is-activo', boton === chip));
            renderCambios();
        });

        /* Filtros de cobros */
        $('#cobrosFiltros')?.addEventListener('click', (evento) => {
            const chip = evento.target.closest('[data-estado]');
            if (!chip) return;

            estado.filtros.cobros = chip.dataset.estado;
            $$('#cobrosFiltros .admin-chip').forEach((boton) => boton.classList.toggle('is-activo', boton === chip));
            renderCobros();
        });

        /* Filtros del sorteo */
        $('#sorteoFiltros')?.addEventListener('click', (evento) => {
            const chip = evento.target.closest('[data-filtro]');
            if (!chip) return;

            estado.filtros.sorteo = chip.dataset.filtro;
            $$('#sorteoFiltros .admin-chip').forEach((boton) => boton.classList.toggle('is-activo', boton === chip));
            renderSorteo();
        });

        $('#sorteoBuscar')?.addEventListener('input', (evento) => {
            clearTimeout(temporizadorBusqueda);
            temporizadorBusqueda = setTimeout(() => {
                estado.busquedas.sorteo = evento.target.value;
                renderSorteo();
            }, 220);
        });

        /* Búsquedas con retardo */
        $('#pedidosBuscar')?.addEventListener('input', (evento) => {
            clearTimeout(temporizadorBusqueda);
            temporizadorBusqueda = setTimeout(() => {
                estado.busquedas.pedidos = evento.target.value;
                renderPedidos();
            }, 220);
        });

        $('#cobrosBuscar')?.addEventListener('input', (evento) => {
            clearTimeout(temporizadorBusqueda);
            temporizadorBusqueda = setTimeout(() => {
                estado.busquedas.cobros = evento.target.value;
                renderCobros();
            }, 220);
        });

        $('#cierreDesde')?.addEventListener('change', () => cargarCierre());
        $('#cierreHasta')?.addEventListener('change', () => cargarCierre());

        $('#cierreBuscar')?.addEventListener('input', (evento) => {
            estado.busquedas.cierre = evento.target.value;
            renderCierre();
        });

        /* Acciones delegadas */
        document.addEventListener('click', async (evento) => {
            const botonAyuda = evento.target.closest('[data-ayuda-boton]');

            if (botonAyuda) {
                evento.preventDefault();
                alternarAyuda(botonAyuda);
                return;
            }

            if (!evento.target.closest('.admin-ayuda')) cerrarAyudas();

            const boton = evento.target.closest('[data-accion]');

            if (!boton) {
                if (evento.target.closest('[data-cerrar-sheet]')) cerrarSheet();
                return;
            }

            const accion = boton.dataset.accion;

            if (accion === 'pedido-detalle') return abrirPedido(Number(boton.dataset.id));
            if (accion === 'pedido-aceptar') return aceptarPedido(Number(boton.dataset.id), boton, boton.dataset.modo === 'facturar');
            if (accion === 'pedido-cobrar') return abrirCobroPedido(Number(boton.dataset.id), 'cobrar');
            if (accion === 'pedido-estado') return cambiarEstadoPedido(Number(boton.dataset.id), boton.dataset.estado, boton);
            if (accion === 'promo-editar') {
                const promo = estado.promociones.find((fila) => Number(fila.id_promocion) === Number(boton.dataset.id));
                return abrirFormularioPromocion(promo || null);
            }
            if (accion === 'cupon-editar') {
                const cupon = estado.cupones.find((fila) => Number(fila.id_cupon) === Number(boton.dataset.id));
                return abrirFormularioCupon(cupon || null);
            }
            if (accion === 'trabajador-form') {
                const trabajador = estado.trabajadores.find((fila) => Number(fila.id_trabajador) === Number(boton.dataset.id));
                if (trabajador) abrirFormularioTrabajador(trabajador, boton.dataset.modo);
                return;
            }
            if (accion === 'cambio-form') {
                const cambio = estado.cambios.find((fila) => Number(fila.id_cambio) === Number(boton.dataset.id));
                if (cambio) abrirFormularioCambio(cambio, boton.dataset.modo);
                return;
            }
            if (accion === 'cierre-historial') return cargarHistorialTrabajador(Number(boton.dataset.id), boton);
            if (accion === 'cierre-detalle') return abrirCierre(Number(boton.dataset.id), boton.dataset.modo || 'detalle');
            if (accion === 'cuenta-detalle') return abrirCuenta(Number(boton.dataset.id));
            if (accion === 'cuenta-pagar') return abrirPagoCuenta(Number(boton.dataset.id));
        });

        document.addEventListener('change', (evento) => {
            const control = evento.target.closest('[data-accion]');
            if (!control) return;

            if (control.dataset.accion === 'promo-filtro') {
                estado.filtros.promociones = control.value;
                renderPromociones();
            }

            if (control.dataset.accion === 'promo-estado') {
                cambiarEstadoPromocion(control.dataset.id, control.checked, control);
            }

            if (control.dataset.accion === 'cupon-estado') {
                cambiarEstadoCupon(control.dataset.id, control.checked, control);
            }

            if (control.dataset.accion === 'sorteo-estado') {
                cambiarSorteo(control.dataset.id, control.checked, control);
            }

            if (control.dataset.accion === 'sorteo-instagram') {
                guardarInstagramSorteo(control.dataset.id, control);
            }
        });

        /* Botones de creación */
        $('#btnNuevaPromo')?.addEventListener('click', () => abrirFormularioPromocion());
        $('#btnAutoAceptar')?.addEventListener('click', alternarAutoAceptar);
        $('#btnMostrarTodasPromos')?.addEventListener('click', () => {
            estado.filtros.promociones = '';
            renderPromociones();
        });
        $('#btnNuevoCupon')?.addEventListener('click', () => abrirFormularioCupon());

        /* Diálogo */
        $('#adminDialogoCancelar')?.addEventListener('click', () => cerrarDialogo(false));
        $('#adminDialogoAceptar')?.addEventListener('click', () => cerrarDialogo(true));
        $('#adminDialogo')?.addEventListener('click', (evento) => {
            if (evento.target.id === 'adminDialogo') cerrarDialogo(false);
        });

        document.addEventListener('keydown', (evento) => {
            if (evento.key !== 'Escape') return;

            const ayudaAbierta = $('.admin-ayuda__panel:not([hidden])');

            if (ayudaAbierta) {
                const boton = ayudaAbierta.closest('.admin-ayuda')?.querySelector('[data-ayuda-boton]');

                cerrarAyudas();
                boton?.focus({ preventScroll: true });
                return;
            }

            if (!$('#adminDialogo')?.hidden) {
                cerrarDialogo(false);
                return;
            }

            if (!$('#adminSheet')?.hidden) {
                cerrarSheet();
            }
        });
    }

    /* ───────────────────────── Avisos push ───────────────────────── */

    async function cargarAvisos() {
        const lista = $('#listaEnvios');
        cargando(lista);

        cargarPromocionesAvisos();

        try {
            const datos = await adminRpc('web_admin_push_resumen');

            estado.avisos.dispositivos = Number(datos.dispositivos || 0);
            estado.avisos.clientes = Number(datos.clientes || 0);
            estado.avisos.historial = Array.isArray(datos.historial) ? datos.historial : [];
            estado.avisos.lista = Array.isArray(datos.lista) ? datos.lista : [];
            estado.cargada.avisos = true;

            renderAvisos();
        } catch (error) {
            const mensaje = String(error.message || '');
            const faltaSql = /could not find the function|function .* does not exist/i.test(mensaje);

            actualizarContador($('#avisosContador'), 0);

            vacio(
                lista,
                'bi-exclamation-triangle',
                faltaSql ? 'Falta preparar las notificaciones en Supabase' : 'No se pudieron cargar los avisos',
                faltaSql
                    ? 'Ejecuta supabase/notificaciones-push.sql en el SQL Editor de Supabase y vuelve a intentar.'
                    : mensaje
            );
        }
    }

    function renderAvisos() {
        actualizarContador($('#avisosContador'), estado.avisos.dispositivos);

        const select = $('#avisoCliente');

        if (select) {
            const anterior = select.value;

            select.innerHTML = estado.avisos.lista.length
                ? estado.avisos.lista
                    .map((fila) => {
                        const dispositivos = Number(fila.dispositivos) || 0;
                        const detalle = dispositivos
                            ? `${dispositivos} dispositivo${dispositivos === 1 ? '' : 's'}`
                            : 'sin avisos activados';

                        return `<option value="${Number(fila.id_cliente)}">${escapar(fila.nombre || fila.correo)} · ${detalle}</option>`;
                    })
                    .join('')
                : '<option value="">Todavía no hay clientes registrados</option>';

            if (anterior) select.value = anterior;
        }

        pintarSelectPromociones();

        const lista = $('#listaEnvios');
        if (!lista) return;

        if (!estado.avisos.historial.length) {
            vacio(lista, 'bi-broadcast', 'Sin envíos todavía', 'Cuando envíes tu primer aviso aparecerá aquí con el resultado.');
            return;
        }

        lista.innerHTML = estado.avisos.historial.map((fila) => {
            const imagen = urlImagenPromocion(fila.imagen);
            const esPromo = fila.tipo === 'promocion';

            return `
            <article class="admin-card admin-envio">
                <div class="admin-envio__cabecera">
                    <strong>${escapar(fila.titulo)}</strong>
                    <span>${fechaCorta(fila.fecha)}</span>
                </div>
                <div class="admin-envio__cuerpo">
                    ${imagen ? `<img class="admin-envio__imagen" src="${escapar(imagen)}" alt="" loading="lazy">` : ''}
                    <p class="admin-envio__mensaje">${escapar(fila.mensaje)}</p>
                </div>
                <div class="admin-envio__datos">
                    <span><i class="bi ${esPromo ? 'bi-tag' : 'bi-phone'}" aria-hidden="true"></i> ${esPromo ? 'Promoción' : 'Mensaje'}</span>
                    <span><i class="bi bi-broadcast" aria-hidden="true"></i> ${Number(fila.dispositivos)} dispositivo${Number(fila.dispositivos) === 1 ? '' : 's'}</span>
                    <span><i class="bi bi-check2" aria-hidden="true"></i> ${Number(fila.enviados)} entregado${Number(fila.enviados) === 1 ? '' : 's'}</span>
                    ${Number(fila.errores) ? `<span class="admin-envio__error"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i> ${Number(fila.errores)} con error</span>` : ''}
                    <span>${fila.destino === 'cliente' ? 'Un cliente' : 'Todos los suscritos'}</span>
                </div>
            </article>`;
        }).join('');
    }

    /* ── Tipo de aviso y promociones ── */

    async function cargarPromocionesAvisos() {
        try {
            const promos = await adminRpc('web_admin_promociones');
            estado.avisos.promociones = Array.isArray(promos.promociones) ? promos.promociones : [];
        } catch {
            estado.avisos.promociones = [];
        }

        pintarSelectPromociones();
    }

    /* Se listan todas (activas, programadas, pausadas y vencidas), con su estado. */
    function pintarSelectPromociones() {
        const select = $('#avisoPromocion');
        if (!select) return;

        const anterior = select.value;
        const peso = { activa: 0, programada: 1, pausada: 2, vencida: 3 };
        const ordenadas = [...estado.avisos.promociones].sort((uno, otro) => (
            (peso[situacionPromocion(uno).clave] ?? 4) - (peso[situacionPromocion(otro).clave] ?? 4)
            || String(uno.producto || '').localeCompare(String(otro.producto || ''), 'es')
        ));

        select.innerHTML = ordenadas.length
            ? '<option value="">Elige una promoción…</option>' + ordenadas
                .map((fila) => `<option value="${Number(fila.id_promocion)}">${escapar(fila.producto)} · ${moneda(fila.precio_oferta)} · ${situacionPromocion(fila).texto}</option>`)
                .join('')
            : '<option value="">No hay promociones creadas</option>';

        if (anterior) select.value = anterior;
    }

    function situacionPromocion(promo) {
        const hoy = new Date();
        const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        const inicio = String(promo?.fecha_inicio || '').slice(0, 10);
        const fin = String(promo?.fecha_fin || '').slice(0, 10);

        if (promo?.estado === false) return { clave: 'pausada', texto: 'Pausada' };
        if (fin && fin < hoyISO) return { clave: 'vencida', texto: 'Vencida' };
        if (inicio && inicio > hoyISO) return { clave: 'programada', texto: 'Programada' };

        return { clave: 'activa', texto: 'Activa' };
    }

    function imagenAbsoluta(ruta) {
        const url = urlImagenPromocion(ruta);
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    function textoPromocion(promo) {
        const oferta = Number(promo?.precio_oferta) || 0;
        const base = Number(promo?.precio_venta) || 0;
        const producto = String(promo?.producto || '').trim() || 'este producto';

        const mensaje = base > oferta
            ? `Ahora ${producto} a ${moneda(oferta)} (antes ${moneda(base)}). Solo por tiempo limitado.`
            : `Aprovecha ${producto} a ${moneda(oferta)}. Solo por tiempo limitado.`;

        return {
            titulo: `¡Oferta en ${producto}!`.slice(0, 80),
            mensaje: mensaje.slice(0, 240),
            url: `/producto?p=${Number(promo?.id_producto) || 0}`,
            imagen: imagenAbsoluta(promo?.imagen),
        };
    }

    function pintarPreviaAviso() {
        const titulo = $('#avisoPreviaTitulo');
        const mensaje = $('#avisoPreviaMensaje');
        const imagen = $('#avisoPreviaImagen');

        if (titulo) titulo.textContent = ($('#avisoTitulo')?.value || '').trim() || 'Título del aviso';
        if (mensaje) mensaje.textContent = ($('#avisoMensaje')?.value || '').trim() || 'Aquí se verá el mensaje que reciban tus clientes.';

        const ruta = ($('#avisoUrlImagen')?.value || '').trim();
        const url = ruta ? imagenAbsoluta(ruta) : '';

        if (imagen) {
            if (url) {
                imagen.src = url;
                imagen.hidden = false;
            } else {
                imagen.removeAttribute('src');
                imagen.hidden = true;
            }
        }
    }

    function aplicarTipoAviso(tipo) {
        estado.avisos.tipo = tipo === 'promocion' ? 'promocion' : 'mensaje';

        $$('#avisoTipo .admin-chip').forEach((chip) => chip.classList.toggle('is-activo', chip.dataset.tipo === estado.avisos.tipo));

        const caja = $('#avisoPromocionCaja');
        if (caja) caja.hidden = estado.avisos.tipo !== 'promocion';

        if (estado.avisos.tipo === 'promocion') {
            const select = $('#avisoPromocion');
            if (select?.value) aplicarPromocion(select.value);
        } else {
            const oculto = $('#avisoUrlImagen');
            if (oculto) oculto.value = '';

            const nota = $('#avisoPromocionNota');
            if (nota) {
                nota.hidden = true;
                nota.textContent = '';
            }

            pintarPreviaAviso();
        }
    }

    function aplicarPromocion(id) {
        const promo = estado.avisos.promociones.find((fila) => String(fila.id_promocion) === String(id));

        if (!promo) return;

        const datos = textoPromocion(promo);

        if ($('#avisoTitulo')) $('#avisoTitulo').value = datos.titulo;
        if ($('#avisoMensaje')) $('#avisoMensaje').value = datos.mensaje;
        if ($('#avisoUrl')) $('#avisoUrl').value = datos.url;
        if ($('#avisoUrlImagen')) $('#avisoUrlImagen').value = datos.imagen;

        if ($('#avisoTituloCuenta')) $('#avisoTituloCuenta').textContent = String(datos.titulo.length);
        if ($('#avisoMensajeCuenta')) $('#avisoMensajeCuenta').textContent = String(datos.mensaje.length);

        const nota = $('#avisoPromocionNota');

        if (nota) {
            const mensajes = {
                programada: 'Esta promoción empieza más adelante: en la tienda todavía no se ve.',
                pausada: 'Esta promoción está pausada: en la tienda no se está mostrando.',
                vencida: 'Esta promoción ya venció: en la tienda no se está mostrando.',
            };
            const texto = mensajes[situacionPromocion(promo).clave] || '';

            nota.textContent = texto;
            nota.hidden = !texto;
        }

        pintarPreviaAviso();
    }

    async function enviarAviso(evento) {
        evento.preventDefault();

        if (estado.avisos.enviando) return;

        const sesion = leerSesion();

        if (!sesion) {
            cerrarSesionLocal('expirada');
            return;
        }

        const titulo = ($('#avisoTitulo')?.value || '').trim();
        const mensaje = ($('#avisoMensaje')?.value || '').trim();
        const url = ($('#avisoUrl')?.value || '').trim();
        const imagen = ($('#avisoUrlImagen')?.value || '').trim();
        const tipo = estado.avisos.tipo;
        const destino = estado.avisos.destino;
        const idCliente = destino === 'cliente' ? Number($('#avisoCliente')?.value || 0) : null;
        const resultado = $('#avisoResultado');
        const boton = $('#btnEnviarAviso');

        const avisar = (texto, esError = false) => {
            if (!resultado) return;

            resultado.hidden = false;
            resultado.textContent = texto;
            resultado.classList.toggle('admin-aviso__resultado--error', esError);
        };

        if (titulo.length < 3 || mensaje.length < 3) {
            avisar('Escribe un título y un mensaje de al menos 3 letras.', true);
            return;
        }

        if (destino === 'cliente' && !idCliente) {
            avisar('Elige el cliente que recibirá el aviso.', true);
            return;
        }

        if (!config.url) {
            avisar('Supabase no está configurado.', true);
            return;
        }

        estado.avisos.enviando = true;
        if (boton) boton.disabled = true;
        avisar('Enviando…');

        try {
            const funcion = window.PUSH_CONFIG?.funcion || 'enviar-push';
            const respuesta = await fetch(`${String(config.url).replace(/\/+$/, '')}/functions/v1/${funcion}`, {
                method: 'POST',
                headers: {
                    apikey: config.key,
                    Authorization: `Bearer ${config.key}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: sesion.token,
                    titulo,
                    mensaje,
                    url,
                    tipo,
                    imagen,
                    destino,
                    id_cliente: idCliente,
                }),
            });

            const datos = await respuesta.json().catch(() => null);

            if (!respuesta.ok) {
                if (respuesta.status === 404) {
                    throw new Error('La función enviar-push todavía no está desplegada en Supabase.');
                }

                throw new Error(datos?.mensaje || 'No se pudo enviar el aviso.');
            }

            const exito = datos?.mensaje || 'Aviso enviado.';

            avisar(exito);
            mostrarToast(exito);

            $('#formAviso')?.reset();
            estado.avisos.destino = 'todos';
            $$('#avisoDestino .admin-chip').forEach((chip) => chip.classList.toggle('is-activo', chip.dataset.destino === 'todos'));
            if ($('#avisoCliente')) $('#avisoCliente').hidden = true;
            if ($('#avisoUrlImagen')) $('#avisoUrlImagen').value = '';
            if ($('#avisoTituloCuenta')) $('#avisoTituloCuenta').textContent = '0';
            if ($('#avisoMensajeCuenta')) $('#avisoMensajeCuenta').textContent = '0';

            aplicarTipoAviso('mensaje');
            pintarPreviaAviso();

            estado.cargada.avisos = false;
            await cargarAvisos();
        } catch (error) {
            avisar(error.message, true);
            mostrarToast(error.message, 'error');
        } finally {
            estado.avisos.enviando = false;
            if (boton) boton.disabled = false;
        }
    }

    function conectarAvisos() {
        $('#formAviso')?.addEventListener('submit', enviarAviso);

        $('#avisoDestino')?.addEventListener('click', (evento) => {
            const chip = evento.target.closest('[data-destino]');
            if (!chip) return;

            estado.avisos.destino = chip.dataset.destino;

            $$('#avisoDestino .admin-chip').forEach((boton) => boton.classList.toggle('is-activo', boton === chip));

            const select = $('#avisoCliente');
            if (select) select.hidden = estado.avisos.destino !== 'cliente';
        });

        $('#avisoTitulo')?.addEventListener('input', (evento) => {
            const cuenta = $('#avisoTituloCuenta');
            if (cuenta) cuenta.textContent = String(evento.target.value.length);
            pintarPreviaAviso();
        });

        $('#avisoMensaje')?.addEventListener('input', (evento) => {
            const cuenta = $('#avisoMensajeCuenta');
            if (cuenta) cuenta.textContent = String(evento.target.value.length);
            pintarPreviaAviso();
        });

        $('#avisoTipo')?.addEventListener('click', (evento) => {
            const chip = evento.target.closest('[data-tipo]');
            if (!chip) return;

            aplicarTipoAviso(chip.dataset.tipo);
        });

        $('#avisoPromocion')?.addEventListener('change', (evento) => {
            if (evento.target.value) aplicarPromocion(evento.target.value);
        });
    }

    /* ───────────────────────── Arranque ───────────────────────── */

    const sesion = leerSesion();

    if (!sesion) {
        let habiaSesion = false;
        try { habiaSesion = Boolean(localStorage.getItem(CLAVE_SESION)); } catch { /* sin storage */ }
        cerrarSesionLocal(habiaSesion ? 'expirada' : '');
        return;
    }

    const nombreUsuario = $('#adminUsuarioNombre');
    if (nombreUsuario) {
        nombreUsuario.textContent = sesion.usuario ? `${sesion.usuario} · Administrador` : 'Administrador';
    }

    iniciarEventos();
    iniciarFechaPedidos();
    iniciarFechasCierre();
    cargarResumen();
    cargarBadgeCambios();
    cargarConfiguracionPedidos();

    const vistaInicial = (window.location.hash || '').replace('#', '');
    mostrarVista(['pedidos', 'promociones', 'cupones', 'trabajadores', 'cambios', 'cierre', 'cobros', 'sorteo', 'avisos'].includes(vistaInicial) ? vistaInicial : 'pedidos');
})();
