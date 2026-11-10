-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Tienda · Cupones de descuento                                ║
-- ║  Ejecutar en Supabase antes de descuentos-tienda.sql          ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 1) Definición de cupones (se administran también desde el ERP)
create table if not exists public.cupones (
    id_cupon serial primary key,
    codigo_cupon varchar(40) not null unique,
    nombre_cupon varchar(120) not null,
    descripcion_cupon varchar(240),
    tipo_descuento_cupon varchar(20) not null default 'porcentaje',
    valor_descuento_cupon numeric(10, 2) not null default 0,
    categoria_cupon varchar(80),
    tope_descuento_cupon numeric(10, 2),
    usos_maximos integer not null default 1,
    usos_realizados integer not null default 0,
    fecha_inicio_cupon timestamp without time zone not null default now(),
    fecha_fin_cupon timestamp without time zone,
    estado_cupon boolean not null default true,
    fecha_creacion_cupon timestamp without time zone not null default now()
);

alter table public.cupones add column if not exists tope_descuento_cupon numeric(10, 2);

-- 2) Cupones reclamados por cada cliente (un uso por cliente)
create table if not exists public.cupones_clientes (
    id_cupon_cliente serial primary key,
    id_cupon integer not null references public.cupones(id_cupon) on delete cascade,
    id_cliente integer not null references public.clientes(id_cliente) on delete cascade,
    usado_cupon boolean not null default false,
    fecha_uso_cupon timestamp without time zone,
    fecha_asignacion_cupon timestamp without time zone not null default now(),
    unique (id_cupon, id_cliente)
);

create index if not exists idx_cupones_clientes_cliente on public.cupones_clientes (id_cliente);

-- 3) El pedido guarda el código usado
alter table public.pedidos_web add column if not exists cupon_pedido varchar(40);

-- 4) Cupones disponibles del cliente (sin usar y vigentes)
create or replace function public.web_cupones()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
select coalesce(jsonb_agg(jsonb_build_object(
    'id_cupon', c.id_cupon,
    'codigo', c.codigo_cupon,
    'nombre', c.nombre_cupon,
    'descripcion', c.descripcion_cupon,
    'tipo', c.tipo_descuento_cupon,
    'valor', c.valor_descuento_cupon,
    'etiqueta', case
        when c.tipo_descuento_cupon = 'porcentaje'
            then trunc(c.valor_descuento_cupon)::text || '%'
        else 'C$ ' || to_char(c.valor_descuento_cupon, 'FM999999990.00')
    end,
    'categoria', c.categoria_cupon,
    'tope', c.tope_descuento_cupon,
    'fecha_fin', c.fecha_fin_cupon
) order by c.fecha_fin_cupon nulls last, c.id_cupon), '[]'::jsonb)
from public.cupones_clientes cc
join public.cupones c on c.id_cupon = cc.id_cupon
join public.clientes cl on cl.id_cliente = cc.id_cliente
where cl.auth_id = auth.uid()
  and cc.usado_cupon = false
  and c.estado_cupon = true
  and coalesce(c.usos_realizados, 0) < c.usos_maximos
  and c.fecha_inicio_cupon <= now()
  and (c.fecha_fin_cupon is null or c.fecha_fin_cupon >= now());
$$;

revoke all on function public.web_cupones() from public, anon;
grant execute on function public.web_cupones() to authenticated;

-- 5) Reclamar un cupón por código
create or replace function public.web_canjear_cupon(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_cliente public.clientes%rowtype;
    v_cupon public.cupones%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Inicia sesión para usar cupones.';
    end if;

    select c.* into v_cliente
    from public.clientes c
    where c.auth_id = auth.uid()
    limit 1;

    if v_cliente.id_cliente is null then
        raise exception 'No se encontró tu cuenta de cliente.';
    end if;

    select c.* into v_cupon
    from public.cupones c
    where upper(trim(c.codigo_cupon)) = upper(trim(p_codigo))
      and c.estado_cupon = true
    limit 1;

    if v_cupon.id_cupon is null then
        raise exception 'El cupón no existe o está inactivo.';
    end if;

    if v_cupon.fecha_inicio_cupon > now() then
        raise exception 'Este cupón todavía no está disponible.';
    end if;

    if v_cupon.fecha_fin_cupon is not null and v_cupon.fecha_fin_cupon < now() then
        raise exception 'Este cupón ya expiró.';
    end if;

    if coalesce(v_cupon.usos_realizados, 0) >= coalesce(v_cupon.usos_maximos, 1) then
        raise exception 'Este cupón ya no tiene usos disponibles.';
    end if;

    if exists (
        select 1 from public.cupones_clientes cc
        where cc.id_cupon = v_cupon.id_cupon
          and cc.id_cliente = v_cliente.id_cliente
    ) then
        raise exception 'Ya tienes este cupón en tu cuenta.';
    end if;

    insert into public.cupones_clientes (id_cupon, id_cliente)
    values (v_cupon.id_cupon, v_cliente.id_cliente);

    return jsonb_build_object(
        'success', true,
        'mensaje', 'Cupón agregado a tu cuenta.',
        'cupon', jsonb_build_object(
            'codigo', v_cupon.codigo_cupon,
            'nombre', v_cupon.nombre_cupon,
            'tipo', v_cupon.tipo_descuento_cupon,
            'valor', v_cupon.valor_descuento_cupon,
            'fecha_fin', v_cupon.fecha_fin_cupon
        )
    );
end;
$$;

revoke all on function public.web_canjear_cupon(text) from public, anon;
grant execute on function public.web_canjear_cupon(text) to authenticated;

-- 6) Permisos de las tablas (el ERP las usa con su propio rol)
grant select on public.cupones, public.cupones_clientes to authenticated;

-- 7) Ejemplos de cupones
--    insert into public.cupones (codigo_cupon, nombre_cupon, descripcion_cupon,
--                                tipo_descuento_cupon, valor_descuento_cupon,
--                                usos_maximos, fecha_fin_cupon, estado_cupon)
--    values
--      ('PAREJAS20', 'Cupón parejas', '20% en toda la tienda', 'porcentaje', 20, 100, now() + interval '30 days', true),
--      ('ZAPATOS15', 'Cupón zapatos', '15% solo en zapatos', 'porcentaje', 15, 50, now() + interval '15 days', true)
--    on conflict (codigo_cupon) do nothing;
--
--    Para regalar un cupón a un cliente concreto:
--    insert into public.cupones_clientes (id_cupon, id_cliente)
--    select c.id_cupon, 1 from public.cupones c where c.codigo_cupon = 'PAREJAS20'
--    on conflict do nothing;

