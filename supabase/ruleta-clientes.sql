-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Clientes para la ruleta del sorteo de apertura                          ║
-- ║  Ejecutar en Supabase después de admin-web.sql.                          ║
-- ║  Solo devuelve nombres de clientes activos.                              ║
-- ║  web_admin_clientes exige sesión; web_clientes_ruleta es pública.        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

create or replace function public.web_admin_clientes(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_clientes jsonb;
begin
    if v_admin is null then
        return jsonb_build_object(
            'success', false,
            'sesion', false,
            'mensaje', 'Sesión expirada. Inicia sesión de nuevo.'
        );
    end if;

    select coalesce(
        jsonb_agg(
            jsonb_build_object('nombre', btrim(c.nombre_cliente))
            order by btrim(c.nombre_cliente)
        ),
        '[]'::jsonb
    )
    into v_clientes
    from public.clientes c
    where c.estado_cliente = true
      and btrim(coalesce(c.nombre_cliente, '')) <> ''
      and lower(translate(btrim(c.nombre_cliente), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) <> 'cliente generico';

    return jsonb_build_object(
        'success', true,
        'sesion', true,
        'total', jsonb_array_length(v_clientes),
        'clientes', v_clientes
    );
end;
$$;

revoke all on function public.web_admin_clientes(text) from public;
grant execute on function public.web_admin_clientes(text) to anon, authenticated;

-- Participantes visibles en la tienda sin sesión. Expone únicamente el nombre
-- de clientes activos; no devuelve contacto, documento ni ningún otro dato.
create or replace function public.web_clientes_ruleta()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_clientes jsonb;
begin
    select coalesce(
        jsonb_agg(
            jsonb_build_object('nombre', btrim(c.nombre_cliente))
            order by btrim(c.nombre_cliente)
        ),
        '[]'::jsonb
    )
    into v_clientes
    from public.clientes c
    where c.estado_cliente = true
      and btrim(coalesce(c.nombre_cliente, '')) <> ''
      and lower(translate(btrim(c.nombre_cliente), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) <> 'cliente generico';

    return jsonb_build_object(
        'success', true,
        'total', jsonb_array_length(v_clientes),
        'clientes', v_clientes
    );
end;
$$;

revoke all on function public.web_clientes_ruleta() from public;
grant execute on function public.web_clientes_ruleta() to anon, authenticated;
