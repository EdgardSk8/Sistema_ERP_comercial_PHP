# Tienda independiente (Supabase)

Versión estática de la tienda que usa **Supabase** directamente (Auth + PostgREST + RPC).
No depende del backend Laravel.

## 1. Requisitos ya aplicados

- SQL ejecutado: `supabase/website.sql` (columna `auth_id`, trigger, RLS y funciones `web_productos`, `web_producto`, `web_favoritos`, `web_historial`).
- Imágenes copiadas desde `public/imagenes` a `imagenes/`.

## 2. Probar en local

```bash
cd website-supabase
php -S 127.0.0.1:8090 dev-server.php
```

Abre `http://127.0.0.1:8090/tienda`.

`dev-server.php` imita las reescrituras del hosting (`_redirects` / `vercel.json`), por eso las URLs siguen siendo `/tienda/...`.

## 3. Publicar gratis

### Cloudflare Pages o Netlify (recomendado)
1. Arrastra la carpeta `website-supabase` en Pages/Netlify (o conecta el repo y usa esa carpeta como raíz).
2. El archivo `_redirects` ya incluye las rutas de la tienda.
3. Listo: HTTPS gratis.

### Vercel
1. Importa el repositorio y selecciona `website-supabase` como directorio raíz.
2. `vercel.json` ya contiene las rewrites.

## 4. Configurar Supabase Auth

En el panel de Supabase:

1. **Authentication → URL Configuration**
   - Site URL: `https://TU-SITIO` (o `http://127.0.0.1:8090` en local).
   - Redirect URLs: agrega
     - `https://TU-SITIO/tienda/login`
     - `http://127.0.0.1:8090/tienda/login`
     - `http://localhost:8000/tienda/login`
2. **Authentication → Providers → Google**
   - Actívalo con el Client ID y Client Secret de Google Cloud.
   - En Google Cloud, el URI de redirección autorizado debe ser:
     `https://TU-PROYECTO.supabase.co/auth/v1/callback`
3. **Authentication → Sign In / Up**
   - Para pruebas puedes desactivar *Confirm email*.
   - El login es con **correo y contraseña** (no con usuario).

## 5. Notas

- La `publishable key` es pública: la seguridad depende de RLS. **Nunca** pongas la `service_role` en el navegador.
- Los clientes creados antes en Laravel no tienen usuario de Supabase Auth; deben registrarse de nuevo o migrarse.
- Si el ERP agrega productos/imágenes nuevos, vuelve a copiar `public/imagenes` o migra a Supabase Storage.
- El catálogo y los precios se calculan en las funciones SQL, igual que la API anterior.

## 6. Avatar del cliente (colores e ilustraciones)

- El cliente elige un **color de fondo** en Perfil → Foto de perfil.
- El color y la ilustración se guardan en los **metadatos de Supabase Auth** (`avatar_color`, `avatar_imagen`, `avatar_fondo`), sin migrar la tabla `clientes`.
- **Fotos de fondo:** van en `imagenes/avatares/fondos/` con nombres `fondo-1.jpg`, `fondo-2.jpg`, … (hasta `fondo-8`, también `.png`/`.webp`). Se detectan solas y aparecen como opciones; si no hay ninguna, el cliente queda con **solo iniciales** sobre el color elegido.
- Las ilustraciones son PNG **sin fondo** en `imagenes/avatares/`; el nombre del archivo (sin `.png`) es el valor de `avatar_imagen`.
  - Ejemplo: `imagenes/avatares/copo.png` → `avatar_imagen = "copo"` → se pinta `/tienda/recursos/imagenes/avatares/copo.png` encima del círculo de color.
- Mientras no haya ilustraciones, se muestran las **iniciales** del cliente sobre el color elegido.

## 7. Descuento de primera compra (10%)

- En Perfil → Descuento el cliente ve los requisitos: **teléfono**, **fecha de nacimiento**, **una dirección guardada** y **contraseña creada**.
- El botón **Aplicar descuento** se habilita cuando todo está completo.
- Al aplicarlo se guarda `descuento_primera_compra: true` en los metadatos de Auth y el descuento del **10%** se aplica al subtotal del carrito (cualquier producto) vía `carrito-vista.js`.

## 8. Marcos de avatar por ventas

- Marcos automáticos por ventas vigentes: **5** Bronce, **10** Plata, **20** Oro, **50** Esmeralda y **100** Rubí.
- El total se obtiene con `web_ventas_cliente()` (al final de `supabase/website.sql`). Ejecuta esa función en el SQL Editor de Supabase si aún no existe.
- El cliente puede mostrar u ocultar el marco desde Perfil → Marco de ventas; la preferencia se guarda en `marco_avatar` (metadatos de Auth).
- **Marco manual/demostración:** `marco_avatar_forzado` en los metadatos de Auth (`bronce`, `plata`, `oro`, `esmeralda`, `rubi` o `todos` para desbloquearlos todos). Ejemplo listo en `supabase/marco-edgard.sql`.
- **Reseñas con avatar:** `web_resenias()` devuelve el avatar y marco de cada autor. Si actualizas desde una versión anterior, vuelve a ejecutar la función con `supabase/resenias-avatar.sql`.

