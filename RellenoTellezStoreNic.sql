-- =====================================================================
-- RELLENO DE DATOS: TELLEZ STORE NIC (ZAPATERÍA)
-- =====================================================================
-- Ejecutar DESPUÉS de `php artisan migrate:fresh --seed`.
-- Este archivo asume los IDs creados por los seeders base:
--   usuarios      → 1 Edgard (admin), 2 mlopez (vendedor), 3 cperez,
--                   4 asmartinez, 5 jcastillo
--   impuestos     → 1 IVA (15%), 2 ISC Bebidas, 3 Exento (0%)
--   metodos_pago  → 1 Efectivo, 2 Tarjeta, 3 Transferencia, 4 Pago móvil
--   tipos_factura → 1 CONTADO, 2 CREDITO
--
-- Las fechas de compras (sep/2026) son anteriores a las ventas (oct/2026)
-- para que los consumos FIFO de los lotes cuadren con las ventas.
-- =====================================================================

-- =========================================
-- CATEGORIAS
-- =========================================

INSERT INTO categoria (id_categoria, nombre_categoria, descripcion_categoria, estado_categoria, fecha_creacion_categoria) VALUES
(1,'Calzado Deportivo','Zapatillas deportivas y de descanso',1,'2026-09-01 08:00:00'),
(2,'Calzado Casual','Zapatillas casuales de lona, gamuza y cuero',1,'2026-09-01 08:00:00'),
(3,'Calzado Formal','Zapatos formales de vestir',1,'2026-09-01 08:00:00'),
(4,'Botas','Botas de cuero, trabajo y outdoor',1,'2026-09-01 08:00:00'),
(5,'Sandalias','Sandalias y calzado abierto',1,'2026-09-01 08:00:00');

-- =========================================
-- TALLAS (calzado 34 - 44)
-- =========================================

INSERT INTO tallas (id_talla, talla, estado_talla) VALUES
(1,'34',1),
(2,'35',1),
(3,'36',1),
(4,'37',1),
(5,'38',1),
(6,'39',1),
(7,'40',1),
(8,'41',1),
(9,'42',1),
(10,'43',1),
(11,'44',1);

-- =========================================
-- UBICACIONES
-- =========================================

INSERT INTO ubicaciones (id_ubicacion, nombre_ubicacion, descripcion_ubicacion, estado_ubicacion) VALUES
(1,'Estante A1','Zapatillas deportivas',1),
(2,'Estante A2','Calzado casual',1),
(3,'Estante B1','Calzado formal',1),
(4,'Estante B2','Botas',1),
(5,'Estante C1','Sandalias',1);

-- =========================================
-- PROVEEDORES
-- =========================================

INSERT INTO proveedores (id_proveedor, nombre_proveedor, ruc_proveedor, telefono_proveedor, direccion_proveedor, correo_proveedor, estado_proveedor, fecha_creacion_proveedor) VALUES
(1,'Distribuidora Calzado Nicaragüense','J0310000011001','88881100','Managua','ventas@calzadonic.com',1,'2026-09-01 08:00:00'),
(2,'Importadora Shoe World S.A.','J0310000022002','88882200','León','pedidos@shoeworld.com',1,'2026-09-01 08:00:00'),
(3,'Comercial Zapatería Central','J0310000033003','88883300','Masaya','contacto@zapateriacentral.com',1,'2026-09-01 08:00:00'),
(4,'Distribuidora Kicks & Shoes','J0310000044004','88884400','Granada','ventas@kicksandshoes.com',1,'2026-09-01 08:00:00');

-- =========================================
-- CLIENTES
-- =========================================

