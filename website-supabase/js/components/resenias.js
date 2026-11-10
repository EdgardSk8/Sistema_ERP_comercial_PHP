/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Opiniones y calificaciones de un producto           ║
   ║  Todos pueden leerlas · solo clientes registrados escriben    ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    const seccion = document.getElementById('resenias');

    // La sección solo existe en la ficha de producto.
    if (!seccion) return;

    const $ = (id) => document.getElementById(id);
    const contenedorResenias = document.getElementById('reseniasSplide');
    const ICONO = '<i class="bi bi-star-fill"></i>';
    const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const MARCOS_RESENIA = [
        { ventas: 5, clave: 'bronce' },
        { ventas: 10, clave: 'plata' },
        { ventas: 20, clave: 'oro' },
        { ventas: 50, clave: 'esmeralda' },
        { ventas: 100, clave: 'rubi' },
    ];

    let resumen = { promedio: 0, total: 0, distribucion: [] };
    let resenias = [];
    let miResenia = null;
    let puedeResenar = false;
    let calificacion = 0;
    let filtro = 0;
    let enviando = false;
    let formularioAbierto = false;
    let formularioEditando = false;
    let limiteLista = 10;
    let reseniasVisibles = false;
    let carruselResenias = null;

    /* ── Utilidades ──────────────────────────────────────────── */

    function idProducto() {
        /* El ID puede venir en la ruta (/tienda/producto/5) o en ?p= (/producto?p=5). */
        const parametros = new URLSearchParams(location.search);
        const deQuery = Number(parametros.get('p') || parametros.get('id'));

        if (Number.isFinite(deQuery) && deQuery > 0) return deQuery;

        const id = Number(location.pathname.split('/').filter(Boolean).pop());

        return Number.isFinite(id) && id > 0 ? id : null;
    }

    function escapar(valor) {
        return window.TiendaUtil.escapar(valor);
    }

    function esClaroAvatar(color) {
        const limpio = String(color || '').replace('#', '');

        if (limpio.length !== 6) return true;

        const r = parseInt(limpio.slice(0, 2), 16);
        const g = parseInt(limpio.slice(2, 4), 16);
        const b = parseInt(limpio.slice(4, 6), 16);

        return (0.299 * r + 0.587 * g + 0.114 * b) > 186;
    }

    function avatarDeResenia(resenia) {
        const avatar = resenia.avatar || {};

        /* Si la opinión es del cliente actual, se usa su avatar local
           aunque la función SQL todavía no devuelva esos campos. */
        if (!resenia.es_mia || !window.clienteTienda) return avatar;

        const tieneDatos = Boolean(avatar.color || avatar.fondo || avatar.imagen || avatar.marco);

        if (tieneDatos) return avatar;

        const cliente = window.clienteTienda;

        return {
            color: cliente.avatar_color || null,
            fondo: cliente.avatar_fondo || null,
            imagen: cliente.avatar_imagen || null,
            marco: cliente.marco_avatar === false
                ? null
                : (window.marcoTienda?.marco?.clave || null),
        };
    }

    function marcoDeResenia(resenia) {
        if (resenia?.marco_avatar === false) return null;

        const ventas = Number(resenia?.ventas_total || 0);
        const forzado = String(resenia?.marco_forzado || '').trim().toLowerCase();
        const seleccionado = String(resenia?.marco_estilo || '').trim().toLowerCase();
        const claves = MARCOS_RESENIA.map((nivel) => nivel.clave);

        const porVentas = MARCOS_RESENIA.reduce(
            (actual, nivel) => (ventas >= nivel.ventas ? nivel.clave : actual),
            null
        );

        if (['todos', 'todos_los_marcos', 'all'].includes(forzado)) {
            return claves.includes(seleccionado) ? seleccionado : (porVentas || 'rubi');
        }

        if (claves.includes(forzado)) return forzado;

        if (claves.includes(seleccionado)) {
            const indiceSeleccionado = claves.indexOf(seleccionado);
            const indiceVentas = porVentas ? claves.indexOf(porVentas) : -1;

            if (indiceSeleccionado <= indiceVentas) return seleccionado;
        }

        return porVentas;
    }

    function normalizarResenia(resenia) {
        if (!resenia) return resenia;

        const avatar = resenia.avatar && typeof resenia.avatar === 'object' ? resenia.avatar : {};

        return {
            ...resenia,
            avatar: {
                color: avatar.color || resenia.avatar_color || null,
                fondo: avatar.fondo || resenia.avatar_fondo || null,
                imagen: avatar.imagen || resenia.avatar_imagen || null,
                marco: resenia.marco_avatar === false
                    ? null
                    : (avatar.marco || marcoDeResenia(resenia)),
            },
        };
    }

    function avatarResenia(resenia) {
        const avatar = avatarDeResenia(resenia);
        const color = avatar.color || '#d9f2e4';
        const fondo = avatar.fondo || '';
        const imagen = avatar.imagen || '';
        const estilos = [`--avatar-color:${color}`];

        if (fondo) estilos.push(`--avatar-foto:url('/tienda/recursos/imagenes/avatares/fondos/${fondo}')`);

        const clases = ['resenia__avatar'];

        if (fondo) clases.push('avatar--foto');
        if (esClaroAvatar(color)) clases.push('avatar--claro');
        if (avatar.marco) clases.push(`marco--${avatar.marco}`);

        let contenido = '';

        if (imagen) {
            contenido = `<img src="/tienda/recursos/imagenes/avatares/${imagen}.png" alt="">`;
        } else if (!fondo) {
            contenido = escapar(resenia.inicial || '?');
        }

        return `<span class="${clases.join(' ')}" style="${estilos.join(';')}" aria-hidden="true">${contenido}</span>`;
    }

    function capasEstrellas() {
        return `<span class="estrellas__capa estrellas__capa--fondo" aria-hidden="true">${ICONO.repeat(5)}</span>`
            + `<span class="estrellas__capa estrellas__capa--relleno" aria-hidden="true">${ICONO.repeat(5)}</span>`;
    }

    function pintarEstrellas(elemento, valor, clase = '') {
        if (!elemento) return;

        const numero = Math.max(0, Math.min(5, Number(valor) || 0));

        elemento.className = `estrellas ${clase}`.trim();
        elemento.style.setProperty('--pct', `${(numero / 5) * 100}%`);
        elemento.innerHTML = capasEstrellas();
        elemento.setAttribute('role', 'img');
        elemento.setAttribute('aria-label', `${numero.toFixed(1)} de 5 estrellas`);
    }

    function estrellasHtml(valor) {
        const numero = Math.max(0, Math.min(5, Number(valor) || 0));

        return `<span class="estrellas" style="--pct:${(numero / 5) * 100}%" role="img" aria-label="${numero} de 5 estrellas">${capasEstrellas()}</span>`;
    }

    function formatearFecha(texto) {
        if (!texto) return '';

        const [fecha] = String(texto).split(' ');
        const [anio, mes, dia] = fecha.split('-').map(Number);

        if (!anio || !mes || !dia) return fecha;

        return `${dia} ${MESES[mes - 1] ?? ''} ${anio}`.trim();
    }

    /* ── Resumen (promedio + histograma) ─────────────────────── */

    function pintarResumen() {
        const total = Number(resumen.total || 0);
        const promedio = Number(resumen.promedio || 0);

        $('reseniasPromedio').textContent = promedio.toFixed(1);
        $('reseniasTotal').textContent = total === 0
            ? 'Sin opiniones todavía'
            : `${total} ${total === 1 ? 'opinión' : 'opiniones'} de clientes`;

        pintarEstrellas($('reseniasPromedioEstrellas'), promedio, 'estrellas--lg');

        // Estrellas junto al título del producto
        const rating = $('productoRating');
        if (rating) {
            rating.hidden = false;
            $('productoRatingNum').textContent = promedio.toFixed(1);
            $('productoRatingTexto').textContent = total === 0
                ? 'Sé el primero en opinar'
                : `${total} ${total === 1 ? 'opinión' : 'opiniones'}`;
            pintarEstrellas($('productoRatingEstrellas'), promedio);

            rating.classList.toggle('producto__rating--vacio', total === 0);
        }
    }

    function pintarHistograma() {
        const caja = $('reseniasHistograma');
        if (!caja) return;

        const total = Number(resumen.total || 0);

        caja.innerHTML = (resumen.distribucion || [])
            .map((fila) => {
                const totalFila = Number(fila.total || 0);
                const porcentaje = total > 0 ? (totalFila / total) * 100 : 0;
                const deshabilitado = totalFila === 0 || total === 0;

                return `<button class="resenias__fila${filtro === fila.estrellas ? ' is-activo' : ''}"
                            type="button" data-filtro="${fila.estrellas}" ${deshabilitado ? 'disabled' : ''}
                            aria-label="Ver opiniones de ${fila.estrellas} estrellas (${totalFila})">
                            <span class="resenias__fila-estrellas" aria-hidden="true">${ICONO.repeat(Number(fila.estrellas))}</span>
                            <span class="resenias__fila-pista"><span class="resenias__fila-relleno" style="width:${porcentaje}%"></span></span>
                            <span class="resenias__fila-total" aria-hidden="true">${totalFila}</span>
                        </button>`;
            })
            .join('');
    }

    /* ── Lista de opiniones ──────────────────────────────────── */

    function htmlResenia(resenia) {
        const textoCompleto = String(resenia.comentario || '').trim();
        const esLargo = textoCompleto.length > 220;

        const comentario = textoCompleto
            ? `<p class="resenia__texto${esLargo ? ' resenia__texto--clamp' : ''}">${escapar(textoCompleto)}</p>`
                + (esLargo ? '<button class="resenia__mas" type="button" data-mas>Más</button>' : '')
            : '<p class="resenia__texto resenia__texto--vacio">Sin comentario.</p>';

        const acciones = resenia.es_mia
            ? `<div class="resenia__acciones">
                   <button class="resenia__accion" type="button" data-editar="${resenia.id_resenia}">
                       <i class="bi bi-pencil"></i> Editar
                   </button>
                   <button class="resenia__accion resenia__accion--borrar" type="button" data-eliminar="${resenia.id_resenia}">
                       <i class="bi bi-trash3"></i> Eliminar
                   </button>
               </div>`
            : '';

        const insignia = resenia.es_mia
            ? '<span class="resenia__insignia">Tu opinión</span>'
            : '';

        return `<article class="resenia">
                    <div class="resenia__cuerpo">
                        <div class="resenia__cabecera">
                            <span class="resenia__autor-chip">
                                ${avatarResenia(resenia)}
                                <span class="resenia__nombre">${escapar(resenia.cliente)}</span>
                                ${insignia}
                            </span>
                            <span class="resenia__fecha">${formatearFecha(resenia.fecha)}${resenia.editada ? ' · editada' : ''}</span>
                        </div>
                        <div class="resenia__meta">
                            ${estrellasHtml(resenia.calificacion)}
                        </div>
                        ${comentario}
                        ${acciones}
                    </div>
                </article>`;
    }

    function pintarLista() {
        const lista = $('reseniasLista');
        const vacio = $('reseniasVacio');
        if (!lista || !vacio) return;

        const visibles = filtro
            ? resenias.filter((resenia) => Number(resenia.calificacion) === filtro)
            : resenias;

        const splide = $('reseniasSplide');

        lista.innerHTML = visibles
            .map((resenia) => `<li class="splide__slide">${htmlResenia(resenia)}</li>`)
            .join('');

        vacio.hidden = visibles.length > 0;

        if (splide) splide.hidden = visibles.length === 0;

        if (visibles.length === 0) {
            vacio.innerHTML = resenias.length === 0
                ? `<i class="bi bi-chat-square-text"></i>
                   <p>Todavía no hay opiniones de este producto.</p>
                   <span>Sé el primero en compartir tu experiencia.</span>`
                : `<i class="bi bi-funnel"></i>
                   <p>No hay opiniones de ${filtro} ${filtro === 1 ? 'estrella' : 'estrellas'}.</p>
                   <span><button class="resenias__limpiar" type="button" data-filtro="0">Ver todas las opiniones</button></span>`;
        }

        montarCarruselResenias();
    }

    function actualizarFlechasResenias() {
        const prev = $('btnReseniasPrev');
        const next = $('btnReseniasNext');

        if (!prev || !next) return;

        if (!carruselResenias) {
            prev.hidden = true;
            next.hidden = true;
            return;
        }

        const track = contenedorResenias?.querySelector('.splide__track');
        const slides = Array.from($('reseniasLista')?.children || []);

        if (!track || !slides.length) {
            prev.hidden = true;
            next.hidden = true;
            return;
        }

        const gap = parseFloat(carruselResenias.options.gap) || 20;
        const anchoTrack = track.clientWidth;
        let acumulado = 0;
        let visibles = 0;

        slides.forEach((slide) => {
            const ancho = slide.getBoundingClientRect().width;
            const siguiente = acumulado + ancho + (visibles ? gap : 0);

            if (siguiente <= anchoTrack + 1) {
                acumulado = siguiente;
                visibles++;
            }
        });

        visibles = Math.max(1, visibles);

        const ultimoIndice = Math.max(0, slides.length - visibles);
        const hayOverflow = slides.length > visibles;

        prev.hidden = !hayOverflow;
        next.hidden = !hayOverflow;
        prev.disabled = carruselResenias.index <= 0;
        next.disabled = carruselResenias.index >= ultimoIndice;
    }

    function desplazarResenias(direccion) {
        if (!carruselResenias) return;
        carruselResenias.go(direccion > 0 ? '>' : '<');
    }

    function montarCarruselResenias() {
        if (!contenedorResenias || typeof Splide === 'undefined') return;

        if (carruselResenias) {
            carruselResenias.destroy(true);
            carruselResenias = null;
        }

        if (!contenedorResenias.querySelector('.splide__slide')) {
            actualizarFlechasResenias();
            return;
        }

        carruselResenias = new Splide(contenedorResenias, {
            autoWidth: true,
            gap: '20px',
            pagination: false,
            arrows: false,
            drag: true,
            perMove: 1,
            speed: 400,
            focus: 0,
            omitEnd: true,
        });

        carruselResenias.on('moved', actualizarFlechasResenias);
        carruselResenias.on('scrolled', actualizarFlechasResenias);
        carruselResenias.mount();
        actualizarFlechasResenias();
    }

    /* ── Formulario ──────────────────────────────────────────── */

    function pintarSelector(valor) {
        const botones = document.querySelectorAll('#reseniasSelector .resenias__estrella');

        botones.forEach((boton) => {
            const numero = Number(boton.dataset.valor);
            const activa = numero <= valor;

            boton.classList.toggle('is-activa', activa);
            boton.querySelector('i').className = activa ? 'bi bi-star-fill' : 'bi bi-star';
            boton.setAttribute('aria-checked', numero === valor ? 'true' : 'false');
        });

        const texto = $('reseniasValorTexto');
        if (texto) {
            texto.textContent = valor > 0
                ? `${valor} de 5 · ${['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][valor - 1]}`
                : 'Selecciona una calificación';
        }
    }

    function actualizarContador() {
        const campo = $('reseniasComentario');
        const contador = $('reseniasContador');

        if (campo && contador) contador.textContent = `${campo.value.length}/1000`;
    }

    function mostrarFormulario(mostrar) {
        const contenedor = $('desplegableResenia');
        if (!contenedor) return;

        clearTimeout(contenedor._cerrarTimer);

        if (mostrar) {
            contenedor.hidden = false;
            void contenedor.offsetHeight; // fuerza el reflow para que la transición se vea
            requestAnimationFrame(() => contenedor.classList.add('resenias__desplegable--abierto'));
            return;
        }

        contenedor.classList.remove('resenias__desplegable--abierto');
        contenedor._cerrarTimer = setTimeout(() => { contenedor.hidden = true; }, 340);
    }

    function pintarFormulario() {
        const formulario = $('formResenia');
        const invitado = $('reseniasInvitado');
        const abrir = $('btnAbrirResenia');
        if (!formulario || !invitado) return;

        const tieneResenia = Boolean(miResenia);

        invitado.hidden = puedeResenar;

        const autor = $('reseniasAutor');

        if (autor) {
            autor.hidden = !(puedeResenar && window.clienteTienda);

            const nombreAutor = $('reseniasAutorNombre');

            if (nombreAutor && window.clienteTienda) {
                nombreAutor.textContent = window.clienteTienda.nombre_cliente || 'Cliente';
            }

            window.pintarAvatares?.(window.clienteTienda || null);
        }

        if (abrir) {
            abrir.hidden = !puedeResenar || tieneResenia || formularioAbierto;
        }

        if (!puedeResenar) formularioAbierto = false;

        mostrarFormulario(puedeResenar && formularioAbierto);

        if (!puedeResenar || !formularioAbierto) return;

        const editando = formularioEditando && tieneResenia;

        $('reseniasFormTitulo').textContent = editando ? 'Edita tu opinión' : 'Escribe tu opinión';
        $('btnGuardarResenia').textContent = editando ? 'Actualizar opinión' : 'Publicar opinión';
        $('btnCancelarResenia').hidden = false;

        calificacion = editando ? Number(miResenia.calificacion) : 0;

        $('reseniasComentario').value = editando ? (miResenia.comentario || '') : '';

        pintarSelector(calificacion);
        actualizarContador();
    }

    function abrirFormulario(editar = false) {
        // Mantiene abierto el cuadro de reseñas mientras se escribe o edita.
        alternarResenias(true);

        formularioAbierto = true;
        formularioEditando = Boolean(editar) && Boolean(miResenia);

        pintarFormulario();

        // Espera a que termine la animación antes de enfocar.
        setTimeout(() => {
            $('formResenia')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            $('reseniasComentario')?.focus();
        }, 350);
    }

    function cerrarFormulario() {
        formularioAbierto = false;
        formularioEditando = false;

        pintarFormulario();
    }

    function pintarBotonVerResenias() {
        const boton = $('btnVerResenias');
        if (!boton) return;

        const total = Number(resumen.total || 0);

        boton.hidden = total === 0;
        boton.setAttribute('aria-expanded', String(reseniasVisibles));
        boton.innerHTML = reseniasVisibles
            ? '<i class="bi bi-chevron-up"></i> Ocultar reseñas'
            : `<i class="bi bi-chevron-down"></i> Ver reseñas (${total})`;
    }

    function alternarResenias(mostrar = !reseniasVisibles) {
        const contenedor = $('desplegarResenias');
        if (!contenedor) return;

        reseniasVisibles = mostrar;

        contenedor.classList.toggle('resenias__desplegar--abierto', reseniasVisibles);
        contenedor.inert = !reseniasVisibles;

        pintarBotonVerResenias();
        requestAnimationFrame(actualizarFlechasResenias);
    }

    function mostrarCargandoLista() {
        const lista = $('reseniasLista');
        const vacio = $('reseniasVacio');
        const splide = $('reseniasSplide');

        if (carruselResenias) {
            carruselResenias.destroy(true);
            carruselResenias = null;
        }

        if (vacio) vacio.hidden = true;
        if (splide) splide.hidden = false;

        if (lista) {
            lista.innerHTML = `
                <li class="splide__slide">
                    <div class="resenias__cargando" role="status" aria-live="polite">
                        <span class="spinner-border" aria-hidden="true"></span>
                        <span>Cargando opiniones…</span>
                    </div>
                </li>
            `;
        }
    }

    function pintarBarraLista() {
        const barra = $('reseniasBarra');
        const recientes = $('btnMasRecientes');
        const todos = $('btnCargarTodos');
        if (!barra) return;

        const total = Number(resumen.total || 0);

        barra.hidden = total === 0;

        if (recientes) recientes.classList.toggle('is-activo', limiteLista !== null);

        if (todos) {
            todos.classList.toggle('is-activo', limiteLista === null);
            todos.disabled = limiteLista === null || total <= 10;
        }
    }

    /* ── Datos ─────────────────────────────────────────────── */

    async function cargar({ spinner = false } = {}) {
        const id = idProducto();
        if (!id) return;

        if (spinner) mostrarCargandoLista();

        try {
            const consulta = limiteLista ? `?limite=${limiteLista}` : '';
            const datos = await window.TiendaAPI.get(`/tienda/api/productos/${id}/resenias${consulta}`, { cargando: true });

            resumen = datos.resumen || { promedio: 0, total: 0, distribucion: [] };
            resenias = (datos.resenias || []).map(normalizarResenia);
            miResenia = datos.mi_resenia ? normalizarResenia(datos.mi_resenia) : null;
            puedeResenar = Boolean(datos.puede_resenar);

            if (filtro && !resenias.some((resenia) => Number(resenia.calificacion) === filtro)) {
                filtro = 0;
            }

            pintarResumen();
            pintarHistograma();
            pintarLista();
            pintarBarraLista();
            pintarBotonVerResenias();
            pintarFormulario();
        } catch (error) {
            console.error('No se pudieron cargar las opiniones.', error);

            const lista = $('reseniasLista');
            if (lista) {
                lista.innerHTML = '<li class="splide__slide"><div class="resenias__cargando">No se pudieron cargar las opiniones.</div></li>';
            }
        }
    }

    async function guardar(evento) {
        evento.preventDefault();

        if (enviando) return;

        if (!calificacion) {
            tiendaToast('Selecciona de 1 a 5 estrellas.', 'aviso');
            return;
        }

        enviando = true;

        const boton = $('btnGuardarResenia');
        if (boton) boton.disabled = true;

        try {
            const datos = await window.TiendaAPI.post('/tienda/api/resenias', {
                id_producto: idProducto(),
                calificacion_resenia: calificacion,
                comentario_resenia: $('reseniasComentario').value.trim(),
            }, { cargando: true });

            filtro = 0;
            tiendaToast(datos.mensaje || '¡Gracias por tu opinión!');

            formularioAbierto = false;
            formularioEditando = false;

            await cargar();

            // Al publicar, deja el cuadro de reseñas abierto para ver la opinión.
            alternarResenias(true);

            // Deja el formulario limpio para una nueva opinión.
            calificacion = 0;
            $('reseniasComentario').value = '';
            pintarSelector(0);
            actualizarContador();
        } catch (error) {
            const errores = error.data?.errors;
            const mensaje = errores ? Object.values(errores).flat()[0] : error.message;

            tiendaToast(mensaje || 'No se pudo guardar tu opinión.', 'aviso');
        } finally {
            enviando = false;
            if (boton) boton.disabled = false;
        }
    }

    async function eliminar(id) {
        const confirmado = await tiendaConfirmar({
            titulo: 'Eliminar opinión',
            mensaje: '¿Eliminar tu opinión de este producto?',
            textoAceptar: 'Eliminar',
            peligro: true,
        });

        if (!confirmado) return;

        try {
            const datos = await window.TiendaAPI.delete(`/tienda/api/resenias/${id}`, { cargando: true });

            filtro = 0;
            tiendaToast(datos.mensaje || 'Opinión eliminada.', 'info');
            await cargar();
            alternarResenias(true);
        } catch (error) {
            tiendaToast(error.message, 'aviso');
        }
    }

    /* ── Eventos ─────────────────────────────────────────────── */

    document.addEventListener('DOMContentLoaded', () => {
        const selector = $('reseniasSelector');

        // La lista de reseñas arranca abierta, como en la App Store.
        alternarResenias(true);

        selector?.addEventListener('click', (evento) => {
            const estrella = evento.target.closest('.resenias__estrella');
            if (!estrella) return;

            calificacion = Number(estrella.dataset.valor);
            pintarSelector(calificacion);
        });

        // Vista previa al pasar el mouse (como Amazon).
        selector?.addEventListener('mouseover', (evento) => {
            const estrella = evento.target.closest('.resenias__estrella');
            if (estrella) pintarSelector(Number(estrella.dataset.valor));
        });

        selector?.addEventListener('mouseleave', () => pintarSelector(calificacion));

        $('reseniasComentario')?.addEventListener('input', actualizarContador);

        $('formResenia')?.addEventListener('submit', guardar);

        $('btnAbrirResenia')?.addEventListener('click', () => abrirFormulario(false));

        $('btnCancelarResenia')?.addEventListener('click', () => cerrarFormulario());

        $('btnVerResenias')?.addEventListener('click', () => alternarResenias());

        $('btnReseniasPrev')?.addEventListener('click', () => desplazarResenias(-1));
        $('btnReseniasNext')?.addEventListener('click', () => desplazarResenias(1));

        contenedorResenias?.addEventListener('keydown', (evento) => {
            if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') return;
            evento.preventDefault();
            desplazarResenias(evento.key === 'ArrowLeft' ? -1 : 1);
        });

        window.addEventListener('resize', actualizarFlechasResenias);

        $('btnMasRecientes')?.addEventListener('click', () => {
            if (limiteLista === 10) return;

            limiteLista = 10;
            cargar({ spinner: true });
        });

        $('btnCargarTodos')?.addEventListener('click', () => {
            if (limiteLista === null) return;

            limiteLista = null;
            cargar({ spinner: true });
        });

        // Delegación: expandir texto / editar / eliminar / filtrar.
        seccion.addEventListener('click', (evento) => {
            const mas = evento.target.closest('[data-mas]');
            if (mas) {
                const texto = mas.closest('.resenia__cuerpo')?.querySelector('.resenia__texto');
                if (texto) {
                    const expandido = !texto.classList.toggle('resenia__texto--clamp');
                    mas.textContent = expandido ? 'Menos' : 'Más';
                }
                return;
            }

            const editar = evento.target.closest('[data-editar]');
            if (editar) {
                abrirFormulario(true);
                return;
            }

            const borrar = evento.target.closest('[data-eliminar]');
            if (borrar) {
                eliminar(borrar.dataset.eliminar);
                return;
            }

            const filtroBtn = evento.target.closest('[data-filtro]');
            if (filtroBtn) {
                const elegido = Number(filtroBtn.dataset.filtro) || 0;

                // Volver a tocar el mismo filtro lo quita.
                filtro = elegido === filtro ? 0 : elegido;

                pintarHistograma();
                pintarLista();
            }
        });

        cargar();
    });
})();
