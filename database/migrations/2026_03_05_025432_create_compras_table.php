<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateComprasTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {

        Schema::create('compras', function (Blueprint $table) {
            $table->increments('id_compra');

            $table->string('numero_factura_compra', 50)->nullable();

            $table->unsignedInteger('id_proveedor')->nullable();
            $table->unsignedInteger('id_usuario');

            $table->dateTime('fecha_compra')->useCurrent();

            $table->decimal('subtotal_compra', 10, 2);
            $table->decimal('descuento_compra', 10, 2)->nullable();
            $table->decimal('impuesto_compra', 10, 2)->nullable();
            $table->decimal('total_compra', 10, 2);

            $table->boolean('estado_compra')->default(true);

            // 👇 NUEVOS CAMPOS (clave)
            $table->unsignedInteger('id_caja')->nullable();
            $table->unsignedInteger('id_cuenta')->nullable();
            $table->unsignedInteger('id_metodo_pago')->nullable();
            $table->unsignedInteger('id_tipo_factura')->nullable();

            // relaciones
            $table->foreign('id_proveedor')
                ->references('id_proveedor')
                ->on('proveedores')
                ->nullOnDelete();

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
                ->onDelete('cascade');

            $table->foreign('id_metodo_pago')
                ->references('id_metodo_pago')
                ->on('metodos_pago')
                ->onDelete('cascade');

            $table->foreign('id_tipo_factura')
                ->references('id_tipo_factura')
                ->on('tipos_factura')
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
        Schema::dropIfExists('compras');
    }
}