INSERT INTO clientes (id_cliente, nombre_cliente, cedula_cliente, ruc_cliente, telefono_cliente, direccion_cliente, correo_cliente, estado_cliente, fecha_creacion_cliente) VALUES
(1,'Cliente Generico','','','','','',1,'2026-09-01 08:00:00'),
(2,'Karla Espinoza','001-100192-1001A','J0311001920011K','88880021','Managua','karla.espinoza@gmail.com',1,'2026-09-05 09:00:00'),
(3,'Roberto Urbina','211-150693-1002B','J0311506930022R','88880022','Chinandega','roberto.urbina@gmail.com',1,'2026-09-05 09:00:00'),
(4,'María Fernanda Zelaya','131-200894-1003C','J0312008940033M','88880023','Estelí','mafer.zelaya@gmail.com',1,'2026-09-05 09:00:00'),
(5,'Óscar Jarquín','241-250595-1004D','J0312505950044O','88880024','Masaya','oscar.jarquin@gmail.com',1,'2026-09-10 10:00:00'),
(6,'Paola Méndez','151-301096-1005E','J0313010960055P','88880025','Granada','paola.mendez@gmail.com',1,'2026-09-10 10:00:00'),
(7,'Byron Gutiérrez','281-050797-1006F','J0310507970066B','88880026','León','byron.gutierrez@gmail.com',1,'2026-09-10 10:00:00'),
(8,'Silvia Navarrete','271-120398-1007G','J0311203980077S','88880027','Rivas','silvia.navarrete@gmail.com',1,'2026-09-15 11:00:00');

-- =========================================
-- CUENTAS
-- =========================================

INSERT INTO cuentas (id_cuenta, nombre_cuenta, tipo_cuenta, descripcion, saldo_actual, estado, created_at, updated_at) VALUES
(1,'Caja General','EFECTIVO','Caja principal del negocio',8000,1,'2026-09-01 08:00:00','2026-09-01 08:00:00'),
(2,'BAC Credomatic','BANCARIA','Cuenta BAC para ventas con tarjeta y transferencia',106905,1,'2026-09-01 08:00:00','2026-09-01 08:00:00'),
(3,'Lafise','BANCARIA','Cuenta Lafise operaciones',45000,1,'2026-09-01 08:00:00','2026-09-01 08:00:00'),
(4,'Banpro','BANCARIA','Cuenta Banpro ventas',60000,1,'2026-09-01 08:00:00','2026-09-01 08:00:00'),
(5,'Cuenta Compras','EFECTIVO','Fondos destinados a compra de inventario',45460,1,'2026-09-01 08:00:00','2026-09-01 08:00:00');

-- =========================================
-- CAJAS (cerradas, solo ventas en efectivo del día)
-- =========================================

INSERT INTO cajas (id_caja, fecha_apertura, fecha_cierre, monto_inicial, monto_final, monto_teorico, monto_real, diferencia, estado_caja, id_usuario) VALUES
(1,'2026-10-05 08:00:00','2026-10-05 22:00:00',3000,3300,3300,3300,0,0,2),
(2,'2026-10-06 08:00:00','2026-10-06 22:00:00',3000,4790,4840,4790,-50,0,1),
(3,'2026-10-08 08:00:00','2026-10-08 22:00:00',3000,4600,4600,4600,0,0,2),
(4,'2026-10-10 08:00:00','2026-10-10 22:00:00',3000,7715,7715,7715,0,0,2),
(5,'2026-10-12 08:00:00','2026-10-12 22:00:00',3000,5710,5760,5710,-50,0,1);

-- =========================================
-- PRODUCTOS
-- stock_actual = stock total actual (suma de sus variaciones)
-- Los precios de venta del catálogo INCLUYEN IVA (15%)
-- =========================================

INSERT INTO productos (id_producto, nombre_producto, descripcion_producto, id_categoria, id_impuesto, id_ubicacion, id_medida, imagen_producto, precio_compra, precio_venta, stock_actual, estado_producto, fecha_creacion_producto) VALUES
(1,'Nike Air Max 90','Zapatilla deportiva unisex',1,1,1,NULL,NULL,1450,2300,25,1,'2026-09-01 09:00:00'),
(2,'Adidas Superstar','Zapatilla casual clásica',2,1,2,NULL,NULL,1250,1840,27,1,'2026-09-01 09:00:00'),
(3,'Puma Suede Classic','Zapatilla casual de gamuza',2,1,2,NULL,NULL,1350,1955,25,1,'2026-09-01 09:00:00'),
(4,'Dr. Martens 1460','Bota de cuero clásica',4,1,4,NULL,NULL,2100,2875,20,1,'2026-09-01 09:00:00'),
(5,'Converse Chuck Taylor','Zapatilla casual de lona',2,1,2,NULL,NULL,1100,1495,27,1,'2026-09-01 09:00:00'),
(6,'Vans Old Skool','Zapatilla casual de lona',2,1,2,NULL,NULL,1300,1725,6,1,'2026-09-01 09:00:00'),
(7,'Crocs Classic Clog','Sandalia de espuma ligera',5,1,5,NULL,NULL,750,1035,8,1,'2026-09-01 09:00:00'),
(8,'Timberland 6" Premium','Bota de trabajo impermeable',4,1,4,NULL,NULL,2800,3680,5,1,'2026-09-01 09:00:00'),
(9,'Birkenstock Arizona','Sandalia de descanso',5,1,5,NULL,NULL,900,1265,9,1,'2026-09-01 09:00:00'),
(10,'Skechers Go Walk','Zapatilla deportiva de descanso',1,1,1,NULL,NULL,850,1150,14,1,'2026-09-01 09:00:00'),
(11,'Zapato Formal Oxford','Zapato formal de cuero',3,1,3,NULL,NULL,1600,2530,8,1,'2026-09-01 09:00:00');

