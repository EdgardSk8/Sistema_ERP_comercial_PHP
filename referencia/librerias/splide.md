# Splide 4.1.4

Solo en la tienda (`website-supabase`): `index.html` y `producto.html` cargan
`@splidejs/splide@4.1.4` por CDN (CSS en `<head>`, JS con `defer` antes de los módulos).

## Markup obligatorio

```html
<div class="splide mi-carrusel" id="miCarrusel" aria-label="Descripción">
  <div class="splide__track">
    <ul class="splide__list" id="miLista"><!-- <li class="splide__slide"> --></ul>
  </div>
</div>
```

## Patrón del proyecto

- `js/components/promos.js` — carrusel de promociones: `autoWidth`, flechas, `i18n` en español.
- `js/pages/producto.js` — relacionados (`perPage` + `breakpoints`).
- `js/components/resenias.js` — `autoWidth` con flechas propias (no usa las de Splide).

```js
carrusel = new Splide('#miCarrusel', {
    autoWidth: true,          // el ancho lo pone el CSS de .splide__slide
    perMove: 1,
    gap: '12px',              // SIEMPRE en JS: Splide aplica margin-right, no CSS gap
    pagination: false,
    drag: 'free',
    snap: true,
    focus: 0,
    omitEnd: true,
    i18n: { prev: 'Anterior', next: 'Siguiente', slideLabel: '%s de %s' },
    breakpoints: { 768: { arrows: false } },
});
carrusel.mount();
```

## Gotchas (verificados en este proyecto)

- `.splide` nace con `visibility: hidden`; se ve al montar. **Monta después** de quitar `hidden`
  de la sección, o las medidas salen en 0.
- Con `autoWidth: true` Splide **no** escribe `width` inline: manda el CSS de `.splide__slide`.
- El `gap` de Splide se aplica como `margin-right` a cada diapositiva; un `gap` CSS en el `ul` se
  suma y duplica la separación.
- Las flechas y la paginación se generan solas si no existen en el HTML; si usas flechas propias,
  pasa `arrows: false` y controla con `carrusel.go('<' | '>')`.
- `destroy(true)` al remontar (restaura el DOM original).
- El `i18n` parcial funciona: las claves que no pases conservan el valor por defecto.
- Si no hay desbordamiento, Splide añade `is-overflow` solo cuando hace falta; las flechas quedan
  `disabled` (estilizar `:disabled`).

## Documentación oficial

https://splidejs.com/guides/options/ (solo la opción concreta)
