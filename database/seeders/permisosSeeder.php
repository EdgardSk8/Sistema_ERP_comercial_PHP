<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class permisosSeeder extends Seeder
{
    public function run()
    {
        DB::table('permisos')->insertOrIgnore([

            /* ═════════════ DASHBOARD ═════════════ */
            ['nombre_permiso' => 'vista_dashboard','descripcion_permiso' => 'Ver vista dashboard','modulo_permiso' => 'dashboard'],
            ['nombre_permiso' => 'mostrar_dashboard_ventas','descripcion_permiso' => 'Ver datos ventas dashboard','modulo_permiso' => 'dashboard'],
            ['nombre_permiso' => 'mostrar_dashboard_movimiento_inventario','descripcion_permiso' => 'Ver movimientos inventario dashboard','modulo_permiso' => 'dashboard'],
            ['nombre_permiso' => 'mostrar_dashboard_ganancias','descripcion_permiso' => 'Ver datos ganancias dashboard','modulo_permiso' => 'dashboard'],

            ['nombre_permiso' => 'mostrar_dashboard_compras','descripcion_permiso' => 'Ver datos compras dashboard','modulo_permiso' => 'dashboard'],
            ['nombre_permiso' => 'mostrar_dashboard_cajas','descripcion_permiso' => 'Ver datos cajas dashboard','modulo_permiso' => 'dashboard'],
            ['nombre_permiso' => 'mostrar_dashboard_tallas','descripcion_permiso' => 'Ver datos tallas dashboard','modulo_permiso' => 'dashboard'],

            /* ═════════════ USUARIOS ═════════════ */
            ['nombre_permiso'=>'vista_usuarios','descripcion_permiso'=>'Ver vista usuarios','modulo_permiso'=>'usuarios'],
            ['nombre_permiso'=>'mostrar_usuarios','descripcion_permiso'=>'Listar usuarios','modulo_permiso'=>'usuarios'],
            ['nombre_permiso'=>'crear_usuarios','descripcion_permiso'=>'Crear usuarios','modulo_permiso'=>'usuarios'],
            ['nombre_permiso'=>'editar_usuarios','descripcion_permiso'=>'Editar usuarios','modulo_permiso'=>'usuarios'],
            ['nombre_permiso'=>'actualizar_usuarios','descripcion_permiso'=>'Actualizar usuarios','modulo_permiso'=>'usuarios'],
            ['nombre_permiso'=>'cambiar_estado_usuarios','descripcion_permiso'=>'Cambiar estado usuarios','modulo_permiso'=>'usuarios'],

            /* ═════════════ ROLES ═════════════ */
            ['nombre_permiso'=>'vista_roles','descripcion_permiso'=>'Ver vista roles','modulo_permiso'=>'roles'],
            ['nombre_permiso'=>'mostrar_roles','descripcion_permiso'=>'Listar roles','modulo_permiso'=>'roles'],
            ['nombre_permiso'=>'crear_roles','descripcion_permiso'=>'Crear roles','modulo_permiso'=>'roles'],
            ['nombre_permiso'=>'editar_roles','descripcion_permiso'=>'Editar roles','modulo_permiso'=>'roles'],
            ['nombre_permiso'=>'actualizar_roles','descripcion_permiso'=>'Actualizar roles','modulo_permiso'=>'roles'],
            ['nombre_permiso'=>'cambiar_estado_roles','descripcion_permiso'=>'Cambiar estado roles','modulo_permiso'=>'roles'],
            
            /* ═════════════ PERMISOS ═════════════ */
            ['nombre_permiso'=>'vista_permisos','descripcion_permiso'=>'Ver vista permisos','modulo_permiso'=>'permisos'],
            ['nombre_permiso'=>'asignar_roles_permisos','descripcion_permiso'=>'Asignar permisos a roles','modulo_permiso'=>'permisos'],
            ['nombre_permiso'=>'mostrar_roles_permisos','descripcion_permiso'=>'Ver roles permisos','modulo_permiso'=>'permisos'],

            /* ═════════════ CATEGORIAS ═════════════ */
            ['nombre_permiso'=>'vista_categorias','descripcion_permiso'=>'Ver vista categorias','modulo_permiso'=>'categorias'],
            ['nombre_permiso'=>'mostrar_categorias','descripcion_permiso'=>'Listar categorias','modulo_permiso'=>'categorias'],
            ['nombre_permiso'=>'crear_categorias','descripcion_permiso'=>'Crear categorias','modulo_permiso'=>'categorias'],
            ['nombre_permiso'=>'editar_categorias','descripcion_permiso'=>'Editar categorias','modulo_permiso'=>'categorias'],
            ['nombre_permiso'=>'actualizar_categorias','descripcion_permiso'=>'Actualizar categorias','modulo_permiso'=>'categorias'],
            ['nombre_permiso'=>'cambiar_estado_categorias','descripcion_permiso'=>'Cambiar estado categorias','modulo_permiso'=>'categorias'],

            /* ═════════════ UBICACIONES ═════════════ */
            ['nombre_permiso'=>'vista_ubicaciones','descripcion_permiso'=>'Ver ubicaciones','modulo_permiso'=>'ubicaciones'],
            ['nombre_permiso'=>'mostrar_ubicaciones','descripcion_permiso'=>'Listar ubicaciones','modulo_permiso'=>'ubicaciones'],
            ['nombre_permiso'=>'crear_ubicaciones','descripcion_permiso'=>'Crear ubicaciones','modulo_permiso'=>'ubicaciones'],
            ['nombre_permiso'=>'editar_ubicaciones','descripcion_permiso'=>'Editar ubicaciones','modulo_permiso'=>'ubicaciones'],
            ['nombre_permiso'=>'actualizar_ubicaciones','descripcion_permiso'=>'Actualizar ubicaciones','modulo_permiso'=>'ubicaciones'],
            ['nombre_permiso'=>'cambiar_estado_ubicaciones','descripcion_permiso'=>'Dar de alta o baja ubicaciones','modulo_permiso'=>'ubicaciones'],

            /* ═════════════ CLIENTES ═════════════ */
            ['nombre_permiso'=>'vista_clientes','descripcion_permiso'=>'Ver vista clientes','modulo_permiso'=>'clientes'],
            ['nombre_permiso'=>'mostrar_clientes','descripcion_permiso'=>'Listar clientes','modulo_permiso'=>'clientes'],
            ['nombre_permiso'=>'crear_clientes','descripcion_permiso'=>'Crear clientes','modulo_permiso'=>'clientes'],
            ['nombre_permiso'=>'editar_clientes','descripcion_permiso'=>'Editar clientes','modulo_permiso'=>'clientes'],
            ['nombre_permiso'=>'actualizar_clientes','descripcion_permiso'=>'Actualizar clientes','modulo_permiso'=>'clientes'],
            ['nombre_permiso'=>'cambiar_estado_clientes','descripcion_permiso'=>'Cambiar estado clientes','modulo_permiso'=>'clientes'],

            /* ═════════════ PROVEEDORES ═════════════ */
            ['nombre_permiso'=>'vista_proveedores','descripcion_permiso'=>'Ver vista proveedores','modulo_permiso'=>'proveedores'],
            ['nombre_permiso'=>'mostrar_proveedores','descripcion_permiso'=>'Listar proveedores','modulo_permiso'=>'proveedores'],
            ['nombre_permiso'=>'crear_proveedores','descripcion_permiso'=>'Crear proveedores','modulo_permiso'=>'proveedores'],
            ['nombre_permiso'=>'editar_proveedores','descripcion_permiso'=>'Editar proveedores','modulo_permiso'=>'proveedores'],
            ['nombre_permiso'=>'actualizar_proveedores','descripcion_permiso'=>'Actualizar proveedores','modulo_permiso'=>'proveedores'],
            ['nombre_permiso'=>'cambiar_estado_proveedores','descripcion_permiso'=>'Cambiar estado proveedores','modulo_permiso'=>'proveedores'],

            /* ═════════════ PRODUCTOS ═════════════ */
            ['nombre_permiso'=>'vista_productos','descripcion_permiso'=>'Ver vista productos','modulo_permiso'=>'productos'],
            ['nombre_permiso'=>'mostrar_productos','descripcion_permiso'=>'Listar productos','modulo_permiso'=>'productos'],
            ['nombre_permiso'=>'crear_productos','descripcion_permiso'=>'Crear productos','modulo_permiso'=>'productos'],
            ['nombre_permiso'=>'editar_productos','descripcion_permiso'=>'Editar productos','modulo_permiso'=>'productos'],
            ['nombre_permiso'=>'actualizar_productos','descripcion_permiso'=>'Actualizar productos','modulo_permiso'=>'productos'],
            ['nombre_permiso'=>'cambiar_estado_productos','descripcion_permiso'=>'Cambiar estado productos','modulo_permiso'=>'productos'],

            /* VARIACIONES DE PRODUCTOS */
            ['nombre_permiso'=>'vista_producto_variaciones','descripcion_permiso'=>'Ver variaciones de productos','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'mostrar_producto_variaciones','descripcion_permiso'=>'Listar variaciones de productos','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'mostrar_productos_select_variaciones','descripcion_permiso'=>'Listar productos para asignar variaciones','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'crear_producto_variaciones','descripcion_permiso'=>'Crear variaciones de productos','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'editar_producto_variaciones','descripcion_permiso'=>'Consultar variaciones para editar','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'actualizar_producto_variaciones','descripcion_permiso'=>'Actualizar variaciones de productos','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'cambiar_estado_producto_variaciones','descripcion_permiso'=>'Cambiar estado de variaciones','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'eliminar_producto_variaciones','descripcion_permiso'=>'Eliminar variaciones de productos','modulo_permiso'=>'producto_variaciones'],

            /* DETALLE DE VARIACIONES */
            ['nombre_permiso'=>'vista_producto_variaciones_detalle','descripcion_permiso'=>'Ver detalle de variaciones','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'mostrar_variacion_imagenes','descripcion_permiso'=>'Listar imágenes de variaciones','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'crear_variacion_imagenes','descripcion_permiso'=>'Agregar imágenes a variaciones','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'editar_variacion_imagenes','descripcion_permiso'=>'Consultar imágenes para editar','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'actualizar_variacion_imagenes','descripcion_permiso'=>'Actualizar imágenes de variaciones','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'cambiar_orden_variacion_imagenes','descripcion_permiso'=>'Cambiar orden de imágenes','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'eliminar_variacion_imagenes','descripcion_permiso'=>'Quitar imágenes de variaciones','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'mostrar_variacion_tallas','descripcion_permiso'=>'Listar tallas asignadas a variaciones','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'crear_variacion_tallas','descripcion_permiso'=>'Asignar tallas a variaciones','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'editar_variacion_tallas','descripcion_permiso'=>'Consultar tallas de variaciones para editar','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'actualizar_variacion_tallas','descripcion_permiso'=>'Actualizar tallas y stock de variaciones','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'eliminar_variacion_tallas','descripcion_permiso'=>'Quitar tallas de variaciones','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'mostrar_tallas','descripcion_permiso'=>'Listar tallas para variaciones','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'vista_tallas','descripcion_permiso'=>'Ver catálogo de tallas','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'crear_tallas','descripcion_permiso'=>'Crear tallas','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'editar_tallas','descripcion_permiso'=>'Consultar tallas para editar','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'actualizar_tallas','descripcion_permiso'=>'Actualizar tallas','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'cambiar_estado_tallas','descripcion_permiso'=>'Cambiar estado de tallas','modulo_permiso'=>'producto_variaciones'],
            ['nombre_permiso'=>'eliminar_tallas','descripcion_permiso'=>'Eliminar tallas','modulo_permiso'=>'producto_variaciones'],

            /* ═════════════ VENTAS ═════════════ */
            ['nombre_permiso'=>'vista_ventas','descripcion_permiso'=>'Ver vista ventas','modulo_permiso'=>'ventas'],
            ['nombre_permiso'=>'mostrar_ventas','descripcion_permiso'=>'Listar ventas','modulo_permiso'=>'ventas'],
            ['nombre_permiso'=>'anular_ventas','descripcion_permiso'=>'Anular ventas','modulo_permiso'=>'ventas'],
            ['nombre_permiso'=>'mostrar_detalle_ventas','descripcion_permiso'=>'Ver detalle ventas','modulo_permiso'=>'ventas'],
            ['nombre_permiso'=>'vista_cuentas_por_cobrar','descripcion_permiso'=>'Ver cuentas por cobrar','modulo_permiso'=>'ventas'],
            ['nombre_permiso'=>'mostrar_cuentas_por_cobrar','descripcion_permiso'=>'Listar cuentas por cobrar','modulo_permiso'=>'ventas'],
            ['nombre_permiso'=>'registrar_pagos_venta','descripcion_permiso'=>'Registrar abonos de ventas a crédito','modulo_permiso'=>'ventas'],

            /* ═════════════ COMPRAS ═════════════ */
            ['nombre_permiso'=>'vista_compras','descripcion_permiso'=>'Ver vista compras','modulo_permiso'=>'compras'],
            ['nombre_permiso'=>'vista_crear_compras','descripcion_permiso'=>'Ver crear compras','modulo_permiso'=>'compras'],
            ['nombre_permiso'=>'mostrar_compras','descripcion_permiso'=>'Listar compras','modulo_permiso'=>'compras'],
            ['nombre_permiso'=>'crear_compras','descripcion_permiso'=>'Crear compras','modulo_permiso'=>'compras'],
            ['nombre_permiso'=>'anular_compras','descripcion_permiso'=>'Anular compras','modulo_permiso'=>'compras'],
            ['nombre_permiso'=>'mostrar_detalle_compras','descripcion_permiso'=>'Detalle compras','modulo_permiso'=>'compras'],

            /* ═════════════ INVENTARIO ═════════════ */
            ['nombre_permiso'=>'vista_movimientos_inventario','descripcion_permiso'=>'Ver vista inventario','modulo_permiso'=>'inventario'],
            ['nombre_permiso'=>'mostrar_movimiento_inventario','descripcion_permiso'=>'Ver movimientos inventario','modulo_permiso'=>'inventario'],

            /* ═════════════ CAJAS ═════════════ */
            ['nombre_permiso'=>'vista_cajas','descripcion_permiso'=>'Ver vista cajas','modulo_permiso'=>'cajas'],
            ['nombre_permiso'=>'mostrar_cajas','descripcion_permiso'=>'Listar cajas','modulo_permiso'=>'cajas'],
            ['nombre_permiso'=>'editar_arqueo_cajas','descripcion_permiso'=>'Registrar y corregir arqueos de caja','modulo_permiso'=>'cajas'],

            /* ═════════════ MOVIMIENTO CAJAS ═════════════ */
            ['nombre_permiso'=>'vista_movimientos_cajas','descripcion_permiso'=>'Ver Movimientos caja','modulo_permiso'=>'movimiento_cajas'],
            ['nombre_permiso'=>'mostrar_movimiento_cajas','descripcion_permiso'=>'Listar Movimientos caja','modulo_permiso'=>'movimiento_cajas'],

            /* ═════════════ FACTURACIÓN (POS) ═════════════ */
            ['nombre_permiso'=>'vista_facturacion','descripcion_permiso'=>'Ver POS','modulo_permiso'=>'facturacion'],
            ['nombre_permiso'=>'usar_facturacion','descripcion_permiso'=>'Usar facturacion POS','modulo_permiso'=>'facturacion'],
            ['nombre_permiso'=>'abrir_caja','descripcion_permiso'=>'Abrir caja desde POS','modulo_permiso'=>'facturacion'],
            ['nombre_permiso'=>'cerrar_caja','descripcion_permiso'=>'Cerrar caja desde POS','modulo_permiso'=>'facturacion'],
            //['nombre_permiso'=>'verificar_caja','descripcion_permiso'=>'Verificar estado caja','modulo_permiso'=>'facturacion'],

            /* ═════════════ CUENTAS ═════════════ */
            ['nombre_permiso'=>'vista_cuentas','descripcion_permiso'=>'Ver cuentas','modulo_permiso'=>'cuentas'],
            ['nombre_permiso'=>'mostrar_cuentas','descripcion_permiso'=>'Listar cuentas','modulo_permiso'=>'cuentas'],
            ['nombre_permiso'=>'crear_cuentas','descripcion_permiso'=>'Crear cuentas','modulo_permiso'=>'cuentas'],
            ['nombre_permiso'=>'editar_cuentas','descripcion_permiso'=>'Editar cuentas','modulo_permiso'=>'cuentas'],
            ['nombre_permiso'=>'actualizar_cuentas','descripcion_permiso'=>'Actualizar cuentas','modulo_permiso'=>'cuentas'],
            ['nombre_permiso'=>'cambiar_estado_cuentas','descripcion_permiso'=>'Cambiar estado cuentas','modulo_permiso'=>'cuentas'],
            ['nombre_permiso'=>'transferir_cuentas','descripcion_permiso'=>'Transferir entre cuentas','modulo_permiso'=>'cuentas'],

            /* ═════════════ MOVIMIENTO CUENTAS ═════════════ */
            ['nombre_permiso'=>'vista_movimientos_cuentas','descripcion_permiso'=>'Ver Movimientos cuentas','modulo_permiso'=>'movimiento_cuentas'],
            ['nombre_permiso'=>'movimiento_cuentas','descripcion_permiso'=>'Listar Movimientos cuentas','modulo_permiso'=>'movimiento_cuentas'],
            ['nombre_permiso'=>'mostrar_movimiento_cuentas','descripcion_permiso'=>'Ver movimientos cuentas','modulo_permiso'=>'movimiento_cuentas'],

            /* ═════════════ TRANSFERENCIAS ═════════════ */
            ['nombre_permiso'=>'vista_transferenciacajacuenta','descripcion_permiso'=>'Ver transferencias','modulo_permiso'=>'transferencias'],
            ['nombre_permiso'=>'mostrar_transferencias_caja_cuenta','descripcion_permiso'=>'Listar transferencias','modulo_permiso'=>'transferencias'],
            ['nombre_permiso'=>'transferir_caja_cuentas','descripcion_permiso'=>'Transferir caja a cuenta','modulo_permiso'=>'transferencias'],
            ['nombre_permiso'=>'mostrar_detalle_transferencias_caja_cuenta','descripcion_permiso'=>'Detalle transferencias','modulo_permiso'=>'transferencias'],

            /* ═════════════ GASTOS ═════════════ */
            ['nombre_permiso'=>'vista_gastos','descripcion_permiso'=>'Ver gastos','modulo_permiso'=>'gastos'],
            ['nombre_permiso'=>'mostrar_gastos','descripcion_permiso'=>'Listar gastos','modulo_permiso'=>'gastos'],
            ['nombre_permiso'=>'crear_gastos','descripcion_permiso'=>'Crear gastos','modulo_permiso'=>'gastos'],
            ['nombre_permiso'=>'editar_gastos','descripcion_permiso'=>'Editar gastos','modulo_permiso'=>'gastos'],
            ['nombre_permiso'=>'actualizar_gastos','descripcion_permiso'=>'Actualizar gastos','modulo_permiso'=>'gastos'],
            ['nombre_permiso'=>'pagar_gastos','descripcion_permiso'=>'Pagar gastos','modulo_permiso'=>'gastos'],

            /* ═════════════ MOVIMIENTO GASTOS ═════════════ */
            ['nombre_permiso'=>'vista_movimientos_gastos','descripcion_permiso'=>'Ver Movimiento gastos','modulo_permiso'=>'movimiento_gastos'],
            ['nombre_permiso'=>'mostrar_movimientos_gastos','descripcion_permiso'=>'Listar Movimiento gastos','modulo_permiso'=>'movimiento_gastos'],
            ['nombre_permiso'=>'mostrar_detalle_gastos','descripcion_permiso'=>'Detalle gastos','modulo_permiso'=>'movimiento_gastos'],
            ['nombre_permiso'=>'editar_movimiento_gastos','descripcion_permiso'=>'Editar movimiento gasto','modulo_permiso'=>'movimiento_gastos'],

            /* ═════════════ TIPOS GASTO ═════════════ */
            ['nombre_permiso'=>'vista_tipos_gasto','descripcion_permiso'=>'Ver tipos gasto','modulo_permiso'=>'tipos_gasto'],
            ['nombre_permiso'=>'mostrar_tipos_gasto','descripcion_permiso'=>'Listar tipos gasto','modulo_permiso'=>'tipos_gasto'],
            ['nombre_permiso'=>'crear_tipos_gasto','descripcion_permiso'=>'Crear tipos gasto','modulo_permiso'=>'tipos_gasto'],
            ['nombre_permiso'=>'editar_tipos_gasto','descripcion_permiso'=>'Editar tipos gasto','modulo_permiso'=>'tipos_gasto'],
            ['nombre_permiso'=>'actualizar_tipos_gasto','descripcion_permiso'=>'Actualizar tipos gasto','modulo_permiso'=>'tipos_gasto'],
            ['nombre_permiso'=>'cambiar_estado_tipos_gasto','descripcion_permiso'=>'Cambiar estado tipos gasto','modulo_permiso'=>'tipos_gasto'],

            /* ═════════════ METODOS PAGO ═════════════ */

            ['nombre_permiso'=>'vista_metodos_pago','descripcion_permiso'=>'Ver metodos pago','modulo_permiso'=>'metodos_pago'],
            ['nombre_permiso'=>'mostrar_metodos_pago','descripcion_permiso'=>'Listar metodos pago','modulo_permiso'=>'metodos_pago'],
            ['nombre_permiso'=>'crear_metodos_pago','descripcion_permiso'=>'Crear metodos pago','modulo_permiso'=>'metodos_pago'],
            ['nombre_permiso'=>'editar_metodos_pago','descripcion_permiso'=>'Editar metodos pago','modulo_permiso'=>'metodos_pago'],
            ['nombre_permiso'=>'actualizar_metodos_pago','descripcion_permiso'=>'Actualizar metodos pago','modulo_permiso'=>'metodos_pago'],
            ['nombre_permiso'=>'cambiar_estado_metodos_pago','descripcion_permiso'=>'Cambiar estado metodos pago','modulo_permiso'=>'metodos_pago'],

            /* ═════════════ METODOS PAGO CUENTAS ═════════════ */

            ['nombre_permiso'=>'vista_metodos_pago_cuenta','descripcion_permiso'=>'Ver referencias de pago','modulo_permiso'=>'metodos_pago_cuenta'],
            ['nombre_permiso'=>'mostrar_metodos_pago_cuenta','descripcion_permiso'=>'Listar referencias de pago','modulo_permiso'=>'metodos_pago_cuenta'],
            ['nombre_permiso'=>'crear_metodos_pago_cuenta','descripcion_permiso'=>'Crear referencias de pago','modulo_permiso'=>'metodos_pago_cuenta'],
            ['nombre_permiso'=>'editar_metodos_pago_cuenta','descripcion_permiso'=>'Editar referencias de pago','modulo_permiso'=>'metodos_pago_cuenta'],
            ['nombre_permiso'=>'actualizar_metodos_pago_cuenta','descripcion_permiso'=>'Actualizar referencias de pago','modulo_permiso'=>'metodos_pago_cuenta'],
            ['nombre_permiso'=>'cambiar_estado_metodos_pago_cuenta','descripcion_permiso'=>'Cambiar estado referencias de pago','modulo_permiso'=>'metodos_pago_cuenta'],

            /* ═════════════ IMPUESTOS ═════════════ */

            ['nombre_permiso'=>'vista_impuestos','descripcion_permiso'=>'Ver impuestos','modulo_permiso'=>'impuestos'],
            ['nombre_permiso'=>'mostrar_impuestos','descripcion_permiso'=>'Listar impuestos','modulo_permiso'=>'impuestos'],
            ['nombre_permiso'=>'crear_impuestos','descripcion_permiso'=>'Crear impuestos','modulo_permiso'=>'impuestos'],
            ['nombre_permiso'=>'editar_impuestos','descripcion_permiso'=>'Editar impuestos','modulo_permiso'=>'impuestos'],
            ['nombre_permiso'=>'actualizar_impuestos','descripcion_permiso'=>'Actualizar impuestos','modulo_permiso'=>'impuestos'],
            ['nombre_permiso'=>'cambiar_estado_impuestos','descripcion_permiso'=>'Cambiar estado impuestos','modulo_permiso'=>'impuestos'],

            /* ═════════════ CREDENCIALES ═════════════ */
            ['nombre_permiso'=>'vista_credenciales','descripcion_permiso'=>'Ver credenciales','modulo_permiso'=>'credenciales'],
            ['nombre_permiso'=>'mostrar_credenciales','descripcion_permiso'=>'Mostrar credenciales','modulo_permiso'=>'credenciales'],
            ['nombre_permiso'=>'editar_credenciales','descripcion_permiso'=>'Editar credenciales','modulo_permiso'=>'credenciales'],
            ['nombre_permiso'=>'actualizar_credenciales','descripcion_permiso'=>'Actualizar credenciales','modulo_permiso'=>'credenciales'],

            /* ═════════════ LOGIN / SISTEMA ═════════════ */
            ['nombre_permiso' => 'vista_respaldo','descripcion_permiso' => 'Ver Respaldo','modulo_permiso' => 'sistema'],
            ['nombre_permiso' => 'exportar_respaldo','descripcion_permiso' => 'Realizar backup','modulo_permiso' => 'sistema'],
            ['nombre_permiso' => 'importar_respaldo','descripcion_permiso' => 'Importar backup','modulo_permiso' => 'sistema'],

            /* ═════════════ REPORTES ═════════════ */
            ['nombre_permiso' => 'vista_reportes','descripcion_permiso' => 'Ver Reportes','modulo_permiso' => 'reportes'],
            ['nombre_permiso' => 'mostrar_reportes','descripcion_permiso' => 'Mostrar Reportes','modulo_permiso' => 'reportes'],

            /* ═════════════ TIPOS MEDIDAS ═════════════ */

            ['nombre_permiso' => 'vista_tipos_medidas','descripcion_permiso' => 'Ver Tipos de Medidas','modulo_permiso' => 'tipos_medidas'],
            ['nombre_permiso' => 'mostrar_tipos_medidas','descripcion_permiso' => 'Mostrar Tipos de Medidas','modulo_permiso' => 'tipos_medidas'],
            ['nombre_permiso' => 'crear_tipos_medidas','descripcion_permiso' => 'Crear Tipos de Medidas','modulo_permiso' => 'tipos_medidas'],
            ['nombre_permiso' => 'editar_tipos_medidas','descripcion_permiso' => 'Editar Tipos de Medidas','modulo_permiso' => 'tipos_medidas'],
            ['nombre_permiso' => 'actualizar_tipos_medidas','descripcion_permiso' => 'Actualizar Tipos de Medidas','modulo_permiso' => 'tipos_medidas'],
            ['nombre_permiso' => 'cambiar_estado_tipos_medidas','descripcion_permiso' => 'Cambiar estado Tipos de Medidas','modulo_permiso' => 'tipos_medidas'],

            /* ═════════════ MEDIDAS ═════════════ */

            ['nombre_permiso' => 'vista_medidas','descripcion_permiso' => 'Ver Medidas','modulo_permiso' => 'medidas'],
            ['nombre_permiso' => 'mostrar_medidas','descripcion_permiso' => 'Mostrar Medidas','modulo_permiso' => 'medidas'],
            ['nombre_permiso' => 'crear_medidas','descripcion_permiso' => 'Crear Medidas','modulo_permiso' => 'medidas'],
            ['nombre_permiso' => 'editar_medidas','descripcion_permiso' => 'Editar Medidas','modulo_permiso' => 'medidas'],
            ['nombre_permiso' => 'actualizar_medidas','descripcion_permiso' => 'Actualizar Medidas','modulo_permiso' => 'medidas'],
            ['nombre_permiso' => 'cambiar_estado_medidas','descripcion_permiso' => 'Cambiar estado Medidas','modulo_permiso' => 'medidas'],


        ]);
    }
}