-- =========================================
-- PRODUCTO VARIACIONES (colores)
-- =========================================

INSERT INTO producto_variaciones (id_variacion, id_producto, color, estado_variacion) VALUES
(1,1,'Negro',1),
(2,1,'Blanco',1),
(3,2,'Blanco',1),
(4,2,'Negro',1),
(5,3,'Negro',1),
(6,3,'Rojo',1),
(7,4,'Negro',1),
(8,4,'Miel',1),
(9,5,'Negro',1),
(10,5,'Blanco',1);

-- =========================================
-- VARIACION TALLAS (stock actual por color-talla)
-- =========================================

INSERT INTO variacion_tallas (id_variacion_talla, id_variacion, id_talla, stock, sku, precio_compra, precio_venta) VALUES
(1,1,7,4,'NIKE-AIR-MAX-90-NEGRO-40',1450,2300),
(2,1,8,3,'NIKE-AIR-MAX-90-NEGRO-41',1450,2300),
(3,1,9,5,'NIKE-AIR-MAX-90-NEGRO-42',1450,2300),
(4,2,7,4,'NIKE-AIR-MAX-90-BLANCO-40',1450,2300),
(5,2,8,5,'NIKE-AIR-MAX-90-BLANCO-41',1450,2300),
(6,2,9,4,'NIKE-AIR-MAX-90-BLANCO-42',1450,2300),
(7,3,6,5,'ADIDAS-SUPERSTAR-BLANCO-39',1250,1840),
(8,3,7,5,'ADIDAS-SUPERSTAR-BLANCO-40',1250,1840),
(9,3,8,4,'ADIDAS-SUPERSTAR-BLANCO-41',1250,1840),
(10,4,6,5,'ADIDAS-SUPERSTAR-NEGRO-39',1250,1840),
(11,4,7,4,'ADIDAS-SUPERSTAR-NEGRO-40',1250,1840),
(12,4,8,4,'ADIDAS-SUPERSTAR-NEGRO-41',1250,1840),
(13,5,7,5,'PUMA-SUEDE-CLASSIC-NEGRO-40',1350,1955),
(14,5,8,4,'PUMA-SUEDE-CLASSIC-NEGRO-41',1350,1955),
(15,5,9,4,'PUMA-SUEDE-CLASSIC-NEGRO-42',1350,1955),
(16,6,7,3,'PUMA-SUEDE-CLASSIC-ROJO-40',1350,1955),
(17,6,8,5,'PUMA-SUEDE-CLASSIC-ROJO-41',1350,1955),
(18,6,9,4,'PUMA-SUEDE-CLASSIC-ROJO-42',1350,1955),
(19,7,7,4,'DR-MARTENS-1460-NEGRO-40',2100,2875),
(20,7,8,3,'DR-MARTENS-1460-NEGRO-41',2100,2875),
(21,7,9,3,'DR-MARTENS-1460-NEGRO-42',2100,2875),
(22,8,7,3,'DR-MARTENS-1460-MIEL-40',2100,2875),
(23,8,8,4,'DR-MARTENS-1460-MIEL-41',2100,2875),
(24,8,9,3,'DR-MARTENS-1460-MIEL-42',2100,2875),
(25,9,5,5,'CONVERSE-CHUCK-TAYLOR-NEGRO-38',1100,1495),
(26,9,6,5,'CONVERSE-CHUCK-TAYLOR-NEGRO-39',1100,1495),
(27,9,7,4,'CONVERSE-CHUCK-TAYLOR-NEGRO-40',1100,1495),
(28,10,5,4,'CONVERSE-CHUCK-TAYLOR-BLANCO-38',1100,1495),
(29,10,6,5,'CONVERSE-CHUCK-TAYLOR-BLANCO-39',1100,1495),
(30,10,7,4,'CONVERSE-CHUCK-TAYLOR-BLANCO-40',1100,1495);

