# Chuletas de librerías

Referencia corta de las librerías de front-end **que este proyecto usa de verdad**.
Sirve para no consultar documentación completa ni el código fuente de una librería
solo para recordar una opción o una clase.

## Regla de uso

1. Lee **solo** el archivo de la librería que vas a tocar.
2. Antes de leerlo, busca el patrón ya usado en el repo (`grep` del selector o clase).
   **El código existente manda sobre cualquier ejemplo de aquí.**
3. Si algo no está en la chuleta, usa `grep` acotado en el repo o la sección concreta
   de la documentación oficial (nunca el sitio completo).
4. Si actualizas una librería, cambia la versión en un solo lugar:
   - **ERP**: `config/assets.php` → dos veces si aplica: `cdn` y `local` (`public/libs/...`).
   - **Tienda**: la etiqueta `<script>`/`<link>` del HTML + el `?v=` del archivo propio.

## Índice

| Chuleta | Librería | Versión |
|---|---|---|
| [bootstrap.md](bootstrap.md) | Bootstrap (CSS + bundle JS) | 5.3.3 |
| [jquery-datatables.md](jquery-datatables.md) | jQuery · DataTables · Buttons | 3.7.1 · 1.13.8 · 2.4.2 |
| [select2.md](select2.md) | Select2 | 4.1.0-rc.0 |
| [flatpickr.md](flatpickr.md) | Flatpickr + locale `es` | 4.6.13 |
| [chartjs.md](chartjs.md) | Chart.js + plugin datalabels | 4.5.1 · 2.0.0 |
| [splide.md](splide.md) | Splide | 4.1.4 |
| [turbo.md](turbo.md) | Hotwired Turbo | 7.3.0 |
| [supabase-js.md](supabase-js.md) | supabase-js (solo tienda) | v2 (`@2`) |
| [iconos.md](iconos.md) | Phosphor · Bootstrap Icons (subset) | 2.0.3 · local |

## Qué NO hacer

- No descargar ni indexar la documentación completa de estas librerías: pesa en disco,
  ensucia git y al leerla gasta más contexto que un `grep`.
- No añadir una librería nueva si ya hay una que cubre el caso (ver índice).
- No asumir sintaxis de otras versiones: DataTables 2.x y Bootstrap 4 **no** aplican aquí.
