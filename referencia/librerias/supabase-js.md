# supabase-js v2 (solo tienda)

La tienda de `website-supabase` habla con Supabase directo desde el navegador.
El ERP Laravel **no** usa esta librería.

## Carga y capas

- `js/core/supabase-config.js` — crea el cliente (URL + *publishable key*).
- `js/core/supabase-api.js` — wrapper `window.TiendaAPI` (`.get`, `.post`, RPC, errores normalizados).
- `js/core/supabase-api.js` también mapea rutas: `GET /tienda/api/promociones`, productos, etc.
- `js/core/carrito-store.js`, `js/components/*`, `js/pages/*` consumen esas capas.

## Regla

**No llamar `supabase` directamente desde una página.** Usa `window.TiendaAPI`:

```js
const datos = await window.TiendaAPI.get('/tienda/api/promociones');
```

Así se mantienen el manejo de errores, el modo invitado y la forma de respuesta (`{ success, ... }`).

## API de v2 que aparece en el wrapper

```js
supabase.rpc('web_promociones', parametros);        // funciones SQL del proyecto
supabase.from('tabla').select('*').eq('id', id);
supabase.auth.getSession();
supabase.auth.signInWithPassword({ email, password });
```

## Gotchas

- La versión está fijada solo por major (`@supabase/supabase-js@2`): no asumas APIs de una minor.
- **Nunca** poner la `service_role` en el navegador; la seguridad depende de RLS.
- La `publishable key` es pública a propósito.
- Carrito y sesión se leen antes de pedir promociones (`sesionTiendaPromise`); respeta ese orden
  para no mostrar estados de invitado a un cliente con sesión.
- Si una RPC nueva falla, revisa primero el SQL (`supabase/*.sql`), no el JS.

## Documentación oficial

https://supabase.com/docs/reference/javascript/ (solo el método concreto)