-- =========================================
-- VARIACION IMAGENES
-- =========================================

INSERT INTO variacion_imagenes (id_imagen, id_variacion, imagen, orden) VALUES
(1,1,'imagenes/productosvariaciones/NikeAirMax90Negro1.png',0),
(2,2,'imagenes/productosvariaciones/NikeAirMax90Blanco1.png',0),
(3,3,'imagenes/productosvariaciones/AdidasSuperstarBlanco1.png',0),
(4,4,'imagenes/productosvariaciones/AdidasSuperstarNegro1.png',0),
(5,5,'imagenes/productosvariaciones/PumaSuedeClassicNegro1.png',0),
(6,6,'imagenes/productosvariaciones/PumaSuedeClassicRojo1.png',0),
(7,7,'imagenes/productosvariaciones/DrMartens1460Negro1.png',0),
(8,8,'imagenes/productosvariaciones/DrMartens1460Miel1.png',0),
(9,9,'imagenes/productosvariaciones/ConverseChuckTaylorNegro1.png',0),
(10,10,'imagenes/productosvariaciones/ConverseChuckTaylorBlanco1.png',0);

-- =========================================
-- COMPRAS (pagadas desde Cuenta Compras id=5)
-- =========================================

INSERT INTO compras (id_compra, numero_factura_compra, id_proveedor, id_usuario, fecha_compra, subtotal_compra, descuento_compra, impuesto_compra, total_compra, estado_compra, id_caja, id_cuenta, id_metodo_pago, id_tipo_factura) VALUES
(1,'COMP-0001',1,1,'2026-09-20 10:00:00',29000,0,4350,33350,1,NULL,5,3,1),
(2,'COMP-0002',2,1,'2026-09-28 11:30:00',40600,0,6090,46690,1,NULL,5,3,1),
(3,'COMP-0003',3,1,'2026-10-02 15:00:00',30000,0,4500,34500,1,NULL,5,3,1);

-- =========================================
-- DETALLE COMPRAS
-- =========================================

INSERT INTO detalle_compras (id_detalle_compra, id_compra, id_producto, id_variacion_talla, descripcion_variacion, sku_variacion, cantidad_compra, precio_unitario_compra, subtotal_detalle_compra) VALUES
-- COMPRA 1 (Nike)
(1,1,1,1,'Negro · 40','NIKE-AIR-MAX-90-NEGRO-40',6,1450,8700),
(2,1,1,2,'Negro · 41','NIKE-AIR-MAX-90-NEGRO-41',4,1450,5800),
(3,1,1,4,'Blanco · 40','NIKE-AIR-MAX-90-BLANCO-40',5,1450,7250),
(4,1,1,5,'Blanco · 41','NIKE-AIR-MAX-90-BLANCO-41',5,1450,7250),
-- COMPRA 2 (Adidas, Puma, Dr. Martens)
(5,2,2,8,'Blanco · 40','ADIDAS-SUPERSTAR-BLANCO-40',6,1250,7500),
(6,2,2,11,'Negro · 40','ADIDAS-SUPERSTAR-NEGRO-40',5,1250,6250),
(7,2,3,14,'Negro · 41','PUMA-SUEDE-CLASSIC-NEGRO-41',5,1350,6750),
(8,2,3,16,'Rojo · 40','PUMA-SUEDE-CLASSIC-ROJO-40',4,1350,5400),
(9,2,4,20,'Negro · 41','DR-MARTENS-1460-NEGRO-41',4,2100,8400),
(10,2,4,22,'Miel · 40','DR-MARTENS-1460-MIEL-40',3,2100,6300),
-- COMPRA 3 (Converse, Vans, Crocs)
(11,3,5,26,'Negro · 39','CONVERSE-CHUCK-TAYLOR-NEGRO-39',6,1100,6600),
(12,3,5,28,'Blanco · 38','CONVERSE-CHUCK-TAYLOR-BLANCO-38',5,1100,5500),
(13,3,6,NULL,NULL,NULL,8,1300,10400),
(14,3,7,NULL,NULL,NULL,10,750,7500);

