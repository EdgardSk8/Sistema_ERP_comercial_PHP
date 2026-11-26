# Protocolo de inauguración · Tellez Nic Store

Guía para el día en que la tienda pasa de **“próxima apertura”** a **vendiendo**.
Todo se controla con **un solo interruptor**; no hay que tocar plantillas ni HTML.

---

## 0 · El interruptor

Archivo: `website-supabase/js/core/supabase-config.js`

```js
window.TIENDA_APERTURA = {
    activa: true,          // true = antes de abrir · false = tienda abierta
    fecha: '2026-12-15',   // alimenta la cuenta atrás del aviso
};
```

Atajo recomendado (cambia el valor **y** sube el `?v=` en todos los HTML para que
los navegadores no sigan usando la copia vieja):

```bash
node scripts/tienda-apertura.mjs estado   # ver el modo actual
node scripts/tienda-apertura.mjs abrir    # activa: false  → tienda vendiendo
node scripts/tienda-apertura.mjs cerrar   # activa: true   → antes de abrir
```

> Si cambias `activa` a mano, **sube también el `?v=` de `supabase-config.js`** en
> los `.html`. Si no, quien ya visitó la tienda puede seguir viendo el modo anterior.

---

## 1 · Qué cambia al abrir

| Elemento | Antes de abrir (`activa: true`) | Al abrir (`activa: false`) |
|---|---|---|
| Aviso verde de la portada | GRAN APERTURA + cuenta atrás + lazo + Instagram/Facebook | “Regístrate y obtén 10% de descuento” + botón **Crear mi cuenta** |
| Cuenta atrás (“Faltan N días”) | Visible, se recalcula sola cada día | Desaparece |
| Lazo del aviso | Visible (esquina superior derecha / inferior izquierda en móvil) | Desaparece |
| Botones de redes del aviso | **Seguir en Instagram** y **Seguir en Facebook** | Desaparecen |
| Menú de cuenta del header | Oculto (solo queda el carrito) | **Iniciar sesión / Crear cuenta** |
| Botones de cuenta en carrito, producto, perfil y ayuda | Ocultos | Visibles |
| **Comprar ahora** y **Añadir al carrito** (ficha) | Ocultos | Visibles |
| **Agregar** en las tarjetas del catálogo | Oculto | Visible |
| **Finalizar compra** (carrito) | Oculto | Visible |
| **Pedir por WhatsApp** | Siempre visible | Siempre visible |
| Ruleta del sorteo | Solo participantes **aprobados** | Igual (el sorteo sigue hasta el 24) |

Regla técnica: lo que se oculta lleva `data-acceso-cuenta` (cuentas) o
`data-compra-online` (compras) y se esconde con la clase `apertura-cerrada` que
pone `supabase-config.js` en el `<html>`.

---

## 2 · Los mensajes ocultos (texto exacto)

### 2.1 Aviso verde de la portada

**Antes de abrir** (lo que se ve hoy):

- Etiqueta: `FALTAN 19 DÍAS` (cambia cada día).
- Título: `GRAN APERTURA`.
- Detalle: `Te esperamos el 15 de diciembre con el 10% de bienvenida y el sorteo de 3 pares de zapatos.`
- Botones: `Seguir en Instagram` · `Seguir en Facebook`.

**Al abrir** (mensaje que queda oculto hasta ese día):

- Etiqueta: `SOLO POR REGISTRARTE`.
- Título: `Regístrate y obtén 10% de descuento`.
- Detalle: `Tu descuento de bienvenida se aplica en tu primera compra de zapatos.`
- Botón: `Crear mi cuenta` (lleva a `/tienda/login`).

### 2.2 Menú de cuenta (header)

- **Antes:** solo el icono del carrito. El icono de cuenta no existe para el visitante.
- **Al abrir:** aparece el icono de cuenta con `Iniciar sesión` y `Crear cuenta`.

### 2.3 Botones de compra

- **Antes:** ocultos en las 29 tarjetas del catálogo, en la ficha de producto y en el carrito.
- **Al abrir:** aparecen `Agregar`, `Comprar ahora`, `Añadir al carrito` y `Finalizar compra`.
- **WhatsApp** (`Pedir por WhatsApp`) funciona siempre, incluso antes de abrir.

### 2.4 Mensajes que **no** cambian

- La sección del sorteo (“¡Tenemos premios para celebrar nuestra apertura!”, las dos
  fechas y “Cómo participar”).
- El texto de la ruleta y el contador de participantes.
- Los términos y condiciones, ayuda y quiénes somos.

---

## 3 · Checklist antes del día (T-7 y T-1)

