# Tamaños pequeños y minimalistas

Guía de dimensiones para interfaces compactas del ERP y la tienda. Solo medidas: padding, margin, gap, alturas, radios, tipografía y scroll fino. La paleta de colores queda fuera y se define aparte con los tokens del tema.

## 1. Escala de espacio

Familia compacta del panel (`website-supabase/css/pages/admin.css`):

| Token | Valor | Uso |
|---|---|---|
| `--admin-esp-1` | 2px | Separaciones internas mínimas |
| `--admin-esp-2` | 4px | Etiqueta → control, ajustes micro |
| `--admin-esp-3` | 6px | Gap entre controles de una fila |
| `--admin-esp-4` | 8px | Padding de controles y bloques chicos |
| `--admin-esp-5` | 10px | Padding de chips y píldoras |
| `--admin-esp-6` | 12px | Padding de página en móvil |
| `--admin-esp-7` | 16px | Padding de página en escritorio |
| `--admin-esp-8` | 24px | Separación entre secciones grandes |

Escala genérica reutilizable: `4 · 8 · 12 · 16 · 24px`.

Reglas:

- Usar `gap` para el ritmo interno y `margin` solo para separar bloques.
- Múltiplos de 2px en componentes densos; de 4/8px en el resto.
- Reiniciar márgenes de títulos y párrafos (`margin: 0`) y dejar que el contenedor decida el espacio.
- No acumular márgenes entre componentes anidados.

## 2. Tipografía

| Tamaño | rem | Uso |
|---|---|---|
| 10px | `.625rem` | Etiquetas micro, badges, contadores |
| 11px | `.6875rem` | Metadatos, pills y filtros secundarios |
| 11.5px | `.72rem` | Resultados y textos de apoyo |
| 12px | `.75rem` | Buscadores y selectores compactos en escritorio |
| 13px | `.8125rem` | Cuerpo denso |
| 14px | `.875rem` | Cuerpo base |
| 16px | `1rem` | Inputs en móvil (evita el zoom de iOS) y cuerpo de lectura |
| 18px | `1.125rem` | Título de tarjeta |
| 20px | `1.25rem` | Título de vista |
| 22px | `1.35rem` | Totales destacados |

Alturas de línea: `1.2` para títulos, `1.45` para párrafos, `1.5` para cuerpo.

No usar texto visible menor a 10px. En móvil, los campos de escritura no bajan de 16px.

## 3. Alturas de control y áreas táctiles

| Elemento | Alto |
|---|---|
| Control normal (buscador, filtros) | 36px |
| Input/select interno | 34px |
| Chip o píldora | 30–32px |
| Botón de icono | 32px |
| Botón de ayuda | 38px |
| Botón de acción dentro de tarjeta | 32px |
| Botón principal / acción táctil | 44px |
| Navegación inferior | 56px |

Mantener la misma altura entre input, select y botón de una misma fila. No mezclar variantes normal y compacta en la misma fila. El área táctil mínima es 44 × 44px aunque el glifo sea menor.

## 4. Radios y bordes

| Elemento | Radio |
|---|---|
| Control compacto | 9–12px |
| Control genérico | 6px |
| Chip, píldora, badge | 999px |
| Tarjeta | 14px |
| Botón de icono | 9px |
| Panel, hoja inferior, modal, tarjeta de login | 18px |
| Diálogo de confirmación | 16px |
| Botón principal del login | 999px |

- Bordes: `1px`.
- Separadores: `1px`.
- Anillo de foco: contorno de `2px` con `outline-offset: 2px`.
- No cambiar el tamaño del control al enfocar, deshabilitar o mostrar error.

## 5. Padding y margin por componente