-- =========================================
-- LOTES INVENTARIO (FIFO)
-- cantidad_disponible = comprada - vendida en las ventas de abajo
-- =========================================

INSERT INTO lotes_inventario (id_lote, id_producto, id_variacion_talla, id_detalle_compra, cantidad_inicial, cantidad_disponible, costo_unitario, fecha_ingreso, id_usuario) VALUES
(1,1,1,1,6,4,1450,'2026-09-20 10:00:00',1),
(2,1,2,2,4,3,1450,'2026-09-20 10:00:00',1),
(3,1,4,3,5,4,1450,'2026-09-20 10:00:00',1),
(4,1,5,4,5,5,1450,'2026-09-20 10:00:00',1),
(5,2,8,5,6,5,1250,'2026-09-28 11:30:00',1),
(6,2,11,6,5,4,1250,'2026-09-28 11:30:00',1),
(7,3,14,7,5,4,1350,'2026-09-28 11:30:00',1),
(8,3,16,8,4,3,1350,'2026-09-28 11:30:00',1),
(9,4,20,9,4,3,2100,'2026-09-28 11:30:00',1),
(10,4,22,10,3,3,2100,'2026-09-28 11:30:00',1),
(11,5,26,11,6,5,1100,'2026-10-02 15:00:00',1),
(12,5,28,12,5,4,1100,'2026-10-02 15:00:00',1),
(13,6,NULL,13,8,6,1300,'2026-10-02 15:00:00',1),
(14,7,NULL,14,10,8,750,'2026-10-02 15:00:00',1);

-- =========================================
-- VENTAS
-- Efectivo (método 1) → caja; resto de métodos → cuenta BAC (id=2)
-- =========================================

INSERT INTO ventas (id_venta, numero_factura, fecha_venta, id_cliente, id_usuario, id_caja, id_cuenta, subtotal_venta, impuesto_venta, descuento_venta, total_venta, estado_venta, id_metodo_pago, monto_recibido, vuelto, moneda) VALUES
(1,'VTA-20261005-00001','2026-10-05 10:15:00',2,2,1,NULL,2000,300,0,2300,1,1,2500,200,'NIO'),
(2,'VTA-20261005-00002','2026-10-05 15:40:00',3,2,NULL,2,3500,525,0,4025,1,2,4025,0,'NIO'),
(3,'VTA-20261006-00003','2026-10-06 11:20:00',4,1,2,NULL,1600,240,0,1840,1,1,2000,160,'NIO'),
(4,'VTA-20261007-00004','2026-10-07 17:05:00',5,2,NULL,2,4800,720,0,5520,1,3,5520,0,'NIO'),
(5,'VTA-20261008-00005','2026-10-08 12:30:00',6,2,3,NULL,4000,600,0,4600,1,1,5000,400,'NIO'),
(6,'VTA-20261009-00006','2026-10-09 16:45:00',7,1,NULL,2,1700,255,0,1955,1,2,1955,0,'NIO'),
(7,'VTA-20261010-00007','2026-10-10 18:10:00',8,2,4,NULL,4100,615,0,4715,1,1,5000,285,'NIO'),
(8,'VTA-20261011-00008','2026-10-11 13:25:00',2,2,NULL,2,2500,375,0,2875,1,4,2875,0,'NIO'),
(9,'VTA-20261012-00009','2026-10-12 19:50:00',3,1,5,NULL,2400,360,0,2760,1,1,3000,240,'NIO'),
(10,'VTA-20261013-00010','2026-10-13 20:15:00',4,2,NULL,2,2200,330,0,2530,1,2,2530,0,'NIO');

-- =========================================
-- DETALLE VENTAS
-- precio_unitario_venta = precio de catálogo SIN IVA
-- consumos_lotes = lotes FIFO consumidos por la venta
-- =========================================

