-- Lista de deseos: pares agotados que el cliente quiere y aún no están disponibles
create table if not exists public.lista_deseos (
    id_deseo serial primary key,
    id_cliente integer not null references public.clientes(id_cliente) on delete cascade,
    id_producto integer not null,
    id_variacion integer not null,
    id_variacion_talla integer,
    talla varchar(20),
    color varchar(50),
    nota text,
    estado varchar(20) not null default 'pendiente',
    fecha_solicitud timestamptz not null default now(),
    fecha_atendido timestamptz,
    constraint lista_deseos_estado_check check (estado in ('pendiente', 'atendido'))
);

create index if not exists idx_lista_deseos_cliente on public.lista_deseos(id_cliente);

create unique index if not exists uq_lista_deseos_pendiente
    on public.lista_deseos(id_cliente, id_variacion_talla)
    where estado = 'pendiente';

alter table public.lista_deseos alter column id_variacion_talla drop not null;
alter table public.lista_deseos enable row level security;
revoke all on table public.lista_deseos from anon, authenticated;

-- Opciones: todas las variantes de Zapatos con su foto y tallas
create or replace function public.web_deseos_opciones()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
select coalesce(jsonb_agg(jsonb_build_object(
    'id_producto', p.id_producto,
    'nombre', p.nombre_producto,
    'id_variacion', v.id_variacion,
    'color', coalesce(nullif(v.color, ''), 'Único'),
    'imagen', coalesce(
        (select case
                    when vi.imagen like 'imagenes/%' then '/' || vi.imagen
                    else '/imagenes/productosvariaciones/' || vi.imagen
                end
         from public.variacion_imagenes vi
         where vi.id_variacion = v.id_variacion
         order by vi.orden
         limit 1),
        case
            when p.imagen_producto is null then null
            when position('/' in p.imagen_producto) > 0 then '/' || p.imagen_producto
            else '/imagenes/productos/' || p.imagen_producto
        end
    ),
    'tallas', coalesce((
        select jsonb_agg(jsonb_build_object(
            'id_variacion_talla', vt.id_variacion_talla,
            'talla', coalesce(t.talla, 'Única'),
            'stock', coalesce(vt.stock, 0)
        ) order by t.talla)
        from public.variacion_tallas vt
        left join public.tallas t on t.id_talla = vt.id_talla
        where vt.id_variacion = v.id_variacion
    ), '[]'::jsonb)
) order by p.nombre_producto, v.color), '[]'::jsonb)
from public.productos p
join public.producto_variaciones v on v.id_producto = p.id_producto
join public.categoria c on c.id_categoria = p.id_categoria
where p.estado_producto = true
  and v.estado_variacion = true
  and lower(c.nombre_categoria) = 'zapatos';
$$;

-- Solicitudes del cliente
create or replace function public.web_lista_deseos()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
select coalesce(jsonb_agg(jsonb_build_object(
    'id_deseo', d.id_deseo,
    'id_producto', d.id_producto,
    'id_variacion', d.id_variacion,
    'id_variacion_talla', d.id_variacion_talla,
    'producto', p.nombre_producto,
    'talla', d.talla,
    'color', d.color,
    'nota', d.nota,
    'estado', d.estado,
    'fecha_solicitud', d.fecha_solicitud,
    'fecha_atendido', d.fecha_atendido,
    'imagen', coalesce(
        (select case
                    when vi.imagen like 'imagenes/%' then '/' || vi.imagen
                    else '/imagenes/productosvariaciones/' || vi.imagen
                end
         from public.variacion_imagenes vi
         where vi.id_variacion = d.id_variacion
         order by vi.orden
         limit 1),
        case
            when p.imagen_producto is null then null
            when position('/' in p.imagen_producto) > 0 then '/' || p.imagen_producto
            else '/imagenes/productos/' || p.imagen_producto
        end
    )
) order by d.fecha_solicitud desc), '[]'::jsonb)
from public.lista_deseos d
join public.clientes c on c.id_cliente = d.id_cliente
left join public.productos p on p.id_producto = d.id_producto
where c.auth_id = auth.uid();
$$;

-- Crear solicitud (cualquier talla 36–44 de Zapatos, aunque no exista en inventario)
drop function if exists public.web_crear_deseo(integer, text);

