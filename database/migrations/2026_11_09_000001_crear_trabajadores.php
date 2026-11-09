<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Trabajadores / repartidores de la tienda.
     *
     * Cada cliente puede enviar una solicitud desde "Sé parte de nosotros".
     * La tienda la revisa en el ERP, asigna un porcentaje de comisión propio
     * y la aprueba. Al aprobarla, el cliente pasa a rol "trabajador".
     */
    public function up(): void
    {
        Schema::create('trabajadores', function (Blueprint $table) {
            $table->increments('id_trabajador');

            $table->unsignedInteger('id_cliente')->unique();
            $table->uuid('auth_id')->nullable();

            /* pendiente · aprobado · rechazado · suspendido */
            $table->string('estado_trabajador', 20)->default('pendiente');

            /* Datos personales */
            $table->string('nombre_trabajador', 150);
            $table->string('cedula_trabajador', 20);
            $table->string('telefono_trabajador', 20);
            $table->string('correo_trabajador', 150)->nullable();
            $table->text('direccion_trabajador')->nullable();
            $table->date('fecha_nacimiento')->nullable();

            /* Documentos */
            $table->string('licencia_numero', 40);
            $table->date('licencia_vencimiento');
            $table->string('circulacion_numero', 40);
            $table->date('circulacion_vencimiento');
            $table->string('seguro_aseguradora', 100)->nullable();
            $table->string('seguro_numero', 40)->nullable();
            $table->date('seguro_vencimiento')->nullable();

            /* Vehículo y presentación */
            $table->string('vehiculo_marca', 60);
            $table->string('vehiculo_modelo', 60)->nullable();
            $table->smallInteger('vehiculo_anio')->nullable();
            $table->string('vehiculo_placa', 20);
            $table->string('vehiculo_color', 40)->nullable();
            $table->string('color_usuario', 20)->default('#22c55e');

            /* Fotos: perfil y vehículo obligatorias; documentos opcionales. */
            $table->text('foto_perfil');
            $table->text('foto_vehiculo');
            $table->text('foto_licencia')->nullable();
            $table->text('foto_circulacion')->nullable();
            $table->text('foto_seguro')->nullable();

            /* Porcentaje del envío que retiene la tienda. Cada trabajador tiene el suyo. */
            $table->decimal('porcentaje_comision', 5, 2)->default(20);

            $table->boolean('disponible')->default(false);

            $table->text('motivo_rechazo')->nullable();
            $table->text('nota_erp')->nullable();

            $table->dateTime('fecha_solicitud')->useCurrent();
            $table->dateTime('fecha_revision')->nullable();
            $table->dateTime('fecha_actualizacion')->nullable();

            $table->foreign('id_cliente')
                ->references('id_cliente')
                ->on('clientes')
                ->onDelete('cascade');

            $table->index('estado_trabajador', 'idx_trabajadores_estado');
            $table->index('fecha_solicitud', 'idx_trabajadores_fecha');
        });

        Schema::table('clientes', function (Blueprint $table) {
            $table->string('rol_cliente', 20)->default('cliente')->after('estado_cliente');
            $table->index('rol_cliente', 'idx_clientes_rol');
        });

        $permisos = [
            ['nombre_permiso' => 'vista_trabajadores', 'descripcion_permiso' => 'Ver vista de trabajadores', 'modulo_permiso' => 'trabajadores'],
            ['nombre_permiso' => 'mostrar_trabajadores', 'descripcion_permiso' => 'Listar solicitudes de trabajadores', 'modulo_permiso' => 'trabajadores'],
            ['nombre_permiso' => 'actualizar_trabajadores', 'descripcion_permiso' => 'Aprobar, rechazar y editar trabajadores', 'modulo_permiso' => 'trabajadores'],
            ['nombre_permiso' => 'eliminar_trabajadores', 'descripcion_permiso' => 'Eliminar solicitudes de trabajadores', 'modulo_permiso' => 'trabajadores'],
        ];

        foreach ($permisos as $permiso) {
            DB::table('permisos')->insertOrIgnore([
                ...$permiso,
                'estado_permiso' => true,
                'fecha_creacion_permiso' => now(),
            ]);
        }

        $ids = DB::table('permisos')
            ->whereIn('nombre_permiso', array_column($permisos, 'nombre_permiso'))
            ->pluck('id_permiso');

        $idRol = DB::table('roles')->where('nombre_rol', 'Administrador')->value('id_rol') ?? 1;

        foreach ($ids as $idPermiso) {
            DB::table('rol_permiso')->insertOrIgnore([
                'id_rol' => $idRol,
                'id_permiso' => $idPermiso,
                'fecha_asignacion_rol_permiso' => now(),
            ]);
        }
    }

    public function down(): void
    {
        $ids = DB::table('permisos')
            ->whereIn('nombre_permiso', [
                'vista_trabajadores',
                'mostrar_trabajadores',
                'actualizar_trabajadores',
                'eliminar_trabajadores',
            ])
            ->pluck('id_permiso');

        DB::table('rol_permiso')->whereIn('id_permiso', $ids)->delete();
        DB::table('permisos')->whereIn('id_permiso', $ids)->delete();

        Schema::table('clientes', function (Blueprint $table) {
            $table->dropIndex('idx_clientes_rol');
            $table->dropColumn('rol_cliente');
        });

        Schema::dropIfExists('trabajadores');
    }
};
