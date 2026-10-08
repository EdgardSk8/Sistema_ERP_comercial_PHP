-- Ejecutar despues de `php artisan migrate` y `php artisan db:seed`.
-- Este archivo asume los IDs creados por los seeders base (usuarios,
-- proveedores, impuestos, metodos de pago y tipos de factura).

-- CLIENTES

INSERT INTO clientes
(nombre_cliente, cedula_cliente, ruc_cliente, telefono_cliente, direccion_cliente, correo_cliente, estado_cliente, fecha_creacion_cliente)
VALUES

('Cliente Generico','','','','','',1,'2026-01-05'),
('Carlos Martínez','001-050126-913C','J0310501268845K','88880003','Managua','carlos.martinez@gmail.com',1,'2026-01-05'),
('Ana Rodríguez','211-050126-204D','J0310501263321M','88880004','Chinandega','ana.rodriguez@gmail.com',1,'2026-01-05'),
('Luis García','131-050126-775E','J0310501265590P','88880005','Estelí','luis.garcia@gmail.com',1,'2026-01-05'),
('Pedro Sánchez','241-050126-118F','J0310501267712R','88880006','Masaya','pedro.sanchez@gmail.com',1,'2026-01-05'),

('Jorge Mendoza','151-050226-663G','J0310502264451T','88880007','Granada','jorge.mendoza@gmail.com',1,'2026-02-05'),
('José Castillo','281-050226-902H','J0310502269988V','88880008','León','jose.castillo@gmail.com',1,'2026-02-05'),
('Miguel Vargas','271-050226-314J','J0310502262233X','88880009','Rivas','miguel.vargas@gmail.com',1,'2026-02-05'),
('Andrea Ruiz','001-050226-587K','J0310502266677Z','88880010','Managua','andrea.ruiz@gmail.com',1,'2026-02-05'),
('Daniel López','211-050226-439L','J0310502261209Q','88880011','Chinandega','daniel.lopez@gmail.com',1,'2026-02-05');

-- CUENTAS

INSERT INTO cuentas 
(nombre_cuenta, tipo_cuenta, descripcion, saldo_actual, estado, created_at, updated_at) 
VALUES

('Caja General','CAJA','Cuenta principal para manejo de caja diaria',5000,1,'2026-01-01 08:15:00','2026-01-01 08:15:00'),
('Cuenta Pagos','PAGOS','Cuenta destinada para pagos y transferencias',120000,1,'2026-01-01 10:30:00','2026-01-01 10:30:00'),
('Cuenta Gastos','GASTOS','Cuenta utilizada para gastos operativos',65000,1,'2026-01-02 09:20:00','2026-01-02 09:20:00'),
('Cuenta Impuestos','IMPUESTOS','Cuenta destinada al control de impuestos',98000,1,'2026-01-02 14:40:00','2026-01-02 14:40:00'),
('Cuenta Ahorro','AHORRO','Fondos reservados para ahorro empresarial',12000,1,'2026-01-03 11:10:00','2026-01-03 11:10:00'),
('Cuenta Reserva','RESERVA','Cuenta destinada para fondos de emergencia y reserva',30000,1,'2026-01-03 16:25:00','2026-01-03 16:25:00');

-- CAJAS

INSERT INTO cajas
(fecha_apertura, fecha_cierre, monto_inicial, monto_final, monto_teorico, monto_real, diferencia, estado_caja, id_usuario) VALUES
('2026-05-05 08:00:00','2026-05-05 22:00:00',5000,17500,17450,17500,50,0,1),
('2026-05-06 08:00:00','2026-05-06 22:00:00',5000,18200,18200,18150,-50,0,2),
('2026-05-07 08:00:00','2026-05-07 22:00:00',5000,19000,18950,19000,50,0,1),
('2026-05-08 08:00:00','2026-05-08 22:00:00',5000,20100,20050,20100,50,0,2),
('2026-05-09 08:00:00','2026-05-09 22:00:00',5000,20900,20900,20850,-50,0,1),
('2026-05-10 08:00:00','2026-05-10 22:00:00',5000,21800,21750,21800,50,0,2),
('2026-05-11 08:00:00','2026-05-11 22:00:00',5000,22500,22500,22450,-50,0,1),
('2026-05-12 08:00:00','2026-05-12 22:00:00',5000,23300,23250,23300,50,0,2),
('2026-05-13 08:00:00','2026-05-13 22:00:00',5000,24100,24100,24050,-50,0,1),
('2026-05-14 08:00:00','2026-05-14 22:00:00',5000,25000,24950,25000,50,0,2);

-- UBICACIONES

INSERT INTO ubicaciones (nombre_ubicacion, descripcion_ubicacion, estado_ubicacion) VALUES
('Estante A1','Whiskys premium',1),
('Estante A2','Whiskys económicos',1),
('Estante B1','Rones añejos',1),
('Estante B2','Vodkas y ginebras',1),
('Estante C1','Cervezas nacionales',1),
('Estante C2','Cervezas importadas',1),
('Refrigerador 1','Bebidas frías',1),
('Refrigerador 2','Cervezas premium',1),
('Bodega 1','Inventario general',1),
('Bodega 2','Productos importados',1);

-- CATEGORIAS

