# Flatpickr 4.6.13 (+ locale `es`)

Se carga con `Recursos::url('flatpickr_js')`, `('flatpickr_es')` y `('flatpickr_css')`.
En la tienda aparece en `perfil.html` (con `flatpickr/dist/l10n/es.js`).

## Usa el helper del proyecto

`window.FlatPickr(elemento)` en `resources/js/FuncionesGlobales.js` ya aplica:

```js
flatpickr(elemento, {
    locale: 'es',
    dateFormat: 'Y-m-d',              // valor que viaja al backend
    altInput: true,                   // input visible con formato legible
    altFormat: 'j \\d\\e F \\d\\e\\l Y', // "6 de noviembre de 2026"
});
```

No lo instancies a mano salvo que necesites opciones extra; en ese caso parte de esa base.

## Opciones extra habituales

```js
const picker = flatpickr(elemento, {
    ...,
    minDate: 'today',
    maxDate: otraFecha,
    allowInput: true,
    disableMobile: true,   // mantener el calendario propio en móvil
});

picker.setDate('2026-11-06', true);   // true = dispara onChange
picker.clear();
```

## Gotchas

- `dateFormat` usa los tokens de Flatpickr (`Y-m-d`, `d/m/Y`), **no** los de PHP/Carbon.
- El valor que se envía al servidor es el del input original (`Y-m-d`); el texto en español es
  solo `altInput`. No leas el `altInput` para armar la petición.
- En un modal, inicialízalo con el modal visible (`shown.bs.modal`).
- El locale `es` debe cargarse **después** de `flatpickr.min.js` (así está en `links.blade.php`).

## Documentación oficial

https://flatpickr.js.org/options/ (solo la opción concreta)
