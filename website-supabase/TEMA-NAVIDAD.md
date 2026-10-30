# Tema navideño (capa desactivable)

Archivos:
- `css/navidad.css` — solo decoración y tokens, se apoya en `estilos.css`, `login.css` y `perfil.css`.
- Respaldo de los CSS originales: `css/respaldo-2026-10-29/`.

## Apagar sin reconstruir

En `js/supabase-config.js`:

```js
window.TEMA_NAVIDAD = false;
```

Recarga la página. El HTML queda igual y el CSS base no se toca.

También puedes quitar `class="tema-navidad"` de `<html>` en las 5 páginas si prefieres desactivarlo sin JavaScript.

## Volver a activar

```js
window.TEMA_NAVIDAD = true;
```

## Si modificas el diseño base

Puedes editar `estilos.css`, `login.css` o `perfil.css` con normalidad. La capa navideña solo:

- cambia variables (`--acento`, `--borde`, sombras, etc.),
- estiliza clases existentes (`card-producto`, `pie`, `btn-primario`, etc.),
- añade pseudo-elementos decorativos (nieve, cinta del header, estrella del login).

No duplica estructura ni medidas, así que los cambios del CSS original se reflejan automáticamente.

## Quitar el tema por completo

1. Pon `window.TEMA_NAVIDAD = false` (o elimina la línea).
2. Opcional: borra `css/navidad.css` y los `<link>` que lo cargan.
3. El respaldo está en `css/respaldo-2026-10-29/` por si necesitas comparar.
