# Guía de diseño — Tienda (móvil)

Referencia: `muestra.png` (Sale / Product details / My cart).

## 1. Paleta

| Rol | HEX | Uso |
|---|---|---|
| Principal (fondo) | `#F5EEDE` | Fondo de pantalla, header, cards suaves |
| Principal claro | `#F9F3E6` | Fondos de tabs, superficies suaves |
| Principal medio | `#EFE6D4` | Hover cálido, separadores |
| Principal hondo | `#E2D5B9` | Bordes cálidos y scrollbar |
| Secundario (texto/acento) | `#22252A` | Textos, títulos, botones primarios, iconos |
| Acento descuento | `#E6513F` | Badge de `-20%` / precios rebajados |
| Superficie | `#FFFFFF` | Cards, inputs, barra inferior |
| Complementario | `#DEE5F5` | Acentos fríos puntuales |
| Texto secundario | `#5A5F67` | Descripciones, subtotales, labels (contraste AA) |
| Borde | `rgba(34, 37, 42, .09)` | Separadores y bordes suaves |

## 2. Tokens CSS

```css
:root {
  --primario: #F5EEDE;
  --primario-claro: #F9F3E6;
  --primario-medio: #EFE6D4;
  --primario-hondo: #E2D5B9;
  --secundario: #22252A;
  --acento: #E6513F;
  --superficie: #FFFFFF;
  --complementario: #DEE5F5;

  --texto-suave: rgba(34, 37, 42, .58);
  --borde: rgba(34, 37, 42, .09);
  --sombra-suave: 0 10px 24px rgba(34, 37, 42, .05);
  --sombra-media: 0 18px 38px rgba(34, 37, 42, .10);

  --r-sm: 8px;
  --r-md: 14px;
  --r-lg: 20px;
  --r-xl: 28px;
  --r-pill: 999px;

  --e-1: 4px;
  --e-2: 8px;
  --e-3: 12px;
  --e-4: 16px;
  --e-5: 24px;
  --e-6: 32px;

  --fuente: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --fuente-titulo: "Playfair Display", Georgia, serif;
  --alto-header: 60px;
}
```

Los tokens viven en `website/css/estilos.css`. No introducir valores sueltos: usar estos nombres.

## 3. Tipografía

- Cuerpo e interfaz: **Inter** (`--fuente`).
- Títulos y nombres de marca: **Playfair Display** 600 (`--fuente-titulo`), tracking ligeramente negativo.
- Cuerpo/labels: 400–500; secundario `#5A5F67` (equivalente AA del gris de apoyo).
- Precios: 700, siempre `#22252A`; precio anterior tachado en `#5A5F67`.

## 4. Componentes

**Badges de descuento** — píldora o cuadrada, fondo `#E6513F`, texto blanco, 12px bold, esquina `--r-sm`.

**Cards de producto** — fondo blanco, `--r-md`, `--sombra-suave`, imagen con `object-fit: cover` y relación 3:4, favorito (corazón) arriba a la derecha.

**Selector de color/talla** — círculos de 32px con borde `2px` del color; activo: borde `--secundario`. Tallas = píldoras, activa con fondo `--secundario` y texto `#F5EEDE`.

**Botones**
- Primario: fondo `--secundario`, texto `--primario`, `--r-pill`, alto 42px, full width.
- Secundario: fondo transparente, borde `1px --secundario`, texto `--secundario`.

**Stepper de cantidad** — píldora con borde `--borde`, iconos `−` / `+`, número centrado.

**Acceso (login / registro)** — card blanca centrada (`--r-xl`), tabs tipo píldora sobre `--primario-claro`, campos con foco `--acento`, botón primario full width y separador "o continúa con" seguido del botón de Google (fondo blanco, borde `--borde`, icono `#DB4437`). El cambio de panel anima ancho en PC y altura + fade en móvil (0.5s); targets ≥44px y foco visible de 2px. Texto secundario local `#5A5F67` y enlace "Volver" `#B5382A` para mantener AA.

**Sticky footer (cart)** — fondo blanco, borde superior `--borde`, `box-shadow` invertida, botón primario full width.

## 5. Reglas visuales

- Fondo general siempre `#F5EEDE`; el contenido flota en cards blancas.
- Contraste alto: no usar grises sobre `#F5EEDE` más claros que `#5A5F67`.
- Radio grande + mucho aire (16–24px) = look de la referencia.
- Iconos lineales (Phosphor / Feather), trazo 1.5–2px.
- Imágenes de producto: fondo neutro, sin sombras duras.
- Mobile first: 1–2 columnas en grid, targets táctiles ≥ 44px.