INSERT INTO categoria (nombre_categoria, descripcion_categoria, estado_categoria) VALUES
('Whisky','Whiskys nacionales e importados',1),
('Ron','Rones premium y clásicos',1),
('Vodka','Vodkas nacionales e importados',1),
('Tequila','Tequilas blancos y reposados',1),
('Ginebra','Ginebras premium',1),
('Vino Tinto','Vinos tintos importados',1),
('Vino Blanco','Vinos blancos y espumosos',1),
('Cerveza','Cervezas nacionales e importadas',1),
('Licores','Licores dulces y cremosos',1),
('Energéticas','Bebidas energéticas',1);

INSERT INTO tipo_gasto (nombre_tipo_gasto, descripcion_tipo_gasto, estado_tipo_gasto) VALUES
('Servicios Públicos','Pago de luz, agua, internet, teléfono',1),
('Mantenimiento','Reparaciones, limpieza y mantenimiento del local',1),
('Sueldos','Pago de salarios al personal',1),
('Impuestos','Pagos de impuestos locales y nacionales',1),
('Otros','Gastos varios no contemplados en otras categorías',1),

('Transporte y Distribución','Fletes, entregas y transporte de mercadería',1),
('Compras de Inventario','Compra de productos para reventa',1),
('Publicidad y Marketing','Anuncios, promociones y redes sociales',1),
('Empaques y Desechables','Bolsas, vasos, hielo, servilletas',1),
('Seguridad','Guardas de seguridad, cámaras y vigilancia',1),
('Comisiones Bancarias','Cobros por uso de POS y transferencias',1),
('Alquiler del Local','Pago mensual del establecimiento',1),
('Equipos y Mobiliario','Compra de estanterías, refrigeradores, etc.',1);

-- GASTOS

INSERT INTO gastos (id_tipo_gasto, nombre_gasto, descripcion_gasto, estado_gasto, fecha_inicio, fecha_pago, proximo_pago, estado_pago, ultimo_pago) VALUES
(1,'Pago de Energía','Factura mensual DISNORTE',1,'2026-01-01','2026-05-01','2026-06-01','PAGADO','2026-05-01'),
(1,'Internet Negocio','Servicio Claro Empresas',1,'2026-01-01','2026-05-02','2026-06-02','PAGADO','2026-05-02'),
(3,'Salario Cajero','Pago mensual cajero',1,'2026-01-01','2026-05-05','2026-06-05','PAGADO','2026-05-05'),
(12,'Alquiler Local','Renta mensual',1,'2026-01-01','2026-05-03','2026-06-03','PAGADO','2026-05-03'),
(8,'Publicidad Facebook','Campaña redes sociales',1,'2026-05-01','2026-05-10','2026-06-10','PAGADO','2026-05-10');

-- PRODUCTOS (30)

INSERT INTO productos
(nombre_producto, descripcion_producto, id_categoria, id_impuesto, id_ubicacion, imagen_producto, precio_compra, precio_venta, stock_actual, estado_producto)
VALUES
('Johnnie Walker Black Label','Whisky escocés 750ml',1,2,1,'ImagenProducto1.png',950,1450,30,1),
('Johnnie Walker Blue Label','Whisky premium 750ml',1,2,1,'ImagenProducto2.png',6800,9500,20,1),
('Chivas Regal 12','Whisky escocés 750ml',1,2,1,'ImagenProducto3.png',1100,1650,50,1),
('Jack Daniels Old No.7','Whisky Tennessee 750ml',1,2,2,'ImagenProducto4.png',850,1350,50,1),
('Ballantines Finest','Whisky escocés 750ml',1,2,2,'ImagenProducto5.png',700,1100,40,1),

('Flor de Caña 7 años','Ron añejo 750ml',2,2,3,'ImagenProducto6.png',420,650,40,1),
('Flor de Caña 18 años','Ron premium 750ml',2,2,3,'ImagenProducto7.png',1450,2200,50,1),
('Bacardi Carta Blanca','Ron blanco 750ml',2,2,3,'ImagenProducto8.png',380,580,50,1),
('Zacapa 23','Ron premium Guatemala',2,2,3,'ImagenProducto9.png',1800,2800,50,1),
('Captain Morgan','Ron especiado 750ml',2,2,3,'ImagenProducto10.png',450,700,50,1),

('Absolut Vodka','Vodka sueco 750ml',3,2,4,'ImagenProducto11.png',520,850,50,1),
('Smirnoff Red','Vodka clásico 750ml',3,2,4,'ImagenProducto12.png',350,550,50,1),
('Grey Goose','Vodka premium francés',3,2,4,'ImagenProducto13.png',1500,2300,40,1),
('Ciroc','Vodka premium 750ml',3,2,4,'ImagenProducto14.png',1750,2600,50,1),

('Jose Cuervo Especial','Tequila reposado',4,2,4,'ImagenProducto15.png',600,950,50,1),
('Don Julio Reposado','Tequila premium',4,2,4,'ImagenProducto16.png',2200,3400,30,1),
('Patron Silver','Tequila premium',4,2,4,'ImagenProducto17.png',2400,3600,30,1),

('Bombay Sapphire','Ginebra premium',5,2,4,'ImagenProducto18.png',720,1100,50,1),
('Tanqueray London Dry','Ginebra importada',5,2,4,'ImagenProducto19.png',780,1200,50,1),

