-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Sorteo de apertura · participantes aprobados (panel temporal)          ║
-- ║  Ejecutar en Supabase después de admin-web.sql y ruleta-clientes.sql.   ║
-- ║                                                                          ║
-- ║  Panel temporal del sorteo:                                              ║
-- ║    · web_admin_sorteo_lista        → clientes con su estado              ║
-- ║    · web_admin_sorteo_participante → aprobar, quitar y guardar @ig       ║
-- ║  Ruleta pública:                                                         ║
-- ║    · web_ruleta_participantes      → solo nombres de los aprobados       ║
-- ║                                                                          ║
-- ║  Requisito para aprobar (se revisa a mano): cuenta registrada en la      ║
-- ║  tienda + comentario en la publicación de apertura de Instagram.         ║
-- ║  Al desactivar el panel (cuando cierre el sorteo) basta con dejar de     ║
-- ║  usar la vista Sorteo; las funciones no afectan a nada más.              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

create table if not exists public.ruleta_participantes (
    id_participante bigserial primary key,
    id_cliente integer not null unique
        references public.clientes (id_cliente) on delete cascade,
    instagram text,
    nota text,
    aprobado boolean not null default false,
    aprobado_por integer references public.usuarios (id_usuario) on delete set null,
    aprobado_en timestamptz,
    actualizado_en timestamptz not null default now()
);

create index if not exists ruleta_participantes_aprobado_idx
    on public.ruleta_participantes (aprobado)
    where aprobado;

alter table public.ruleta_participantes enable row level security;

revoke all on table public.ruleta_participantes from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 1) Lista para el panel: clientes activos con su estado de participación
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_sorteo_lista(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_total integer := 0;
    v_aprobados integer := 0;
    v_lista jsonb;
begin
    if v_admin is null then
        return jsonb_build_object(
            'success', false,
            'sesion', false,
            'mensaje', 'Sesión expirada. Inicia sesión de nuevo.'
        );
    end if;

    select count(*),
           count(*) filter (where coalesce(r.aprobado, false))
      into v_total, v_aprobados
      from public.clientes c
      left join public.ruleta_participantes r on r.id_cliente = c.id_cliente
     where c.estado_cliente = true
       and btrim(coalesce(c.nombre_cliente, '')) <> ''
       and lower(translate(btrim(c.nombre_cliente), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) <> 'cliente generico';

    select coalesce(jsonb_agg(fila order by fila->>'nombre'), '[]'::jsonb)
      into v_lista
      from (
          select jsonb_build_object(
                     'id_cliente', c.id_cliente,
                     'nombre', btrim(c.nombre_cliente),
                     'correo', coalesce(c.correo_cliente, ''),
                     'usuario', coalesce(c.usuario_cliente, ''),
                     'alta', to_char(c.fecha_creacion_cliente, 'YYYY-MM-DD'),
                     'aprobado', coalesce(r.aprobado, false),
                     'instagram', coalesce(r.instagram, ''),
                     'nota', coalesce(r.nota, '')
                 ) as fila
            from public.clientes c
            left join public.ruleta_participantes r on r.id_cliente = c.id_cliente
           where c.estado_cliente = true
             and btrim(coalesce(c.nombre_cliente, '')) <> ''
             and lower(translate(btrim(c.nombre_cliente), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) <> 'cliente generico'
      ) lista;

    return jsonb_build_object(
        'success', true,
        'sesion', true,
        'total', v_total,
        'aprobados', v_aprobados,
        'participantes', v_lista
    );
end;
$$;

revoke all on function public.web_admin_sorteo_lista(text) from public;
grant execute on function public.web_admin_sorteo_lista(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2) Aprobar o quitar un participante y guardar su usuario de Instagram
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_sorteo_participante(
    p_token text,
    p_id_cliente integer,
    p_aprobado boolean,
    p_instagram text default null,
    p_nota text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_aprobado boolean := coalesce(p_aprobado, false);
    v_instagram text := nullif(lower(btrim(replace(coalesce(p_instagram, ''), '@', ''))), '');
    v_nota text := nullif(btrim(coalesce(p_nota, '')), '');
begin
    if v_admin is null then
        return jsonb_build_object(
            'success', false,
            'sesion', false,
            'mensaje', 'Sesión expirada. Inicia sesión de nuevo.'
        );
    end if;

    if not exists (select 1 from public.clientes c where c.id_cliente = p_id_cliente) then
        return jsonb_build_object(
            'success', false,
            'sesion', true,
            'mensaje', 'La cuenta ya no existe en la tienda.'
        );
    end if;

    insert into public.ruleta_participantes (
        id_cliente, aprobado, instagram, nota, aprobado_por, aprobado_en, actualizado_en
    )
    values (
        p_id_cliente,
        v_aprobado,
        v_instagram,
        v_nota,
        case when v_aprobado then v_admin end,
        case when v_aprobado then now() end,
        now()
    )
    on conflict (id_cliente) do update
       set aprobado = excluded.aprobado,
           instagram = excluded.instagram,
           nota = excluded.nota,
           aprobado_por = case when excluded.aprobado then v_admin end,
           aprobado_en = case when excluded.aprobado then now() end,
           actualizado_en = now();

    return jsonb_build_object(
        'success', true,
        'sesion', true,
        'id_cliente', p_id_cliente,
        'aprobado', v_aprobado,
        'instagram', coalesce(v_instagram, ''),
        'nota', coalesce(v_nota, '')
    );
end;
$$;

revoke all on function public.web_admin_sorteo_participante(text, integer, boolean, text, text) from public;
grant execute on function public.web_admin_sorteo_participante(text, integer, boolean, text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3) Ruleta pública: solo nombres de los participantes aprobados
--    No devuelve correo, teléfono, documento ni el usuario de Instagram.
-- ----------------------------------------------------------------------------

create or replace function public.web_ruleta_participantes()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_lista jsonb;
begin
    select coalesce(
        jsonb_agg(
            jsonb_build_object('nombre', btrim(c.nombre_cliente))
            order by btrim(c.nombre_cliente)
        ),
        '[]'::jsonb
    )
    into v_lista
    from public.ruleta_participantes r
    join public.clientes c on c.id_cliente = r.id_cliente
    where r.aprobado = true
      and c.estado_cliente = true
      and btrim(coalesce(c.nombre_cliente, '')) <> ''
      and lower(translate(btrim(c.nombre_cliente), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) <> 'cliente generico';

    return jsonb_build_object(
        'success', true,
        'total', jsonb_array_length(v_lista),
        'clientes', v_lista
    );
end;
$$;

revoke all on function public.web_ruleta_participantes() from public;
grant execute on function public.web_ruleta_participantes() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Consultas útiles para revisar a mano desde el SQL Editor
-- ----------------------------------------------------------------------------
-- Aprobados (los que salen en la ruleta):
--   select c.nombre_cliente, r.instagram, r.aprobado_en
--     from public.ruleta_participantes r
--     join public.clientes c on c.id_cliente = r.id_cliente
--    where r.aprobado
--    order by c.nombre_cliente;
--
-- Reiniciar el sorteo (deja la ruleta vacía otra vez):
--   delete from public.ruleta_participantes;
