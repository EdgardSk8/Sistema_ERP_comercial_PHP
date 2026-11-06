# Iconos

## Phosphor 2.0.3 (regular)

- ERP: `Recursos::url('phosphor_css')` (local en `public/libs/phosphor/2.0.3/`).
- Tienda: CDN `https://unpkg.com/@phosphor-icons/web@2.0.3/src/regular/style.css`.

```html
<i class="ph ph-shopping-cart" aria-hidden="true"></i>
```

## Bootstrap Icons (subset local)

- Tienda: `/tienda/recursos/css/base/bootstrap-icons-subset.css` — **solo** incluye un subconjunto.
- Si un icono `bi bi-*` no se ve, probablemente no está en el subset: revisa el CSS antes de
  asumir que hace falta otra librería.

```html
<i class="bi bi-arrow-right" aria-hidden="true"></i>
```

## Reglas

- No añadir una tercera librería de iconos: el proyecto usa Phosphor + Bootstrap Icons.
- Icono decorativo → `aria-hidden="true"`. Icono que es la única etiqueta de un botón → el botón
  lleva `aria-label` en español.
- En la tienda se prefiere Phosphor; Bootstrap Icons aparece en componentes ya existentes.

## Referencias

- https://phosphoricons.com/ (buscar el nombre exacto)
- https://icons.getbootstrap.com/
