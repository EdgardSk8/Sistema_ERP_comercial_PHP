-- ============================================================
-- Tienda web independiente · Supabase
-- Ejecuta este archivo en el SQL Editor de Supabase.
-- Requiere que las tablas del ERP ya existan en el esquema public.
-- ============================================================

-- 1) Enlace entre auth.users y clientes
alter table public.clientes add column if not exists auth_id uuid;
create unique index if not exists clientes_auth_id_key on public.clientes (auth_id);

-- 2) Crea la fila del cliente al registrarse en Supabase Auth
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

drop trigger if exists web_crear_cliente on auth.users;
create trigger web_crear_cliente
after insert on auth.users
for each row execute function public.web_crear_cliente();

-- 2.1) Confirmación de correo OBLIGATORIA.
--      El cliente queda pendiente hasta confirmar su correo; recién ahí puede ingresar.
--      Si en algún momento necesitas saltarte la confirmación (pruebas locales),
--      ejecuta manualmente el bloque comentado del final de este archivo.
drop trigger if exists web_autoconfirmar_correo on auth.users;
drop function if exists public.web_autoconfirmar_correo();

-- 3) Políticas para la cuenta del cliente
--    Además de RLS, los roles de Supabase necesitan permisos de tabla.
grant usage on schema public to anon, authenticated;

grant select on public.productos, public.categoria, public.impuestos,
    public.producto_variaciones, public.variacion_tallas, public.variacion_imagenes,
    public.tallas, public.metodos_pago
    to anon, authenticated;

grant select, insert, update on public.clientes to authenticated;

grant select, insert, update, delete on public.cliente_direcciones to authenticated;
grant select, insert, update, delete on public.cliente_favoritos to authenticated;

grant select on public.resenias_productos to anon, authenticated;
grant insert, update, delete on public.resenias_productos to authenticated;

grant select on public.ventas, public.detalle_ventas to authenticated;

grant usage, select on all sequences in schema public to authenticated;

drop policy if exists web_clientes_select on public.clientes;
create policy web_clientes_select on public.clientes
    for select to authenticated
    using (auth_id = auth.uid());

drop policy if exists web_clientes_insert on public.clientes;
create policy web_clientes_insert on public.clientes
    for insert to authenticated
    with check (auth_id = auth.uid());

drop policy if exists web_clientes_update on public.clientes;
create policy web_clientes_update on public.clientes
    for update to authenticated
    using (auth_id = auth.uid())
    with check (auth_id = auth.uid());

drop policy if exists web_direcciones_todo on public.cliente_direcciones;
create policy web_direcciones_todo on public.cliente_direcciones
    for all to authenticated
    using (exists (
        select 1 from public.clientes c
        where c.id_cliente = cliente_direcciones.id_cliente and c.auth_id = auth.uid()
    ))
    with check (exists (
        select 1 from public.clientes c
        where c.id_cliente = cliente_direcciones.id_cliente and c.auth_id = auth.uid()
    ));

drop policy if exists web_favoritos_todo on public.cliente_favoritos;
create policy web_favoritos_todo on public.cliente_favoritos
    for all to authenticated
    using (exists (
        select 1 from public.clientes c
        where c.id_cliente = cliente_favoritos.id_cliente and c.auth_id = auth.uid()
    ))
    with check (exists (
        select 1 from public.clientes c
        where c.id_cliente = cliente_favoritos.id_cliente and c.auth_id = auth.uid()
    ));

-- 4) Reseñas (lectura pública solo de las visibles)
alter table public.resenias_productos enable row level security;

drop policy if exists web_resenias_select on public.resenias_productos;
create policy web_resenias_select on public.resenias_productos
    for select to anon, authenticated
    using (
        estado_resenia = true
        or exists (
            select 1 from public.clientes c
            where c.id_cliente = resenias_productos.id_cliente and c.auth_id = auth.uid()
        )
    );

drop policy if exists web_resenias_insert on public.resenias_productos;
create policy web_resenias_insert on public.resenias_productos
    for insert to authenticated
    with check (exists (
        select 1 from public.clientes c
        where c.id_cliente = resenias_productos.id_cliente and c.auth_id = auth.uid()
    ));