INSERT INTO detalle_ventas (id_detalle_venta, id_venta, id_producto, id_variacion_talla, descripcion_variacion, sku_variacion, cantidad_venta, precio_unitario_venta, costo_unitario_venta, consumos_lotes, subtotal_detalle_venta, porcentaje_impuesto, monto_impuesto) VALUES
-- VENTA 1
(1,1,1,1,'Negro · 40','NIKE-AIR-MAX-90-NEGRO-40',1,2000,1450,'[{"id_lote":1,"cantidad":1,"costo_unitario":1450}]',2000,15,300),
-- VENTA 2
(2,2,1,4,'Blanco · 40','NIKE-AIR-MAX-90-BLANCO-40',1,2000,1450,'[{"id_lote":3,"cantidad":1,"costo_unitario":1450}]',2000,15,300),
(3,2,6,NULL,NULL,NULL,1,1500,1300,'[{"id_lote":13,"cantidad":1,"costo_unitario":1300}]',1500,15,225),
-- VENTA 3
(4,3,2,8,'Blanco · 40','ADIDAS-SUPERSTAR-BLANCO-40',1,1600,1250,'[{"id_lote":5,"cantidad":1,"costo_unitario":1250}]',1600,15,240),
-- VENTA 4
(5,4,2,11,'Negro · 40','ADIDAS-SUPERSTAR-NEGRO-40',1,1600,1250,'[{"id_lote":6,"cantidad":1,"costo_unitario":1250}]',1600,15,240),
(6,4,8,NULL,NULL,NULL,1,3200,2800,'[{"id_lote":null,"cantidad":1,"costo_unitario":2800}]',3200,15,480),
-- VENTA 5
(7,5,1,1,'Negro · 40','NIKE-AIR-MAX-90-NEGRO-40',1,2000,1450,'[{"id_lote":1,"cantidad":1,"costo_unitario":1450}]',2000,15,300),
(8,5,1,2,'Negro · 41','NIKE-AIR-MAX-90-NEGRO-41',1,2000,1450,'[{"id_lote":2,"cantidad":1,"costo_unitario":1450}]',2000,15,300),
-- VENTA 6
(9,6,3,14,'Negro · 41','PUMA-SUEDE-CLASSIC-NEGRO-41',1,1700,1350,'[{"id_lote":7,"cantidad":1,"costo_unitario":1350}]',1700,15,255),
-- VENTA 7
(10,7,3,16,'Rojo · 40','PUMA-SUEDE-CLASSIC-ROJO-40',1,1700,1350,'[{"id_lote":8,"cantidad":1,"costo_unitario":1350}]',1700,15,255),
(11,7,6,NULL,NULL,NULL,1,1500,1300,'[{"id_lote":13,"cantidad":1,"costo_unitario":1300}]',1500,15,225),
(12,7,7,NULL,NULL,NULL,1,900,750,'[{"id_lote":14,"cantidad":1,"costo_unitario":750}]',900,15,135),
-- VENTA 8
(13,8,4,20,'Negro · 41','DR-MARTENS-1460-NEGRO-41',1,2500,2100,'[{"id_lote":9,"cantidad":1,"costo_unitario":2100}]',2500,15,375),
-- VENTA 9
(14,9,5,26,'Negro · 39','CONVERSE-CHUCK-TAYLOR-NEGRO-39',1,1300,1100,'[{"id_lote":11,"cantidad":1,"costo_unitario":1100}]',1300,15,195),
(15,9,9,NULL,NULL,NULL,1,1100,900,'[{"id_lote":null,"cantidad":1,"costo_unitario":900}]',1100,15,165),
-- VENTA 10
(16,10,5,28,'Blanco · 38','CONVERSE-CHUCK-TAYLOR-BLANCO-38',1,1300,1100,'[{"id_lote":12,"cantidad":1,"costo_unitario":1100}]',1300,15,195),
(17,10,7,NULL,NULL,NULL,1,900,750,'[{"id_lote":14,"cantidad":1,"costo_unitario":750}]',900,15,135);

-- =========================================
-- MOVIMIENTOS INVENTARIO (Kardex)
-- ENTRADAS: stock_resultante = stock de la variante tras la compra
-- SALIDAS:  stock_resultante = stock_actual del producto tras la venta
-- =========================================

