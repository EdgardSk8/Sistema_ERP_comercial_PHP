-- ============================================================
-- Solicitudes de cambio del trabajador · Tienda web
-- Ejecuta este archivo en el SQL Editor de Supabase después de
-- trabajadores.sql y admin-web.sql.
-- ============================================================

-- 1) Tabla de solicitudes
create table if not exists public.trabajador_cambios (
    id_cambio serial primary key,
    id_trabajador integer not null references public.trabajadores (id_trabajador) on delete cascade,
    tipo varchar(30) not null,
    detalle text,
    foto_url text,
    estado varchar(20) not null default 'pendiente',
    respuesta text,
    fecha_solicitud timestamptz not null default now(),
    fecha_revision timestamptz,
    revisado_por integer,
    constraint trabajador_cambios_tipo_check check (
        tipo in ('cambio_vehiculo', 'foto_vehiculo', 'foto_circulacion', 'baja', 'otro')
    ),
    constraint trabajador_cambios_estado_check check (
        estado in ('pendiente', 'aprobado', 'rechazado')
    )
);

create index if not exists trabajador_cambios_trabajador_idx
    on public.trabajador_cambios (id_trabajador, fecha_solicitud desc);

create index if not exists trabajador_cambios_estado_idx
    on public.trabajador_cambios (estado, fecha_solicitud desc);

-- Solo una solicitud pendiente por tipo y trabajador.
create unique index if not exists trabajador_cambios_pendiente_unico
    on public.trabajador_cambios (id_trabajador, tipo)
    where estado = 'pendiente';

alter table public.trabajador_cambios enable row level security;

-- 2) El trabajador consulta sus propias solicitudes.
create or replace function public.web_trabajador_cambios()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_trabajador public.trabajadores%rowtype;
begin
    select t.* into v_trabajador
    from public.trabajadores t
    join public.clientes c on c.id_cliente = t.id_cliente
    where c.auth_id = auth.uid()
    limit 1;

    if v_trabajador.id_trabajador is null then
        return '[]'::jsonb;
    end if;

    return coalesce((
        select jsonb_agg(jsonb_build_object(
            'id_cambio', x.id_cambio,
            'tipo', x.tipo,
            'detalle', x.detalle,
            'foto_url', x.foto_url,
            'estado', x.estado,
            'respuesta', x.respuesta,
            'fecha_solicitud', x.fecha_solicitud,
            'fecha_revision', x.fecha_revision
        ) order by x.fecha_solicitud desc)
        from public.trabajador_cambios x
        where x.id_trabajador = v_trabajador.id_trabajador
    ), '[]'::jsonb);
end;
$$;

revoke all on function public.web_trabajador_cambios() from public;
grant execute on function public.web_trabajador_cambios() to authenticated;

