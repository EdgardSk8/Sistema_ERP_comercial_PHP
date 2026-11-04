/* ╔══════════════════════════════════════════════════════════════╗
   ║  TIENDA · Cupón de fidelidad                                 ║
   ║  Cada par comprado aporta el 10% de su precio neto.          ║
   ║  Al completar 10 pares se genera un cupón de monto con el    ║
   ║  acumulado (equivale al precio promedio del par).            ║
   ╚══════════════════════════════════════════════════════════════╝ */

-- 1) Progreso de fidelidad del cliente autenticado
create or replace function public.web_fidelidad()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_cliente integer;
    v_pares integer := 0;
    v_acumulado numeric(12,2) := 0;
    v_ciclo integer := 0;
    v_pendientes jsonb := '[]'::jsonb;
    v_factor numeric(12,6);
    r record;
    i integer;
    v_precio_par numeric(12,2);
begin
    if auth.uid() is null then
        raise exception 'Inicia sesión para continuar.';
    end if;

    select c.id_cliente into v_cliente
    from public.clientes c
    where c.auth_id = auth.uid()
    limit 1;

    if v_cliente is null then
        raise exception 'No se encontró tu cuenta de cliente.';
    end if;

    for r in
        select d.cantidad_venta,
               d.precio_unitario_venta,
               d.monto_impuesto,
               v.descuento_venta,
               sum(d.precio_unitario_venta * d.cantidad_venta + d.monto_impuesto)
                   over (partition by v.id_venta) as base_venta
        from public.detalle_ventas d
        join public.ventas v on v.id_venta = d.id_venta
        where v.id_cliente = v_cliente
          and v.estado_venta = true
          and d.cantidad_venta > 0
        order by v.fecha_venta, v.id_venta, d.id_detalle_venta
    loop
        /* Descuento de la venta repartido proporcionalmente entre los pares. */
        v_factor := case
            when coalesce(r.base_venta, 0) > 0
                then greatest(0, 1 - least(coalesce(r.descuento_venta, 0) / r.base_venta, 1))
            else 1
        end;

        v_precio_par := round(
            ((r.precio_unitario_venta * r.cantidad_venta + r.monto_impuesto) / r.cantidad_venta) * v_factor,
            2
        );

        for i in 1..r.cantidad_venta loop
            v_pares := v_pares + 1;
            v_acumulado := v_acumulado + round(v_precio_par * 0.10, 2);

            if v_pares % 10 = 0 then
                v_ciclo := v_pares / 10;
                v_pendientes := v_pendientes || jsonb_build_array(
                    jsonb_build_object('ciclo', v_ciclo, 'valor', round(v_acumulado, 2))
                );
                v_acumulado := 0;
            end if;
        end loop;
    end loop;

    /* Solo quedan pendientes los ciclos que aún no tienen cupón reclamado. */
    select coalesce(jsonb_agg(item order by (item ->> 'ciclo')::int), '[]'::jsonb)
      into v_pendientes
      from jsonb_array_elements(v_pendientes) item
     where not exists (
         select 1
           from public.cupones c
          where c.codigo_cupon = 'FIEL-' || v_cliente || '-' || (item ->> 'ciclo')
     );

    return jsonb_build_object(
        'success', true,
        'pares_total', v_pares,
        'pares_ciclo', v_pares % 10,
        'pares_faltan', 10 - (v_pares % 10),
        'aporte_ciclo', round(v_acumulado, 2),
        'ciclo_actual', v_ciclo + 1,
        'pendientes', v_pendientes
    );
end;
$$;