- [ ] Ejecutar `supabase/ruleta-participantes.sql` en Supabase (una sola vez).
- [ ] Revisar catálogo: precios, colores, stock y fotos.
- [ ] Probar un pedido por WhatsApp de punta a punta (producto → carrito → WhatsApp).
- [ ] Probar el modo abierto en local:
      `node scripts/tienda-apertura.mjs abrir` → revisar → `… cerrar`.
- [ ] Publicar el post de inauguración en Instagram (el sorteo del 15 depende de los comentarios).
- [ ] Confirmar que `TIENDA_APERTURA.fecha` es `2026-12-15`.
- [ ] Dejar la tienda en modo **antes de abrir** la noche anterior.

---

## 4 · El día de la inauguración

1. **Abrir la tienda**

   ```bash
   node scripts/tienda-apertura.mjs abrir
   ```

2. **Revisar el cambio**

   ```bash
   git status
   git diff website-supabase/js/core/supabase-config.js
   ```

   Debe decir `activa: false` y los HTML con un `?v=` nuevo.

3. **Desplegar** (git push o el comando de publicación que uses).

4. **Verificar en una ventana de incógnito**
   - [ ] El aviso verde dice “Regístrate y obtén 10% de descuento”.
   - [ ] Ya no aparece la cuenta atrás ni el lazo.
   - [ ] El icono de cuenta del header abre “Iniciar sesión / Crear cuenta”.
   - [ ] En una tarjeta del catálogo se ve **Agregar**.
   - [ ] En la ficha se ven **Comprar ahora** y **Añadir al carrito**.
   - [ ] En el carrito se ve **Finalizar compra**.
   - [ ] **Pedir por WhatsApp** sigue funcionando.

5. **Si algo falla**

   ```bash
   node scripts/tienda-apertura.mjs cerrar
   ```

   Desplegar de nuevo y avisar. La tienda vuelve al estado anterior sin tocar nada más.

---

## 5 · Sorteo del 15 de diciembre (mismo día)

1. Panel → **Sorteo** (`/tienda/admin#sorteo`).
2. Aprobar solo las cuentas que **comenten la publicación de inauguración**.
3. Abrir la portada y comprobar que la ruleta muestra esos nombres y el total.
4. Anunciar en Instagram y girar la ruleta.
5. Guardar el **acta**: captura de la ruleta, nombres ganadores, hora y número de participantes.

> Si la ruleta aparece vacía: no hay aprobados o falta ejecutar el SQL del sorteo.
> Mientras el SQL no esté, la ruleta muestra a todos los clientes registrados.

**24 de diciembre:** sorteo de Instagram. Importar los comentarios con
`node scripts/importar-comentarios-instagram.mjs comentarios.json --publicacion=…`
y revisar que el bloque “Ruleta de Instagram” aparezca en la portada.

---

## 6 · Después de la inauguración

- Dejar `activa: false` de forma permanente (el aviso del 10% se queda).
- Cerrar el sorteo cuando termine el 24; la pestaña **Sorteo** puede quedar sin uso.
- Revisar pedidos, stock y cupones del primer día.

---

## 7 · Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| Sigue diciendo GRAN APERTURA | No se desplegó `supabase-config.js` o el navegador lo tiene en caché | Volver a ejecutar `abrir` (sube el `?v=`) y desplegar; recargar con `Ctrl + F5` |
| No aparecen los botones de compra | El `<html>` no tiene la clase `apertura-cerrada` (modo abierto) | Revisar `TIENDA_APERTURA.activa` |
| No deja crear cuenta | Sigue en modo antes de abrir | `node scripts/tienda-apertura.mjs abrir` |
| La ruleta está vacía | Sin aprobados o sin el SQL del sorteo | Panel → Sorteo / ejecutar `supabase/ruleta-participantes.sql` |
| El contador dice días de más o de menos | Zona horaria del dispositivo | Ajustar `TIENDA_APERTURA.fecha` (formato `AAAA-MM-DD`) |

---

## 8 · Archivos que intervienen

| Archivo | Para qué |
|---|---|
| `js/core/supabase-config.js` | Interruptor `TIENDA_APERTURA` y clase `apertura-cerrada` |
| `js/components/promos.js` | Aviso verde: textos, cuenta atrás, lazo y redes |
| `index.html` · `producto.html` · `carrito.html` · `perfil.html` · `ayuda.html` | Marcas `data-acceso-cuenta` / `data-compra-online` |
| `js/pages/tienda.js` | Botón “Agregar” de las tarjetas del catálogo |
| `css/base/estilos.css` · `css/base/estilos-home.css` | Reglas que ocultan los botones en modo antes de abrir |
| `scripts/tienda-apertura.mjs` | Abrir / cerrar la tienda y subir el `?v=` |
| `supabase/ruleta-participantes.sql` | Tabla y RPC del panel de sorteo |
