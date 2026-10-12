# ERP de Gestión Comercial y Punto de Venta

Aplicación web para centralizar la operación diaria de comercios minoristas: ventas, inventario, compras, caja y administración financiera. Incluye un punto de venta con impresión de facturas y proformas, además de herramientas para consultar y gestionar la actividad del negocio.

## Funcionalidades

- **Ventas y POS:** registro de ventas, diferentes métodos de pago, proformas, impresión, anulaciones y ventas a plazos.
- **Productos e inventario:** catálogo, categorías, impuestos, medidas, ubicaciones, variantes de producto y movimientos de inventario (Kardex).
- **Compras y proveedores:** registro de compras, actualización de existencias e historial.
- **Caja y finanzas:** apertura y cierre de caja, gastos, cuentas, movimientos y transferencias.
- **Clientes y administración:** clientes, usuarios, roles y permisos.
- **Consultas y respaldos:** paneles e informes, exportación de datos y herramientas de respaldo y recuperación.

El sistema está orientado a la venta minorista de productos. Las obligaciones fiscales y los procesos específicos de cada país o sector deben verificarse antes de su puesta en marcha.

## Tecnologías

- **Backend:** PHP 8.2 y Laravel 12.
- **Interfaz:** Blade, Bootstrap 5, JavaScript, jQuery, DataTables y Chart.js.
- **Herramientas frontend:** Vite y npm.
- **Persistencia:** MariaDB/MySQL.
- **Documentos y exportaciones:** DomPDF y Laravel Excel.

## Requisitos

- PHP 8.2 o superior y Composer.
- Node.js y npm.
- MariaDB o MySQL.

## Desarrollo local

1. Instala las dependencias de PHP y JavaScript:

	```bash
	composer install
	npm install
	```

2. Crea el archivo `.env` a partir de `.env.example`, configura la conexión a la base de datos y genera la clave de la aplicación:

	```bash
	php artisan key:generate
	```

3. Ejecuta las migraciones y compila los recursos:

	```bash
	php artisan migrate
	npm run build
	```

4. Inicia el servidor local:

	```bash
	php artisan serve
	```

Para trabajar con Vite en desarrollo, ejecuta `npm run dev`. Para ejecutar las pruebas disponibles, usa `php artisan test`.

## Configuración y seguridad

Mantén las credenciales, claves, respaldos y datos reales fuera del repositorio. Configura los valores locales en `.env` y verifica permisos, impuestos y formatos de impresión antes de usar el sistema en un negocio.