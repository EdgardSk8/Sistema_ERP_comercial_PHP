# Hotwired Turbo 7.3.0

El ERP navega con Turbo Frames, no con recargas completas.

## Cómo está montado

- Layout: `resources/views/principal/principal.blade.php` define
  `<turbo-frame id="contenido-dinamico">`.
- Menú/sidebar: enlaces con `data-turbo-frame="contenido-dinamico"`.
- El runtime se carga con `Recursos::url('turbo')` → **7.3.0**.
  `package.json` declara `@hotwired/turbo ^8.0.23` (Vite); antes de usar una API nueva,
  comprueba cuál está activo en la página.

## Eventos útiles

```js
document.addEventListener('turbo:load', inicializar);        // carga completa
document.addEventListener('turbo:frame-load', (e) => { ... }); // solo si el frame es el del ERP
document.addEventListener('turbo:before-frame-render', ...);
```

## Reglas del proyecto

- Los módulos JS se inicializan desde el arreglo `modulos` de `resources/js/app.js`, comprobando
  que exista su selector raíz. No uses `window.onload` ni listeners por vista.
- **Destruye antes de reinicializar**: `app.js` ya destruye las DataTables (`.dataTable`) para que
  Turbo no deje instancias huérfanas. Cualquier plugin con estado (Select2, Flatpickr, Chart.js,
  carruseles) debe seguir la misma idea.
- No enlaces con `target="_top"` ni `data-turbo="false"` sin motivo: rompe la navegación por frame.
- Los formularios dentro de un frame deben devolver HTML del frame, no una página completa.

## Gotchas

- Un `Turbo Frame` solo reemplaza contenido con `<turbo-frame id="...">` en la respuesta; si el
  controlador devuelve JSON, usa AJAX normal.
- Los `<script>` dentro del frame no se re-ejecutan: la inicialización va por `app.js`.
- Los eventos `turbo:load` se disparan también al volver con el historial.

## Documentación oficial

https://turbo.hotwired.dev/reference/frames
