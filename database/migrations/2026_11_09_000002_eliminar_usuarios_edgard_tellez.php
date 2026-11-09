<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Limpieza definitiva de las cuentas de Edgard Téllez.
 *
 * La migración anterior quedó anclada a los auth_id existentes. Esta versión
 * elimina cualquier cliente que use esos dos nombres de usuario, aunque haya
 * sido recreado por una sesión antigua, y borra sus cuentas de Supabase Auth.
 *
 * Además impide que vuelva a crearse un cliente con un auth_id que ya no
 * existe en auth.users, que era lo que regeneraba el registro con una sesión
 * antigua del navegador.
 */
return new class extends Migration
{
    private const USUARIOS = ['edgard_tellez', 'edgard_tellez1'];

    private const CORREO = 'osais1000@gmail.com';

    public function up(): void
    {
        if (! Schema::hasTable('clientes')) {
            return;
        }

        DB::transaction(function (): void {
            $authIds = DB::table('clientes')
                ->whereIn('usuario_cliente', self::USUARIOS)
                ->whereNotNull('auth_id')
                ->pluck('auth_id')
                ->unique()
                ->values()
                ->all();

            DB::table('clientes')
                ->whereIn('usuario_cliente', self::USUARIOS)
                ->delete();

            if (DB::getDriverName() !== 'pgsql' || ! $this->existeTablaAuthUsuarios()) {
                return;
            }

            if ($authIds !== []) {
                DB::table('auth.users')->whereIn('id', $authIds)->delete();
            }

            DB::table('auth.users')->where('email', self::CORREO)->delete();

            $this->instalarProteccionAuth();
        });
    }

    public function down(): void
    {
        // La eliminación de datos personales no se revierte.
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::unprepared('drop trigger if exists web_validar_cliente_auth on public.clientes');
        DB::unprepared('drop function if exists public.web_validar_cliente_auth()');
    }

    private function existeTablaAuthUsuarios(): bool
    {
        try {
            return (bool) DB::selectOne("select to_regclass('auth.users') as tabla")?->tabla;
        } catch (\Throwable) {
            return false;
        }
    }

    private function instalarProteccionAuth(): void
    {
        DB::unprepared(<<<'SQL'
create or replace function public.web_validar_cliente_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
    if new.auth_id is not null and not exists (
        select 1 from auth.users u where u.id = new.auth_id
    ) then
        raise exception 'La cuenta de autenticación no existe.' using errcode = '23514';
    end if;

    return new;
end;
$$;
SQL);

        DB::unprepared('drop trigger if exists web_validar_cliente_auth on public.clientes');
        DB::unprepared('create trigger web_validar_cliente_auth before insert or update on public.clientes for each row execute function public.web_validar_cliente_auth()');
    }
};