('Casillero del Diablo','Vino tinto chileno',6,1,5,'ImagenProducto20.png',280,450,50,1),
('Santa Rita 120','Vino tinto',6,1,5,'ImagenProducto21.png',240,390,50,1),
('Concha y Toro Reservado','Vino tinto',6,1,5,'ImagenProducto22.png',300,480,50,1),

('Gato Negro Blanco','Vino blanco',7,1,5,'ImagenProducto23.png',260,420,50,1),
('Frontera Chardonnay','Vino blanco',7,1,5,'ImagenProducto24.png',290,460,50,1),

('Toña','Cerveza nacional lata',8,2,7,'ImagenProducto25.png',28,45,300,1),
('Victoria Frost','Cerveza nacional',8,2,7,'ImagenProducto26.png',30,48,300,1),
('Heineken','Cerveza importada',8,2,8,'ImagenProducto27.png',42,65,200,1),
('Corona Extra','Cerveza mexicana',8,2,8,'ImagenProducto28.png',45,70,300,1),

('Baileys Irish Cream','Licor cremoso',9,2,6,'ImagenProducto29.png',780,1250,30,1),
('Red Bull','Bebida energética',10,1,7,'ImagenProducto30.png',55,85,200,1);


-- COMPRAS

INSERT INTO compras
(numero_factura_compra, id_proveedor, id_usuario, fecha_compra,
 subtotal_compra, descuento_compra, impuesto_compra, total_compra,
 estado_compra, id_caja, id_cuenta, id_metodo_pago, id_tipo_factura)
VALUES

('COMP-0001',1,1,'2026-01-03 09:00:00',22040,0,2204,24244,1,1,NULL,3,1),
('COMP-0002',2,1,'2026-02-02 10:00:00',56580,500,5608,61688,1,2,NULL,2,1),
('COMP-0003',3,1,'2026-03-01 09:00:00',37500,0,3750,41250,1,3,NULL,3,1),
('COMP-0004',4,2,'2026-04-02 10:00:00',11950,0,1195,13145,1,4,NULL,1,1),
('COMP-0005',5,2,'2026-05-02 11:00:00',53700,0,5370,59070,1,5,NULL,2,1);

-- DETALLE COMPRAS
INSERT INTO detalle_compras
(id_compra, id_producto, cantidad_compra, precio_unitario_compra, subtotal_detalle_compra)
VALUES

-- COMP-0001
(1,1,12,950,11400),
(1,6,20,420,8400),
(1,25,80,28,2240),

-- COMP-0002 (AJUSTADO A INVENTARIO REAL)
(2,2,5,6800,34000),
(2,8,16,380,6080),
(2,12,18,350,6300),
(2,18,10,720,7200),
(2,26,100,30,3000),

-- COMP-0003
(3,7,10,1450,14500),
(3,13,8,1500,12000),
(3,16,5,2200,11000),

-- COMP-0004
(4,20,20,280,5600),
(4,21,15,240,3600),
(4,30,50,55,2750),

-- COMP-0005 (CORREGIDO COMPLETO A INVENTARIO)
(5,5,20,700,14000),
(5,7,10,1450,14500),
(5,13,8,1500,12000),
(5,17,4,2400,9600),
(5,21,15,240,3600);
-- =========================================
-- VENTAS
-- =========================================

INSERT INTO ventas
(numero_factura, fecha_venta, id_cliente, id_usuario, id_caja, id_cuenta, subtotal_venta, impuesto_venta, total_venta, estado_venta, id_metodo_pago, monto_recibido, vuelto, moneda)
VALUES

-- ENERO
('VTA-20260103-00001','2026-01-03 11:20:00',2,2,1,1,1200,120,1320,1,1,1500,180,'NIO'),
('VTA-20260105-00002','2026-01-05 14:10:00',3,1,1,2,2500,250,2750,1,2,3000,250,'NIO'),
('VTA-20260106-00003','2026-01-06 19:40:00',4,2,2,1,1800,180,1980,1,1,2000,20,'NIO'),
('VTA-20260108-00004','2026-01-08 20:00:00',5,2,2,2,3400,340,3740,1,3,4000,260,'NIO'),
('VTA-20260110-00005','2026-01-10 16:15:00',6,1,3,3,950,95,1045,1,1,1200,155,'NIO'),
('VTA-20260112-00006','2026-01-12 18:30:00',7,2,3,1,4200,420,4620,1,2,5000,380,'NIO'),
('VTA-20260115-00007','2026-01-15 21:10:00',8,2,4,2,5100,510,5610,1,4,6000,390,'NIO'),
('VTA-20260118-00008','2026-01-18 13:45:00',9,1,4,1,2750,275,3025,1,1,3500,475,'NIO'),
('VTA-20260120-00009','2026-01-20 10:05:00',2,2,5,3,1600,160,1760,1,2,2000,240,'NIO'),
('VTA-20260124-00010','2026-01-24 22:00:00',3,1,5,4,3900,390,4290,1,3,4500,210,'NIO'),