create or replace function public.web_crear_deseo(
    p_id_producto integer,
    p_id_variacion integer,
    p_talla text,
    p_nota text default null,
    p_id_variacion_talla integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_cliente public.clientes%rowtype;
    v_producto record;
    v_stock integer := 0;
    v_talla text := nullif(trim(p_talla), '');
begin
    if auth.uid() is null then
        raise exception 'Inicia sesión para continuar.';
    end if;

    select c.* into v_cliente
    from public.clientes c
    where c.auth_id = auth.uid()
    limit 1;

    if v_cliente.id_cliente is null then
        raise exception 'No se encontró tu cuenta de cliente.';
    end if;

    if v_talla is null then
        raise exception 'Selecciona una talla.';
    end if;

    select p.id_producto,
           p.nombre_producto,
           c.nombre_categoria,
           coalesce(nullif(v.color, ''), 'Único') as color
      into v_producto
      from public.productos p
      join public.categoria c on c.id_categoria = p.id_categoria
      join public.producto_variaciones v on v.id_producto = p.id_producto
     where p.id_producto = p_id_producto
       and v.id_variacion = p_id_variacion
       and p.estado_producto = true
       and v.estado_variacion = true;

    if v_producto.id_producto is null then
        raise exception 'El producto seleccionado no está disponible.';
    end if;

    if lower(v_producto.nombre_categoria) <> 'zapatos' then
        raise exception 'Solo puedes solicitar pares de la categoría Zapatos.';
    end if;

    if p_id_variacion_talla is not null then
        if not exists (
            select 1
            from public.variacion_tallas vt
            where vt.id_variacion_talla = p_id_variacion_talla
              and vt.id_variacion = p_id_variacion
        ) then
            raise exception 'La talla seleccionada no existe.';
        end if;

        select coalesce(vt.stock, 0)
          into v_stock
          from public.variacion_tallas vt
         where vt.id_variacion_talla = p_id_variacion_talla;
    else
        select coalesce(sum(vt.stock), 0)
          into v_stock
          from public.variacion_tallas vt
          join public.tallas t on t.id_talla = vt.id_talla
         where vt.id_variacion = p_id_variacion
           and t.talla = v_talla;
    end if;

    if coalesce(v_stock, 0) > 0 then
        raise exception 'Esa talla ya está disponible para comprar.';
    end if;

    if exists (
        select 1
        from public.lista_deseos d
        where d.id_cliente = v_cliente.id_cliente
          and d.id_producto = p_id_producto
          and d.id_variacion = p_id_variacion
          and d.talla = v_talla
          and d.estado = 'pendiente'
    ) then
        raise exception 'Ya solicitaste este par.';
    end if;

    insert into public.lista_deseos (
        id_cliente,
        id_producto,
        id_variacion,
        id_variacion_talla,
        talla,
        color,
        nota
    ) values (
        v_cliente.id_cliente,
        p_id_producto,
        p_id_variacion,
        p_id_variacion_talla,
        v_talla,
        v_producto.color,
        nullif(trim(p_nota), '')
    );

    return jsonb_build_object(
        'success', true,
        'mensaje', 'Solicitud enviada. Te avisaremos cuando esté disponible.'
    );
end;
$$;

-- Eliminar una solicitud propia
create or replace function public.web_eliminar_deseo(p_id integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id integer;
begin
    if auth.uid() is null then
        raise exception 'Inicia sesión para continuar.';
    end if;

    delete from public.lista_deseos d
    using public.clientes c
    where d.id_cliente = c.id_cliente
      and c.auth_id = auth.uid()
      and d.id_deseo = p_id
    returning d.id_deseo into v_id;

    if v_id is null then
        raise exception 'Solicitud no encontrada.';
    end if;

    return jsonb_build_object('success', true, 'mensaje', 'Solicitud eliminada.');
end;
$$;

revoke all on function public.web_deseos_opciones() from public, anon;
revoke all on function public.web_lista_deseos() from public, anon;
revoke all on function public.web_crear_deseo(integer, integer, text, text, integer) from public, anon;
revoke all on function public.web_eliminar_deseo(integer) from public, anon;

grant execute on function public.web_deseos_opciones() to authenticated;
grant execute on function public.web_lista_deseos() to authenticated;
grant execute on function public.web_crear_deseo(integer, integer, text, text, integer) to authenticated;
grant execute on function public.web_eliminar_deseo(integer) to authenticated;
