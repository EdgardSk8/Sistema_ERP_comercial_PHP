-- Notificaciones push de la tienda (Web Push: celular, PC y app en pantalla de inicio).
-- Ejecutar en Supabase → SQL Editor. Requiere haber corrido antes admin-web.sql.
--
-- La clave privada VAPID NO vive aquí: es un secreto de la Edge Function enviar-push.
-- La pública está en website-supabase/js/core/supabase-config.js (window.PUSH_CONFIG).

create table if not exists public.push_suscripciones (
    id_suscripcion serial primary key,
    id_cliente integer references public.clientes(id_cliente) on delete cascade,
    endpoint text not null unique,
    p256dh text not null,
    auth text not null,
    plataforma varchar(20),
    navegador varchar(40),
    activo boolean not null default true,
    creado timestamptz not null default now(),
    actualizado timestamptz not null default now()
);

create index if not exists idx_push_suscripciones_cliente
    on public.push_suscripciones(id_cliente);

create index if not exists idx_push_suscripciones_activas
    on public.push_suscripciones(activo);

create table if not exists public.push_envios (
    id_envio serial primary key,
    titulo varchar(80) not null,
    mensaje varchar(240) not null,
    url text,
    tipo varchar(20) not null default 'mensaje',
    imagen text,
    destino varchar(20) not null default 'todos',
    id_cliente integer,
    dispositivos integer not null default 0,
    enviados integer not null default 0,
    errores integer not null default 0,
    id_admin integer,
    fecha timestamptz not null default now()
);

/* Instalaciones que ya tenían la tabla sin estos campos. */
alter table public.push_envios add column if not exists tipo varchar(20) not null default 'mensaje';
alter table public.push_envios add column if not exists imagen text;

create index if not exists idx_push_envios_fecha
    on public.push_envios(fecha desc);

alter table public.push_suscripciones enable row level security;
alter table public.push_envios enable row level security;
revoke all on table public.push_suscripciones from public, anon, authenticated;
revoke all on table public.push_envios from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- Cliente: guardar / quitar el dispositivo
-- ----------------------------------------------------------------------------

