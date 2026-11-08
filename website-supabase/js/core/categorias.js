/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Iconos de las categorías                            ║
   ║  Cada categoría nueva se agrega aquí con su icono             ║
   ╚══════════════════════════════════════════════════════════════╝ */

/*
   La clave es el nombre de la categoría tal como está en el ERP,
   escrito sin tildes y en minúsculas.

   Los iconos de prendas y calzado van como SVG inline para no cargar una
   fuente de iconos completa; el resto usa el subconjunto de Bootstrap Icons.
*/
const iconoSvg = (d) => `<svg class="cat-item__icono" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
const iconoBi = (clase) => `<i class="bi ${clase}" aria-hidden="true"></i>`;

const SVG_ZAPATO = iconoSvg('M228.65,129.11l-60.73-20.24a24,24,0,0,1-14.32-13L130.39,41.6s0-.07,0-.1A16,16,0,0,0,110.25,33L34.53,60.49A16.05,16.05,0,0,0,24,75.53V192a16,16,0,0,0,16,16H240a16,16,0,0,0,16-16V167.06A40,40,0,0,0,228.65,129.11ZM115.72,48l7.11,16.63-21.56,7.85A8,8,0,0,0,104,88a7.91,7.91,0,0,0,2.73-.49l22.4-8.14,4.74,11.07-16.6,6A8,8,0,0,0,120,112a7.91,7.91,0,0,0,2.73-.49l17.6-6.4a40.24,40.24,0,0,0,7.68,10l-14.74,5.36A8,8,0,0,0,136,136a8.14,8.14,0,0,0,2.73-.48l28-10.18,56.87,18.95A24,24,0,0,1,238.93,160H40V75.53ZM40,192h0V176H240v16Z');
const SVG_CHINELA = iconoSvg('M208.06,184H152a8,8,0,0,0-8,8v12a36,36,0,0,0,72.05,0V192A8,8,0,0,0,208.06,184Zm-8,20a20,20,0,0,1-40,0v-4h40ZM104,160h-56a8,8,0,0,0-8,8v12A36,36,0,0,0,112,180V168A8,8,0,0,0,104,160Zm-8,20a20,20,0,0,1-40,0v-4H96ZM76,16C64.36,16,53.07,26.31,44.2,45c-13.93,29.38-18.56,73,.29,96a8,8,0,0,0,6.2,2.93h50.55a8,8,0,0,0,6.2-2.93c18.85-23,14.22-66.65.29-96C98.85,26.31,87.57,16,76,16ZM97.15,128H54.78c-11.4-18.1-7.21-52.7,3.89-76.11C65.14,38.22,72.17,32,76,32s10.82,6.22,17.3,19.89C104.36,75.3,108.55,109.9,97.15,128Zm57.61,40h50.55a8,8,0,0,0,6.2-2.93c18.85-23,14.22-66.65.29-96C202.93,50.31,191.64,40,180,40s-22.89,10.31-31.77,29c-13.93,29.38-18.56,73,.29,96A8.05,8.05,0,0,0,154.76,168Zm8-92.11C169.22,62.22,176.25,56,180,56s10.82,6.22,17.29,19.89c11.1,23.41,15.29,58,3.9,76.11H158.85C147.45,133.9,151.64,99.3,162.74,75.89Z');
const SVG_ROPA = iconoSvg('M247.59,61.22,195.83,33A8,8,0,0,0,192,32H160a8,8,0,0,0-8,8,24,24,0,0,1-48,0,8,8,0,0,0-8-8H64a8,8,0,0,0-3.84,1L8.41,61.22A15.76,15.76,0,0,0,1.82,82.48l19.27,36.81A16.37,16.37,0,0,0,35.67,128H56v80a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V128h20.34a16.37,16.37,0,0,0,14.58-8.71l19.27-36.81A15.76,15.76,0,0,0,247.59,61.22ZM35.67,112a.62.62,0,0,1-.41-.13L16.09,75.26,56,53.48V112ZM184,208H72V48h16.8a40,40,0,0,0,78.38,0H184Zm36.75-96.14a.55.55,0,0,1-.41.14H200V53.48l39.92,21.78Z');
const SVG_TECNOLOGIA = iconoSvg('M176,16H80A24,24,0,0,0,56,40V216a24,24,0,0,0,24,24h96a24,24,0,0,0,24-24V40A24,24,0,0,0,176,16ZM72,64H184V192H72Zm8-32h96a8,8,0,0,1,8,8v8H72V40A8,8,0,0,1,80,32Zm96,192H80a8,8,0,0,1-8-8v-8H184v8A8,8,0,0,1,176,224Z');
const SVG_ACCESORIOS = iconoSvg('M239.89,198.12l-14.26-120a16,16,0,0,0-16-14.12H176a48,48,0,0,0-96,0H46.33a16,16,0,0,0-16,14.12l-14.26,120A16,16,0,0,0,20,210.6a16.13,16.13,0,0,0,12,5.4H223.92A16.13,16.13,0,0,0,236,210.6,16,16,0,0,0,239.89,198.12ZM128,32a32,32,0,0,1,32,32H96A32,32,0,0,1,128,32ZM32,200,46.33,80H80v24a8,8,0,0,0,16,0V80h64v24a8,8,0,0,0,16,0V80h33.75l14.17,120Z');
const SVG_MOCHILAS = iconoSvg('M168,40.58V32A24,24,0,0,0,144,8H112A24,24,0,0,0,88,32v8.58A56.09,56.09,0,0,0,40,96V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V96A56.09,56.09,0,0,0,168,40.58ZM112,24h32a8,8,0,0,1,8,8v8H104V32A8,8,0,0,1,112,24Zm56,136H88v-8a8,8,0,0,1,8-8h64a8,8,0,0,1,8,8ZM88,176h48v8a8,8,0,0,0,16,0v-8h16v40H88Zm112,40H184V152a24,24,0,0,0-24-24H96a24,24,0,0,0-24,24v64H56V96A40,40,0,0,1,96,56h64a40,40,0,0,1,40,40V216ZM152,88a8,8,0,0,1-8,8H112a8,8,0,0,1,0-16h32A8,8,0,0,1,152,88Z');

const ICONOS_CATEGORIA = {
    /* ── Categorías actuales ──────────────────────────────── */
    'zapatos': SVG_ZAPATO,
    'zapatos segunda mano': SVG_ZAPATO,
    'chinelas': SVG_CHINELA,
    'ropa': SVG_ROPA,
    'tecnologia': SVG_TECNOLOGIA,
    /* La categoría está escrita «Tecnlogía» en el ERP (sin la segunda o). */
    'tecnlogia': SVG_TECNOLOGIA,

    /* ── Preparadas para cuando se agreguen ───────────────── */
    'calzado': SVG_ZAPATO,
    'ropa niño': SVG_ROPA,
    'ropa nino': SVG_ROPA,
    'accesorios': SVG_ACCESORIOS,
    'mochilas': SVG_MOCHILAS,
    'ofertas': iconoBi('bi-tags'),
    'deportes': iconoBi('bi-dribbble'),
    'belleza': iconoBi('bi-flower1'),
    'hogar': iconoBi('bi-house-heart'),
    'juguetes': iconoBi('bi-controller'),
    'electronica': iconoBi('bi-cpu'),
};

const ICONO_CATEGORIA_DEFECTO = iconoBi('bi-tag');

/* Quita tildes, mayúsculas y espacios extra para comparar. */
function normalizarCategoria(nombre) {
    return String(nombre || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

/* Devuelve el HTML del icono; si la categoría no está en la lista usa bi-tag. */
function iconoCategoria(nombre) {
    return ICONOS_CATEGORIA[normalizarCategoria(nombre)] || ICONO_CATEGORIA_DEFECTO;
}

window.iconoCategoria = iconoCategoria;
window.ICONOS_CATEGORIA = ICONOS_CATEGORIA;