-- FEBRERO
('VTA-20260202-00011','2026-02-02 09:30:00',4,2,1,1,2100,210,2310,1,1,2500,190,'NIO'),
('VTA-20260204-00012','2026-02-04 15:20:00',5,1,1,2,3200,320,3520,1,2,4000,480,'NIO'),
('VTA-20260206-00013','2026-02-06 17:55:00',6,2,2,1,1450,145,1595,1,1,2000,405,'NIO'),
('VTA-20260208-00014','2026-02-08 20:45:00',7,2,2,2,4800,480,5280,1,4,5500,220,'NIO'),
('VTA-20260210-00015','2026-02-10 12:10:00',8,1,3,3,2600,260,2860,1,3,3000,140,'NIO'),
('VTA-20260212-00016','2026-02-12 18:00:00',9,2,3,1,5300,530,5830,1,1,6000,170,'NIO'),
('VTA-20260215-00017','2026-02-15 21:25:00',2,1,4,2,1750,175,1925,1,2,2000,75,'NIO'),
('VTA-20260218-00018','2026-02-18 11:40:00',3,2,4,1,2950,295,3245,1,1,3500,255,'NIO'),
('VTA-20260221-00019','2026-02-21 14:50:00',4,2,5,3,4100,410,4510,1,3,5000,490,'NIO'),
('VTA-20260225-00020','2026-02-25 19:35:00',5,1,5,4,1350,135,1485,1,4,1500,15,'NIO'),

-- MARZO
('VTA-20260301-00021','2026-03-01 10:00:00',6,2,1,1,2200,220,2420,1,1,2500,80,'NIO'),
('VTA-20260303-00022','2026-03-03 13:20:00',7,1,1,2,3600,360,3960,1,2,4000,40,'NIO'),
('VTA-20260305-00023','2026-03-05 18:10:00',8,2,2,1,4900,490,5390,1,3,5500,110,'NIO'),
('VTA-20260307-00024','2026-03-07 20:50:00',9,2,2,2,1850,185,2035,1,1,2500,465,'NIO'),
('VTA-20260310-00025','2026-03-10 16:40:00',2,1,3,3,2750,275,3025,1,2,3200,175,'NIO'),
('VTA-20260312-00026','2026-03-12 19:00:00',3,2,3,1,5100,510,5610,1,4,6000,390,'NIO'),
('VTA-20260315-00027','2026-03-15 11:35:00',4,1,4,2,1450,145,1595,1,1,2000,405,'NIO'),
('VTA-20260318-00028','2026-03-18 15:10:00',5,2,4,1,3900,390,4290,1,3,4500,210,'NIO'),
('VTA-20260322-00029','2026-03-22 21:45:00',6,2,5,3,2800,280,3080,1,2,3500,420,'NIO'),
('VTA-20260326-00030','2026-03-26 17:15:00',7,1,5,4,1750,175,1925,1,1,2000,75,'NIO'),

-- ABRIL
('VTA-20260402-00031','2026-04-02 09:45:00',8,2,1,1,2400,240,2640,1,1,3000,360,'NIO'),
('VTA-20260404-00032','2026-04-04 13:50:00',9,1,1,2,4200,420,4620,1,2,5000,380,'NIO'),
('VTA-20260406-00033','2026-04-06 18:25:00',2,2,2,1,1600,160,1760,1,3,2000,240,'NIO'),
('VTA-20260408-00034','2026-04-08 20:15:00',3,2,2,2,5200,520,5720,1,4,6000,280,'NIO'),
('VTA-20260410-00035','2026-04-10 12:40:00',4,1,3,3,3100,310,3410,1,1,3500,90,'NIO'),
('VTA-20260412-00036','2026-04-12 16:55:00',5,2,3,1,1950,195,2145,1,2,2500,355,'NIO'),
('VTA-20260415-00037','2026-04-15 19:30:00',6,1,4,2,4600,460,5060,1,3,5500,440,'NIO'),
('VTA-20260418-00038','2026-04-18 21:00:00',7,2,4,1,2850,285,3135,1,1,3500,365,'NIO'),
('VTA-20260422-00039','2026-04-22 11:25:00',8,2,5,3,3750,375,4125,1,2,4500,375,'NIO'),
('VTA-20260426-00040','2026-04-26 18:05:00',9,1,5,4,1400,140,1540,1,4,2000,460,'NIO'),

-- MAYO
('VTA-20260501-00041','2026-05-01 12:15:00',2,2,1,1,1500,150,1650,1,1,2000,350,'NIO'),
('VTA-20260501-00042','2026-05-01 13:40:00',3,2,1,2,2800,280,3080,1,2,3080,0,'NIO'),
('VTA-20260502-00043','2026-05-02 18:20:00',4,2,2,2,950,95,1045,1,1,1200,155,'NIO'),
('VTA-20260503-00044','2026-05-03 20:10:00',5,1,3,3,4200,420,4620,1,3,4620,0,'NIO'),
('VTA-20260504-00045','2026-05-04 16:00:00',6,2,4,1,3600,360,3960,1,1,4000,40,'NIO'),
('VTA-20260505-00046','2026-05-05 21:30:00',7,2,5,4,1850,185,2035,1,2,2035,0,'NIO'),
('VTA-20260505-00047','2026-05-05 22:00:00',8,1,5,2,920,92,1012,1,4,1012,0,'NIO'),
('VTA-20260506-00048','2026-05-06 19:25:00',9,2,5,1,5400,540,5940,1,1,6000,60,'NIO'),
('VTA-20260508-00049','2026-05-08 12:30:00',6,2,4,1,2750,275,3025,1,2,3200,175,'NIO'),
('VTA-20260511-00050','2026-05-11 20:30:00',5,2,4,1,4800,480,5280,1,2,6000,720,'NIO');

-- =========================================
-- DETALLE VENTAS
-- =========================================

