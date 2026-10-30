# Notas · Tienda web (decisiones y pendientes)

> Documento de trabajo. `[x]` = ya tocado/decidido en conversación · `[ ]` = pendiente de decidir o implementar.
> Última actualización: 2026-10-30

---

## 1. Decisiones ya tomadas

- [x] **Envío calculado por km**
  - Tarifa fija por kilómetro.
  - La ubicación del cliente es obligatoria para cotizar (por eso importan las coordenadas de `cliente_direcciones`).
- [x] **Catálogo con paginación** (hallazgo 5: hoy se renderiza todo de una vez).
- [x] **Verificación de correo con código** (hallazgo 6: hoy `web_autoconfirmar_correo` marca el correo como verificado sin comprobarlo).
  - Flujo actual: el registro queda **pendiente de confirmar correo** y no inicia sesión hasta confirmarlo.
  - Requiere quitar el trigger `web_autoconfirmar_correo` (ya eliminado en `supabase/website.sql`) y configurar SMTP.
- [ ] **Descuento de primera compra al confirmar el correo** (futuro): al confirmar, asignar un descuento/cupón de bienvenida al cliente y mostrarlo en «Mi cuenta → Descuento».
- [x] **Rutas adaptadas al hosting**: `urlTienda()` usa `/tienda/...` en local y la raíz en Cloudflare Pages; el login con Google y el registro ya apuntan al dominio actual.
- [x] **Perfil del cliente ampliado**: historial de ventas, deudas por pagar, etc.
- [x] **Centro de ayuda** (`/ayuda`): selectores de necesidad (contraseña, acceso, correo, cuenta desactivada, pedido, otro) y envío del caso por WhatsApp al +505 84774288 (también por correo).
- [x] **Contraseña temporal para el ejecutivo**: `php artisan tienda:password-temporal correo@dominio.com --password=123456` asigna la temporal y el cliente la cambia en Mi cuenta → Configuración.
- [x] **Usuario derivado del nombre**: `tellez_software` en lugar de `u_b745…` (trigger `web_crear_cliente` + migración `2026_10_30_000002`).
- [x] **Tipos de talla**: tabla `tipos_talla` (Calzado, Ropa adulto, Ropa niño, Única), `tallas.id_tipo_talla`, `tallas.orden_talla` y `categoria.id_tipo_talla` (migración `2026_10_30_000003`). CRUD dentro de la vista Tallas + permisos `mostrar/crear/editar/actualizar/cambiar_estado_tipos_tallas`.
- [ ] **Filtrar el selector de tallas del producto** según el tipo de su categoría (pendiente en `MostrarProductoVariacionDetalle`).
- [x] **Estados del pedido**: el cliente compra y paga en línea **o** solicita en línea → el negocio acepta el pedido → la transacción se realiza más adelante.
- [x] **Productos agotados**: se siguen mostrando, marcados como "Agotado", al final del listado.

---

## 2. Estado de los hallazgos originales

| # | Hallazgo | Estado |
|---|----------|--------|
| 1 | No existe checkout (botón "próximamente") | [x] Encaminado con el flujo de **estados** (pedido/solicitud) |
| 2 | Precio y stock vienen del `localStorage`, sin revalidar | [ ] Pendiente |
| 3 | Envío fijo como "Gratis" | [x] Definido por km |
| 4 | Sin slug ni datos estructurados (SEO) | [ ] Pendiente |
| 5 | Catálogo sin paginación | [x] Definido |
| 6 | Correo autoconfirmado sin verificación real | [x] Definido con código de confirmación |
| 7 | Sin analítica ni eventos | [ ] Pendiente |
| 8 | Direcciones sin departamento/municipio | [~] Parcial: hay coordenadas (lat/lng), falta catálogo geográfico |

---

## 3. Pendiente de decidir (para próximas conversaciones)

### 3.1 Envío por km
- [x] Campos base creados en `credenciales`: `tarifa_km`, `latitud_empresa`, `longitud_empresa` (editables en el modal de configuración de empresa).
- [ ] Cargar los valores reales (tarifa y coordenadas del negocio).
- [ ] Punto de origen del cálculo (tienda física, bodega) y dónde se configura.
- [ ] Fórmula: ¿`base + (km × tarifa)` o solo `km × tarifa`? ¿Redondeo?
- [ ] Distancia en línea recta (Haversine) o por ruta real (API de mapas).
- [ ] Radio máximo de entrega y qué pasa si el cliente está fuera.
- [ ] Envío gratis por monto mínimo (¿aplica también a envíos lejanos?).
- [ ] Retiro en tienda (costo C$ 0) como alternativa.
- [ ] Qué pasa si el cliente no marca ubicación o la dirección no tiene coordenadas.
- [ ] Mostrar el costo estimado en el carrito antes del checkout.

### 3.2 Estados del pedido
- [ ] Lista definitiva de estados y transiciones permitidas.
  - Propuesta: `solicitado` → `aceptado` / `rechazado` → `preparando` → `enviado` / `listo_retiro` → `entregado`; más `cancelado` y `devuelto`.
- [ ] Estado de **pago** separado del estado de **pedido** (pendiente, en revisión, pagado, parcial, reembolsado).
- [ ] Quién cambia cada estado y con qué permiso.
- [ ] Qué estado descuenta stock y en qué momento (al aceptar, al pagar o al enviar).
- [ ] Qué pasa si el pedido se rechaza o se cancela (liberar stock, avisar al cliente).
- [ ] Numeración legible del pedido (ej. `WEB-000123`).
- [ ] Tiempo de expiración de una solicitud sin aceptar.

