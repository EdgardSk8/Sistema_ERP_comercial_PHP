/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Catálogo                                            ║
   ╚══════════════════════════════════════════════════════════════╝ */

const API_PRODUCTOS = '/tienda/api/productos';
const IMAGEN_FALLBACK = '/tienda/recursos/img/producto.png';

const COLORES = {
    negro: '#22252A',
    blanco: '#FFFFFF',
    crudo: '#F1E9D8',
    crema: '#F3ECDD',
    beige: '#E2D5B9',
    arena: '#E6DBC4',
    gris: '#9AA0A6',
    azul: '#2F5D8A',
    celeste: '#8FB8D9',
    rojo: '#C0392B',
    vino: '#7B2231',
    verde: '#3E7C59',
    oliva: '#7C7A45',
    amarillo: '#E3B23C',
    mostaza: '#C9971E',
    naranja: '#E07B39',
    rosa: '#E4A3B8',
    rosado: '#E4A3B8',
    morado: '#6C4A8F',
    violeta: '#7A5AA6',
    cafe: '#7A5230',
    marron: '#7A5230',
    dorado: '#C9A227',
    plateado: '#C0C4C8',
    turquesa: '#3AAFA9',
    caqui: '#A89A6B',
};

function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function colorHex(nombre) {
    const clave = normalizar(nombre);
    if (COLORES[clave]) return COLORES[clave];

    // "Celeste con Negro" → toma el primer color conocido del texto
    const palabra = clave.split(/\s+/).find(parte => COLORES[parte]);
    if (palabra) return COLORES[palabra];

    // Tono estable para colores no mapeados
    let hash = 0;
    for (let i = 0; i < clave.length; i++) {
        hash = clave.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 45%, 62%)`;
}

function moneda(valor) {
    return 'C$ ' + Number(valor || 0).toLocaleString('es-NI', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function escapar(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ── Render de tarjeta ───────────────────────────────────────── */
function tarjetaProducto(variante) {
    const agotado = Number(variante.stock || 0) <= 0;
    const enlace = `/tienda/producto/${variante.id}?color=${encodeURIComponent(variante.color || '')}`;

    return `
        <a class="card-producto" href="${escapar(enlace)}">
            <div class="card-producto__media">
                <img src="${escapar(variante.imagen || IMAGEN_FALLBACK)}" alt="${escapar(variante.nombre)}" loading="lazy"
                     onerror="this.src='${IMAGEN_FALLBACK}'">
                ${agotado ? '<span class="badge-agotado">Agotado</span>' : ''}
                <button class="btn-favorito" type="button" aria-label="Agregar a favoritos">
                    <i class="bi bi-heart"></i>
                </button>
            </div>
            <div class="card-producto__info">
                <h3 class="card-producto__nombre">${escapar(variante.nombre)}</h3>
                <span class="card-producto__categoria">${escapar(variante.categoria)}</span>
                <span class="card-producto__color">${escapar(variante.color || 'Único')}</span>
                <div class="card-producto__precios">
                    <span class="precio">${moneda(variante.precio)}</span>
                </div>
            </div>
        </a>
    `;
}

/* Cada color del producto es una tarjeta independiente */
function desagruparPorColor(productos) {
    return productos.flatMap(producto => {
        const colores = producto.colores?.length
            ? producto.colores
            : [{ nombre: 'Único', imagen: producto.imagen, stock: producto.stock }];

        return colores.map(color => ({
            ...producto,
            color: color.nombre,
            imagen: color.imagen || producto.imagen,
            stock: color.stock ?? producto.stock,
        }));
    });
}

/* ── Catálogo ────────────────────────────────────────────────── */
function iniciarCatalogo(productos) {
    const grid = document.getElementById('catalogoGrid');
    const contador = document.getElementById('catalogoContador');
    const catGrid = document.getElementById('catGrid');
    const buscador = document.getElementById('buscadorProductos');

    const variantes = desagruparPorColor(productos);
    const categorias = [...new Set(variantes.map(variante => variante.categoria).filter(Boolean))];

    let categoriaActual = '';

    // Círculos de categoría (con "Todos" para quitar el filtro)
    if (catGrid) {
        const opciones = [{ nombre: 'Todos', valor: '', icono: 'bi-grid' }]
            .concat(categorias.map(categoria => ({ nombre: categoria, valor: categoria, icono: 'bi-tag' })));

        catGrid.innerHTML = opciones.map(opcion => `
            <button class="cat-item${opcion.valor === '' ? ' cat-item--activo' : ''}" type="button" data-categoria="${escapar(opcion.valor)}">
                <span class="cat-item__circulo"><i class="bi ${opcion.icono}"></i></span>
                ${escapar(opcion.nombre)}
            </button>
        `).join('');
    }

    const pintar = () => {
        const termino = normalizar(buscador ? buscador.value : '');

        const lista = variantes.filter(variante => {
            const coincideCategoria = !categoriaActual || variante.categoria === categoriaActual;
            const coincideTexto = !termino || normalizar(variante.nombre).includes(termino);
            return coincideCategoria && coincideTexto;
        });

        grid.innerHTML = lista.length
            ? lista.map(tarjetaProducto).join('')
            : `<p class="catalogo-vacio">${termino ? 'No se encontraron productos para esa búsqueda.' : 'No hay productos en esta categoría.'}</p>`;

        if (contador) {
            contador.textContent = `${lista.length} ${lista.length === 1 ? 'producto' : 'productos'}`;
        }
    };

    buscador?.addEventListener('input', pintar);

    const marcarActivo = (categoria) => {
        catGrid?.querySelectorAll('.cat-item').forEach(item => {
            item.classList.toggle('cat-item--activo', item.dataset.categoria === categoria);
        });
    };

    catGrid?.addEventListener('click', (event) => {
        const boton = event.target.closest('[data-categoria]');
        if (!boton) return;

        categoriaActual = boton.dataset.categoria || '';
        marcarActivo(categoriaActual);
        pintar();

        if (window.innerWidth < 992) {
            document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    pintar();
}

async function cargarCatalogo() {
    const grid = document.getElementById('catalogoGrid');

    try {
        const respuesta = await fetch(API_PRODUCTOS, { headers: { Accept: 'application/json' } });
        if (!respuesta.ok) throw new Error('No se pudo cargar el catálogo.');

        const data = await respuesta.json();
        const productos = data.productos || [];

        if (!productos.length) {
            if (grid) grid.innerHTML = '<p class="catalogo-vacio">Todavía no hay productos publicados.</p>';
            return;
        }

        iniciarCatalogo(productos);
    } catch (error) {
        if (grid) grid.innerHTML = '<p class="catalogo-vacio">No se pudo cargar el catálogo. Intenta más tarde.</p>';
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // La marca funciona como "Inicio": vuelve arriba con desplazamiento suave.
    document.querySelector('.app-header .marca')?.addEventListener('click', (event) => {
        if (location.pathname !== '/tienda') return; // en otras páginas navega normal

        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    cargarCatalogo();
});