-- 3) El trabajador envía una solicitud (queda pendiente).
create or replace function public.web_solicitar_cambio_trabajador(
    p_tipo text,
    p_detalle text default null,
    p_foto_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_trabajador public.trabajadores%rowtype;
    v_tipo text := lower(btrim(coalesce(p_tipo, '')));
    v_detalle text := nullif(btrim(coalesce(p_detalle, '')), '');
    v_foto text := nullif(btrim(coalesce(p_foto_url, '')), '');
    v_cambio public.trabajador_cambios%rowtype;
begin
    select t.* into v_trabajador
    from public.trabajadores t
    join public.clientes c on c.id_cliente = t.id_cliente
    where c.auth_id = auth.uid()
    limit 1;

    if v_trabajador.id_trabajador is null then
        raise exception 'No tienes una cuenta de trabajador.';
    end if;

    if v_trabajador.estado_trabajador <> 'aprobado' then
        raise exception 'Tu cuenta de trabajador debe estar aprobada para enviar cambios.';
    end if;

    if v_tipo not in ('cambio_vehiculo', 'foto_vehiculo', 'foto_circulacion', 'baja', 'otro') then
        raise exception 'Tipo de cambio no válido.';
    end if;

    if v_tipo in ('cambio_vehiculo', 'baja', 'otro') and v_detalle is null then
        raise exception 'Escribe el detalle de tu solicitud.';
    end if;

    if v_tipo in ('foto_vehiculo', 'foto_circulacion') and v_foto is null then
        raise exception 'Adjunta la nueva foto.';
    end if;

    if exists (
        select 1
        from public.trabajador_cambios
        where id_trabajador = v_trabajador.id_trabajador
          and tipo = v_tipo
          and estado = 'pendiente'
    ) then
        raise exception 'Ya tienes una solicitud pendiente de este tipo.';
    end if;

    insert into public.trabajador_cambios (id_trabajador, tipo, detalle, foto_url)
    values (v_trabajador.id_trabajador, v_tipo, v_detalle, v_foto)
    returning * into v_cambio;

    return to_jsonb(v_cambio);
end;
$$;

revoke all on function public.web_solicitar_cambio_trabajador(text, text, text) from public;
grant execute on function public.web_solicitar_cambio_trabajador(text, text, text) to authenticated;

-- 4) Listado para el panel admin.
create or replace function public.web_admin_trabajador_cambios(
    p_token text,
    p_estado text default 'pendiente'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_estado text := nullif(btrim(coalesce(p_estado, '')), '');
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    return jsonb_build_object(
        'success', true,
        'sesion', true,
        'cambios', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id_cambio', x.id_cambio,
                'id_trabajador', t.id_trabajador,
                'nombre', t.nombre_trabajador,
                'telefono', t.telefono_trabajador,
                'vehiculo', trim(coalesce(t.vehiculo_marca, '') || ' ' || coalesce(t.vehiculo_modelo, '')),
                'placa', t.vehiculo_placa,
                'foto_actual', case
                    when x.tipo = 'foto_vehiculo' then t.foto_vehiculo
                    when x.tipo = 'foto_circulacion' then t.foto_circulacion
                    else null
                end,
                'tipo', x.tipo,
                'detalle', x.detalle,
                'foto_url', x.foto_url,
                'estado', x.estado,
                'respuesta', x.respuesta,
                'fecha_solicitud', x.fecha_solicitud,
                'fecha_revision', x.fecha_revision
            ) order by
                case x.estado when 'pendiente' then 0 else 1 end,
                x.fecha_solicitud desc)
            from public.trabajador_cambios x
            join public.trabajadores t on t.id_trabajador = x.id_trabajador
            where (v_estado is null or v_estado = '' or v_estado = 'todas' or x.estado = v_estado)
            limit 100
        ), '[]'::jsonb)
    );
end;
$$;

revoke all on function public.web_admin_trabajador_cambios(text, text) from public;
grant execute on function public.web_admin_trabajador_cambios(text, text) to anon, authenticated;

-- 5) El admin aprueba o rechaza. Al aprobar una foto, se aplica al perfil.
create or replace function public.web_admin_trabajador_cambio_resolver(
    p_token text,
    p_id integer,
    p_estado text,
    p_respuesta text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_cambio public.trabajador_cambios%rowtype;
    v_estado text := lower(btrim(coalesce(p_estado, '')));
    v_respuesta text := nullif(btrim(coalesce(p_respuesta, '')), '');
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    if v_estado not in ('aprobado', 'rechazado') then
        return jsonb_build_object('success', false, 'mensaje', 'Estado de solicitud no válido.');
    end if;

    select * into v_cambio
    from public.trabajador_cambios
    where id_cambio = p_id
    for update;

    if not found then
        return jsonb_build_object('success', false, 'mensaje', 'Solicitud no encontrada.');
    end if;

    if v_cambio.estado <> 'pendiente' then
        return jsonb_build_object('success', false, 'mensaje', 'La solicitud ya fue revisada.');
    end if;

    if v_estado = 'rechazado' and v_respuesta is null then
        return jsonb_build_object('success', false, 'mensaje', 'Escribe el motivo del rechazo.');
    end if;

    if v_estado = 'aprobado' and v_cambio.foto_url is not null then
        if v_cambio.tipo = 'foto_vehiculo' then
            update public.trabajadores
            set foto_vehiculo = v_cambio.foto_url,
                fecha_actualizacion = now()
            where id_trabajador = v_cambio.id_trabajador;
        elsif v_cambio.tipo = 'foto_circulacion' then
            update public.trabajadores
            set foto_circulacion = v_cambio.foto_url,
                fecha_actualizacion = now()
            where id_trabajador = v_cambio.id_trabajador;
        end if;
    end if;

    update public.trabajador_cambios
    set estado = v_estado,
        respuesta = v_respuesta,
        fecha_revision = now(),
        revisado_por = v_admin
    where id_cambio = p_id;

    return jsonb_build_object(
        'success', true,
        'mensaje', 'Solicitud actualizada.',
        'estado', v_estado
    );
end;
$$;

revoke all on function public.web_admin_trabajador_cambio_resolver(text, integer, text, text) from public;
grant execute on function public.web_admin_trabajador_cambio_resolver(text, integer, text, text) to anon, authenticated;
