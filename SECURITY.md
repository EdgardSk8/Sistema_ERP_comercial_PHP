# Política de Seguridad

Gracias por ayudar a mantener seguro este ERP de gestión comercial y punto de venta.

Este documento explica **cómo reportar una vulnerabilidad**, qué esperar de nuestra parte y qué
buenas prácticas de seguridad aplican al proyecto.

> ⚠️ **No abras un issue público** para reportar una vulnerabilidad. Usa siempre un canal privado
> (ver [Cómo reportar](#cómo-reportar)).

---

## 1. Alcance

Quedan dentro del alcance los componentes de este repositorio:

- **Backend** PHP 8.2 / Laravel 12 (`app/`, `routes/`, `config/`).
- **Autenticación y autorización** por sesión y por permisos de rol.
- **Frontend** Blade + JavaScript (`resources/views`, `resources/js`, `resources/css`).
- **Base de datos** MariaDB/MySQL (migraciones, seeders, consultas).
- **Carga de archivos** e imágenes (`public/imagenes/...`).
- **Exportaciones y respaldos** (Excel/PDF, módulo de respaldo).

Fuera del alcance:

- Dependencias de terceros (repórtalas a su proyecto original).
- Vulnerabilidades que requieran acceso físico al servidor o a la base de datos.
- Configuraciones incorrectas del entorno del cliente (servidor web, PHP, MySQL).
- Ataques de denegación de servicio (DoS/DDoS) y spam.

---

## 2. Versiones soportadas

Este proyecto se mantiene sobre la versión más reciente de la rama principal.

| Versión | Soportada |
| ------- | :-------: |
| Última (rama principal) | ✅ |
| Versiones anteriores | ❌ |

---

## 3. Cómo reportar

Envía un correo a **seguridad@TU-DOMINIO.com** (reemplaza por un contacto real) con el asunto
`[SEGURIDAD] <título breve>`.

Si el proyecto está alojado en GitHub, también puedes usar el reporte privado de vulnerabilidades:
**Security → Report a vulnerability** (Private Vulnerability Reporting).

No incluyas datos reales de clientes, credenciales ni respaldos en el reporte.

### Qué incluir

- **Descripción** del problema y del impacto potencial.
- **Pasos para reproducir** (lo más detallados posible).
- **Prueba de concepto** mínima, si aplica (capturas, petición HTTP, etc.).
- **Versión/commit** afectado y entorno (navegador, versión de PHP/MySQL).
- **Posible mitigación** o sugerencia de arreglo (opcional).
- **Forma de contacto** para dar seguimiento.

---

## 4. Tiempos de respuesta

| Etapa | Plazo objetivo |
| ----- | -------------- |
| Confirmación de recepción | 72 horas |
| Evaluación y clasificación inicial | 7 días |
| Corrección (según severidad) | Según criticidad, coordinada contigo |
| Divulgación pública | Tras publicar el arreglo |

Estos plazos son orientativos y pueden variar según la complejidad del caso.

---

## 5. Divulgación responsable

- Te pedimos **no hacer pública** la vulnerabilidad hasta que exista una corrección disponible.
- Coordinaremos contigo la fecha de divulgación.
- Daremos crédito al reportero en el aviso o en las notas del arreglo, si así lo desea.

---

## 6. Buenas prácticas de seguridad del proyecto

Aplican al desplegar y mantener la aplicación. Consulta también `AGENTS.md` y `README.md`.

### Secretos y datos

- **Nunca** subas `.env`, credenciales, claves, respaldos ni datos reales al repositorio.
  La configuración local va en `.env` (base en `.env.example`).
- Genera una **`APP_KEY`** única por instalación (`php artisan key:generate`) y mantenla secreta.
- En producción: **`APP_DEBUG=false`** y **`APP_ENV=production`** (evita filtrar trazas y rutas).
- Protege y restringe el acceso a los **respaldos** y a los archivos exportados.

### Autenticación y autorización

- La autenticación es **por sesión** (`session('usuario')`, `session('permisos')`), no el guard
  estándar de Laravel. Mantén ese mecanismo.
- **Valida siempre los permisos en el backend** con el middleware `permiso:<nombre_permiso>`;
  ocultar botones en la vista no es suficiente.
- No elimines ni renombres permisos o rutas sin verificar sus usos.

### Entrada y salida

- **Valida y sanitiza** toda entrada del usuario en el servidor (`Validator`), con respuestas
  `{ success: false, errors }` y código `422`.
- Usa **consultas parametrizadas** (Query Builder / Eloquent); evita concatenar SQL con datos
  del usuario.
- Escapa el HTML al inyectar datos del servidor en plantillas (helper `escapeHtml`); evita
  `innerHTML` con datos sin sanitizar.
- Mantén la protección **CSRF** activa en formularios y peticiones AJAX (`_token`).

### Archivos y sesión

- Valida **tipo MIME, extensión y tamaño** en las imágenes subidas (`public/imagenes/...`).
- Sirve la aplicación sobre **HTTPS** y usa cookies de sesión `Secure` y `HttpOnly`.
- Revisa la configuración de sesión en `.env` (`SESSION_DRIVER`, `SESSION_LIFETIME`,
  `SESSION_SECURE_COOKIE`, `SESSION_ENCRYPT` según el entorno).

### Dependencias

- Mantén actualizadas las dependencias de Composer y npm.
- Ejecuta `./vendor/bin/composer-require-checker` para detectar dependencias no declaradas o no usadas.

---

## 7. Agradecimiento

Gracias por reportar de forma responsable y ayudar a proteger los datos del negocio y de sus
clientes.