drop policy if exists web_resenias_update on public.resenias_productos;
create policy web_resenias_update on public.resenias_productos
    for update to authenticated
    using (exists (
        select 1 from public.clientes c
        where c.id_cliente = resenias_productos.id_cliente and c.auth_id = auth.uid()
    ))
    with check (exists (
        select 1 from public.clientes c
        where c.id_cliente = resenias_productos.id_cliente and c.auth_id = auth.uid()
    ));

drop policy if exists web_resenias_delete on public.resenias_productos;
create policy web_resenias_delete on public.resenias_productos
    for delete to authenticated
    using (exists (
        select 1 from public.clientes c
        where c.id_cliente = resenias_productos.id_cliente and c.auth_id = auth.uid()
    ));

-- 5) Historial de compras (solo lectura del propio cliente)
drop policy if exists web_ventas_select on public.ventas;
create policy web_ventas_select on public.ventas
    for select to authenticated
    using (exists (
        select 1 from public.clientes c
        where c.id_cliente = ventas.id_cliente and c.auth_id = auth.uid()
    ));

drop policy if exists web_detalle_select on public.detalle_ventas;
create policy web_detalle_select on public.detalle_ventas
    for select to authenticated
    using (exists (
        select 1
        from public.ventas v
        join public.clientes c on c.id_cliente = v.id_cliente
        where v.id_venta = detalle_ventas.id_venta and c.auth_id = auth.uid()
    ));

-- 6) Catálogo público (mismas formas que la API de Laravel)

create or replace function public.web_productos()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with base as (
    select p.id_producto,
           p.nombre_producto,
           p.descripcion_producto,
           p.precio_venta,
           p.imagen_producto,
           coalesce(i.porcentaje_impuesto, 0) as impuesto,
           coalesce(c.nombre_categoria, 'General') as categoria
    from public.productos p
    left join public.impuestos i on i.id_impuesto = p.id_impuesto
    left join public.categoria c on c.id_categoria = p.id_categoria
    where p.estado_producto = true
),
variaciones as (
    select v.id_variacion,
           v.id_producto,
           coalesce(nullif(v.color, ''), 'Único') as nombre_color,
           row_number() over (
               partition by v.id_producto, coalesce(nullif(v.color, ''), 'Único')
               order by v.id_variacion
           ) as orden_color
    from public.producto_variaciones v
    where v.estado_variacion = true
),
colores as (
    select v.id_producto,
           jsonb_build_object(
               'nombre', v.nombre_color,
               'imagen', (
                   select case
                              when vi.imagen like 'imagenes/%' then '/' || vi.imagen
                              else '/imagenes/productosvariaciones/' || vi.imagen
                          end
                   from public.variacion_imagenes vi
                   where vi.id_variacion = v.id_variacion
                   order by vi.orden
                   limit 1
               ),
               'stock', coalesce((
                   select sum(vt.stock)
                   from public.variacion_tallas vt
                   where vt.id_variacion = v.id_variacion
               ), 0),
               'tallas', coalesce((
                   select jsonb_agg(distinct t.talla)
                   from public.variacion_tallas vt
                   join public.tallas t on t.id_talla = vt.id_talla
                   where vt.id_variacion = v.id_variacion
               ), '[]'::jsonb)
           ) as color_json,
           v.id_variacion,
           coalesce((
               select sum(vt.stock)
               from public.variacion_tallas vt
               where vt.id_variacion = v.id_variacion
           ), 0) as stock
    from variaciones v
    where v.orden_color = 1
),
colores_agg as (
    select id_producto,
           jsonb_agg(color_json order by id_variacion) as colores,
           sum(stock) as stock
    from colores
    group by id_producto
),
calif as (
    select id_producto,
           round(avg(calificacion_resenia)::numeric, 2) as promedio,
           count(*) as total
    from public.resenias_productos
    where estado_resenia = true
    group by id_producto
)
select coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id_producto,
    'nombre', b.nombre_producto,
    'categoria', b.categoria,
    'descripcion', b.descripcion_producto,
    'precio', round((b.precio_venta * (1 + b.impuesto / 100))::numeric, 2),
    'impuesto', b.impuesto,
    'imagen', coalesce(
        (ca.colores -> 0 ->> 'imagen'),
        case
            when b.imagen_producto is null then null
            when position('/' in b.imagen_producto) > 0 then '/' || b.imagen_producto
            else '/imagenes/productos/' || b.imagen_producto
        end
    ),
    'colores', coalesce(ca.colores, '[]'::jsonb),
    'calificacion', jsonb_build_object(
        'promedio', coalesce(cf.promedio, 0),
        'total', coalesce(cf.total, 0)
    ),
    'stock', coalesce(ca.stock, 0)
) order by b.nombre_producto), '[]'::jsonb)
from base b
left join colores_agg ca on ca.id_producto = b.id_producto
left join calif cf on cf.id_producto = b.id_producto;
$$;

