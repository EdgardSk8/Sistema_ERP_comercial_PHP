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
