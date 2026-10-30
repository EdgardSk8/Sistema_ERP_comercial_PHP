<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Genera el usuario del cliente a partir de su nombre (ej. "Tellez Software" -> tellez_software)
     * en lugar del código aleatorio u_xxxxxxxxxxxx.
     */
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
create or replace function public.web_crear_cliente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_nombre text;
    v_usuario text;
    v_base text;
    v_intento int := 0;
begin
    v_nombre := coalesce(
        nullif(trim(new.raw_user_meta_data->>'nombre_cliente'), ''),
        nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
        nullif(trim(new.raw_user_meta_data->>'name'), ''),
        split_part(coalesce(new.email, ''), '@', 1),
        'Cliente'
    );

    v_usuario := nullif(trim(new.raw_user_meta_data->>'usuario_cliente'), '');

    if v_usuario is null then
        v_base := lower(v_nombre);
        v_base := translate(v_base, 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc');
        v_base := regexp_replace(v_base, '[^a-z0-9]+', '_', 'g');
        v_base := trim(both '_' from v_base);
        v_base := left(coalesce(nullif(v_base, ''), 'cliente'), 50);

        v_usuario := v_base;

        loop
            exit when not exists (
                select 1 from public.clientes c where c.usuario_cliente = v_usuario
            );

            v_intento := v_intento + 1;
            v_usuario := left(v_base, 48) || v_intento::text;
            exit when v_intento >= 90;
        end loop;
    end if;

    insert into public.clientes (auth_id, nombre_cliente, correo_cliente, usuario_cliente, estado_cliente)
    values (new.id, v_nombre, lower(new.email), left(v_usuario, 60), true)
    on conflict (auth_id) do nothing;

    return new;
exception when unique_violation then
    insert into public.clientes (auth_id, nombre_cliente, correo_cliente, usuario_cliente, estado_cliente)
    values (
        new.id,
        v_nombre,
        lower(new.email),
        left(coalesce(left(v_base, 40), 'cliente') || '_' || substr(replace(new.id::text, '-', ''), 1, 6), 60),
        true
    )
    on conflict (auth_id) do nothing;

    return new;
end;
$$;
SQL);

        DB::unprepared(<<<'SQL'
do $$
declare
    r record;
    base text;
    candidato text;
    intento int;
begin
    for r in
        select id_cliente, nombre_cliente
        from public.clientes
        where usuario_cliente ~ '^u_[0-9a-f]{12}$'
    loop
        base := lower(coalesce(r.nombre_cliente, ''));
        base := translate(base, 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc');
        base := regexp_replace(base, '[^a-z0-9]+', '_', 'g');
        base := trim(both '_' from base);
        base := left(coalesce(nullif(base, ''), 'cliente'), 50);

        candidato := base;
        intento := 0;

        while exists (
            select 1 from public.clientes c
            where c.usuario_cliente = candidato and c.id_cliente <> r.id_cliente
        ) loop
            intento := intento + 1;
            candidato := left(base, 48) || intento::text;
            exit when intento > 90;
        end loop;

        update public.clientes set usuario_cliente = candidato where id_cliente = r.id_cliente;
    end loop;
end;
$$;
SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
create or replace function public.web_crear_cliente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_nombre text;
    v_usuario text;
begin
    v_nombre := coalesce(
        nullif(trim(new.raw_user_meta_data->>'nombre_cliente'), ''),
        nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
        nullif(trim(new.raw_user_meta_data->>'name'), ''),
        split_part(coalesce(new.email, ''), '@', 1),
        'Cliente'
    );

    v_usuario := coalesce(
        nullif(trim(new.raw_user_meta_data->>'usuario_cliente'), ''),
        'u_' || substr(replace(new.id::text, '-', ''), 1, 12)
    );

    begin
        insert into public.clientes (auth_id, nombre_cliente, correo_cliente, usuario_cliente, estado_cliente)
        values (new.id, v_nombre, lower(new.email), left(v_usuario, 60), true)
        on conflict (auth_id) do nothing;
    exception when unique_violation then
        insert into public.clientes (auth_id, nombre_cliente, correo_cliente, usuario_cliente, estado_cliente)
        values (new.id, v_nombre, lower(new.email), 'u_' || substr(replace(new.id::text, '-', ''), 1, 12), true)
        on conflict (auth_id) do nothing;
    end;

    return new;
end;
$$;
SQL);
    }
};