create or replace function public.web_producto(p_id integer)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with base as (
    select p.id_producto,
           p.nombre_producto,
           p.descripcion_producto,
           p.precio_venta,
           p.imagen_producto,
           coalesce(i.porcentaje_impuesto, 0) as impuesto,
           coalesce(c.nombre_categoria, 'General') as categoria
    from public.productos p
    left join public.impuestos i on i.id_impuesto = p.id_impuesto
    left join public.categoria c on c.id_categoria = p.id_categoria
    where p.id_producto = p_id and p.estado_producto = true
),
variaciones as (
    select v.id_variacion,
           coalesce(nullif(v.color, ''), 'Único') as color,
           coalesce((
               select jsonb_agg(x.url order by x.orden)
               from (
                   select case
                              when vi.imagen like 'imagenes/%' then '/' || vi.imagen
                              else '/imagenes/productosvariaciones/' || vi.imagen
                          end as url,
                          vi.orden
                   from public.variacion_imagenes vi
                   where vi.id_variacion = v.id_variacion
               ) x
           ), '[]'::jsonb) as imagenes
    from public.producto_variaciones v
    where v.estado_variacion = true and v.id_producto = p_id
),
tallas as (
    select v.id_variacion,
           jsonb_agg(jsonb_build_object(
               'id', vt.id_variacion_talla,
               'nombre', coalesce(t.talla, 'Única'),
               'stock', coalesce(vt.stock, 0),
               'precio', round((coalesce(vt.precio_venta, b.precio_venta) * (1 + b.impuesto / 100))::numeric, 2)
           ) order by length(coalesce(t.talla, 'Única')), coalesce(t.talla, 'Única')) as tallas
    from public.variacion_tallas vt
    join variaciones v on v.id_variacion = vt.id_variacion
    cross join base b
    left join public.tallas t on t.id_talla = vt.id_talla
    group by v.id_variacion
),
vars_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
        'id', v.id_variacion,
        'color', v.color,
        'imagenes', case
                        when jsonb_array_length(v.imagenes) > 0 then v.imagenes
                        when b.imagen_producto is null then '[]'::jsonb
                        when position('/' in b.imagen_producto) > 0 then jsonb_build_array('/' || b.imagen_producto)
                        else jsonb_build_array('/imagenes/productos/' || b.imagen_producto)
                    end,
        'tallas', coalesce(t.tallas, '[]'::jsonb)
    ) order by v.id_variacion), '[]'::jsonb) as variaciones
    from variaciones v
    left join tallas t on t.id_variacion = v.id_variacion
    cross join base b
),
calif as (
    select round(avg(calificacion_resenia)::numeric, 2) as promedio, count(*) as total
    from public.resenias_productos
    where id_producto = p_id and estado_resenia = true
)
select jsonb_build_object(
    'id', b.id_producto,
    'nombre', b.nombre_producto,
    'categoria', b.categoria,
    'descripcion', b.descripcion_producto,
    'precio', round((b.precio_venta * (1 + b.impuesto / 100))::numeric, 2),
    'precio_base', b.precio_venta,
    'impuesto', b.impuesto,
    'imagen', coalesce(
        (
            select v.imagenes ->> 0
            from variaciones v
            where jsonb_array_length(v.imagenes) > 0
            order by v.id_variacion
            limit 1
        ),
        case
            when b.imagen_producto is null then null
            when position('/' in b.imagen_producto) > 0 then '/' || b.imagen_producto
            else '/imagenes/productos/' || b.imagen_producto
        end
    ),
    'calificacion', jsonb_build_object(
        'promedio', coalesce((select promedio from calif), 0),
        'total', coalesce((select total from calif), 0)
    ),
    'variaciones', (select variaciones from vars_json)
)
from base b;
$$;

