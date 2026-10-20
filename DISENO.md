# Guía de diseño — Tienda (móvil)

Referencia: `muestra.png` (Sale / Product details / My cart).

## 1. Paleta

| Rol | HEX | Uso |
|---|---|---|
| Principal (fondo) | `#F5EEDE` | Fondo de pantalla, header, cards suaves |
| Secundario (texto/acento) | `#22252A` | Textos, títulos, botones primarios, iconos |
| Acento descuento | `#E6513F` | Badge de `-20%` / precios rebajados |
| Superficie | `#FFFFFF` | Cards, inputs, barra inferior |
| Texto secundario | `#6B6F76` | Descripciones, subtotales, labels |
| Borde | `#E3DCCB` | Separadores y bordes suaves |

## 2. Tokens CSS

```css
:root {
  --color-primary: #F5EEDE;
  --color-secondary: #22252A;
  --color-accent: #E6513F;
  --color-surface: #FFFFFF;
  --color-muted: #6B6F76;
  --color-border: #E3DCCB;

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 24px;
  --radius-pill: 999px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;

  --shadow-card: 0 4px 16px rgba(34, 37, 42, .08);
  --font-base: "Inter", system-ui, -apple-system, sans-serif;
}
```

## 3. Tipografía

- Fuente: **Inter** (o system-ui).
- Títulos: 600–700, tracking ligeramente negativo.
- Cuerpo/labels: 400–500, `#6B6F76` para secundario.
- Precios: 700, siempre `#22252A`; precio anterior tachado en `#6B6F76`.

## 4. Componentes

**Badges de descuento** — píldora o cuadrada, fondo `#E6513F`, texto blanco, 12px bold, esquina `--radius-sm`.

**Cards de producto** — fondo blanco, `--radius-md`, `--shadow-card`, imagen con `object-fit: cover` y relación 3:4, favorito (corazón) arriba a la derecha.

**Selector de color/talla** — círculos de 32px con borde `2px` del color; activo: borde `--color-secondary`. Tallas = píldoras, activa con fondo `--color-secondary` y texto `#F5EEDE`.

**Botones**
- Primario: fondo `--color-secondary`, texto `--color-primary`, `--radius-pill`, alto 52px, full width.
- Secundario: fondo transparente, borde `1px --color-secondary`, texto `--color-secondary`.

**Stepper de cantidad** — píldora con borde `--color-border`, iconos `−` / `+`, número centrado.

**Sticky footer (cart)** — fondo blanco, borde superior `--color-border`, `box-shadow` invertida, botón primario full width.

## 5. Reglas visuales

- Fondo general siempre `#F5EEDE`; el contenido flota en cards blancas.
- Contraste alto: no usar grises sobre `#F5EEDE` más claros que `#6B6F76`.
- Radio grande + mucho aire (16–24px) = look de la referencia.
- Iconos lineales (Phosphor / Feather), trazo 1.5–2px.
- Imágenes de producto: fondo neutro, sin sombras duras.
- Mobile first: 1–2 columnas en grid, targets táctiles ≥ 44px.
