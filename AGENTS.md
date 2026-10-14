# AGENTS.md

Guía para agentes de IA (y personas) que trabajen en este repositorio. Describe el stack, los comandos y las convenciones reales del proyecto. **Sigue estas reglas al proponer cambios.**

---

## 1. Descripción del proyecto

ERP de gestión comercial y punto de venta orientado a comercio minorista. Módulos principales:

- **Ventas / POS**: ventas, proformas, facturación, impresión térmica, anulaciones, ventas a plazos.
- **Productos e inventario**: catálogo, categorías, impuestos, medidas, tallas, ubicaciones, variantes y Kardex (movimientos de inventario).
- **Compras y proveedores**.
- **Caja y finanzas**: arqueo de cajas, gastos, cuentas, transferencias y movimientos.
- **Clientes, usuarios, roles y permisos**.
- **Reportes, exportaciones (Excel) y respaldo**.

El idioma del dominio, la interfaz, los nombres de rutas, controladores y variables es **español**. Mantén esa convención.

---

## 2. Stack

| Capa | Tecnología |
|------|------------|
| Backend | PHP 8.2 · Laravel 12 |
| Frontend | Blade · Bootstrap 5 · jQuery · DataTables · Chart.js · Phosphor Icons |
| Navegación dinámica | Hotwired Turbo (turbo-frames) |
| Build | Vite 7 · npm |
| Base de datos | MariaDB / MySQL |
| PDF / Excel | barryvdh/laravel-dompdf · maatwebsite/excel |
| Imágenes | intervention/image (v2.7) |
| Dev | laravel/pint · laravel/pail · laravel/debugbar · PHPUnit 11 |

---

## 3. Comandos

```bash
# Instalación / setup completo
composer setup

# Servidor de desarrollo (server + queue + logs + vite en paralelo)
composer dev

# Solo servidor
php artisan serve

# Frontend
npm run dev      # Vite en watch
npm run build    # Build de producción

# Base de datos
php artisan migrate
php artisan db:seed

# Pruebas
composer test            # limpia config y corre la suite
php artisan test         # suite directa

# Formato de código
./vendor/bin/pint

# Auditoría de dependencias no usadas/declaradas
./vendor/bin/composer-require-checker
```

> En Windows usa `vendor\bin\pint` si `./vendor/bin/pint` no resuelve.

---

## 4. Arquitectura y convenciones

### 4.1 Autenticación por sesión (NO usar `Auth` de Laravel)

El login es **custom** y guarda el estado en sesión, no con el guard estándar:

- `session('usuario')` → datos del usuario autenticado (incluye `id_rol`).
- `session('permisos')` → array de nombres de permisos del usuario.

Al crear controladores/rutas protegidas, respeta este mecanismo. No introduzcas `auth()->user()` ni el middleware `auth` estándar sin justificarlo.

### 4.2 Autorización con `PermisoMiddleware`

Rutas y vistas se protegen con el alias `permiso:<nombre_permiso>`, que valida contra las tablas `rol_permiso` + `permisos`:

```php
Route::view('/productos', 'productos.Productos')
    ->middleware('permiso:vista_productos')
    ->name('productos');

Route::post('/productos/crear', [ProductoController::class, 'CrearProducto'])
    ->middleware('permiso:crear_productos');
```

Al añadir funcionalidad nueva **crea el permiso correspondiente** (nombre tipo `vista_x`, `crear_x`, `editar_x`, `actualizar_x`, `cambiar_estado_x`) y sigue el patrón de rutas existente.

### 4.3 Rutas (`routes/web.php`)

- Vistas de módulo: `Route::view('/ruta', 'carpeta.Vista')->middleware('permiso:...')->name('...')`.
- Endpoints API/JSON: `Route::get|post|put|delete` apuntando a métodos del controlador.
- Convención REST usada en el proyecto:
  - `GET  /recurso/mostrar` → listar
  - `POST /recurso/crear` → crear
  - `GET  /recurso/{id}/editar` → datos de edición
  - `PUT  /recurso/{id}/actualizar` → actualizar
  - `POST /recurso/cambiar-estado/{id}` → activar/desactivar
- Los archivos de rutas incluyen banners ASCII para separar módulos. **Mantén este estilo** al agregar secciones.
- Las secciones siguen un orden fijo: imports → login → vistas dinámicas → endpoints por módulo.

### 4.4 Controladores (`app/Http/Controllers`)

- Nombres y métodos en **español, PascalCase** (`CrearProducto`, `MostrarProductos`, `CambiarEstadoUsuario`).
- Métodos de acción (no usan el scaffolding resource de Laravel).
- Patrón típico de validación con `Validator::make` y mensajes en español:

```php
$validator = Validator::make($request->all(), [
    'nombre_producto' => 'required|max:150',
    'precio_venta'    => 'nullable|numeric|min:0',
], [
    'required' => 'El campo :attribute es obligatorio.',
    'numeric'  => 'El campo :attribute debe ser numérico.',
]);

if ($validator->fails()) {
    return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
}
```

