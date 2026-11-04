/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Fotos de productos y descuentos                     ║
   ║  Se muestran al final del catálogo y de la ficha de producto  ║
   ║  Configuración: data/promociones.json                         ║
   ╚══════════════════════════════════════════════════════════════╝ */

(() => {
    const seccion = document.getElementById('promos');
    const contenedor = document.getElementById('promosGrid');

    if (!seccion || !contenedor) return;

    const escapar = (valor) => String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    function tarjeta(foto, indice) {
        const titulo = foto.titulo
            ? `<span class="promo__titulo">${escapar(foto.titulo)}</span>`
            : '';

        const cta = foto.enlace
            ? '<span class="promo__cta">Ver producto <i class="bi bi-arrow-right" aria-hidden="true"></i></span>'
            : '';

        const descuento = foto.descuento
            ? `<span class="promo__descuento${foto.descuentoClase ? ` promo__descuento--${foto.descuentoClase}` : ''}">${escapar(foto.descuento)}</span>`
            : '';

        const pie = (titulo || cta)
            ? `<span class="promo__pie">${titulo}${cta}</span>`
            : '';

        const contenido = `
            <span class="promo__media">
                ${descuento}
                <img src="${escapar(foto.imagen)}" alt="${escapar(foto.titulo || `Promoción ${indice + 1}`)}" loading="lazy" decoding="async" fetchpriority="low">
            </span>
            ${pie}
        `;

        if (!foto.enlace) {
            return `<div class="promo">${contenido}</div>`;
        }

        const externo = /^https?:\/\//i.test(foto.enlace);
        const extras = externo ? ' target="_blank" rel="noopener noreferrer"' : '';

        return `<a class="promo" href="${escapar(foto.enlace)}"${extras}>${contenido}</a>`;
    }

    function urlImagenPromocion(nombre) {
        return nombre ? `/imagenes/promociones/${encodeURIComponent(nombre)}` : '';
    }

    function textoDescuento(tipo, valor) {
        const numero = Number(valor) || 0;

        if (!tipo || numero <= 0) return '';

        if (tipo === 'porcentaje') {
            return `${String(numero).replace(/\.00$/, '')}% DESCUENTO`;
        }

        if (tipo === 'monto') {
            return `-C$ ${numero.toFixed(2)}`;
        }

        if (tipo === 'precio') {
            return `Ahora C$ ${numero.toFixed(2)}`;
        }

        return '';
    }

    async function cargarDesdeErp() {
        if (!window.TiendaAPI?.get) return [];

        try {
            const datos = await window.TiendaAPI.get('/tienda/api/promociones');

            return (datos?.promociones || [])
                .map((promocion) => ({
                    imagen: urlImagenPromocion(promocion.imagen),
                    titulo: promocion.producto,
                    descuento: textoDescuento(promocion.tipo_descuento, promocion.valor_descuento),
                    descuentoClase: promocion.tipo_descuento,
                    enlace: `/producto?p=${Number(promocion.id_producto)}`,
                }))
                .filter((promocion) => promocion.imagen);
        } catch (error) {
            console.warn('No se pudieron cargar las promociones del ERP.', error);

            return [];
        }
    }

    async function cargar() {
        try {
            const promocionesErp = await cargarDesdeErp();

            if (promocionesErp.length) {
                contenedor.innerHTML = promocionesErp.map(tarjeta).join('');
                seccion.hidden = false;
                return;
            }

            const respuesta = await fetch('/tienda/recursos/data/promociones.json', {
                cache: 'no-store',
                headers: { Accept: 'application/json' },
            });

            if (!respuesta.ok) return;

            const datos = await respuesta.json();

            const fotos = (Array.isArray(datos) ? datos : [])
                .map((foto) => (typeof foto === 'string' ? { imagen: foto } : foto))
                .filter((foto) => foto && foto.imagen);

            if (!fotos.length) return;

            contenedor.innerHTML = fotos.map(tarjeta).join('');
            seccion.hidden = false;
        } catch (error) {
            console.warn('No se pudieron cargar las promociones.', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cargar);
    } else {
        cargar();
    }
})();
