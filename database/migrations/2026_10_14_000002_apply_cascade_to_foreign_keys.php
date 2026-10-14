<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Aplica ON DELETE CASCADE a las claves foráneas que quedaron sin
     * comportamiento explícito en las migraciones originales (ya ejecutadas).
     *
     * Nota: las FK con nullOnDelete() / onDelete('set null') / onDelete('restrict')
     * se mantienen tal cual, porque su comportamiento fue definido a propósito.
     */
    public function up(): void
    {
        foreach ($this->clavesForaneas() as [$tabla, $columna, $tablaReferencia, $columnaReferencia]) {
            Schema::table($tabla, function (Blueprint $table) use ($columna, $tablaReferencia, $columnaReferencia) {
                $table->dropForeign([$columna]);
                $table->foreign($columna)
                    ->references($columnaReferencia)
                    ->on($tablaReferencia)
                    ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations: devuelve las FK a su comportamiento por defecto (restrict).
     */
    public function down(): void
    {
        foreach ($this->clavesForaneas() as [$tabla, $columna, $tablaReferencia, $columnaReferencia]) {
            Schema::table($tabla, function (Blueprint $table) use ($columna, $tablaReferencia, $columnaReferencia) {
                $table->dropForeign([$columna]);
                $table->foreign($columna)
                    ->references($columnaReferencia)
                    ->on($tablaReferencia);
            });
        }
    }

    /**
     * [tabla, columna, tabla de referencia, columna de referencia]
     */
    private function clavesForaneas(): array
    {
        return [
            ['usuarios', 'id_rol_usuario', 'roles', 'id_rol'],
            ['rol_permiso', 'id_rol', 'roles', 'id_rol'],
            ['rol_permiso', 'id_permiso', 'permisos', 'id_permiso'],
            ['productos', 'id_categoria', 'categoria', 'id_categoria'],
            ['productos', 'id_impuesto', 'impuestos', 'id_impuesto'],
            ['cajas', 'id_usuario', 'usuarios', 'id_usuario'],
            ['compras', 'id_usuario', 'usuarios', 'id_usuario'],
            ['compras', 'id_caja', 'cajas', 'id_caja'],
            ['compras', 'id_cuenta', 'cuentas', 'id_cuenta'],
            ['compras', 'id_metodo_pago', 'metodos_pago', 'id_metodo_pago'],
            ['compras', 'id_tipo_factura', 'tipos_factura', 'id_tipo_factura'],
            ['ventas', 'id_cliente', 'clientes', 'id_cliente'],
            ['ventas', 'id_usuario', 'usuarios', 'id_usuario'],
            ['ventas', 'id_caja', 'cajas', 'id_caja'],
            ['ventas', 'id_metodo_pago', 'metodos_pago', 'id_metodo_pago'],
            ['detalle_compras', 'id_compra', 'compras', 'id_compra'],
            ['detalle_compras', 'id_producto', 'productos', 'id_producto'],
            ['detalle_ventas', 'id_venta', 'ventas', 'id_venta'],
            ['detalle_ventas', 'id_producto', 'productos', 'id_producto'],
            ['transferencias_caja_cuenta', 'id_cuenta_destino', 'cuentas', 'id_cuenta'],
            ['transferencias_caja_cuenta', 'id_usuario', 'usuarios', 'id_usuario'],
            ['movimientos_caja', 'id_caja', 'cajas', 'id_caja'],
            ['movimientos_caja', 'id_usuario', 'usuarios', 'id_usuario'],
            ['movimientos_caja', 'id_cuenta_destino', 'cuentas', 'id_cuenta'],
            ['movimientos_caja', 'id_transferencia', 'transferencias_caja_cuenta', 'id_transferencia'],
            ['movimientos_caja', 'id_pago_venta', 'pagos_venta', 'id_pago_venta'],
            ['gastos', 'id_tipo_gasto', 'tipo_gasto', 'id_tipo_gasto'],
            ['movimientos_cuentas', 'id_cuenta', 'cuentas', 'id_cuenta'],
            ['movimientos_cuentas', 'id_usuario', 'usuarios', 'id_usuario'],
            ['movimientos_cuentas', 'id_transferencia', 'transferencias_caja_cuenta', 'id_transferencia'],
            ['movimientos_cuentas', 'id_pago_venta', 'pagos_venta', 'id_pago_venta'],
            ['movimientos_gastos', 'id_gasto', 'gastos', 'id_gasto'],
            ['movimientos_gastos', 'id_usuario', 'usuarios', 'id_usuario'],
            ['movimientos_gastos', 'id_caja', 'cajas', 'id_caja'],
            ['movimientos_gastos', 'id_cuenta', 'cuentas', 'id_cuenta'],
            ['planes_pago', 'id_venta', 'ventas', 'id_venta'],
            ['planes_pago', 'id_usuario', 'usuarios', 'id_usuario'],
            ['cuotas_venta', 'id_plan_pago', 'planes_pago', 'id_plan_pago'],
            ['pagos_venta', 'id_venta', 'ventas', 'id_venta'],
            ['pagos_venta', 'id_metodo_pago', 'metodos_pago', 'id_metodo_pago'],
            ['pagos_venta', 'id_caja', 'cajas', 'id_caja'],
            ['pagos_venta', 'id_cuenta', 'cuentas', 'id_cuenta'],
            ['pagos_venta', 'id_usuario', 'usuarios', 'id_usuario'],
            ['aplicaciones_pago_cuota', 'id_pago_venta', 'pagos_venta', 'id_pago_venta'],
            ['aplicaciones_pago_cuota', 'id_cuota', 'cuotas_venta', 'id_cuota'],
        ];
    }
};