### 3.3 Comprar y pagar en línea vs. solicitar
- [ ] ¿"Solicitar en línea" es sin pago (solo intención) y "comprar" es con pago?
- [ ] Métodos de pago iniciales: contra entrega / transferencia con comprobante / pasarela.
- [ ] Pasarela: queda para después (confirmado), pero ¿se deja el punto de integración preparado?
- [ ] Comprobante de pago: ¿se sube al pedido o se envía por WhatsApp?

### 3.4 Inventario y stock
- [ ] Reserva de stock al solicitar o solo descuento al aceptar.
- [ ] Descuento en `variacion_tallas` + registro en `movimientos_inventario` (Kardex).
- [ ] Stock publicado en la web vs. stock real de tienda física.
- [ ] Revalidación de precio y stock en el servidor al confirmar el pedido.
- [ ] Aviso "quedan X" y "avísame cuando vuelva" para agotados.

### 3.5 Catálogo y productos agotados
- [ ] Criterio de "agotado": stock total 0 o talla/color específico.
- [ ] Orden: disponibles primero, agotados al final (¿también al filtrar?).
- [ ] Etiqueta visual "Agotado" y bloquear agregar al carrito.
- [ ] Paginación: ¿por bloques de cuántos? ¿"Ver más" o scroll infinito?
- [ ] Filtro "solo disponibles" y filtro por color.
- [ ] Marcas como entidad (hoy solo hay categorías).

### 3.6 Clientes y perfil
- [ ] Historial de ventas: ¿solo pedidos web o también compras de mostrador?
- [ ] Deudas por pagar: usar las cuotas existentes (`payment_plans`) del ERP.
- [ ] Mostrar saldo, próxima cuota y vencimiento; ¿permite pagar en línea?
- [ ] Detalle del pedido con factura/recibo descargable.
- [ ] Direcciones con departamento/municipio (catálogo Nicaragua) además de coordenadas.
- [ ] Dirección predeterminada y edición de dirección desde el checkout.
- [ ] Preferencias de comunicación (acepta email / WhatsApp).

### 3.7 Correo y notificaciones
- [ ] SMTP y plantillas de Supabase Auth con **código** de confirmación en lugar de enlace.
- [ ] Quitar `web_autoconfirmar_correo` cuando el SMTP esté configurado.
- [ ] Correos del pedido: recibido, aceptado, enviado, entregado, cancelado.
- [ ] WhatsApp como canal (confirmación y coordinación de entrega).
- [ ] Aviso interno al negocio cuando entra una solicitud o un pago.

### 3.8 Promociones
- [x] Descuento fijo por cliente (ya existe).
- [ ] Cupones con código, vigencia y límites.
- [ ] Precio de oferta con precio anterior tachado.
- [ ] Envío gratis por umbral (se cruza con 3.1).

### 3.9 Administración
- [ ] Bandeja de pedidos con filtros por estado, pago y zona.
- [ ] Aceptar/rechazar pedido desde el ERP.
- [ ] Moderación de reseñas (`estado_resenia` ya existe, sin interfaz).
- [ ] Gestión de tarifas de envío y cupones sin tocar SQL.
- [ ] Reportes: conversión, ticket promedio, top productos, costo de envío.

### 3.10 Confianza y contenido
- [ ] Páginas legales (términos, privacidad, envíos, devoluciones) y FAQ.
- [ ] SEO por producto: slug, meta, `Product` JSON-LD, sitemap.
- [ ] Barra fija de compra en móvil.
- [ ] Analítica de eventos (vista, carrito, checkout).

---

## 4. Notas técnicas de referencia

- Carrito actual: `localStorage` (`tienda_carrito_v1`), sin respaldo en servidor.
- `cliente_direcciones`: `nombre_direccion`, `ubicacion_maps`, `referencia_direccion`, `direccion_manual`, `predeterminada_direccion`, + coordenadas (`2026_10_29_000002`).
- Catálogo: RPC `web_productos()` / `web_producto(id)`; hoy devuelve productos con `estado_producto = true` sin importar el stock y ordena por nombre.
- Historial: RPC `web_historial()` lee `ventas` + `detalle_ventas` (solo lectura, últimos 50).
- Reseñas: RPC `web_resenias(id)`, `estado_resenia` para moderación.
- Cuotas/deudas: tablas de planes de pago del ERP (`2026_10_10_000002_create_payment_plans_tables`).
- Anti-patrones detectados: `stock || 999` en el carrito, email autoconfirmado por trigger, envío "Gratis" fijo.
- Envío por km: `credenciales.tarifa_km`, `credenciales.latitud_empresa`, `credenciales.longitud_empresa` (migración `2026_10_30_000001`). El cliente ya tiene coordenadas en `cliente_direcciones`.

## 5. Configuración externa pendiente (Supabase / Cloudflare)

- [ ] Supabase → Authentication → URL Configuration:
  - Site URL: `https://tellezstorenic.pages.dev`
  - Redirect URLs: `https://tellezstorenic.pages.dev/**` y `http://127.0.0.1:8090/**`
- [ ] Supabase → Providers → Google: Client ID y Client Secret.
- [ ] Google Cloud → URI autorizado: `https://tnzuicefxwowpbjtjdnx.supabase.co/auth/v1/callback`
- [ ] Cloudflare Pages: publicar `_redirects` corregido (sin destinos `.html`).
- [ ] Supabase → Authentication → URL Configuration: Site URL cambiado a `https://tellezstorenic.pages.dev` (era `http://localhost:3000`).
- [ ] SMTP en Supabase para los correos de confirmación de cuenta.
- [ ] Enlace «¿Olvidaste tu contraseña?» con `resetPasswordForEmail` (requiere SMTP).