| Componente | Medidas |
|---|---|
| Página (`admin-main`) | Padding 12px móvil / 16px escritorio; 8px al pie; ancho máximo 920px |
| Cabecera de vista | Gap 10px; margen inferior 10px; título con márgenes verticales de 2px |
| Buscador | Alto 36px; input 34px; padding lateral 8px; input con padding lateral 6px; margen inferior 6px |
| Buscador (listas) | Ancho completo; texto 12px en escritorio y 16px en móvil; alto 36px |
| Buscador dentro de filtros | Sin margen inferior; escritorio `flex: 1 1 220px`; móvil 100% del ancho |
| Fechas del cierre | Panel en 2 columnas con gap 6px y padding 8px; inputs de 36px, radio 10px y texto 12px en escritorio / 16px en móvil; flatpickr con formato "19 de noviembre del 2026"; en móvil cada fecha ocupa su propia fila |
| Filtro de día / fecha | Alto 36px; padding lateral 8px; gap 6px; input/select de 34px; ancho según contenido con `max-width: 100%` |
| Fila de filtros | Gap 6px; margen inferior 6px; en móvil el buscador ocupa la primera fila y los dos selectores la segunda |
| Chips | Alto 32px; padding lateral 10px; gap 6px; margen inferior 10px |
| Lista | Gap 8px (compacta) a 11px (base) |
| Tarjeta | Padding 8px × 10px; radio 14px; filas con gap 6–8px |
| Tarjeta de pedido | Padding 8px × 10px; acciones en columna; separador con 6px arriba |
| Acciones de tarjeta | Botones 32px; gap 6px; margen superior 8px |
| Promociones / cupones / personal | Media 44px; título 13.4px; precio 13.8px; switch 34 × 20px; botones de icono 32px |
| Resumen | 3 columnas con gap 8px; ítem con padding 8px × 10px |
| Formulario | Gap 10px; filas con 8px; etiqueta → control 4px |
| Formularios (hoja) | Inputs y selects de 36px; textarea 64px; etiquetas 10.5px; check 32px; botones 38px |
| Fechas de promoción | Flatpickr con formato "19 de noviembre del 2026"; inputs de 36px con texto de 12px en escritorio y 16px en móvil; en móvil cada fecha ocupa su propia fila |
| Cálculo de promoción | Bloque con padding 6 × 8px, radio 10px y texto de 10.5px |
| Hoja inferior | Radio 18px; botón de cierre 32px; cabecera 12px × 16px × 10px; contenido 12px × 16px × 16px |
| Diálogo | Radio 16px; caja 16px; título 15px; párrafo 12–16px abajo; acciones con gap 8px; botones 38px |
| Navegación inferior | Alto 56px; icono 18px; etiqueta 10–11px |
| Botón de autoaceptar | Alto 34px; padding lateral 10px; gap 6px; contador interno con min-width 22px y padding 1px × 4px |
| Login | Ancho máximo 360px; padding 16px; radio 18px; logo 32px; campos de 36px; inputs de 34px; botón de 44px tipo píldora; nota y enlace con 10–12px de separación |

## 6. Scroll fino (thin)

Contenedor con desplazamiento vertical u horizontal fino:

```css
.scroll-fino {
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;              /* Firefox */
}

.scroll-fino::-webkit-scrollbar {
    width: 4px;                         /* vertical */
    height: 4px;                        /* horizontal */
}

.scroll-fino::-webkit-scrollbar-track {
    background: transparent;
}

.scroll-fino::-webkit-scrollbar-thumb {
    border-radius: 999px;
}
```

- Barra visible: 4px; no superar 6px en interfaces compactas.
- Track transparente; el color del thumb lo aporta el tema.
- `overscroll-behavior: contain` para no encadenar el scroll con la página.
- Carruseles de chips, categorías y miniaturas: ocultar la barra:

```css
.scroll-oculto {
    overflow-x: auto;
    scrollbar-width: none;
}

.scroll-oculto::-webkit-scrollbar {
    display: none;
}
```

- Listas largas dentro de modales o cortinas: `max-height: 40vh` y scroll fino.

## 7. Breakpoints

| Ancho | Ajuste |
|---|---|
| ≤ 340px | Etiquetas de navegación y paddings mínimos |
| ≤ 360px | Navegación con texto reducido |
| ≤ 380px | Ajustes de badges y cabeceras |
| ≤ 575.98px | Móvil: buscador a 100%, selectores debajo, una columna |
| ≥ 576px | Escritorio/tablet: textos de filtros compactos (12px) y fila única |
| ≥ 640px | Filas de dos columnas |
| ≥ 900px | Escritorio: padding de página 16px, contenido hasta 920px, navegación de 56px |

- Evitar mínimos de ancho que provoquen scroll horizontal.
- En móvil, las barras de filtros envuelven y los controles ocupan el ancho disponible.
- En escritorio, limitar anchos solo en barras de filtros; no fijar ancho rígido a todos los inputs.

## 8. Checklist rápido

- [ ] Espaciados tomados de la escala (2/4/6/8/10/12/16/24px).
- [ ] `gap` para el ritmo interno; `margin` solo exterior.
- [ ] Alturas iguales entre input, select y botón de la misma fila.
- [ ] Controles compactos de 30–32px solo para filtros secundarios.
- [ ] Áreas táctiles de al menos 44px en acciones principales.
- [ ] Buscador a 100% en móvil y selectores en la fila siguiente.
- [ ] Texto de buscador a 12px en escritorio y 16px en móvil.
- [ ] Scroll de 4px con track transparente; sin barras en carruseles.
- [ ] Radios consistentes: 9–12px controles, 14px tarjetas, 18px paneles.
- [ ] Sin textos visibles menores a 10px.