INSERT INTO movimientos_inventario (id_producto, id_variacion_talla, tipo_movimiento, cantidad_movimiento, stock_resultante, motivo_movimiento, id_referencia, tipo_referencia, precio_unitario, fecha_movimiento, id_usuario) VALUES
-- ENTRADAS POR COMPRA 1
(1,1,'ENTRADA',6,6,'Reabastecimiento - Negro 40',1,'COMPRA',1450,'2026-09-20 10:00:00',1),
(1,2,'ENTRADA',4,4,'Reabastecimiento - Negro 41',1,'COMPRA',1450,'2026-09-20 10:00:00',1),
(1,4,'ENTRADA',5,5,'Reabastecimiento - Blanco 40',1,'COMPRA',1450,'2026-09-20 10:00:00',1),
(1,5,'ENTRADA',5,5,'Reabastecimiento - Blanco 41',1,'COMPRA',1450,'2026-09-20 10:00:00',1),
-- ENTRADAS POR COMPRA 2
(2,8,'ENTRADA',6,6,'Reabastecimiento - Blanco 40',2,'COMPRA',1250,'2026-09-28 11:30:00',1),
(2,11,'ENTRADA',5,5,'Reabastecimiento - Negro 40',2,'COMPRA',1250,'2026-09-28 11:30:00',1),
(3,14,'ENTRADA',5,5,'Reabastecimiento - Negro 41',2,'COMPRA',1350,'2026-09-28 11:30:00',1),
(3,16,'ENTRADA',4,4,'Reabastecimiento - Rojo 40',2,'COMPRA',1350,'2026-09-28 11:30:00',1),
(4,20,'ENTRADA',4,4,'Reabastecimiento - Negro 41',2,'COMPRA',2100,'2026-09-28 11:30:00',1),
(4,22,'ENTRADA',3,3,'Reabastecimiento - Miel 40',2,'COMPRA',2100,'2026-09-28 11:30:00',1),
-- ENTRADAS POR COMPRA 3
(5,26,'ENTRADA',6,6,'Reabastecimiento - Negro 39',3,'COMPRA',1100,'2026-10-02 15:00:00',1),
(5,28,'ENTRADA',5,5,'Reabastecimiento - Blanco 38',3,'COMPRA',1100,'2026-10-02 15:00:00',1),
(6,NULL,'ENTRADA',8,8,'Reabastecimiento de productos',3,'COMPRA',1300,'2026-10-02 15:00:00',1),
(7,NULL,'ENTRADA',10,10,'Reabastecimiento de productos',3,'COMPRA',750,'2026-10-02 15:00:00',1),
-- SALIDAS POR VENTA 1
(1,1,'SALIDA',1,28,'Venta despacho - Negro 40',1,'VENTA',2000,'2026-10-05 10:15:00',2),
-- SALIDAS POR VENTA 2
(1,4,'SALIDA',1,27,'Venta despacho - Blanco 40',2,'VENTA',2000,'2026-10-05 15:40:00',2),
(6,NULL,'SALIDA',1,7,'Venta despacho realizada',2,'VENTA',1500,'2026-10-05 15:40:00',2),
-- SALIDAS POR VENTA 3
(2,8,'SALIDA',1,28,'Venta despacho - Blanco 40',3,'VENTA',1600,'2026-10-06 11:20:00',1),
-- SALIDAS POR VENTA 4
(2,11,'SALIDA',1,27,'Venta despacho - Negro 40',4,'VENTA',1600,'2026-10-07 17:05:00',2),
(8,NULL,'SALIDA',1,5,'Venta despacho realizada',4,'VENTA',3200,'2026-10-07 17:05:00',2),
-- SALIDAS POR VENTA 5
(1,1,'SALIDA',1,26,'Venta despacho - Negro 40',5,'VENTA',2000,'2026-10-08 12:30:00',2),
(1,2,'SALIDA',1,25,'Venta despacho - Negro 41',5,'VENTA',2000,'2026-10-08 12:30:00',2),
-- SALIDAS POR VENTA 6
(3,14,'SALIDA',1,26,'Venta despacho - Negro 41',6,'VENTA',1700,'2026-10-09 16:45:00',1),
-- SALIDAS POR VENTA 7
(3,16,'SALIDA',1,25,'Venta despacho - Rojo 40',7,'VENTA',1700,'2026-10-10 18:10:00',2),
(6,NULL,'SALIDA',1,6,'Venta despacho realizada',7,'VENTA',1500,'2026-10-10 18:10:00',2),
(7,NULL,'SALIDA',1,9,'Venta despacho realizada',7,'VENTA',900,'2026-10-10 18:10:00',2),
-- SALIDAS POR VENTA 8
(4,20,'SALIDA',1,20,'Venta despacho - Negro 41',8,'VENTA',2500,'2026-10-11 13:25:00',2),
-- SALIDAS POR VENTA 9
(5,26,'SALIDA',1,28,'Venta despacho - Negro 39',9,'VENTA',1300,'2026-10-12 19:50:00',1),
(9,NULL,'SALIDA',1,9,'Venta despacho realizada',9,'VENTA',1100,'2026-10-12 19:50:00',1),
-- SALIDAS POR VENTA 10
(5,28,'SALIDA',1,27,'Venta despacho - Blanco 38',10,'VENTA',1300,'2026-10-13 20:15:00',2),
(7,NULL,'SALIDA',1,8,'Venta despacho realizada',10,'VENTA',900,'2026-10-13 20:15:00',2);

