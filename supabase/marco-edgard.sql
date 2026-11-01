-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Desbloquear TODOS los marcos de edgard_tellez                    ║
-- ║  Supabase → SQL Editor → New query → pega TODO → Run             ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1) Diagnóstico: confirma que la cuenta existe y tiene auth_id
select
    c.id_cliente,
    c.nombre_cliente,
    c.usuario_cliente,
    c.correo_cliente,
    c.auth_id,
    u.email as correo_auth,
    u.raw_user_meta_data as metadatos_actuales
from public.clientes c
left join auth.users u on u.id = c.auth_id
where lower(c.usuario_cliente) = 'edgard_tellez'
   or c.nombre_cliente ilike '%edgard%';

-- 2) Desbloquear todos los marcos (bronce, plata, oro, esmeralda y rubí)
update auth.users u
set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
        'marco_avatar_forzado', 'todos',
        'marco_avatar', true
    )
where u.id in (
    select c.auth_id
    from public.clientes c
    where lower(c.usuario_cliente) = 'edgard_tellez'
      and c.auth_id is not null
);

-- 2.1) Si el paso 1 mostró otro usuario_cliente o auth_id, usa este bloque:
-- update auth.users
-- set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
--     || jsonb_build_object('marco_avatar_forzado', 'todos', 'marco_avatar', true)
-- where id = 'PEGA-AQUI-EL-AUTH_ID';

-- 2.2) Para forzar uno solo, cambia 'todos' por: bronce | plata | oro | esmeralda | rubi

-- 3) Verificación: debe devolver marco_avatar_forzado = todos
select u.email, u.raw_user_meta_data ->> 'marco_avatar_forzado' as marco_forzado
from auth.users u
where u.raw_user_meta_data ? 'marco_avatar_forzado';

-- 4) Quitar el marco forzado cuando ya no lo necesites
-- update auth.users u
-- set raw_user_meta_data = u.raw_user_meta_data - 'marco_avatar_forzado'
-- where u.id in (
--     select c.auth_id from public.clientes c
--     where lower(c.usuario_cliente) = 'edgard_tellez'
-- );
