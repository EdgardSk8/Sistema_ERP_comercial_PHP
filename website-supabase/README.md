# Tienda independiente (Supabase)

Versión estática de la tienda que usa **Supabase** directamente (Auth + PostgREST + RPC).
No depende del backend Laravel.

## Estructura

- `js/core/`: configuración, API Supabase, carrito y utilidades compartidas.
- `js/pages/`: lógica de cada página (`tienda`, `producto`, `carrito`, `login`, `perfil`, `ayuda`).
- `js/components/`: promociones, reseñas y mapa.
- `css/base/`: estilos globales, tema navideño y subconjunto de Bootstrap Icons.
- `css/pages/`: estilos de login y perfil.
- `_backup/`: respaldos históricos; no forma parte del sitio publicado.

> La tienda Laravel anterior quedó archivada en `website-legacy/` en la raíz del repositorio.

## 1. Requisitos ya aplicados

- SQL ejecutado: `supabase/website.sql` (columna `auth_id`, trigger, RLS y funciones `web_productos`, `web_producto`, `web_favoritos`, `web_historial`).
- Pedidos web: después de `php artisan migrate`, ejecutar `supabase/pedidos-web.sql` (tablas de pedidos, estados, RLS y RPC `web_crear_pedido`, `web_pedidos`, `web_pedido`, `web_cancelar_pedido`).
- Trabajadores/repartidores: después de `php artisan migrate` y de `supabase/pedidos-web.sql`, ejecutar `supabase/trabajadores.sql` (tabla `trabajadores`, rol `clientes.rol_cliente`, RLS, RPC de solicitud/disponibilidad, asignación de repartidor a `pedidos_web`, RPC `web_trabajador_pedidos`, `web_trabajador_aceptar_pedido`, `web_trabajador_estado_pedido` y bucket público `trabajadores` para las fotos). La solicitud de reparto vive en `/tienda/trabaja-con-nosotros` y el panel del repartidor en `/tienda/trabajador`. Para el arqueo del repartidor ejecutar después `supabase/arqueos-trabajador.sql` (RPC `web_trabajador_arqueos`). En el ERP, **Trabajadores → Arqueo** muestra el pendiente y el historial.
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

### ⚠️ Caché de los scripts (importante)

Los HTML cargan los JS con `?v=AAAAMMDDx`. **Cada vez que cambies un archivo de `js/`,
sube su versión en los HTML** (ej. `supabase-api.js?v=20261103h` → `?v=20261105a`).

Si no se sube, los navegadores que ya visitaron la tienda siguen ejecutando el código viejo
y los arreglos "no se ven" aunque ya estén desplegados. Pasó con el arreglo de contraseñas:
el cambio estaba en `supabase-api.js` pero la versión seguía en `20261103h`.

## 4. Configurar Supabase Auth

En el panel de Supabase:

1. **Authentication → URL Configuration**
   - Site URL: `https://TU-SITIO` (producción; **no** lo cambies para desarrollar en local).
   - Redirect URLs (con `/**` se cubren todas las rutas):
     - `https://TU-SITIO/**`
     - `http://127.0.0.1:8090/**`
     - `http://localhost:8090/**`
     - `http://127.0.0.1:8000/**` y `http://localhost:8000/**` (si usas `php artisan serve`)
     - `http://TU-IP-LAN:8090/**` (para probar desde el celular u otro equipo)
   - El host debe coincidir **exacto**: `localhost` y `127.0.0.1` son distintos. Si el
     `redirectTo` no está en la lista, Supabase lo ignora y devuelve al **Site URL**
     (producción) sin mostrar error.
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
- El index acepta `?categoria=Nombre` (p. ej. `/tienda?categoria=Zapatos`) para abrir el catálogo
  ya filtrado y bajar hasta él; lo usa el botón «Ver zapatos» del descuento de bienvenida en Perfil.
  También acepta `?categoria=Descuentos` (o `ofertas`).
