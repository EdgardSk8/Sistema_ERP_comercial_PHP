<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Escalas de talla (Calzado, Ropa adulto, Ropa niño, Única) para que una
     * misma etiqueta ("40") no choque entre calzado y ropa.
     */
    public function up(): void
    {
        Schema::create('tipos_talla', function (Blueprint $table) {
            $table->increments('id_tipo_talla');
            $table->string('nombre_tipo_talla', 60);
            $table->string('descripcion_tipo_talla', 150)->nullable();
            $table->boolean('estado_tipo_talla')->default(true);

            $table->unique('nombre_tipo_talla', 'tipos_talla_nombre_key');
        });

        Schema::table('tallas', function (Blueprint $table) {
            $table->unsignedInteger('id_tipo_talla')->nullable();
            $table->integer('orden_talla')->nullable();

            $table->foreign('id_tipo_talla')
                ->references('id_tipo_talla')
                ->on('tipos_talla')
                ->nullOnDelete();

            $table->unique(['id_tipo_talla', 'talla'], 'tallas_tipo_nombre_key');
        });

        Schema::table('categoria', function (Blueprint $table) {
            $table->unsignedInteger('id_tipo_talla')->nullable();

            $table->foreign('id_tipo_talla')
                ->references('id_tipo_talla')
                ->on('tipos_talla')
                ->nullOnDelete();
        });

        /* ── Escalas base ────────────────────────────────────── */
        DB::table('tipos_talla')->insert([
            ['nombre_tipo_talla' => 'Calzado', 'descripcion_tipo_talla' => 'Tallas numéricas de zapatos (36 a 44)', 'estado_tipo_talla' => true],
            ['nombre_tipo_talla' => 'Ropa adulto', 'descripcion_tipo_talla' => 'Tallas de ropa para adulto (XS a XXL)', 'estado_tipo_talla' => true],
            ['nombre_tipo_talla' => 'Ropa niño', 'descripcion_tipo_talla' => 'Tallas de ropa para niño', 'estado_tipo_talla' => true],
            ['nombre_tipo_talla' => 'Única', 'descripcion_tipo_talla' => 'Productos de talla única', 'estado_tipo_talla' => true],
        ]);

        /* ── Los registros actuales (36-44) son calzado ───────── */
        $calzado = DB::table('tipos_talla')->where('nombre_tipo_talla', 'Calzado')->value('id_tipo_talla');

        DB::table('tallas')->whereNull('id_tipo_talla')->update(['id_tipo_talla' => $calzado]);

        DB::statement("
            update tallas
            set orden_talla = nullif(regexp_replace(talla, '[^0-9]', '', 'g'), '')::int
            where orden_talla is null and talla ~ '[0-9]'
        ");

        /* ── Cada categoría hereda su escala ──────────────────── */
        $ropa = DB::table('tipos_talla')->where('nombre_tipo_talla', 'Ropa adulto')->value('id_tipo_talla');

        DB::table('categoria')
            ->whereIn('nombre_categoria', ['Zapatos', 'Zapatos Segunda Mano', 'Chinelas', 'Calzado'])
            ->update(['id_tipo_talla' => $calzado]);

        DB::table('categoria')
            ->whereIn('nombre_categoria', ['Ropa', 'Camisetas', 'Pantalones'])
            ->update(['id_tipo_talla' => $ropa]);
    }

    public function down(): void
    {
        Schema::table('categoria', function (Blueprint $table) {
            $table->dropForeign(['id_tipo_talla']);
            $table->dropColumn('id_tipo_talla');
        });

        Schema::table('tallas', function (Blueprint $table) {
            $table->dropUnique('tallas_tipo_nombre_key');
            $table->dropForeign(['id_tipo_talla']);
            $table->dropColumn(['id_tipo_talla', 'orden_talla']);
        });

        Schema::dropIfExists('tipos_talla');
    }
};
