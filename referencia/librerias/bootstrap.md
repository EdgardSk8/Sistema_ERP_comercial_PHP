# Bootstrap 5.3.3

## Carga

- **ERP**: `Recursos::url('bootstrap_css')` y `Recursos::url('bootstrap_js')`
  (bundle con Popper incluido). Definidos en `config/assets.php`; local en `public/libs/bootstrap/5.3.3/`.
- **Tienda**: CDN `https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/...` solo en
  `ayuda.html`, `login.html` y `perfil.html`. `index.html` y `producto.html` **no** cargan Bootstrap:
  su layout es propio (`css/base/estilos.css`).
- La página de error `resources/views/errors/sin_permiso.blade.php` carga el CSS por CDN directo.

## Lo que usa el ERP

- Grid: `.container` / `.row` / `.col-*`, utilidades `.d-flex`, `.gap-*`, `.text-*`, `.bg-*`.
- Formularios: `.form-control`, `.form-select`, `.form-label`, `.input-group`.
- Tablas y estados: `.table`, `.badge`, `.alert`.
- Modales y dropdowns: atributos `data-bs-*`, nunca `data-*` de Bootstrap 4.
- Es lo **único** que debe usarse para layout; el CSS propio va en `resources/css/<modulo>/`.

## API de JS que se usa

```js
// Abrir/cerrar modales sin depender de jQuery
const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCliente'));
modal.show();
modal.hide();

// Eventos (los más usados en el proyecto)
document.getElementById('modalCliente').addEventListener('shown.bs.modal', () => { /* inicializar */ });
```

```html
<!-- Atributos: abrir modal, dropdown, collapse -->
<button type="button" data-bs-toggle="modal" data-bs-target="#modalCliente">Abrir</button>
```

## Gotchas

- **No** mezclar con sintaxis de Bootstrap 4 (`data-toggle`, `data-target`, `.form-group`).
- Select2 o Flatpickr dentro de un modal: inicializar en `shown.bs.modal`, no antes
  (el modal oculto mide 0). Ver [select2.md](select2.md).
- `bootstrap.bundle.min.js` ya incluye Popper: no cargarlo aparte.
- El tema visual del ERP sale de `resources/css/variables.css`, no de variables `--bs-*`.

## Documentación oficial

https://getbootstrap.com/docs/5.3/ (consultar solo la página del componente concreto)
