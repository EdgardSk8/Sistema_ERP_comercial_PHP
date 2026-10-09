<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('variacion_tallas', function (Blueprint $table) {
            $table->string('sku', 100)->nullable()->unique();
            $table->decimal('precio_compra', 10, 2)->nullable();
            $table->decimal('precio_venta', 10, 2)->nullable();
        });

        $variantes = DB::table('variacion_tallas as vt')
            ->join('producto_variaciones as pv', 'pv.id_variacion', '=', 'vt.id_variacion')
            ->join('productos as p', 'p.id_producto', '=', 'pv.id_producto')
            ->join('tallas as t', 't.id_talla', '=', 'vt.id_talla')
            ->select('vt.id_variacion_talla', 'p.nombre_producto', 'p.precio_compra', 'p.precio_venta', 'pv.color', 't.talla')
            ->orderBy('vt.id_variacion_talla')
            ->get();

        foreach ($variantes as $variante) {
            $base = substr(Str::upper(Str::slug($variante->nombre_producto . '-' . $variante->color . '-' . $variante->talla)), 0, 85) ?: 'VARIANTE';
            $sku = $base;
            $sufijo = 1;
            while (DB::table('variacion_tallas')->where('sku', $sku)->exists()) {
                $sku = $base . '-' . $sufijo++;
            }

            DB::table('variacion_tallas')
                ->where('id_variacion_talla', $variante->id_variacion_talla)
                ->update([
                    'sku' => $sku,
                    'precio_compra' => $variante->precio_compra,
                    'precio_venta' => $variante->precio_venta,
                ]);
        }

        Schema::table('detalle_compras', function (Blueprint $table) {
            $table->unsignedInteger('id_variacion_talla')->nullable()->after('id_producto');
            $table->string('descripcion_variacion', 120)->nullable()->after('id_variacion_talla');
            $table->string('sku_variacion', 100)->nullable()->after('descripcion_variacion');
            $table->foreign('id_variacion_talla')
                ->references('id_variacion_talla')
                ->on('variacion_tallas')
                ->nullOnDelete();
        });

        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->string('sku_variacion', 100)->nullable()->after('descripcion_variacion');
        });
    }

    public function down(): void
    {
        Schema::table('detalle_compras', function (Blueprint $table) {
            $table->dropForeign(['id_variacion_talla']);
            $table->dropColumn(['id_variacion_talla', 'descripcion_variacion', 'sku_variacion']);
        });

        Schema::table('variacion_tallas', function (Blueprint $table) {
            $table->dropUnique(['sku']);
            $table->dropColumn(['sku', 'precio_compra', 'precio_venta']);
        });

        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->dropColumn('sku_variacion');
        });
    }
};