- La categoría «Descuentos» solo lista productos con una **promoción activa del ERP**
  (`promociones`); el 10 % de bienvenida del cliente **no** cuenta ahí. Si no hay promociones,
  la categoría no se muestra.
- **Modo prueba de pedidos**: en `js/core/supabase-config.js`, `window.TIENDA_MODO_PRUEBA = true`
  simula el checkout (`PRUEBA-XXXXXX`) sin escribir en Supabase y muestra un aviso en el carrito.
  Déjalo en `false` en producción.
- **404**: Cloudflare Pages sirve `404.html` para rutas inexistentes; `dev-server.php` también
  la usa en local.
- **Imágenes**: las fotos de productos y promociones se optimizaron (máx. 1000 px, WebP 78-80).
  Guarda una copia de los originales antes de reemplazarlas si necesitas más calidad.

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
- Al aplicarlo se guarda `descuento_primera_compra: true` en los metadatos de Auth y el descuento del **10%** se aplica a los productos de la categoría **Zapatos** vía `carrito-vista.js`.
- El descuento se consume en la **primera compra que incluye zapatos**, aunque el cliente elija una promoción, un cupón o ningún descuento. Si el pedido se cancela o se rechaza, vuelve a quedar disponible.

### Cupón de fidelidad (10% por par)

- Cada **par** comprado aporta el **10%** de su precio neto (sin envío, después de descuentos) a un acumulado.
- Al completar **10 pares**, el cliente puede **reclamar** un cupón de monto igual al acumulado, que equivale al precio promedio del par (ej.: 5 × C$ 220 + 5 × C$ 550 = cupón de C$ 385).
- Progreso y reclamo: `web_fidelidad()` y `web_reclamar_fidelidad(p_ciclo)` en `supabase/fidelidad-tienda.sql`.
- El cupón se crea en `cupones` (`tipo = monto`, `categoria = Zapatos`, un uso, vence a los 60 días) y se asigna en `cupones_clientes`; aparece en Perfil → Descuentos y cupones y como opción en el carrito.
- Solo cuentan ventas con `estado_venta = true`.

## 8. Marcos de avatar por ventas

- Marcos automáticos por ventas vigentes: **5** Bronce, **10** Plata, **20** Oro, **50** Esmeralda y **100** Rubí.
- El total se obtiene con `web_ventas_cliente()` (al final de `supabase/website.sql`). Ejecuta esa función en el SQL Editor de Supabase si aún no existe.
- El cliente puede mostrar u ocultar el marco desde Perfil → Marco de ventas; la preferencia se guarda en `marco_avatar` (metadatos de Auth).
- **Marco manual/demostración:** `marco_avatar_forzado` en los metadatos de Auth (`bronce`, `plata`, `oro`, `esmeralda`, `rubi` o `todos` para desbloquearlos todos). Ejemplo listo en `supabase/marco-edgard.sql`.
- **Reseñas con avatar:** `web_resenias()` devuelve el avatar y marco de cada autor. Si actualizas desde una versión anterior, vuelve a ejecutar la función con `supabase/resenias-avatar.sql`.
- **Estilo de los marcos:** anillo metálico cónico fino + gema inferior + halo, con paletas propias para Bronce, Plata, Oro, Esmeralda y Rubí. Los marcos son estáticos (sin animación). El CSS está al final de `css/base/estilos.css`; no requiere cambios en el HTML/JS.
- **Indicador de carga global:** `.tienda-cargando` muestra un spinner centrado y difumina el fondo (`backdrop-filter`). `TiendaAPI` acepta `{ cargando: true }` en `get/post/put/delete`; se usa al cargar reseñas y al guardar perfil, avatar, marco, contraseña y direcciones.
- **Fondos de avatar:** lista fija `AVATAR_FONDOS` en `js/pages/perfil.js` (`fondo-1.png` a `fondo-7.png`). Si agregas una imagen, añádela a esa lista y al `LEEME.txt`; así se evitan sondeos de archivos inexistentes.
- **Cambio de contraseña:** al crear o cambiar la contraseña se guarda `password_set` en `user_metadata`; en el siguiente cambio el formulario pide la contraseña actual.
- **Errores al usuario:** `tiendaToast` filtra mensajes técnicos (TypeError, `Cannot read properties`, fallos de red, AuthApiError, etc.) y muestra un aviso genérico en su lugar.
- **Precios con descuento:** `descuentoClienteActivo()` y `precioConDescuento()` en `carrito-store.js`. El catálogo y la ficha muestran precio original tachado, precio final y badge con el descuento. El carrito y los estados de venta (online, billetera móvil, efectivo) se manejan aparte.
- **Delivery en el carrito:** configuración en `js/core/supabase-config.js` (`window.TIENDA_DELIVERY`): C$15 por km, redondeo a la baja a múltiplo de C$5, **tarifa mínima de C$30** y **radio máximo de 20 km**. El carrito usa un selector Select2 con las direcciones del cliente, calcula la distancia desde la tienda y muestra el cálculo, el redondeo y la tarifa mínima. La dirección y sus coordenadas se recuerdan en `localStorage`.
- **Fuera de 20 km no hay delivery:** el carrito avisa que el pedido viaja por **Cargo Trans / encomienda**, deja el envío en C$0 (se paga en la transportadora) y el pedido se guarda con `metodo_entrega_web = 'encomienda'`. El servidor (`web_crear_pedido`) recalcula la distancia y decide el método, así que no se puede forzar `delivery` desde el navegador. El ERP muestra el método y la distancia en el detalle del pedido web.

