<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateVentasTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('ventas', function (Blueprint $table) {
            $table->increments('id_venta');

            $table->string('numero_factura', 50)->unique();

            $table->dateTime('fecha_venta')->useCurrent();

            $table->unsignedInteger('id_cliente')->nullable();
            $table->unsignedInteger('id_usuario');

            // 👇 IMPORTANTE: ahora puede ser null
            $table->unsignedInteger('id_caja')->nullable();

            // 👇 NUEVO (clave para pagos no efectivos)
            $table->unsignedInteger('id_cuenta')->nullable();

            $table->decimal('subtotal_venta', 10, 2);
            $table->decimal('impuesto_venta', 10, 2);
            $table->decimal('total_venta', 10, 2);

            $table->boolean('estado_venta')->default(true);

            $table->unsignedInteger('id_metodo_pago');

            $table->decimal('monto_recibido', 10, 2)->nullable();
            $table->decimal('vuelto', 10, 2)->nullable();
            $table->string('moneda', 10)->default('NIO');

            // relaciones
            $table->foreign('id_cliente')
                ->references('id_cliente')
                ->on('clientes')
                ->onDelete('cascade');

            $table->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
                ->onDelete('cascade');

            $table->foreign('id_caja')
                ->references('id_caja')
                ->on('cajas')
                ->onDelete('cascade');

            $table->foreign('id_cuenta')
                ->references('id_cuenta')
                ->on('cuentas')
                ->nullOnDelete();

            $table->foreign('id_metodo_pago')
                ->references('id_metodo_pago')
                ->on('metodos_pago')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('ventas');
    }
}
