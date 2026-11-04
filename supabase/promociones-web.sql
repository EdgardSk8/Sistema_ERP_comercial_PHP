-- Promociones activas para la tienda web
create or replace function public.web_promociones()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
select coalesce(jsonb_agg(jsonb_build_object(
    'id_promocion', pr.id_promocion,
    'id_producto', pr.id_producto,
    'producto', p.nombre_producto,
    'imagen', pr.imagen_promocion,
    'tipo_descuento', pr.tipo_descuento_promocion,
    'valor_descuento', pr.valor_descuento_promocion,
    'fecha_inicio', pr.fecha_inicio_promocion,
    'fecha_fin', pr.fecha_fin_promocion
) order by pr.fecha_inicio_promocion desc, pr.id_promocion desc), '[]'::jsonb)
from public.promociones pr
join public.productos p on p.id_producto = pr.id_producto
where pr.estado_promocion = true
  and pr.imagen_promocion is not null
  and pr.fecha_inicio_promocion <= current_date
  and (pr.fecha_fin_promocion is null or pr.fecha_fin_promocion >= current_date)
  and p.estado_producto = true;
$$;

revoke all on function public.web_promociones() from public, anon;
grant execute on function public.web_promociones() to anon, authenticated;