## 9. Optimización de carga

- **Imágenes:** `scripts/optimizar_imagenes_tienda.py` reduce logos, productos, variaciones y fondos de avatar sin cambiar nombres ni rutas. Resultado aplicado: **14.09 MB → 5.44 MB (-61%)**.
- **Iconos:** `scripts/generar_iconos_tienda.py` genera `css/base/bootstrap-icons-subset.css` y `fonts/bootstrap-icons-subset.woff2` con solo los iconos `bi-*` usados. Si agregas un icono nuevo, vuelve a ejecutar el script.
- **Bootstrap CSS:** `index`, `producto` y `carrito` ya no lo cargan; solo usan el CSS propio y el subconjunto de iconos. `login`, `perfil` y `ayuda` sí lo necesitan.
- **Mapa:** el iframe de Google Maps se carga al pulsar «Ver mapa de ubicación» (`js/components/mapa.js`); no bloquea la carga inicial.
- **Caché:** al modificar CSS/JS, sube el parámetro `?v=` en los HTML para invalidar la caché del navegador.

## 10. Panel administrador móvil

- **Rutas:** `/tienda/admin` (panel) y `/tienda/admin-login` (acceso). También funcionan `/admin` y `/admin-login` en local.
- **Acceso:** usuario y contraseña del ERP (`usuarios` + `roles`). Solo entra un usuario con rol **Administrador** y cuenta activa. En el perfil de la tienda hay un enlace **Login administrador** debajo de «Trabaja con nosotros».
- **SQL:** ejecutar `supabase/admin-web.sql` en el SQL Editor de Supabase antes de usar el panel. Crea las tablas `admin_web_sesiones`, `admin_web_intentos`, `pedidos_web_pagos`, `repartidor_cierres` y `repartidor_cierre_pedidos`, las RPC `web_admin_*` y ajusta el trigger `web_proteger_rol_cliente` para que el panel pueda aprobar repartidores. Si ya ejecutaste una versión anterior, vuelve a ejecutar el archivo para crear `web_admin_cierres_trabajador` (historial por repartidor). Después ejecutar `supabase/arqueos-trabajador.sql` para el arqueo del panel del repartidor.
- **Sesión:** token aleatorio de 256 bits; en la base solo se guarda su hash SHA-256. Dura **12 horas**, se borra al cerrar sesión y el login se bloquea 15 minutos tras 5 intentos fallidos.
- **Seguridad:** el navegador solo usa la `publishable key`; nunca la `service_role`. Las RPC administrativas validan el token y están concedidas a `anon`/`authenticated`; las tablas de sesiones e intentos tienen RLS sin políticas. El token se guarda en `localStorage` para no pedir la clave en cada visita; el botón de salir lo elimina. La contraseña se verifica con **bcrypt** (`$2y$`/`$2a$`) usando `pgcrypto`; si el ERP cambia a Argon2, hay que ajustar `web_admin_login`.
- **Pedidos:** lista y detalle con cliente, artículos, totales, pagos e historial. Acciones permitidas:
  - **Aceptar y facturar** desde **Aceptar** (o **Facturar pedido** si ya estaba aceptado): `web_admin_pedido_aceptar` crea la factura `VTA-YYYYMMDD-#####`, descuenta stock por FIFO y deja el pedido **aceptado**. Si el pedido está pagado, registra el ingreso; si es **efectivo con pago pendiente**, factura y deja el pago pendiente para el **cierre del delivery**.
  - **Cobrar un pedido en línea** (`lafise` o `billetera_movil`) desde **Cobrar**: se ingresa el monto recibido (con referencia opcional); debe ser **igual al total**, sin montos menores/mayores y con máximo dos decimales. Crea la factura, registra el ingreso y deja el pedido **aceptado + pagado**.
  - **Efectivo:** no se registra pago pedido por pedido. El cobro lo hace el repartidor y se cuadra en **Cierre de delivery**.
  - **Rechazar/cancelar** una solicitud sin pago y sin factura; también se puede cancelar un pedido **aceptado** mientras siga sin factura y sin pago.
  - Avanzar a **enviado** o **entregado** solo si el pedido ya está facturado (`id_venta`) y pagado.
  - Los pedidos web se cobran completos, sin abonos parciales. Las ventas a plazos sí permiten abonos desde **Cuentas por cobrar**.
