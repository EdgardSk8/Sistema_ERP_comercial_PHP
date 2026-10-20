<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Indices para consultas de reportes y cartera que hoy no tienen cobertura:
 *
 * - cuotas_venta.fecha_vencimiento: calcular cuotas vencidas (cartera global).
 * - pagos_venta.fecha_pago: reportes de recaudacion por rango de fechas
 *   (el indice existente empieza por id_venta, no sirve sin filtrar la venta).
 * - movimientos_inventario.fecha_movimiento: reportes de kardex por rango de
 *   fechas sin filtrar producto (el indice existente empieza por id_producto).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasIndex('cuotas_venta', 'idx_cuotas_vencimiento')) {
            Schema::table('cuotas_venta', function (Blueprint $table) {
                $table->index('fecha_vencimiento', 'idx_cuotas_vencimiento');
            });
        }

        if (! Schema::hasIndex('pagos_venta', 'idx_pagos_fecha')) {
            Schema::table('pagos_venta', function (Blueprint $table) {
                $table->index('fecha_pago', 'idx_pagos_fecha');
            });
        }

        if (! Schema::hasIndex('movimientos_inventario', 'idx_kardex_fecha')) {
            Schema::table('movimientos_inventario', function (Blueprint $table) {
                $table->index('fecha_movimiento', 'idx_kardex_fecha');
            });
        }
    }

    public function down(): void
    {
        Schema::table('cuotas_venta', function (Blueprint $table) {
            $table->dropIndex('idx_cuotas_vencimiento');
        });

        Schema::table('pagos_venta', function (Blueprint $table) {
            $table->dropIndex('idx_pagos_fecha');
        });

        Schema::table('movimientos_inventario', function (Blueprint $table) {
            $table->dropIndex('idx_kardex_fecha');
        });
    }
};