create or replace function public.web_push_guardar(
    p_endpoint text,
    p_p256dh text,
    p_auth text,
    p_plataforma text default null,
    p_navegador text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_cliente integer;
    v_total integer := 0;
begin
    if auth.uid() is null then
        raise exception 'Inicia sesión para continuar.';
    end if;

    if coalesce(btrim(p_endpoint), '') = ''
       or coalesce(btrim(p_p256dh), '') = ''
       or coalesce(btrim(p_auth), '') = '' then
        raise exception 'No se pudo identificar este dispositivo.';
    end if;

    select c.id_cliente
      into v_cliente
      from public.clientes c
     where c.auth_id = auth.uid()
     limit 1;

    if v_cliente is null then
        raise exception 'No se encontró tu cuenta de cliente.';
    end if;

    insert into public.push_suscripciones (id_cliente, endpoint, p256dh, auth, plataforma, navegador)
    values (
        v_cliente,
        btrim(p_endpoint),
        btrim(p_p256dh),
        btrim(p_auth),
        nullif(btrim(coalesce(p_plataforma, '')), ''),
        nullif(btrim(coalesce(p_navegador, '')), '')
    )
    on conflict (endpoint) do update
       set id_cliente = excluded.id_cliente,
           p256dh = excluded.p256dh,
           auth = excluded.auth,
           plataforma = coalesce(excluded.plataforma, public.push_suscripciones.plataforma),
           navegador = coalesce(excluded.navegador, public.push_suscripciones.navegador),
           activo = true,
           actualizado = now();

    select count(*)
      into v_total
      from public.push_suscripciones s
     where s.id_cliente = v_cliente
       and s.activo;

    return jsonb_build_object(
        'success', true,
        'mensaje', 'Notificaciones activadas.',
        'dispositivos', v_total
    );
end;
$$;

create or replace function public.web_push_eliminar(p_endpoint text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_borrados integer := 0;
begin
    if auth.uid() is null then
        raise exception 'Inicia sesión para continuar.';
    end if;

    delete from public.push_suscripciones s
     using public.clientes c
     where s.id_cliente = c.id_cliente
       and c.auth_id = auth.uid()
       and s.endpoint = btrim(coalesce(p_endpoint, ''));

    get diagnostics v_borrados = row_count;

    return jsonb_build_object(
        'success', true,
        'mensaje', 'Notificaciones desactivadas.',
        'borrados', v_borrados
    );
end;
$$;

create or replace function public.web_push_estado()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select jsonb_build_object(
        'success', true,
        'dispositivos', coalesce(jsonb_agg(jsonb_build_object(
            'id_suscripcion', s.id_suscripcion,
            'plataforma', coalesce(s.plataforma, ''),
            'navegador', coalesce(s.navegador, ''),
            'creado', s.creado,
            'actualizado', s.actualizado
        ) order by s.actualizado desc), '[]'::jsonb)
    )
    from public.push_suscripciones s
    join public.clientes c on c.id_cliente = s.id_cliente
    where c.auth_id = auth.uid()
      and s.activo;
$$;

revoke all on function public.web_push_guardar(text, text, text, text, text) from public, anon;
revoke all on function public.web_push_eliminar(text) from public, anon;
revoke all on function public.web_push_estado() from public, anon;

grant execute on function public.web_push_guardar(text, text, text, text, text) to authenticated;
grant execute on function public.web_push_eliminar(text) to authenticated;
grant execute on function public.web_push_estado() to authenticated;

-- ----------------------------------------------------------------------------
-- Panel: resumen de dispositivos, clientes suscritos e historial de envíos
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_push_resumen(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_dispositivos integer := 0;
    v_clientes integer := 0;
    v_historial jsonb;
    v_lista jsonb;
begin
    if v_admin is null then
        return jsonb_build_object(
            'success', false,
            'sesion', false,
            'mensaje', 'Sesión expirada. Inicia sesión de nuevo.'
        );
    end if;

    select count(*), count(distinct s.id_cliente)
      into v_dispositivos, v_clientes
      from public.push_suscripciones s
     where s.activo;

    select coalesce(jsonb_agg(fila order by fila->>'fecha' desc), '[]'::jsonb)
      into v_historial
      from (
          select jsonb_build_object(
                     'id_envio', e.id_envio,
                     'titulo', e.titulo,
                     'mensaje', e.mensaje,
                     'url', coalesce(e.url, ''),
                     'tipo', coalesce(e.tipo, 'mensaje'),
                     'imagen', coalesce(e.imagen, ''),
                     'destino', e.destino,
                     'dispositivos', e.dispositivos,
                     'enviados', e.enviados,
                     'errores', e.errores,
                     'fecha', to_char(e.fecha, 'YYYY-MM-DD"T"HH24:MI:SS')
                 ) as fila
            from public.push_envios e
           order by e.fecha desc
           limit 20
      ) historial;

    select coalesce(jsonb_agg(fila order by fila->>'nombre'), '[]'::jsonb)
      into v_lista
      from (
          select jsonb_build_object(
                     'id_cliente', c.id_cliente,
                     'nombre', btrim(c.nombre_cliente),
                     'correo', coalesce(c.correo_cliente, ''),
                     'dispositivos', count(*)
                 ) as fila
            from public.push_suscripciones s
            join public.clientes c on c.id_cliente = s.id_cliente
           where s.activo
           group by c.id_cliente, c.nombre_cliente, c.correo_cliente
      ) clientes;

    return jsonb_build_object(
        'success', true,
        'sesion', true,
        'dispositivos', v_dispositivos,
        'clientes', v_clientes,
        'historial', v_historial,
        'lista', v_lista
    );
end;
$$;

revoke all on function public.web_admin_push_resumen(text) from public;
grant execute on function public.web_admin_push_resumen(text) to anon, authenticated;
