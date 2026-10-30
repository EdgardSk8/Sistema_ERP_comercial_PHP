-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Tellez Store NIC — Esquema PostgreSQL / Supabase                        ║
-- ║  Base: tellez_store_nic (MariaDB 10.4) + migraciones Laravel 12          ║
-- ║  Uso: ejecutar completo en Supabase → SQL Editor                         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- Notas de conversión:
--   increments() / id()        → serial / bigserial
--   unsignedInteger/BigInteger → integer / bigint (Postgres no tiene unsigned)
--   enum([...])                → varchar + CHECK (lo mismo que hace Laravel en pg)
--   json                        → jsonb
--   dateTime()->useCurrent()    → timestamp(0) DEFAULT CURRENT_TIMESTAMP
--   timestamps()                → created_at / updated_at
--   fullText()                  → índice GIN con to_tsvector('spanish', ...)

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

BEGIN;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  1. SEGURIDAD: ROLES / PERMISOS / USUARIOS                               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE roles (
    id_rol                 serial PRIMARY KEY,
    nombre_rol             varchar(50)  NOT NULL UNIQUE,
    descripcion_rol        varchar(150) NULL,
    estado_rol             boolean      NOT NULL DEFAULT true,
    fecha_creacion_rol     timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permisos (
    id_permiso             serial PRIMARY KEY,
    nombre_permiso         varchar(100) NOT NULL UNIQUE,
    descripcion_permiso    varchar(150) NULL,
    modulo_permiso         varchar(50)  NOT NULL,
    estado_permiso         boolean      NOT NULL DEFAULT true,
    fecha_creacion_permiso timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id_usuario                serial PRIMARY KEY,
    nombre_completo_usuario   varchar(150) NOT NULL,
    cedula_identidad_usuario  varchar(16)  NOT NULL UNIQUE,
    nombre_usuario            varchar(50)  NOT NULL UNIQUE,
    password_hash_usuario     varchar(255) NOT NULL,
    id_rol_usuario            integer      NOT NULL,
    estado_usuario            boolean      NOT NULL DEFAULT true,
    fecha_creacion_usuario    timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuarios_id_rol_usuario_foreign
        FOREIGN KEY (id_rol_usuario) REFERENCES roles (id_rol) ON DELETE CASCADE
);

CREATE TABLE rol_permiso (
    id_rol_permiso                    serial PRIMARY KEY,
    id_rol                            integer      NOT NULL,
    id_permiso                        integer      NOT NULL,
    fecha_asignacion_rol_permiso      timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT rol_permiso_id_rol_id_permiso_unique UNIQUE (id_rol, id_permiso),
    CONSTRAINT rol_permiso_id_rol_foreign
        FOREIGN KEY (id_rol) REFERENCES roles (id_rol) ON DELETE CASCADE,
    CONSTRAINT rol_permiso_id_permiso_foreign
        FOREIGN KEY (id_permiso) REFERENCES permisos (id_permiso) ON DELETE CASCADE
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  2. CATÁLOGOS BASE                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE categoria (
    id_categoria              serial PRIMARY KEY,
    nombre_categoria          varchar(100) NOT NULL UNIQUE,
    descripcion_categoria     varchar(150) NULL,
    estado_categoria          boolean      NOT NULL DEFAULT true,
    fecha_creacion_categoria  timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE impuestos (
    id_impuesto               serial PRIMARY KEY,
    nombre_impuesto           varchar(100)  NOT NULL UNIQUE,
    porcentaje_impuesto       numeric(5,2)  NOT NULL,
    estado_impuesto           boolean       NOT NULL DEFAULT true,
    fecha_creacion_impuesto   timestamp(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE metodos_pago (
    id_metodo_pago              serial PRIMARY KEY,
    nombre_metodo_pago          varchar(100) NOT NULL UNIQUE,
    descripcion_metodo_pago     varchar(150) NULL,
    estado_metodo_pago          boolean      NOT NULL DEFAULT true
);

CREATE TABLE tipo_gasto (
    id_tipo_gasto               serial PRIMARY KEY,
    nombre_tipo_gasto           varchar(100) NOT NULL UNIQUE,
    descripcion_tipo_gasto      varchar(150) NULL,
    estado_tipo_gasto           boolean      NOT NULL DEFAULT true
);

CREATE TABLE ubicaciones (
    id_ubicacion                serial PRIMARY KEY,
    nombre_ubicacion            varchar(100) NOT NULL,
    descripcion_ubicacion       varchar(150) NULL,
    estado_ubicacion            boolean      NOT NULL DEFAULT true
);

CREATE TABLE tipos_medidas (
    id_tipo_medida               bigserial PRIMARY KEY,
    nombre_tipo_medida           varchar(100) NOT NULL,
    descripcion_tipo_medida      varchar(255) NULL,
    estado_tipo_medida           boolean      NOT NULL DEFAULT true,
    fecha_creacion_tipo_medida   timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medidas (
    id_medida                 bigserial PRIMARY KEY,
    id_tipo_medida            bigint       NOT NULL,
    nombre_medida             varchar(100) NOT NULL,
    abreviatura_medida        varchar(20)  NOT NULL,
    orden_medida              integer      NOT NULL DEFAULT 0,
    estado_medida             boolean      NOT NULL DEFAULT true,
    fecha_creacion_medida     timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT medidas_id_tipo_medida_foreign
        FOREIGN KEY (id_tipo_medida) REFERENCES tipos_medidas (id_tipo_medida)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE tipos_factura (
    id_tipo_factura               serial PRIMARY KEY,
    nombre_tipo_factura           varchar(50)  NOT NULL UNIQUE,
    descripcion_tipo_factura      varchar(150) NULL,
    estado                        boolean      NOT NULL DEFAULT true,
    created_at                    timestamp(0) NULL,
    updated_at                    timestamp(0) NULL
);

CREATE TABLE credenciales (
    id                  bigserial PRIMARY KEY,
    nombre_empresa      varchar(150) NOT NULL,
    ruc_empresa         varchar(20)  NULL,
    direccion_empresa   varchar(200) NULL,
    telefono_empresa    varchar(20)  NULL,
    correo_empresa      varchar(100) NULL,
    logo_empresa        text         NULL,
    tipo_cambio         numeric(10,2) NULL,
    created_at          timestamp(0) NULL,
    updated_at          timestamp(0) NULL
);

CREATE TABLE cuentas (
    id_cuenta           serial PRIMARY KEY,
    nombre_cuenta       varchar(100) NOT NULL,
    tipo_cuenta         varchar(50)  NULL,
    descripcion         text         NULL,
    saldo_actual        numeric(10,2) NOT NULL DEFAULT 0,
    estado              boolean       NOT NULL DEFAULT true,
    created_at          timestamp(0) NULL,
    updated_at          timestamp(0) NULL
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  3. TERCEROS: PROVEEDORES / CLIENTES                                     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE proveedores (
    id_proveedor               serial PRIMARY KEY,
    nombre_proveedor           varchar(150) NOT NULL,
    ruc_proveedor              varchar(15)  NULL UNIQUE,
    telefono_proveedor         varchar(20)  NULL,
    direccion_proveedor        varchar(200) NULL,
    correo_proveedor           varchar(100) NULL,
    estado_proveedor           boolean      NOT NULL DEFAULT true,
    fecha_creacion_proveedor   timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clientes (
    id_cliente                  serial PRIMARY KEY,
    nombre_cliente              varchar(150) NOT NULL,
    cedula_cliente              varchar(16)  NULL UNIQUE,
    ruc_cliente                 varchar(20)  NULL UNIQUE,
    telefono_cliente            varchar(20)  NULL,
    fecha_nacimiento_cliente    date         NULL,
    direccion_cliente           varchar(200) NULL,
    correo_cliente              varchar(100) NULL,
    usuario_cliente             varchar(60)  NULL UNIQUE,
    password_hash_cliente       varchar(255) NULL,
    descuento_tipo_cliente      varchar(20)  NULL,
    descuento_valor_cliente     numeric(10,2) NOT NULL DEFAULT 0,
    estado_cliente              boolean      NOT NULL DEFAULT true,
    fecha_creacion_cliente      timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cliente_direcciones (
    id_direccion_cliente             serial PRIMARY KEY,
    id_cliente                       integer      NOT NULL,
    nombre_direccion                 varchar(80)  NOT NULL,
    ubicacion_maps                   varchar(500) NULL,
    referencia_direccion             text         NULL,
    direccion_manual                 text         NULL,
    predeterminada_direccion         boolean      NOT NULL DEFAULT false,
    estado_direccion                 boolean      NOT NULL DEFAULT true,
    fecha_creacion_direccion         timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cliente_direcciones_id_cliente_foreign
        FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente) ON DELETE CASCADE
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  4. INVENTARIO: PRODUCTOS / VARIANTES / TALLAS                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE productos (
    id_producto               serial PRIMARY KEY,
    nombre_producto           varchar(150)  NOT NULL,
    descripcion_producto      text          NULL,
    id_categoria              integer       NOT NULL,
    id_impuesto               integer       NOT NULL,
    id_ubicacion              integer       NULL,
    id_medida                 bigint        NULL,
    imagen_producto           varchar(255)  NULL,
    precio_compra             numeric(10,2) NOT NULL,
    precio_venta              numeric(12,6) NOT NULL,
    stock_actual              integer       NOT NULL DEFAULT 0,
    estado_producto           boolean       NOT NULL DEFAULT true,
    fecha_creacion_producto   timestamp(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT productos_id_categoria_foreign
        FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria) ON DELETE CASCADE,
    CONSTRAINT productos_id_impuesto_foreign
        FOREIGN KEY (id_impuesto) REFERENCES impuestos (id_impuesto) ON DELETE CASCADE,
    CONSTRAINT productos_id_ubicacion_foreign
        FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones (id_ubicacion) ON DELETE SET NULL,
    CONSTRAINT productos_id_medida_foreign
        FOREIGN KEY (id_medida) REFERENCES medidas (id_medida)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE tallas (
    id_talla     serial PRIMARY KEY,
    talla        varchar(20) NOT NULL,
    estado_talla boolean     NOT NULL DEFAULT true
);

CREATE TABLE producto_variaciones (
    id_variacion        serial PRIMARY KEY,
    id_producto         integer     NOT NULL,
    color               varchar(50) NOT NULL,
    estado_variacion    boolean     NOT NULL DEFAULT true,
    CONSTRAINT producto_variaciones_id_producto_color_unique UNIQUE (id_producto, color),
    CONSTRAINT producto_variaciones_id_producto_foreign
        FOREIGN KEY (id_producto) REFERENCES productos (id_producto) ON DELETE CASCADE
);

CREATE TABLE variacion_tallas (
    id_variacion_talla  serial PRIMARY KEY,
    id_variacion        integer       NOT NULL,
    id_talla            integer       NOT NULL,
    stock               integer       NOT NULL DEFAULT 0,
    sku                 varchar(100)  NULL UNIQUE,
    precio_compra       numeric(10,2) NULL,
    precio_venta        numeric(12,6) NULL,
    CONSTRAINT variacion_tallas_id_variacion_id_talla_unique UNIQUE (id_variacion, id_talla),
    CONSTRAINT variacion_tallas_id_variacion_foreign
        FOREIGN KEY (id_variacion) REFERENCES producto_variaciones (id_variacion) ON DELETE CASCADE,
    CONSTRAINT variacion_tallas_id_talla_foreign
        FOREIGN KEY (id_talla) REFERENCES tallas (id_talla) ON DELETE CASCADE
);

CREATE TABLE variacion_imagenes (
    id_imagen      serial PRIMARY KEY,
    id_variacion   integer      NOT NULL,
    imagen         varchar(255) NOT NULL,
    orden          integer      NOT NULL DEFAULT 0,
    CONSTRAINT variacion_imagenes_id_variacion_foreign
        FOREIGN KEY (id_variacion) REFERENCES producto_variaciones (id_variacion) ON DELETE CASCADE
);

CREATE TABLE cliente_favoritos (
    id_favorito                 serial PRIMARY KEY,
    id_cliente                  integer      NOT NULL,
    id_producto                 integer      NOT NULL,
    fecha_creacion_favorito     timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cliente_favoritos_id_cliente_id_producto_unique UNIQUE (id_cliente, id_producto),
    CONSTRAINT cliente_favoritos_id_cliente_foreign
        FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente) ON DELETE CASCADE,
    CONSTRAINT cliente_favoritos_id_producto_foreign
        FOREIGN KEY (id_producto) REFERENCES productos (id_producto) ON DELETE CASCADE
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  5. CAJA                                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE cajas (
    id_caja          serial PRIMARY KEY,
    fecha_apertura   timestamp(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre     timestamp(0)  NULL,
    monto_inicial    numeric(10,2) NOT NULL,
    monto_final      numeric(10,2) NULL,
    monto_teorico    numeric(10,2) NULL,
    monto_real       numeric(10,2) NULL,
    diferencia       numeric(10,2) NULL,
    estado_caja      boolean       NOT NULL DEFAULT true,
    id_usuario       integer       NOT NULL,
    CONSTRAINT cajas_id_usuario_foreign
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  6. COMPRAS                                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE compras (
    id_compra               serial PRIMARY KEY,
    numero_factura_compra   varchar(50)   NULL,
    id_proveedor            integer       NULL,
    id_usuario              integer       NOT NULL,
    fecha_compra            timestamp(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal_compra         numeric(10,2) NOT NULL,
    descuento_compra        numeric(10,2) NULL,
    impuesto_compra         numeric(10,2) NULL,
    total_compra            numeric(10,2) NOT NULL,
    estado_compra           boolean       NOT NULL DEFAULT true,
    id_caja                 integer       NULL,
    id_cuenta               integer       NULL,
    id_metodo_pago          integer       NULL,
    id_tipo_factura         integer       NULL,
    CONSTRAINT compras_id_proveedor_foreign
        FOREIGN KEY (id_proveedor) REFERENCES proveedores (id_proveedor) ON DELETE SET NULL,
    CONSTRAINT compras_id_usuario_foreign
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE,
    CONSTRAINT compras_id_caja_foreign
        FOREIGN KEY (id_caja) REFERENCES cajas (id_caja) ON DELETE CASCADE,
    CONSTRAINT compras_id_cuenta_foreign
        FOREIGN KEY (id_cuenta) REFERENCES cuentas (id_cuenta) ON DELETE CASCADE,
    CONSTRAINT compras_id_metodo_pago_foreign
        FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago (id_metodo_pago) ON DELETE CASCADE,
    CONSTRAINT compras_id_tipo_factura_foreign
        FOREIGN KEY (id_tipo_factura) REFERENCES tipos_factura (id_tipo_factura) ON DELETE CASCADE
);

CREATE TABLE detalle_compras (
    id_detalle_compra           serial PRIMARY KEY,
    id_compra                   integer       NOT NULL,
    id_producto                 integer       NOT NULL,
    id_variacion_talla          integer       NULL,
    descripcion_variacion       varchar(120)  NULL,
    sku_variacion               varchar(100)  NULL,
    cantidad_compra             integer       NOT NULL,
    precio_unitario_compra      numeric(10,2) NOT NULL,
    subtotal_detalle_compra     numeric(10,2) NOT NULL,
    CONSTRAINT detalle_compras_id_compra_foreign
        FOREIGN KEY (id_compra) REFERENCES compras (id_compra) ON DELETE CASCADE,
    CONSTRAINT detalle_compras_id_producto_foreign
        FOREIGN KEY (id_producto) REFERENCES productos (id_producto) ON DELETE CASCADE,
    CONSTRAINT detalle_compras_id_variacion_talla_foreign
        FOREIGN KEY (id_variacion_talla) REFERENCES variacion_tallas (id_variacion_talla) ON DELETE SET NULL
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  7. VENTAS                                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE ventas (
    id_venta            serial PRIMARY KEY,
    numero_factura      varchar(50)   NOT NULL UNIQUE,
    fecha_venta         timestamp(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_cliente          integer       NULL,
    id_usuario          integer       NOT NULL,
    id_caja             integer       NULL,
    id_cuenta           integer       NULL,
    subtotal_venta      numeric(10,2) NOT NULL,
    impuesto_venta      numeric(10,2) NOT NULL,
    descuento_venta     numeric(10,2) NOT NULL DEFAULT 0,
    total_venta         numeric(10,2) NOT NULL,
    estado_venta        boolean       NOT NULL DEFAULT true,
    id_metodo_pago      integer       NULL,
    monto_recibido      numeric(10,2) NULL,
    vuelto              numeric(10,2) NULL,
    moneda              varchar(10)   NOT NULL DEFAULT 'NIO',
    CONSTRAINT ventas_id_cliente_foreign
        FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente) ON DELETE CASCADE,
    CONSTRAINT ventas_id_usuario_foreign
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE,
    CONSTRAINT ventas_id_caja_foreign
        FOREIGN KEY (id_caja) REFERENCES cajas (id_caja) ON DELETE CASCADE,
    CONSTRAINT ventas_id_cuenta_foreign
        FOREIGN KEY (id_cuenta) REFERENCES cuentas (id_cuenta) ON DELETE SET NULL,
    CONSTRAINT ventas_id_metodo_pago_foreign
        FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago (id_metodo_pago) ON DELETE CASCADE
);

CREATE TABLE detalle_ventas (
    id_detalle_venta            serial PRIMARY KEY,
    id_venta                    integer       NOT NULL,
    id_producto                 integer       NOT NULL,
    id_variacion_talla          integer       NULL,
    descripcion_variacion       varchar(120)  NULL,
    sku_variacion               varchar(100)  NULL,
    cantidad_venta              integer       NOT NULL,
    precio_unitario_venta       numeric(10,2) NOT NULL,
    costo_unitario_venta        numeric(14,6) NULL,
    consumos_lotes              jsonb         NULL,
    subtotal_detalle_venta      numeric(10,2) NOT NULL,
    porcentaje_impuesto         numeric(5,2)  NOT NULL,
    monto_impuesto              numeric(10,2) NOT NULL,
    CONSTRAINT detalle_ventas_id_venta_foreign
        FOREIGN KEY (id_venta) REFERENCES ventas (id_venta) ON DELETE CASCADE,
    CONSTRAINT detalle_ventas_id_producto_foreign
        FOREIGN KEY (id_producto) REFERENCES productos (id_producto) ON DELETE CASCADE,
    CONSTRAINT detalle_ventas_id_variacion_talla_foreign
        FOREIGN KEY (id_variacion_talla) REFERENCES variacion_tallas (id_variacion_talla) ON DELETE SET NULL
);

CREATE TABLE devoluciones (
    id_devolucion   bigserial PRIMARY KEY,
    id_venta        integer       NOT NULL,
    id_producto     integer       NOT NULL,
    id_usuario      integer       NOT NULL,
    cantidad        integer       NOT NULL,
    monto           numeric(10,2) NOT NULL,
    motivo          varchar(150)  NULL,
    fecha           timestamp(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT devoluciones_id_venta_foreign
        FOREIGN KEY (id_venta) REFERENCES ventas (id_venta)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT devoluciones_id_producto_foreign
        FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT devoluciones_id_usuario_foreign
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ── Crédito / planes de pago ──────────────────────────────────────────────

CREATE TABLE planes_pago (
    id_plan_pago     serial PRIMARY KEY,
    id_venta         integer      NOT NULL UNIQUE,
    id_usuario       integer      NOT NULL,
    fecha_creacion   timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT planes_pago_id_venta_foreign
        FOREIGN KEY (id_venta) REFERENCES ventas (id_venta) ON DELETE CASCADE,
    CONSTRAINT planes_pago_id_usuario_foreign
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
);

CREATE TABLE cuotas_venta (
    id_cuota            serial PRIMARY KEY,
    id_plan_pago        integer       NOT NULL,
    numero_cuota        smallint      NOT NULL,
    fecha_vencimiento   date          NOT NULL,
    monto_cuota         numeric(10,2) NOT NULL,
    CONSTRAINT cuotas_venta_id_plan_pago_numero_cuota_unique UNIQUE (id_plan_pago, numero_cuota),
    CONSTRAINT cuotas_venta_id_plan_pago_foreign
        FOREIGN KEY (id_plan_pago) REFERENCES planes_pago (id_plan_pago) ON DELETE CASCADE
);

CREATE TABLE pagos_venta (
    id_pago_venta    serial PRIMARY KEY,
    id_venta         integer       NOT NULL,
    id_metodo_pago   integer       NOT NULL,
    id_caja          integer       NULL,
    id_cuenta        integer       NULL,
    id_usuario       integer       NOT NULL,
    monto_pago       numeric(10,2) NOT NULL,
    fecha_pago       timestamp(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    referencia_pago  varchar(120)  NULL,
    CONSTRAINT pagos_venta_id_venta_foreign
        FOREIGN KEY (id_venta) REFERENCES ventas (id_venta) ON DELETE CASCADE,
    CONSTRAINT pagos_venta_id_metodo_pago_foreign
        FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago (id_metodo_pago) ON DELETE CASCADE,
    CONSTRAINT pagos_venta_id_caja_foreign
        FOREIGN KEY (id_caja) REFERENCES cajas (id_caja) ON DELETE CASCADE,
    CONSTRAINT pagos_venta_id_cuenta_foreign
        FOREIGN KEY (id_cuenta) REFERENCES cuentas (id_cuenta) ON DELETE CASCADE,
    CONSTRAINT pagos_venta_id_usuario_foreign
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
);

CREATE TABLE aplicaciones_pago_cuota (
    id_aplicacion_pago_cuota   serial PRIMARY KEY,
    id_pago_venta              integer       NOT NULL,
    id_cuota                   integer       NOT NULL,
    monto_aplicado             numeric(10,2) NOT NULL,
    CONSTRAINT aplicaciones_pago_cuota_pago_cuota_unique UNIQUE (id_pago_venta, id_cuota),
    CONSTRAINT aplicaciones_pago_cuota_id_pago_venta_foreign
        FOREIGN KEY (id_pago_venta) REFERENCES pagos_venta (id_pago_venta) ON DELETE CASCADE,
    CONSTRAINT aplicaciones_pago_cuota_id_cuota_foreign
        FOREIGN KEY (id_cuota) REFERENCES cuotas_venta (id_cuota) ON DELETE CASCADE
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  8. INVENTARIO: KARDEX Y LOTES (FIFO)                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE movimientos_inventario (
    id_movimiento_inventario   serial PRIMARY KEY,
    id_producto                integer       NOT NULL,
    id_variacion_talla         integer       NULL,
    tipo_movimiento            varchar(10)   NOT NULL,
    cantidad_movimiento        integer       NOT NULL,
    stock_resultante           integer       NOT NULL,
    motivo_movimiento          varchar(150)  NULL,
    id_referencia              integer       NULL,
    tipo_referencia            varchar(20)   NULL,
    precio_unitario            numeric(10,2) NULL,
    fecha_movimiento           timestamp(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario                 integer       NOT NULL,
    CONSTRAINT movimientos_inventario_tipo_movimiento_check
        CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    CONSTRAINT movimientos_inventario_tipo_referencia_check
        CHECK (tipo_referencia IS NULL OR tipo_referencia IN ('VENTA', 'COMPRA', 'DEVOLUCION', 'TRASLADO', 'AJUSTE')),
    CONSTRAINT movimientos_inventario_id_producto_foreign
        FOREIGN KEY (id_producto) REFERENCES productos (id_producto) ON DELETE CASCADE,
    CONSTRAINT movimientos_inventario_id_variacion_talla_foreign
        FOREIGN KEY (id_variacion_talla) REFERENCES variacion_tallas (id_variacion_talla) ON DELETE SET NULL,
    CONSTRAINT movimientos_inventario_id_usuario_foreign
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
);

CREATE TABLE lotes_inventario (
    id_lote               serial PRIMARY KEY,
    id_producto           integer       NOT NULL,
    id_variacion_talla    integer       NULL,
    id_detalle_compra     integer       NULL,
    cantidad_inicial      integer       NOT NULL,
    cantidad_disponible   integer       NOT NULL,
    costo_unitario        numeric(10,2) NOT NULL,
    fecha_ingreso         timestamp(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario            integer       NULL,
    CONSTRAINT lotes_inventario_id_producto_foreign
        FOREIGN KEY (id_producto) REFERENCES productos (id_producto) ON DELETE CASCADE,
    CONSTRAINT lotes_inventario_id_variacion_talla_foreign
        FOREIGN KEY (id_variacion_talla) REFERENCES variacion_tallas (id_variacion_talla) ON DELETE SET NULL,
    CONSTRAINT lotes_inventario_id_detalle_compra_foreign
        FOREIGN KEY (id_detalle_compra) REFERENCES detalle_compras (id_detalle_compra) ON DELETE SET NULL
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  9. MOVIMIENTOS DE DINERO                                               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE transferencias_caja_cuenta (
    id_transferencia    serial PRIMARY KEY,
    id_caja_origen      integer       NULL,
    id_cuenta_destino   integer       NOT NULL,
    monto               numeric(10,2) NOT NULL,
    concepto            varchar(150)  NOT NULL DEFAULT 'Transferencia caja a cuenta',
    id_usuario          integer       NOT NULL,
    fecha               timestamp(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transferencias_caja_cuenta_id_caja_origen_foreign
        FOREIGN KEY (id_caja_origen) REFERENCES cajas (id_caja) ON DELETE SET NULL,
    CONSTRAINT transferencias_caja_cuenta_id_cuenta_destino_foreign
        FOREIGN KEY (id_cuenta_destino) REFERENCES cuentas (id_cuenta) ON DELETE CASCADE,
    CONSTRAINT transferencias_caja_cuenta_id_usuario_foreign
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
);

CREATE TABLE movimientos_caja (
    id_movimiento_caja            serial PRIMARY KEY,
    id_caja                       integer       NOT NULL,
    tipo_movimiento_caja          varchar(10)   NOT NULL,
    concepto_movimiento_caja      varchar(150)  NOT NULL,
    monto_movimiento_caja         numeric(10,2) NOT NULL,
    fecha_movimiento_caja         timestamp(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario                    integer       NOT NULL,
    id_transferencia              integer       NULL,
    id_referencia                 integer       NULL,
    id_cuenta_destino             integer       NULL,
    id_pago_venta                 integer       NULL UNIQUE,
    CONSTRAINT movimientos_caja_tipo_movimiento_caja_check
        CHECK (tipo_movimiento_caja IN ('INGRESO', 'SALIDA')),
    CONSTRAINT movimientos_caja_id_caja_foreign
        FOREIGN KEY (id_caja) REFERENCES cajas (id_caja) ON DELETE CASCADE,
    CONSTRAINT movimientos_caja_id_usuario_foreign
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE,
    CONSTRAINT movimientos_caja_id_cuenta_destino_foreign
        FOREIGN KEY (id_cuenta_destino) REFERENCES cuentas (id_cuenta) ON DELETE CASCADE,
    CONSTRAINT movimientos_caja_id_transferencia_foreign
        FOREIGN KEY (id_transferencia) REFERENCES transferencias_caja_cuenta (id_transferencia) ON DELETE CASCADE,
    CONSTRAINT movimientos_caja_id_pago_venta_foreign
        FOREIGN KEY (id_pago_venta) REFERENCES pagos_venta (id_pago_venta) ON DELETE CASCADE
);

CREATE TABLE movimientos_cuentas (
    id_movimiento_cuenta   serial PRIMARY KEY,
    id_cuenta              integer       NOT NULL,
    tipo_movimiento        varchar(10)   NOT NULL,
    monto                  numeric(10,2) NOT NULL,
    descripcion            varchar(150)  NULL,
    fecha                  timestamp(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario             integer       NOT NULL,
    id_transferencia       integer       NULL,
    id_pago_venta          integer       NULL UNIQUE,
    CONSTRAINT movimientos_cuentas_tipo_movimiento_check
        CHECK (tipo_movimiento IN ('INGRESO', 'SALIDA')),
    CONSTRAINT movimientos_cuentas_id_cuenta_foreign
        FOREIGN KEY (id_cuenta) REFERENCES cuentas (id_cuenta) ON DELETE CASCADE,
    CONSTRAINT movimientos_cuentas_id_usuario_foreign
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE,
    CONSTRAINT movimientos_cuentas_id_transferencia_foreign
        FOREIGN KEY (id_transferencia) REFERENCES transferencias_caja_cuenta (id_transferencia) ON DELETE CASCADE,
    CONSTRAINT movimientos_cuentas_id_pago_venta_foreign
        FOREIGN KEY (id_pago_venta) REFERENCES pagos_venta (id_pago_venta) ON DELETE CASCADE
);

CREATE TABLE metodo_pago_cuenta (
    id_metodo_pago_cuenta   bigserial PRIMARY KEY,
    id_metodo_pago          integer      NOT NULL,
    id_cuenta               integer      NOT NULL,
    estado                  boolean      NOT NULL DEFAULT true,
    created_at              timestamp(0) NULL,
    updated_at              timestamp(0) NULL,
    CONSTRAINT metodo_pago_cuenta_id_metodo_pago_id_cuenta_unique UNIQUE (id_metodo_pago, id_cuenta),
    CONSTRAINT metodo_pago_cuenta_id_metodo_pago_foreign
        FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago (id_metodo_pago) ON DELETE CASCADE,
    CONSTRAINT metodo_pago_cuenta_id_cuenta_foreign
        FOREIGN KEY (id_cuenta) REFERENCES cuentas (id_cuenta) ON DELETE CASCADE
);

CREATE TABLE gastos (
    id_gasto           serial PRIMARY KEY,
    id_tipo_gasto      integer      NOT NULL,
    nombre_gasto       varchar(150) NOT NULL,
    descripcion_gasto  varchar(200) NULL,
    estado_gasto       boolean      NOT NULL DEFAULT true,
    fecha_inicio       date         NULL,
    fecha_pago         date         NULL,
    proximo_pago       date         NULL,
    estado_pago        varchar(20)  NOT NULL DEFAULT 'PENDIENTE',
    ultimo_pago        date         NULL,
    CONSTRAINT gastos_id_tipo_gasto_foreign
        FOREIGN KEY (id_tipo_gasto) REFERENCES tipo_gasto (id_tipo_gasto) ON DELETE CASCADE
);

CREATE TABLE movimientos_gastos (
    id_movimiento_gasto   serial PRIMARY KEY,
    id_gasto              integer       NOT NULL,
    monto                 numeric(10,2) NOT NULL,
    origen                varchar(10)   NOT NULL,
    id_caja               integer       NULL,
    id_cuenta             integer       NULL,
    fecha                 timestamp(0)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario            integer       NOT NULL,
    observacion           varchar(200)  NULL,
    CONSTRAINT movimientos_gastos_origen_check
        CHECK (origen IN ('CAJA', 'CUENTA')),
    CONSTRAINT movimientos_gastos_id_gasto_foreign
        FOREIGN KEY (id_gasto) REFERENCES gastos (id_gasto) ON DELETE CASCADE,
    CONSTRAINT movimientos_gastos_id_usuario_foreign
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE,
    CONSTRAINT movimientos_gastos_id_caja_foreign
        FOREIGN KEY (id_caja) REFERENCES cajas (id_caja) ON DELETE CASCADE,
    CONSTRAINT movimientos_gastos_id_cuenta_foreign
        FOREIGN KEY (id_cuenta) REFERENCES cuentas (id_cuenta) ON DELETE CASCADE
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 10. CONTROL DE MIGRACIONES (Laravel)                                     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE migrations (
    id         serial PRIMARY KEY,
    migration  varchar(255) NOT NULL,
    batch      integer      NOT NULL
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 11. ÍNDICES                                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Usuarios / roles
CREATE INDEX idx_usuarios_rol_estado ON usuarios (id_rol_usuario, estado_usuario);
CREATE INDEX idx_roles_estado ON roles (estado_rol);

-- Clientes / proveedores
CREATE INDEX idx_clientes_estado_nombre ON clientes (estado_cliente, nombre_cliente);
CREATE INDEX idx_proveedores_estado_nombre ON proveedores (estado_proveedor, nombre_proveedor);
CREATE INDEX idx_cliente_direccion_predeterminada
    ON cliente_direcciones (id_cliente, predeterminada_direccion);

-- Productos / variantes
CREATE INDEX idx_productos_estado_categoria ON productos (estado_producto, id_categoria);
CREATE INDEX idx_productos_estado_impuesto ON productos (estado_producto, id_impuesto);
CREATE INDEX idx_productos_stock ON productos (stock_actual);
CREATE INDEX idx_productos_nombre_busqueda
    ON productos USING gin (to_tsvector('spanish', nombre_producto));

-- Ventas
CREATE INDEX idx_ventas_fecha_estado ON ventas (fecha_venta, estado_venta);
CREATE INDEX idx_ventas_usuario_fecha ON ventas (id_usuario, fecha_venta);
CREATE INDEX idx_ventas_caja_fecha ON ventas (id_caja, fecha_venta);
CREATE INDEX idx_ventas_cliente_fecha ON ventas (id_cliente, fecha_venta);
CREATE INDEX idx_ventas_pago_fecha ON ventas (id_metodo_pago, fecha_venta);
CREATE INDEX idx_ventas_factura ON ventas (numero_factura);
CREATE INDEX idx_detalleventas_venta ON detalle_ventas (id_venta);
CREATE INDEX idx_detalleventas_producto ON detalle_ventas (id_producto);
CREATE INDEX idx_devoluciones_venta_producto ON devoluciones (id_venta, id_producto);

-- Cartera
CREATE INDEX idx_cuotas_vencimiento ON cuotas_venta (fecha_vencimiento);
CREATE INDEX idx_pagos_venta_fecha ON pagos_venta (id_venta, fecha_pago);
CREATE INDEX idx_pagos_fecha ON pagos_venta (fecha_pago);

-- Compras
CREATE INDEX idx_compras_fecha_estado ON compras (fecha_compra, estado_compra);
CREATE INDEX idx_compras_usuario_fecha ON compras (id_usuario, fecha_compra);
CREATE INDEX idx_compras_proveedor_fecha ON compras (id_proveedor, fecha_compra);
CREATE INDEX idx_compras_caja_fecha ON compras (id_caja, fecha_compra);
CREATE INDEX idx_compras_factura ON compras (numero_factura_compra);
CREATE INDEX idx_detallecompras_compra ON detalle_compras (id_compra);
CREATE INDEX idx_detallecompras_producto ON detalle_compras (id_producto);

-- Cajas
CREATE INDEX idx_cajas_estado ON cajas (estado_caja);
CREATE INDEX idx_cajas_usuario_estado ON cajas (id_usuario, estado_caja);
CREATE INDEX idx_movcaja_caja_fecha ON movimientos_caja (id_caja, fecha_movimiento_caja);
CREATE INDEX idx_movcaja_usuario_fecha ON movimientos_caja (id_usuario, fecha_movimiento_caja);
CREATE INDEX idx_movcaja_tipo ON movimientos_caja (tipo_movimiento_caja);

-- Kardex / lotes
CREATE INDEX idx_kardex_producto_fecha ON movimientos_inventario (id_producto, fecha_movimiento);
CREATE INDEX idx_kardex_tipo_producto ON movimientos_inventario (tipo_movimiento, id_producto);
CREATE INDEX idx_kardex_referencia ON movimientos_inventario (id_referencia, tipo_referencia);
CREATE INDEX idx_kardex_fecha ON movimientos_inventario (fecha_movimiento);
CREATE INDEX lotes_fifo_index ON lotes_inventario (id_producto, id_variacion_talla, fecha_ingreso);

-- Cuentas / movimientos
CREATE INDEX idx_cuentas_estado_nombre ON cuentas (estado, nombre_cuenta);
CREATE INDEX idx_movcuenta_cuenta_fecha ON movimientos_cuentas (id_cuenta, fecha);
CREATE INDEX idx_movcuenta_usuario_fecha ON movimientos_cuentas (id_usuario, fecha);
CREATE INDEX idx_transfer_caja_fecha ON transferencias_caja_cuenta (id_caja_origen, fecha);
CREATE INDEX idx_transfer_cuenta_fecha ON transferencias_caja_cuenta (id_cuenta_destino, fecha);

-- Gastos
CREATE INDEX idx_gastos_estado_fecha ON gastos (estado_pago, fecha_pago);
CREATE INDEX idx_gastos_tipo ON gastos (id_tipo_gasto);
CREATE INDEX idx_movgastos_gasto_fecha ON movimientos_gastos (id_gasto, fecha);
CREATE INDEX idx_movgastos_usuario_fecha ON movimientos_gastos (id_usuario, fecha);

COMMIT;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ 12. PERMISOS (SUPABASE)                                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- Modelo de acceso:
--   service_role   → acceso total (backend Laravel / server-side).
--   authenticated  → solo lectura del catálogo público (web de tienda).
--   anon           → solo lectura del catálogo público (carrito sin login).
--   El resto de tablas (ventas, cajas, cuentas, usuarios, permisos…) queda
--   cerrado: no hay política RLS, por lo tanto nadie salvo service_role (o el
--   dueño de las tablas, que omite RLS) puede leerlas.
--
-- Importante: Laravel conectado con el rol `postgres` sigue funcionando igual,
-- porque el dueño de la tabla no está sujeto a RLS (no usamos FORCE RLS).

-- ── 12.1 Privilegios de esquema ───────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA public TO service_role;

-- ── 12.2 Catálogo público (lectura para la web/tienda) ────────────────────
GRANT SELECT ON
    categoria,
    impuestos,
    metodos_pago,
    tipos_factura,
    ubicaciones,
    tipos_medidas,
    medidas,
    tallas,
    productos,
    producto_variaciones,
    variacion_tallas,
    variacion_imagenes,
    credenciales
TO anon, authenticated;

-- ── 12.3 Privilegios por defecto para objetos futuros ─────────────────────
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON ROUTINES TO service_role;

-- ── 12.4 RLS en todas las tablas del esquema public ───────────────────────
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- ── 12.5 Políticas de lectura (solo registros activos) ────────────────────
CREATE POLICY cat_categoria_lectura ON categoria
    FOR SELECT TO anon, authenticated USING (estado_categoria);

CREATE POLICY cat_impuestos_lectura ON impuestos
    FOR SELECT TO anon, authenticated USING (estado_impuesto);

CREATE POLICY cat_metodos_pago_lectura ON metodos_pago
    FOR SELECT TO anon, authenticated USING (estado_metodo_pago);

CREATE POLICY cat_tipos_factura_lectura ON tipos_factura
    FOR SELECT TO anon, authenticated USING (estado);

CREATE POLICY cat_ubicaciones_lectura ON ubicaciones
    FOR SELECT TO anon, authenticated USING (estado_ubicacion);

CREATE POLICY cat_tipos_medidas_lectura ON tipos_medidas
    FOR SELECT TO anon, authenticated USING (estado_tipo_medida);

CREATE POLICY cat_medidas_lectura ON medidas
    FOR SELECT TO anon, authenticated USING (estado_medida);

CREATE POLICY cat_tallas_lectura ON tallas
    FOR SELECT TO anon, authenticated USING (estado_talla);

CREATE POLICY cat_productos_lectura ON productos
    FOR SELECT TO anon, authenticated USING (estado_producto);

CREATE POLICY cat_producto_variaciones_lectura ON producto_variaciones
    FOR SELECT TO anon, authenticated USING (estado_variacion);

CREATE POLICY cat_variacion_tallas_lectura ON variacion_tallas
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY cat_variacion_imagenes_lectura ON variacion_imagenes
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY cat_credenciales_lectura ON credenciales
    FOR SELECT TO anon, authenticated USING (true);

-- ── 12.6 Ejemplos comentados para la tienda con cliente logueado ──────────
-- Requieren que el cliente web tenga su propio usuario en Supabase Auth y que
-- `clientes.usuario_cliente` coincida con el email/username del JWT.
--
-- CREATE POLICY cliente_direcciones_propias ON cliente_direcciones
--     FOR ALL TO authenticated
--     USING (id_cliente IN (SELECT id_cliente FROM clientes
--                           WHERE usuario_cliente = auth.jwt() ->> 'email'));
--
-- CREATE POLICY cliente_favoritos_propios ON cliente_favoritos
--     FOR ALL TO authenticated
--     USING (id_cliente IN (SELECT id_cliente FROM clientes
--                           WHERE usuario_cliente = auth.jwt() ->> 'email'));
--
-- CREATE POLICY cliente_autoconsulta ON clientes
--     FOR SELECT TO authenticated
--     USING (usuario_cliente = auth.jwt() ->> 'email');