- Los endpoints devuelven **JSON** con la forma `{ success: bool, ... }`; usa `422` para errores de validación.
- Envuelve la lógica en `try { ... } catch (\Throwable $e) { ... }` y registra/retorna el error de forma controlada.
- Para operaciones con múltiples tablas usa transacciones (`DB::transaction` / `DB::beginTransaction`).

### 4.5 Modelos (`app/Models`)

- Un modelo por tabla, nombre en **PascalCase singular** (`Producto`, `MovimientoCaja`).
- Se usa `DB::table(...)` de Query Builder con frecuencia; si editas un modelo existente, sigue el estilo ya presente en ese archivo antes de refactorizar.
- Tablas y columnas en español (`nombre_producto`, `id_categoria`, `estado_permiso`).

### 4.6 Vistas Blade (`resources/views`)

- Una **carpeta por módulo** (`productos/`, `cajas/`, `ventas/`, ...) con la vista principal del módulo en PascalCase (`Productos.blade.php`).
- El layout principal es `principal/principal.blade.php`; incluye sidebar y `<turbo-frame id="contenido-dinamico">`.
- Navegación con Turbo Frames: los enlaces del menú usan `data-turbo-frame="contenido-dinamico"`. Las vistas de módulo se cargan dentro de ese frame.
- Cada vista define un elemento `#titulo` con el encabezado del módulo (lo lee el JS).
- CSS por módulo vía `@vite([...])`; el layout carga `variables.css`, `app.css` y `principal/principal.css`.
- Fragmentos auxiliares (impresión, modales) van en la misma carpeta del módulo (p. ej. `cajas/ArqueoImpresion.blade.php`).

### 4.7 JavaScript (`resources/js`)

- **Un archivo por módulo** (`MostrarCajas.js`, `MostrarProductos.js`, ...) que exporta por defecto una función `init...()`.
- Registro central en `app.js` mediante el arreglo `modulos`, mapeando **selector raíz de la vista → import dinámico**:

```js
const modulos = [
    ['#tablaCajas', () => import('./MostrarCajas')],
    // ...
];
```

  El selector es un elemento único de la vista; el módulo solo se inicializa si existe. Al crear un módulo nuevo, **añade su entrada aquí**.
- Helpers globales disponibles (definidos en `FuncionesGlobales.js`, expuestos en `window`):
  - `moneda(valor, decimales = 2)`
  - `FlatPickr(elemento)`
  - `formatearFecha(fechaSQL)`
  - `mostrarToast(mensaje, tipo = 'success')`
- `jQuery`/`$` está disponible globalmente: se usa `$('#id')`, DataTables y AJAX de jQuery.
- Escapa HTML al inyectar datos del servidor en plantillas (usa el patrón `escapeHtml` ya presente).
- Evita `innerHTML` con datos sin sanitizar; prefiere `textContent` o el helper de escape.

### 4.8 CSS (`resources/css`)

- `variables.css` define variables globales; úsalo para colores/espaciados.
- CSS por módulo en `resources/css/<modulo>/`.
- Layout con Bootstrap 5; prefiere utilidades de Bootstrap antes de CSS propio.

---

## 5. Estilo de código

- **PHP**: sigue lo existente; el formateador del repo es **Laravel Pint**. Ejecuta `pint` antes de cerrar un cambio.
- **Nombres**: dominio en español; clases/métodos PascalCase; variables y columnas en `snake_case`.
- **Comentarios**: el proyecto usa banners ASCII (`/* ╔═══ ... ═══╗ */`) para seccionar archivos grandes. Repítelo al añadir bloques a archivos que ya lo usan.
- **JS**: módulos ES con `export default`; sin build adicional más allá de Vite.
- No mezcles estilos: si el archivo usa jQuery, no introduzcas fetch/Vue/React.

---

## 6. Reglas para agentes

**Hacer:**
- Replicar el patrón de módulo completo: ruta + permiso + método de controlador + vista Blade + `init...()` en `resources/js` + registro en `app.js` + CSS.
- Validar en el backend siempre; devolver `{ success: false, errors }` con `422`.
- Usar transacciones en operaciones que tocan varias tablas (ventas, movimientos, caja, inventario).
- Añadir el permiso correspondiente al crear funcionalidad nueva.
- Mantener textos, toasts y mensajes de validación en **español**.
- Probar con `php artisan test` y formatear con `pint`.

**No hacer:**
- No usar el `Auth` estándar de Laravel: el proyecto autentica por sesión (`session('usuario')`).
- No eliminar ni renombrar rutas, permisos o columnas existentes sin verificar sus usos.
- No comprometer `.env`, credenciales, claves, respaldos ni datos reales. La configuración local va en `.env` (base en `.env.example`).
- No reescribir archivos completos para cambios pequeños; haz ediciones puntuales.
- No cambiar el stack frontend (Bootstrap/jQuery/Turbo) por otro framework.

---

## 7. Seguridad y datos

- Mantén secretos y datos reales fuera del repositorio; usa `.env`.
- Verifica permisos, impuestos y formatos de impresión antes de usar en producción.
- Las imágenes subidas se guardan en `public/imagenes/...` (p. ej. `public/imagenes/productos`).