INSERT INTO detalle_ventas
(id_venta, id_producto, cantidad_venta, precio_unitario_venta, subtotal_detalle_venta, porcentaje_impuesto, monto_impuesto)
VALUES

-- VTA-01
(1,1,1,1450,1450,10,145),

-- VTA-02
(2,2,1,9500,9500,10,950),
(2,25,4,45,180,10,18),

-- VTA-03
(3,6,1,650,650,10,65),
(3,30,3,85,255,0,0),

-- VTA-04
(4,16,1,3400,3400,10,340),
(4,18,1,1100,1100,10,110),

-- VTA-05
(5,13,1,2300,2300,10,230),
(5,27,10,65,650,10,65),

-- VTA-06
(6,20,2,450,900,15,135),
(6,23,2,420,840,15,126),

-- VTA-07
(7,11,1,850,850,10,85),

-- VTA-08
(8,7,2,2200,4400,10,440),
(8,29,1,1250,1250,10,125),

-- VTA-09
(9,1,1,1450,1450,10,145),

-- VTA-10
(10,2,1,9500,9500,10,950),
(10,25,2,45,90,10,9),

-- VTA-11
(11,6,1,650,650,10,65),
(11,30,4,85,340,0,0),

-- VTA-12
(12,16,1,3400,3400,10,340),
(12,18,1,1100,1100,10,110),

-- VTA-13
(13,13,1,2300,2300,10,230),
(13,27,8,65,520,10,52),

-- VTA-14
(14,20,2,450,900,15,135),
(14,23,2,420,840,15,126),

-- VTA-15
(15,11,1,850,850,10,85),

-- VTA-16
(16,7,2,2200,4400,10,440),
(16,29,1,1250,1250,10,125),

-- VTA-17
(17,1,1,1450,1450,10,145),

-- VTA-18
(18,2,1,9500,9500,10,950),
(18,25,3,45,135,10,14),

-- VTA-19
(19,6,1,650,650,10,65),
(19,30,2,85,170,0,0),

-- VTA-20
(20,16,1,3400,3400,10,340),

-- VTA-21
(21,18,1,1100,1100,10,110),

-- VTA-22
(22,13,1,2300,2300,10,230),

-- VTA-23
(23,27,6,65,390,10,39),

-- VTA-24
(24,7,1,2200,2200,10,220),

-- VTA-25
(25,29,1,1250,1250,10,125),

-- VTA-26
(26,20,2,450,900,15,135),

-- VTA-27
(27,23,2,420,840,15,126),

-- VTA-28
(28,11,1,850,850,10,85),

-- VTA-29
(29,6,1,650,650,10,65),

-- VTA-30
(30,30,3,85,255,0,0),

-- VTA-31
(31,1,1,1450,1450,10,145),

-- VTA-32
(32,2,1,9500,9500,10,950),

-- VTA-33
(33,25,2,45,90,10,9),

-- VTA-34
(34,16,1,3400,3400,10,340),

-- VTA-35
(35,18,1,1100,1100,10,110),

-- VTA-36
(36,13,1,2300,2300,10,230),

-- VTA-37
(37,27,5,65,325,10,33),

-- VTA-38
(38,7,2,2200,4400,10,440),

-- VTA-39
(39,29,1,1250,1250,10,125),

-- VTA-40
(40,20,2,450,900,15,135),

-- VENTA 41 (VTA-20260501-00041)
(41,1,1,1450,1450,10,145),
(41,27,2,65,130,10,13),

-- VENTA 42
(42,2,1,9500,9500,10,950),

-- VENTA 43
(43,11,1,850,850,10,85),

-- VENTA 44
(44,6,3,650,1950,10,195),

-- VENTA 45
(45,16,1,3400,3400,10,340),

-- VENTA 46
(46,27,10,65,650,10,65),

-- VENTA 47
(47,29,1,1250,1250,10,125),

-- VENTA 48
(48,7,2,2200,4400,10,440),

-- VENTA 49
(49,29,1,1250,1250,10,125),

-- VENTA 50
(50,20,2,450,900,15,135);

-- =========================================
-- MOVIMIENTOS INVENTARIO (50)
-- =========================================

INSERT INTO movimientos_inventario
(id_producto, tipo_movimiento, cantidad_movimiento, stock_resultante, motivo_movimiento, id_referencia, tipo_referencia, precio_unitario, fecha_movimiento, id_usuario)
VALUES

-- =====================================
-- ENERO
-- =====================================

(1,'ENTRADA',12,42,'COMP-0001',1,'COMPRA',950,'2026-01-03 09:00:00',1),
(1,'SALIDA',1,41,'VTA-20260103-00001',1,'VENTA',1450,'2026-01-03 11:20:00',2),

(6,'ENTRADA',20,80,'COMP-0001',1,'COMPRA',420,'2026-01-05 10:00:00',1),
(6,'SALIDA',1,79,'VTA-20260105-00002',2,'VENTA',650,'2026-01-05 14:10:00',2),

(11,'ENTRADA',12,56,'COMP-0001',1,'COMPRA',520,'2026-01-08 11:00:00',1),
(11,'SALIDA',1,55,'VTA-20260106-00003',3,'VENTA',850,'2026-01-06 19:40:00',2),

(15,'ENTRADA',8,33,'COMP-0001',1,'COMPRA',600,'2026-01-10 09:30:00',1),
(15,'SALIDA',1,32,'VTA-20260108-00004',4,'VENTA',950,'2026-01-08 20:00:00',2),

