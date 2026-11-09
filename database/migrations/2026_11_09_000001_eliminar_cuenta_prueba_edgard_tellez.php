<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Limpieza única de la cuenta de prueba de Edgard Téllez.
 *
 * Se identifican las cuentas por su auth_id, no solo por el nombre de usuario,
 * para que una cuenta nueva con el mismo usuario no se borre al ejecutar
 * migraciones en el futuro. Las filas relacionadas se eliminan por las
 * claves foráneas en cascada de clientes y auth.users.
 */
return new class extends Migration
{
    private const CUENTAS = [
        ['usuario' => 'edgard_tellez1', 'auth_id' => '22d76b87-564e-439b-8eae-58453d2b2994'],
        ['usuario' => 'edgard_tellez', 'auth_id' => 'b028d822-6490-4772-91ef-c7c837bd5f48'],
    ];

    public function up(): void
    {
        if (! Schema::hasTable('clientes')) {
            return;
        }

        DB::transaction(function (): void {
            foreach (self::CUENTAS as $cuenta) {
                DB::table('clientes')
                    ->where('auth_id', $cuenta['auth_id'])
                    ->where('usuario_cliente', $cuenta['usuario'])
                    ->delete();
            }

            if (DB::getDriverName() === 'pgsql' && $this->existeTablaAuthUsuarios()) {
                DB::table('auth.users')
                    ->whereIn('id', array_column(self::CUENTAS, 'auth_id'))
                    ->delete();
            }
        });
    }

    public function down(): void
    {
        // La eliminación de datos personales no se revierte.
    }

    private function existeTablaAuthUsuarios(): bool
    {
        try {
            return (bool) DB::selectOne("select to_regclass('auth.users') as tabla")?->tabla;
        } catch (\Throwable) {
            return false;
        }
    }
};
