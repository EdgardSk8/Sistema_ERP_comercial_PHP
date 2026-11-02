-- Reseñas con avatar y marco de cada autor
-- Ejecutar en Supabase → SQL Editor → Run

create or replace function public.web_resenias(p_id integer)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with visibles as (
    select r.id_resenia, r.id_producto, r.id_cliente,
           r.calificacion_resenia, r.comentario_resenia,
           r.fecha_creacion_resenia, r.fecha_actualizacion_resenia,
           coalesce(nullif(trim(c.nombre_cliente), ''), 'Cliente') as nombre,
           nullif(trim(u.raw_user_meta_data->>'avatar_color'), '') as avatar_color,
           nullif(trim(u.raw_user_meta_data->>'avatar_fondo'), '') as avatar_fondo,
           nullif(trim(u.raw_user_meta_data->>'avatar_imagen'), '') as avatar_imagen,
           nullif(trim(u.raw_user_meta_data->>'marco_avatar_forzado'), '') as marco_forzado,
           nullif(trim(u.raw_user_meta_data->>'marco_avatar_estilo'), '') as marco_estilo,
           coalesce(nullif(lower(trim(u.raw_user_meta_data->>'marco_avatar')), '')::boolean, true) as marco_avatar,
           (select count(*)::int from public.ventas v
             where v.id_cliente = c.id_cliente and v.estado_venta = true) as ventas_total
    from public.resenias_productos r
    left join public.clientes c on c.id_cliente = r.id_cliente
    left join auth.users u on u.id = c.auth_id
    where r.id_producto = p_id and r.estado_resenia = true
),
mia as (
    select r.id_resenia, r.id_producto, r.id_cliente,
           r.calificacion_resenia, r.comentario_resenia,
           r.fecha_creacion_resenia, r.fecha_actualizacion_resenia,
           coalesce(nullif(trim(c.nombre_cliente), ''), 'Cliente') as nombre,
           nullif(trim(u.raw_user_meta_data->>'avatar_color'), '') as avatar_color,
           nullif(trim(u.raw_user_meta_data->>'avatar_fondo'), '') as avatar_fondo,
           nullif(trim(u.raw_user_meta_data->>'avatar_imagen'), '') as avatar_imagen,
           nullif(trim(u.raw_user_meta_data->>'marco_avatar_forzado'), '') as marco_forzado,
           nullif(trim(u.raw_user_meta_data->>'marco_avatar_estilo'), '') as marco_estilo,
           coalesce(nullif(lower(trim(u.raw_user_meta_data->>'marco_avatar')), '')::boolean, true) as marco_avatar,
           (select count(*)::int from public.ventas v
             where v.id_cliente = c.id_cliente and v.estado_venta = true) as ventas_total
    from public.resenias_productos r
    join public.clientes c on c.id_cliente = r.id_cliente
    left join auth.users u on u.id = c.auth_id
    where r.id_producto = p_id and c.auth_id = auth.uid()
    limit 1
),
resumen as (
    select count(*)::int as total,
           coalesce(round(avg(calificacion_resenia)::numeric, 2), 0) as promedio
    from visibles
),
distribucion as (
    select jsonb_agg(jsonb_build_object(
        'estrellas', e.estrellas,
        'total', coalesce(x.total, 0),
        'porcentaje', case
            when (select total from resumen) > 0
                then round((coalesce(x.total, 0)::numeric / (select total from resumen)) * 100, 1)
            else 0
        end
    ) order by e.estrellas desc)
    from (values (5), (4), (3), (2), (1)) as e(estrellas)
    left join (
        select calificacion_resenia as estrellas, count(*)::int as total
        from visibles
        group by calificacion_resenia
    ) x on x.estrellas = e.estrellas
)
select jsonb_build_object(
    'resumen', jsonb_build_object(
        'promedio', (select promedio from resumen),
        'total', (select total from resumen),
        'distribucion', coalesce((select * from distribucion), '[]'::jsonb)
    ),
    'resenias', coalesce((
        select jsonb_agg(jsonb_build_object(
            'id_resenia', v.id_resenia,
            'id_producto', v.id_producto,
            'cliente', split_part(v.nombre, ' ', 1),
            'inicial', upper(left(split_part(v.nombre, ' ', 1), 1)),
            'avatar_color', v.avatar_color,
            'avatar_fondo', v.avatar_fondo,
            'avatar_imagen', v.avatar_imagen,
            'marco_avatar', v.marco_avatar,
            'marco_forzado', v.marco_forzado,
            'marco_estilo', v.marco_estilo,
            'ventas_total', v.ventas_total,
            'calificacion', v.calificacion_resenia,
            'comentario', v.comentario_resenia,
            'fecha', to_char(v.fecha_creacion_resenia, 'YYYY-MM-DD HH24:MI'),
            'editada', v.fecha_actualizacion_resenia is not null,
            'es_mia', false
        ) order by v.fecha_creacion_resenia desc)
        from visibles v
    ), '[]'::jsonb),
    'mi_resenia', (
        select jsonb_build_object(
            'id_resenia', m.id_resenia,
            'id_producto', m.id_producto,
            'cliente', split_part(m.nombre, ' ', 1),
            'inicial', upper(left(split_part(m.nombre, ' ', 1), 1)),
            'avatar_color', m.avatar_color,
            'avatar_fondo', m.avatar_fondo,
            'avatar_imagen', m.avatar_imagen,
            'marco_avatar', m.marco_avatar,
            'marco_forzado', m.marco_forzado,
            'marco_estilo', m.marco_estilo,
            'ventas_total', m.ventas_total,
            'calificacion', m.calificacion_resenia,
            'comentario', m.comentario_resenia,
            'fecha', to_char(m.fecha_creacion_resenia, 'YYYY-MM-DD HH24:MI'),
            'editada', m.fecha_actualizacion_resenia is not null,
            'es_mia', true
        )
        from mia m
    ),
    'puede_resenar', auth.uid() is not null
);
$$;
