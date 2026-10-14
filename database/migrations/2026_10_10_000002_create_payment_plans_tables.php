<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->unsignedInteger('id_metodo_pago')->nullable()->change();
        });

        Schema::create('planes_pago', function (Blueprint $table) {
            $table->increments('id_plan_pago');
            $table->unsignedInteger('id_venta')->unique();
            $table->unsignedInteger('id_usuario');
            $table->dateTime('fecha_creacion')->useCurrent();

            $table->foreign('id_venta')->references('id_venta')->on('ventas')->onDelete('cascade');
            $table->foreign('id_usuario')->references('id_usuario')->on('usuarios')->onDelete('cascade');
        });

        Schema::create('cuotas_venta', function (Blueprint $table) {
            $table->increments('id_cuota');
            $table->unsignedInteger('id_plan_pago');
            $table->unsignedSmallInteger('numero_cuota');
            $table->date('fecha_vencimiento');
            $table->decimal('monto_cuota', 10, 2);

            $table->unique(['id_plan_pago', 'numero_cuota']);
            $table->foreign('id_plan_pago')->references('id_plan_pago')->on('planes_pago')->onDelete('cascade');
        });

        Schema::create('pagos_venta', function (Blueprint $table) {
            $table->increments('id_pago_venta');
            $table->unsignedInteger('id_venta');
            $table->unsignedInteger('id_metodo_pago');
            $table->unsignedInteger('id_caja')->nullable();
            $table->unsignedInteger('id_cuenta')->nullable();
            $table->unsignedInteger('id_usuario');
            $table->decimal('monto_pago', 10, 2);
            $table->dateTime('fecha_pago')->useCurrent();
            $table->string('referencia_pago', 120)->nullable();

            $table->index(['id_venta', 'fecha_pago']);
            $table->foreign('id_venta')->references('id_venta')->on('ventas')->onDelete('cascade');
            $table->foreign('id_metodo_pago')->references('id_metodo_pago')->on('metodos_pago')->onDelete('cascade');
            $table->foreign('id_caja')->references('id_caja')->on('cajas')->onDelete('cascade');
            $table->foreign('id_cuenta')->references('id_cuenta')->on('cuentas')->onDelete('cascade');
            $table->foreign('id_usuario')->references('id_usuario')->on('usuarios')->onDelete('cascade');
        });

        Schema::create('aplicaciones_pago_cuota', function (Blueprint $table) {
            $table->increments('id_aplicacion_pago_cuota');
            $table->unsignedInteger('id_pago_venta');
            $table->unsignedInteger('id_cuota');
            $table->decimal('monto_aplicado', 10, 2);

            $table->unique(['id_pago_venta', 'id_cuota']);
            $table->foreign('id_pago_venta')->references('id_pago_venta')->on('pagos_venta')->onDelete('cascade');
            $table->foreign('id_cuota')->references('id_cuota')->on('cuotas_venta')->onDelete('cascade');
        });

        Schema::table('movimientos_caja', function (Blueprint $table) {
            $table->unsignedInteger('id_pago_venta')->nullable()->unique();
            $table->foreign('id_pago_venta')->references('id_pago_venta')->on('pagos_venta')->onDelete('cascade');
        });

        Schema::table('movimientos_cuentas', function (Blueprint $table) {
            $table->unsignedInteger('id_pago_venta')->nullable()->unique();
            $table->foreign('id_pago_venta')->references('id_pago_venta')->on('pagos_venta')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('movimientos_cuentas', function (Blueprint $table) {
            $table->dropForeign(['id_pago_venta']);
            $table->dropUnique(['id_pago_venta']);
            $table->dropColumn('id_pago_venta');
        });

        Schema::table('movimientos_caja', function (Blueprint $table) {
            $table->dropForeign(['id_pago_venta']);
            $table->dropUnique(['id_pago_venta']);
            $table->dropColumn('id_pago_venta');
        });

        Schema::dropIfExists('aplicaciones_pago_cuota');
        Schema::dropIfExists('pagos_venta');
        Schema::dropIfExists('cuotas_venta');
        Schema::dropIfExists('planes_pago');

        DB::table('ventas')->whereNull('id_metodo_pago')->update(['id_metodo_pago' => 1]);

        Schema::table('ventas', function (Blueprint $table) {
            $table->unsignedInteger('id_metodo_pago')->nullable(false)->change();
        });
    }
};