-- =========================================
-- TRANSFERENCIAS CAJA → CUENTA
-- =========================================

INSERT INTO transferencias_caja_cuenta (id_transferencia, id_caja_origen, id_cuenta_destino, monto, concepto, id_usuario, fecha) VALUES
(1,1,2,2000,'Depósito ventas día 1',1,'2026-10-05 22:10:00'),
(2,3,2,3000,'Depósito ventas día 3',1,'2026-10-08 22:05:00');

-- =========================================
-- MOVIMIENTOS CAJA
-- =========================================

INSERT INTO movimientos_caja (id_caja, tipo_movimiento_caja, concepto_movimiento_caja, monto_movimiento_caja, fecha_movimiento_caja, id_usuario, id_transferencia, id_referencia, id_cuenta_destino) VALUES
(1,'INGRESO','Venta VTA-20261005-00001',2300,'2026-10-05 10:15:00',2,NULL,1,NULL),
(1,'SALIDA','Transferencia bancaria a BAC Credomatic',2000,'2026-10-05 22:10:00',1,1,NULL,2),
(2,'INGRESO','Venta VTA-20261006-00003',1840,'2026-10-06 11:20:00',1,NULL,3,NULL),
(3,'INGRESO','Venta VTA-20261008-00005',4600,'2026-10-08 12:30:00',2,NULL,5,NULL),
(3,'SALIDA','Transferencia bancaria a BAC Credomatic',3000,'2026-10-08 22:05:00',1,2,NULL,2),
(4,'INGRESO','Venta VTA-20261010-00007',4715,'2026-10-10 18:10:00',2,NULL,7,NULL),
(5,'INGRESO','Venta VTA-20261012-00009',2760,'2026-10-12 19:50:00',1,NULL,9,NULL);

-- =========================================
-- MOVIMIENTOS CUENTAS
-- =========================================

INSERT INTO movimientos_cuentas (id_cuenta, tipo_movimiento, monto, descripcion, fecha, id_usuario, id_transferencia) VALUES
-- Pagos de compras desde Cuenta Compras (id=5)
(5,'SALIDA',33350,'Pago compra COMP-0001','2026-09-20 10:00:00',1,NULL),
(5,'SALIDA',46690,'Pago compra COMP-0002','2026-09-28 11:30:00',1,NULL),
(5,'SALIDA',34500,'Pago compra COMP-0003','2026-10-02 15:00:00',1,NULL),
-- Ingresos por ventas con tarjeta/transferencia/móvil (BAC id=2)
(2,'INGRESO',4025,'Venta VTA-20261005-00002','2026-10-05 15:40:00',2,NULL),
(2,'INGRESO',5520,'Venta VTA-20261007-00004','2026-10-07 17:05:00',2,NULL),
(2,'INGRESO',1955,'Venta VTA-20261009-00006','2026-10-09 16:45:00',1,NULL),
(2,'INGRESO',2875,'Venta VTA-20261011-00008','2026-10-11 13:25:00',2,NULL),
(2,'INGRESO',2530,'Venta VTA-20261013-00010','2026-10-13 20:15:00',2,NULL),
-- Ingresos por transferencias desde cajas
(2,'INGRESO',2000,'Transferencia desde Caja 1','2026-10-05 22:10:00',1,1),
(2,'INGRESO',3000,'Transferencia desde Caja 3','2026-10-08 22:05:00',1,2);
