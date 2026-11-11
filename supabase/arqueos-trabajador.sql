-- ============================================================================
-- Arqueos del repartidor · Tienda Supabase
-- Requiere haber ejecutado supabase/admin-web.sql (tablas repartidor_cierres
-- y repartidor_cierre_pedidos) y supabase/trabajadores.sql.
-- ============================================================================

create or replace function public.web_trabajador_arqueos(
    p_desde date default null,
    p_hasta date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_trabajador public.trabajadores%rowtype;
    v_desde date := coalesce(p_desde, current_date - 6);
    v_hasta date := coalesce(p_hasta, current_date);
    v_comision numeric(5, 2);
    v_pendiente jsonb;
    v_historial jsonb;
begin
    if auth.uid() is null then
        raise exception 'Inicia sesión para ver tu arqueo.';
    end if;

    select t.* into v_trabajador
    from public.trabajadores t
    join public.clientes c on c.id_cliente = t.id_cliente
    where c.auth_id = auth.uid()
    limit 1;

    if v_trabajador.id_trabajador is null then
        raise exception 'No tienes un perfil de repartidor.';
    end if;

    if v_hasta < v_desde then
        raise exception 'La fecha final no puede ser anterior a la inicial.';
    end if;

    v_comision := coalesce(v_trabajador.porcentaje_comision, 0);

    with pendientes as (
        select
            p.id_pedido,
            p.numero_pedido,
            p.nombre_recibe,
            coalesce(p.metodo_pago_web, 'efectivo') as metodo,
            coalesce(p.fecha_entregado, p.fecha_actualizacion_pedido)::date as fecha,
            round(greatest(p.total_pedido - p.costo_envio_pedido, 0), 2) as productos,
            p.costo_envio_pedido as delivery,
            p.total_pedido as total
        from public.pedidos_web p
        where p.id_trabajador = v_trabajador.id_trabajador
          and p.estado_pedido = 'entregado'
          and p.estado_pago <> 'reembolsado'
          and coalesce(p.fecha_entregado, p.fecha_actualizacion_pedido)::date between v_desde and v_hasta
          and not exists (
              select 1
              from public.repartidor_cierre_pedidos cp
              where cp.id_pedido = p.id_pedido
          )
    ),
    por_dia as (
        select
            fecha,
            count(*)::integer as pedidos,
            coalesce(sum(productos), 0) as productos,
            coalesce(sum(productos) filter (where metodo = 'efectivo'), 0) as efectivo,
            coalesce(sum(productos) filter (where metodo = 'billetera_movil'), 0) as billetera,
            coalesce(sum(productos) filter (where metodo = 'lafise'), 0) as lafise,
            coalesce(sum(productos) filter (where metodo not in ('efectivo', 'billetera_movil', 'lafise')), 0) as otros,
            coalesce(sum(delivery), 0) as delivery,
            jsonb_agg(
                jsonb_build_object(
                    'id_pedido', id_pedido,
                    'numero', numero_pedido,
                    'cliente', nombre_recibe,
                    'metodo', metodo,
                    'productos', productos,
                    'delivery', delivery,
                    'total', total
                )
                order by id_pedido
            ) as detalle
        from pendientes
        group by fecha
    )
    select jsonb_build_object(
        'dias', coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'fecha', fecha,
                    'pedidos', pedidos,
                    'productos', productos,
                    'efectivo', efectivo,
                    'billetera', billetera,
                    'lafise', lafise,
                    'otros', otros,
                    'delivery', delivery,
                    'comision_empresa', round(delivery * v_comision / 100, 2),
                    'ganancia_delivery', round(delivery - round(delivery * v_comision / 100, 2), 2),
                    'total_empresa', round(productos + round(delivery * v_comision / 100, 2), 2),
                    'detalle', detalle
                )
                order by fecha desc
            ),
            '[]'::jsonb
        ),
        'pedidos', coalesce(sum(pedidos), 0),
        'productos', coalesce(sum(productos), 0),
        'efectivo', coalesce(sum(efectivo), 0),
        'billetera', coalesce(sum(billetera), 0),
        'lafise', coalesce(sum(lafise), 0),
        'otros', coalesce(sum(otros), 0),
        'delivery', coalesce(sum(delivery), 0),
        'comision_empresa', round(coalesce(sum(delivery), 0) * v_comision / 100, 2),
        'ganancia_delivery', round(
            coalesce(sum(delivery), 0)
            - round(coalesce(sum(delivery), 0) * v_comision / 100, 2),
            2
        ),
        'total_empresa', round(
            coalesce(sum(productos), 0)
            + round(coalesce(sum(delivery), 0) * v_comision / 100, 2),
            2
        )
    )
    into v_pendiente
    from por_dia;

    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'id_cierre', c.id_cierre,
                'desde', c.fecha_desde,
                'hasta', c.fecha_hasta,
                'pedidos', c.total_pedidos,
                'productos', c.total_productos,
                'efectivo', c.total_efectivo,
                'billetera', c.total_billetera,
                'lafise', c.total_lafise,
                'delivery', c.total_delivery,
                'comision_empresa', c.comision_empresa,
                'ganancia_delivery', c.ganancia_delivery,
                'total_empresa', c.total_empresa,
                'monto_entregado', c.monto_entregado,
                'diferencia', c.diferencia,
                'nota', c.nota,
                'fecha_cierre', c.fecha_cierre
            )
            order by c.fecha_cierre desc
        ),
        '[]'::jsonb
    )
    into v_historial
    from public.repartidor_cierres c
    where c.id_trabajador = v_trabajador.id_trabajador
      and c.fecha_desde <= v_hasta
      and c.fecha_hasta >= v_desde;

    return jsonb_build_object(
        'success', true,
        'trabajador', jsonb_build_object(
            'id_trabajador', v_trabajador.id_trabajador,
            'nombre', v_trabajador.nombre_trabajador,
            'comision', v_comision
        ),
        'desde', v_desde,
        'hasta', v_hasta,
        'pendiente', v_pendiente,
        'historial', v_historial
    );
end;
$$;

revoke all on function public.web_trabajador_arqueos(date, date) from public;
revoke all on function public.web_trabajador_arqueos(date, date) from anon;
grant execute on function public.web_trabajador_arqueos(date, date) to authenticated;

notify pgrst, 'reload schema';