(25,'ENTRADA',80,380,'COMP-0001',1,'COMPRA',28,'2026-01-12 08:45:00',1),
(25,'SALIDA',2,378,'VTA-20260110-00005',5,'VENTA',45,'2026-01-10 16:15:00',2),

-- =====================================
-- FEBRERO
-- =====================================

(2,'ENTRADA',5,13,'COMP-0002',2,'COMPRA',6800,'2026-02-02 10:00:00',1),
(2,'SALIDA',1,12,'VTA-20260112-00006',6,'VENTA',9500,'2026-01-12 18:30:00',2),

(8,'ENTRADA',16,70,'COMP-0002',2,'COMPRA',380,'2026-02-04 09:20:00',1),
(8,'SALIDA',2,68,'VTA-20260115-00007',7,'VENTA',580,'2026-01-15 21:10:00',2),

(12,'ENTRADA',18,70,'COMP-0002',2,'COMPRA',350,'2026-02-06 11:10:00',1),
(12,'SALIDA',2,68,'VTA-20260118-00008',8,'VENTA',550,'2026-01-18 13:45:00',2),

(18,'ENTRADA',10,31,'COMP-0002',2,'COMPRA',720,'2026-02-08 10:15:00',1),
(18,'SALIDA',1,30,'VTA-20260120-00009',9,'VENTA',1100,'2026-01-20 10:05:00',2),

(26,'ENTRADA',100,390,'COMP-0002',2,'COMPRA',30,'2026-02-10 08:00:00',1),
(26,'SALIDA',5,385,'VTA-20260124-00010',10,'VENTA',48,'2026-01-24 22:00:00',2),

-- =====================================
-- MARZO
-- =====================================

(3,'ENTRADA',8,40,'COMP-0003',3,'COMPRA',1100,'2026-03-01 09:00:00',1),
(3,'SALIDA',1,39,'VTA-20260202-00011',11,'VENTA',1650,'2026-02-02 09:30:00',2),

(9,'ENTRADA',4,18,'COMP-0003',3,'COMPRA',1800,'2026-03-03 10:40:00',1),
(9,'SALIDA',1,17,'VTA-20260204-00012',12,'VENTA',2800,'2026-02-04 15:20:00',2),

(14,'ENTRADA',6,16,'COMP-0003',3,'COMPRA',1750,'2026-03-05 11:00:00',1),
(14,'SALIDA',1,15,'VTA-20260206-00013',13,'VENTA',2600,'2026-02-06 17:55:00',2),

(20,'ENTRADA',15,45,'COMP-0003',3,'COMPRA',280,'2026-03-07 09:30:00',1),
(20,'SALIDA',1,44,'VTA-20260208-00014',14,'VENTA',450,'2026-02-08 20:45:00',2),

(27,'ENTRADA',50,220,'COMP-0003',3,'COMPRA',42,'2026-03-10 08:50:00',1),
(27,'SALIDA',3,217,'VTA-20260210-00015',15,'VENTA',65,'2026-02-10 12:10:00',2),

-- =====================================
-- ABRIL
-- =====================================

(4,'ENTRADA',12,54,'COMP-0004',4,'COMPRA',850,'2026-04-02 10:00:00',1),
(4,'SALIDA',1,53,'VTA-20260212-00016',16,'VENTA',1350,'2026-02-12 18:00:00',2),

(10,'ENTRADA',10,45,'COMP-0004',4,'COMPRA',450,'2026-04-04 11:00:00',1),
(10,'SALIDA',1,44,'VTA-20260215-00017',17,'VENTA',700,'2026-02-15 21:25:00',2),

(16,'ENTRADA',4,15,'COMP-0004',4,'COMPRA',2200,'2026-04-06 09:40:00',1),
(16,'SALIDA',1,14,'VTA-20260218-00018',18,'VENTA',3400,'2026-02-18 11:40:00',2),

(22,'ENTRADA',10,36,'COMP-0004',4,'COMPRA',300,'2026-04-08 10:30:00',1),
(22,'SALIDA',1,35,'VTA-20260221-00019',19,'VENTA',480,'2026-02-21 14:50:00',2),

(28,'ENTRADA',70,220,'COMP-0004',4,'COMPRA',45,'2026-04-10 08:20:00',1),
(28,'SALIDA',2,218,'VTA-20260225-00020',20,'VENTA',70,'2026-02-25 19:35:00',2),

-- =====================================
-- MAYO
-- =====================================

(5,'ENTRADA',20,58,'COMP-0005',5,'COMPRA',700,'2026-05-02 11:00:00',1),
(5,'SALIDA',1,57,'VTA-20260301-00021',21,'VENTA',1100,'2026-03-01 10:00:00',2),

(7,'ENTRADA',10,28,'COMP-0005',5,'COMPRA',1450,'2026-05-03 15:00:00',1),
(7,'SALIDA',1,27,'VTA-20260303-00022',22,'VENTA',2200,'2026-03-03 13:20:00',2),

(13,'ENTRADA',8,20,'COMP-0005',5,'COMPRA',1500,'2026-05-03 15:00:00',1),
(13,'SALIDA',2,18,'VTA-20260305-00023',23,'VENTA',2300,'2026-03-05 18:10:00',2),