- **Promociones:** crear/editar (producto, tipo y valor del descuento, fechas, activa) y pausar/activar. La imagen se administra desde el ERP; **el panel no permite cambiarla ni ingresar una foto**. Al crear se usa la imagen del producto y al editar se conserva la existente.
- **Cupones:** crear/editar (código, nombre, tipo, valor, categoría, tope, usos, fechas) y pausar/activar. El código se guarda en mayúsculas y no se permiten duplicados.
- **Repartidores:** revisar solicitudes, aprobar (con comisión), rechazar (motivo obligatorio) y suspender. Al aprobar, el cliente pasa a `rol_cliente = 'trabajador'`.
- **Cierre de delivery:** pestaña **Cierre** con rango **Desde/Hasta** (hoy por defecto). Muestra un **resumen global** y una **tabla resumen** con los repartidores que tuvieron entregas en el periodo, dentro de un **contenedor con scroll y buscador por nombre/teléfono**. Columnas: repartidor, pedidos, total a entregar, estado y acciones. Si un repartidor ya cerró todo, sigue visible como **Cerrado** con 0 pendiente.
  - **Detalles** abre un panel con los métodos cobrados, el resumen de delivery y el pendiente agrupado por día. Si hay pedidos pendientes, incluye el formulario de cierre y **Arquear** para iniciar el mismo panel.
  - Al final del panel aparece el **historial del repartidor** (últimos 50 cierres) con fecha, periodo, pedidos, monto entregado, total y diferencia. No se carga automáticamente: el botón **Cargar** lo consulta por primera vez y luego cambia a **Actualizar** (`web_admin_cierres_trabajador`).
  - Suma los pedidos entregados y aún no cerrados de cada repartidor y muestra:
    - Productos cobrados por **efectivo**, **billetera móvil** y **Lafise** (el delivery cobra los tres métodos).
    - **Total delivery**, **pago a la empresa** (el porcentaje que retiene la tienda según la comisión del repartidor) y **ganancia del delivery**.
    - **Total a entregar a la empresa** = productos + comisión de la empresa por el envío.
  - Al confirmar el **monto entregado**, guarda el cierre con la diferencia (cuadra, falta o sobra), marca los pedidos como pagados y los excluye del siguiente cierre. RPC: `web_admin_cierre_delivery`, `web_admin_cierre_delivery_guardar`, `web_admin_cierres_delivery` y `web_admin_cierres_trabajador`.
