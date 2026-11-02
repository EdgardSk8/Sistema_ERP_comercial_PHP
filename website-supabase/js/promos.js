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

        const contenido = `
            <span class="promo__media">
                <img src="${escapar(foto.imagen)}" alt="${escapar(foto.titulo || `Promoción ${indice + 1}`)}" loading="lazy" decoding="async" fetchpriority="low">
            </span>
            ${titulo}
        `;

        if (!foto.enlace) {
            return `<div class="promo">${contenido}</div>`;
        }

        const externo = /^https?:\/\//i.test(foto.enlace);
        const extras = externo ? ' target="_blank" rel="noopener noreferrer"' : '';

        return `<a class="promo" href="${escapar(foto.enlace)}"${extras}>${contenido}</a>`;
    }

    async function cargar() {
        try {
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