-- 2) Reclamar el cupón de un ciclo completado
create or replace function public.web_reclamar_fidelidad(p_ciclo integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_cliente integer;
    v_pares integer := 0;
    v_acumulado numeric(12,2) := 0;
    v_ciclo integer := 0;
    v_valor numeric(12,2) := null;
    v_cupon integer;
    v_codigo text;
    v_factor numeric(12,6);
    r record;
    i integer;
    v_precio_par numeric(12,2);
begin
    if auth.uid() is null then
        raise exception 'Inicia sesión para continuar.';
    end if;

    if p_ciclo is null or p_ciclo < 1 then
        raise exception 'El ciclo del cupón no es válido.';
    end if;

    select c.id_cliente into v_cliente
    from public.clientes c
    where c.auth_id = auth.uid()
    limit 1;

    if v_cliente is null then
        raise exception 'No se encontró tu cuenta de cliente.';
    end if;

    v_codigo := 'FIEL-' || v_cliente || '-' || p_ciclo;

    if exists (select 1 from public.cupones where codigo_cupon = v_codigo) then
        raise exception 'Ese cupón ya fue reclamado.';
    end if;

    for r in
        select d.cantidad_venta,
               d.precio_unitario_venta,
               d.monto_impuesto,
               v.descuento_venta,
               sum(d.precio_unitario_venta * d.cantidad_venta + d.monto_impuesto)
                   over (partition by v.id_venta) as base_venta
        from public.detalle_ventas d
        join public.ventas v on v.id_venta = d.id_venta
        where v.id_cliente = v_cliente
          and v.estado_venta = true
          and d.cantidad_venta > 0
        order by v.fecha_venta, v.id_venta, d.id_detalle_venta
    loop
        v_factor := case
            when coalesce(r.base_venta, 0) > 0
                then greatest(0, 1 - least(coalesce(r.descuento_venta, 0) / r.base_venta, 1))
            else 1
        end;

        v_precio_par := round(
            ((r.precio_unitario_venta * r.cantidad_venta + r.monto_impuesto) / r.cantidad_venta) * v_factor,
            2
        );

        for i in 1..r.cantidad_venta loop
            v_pares := v_pares + 1;
            v_acumulado := v_acumulado + round(v_precio_par * 0.10, 2);

            if v_pares % 10 = 0 then
                v_ciclo := v_pares / 10;

                if v_ciclo = p_ciclo then
                    v_valor := round(v_acumulado, 2);
                end if;

                v_acumulado := 0;
            end if;
        end loop;
    end loop;

    if v_valor is null then
        raise exception 'Todavía no completas ese ciclo de 10 pares.';
    end if;

    if v_valor <= 0 then
        raise exception 'El cupón no tiene saldo disponible.';
    end if;

    insert into public.cupones (
        codigo_cupon,
        nombre_cupon,
        descripcion_cupon,
        tipo_descuento_cupon,
        valor_descuento_cupon,
        categoria_cupon,
        usos_maximos,
        usos_realizados,
        fecha_inicio_cupon,
        fecha_fin_cupon,
        estado_cupon
    ) values (
        v_codigo,
        'Cupón de fidelidad',
        'C$ ' || to_char(v_valor, 'FM999999990.00') || ' por completar 10 pares',
        'monto',
        v_valor,
        'Zapatos',
        1,
        0,
        now(),
        now() + interval '60 days',
        true
    )
    returning id_cupon into v_cupon;

    insert into public.cupones_clientes (id_cupon, id_cliente, usado_cupon, fecha_asignacion_cupon)
    values (v_cupon, v_cliente, false, now());

    return jsonb_build_object(
        'success', true,
        'mensaje', '¡Reclamaste tu cupón de C$ ' || to_char(v_valor, 'FM999999990.00') || '!',
        'cupon', jsonb_build_object(
            'codigo', v_codigo,
            'valor', v_valor,
            'ciclo', p_ciclo
        )
    );
end;
$$;

revoke all on function public.web_fidelidad() from public, anon;
revoke all on function public.web_reclamar_fidelidad(integer) from public, anon;
grant execute on function public.web_fidelidad() to authenticated;
grant execute on function public.web_reclamar_fidelidad(integer) to authenticated;