- **Cuentas por cobrar:** consulta de saldo, cuotas, vencimientos y pagos, con botón de WhatsApp y llamada. **Pagar** abre el formulario de abono: permite abonar una parte o el saldo total (`web_admin_cuenta_pagar`), con máximo dos decimales y sin superar el saldo. En efectivo exige una **caja abierta**; también se puede elegir una **cuenta activa**. El abono se aplica a las cuotas más antiguas, se registra en `pagos_venta`, `aplicaciones_pago_cuota` y el movimiento de caja/cuenta, y actualiza el historial al instante. Los pedidos web en línea se cobran desde **Pedidos**.
- **Interfaz compacta:** las notas de ayuda se abren con el icono de información junto al título (flotante, sin ocupar espacio), el contador con su etiqueta (por ejemplo, «3 pedidos») va al lado del título, se quitaron los encabezados de sección y las acciones de las tarjetas usan botones compactos. El buscador y las acciones son más pequeños en móvil.
- **Caché:** al modificar `css/pages/admin.css`, `js/pages/admin.js` o `js/pages/admin-login.js`, sube el `?v=` en `admin.html`/`admin-login.html`. Al modificar `js/components/promos.js`, sube su versión en `index.html` y `producto.html`.
- **Rutas de hosting:** `_redirects`, `vercel.json` y `dev-server.php` ya incluyen `/tienda/admin`, `/tienda/admin-login` y sus variantes.
- **Pruebas realizadas:** login real con un usuario temporal (borrado después), lectura de pedidos/promociones/cupones/repartidores/cuentas, creación de cupones y promociones de prueba (eliminados), detalle de pedido/cuenta, navegación, cierre de sesión y diseño a 390 px, 320 px y 268 px sin desbordamiento horizontal, con ayuda flotante, contador con etiqueta junto al título y acciones compactas. Se probó de punta a punta: aceptar/facturar efectivo con pago pendiente, aceptar/facturar online pagado, cobrar online pendiente, cancelar un aceptado sin factura, rollback por falta de stock, cierre de delivery con varios repartidores, los tres métodos y diferencia de arqueo, repartidores ya cerrados visibles en la tabla, panel **Detalles** con historial por repartidor, arqueo del repartidor con filtro de fechas y desglose diario, respuesta del arqueo en el ERP, vista compacta del repartidor y transición a enviado; los datos temporales se eliminaron y el saldo/caja quedaron restaurados.

## 11. Panel del repartidor

- Ruta: `/tienda/trabajador`.
- **Mis entregas** muestra por defecto los pedidos de **hoy** en una lista compacta; toca cada fila para expandir dirección, productos, ganancia y acciones.
- El filtro **Hoy / Todas** permite ver únicamente la jornada actual o el historial completo.
- En móvil, el resumen **Disponibles / Activas / Entregadas** permanece en una sola fila con sus iconos, y el selector de disponibilidad es más pequeño. En escritorio se redujeron espacios, ancho y altura del encabezado.
- **Mi arqueo:** botón en la barra de pedidos que abre un modal con rango **Desde/Hasta**, total pendiente por entregar a la empresa, productos, delivery, ganancia y desglose por efectivo, billetera y Lafise. Incluye el pendiente agrupado por día y el **historial de cierres** ya registrados por el administrador.
- La vista compacta se actualiza con `trabajador.js` y `trabajador.css`; recuerda subir sus `?v=` en `trabajador.html` al modificarlos. El arqueo usa `supabase/arqueos-trabajador.sql`.