(17,'ENTRADA',4,11,'COMP-0005',5,'COMPRA',2400,'2026-05-03 15:00:00',1),
(17,'SALIDA',1,10,'VTA-20260307-00024',24,'VENTA',3600,'2026-03-07 20:50:00',2),

(21,'ENTRADA',15,43,'COMP-0005',5,'COMPRA',240,'2026-05-04 09:20:00',1),
(21,'SALIDA',1,42,'VTA-20260310-00025',25,'VENTA',390,'2026-03-10 16:40:00',2);

-- =========================================
-- MOVIMIENTOS GASTOS
-- =========================================

INSERT INTO movimientos_gastos
(id_gasto, monto, origen, id_caja, id_cuenta, fecha, id_usuario, observacion)
VALUES
(1,3500,'CUENTA',NULL,2,'2026-05-01 09:00:00',1,'Pago energía'),
(2,1800,'CUENTA',NULL,2,'2026-05-02 09:00:00',1,'Pago internet'),
(3,12000,'CUENTA',NULL,3,'2026-05-05 17:00:00',1,'Pago salario'),
(4,8500,'CUENTA',NULL,4,'2026-05-03 11:00:00',1,'Pago alquiler'),
(5,2200,'CAJA',5,NULL,'2026-05-10 13:00:00',1,'Publicidad Facebook');

-- =========================================
-- TRANSFERENCIAS
-- =========================================

INSERT INTO transferencias_caja_cuenta
(id_caja_origen, id_cuenta_destino, monto, concepto, id_usuario, fecha)
VALUES
(1,2,5000,'Depósito ventas día 1',1,'2026-05-01 22:10:00'),
(2,3,6500,'Depósito ventas día 2',1,'2026-05-02 22:15:00'),
(3,4,7200,'Depósito ventas día 3',1,'2026-05-03 22:05:00');

-- =========================================
-- MOVIMIENTOS CAJA
-- =========================================

INSERT INTO movimientos_caja
(id_caja, tipo_movimiento_caja, concepto_movimiento_caja, monto_movimiento_caja,
 fecha_movimiento_caja, id_usuario, id_transferencia, id_referencia, id_cuenta_destino)
VALUES

(1,'INGRESO','Venta VTA-20260501-00041',1650,'2026-05-01 12:15:00',2,NULL,41,NULL),
(1,'SALIDA','Transferencia bancaria',5000,'2026-05-01 22:10:00',1,1,NULL,2),

(2,'INGRESO','Venta VTA-20260502-00043',1045,'2026-05-02 18:20:00',2,NULL,43,NULL),
(2,'SALIDA','Transferencia bancaria',6500,'2026-05-02 22:15:00',1,2,NULL,3),

(3,'INGRESO','Venta VTA-20260503-00044',4620,'2026-05-03 20:10:00',1,NULL,44,NULL),
(3,'SALIDA','Transferencia bancaria',7200,'2026-05-03 22:05:00',1,3,NULL,4);

-- =========================================
-- MOVIMIENTOS CUENTAS
-- =========================================

INSERT INTO movimientos_cuentas
(id_cuenta, tipo_movimiento, monto, descripcion, fecha, id_usuario, id_transferencia)
VALUES
(2,'INGRESO',5000,'Transferencia caja día 1','2026-05-01 22:10:00',1,1),
(3,'INGRESO',6500,'Transferencia caja día 2','2026-05-02 22:15:00',1,2),
(4,'INGRESO',7200,'Transferencia caja día 3','2026-05-03 22:05:00',1,3),
(2,'SALIDA',3500,'Pago energía','2026-05-01 09:00:00',1,NULL),
(3,'SALIDA',12000,'Pago salario','2026-05-05 17:00:00',1,NULL);

-- =========================================
-- DEVOLUCIONES
-- =========================================

INSERT INTO devoluciones
(id_venta, id_producto, id_usuario, cantidad, monto, motivo, fecha)
VALUES
(5,27,1,2,130,'Cliente recibió producto equivocado','2026-05-05 10:00:00'),
(6,20,2,1,450,'Botella dañada','2026-05-06 15:00:00');
-- =========================================================
-- MEDIDAS DE PRODUCTOS
-- Se ejecuta despues de las migraciones y seeders base.
-- Los productos 1-30 son los insertados en este mismo archivo.
-- =========================================================

INSERT INTO tipos_medidas
(id_tipo_medida, nombre_tipo_medida, descripcion_tipo_medida, estado_tipo_medida)
VALUES
(1,'Volumen','Contenido neto de bebidas y licores',1),
(2,'Presentacion','Unidades y paquetes de venta',1);

INSERT INTO medidas
(id_medida, id_tipo_medida, nombre_medida, abreviatura_medida, orden_medida, estado_medida)
VALUES
(1,1,'250 mililitros','250 ml',1,1),
(2,1,'330 mililitros','330 ml',2,1),
(3,1,'355 mililitros','355 ml',3,1),
(4,1,'375 mililitros','375 ml',4,1),
(5,1,'500 mililitros','500 ml',5,1),
(6,1,'700 mililitros','700 ml',6,1),
(7,1,'750 mililitros','750 ml',7,1),
(8,1,'1 litro','1 L',8,1),
(9,1,'1.75 litros','1.75 L',9,1),
(10,2,'Unidad','und',1,1),
(11,2,'Paquete de 6','pack 6',2,1);

