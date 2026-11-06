# Select2 4.1.0-rc.0

Se usa en el ERP (`resources/js/CuentasPorCobrar.js`, `Facturacion.js`, `Mostrar*`) y en la tienda
(`carrito.html`, `perfil.html`, `index.html`). No hay tema Bootstrap 5 activo: el CSS base de
Select2 es el que estiliza el componente y el tema propio lo ajusta.

## Patrón de inicialización

```js
const select = $('#selectCliente');

if ($.fn.select2 && !select.data('select2')) {
    select.select2({
        width: '100%',
        placeholder: 'Selecciona un cliente',
        allowClear: true,
        dropdownParent: $('#modalCliente'),   // obligatorio dentro de modales
    });
}
```

## Operaciones habituales

```js
select.val(id).trigger('change');            // fijar valor y notificar a los listeners
select.select2('destroy');                   // antes de reinicializar (o al cerrar el modal)
select.select2('open');                      // abrir el desplegable
const datos = select.select2('data');        // [{ id, text }]
```

## Gotchas

- **`dropdownParent` es obligatorio** si el `<select>` está dentro de un modal: sin él el
  desplegable se renderiza detrás del backdrop.
- Inicializar con el modal ya visible (`shown.bs.modal`); en un contenedor oculto el ancho se calcula mal.
- `trigger('change')` es necesario para que los listeners del proyecto reaccionen al valor.
- No cargar el tema `select2-bootstrap-5-theme` (está comentado a propósito en `links.blade.php`).
- Si el módulo puede ejecutarse antes de que Select2 esté disponible, protege con `if ($.fn.select2)`
  como ya hace `Facturacion.js`.

## Documentación oficial

https://select2.org/configuration/options-api (solo la opción concreta)
