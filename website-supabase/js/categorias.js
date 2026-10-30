/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Iconos de las categorías                            ║
   ║  Cada categoría nueva se agrega aquí con su icono             ║
   ╚══════════════════════════════════════════════════════════════╝ */

/*
   La clave es el nombre de la categoría tal como está en el ERP,
   escrito sin tildes y en minúsculas.

   Se usan dos librerías:
   - Phosphor (ph-*) para prendas y calzado: zapatilla, camiseta, bolso…
   - Bootstrap Icons (bi-*) para lo genérico (Todos, Favoritos, etiquetas).
   El valor debe ser la clase completa, por ejemplo 'ph ph-sneaker'.
*/
const ICONOS_CATEGORIA = {
    /* ── Categorías actuales ──────────────────────────────── */
    'zapatos': 'ph ph-sneaker',
    'zapatos segunda mano': 'ph ph-sneaker',
    'chinelas': 'ph ph-footprints',
    'ropa': 'ph ph-t-shirt',
    'tecnologia': 'ph ph-device-mobile',
    /* La categoría está escrita «Tecnlogía» en el ERP (sin la segunda o). */
    'tecnlogia': 'ph ph-device-mobile',

    /* ── Preparadas para cuando se agreguen ───────────────── */
    'calzado': 'ph ph-sneaker',
    'ropa niño': 'ph ph-t-shirt',
    'ropa nino': 'ph ph-t-shirt',
    'accesorios': 'ph ph-handbag',
    'mochilas': 'ph ph-backpack',
    'ofertas': 'bi bi-tags',
    'deportes': 'bi bi-dribbble',
    'belleza': 'bi bi-flower1',
    'hogar': 'bi bi-house-heart',
    'juguetes': 'bi bi-controller',
    'electronica': 'bi bi-cpu',
};

const ICONO_CATEGORIA_DEFECTO = 'bi bi-tag';

/* Quita tildes, mayúsculas y espacios extra para comparar. */
function normalizarCategoria(nombre) {
    return String(nombre || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

/* Devuelve la clase del icono; si la categoría no está en la lista usa bi-tag. */
function iconoCategoria(nombre) {
    return ICONOS_CATEGORIA[normalizarCategoria(nombre)] || ICONO_CATEGORIA_DEFECTO;
}

window.iconoCategoria = iconoCategoria;
window.ICONOS_CATEGORIA = ICONOS_CATEGORIA;
