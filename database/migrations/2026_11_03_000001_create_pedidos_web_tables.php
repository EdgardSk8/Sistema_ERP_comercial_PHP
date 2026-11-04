<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pedidos web · estados del pedido y del pago.
     *
     * Flujo: solicitado → aceptado / rechazado → preparando →
     * enviado / listo_retiro → entregado. Más cancelado y devuelto.
     * El pago se guarda aparte: pendiente, en_revision, pagado,
     * parcial y reembolsado.
     */
    public function up(): void
    {
        Schema::create('pedidos_web', function (Blueprint $table) {
            $table->increments('id_pedido');

            /* WEB-000001 (lo genera el trigger de Supabase). */
            $table->string('numero_pedido', 20)->nullable()->unique();

            $table->unsignedInteger('id_cliente');
            $table->unsignedInteger('id_venta')->nullable();

            $table->dateTime('fecha_pedido')->useCurrent();

            $table->string('estado_pedido', 20)->default('solicitado');
            $table->string('estado_pago', 20)->default('pendiente');
            $table->string('metodo_pago_web', 20)->default('efectivo');

            $table->decimal('subtotal_pedido', 10, 2)->default(0);
            $table->decimal('descuento_pedido', 10, 2)->default(0);
            $table->decimal('impuesto_pedido', 10, 2)->default(0);
            $table->decimal('costo_envio_pedido', 10, 2)->default(0);
            $table->decimal('total_pedido', 10, 2)->default(0);

            /* Instantánea de la entrega al momento del pedido. */
            $table->text('direccion_entrega')->nullable();
            $table->text('referencia_entrega')->nullable();
            $table->decimal('latitud_entrega', 10, 7)->nullable();
            $table->decimal('longitud_entrega', 10, 7)->nullable();
            $table->decimal('distancia_km', 8, 2)->nullable();
            $table->string('nombre_recibe', 150)->nullable();
            $table->string('telefono_contacto', 20)->nullable();

            $table->text('nota_cliente')->nullable();
            $table->text('nota_negocio')->nullable();

            $table->dateTime('fecha_entrega_estimada')->nullable();
            $table->dateTime('fecha_aceptado')->nullable();
            $table->dateTime('fecha_entregado')->nullable();
            $table->dateTime('fecha_cancelado')->nullable();

            $table->dateTime('fecha_creacion_pedido')->useCurrent();
            $table->dateTime('fecha_actualizacion_pedido')->nullable();

            $table->foreign('id_cliente')
                ->references('id_cliente')
                ->on('clientes')
                ->onDelete('cascade');

            $table->foreign('id_venta')
                ->references('id_venta')
                ->on('ventas')
                ->nullOnDelete();

            $table->index(['id_cliente', 'estado_pedido'], 'idx_pedidos_web_cliente_estado');
            $table->index('estado_pedido', 'idx_pedidos_web_estado');
            $table->index('estado_pago', 'idx_pedidos_web_estado_pago');
        });

        Schema::create('detalle_pedidos_web', function (Blueprint $table) {
            $table->increments('id_detalle_pedido');
            $table->unsignedInteger('id_pedido');

            /* Nulos si el producto se elimina: el pedido conserva su texto. */
            $table->unsignedInteger('id_producto')->nullable();
            $table->unsignedInteger('id_variacion')->nullable();
            $table->unsignedInteger('id_variacion_talla')->nullable();

            $table->string('nombre_producto', 150);
            $table->string('color_producto', 50)->nullable();
            $table->string('talla_producto', 30)->nullable();

            $table->integer('cantidad_pedido');
            $table->decimal('precio_unitario_pedido', 10, 2);
            $table->decimal('subtotal_pedido', 10, 2);

            $table->decimal('porcentaje_impuesto_pedido', 5, 2)->default(0);
            $table->decimal('monto_impuesto_pedido', 10, 2)->default(0);

            $table->foreign('id_pedido')
                ->references('id_pedido')
                ->on('pedidos_web')
                ->onDelete('cascade');

            $table->foreign('id_producto')
                ->references('id_producto')
                ->on('productos')
                ->nullOnDelete();

            $table->foreign('id_variacion')
                ->references('id_variacion')
                ->on('producto_variaciones')
                ->nullOnDelete();

            $table->foreign('id_variacion_talla')
                ->references('id_variacion_talla')
                ->on('variacion_tallas')
                ->nullOnDelete();
        });

        /* Trazabilidad: quién cambió el estado y cuándo. */
        Schema::create('pedido_web_estados', function (Blueprint $table) {
            $table->increments('id_estado_pedido');
            $table->unsignedInteger('id_pedido');

            $table->string('estado_anterior', 20)->nullable();
            $table->string('estado_nuevo', 20);
            $table->string('estado_pago_anterior', 20)->nullable();
            $table->string('estado_pago_nuevo', 20)->nullable();

            /* web = cliente · erp = facturación automática · sistema */
            $table->string('origen', 20)->default('sistema');
            $table->unsignedInteger('id_usuario')->nullable();
            $table->text('nota')->nullable();

            $table->dateTime('fecha_cambio')->useCurrent();

            $table->foreign('id_pedido')
                ->references('id_pedido')
                ->on('pedidos_web')
                ->onDelete('cascade');

            $table->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
                ->nullOnDelete();

            $table->index(['id_pedido', 'fecha_cambio'], 'idx_pedido_web_estados');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pedido_web_estados');
        Schema::dropIfExists('detalle_pedidos_web');
        Schema::dropIfExists('pedidos_web');
    }
};