UPDATE productos SET id_medida = 7 WHERE id_producto BETWEEN 1 AND 24;
UPDATE productos SET id_medida = 3 WHERE id_producto BETWEEN 25 AND 28;
UPDATE productos SET id_medida = 7 WHERE id_producto = 29;
UPDATE productos SET id_medida = 1 WHERE id_producto = 30;

-- Relaciona cada metodo de pago con la cuenta donde se registra.
INSERT INTO metodo_pago_cuenta
(id_metodo_pago, id_cuenta, estado, created_at, updated_at)
VALUES
(1,1,1,'2026-01-01 00:00:00','2026-01-01 00:00:00'),
(2,2,1,'2026-01-01 00:00:00','2026-01-01 00:00:00'),
(3,2,1,'2026-01-01 00:00:00','2026-01-01 00:00:00'),
(4,2,1,'2026-01-01 00:00:00','2026-01-01 00:00:00');

-- =========================================================
-- VARIACIONES, IMAGENES Y STOCK POR MEDIDA
-- Productos seleccionados para mostrar ejemplos de volumen/color.
-- =========================================================

INSERT INTO tallas (id_talla, talla, estado_talla) VALUES
(1,'250 ml',1),
(2,'330 ml',1),
(3,'355 ml',1),
(4,'375 ml',1),
(5,'500 ml',1),
(6,'700 ml',1),
(7,'750 ml',1),
(8,'1 L',1),
(9,'1.75 L',1);

INSERT INTO producto_variaciones
(id_variacion, id_producto, color, estado_variacion)
VALUES
(1,1,'Ambar',1),
(2,2,'Ambar',1),
(3,3,'Ambar',1),
(4,4,'Ambar',1),
(5,5,'Ambar',1),
(6,6,'Ambar',1),
(7,7,'Ambar oscuro',1),
(8,8,'Ambar',1),
(9,9,'Ambar',1),
(10,10,'Ambar oscuro',1),
(11,11,'Transparente',1),
(12,12,'Transparente',1),
(13,13,'Transparente',1),
(14,14,'Transparente',1),
(15,15,'Dorado',1),
(16,16,'Dorado',1),
(17,17,'Transparente',1),
(18,18,'Transparente',1),
(19,19,'Transparente',1),
(20,20,'Tinto',1),
(21,21,'Tinto',1),
(22,22,'Tinto',1),
(23,23,'Blanco',1),
(24,24,'Blanco',1),
(25,25,'Rubia',1),
(26,26,'Rubia',1),
(27,27,'Rubia',1),
(28,28,'Rubia',1),
(29,29,'Crema',1),
(30,30,'Dorado',1);

INSERT INTO variacion_imagenes (id_variacion, imagen, orden) VALUES
(1,'imagenes/productos/ImagenProducto1.png',1),
(2,'imagenes/productos/ImagenProducto2.png',1),
(3,'imagenes/productos/ImagenProducto3.png',1),
(4,'imagenes/productos/ImagenProducto4.png',1),
(5,'imagenes/productos/ImagenProducto5.png',1),
(6,'imagenes/productos/ImagenProducto6.png',1),
(7,'imagenes/productos/ImagenProducto7.png',1),
(8,'imagenes/productos/ImagenProducto8.png',1),
(9,'imagenes/productos/ImagenProducto9.png',1),
(10,'imagenes/productos/ImagenProducto10.png',1),
(11,'imagenes/productos/ImagenProducto11.png',1),
(12,'imagenes/productos/ImagenProducto12.png',1),
(13,'imagenes/productos/ImagenProducto13.png',1),
(14,'imagenes/productos/ImagenProducto14.png',1),
(15,'imagenes/productos/ImagenProducto15.png',1),
(16,'imagenes/productos/ImagenProducto16.png',1),
(17,'imagenes/productos/ImagenProducto17.png',1),
(18,'imagenes/productos/ImagenProducto18.png',1),
(19,'imagenes/productos/ImagenProducto19.png',1),
(20,'imagenes/productos/ImagenProducto20.png',1),
(21,'imagenes/productos/ImagenProducto21.png',1),
(22,'imagenes/productos/ImagenProducto22.png',1),
(23,'imagenes/productos/ImagenProducto23.png',1),
(24,'imagenes/productos/ImagenProducto24.png',1),
(25,'imagenes/productos/ImagenProducto25.png',1),
(26,'imagenes/productos/ImagenProducto26.png',1),
(27,'imagenes/productos/ImagenProducto27.png',1),
(28,'imagenes/productos/ImagenProducto28.png',1),
(29,'imagenes/productos/ImagenProducto29.png',1),
(30,'imagenes/productos/ImagenProducto30.png',1);

INSERT INTO variacion_tallas (id_variacion, id_talla, stock) VALUES
(1,7,30),
(2,7,20),
(3,7,50),
(4,7,50),
(5,7,40),
(6,7,40),
(7,7,50),
(8,7,50),
(9,7,50),
(10,7,50),
(11,7,50),
(12,7,50),
(13,7,40),
(14,7,50),
(15,7,50),
(16,7,30),
(17,7,30),
(18,7,50),
(19,7,50),
(20,7,50),
(21,7,50),
(22,7,50),
(23,7,50),
(24,7,50),
(25,3,300),
(26,3,300),
(27,3,200),
(28,3,300),
(29,7,30),
(30,1,200);