create or replace function public.web_favoritos()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
select coalesce(jsonb_agg(jsonb_build_object(
    'id_producto', p.id_producto,
    'nombre_producto', p.nombre_producto,
    'categoria', coalesce(c.nombre_categoria, 'General'),
    'precio', round((p.precio_venta * (1 + coalesce(i.porcentaje_impuesto, 0) / 100))::numeric, 2),
    'imagen', coalesce(
        (
            select case
                       when vi.imagen like 'imagenes/%' then '/' || vi.imagen
                       else '/imagenes/productosvariaciones/' || vi.imagen
                   end
            from public.producto_variaciones pv
            join public.variacion_imagenes vi on vi.id_variacion = pv.id_variacion
            where pv.id_producto = p.id_producto and pv.estado_variacion
            order by vi.orden
            limit 1
        ),
        case
            when p.imagen_producto is null then null
            when position('/' in p.imagen_producto) > 0 then '/' || p.imagen_producto
            else '/imagenes/productos/' || p.imagen_producto
        end
    )
) order by f.fecha_creacion_favorito desc), '[]'::jsonb)
from public.cliente_favoritos f
join public.clientes cl on cl.id_cliente = f.id_cliente and cl.auth_id = auth.uid()
join public.productos p on p.id_producto = f.id_producto and p.estado_producto = true
left join public.categoria c on c.id_categoria = p.id_categoria
left join public.impuestos i on i.id_impuesto = p.id_impuesto;
$$;

create or replace function public.web_historial()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with propias as (
    select v.*
    from public.ventas v
    join public.clientes c on c.id_cliente = v.id_cliente
    where c.auth_id = auth.uid()
    order by v.fecha_venta desc
    limit 50
)
select coalesce(jsonb_agg(jsonb_build_object(
    'id_venta', v.id_venta,
    'numero_factura', v.numero_factura,
    'fecha_venta', v.fecha_venta,
    'estado_venta', v.estado_venta,
    'subtotal_venta', v.subtotal_venta,
    'descuento_venta', v.descuento_venta,
    'impuesto_venta', v.impuesto_venta,
    'total_venta', v.total_venta,
    'metodo_pago', coalesce(mp.nombre_metodo_pago, '—'),
    'items', coalesce((
        select jsonb_agg(jsonb_build_object(
            'producto', coalesce(p.nombre_producto, 'Producto eliminado'),
            'cantidad', d.cantidad_venta,
            'precio', d.precio_unitario_venta,
            'subtotal', d.subtotal_detalle_venta
        ) order by d.id_detalle_venta)
        from public.detalle_ventas d
        left join public.productos p on p.id_producto = d.id_producto
        where d.id_venta = v.id_venta
    ), '[]'::jsonb)
) order by v.fecha_venta desc), '[]'::jsonb)
from propias v
left join public.metodos_pago mp on mp.id_metodo_pago = v.id_metodo_pago;
$$;

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
           coalesce(nullif(trim(c.nombre_cliente), ''), 'Cliente') as nombre
    from public.resenias_productos r
    left join public.clientes c on c.id_cliente = r.id_cliente
    where r.id_producto = p_id and r.estado_resenia = true
),
mia as (
    select r.id_resenia, r.id_producto, r.id_cliente,
           r.calificacion_resenia, r.comentario_resenia,
           r.fecha_creacion_resenia, r.fecha_actualizacion_resenia,
           coalesce(nullif(trim(c.nombre_cliente), ''), 'Cliente') as nombre
    from public.resenias_productos r
    join public.clientes c on c.id_cliente = r.id_cliente
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

-- ============================================================
-- OPCIONAL · Solo para pruebas locales sin SMTP
-- Marca el correo como confirmado al registrarse (desactiva la
-- confirmación real). NO lo uses en producción.
-- ============================================================
-- create or replace function public.web_autoconfirmar_correo()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = auth, public
-- as $$
-- begin
--     new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
--     return new;
-- end;
-- $$;
--
-- drop trigger if exists web_autoconfirmar_correo on auth.users;
-- create trigger web_autoconfirmar_correo
-- before insert on auth.users
-- for each row execute function public.web_autoconfirmar_correo();
