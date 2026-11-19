-- ============================================================================
-- Tienda Supabase · Aceptación automática de pedidos web
-- Ejecutar después de admin-web.sql y pedidos-web.sql.
--
-- - Guarda la preferencia global en tienda_config.
-- - Expone las RPC del panel: web_admin_configuracion y
--   web_admin_configuracion_actualizar.
-- - Acepta los pedidos nuevos que entren como "solicitado" cuando la
--   preferencia está activa. Los pedidos existentes no se modifican.
-- - Corrige el historial inicial para que figure como aceptado por el
--   sistema y no como solicitado.
-- ============================================================================

create table if not exists public.tienda_config (
    clave text primary key,
    valor text not null,
    actualizado_en timestamptz not null default now()
);

insert into public.tienda_config (clave, valor, actualizado_en)
values ('pedidos_auto_aceptar', 'false', now())
on conflict (clave) do nothing;

alter table public.tienda_config enable row level security;

revoke all on table public.tienda_config from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 1) Aceptación automática al crear el pedido
-- ----------------------------------------------------------------------------

create or replace function public.web_autoaceptar_pedido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_auto boolean;
begin
    if new.estado_pedido = 'solicitado' then
        select coalesce(valor::boolean, false)
          into v_auto
          from public.tienda_config
         where clave = 'pedidos_auto_aceptar';

        if coalesce(v_auto, false) then
            new.estado_pedido := 'aceptado';
            new.fecha_aceptado := coalesce(new.fecha_aceptado, now());
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists web_autoaceptar_pedido on public.pedidos_web;

create trigger web_autoaceptar_pedido
before insert on public.pedidos_web
for each row execute function public.web_autoaceptar_pedido();

-- ----------------------------------------------------------------------------
-- 2) Historial inicial coherente con la aceptación automática
-- ----------------------------------------------------------------------------

create or replace function public.web_autoaceptar_historial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.estado_nuevo = 'solicitado'
       and coalesce(new.origen, '') = 'web'
       and exists (
           select 1
             from public.pedidos_web p
            where p.id_pedido = new.id_pedido
              and p.estado_pedido = 'aceptado'
       )
    then
        new.estado_nuevo := 'aceptado';
        new.nota := 'Pedido aceptado automáticamente.';
    end if;

    return new;
end;
$$;

drop trigger if exists web_autoaceptar_historial on public.pedido_web_estados;

create trigger web_autoaceptar_historial
before insert on public.pedido_web_estados
for each row execute function public.web_autoaceptar_historial();

-- ----------------------------------------------------------------------------
-- 3) RPC del panel
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_configuracion(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_auto boolean := false;
begin
    if v_admin is null then
        return jsonb_build_object(
            'success', false,
            'sesion', false,
            'mensaje', 'Sesión expirada. Inicia sesión de nuevo.'
        );
    end if;

    select coalesce(valor::boolean, false)
      into v_auto
      from public.tienda_config
     where clave = 'pedidos_auto_aceptar';

    return jsonb_build_object(
        'success', true,
        'sesion', true,
        'auto_aceptar_pedidos', coalesce(v_auto, false)
    );
end;
$$;

revoke all on function public.web_admin_configuracion(text) from public;
grant execute on function public.web_admin_configuracion(text) to anon, authenticated;

create or replace function public.web_admin_configuracion_actualizar(
    p_token text,
    p_auto_aceptar boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_auto boolean := coalesce(p_auto_aceptar, false);
begin
    if v_admin is null then
        return jsonb_build_object(
            'success', false,
            'sesion', false,
            'mensaje', 'Sesión expirada. Inicia sesión de nuevo.'
        );
    end if;

    insert into public.tienda_config (clave, valor, actualizado_en)
    values (
        'pedidos_auto_aceptar',
        case when v_auto then 'true' else 'false' end,
        now()
    )
    on conflict (clave) do update
       set valor = excluded.valor,
           actualizado_en = now();

    return jsonb_build_object(
        'success', true,
        'sesion', true,
        'auto_aceptar_pedidos', v_auto
    );
end;
$$;

revoke all on function public.web_admin_configuracion_actualizar(text, boolean) from public;
grant execute on function public.web_admin_configuracion_actualizar(text, boolean) to anon, authenticated;
