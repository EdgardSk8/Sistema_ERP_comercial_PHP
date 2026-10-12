<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class rol_permisoSeeder extends Seeder
{
    public function run(): void
    {
        $rolesPermisos = [];

        $permisos = DB::table('permisos')->get();

        /* ═════════════ ADMIN (ROL 1) ═════════════ */
        foreach ($permisos as $permiso) {
            $rolesPermisos[] = [
                'id_rol' => 1,
                'id_permiso' => $permiso->id_permiso,
                'fecha_asignacion_rol_permiso' => now()
            ];
        }

        /* ═════════════ CAJERO (ROL 2) ═════════════ */
        $permisosCajero = [

            /* VENTAS */
            'vista_ventas',
            'mostrar_ventas',
            'mostrar_detalle_ventas',
            'anular_ventas',
            'vista_cuentas_por_cobrar',
            'mostrar_cuentas_por_cobrar',
            'registrar_pagos_venta',

            /* MOVIMIENTO CAJAS*/ 
            'vista_movimiento_cajas',
            'mostrar_movimiento_cajas',

            /* FACTURACION */
            'vista_facturacion',
            'usar_facturacion',
            'abrir_caja',
            'cerrar_caja',
            //'verificar_caja',

            /* CLIENTES */
            'vista_clientes',
            'mostrar_clientes',

            /* PRODUCTOS */
            'vista_productos',
            'mostrar_productos',

            /* CAJAS */
            'vista_cajas',
            'mostrar_cajas',
        ];

        foreach ($permisosCajero as $nombrePermiso) {

            $permiso = DB::table('permisos')
                ->where('nombre_permiso', $nombrePermiso)
                ->first();

            if ($permiso) {
                $rolesPermisos[] = [
                    'id_rol' => 2,
                    'id_permiso' => $permiso->id_permiso,
                    'fecha_asignacion_rol_permiso' => now()
                ];
            }
        }

        /* ═════════════ BODEGUERO (ROL 3) ═════════════ */
        $permisosBodeguero = [

            /* UBICACIONES */
            'vista_ubicaciones',
            'mostrar_ubicaciones',
            'crear_ubicaciones',
            'editar_ubicaciones',
            'actualizar_ubicaciones',
            'cambiar_estado_ubicaciones',

            /* PRODUCTOS */
            'vista_productos',
            'mostrar_productos',
            'crear_productos',
            'editar_productos',
            'actualizar_productos',

            /* VARIACIONES Y DETALLE DE PRODUCTOS */
            'vista_producto_variaciones',
            'vista_producto_variaciones_detalle',
            'mostrar_producto_variaciones',
            'mostrar_productos_select_variaciones',
            'crear_producto_variaciones',
            'editar_producto_variaciones',
            'actualizar_producto_variaciones',
            'cambiar_estado_producto_variaciones',
            'eliminar_producto_variaciones',
            'mostrar_variacion_imagenes',
            'crear_variacion_imagenes',
            'editar_variacion_imagenes',
            'actualizar_variacion_imagenes',
            'cambiar_orden_variacion_imagenes',
            'eliminar_variacion_imagenes',
            'mostrar_variacion_tallas',
            'crear_variacion_tallas',
            'editar_variacion_tallas',
            'actualizar_variacion_tallas',
            'eliminar_variacion_tallas',
            'mostrar_tallas',
            'vista_tallas',
            'crear_tallas',
            'editar_tallas',
            'actualizar_tallas',
            'cambiar_estado_tallas',
            'eliminar_tallas',

            /* MOVIMIENTO INVENTARIO */
            'vista_movimientos_inventario',
            'mostrar_movimiento_inventario',

            /* COMPRAS */
            'vista_compras',
            'mostrar_compras',

            /* PROVEEDORES */
            'vista_proveedores',
            'mostrar_proveedores',
        ];

        foreach ($permisosBodeguero as $nombrePermiso) {

            $permiso = DB::table('permisos')
                ->where('nombre_permiso', $nombrePermiso)
                ->first();

            if ($permiso) {
                $rolesPermisos[] = [
                    'id_rol' => 3,
                    'id_permiso' => $permiso->id_permiso,
                    'fecha_asignacion_rol_permiso' => now()
                ];
            }
        }

        /* ═════════════ SUPERVISOR (ROL 4) ═════════════ */
        $permisosSupervisor = [

            'vista_dashboard',
            'mostrar_dashboard_ventas',
            'mostrar_dashboard_movimiento_inventario',

            'vista_ventas',
            'mostrar_ventas',
            'mostrar_detalle_ventas',
            'vista_cuentas_por_cobrar',
            'mostrar_cuentas_por_cobrar',

            'vista_cajas',
            'mostrar_cajas',
            'vista_movimientos_cajas',

            'vista_movimientos_inventario',
            'mostrar_movimiento_inventario',

            'vista_reportes',
            'mostrar_reportes',
        ];

        foreach ($permisosSupervisor as $nombrePermiso) {

            $permiso = DB::table('permisos')
                ->where('nombre_permiso', $nombrePermiso)
                ->first();

            if ($permiso) {
                $rolesPermisos[] = [
                    'id_rol' => 4,
                    'id_permiso' => $permiso->id_permiso,
                    'fecha_asignacion_rol_permiso' => now()
                ];
            }
        }

        /* ═════════════ CONTADOR (ROL 5) ═════════════ */
        $permisosContador = [

            /* DASHBOARD */
            'vista_dashboard',
            'mostrar_dashboard_ventas',
            'mostrar_dashboard_movimiento_inventario',

            /* REPORTES */
            'vista_reportes',
            'mostrar_reportes',


            /* GASTOS */
            'vista_gastos',
            'mostrar_gastos',
            'crear_gastos',
            'editar_gastos',
            'actualizar_gastos',
            'pagar_gastos',

            /* CUENTAS */
            'vista_cuentas',
            'mostrar_cuentas',
            'crear_cuentas',
            'transferir_cuentas',
            'editar_cuentas',
            'actualizar_cuentas',
            'cambiar_estado_cuentas',

            /* MOVIMIENTO CUENTAS */
            'vista_movimientos_cuentas',
            'mostrar_movimiento_cuentas',

            /* TRANSFERENCIA CAJA CUENTA */
            'vista_transferenciacajacuenta',
            'mostrar_transferencias_caja_cuenta',
            'transferir_caja_cuentas',
            'mostrar_detalle_transferencias_caja_cuenta'
        ];

        foreach ($permisosContador as $nombrePermiso) {

            $permiso = DB::table('permisos')
                ->where('nombre_permiso', $nombrePermiso)
                ->first();

            if ($permiso) {
                $rolesPermisos[] = [
                    'id_rol' => 5,
                    'id_permiso' => $permiso->id_permiso,
                    'fecha_asignacion_rol_permiso' => now()
                ];
            }
        }

        DB::table('rol_permiso')->insertOrIgnore($rolesPermisos);
    }
}
