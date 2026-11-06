# jQuery 3.7.1 · DataTables 1.13.8 · Buttons 2.4.2

## Versiones reales

- jQuery **3.7.1**, DataTables **1.13.8** + integración `dataTables.bootstrap5`, Buttons **2.4.2**.
- Exportaciones: JSZip **3.10.1**, pdfmake **0.2.7** (dependencias de `buttons.html5`).
- En `resources/views/principal/links.blade.php` hay líneas comentadas con DataTables 2.0.8
  y Buttons 3.0.2: **están desactivadas**. No uses APIs de la 2.x.
- Todo se carga desde `config/assets.php` (CDN o `public/libs`), vía `Recursos::url()`.

## Patrón del proyecto

- Un archivo por módulo en `resources/js/` (`MostrarClientes`, `MostrarCompras`, …), registrado
  en `resources/js/app.js` con el selector raíz de la vista.
- La tabla se inicializa dentro del `init...()` del módulo, sobre un `#tablaX` de la vista.

```js
const tabla = $('#tablaClientes').DataTable({
    processing: true,
    serverSide: true,
    ajax: { url: ruta, type: 'GET' },
    columns: [/* ... */],
    initComplete: function () {
        ConfigurarFiltrosDataTable(this, { columnasSelect: [2, 3], columnasIgnorar: [11] });
    },
});
```

## Helpers propios (no reimplementar)

- `window.registrarFiltroDataTable(id, fn)` — filtros por columna (ver `MostrarCliente.js`).
- `ConfigurarFiltrosDataTable(api, { columnasSelect, columnasIgnorar, opciones })`.
- Botón de recarga: `.btn-recargar` con `data-tabla="#tablaX"`; el comportamiento vive en
  `resources/js/FuncionesGlobales.js` y el estilo en `resources/css/BtnRecargar.css`. No duplicar listeners.

## Operaciones habituales

```js
$('#tablaClientes').DataTable().ajax.reload(null, false);   // recargar sin reiniciar paginación
$('#tablaClientes').DataTable().ajax.reload();              // recargar y volver a página 1
$.fn.DataTable.isDataTable('#tablaClientes');               // ¿ya inicializada?
$('#tablaClientes').DataTable().destroy();                  // antes de reinicializar
```

## Gotchas de este proyecto

- Con Turbo, cada cambio de frame vuelve a montar la vista: `app.js` destruye las tablas
  existentes (`.dataTable`) antes de re-inicializar. No crees la tabla fuera del `init`.
- Una tabla **no** se puede inicializar dos veces: comprobar con `$.fn.DataTable.isDataTable`
  o destruir antes.
- Las columnas de acciones (editar, estado) usan `render` con HTML: escapar datos del servidor.
- No usar `serverSide` en tablas que ya cargan todo el dataset en el cliente.

## Documentación oficial

- https://datatables.net/reference/option/ (solo la opción concreta)
- https://datatables.net/extensions/buttons/
