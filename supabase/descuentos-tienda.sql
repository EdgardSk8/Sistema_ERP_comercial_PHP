-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Tienda · Descuentos elegibles (sin acumular)                 ║
-- ║  Ejecutar en Supabase (SQL Editor) después de pedidos-web.sql ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 1) Descuentos disponibles para el cliente autenticado
--    Devuelve el descuento de la cuenta (o bienvenida) y las promociones activas.
create or replace function public.web_descuentos_disponibles()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_cliente public.clientes%rowtype;
    v_meta jsonb;
    v_descuento jsonb := 'null'::jsonb;
    v_promociones jsonb;
    v_tipo varchar(20);
    v_valor numeric(10, 2);
begin
    if auth.uid() is null then
        return jsonb_build_object(
            'success', true,
            'descuento_cliente', null,
            'promociones', '[]'::jsonb
        );
    end if;

    select c.* into v_cliente
    from public.clientes c
    where c.auth_id = auth.uid()
    limit 1;

    select u.raw_user_meta_data into v_meta
    from auth.users u
    where u.id = auth.uid();

    v_tipo := nullif(v_cliente.descuento_tipo_cliente, '');
    v_valor := coalesce(v_cliente.descuento_valor_cliente, 0);

    if v_tipo in ('porcentaje', 'monto') and v_valor > 0 then
        v_descuento := jsonb_build_object(
            'id', 'cliente',
            'titulo', 'Descuento especial',
            'detalle', 'Se aplica a todo el pedido',
            'etiqueta', case
                when v_tipo = 'porcentaje' then trunc(v_valor)::text || '%'
                else 'C$ ' || to_char(v_valor, 'FM999999990.00')
            end,
            'tipo', v_tipo,
            'valor', v_valor,
            'alcance', 'total'
        );
    elsif lower(coalesce(v_meta ->> 'descuento_primera_compra', '')) in ('true', 't', '1')
          and lower(coalesce(v_meta ->> 'descuento_primera_compra_usado', '')) not in ('true', 't', '1')
          and (
              nullif(v_meta ->> 'descuento_primera_compra_expira', '') is null
              or (v_meta ->> 'descuento_primera_compra_expira')::timestamptz >= now()
          ) then
        v_descuento := jsonb_build_object(
            'id', 'bienvenida',
            'titulo', 'Descuento de bienvenida',
            'detalle', '10% solo en zapatos',
            'etiqueta', '10%',
            'tipo', 'porcentaje',
            'valor', 10,
            'alcance', 'categoria',
            'categorias', jsonb_build_array('Zapatos')
        );
    end if;

    select coalesce(jsonb_agg(jsonb_build_object(
               'id', 'promocion:' || pr.id_promocion,
               'id_promocion', pr.id_promocion,
               'id_producto', pr.id_producto,
               'titulo', p.nombre_producto,
               'detalle', 'Se suma a tu bienvenida en el resto',
               'etiqueta', case
                   when pr.tipo_descuento_promocion = 'porcentaje'
                       then trunc(coalesce(pr.valor_descuento_promocion, 0))::text || '%'
                   else 'C$ ' || to_char(coalesce(pr.valor_descuento_promocion, 0), 'FM999999990.00')
               end,
               'tipo', pr.tipo_descuento_promocion,
               'valor', pr.valor_descuento_promocion,
               'alcance', 'producto'
           ) order by pr.fecha_inicio_promocion desc, pr.id_promocion desc), '[]'::jsonb)
      into v_promociones
      from public.promociones pr
      join public.productos p on p.id_producto = pr.id_producto
     where pr.estado_promocion = true
       and pr.tipo_descuento_promocion in ('porcentaje', 'monto', 'precio')
       and coalesce(pr.valor_descuento_promocion, 0) > 0
       and pr.fecha_inicio_promocion <= current_date
       and (pr.fecha_fin_promocion is null or pr.fecha_fin_promocion >= current_date)
       and p.estado_producto = true;

    return jsonb_build_object(
        'success', true,
        'descuento_cliente', v_descuento,
        'promociones', v_promociones
    );
end;
$$;

revoke all on function public.web_descuentos_disponibles() from public, anon;
grant execute on function public.web_descuentos_disponibles() to authenticated;

-- 2) Crear pedido con el descuento elegido por el cliente.
--    p_datos.descuento_modo: 'ninguno' | 'bienvenida' | 'cliente' | 'promocion:<id>'
--    Los descuentos nunca se acumulan.
create or replace function public.web_crear_pedido(p_datos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_cliente public.clientes%rowtype;
    v_pedido public.pedidos_web%rowtype;
    v_item jsonb;
    v_cantidad integer;
    v_vt record;
    v_base numeric(10, 2);
    v_precio numeric(10, 2);
    v_impuesto_linea numeric(10, 2);

    v_subtotal numeric(10, 2) := 0;
    v_impuesto numeric(10, 2) := 0;
    v_descuento numeric(10, 2) := 0;
    v_envio numeric(10, 2) := 0;
    v_total numeric(10, 2);

    v_metodo varchar(20);
    v_hora_preferida time;
    v_lat double precision;
    v_lng double precision;
    v_km double precision;

    v_origen_lat constant double precision := 12.423534455595828;
    v_origen_lng constant double precision := -86.84733917589323;
    v_precio_km constant numeric := 15;
    v_redondeo constant numeric := 5;
    v_minimo constant numeric := 30;

    v_descuento_tipo varchar(20);
    v_descuento_valor numeric(10, 2);
    v_meta jsonb;
    v_uso_bienvenida boolean := false;

    v_modo text;
    v_promo public.promociones%rowtype;
    v_promo_id integer;
    v_base_promo numeric(10, 2) := 0;
    v_unidades_promo integer := 0;
    v_base_bienvenida numeric(10, 2) := 0;
    v_base_resto numeric(10, 2) := 0;

    v_cupon public.cupones%rowtype;
    v_cupon_codigo text;
    v_base_cupon numeric(10, 2) := 0;
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

    if coalesce(v_cliente.estado_cliente, false) is false then
        raise exception 'Tu cuenta está desactivada.';
    end if;

    if p_datos is null
       or jsonb_typeof(p_datos -> 'items') <> 'array'
       or jsonb_array_length(p_datos -> 'items') = 0 then
        raise exception 'El pedido no tiene productos.';
    end if;

    v_metodo := coalesce(nullif(trim(p_datos ->> 'metodo_pago'), ''), 'efectivo');

    if v_metodo not in ('efectivo', 'billetera_movil', 'lafise') then
        v_metodo := 'efectivo';
    end if;

    if nullif(trim(p_datos ->> 'hora_entrega_preferida'), '') is not null
       and (p_datos ->> 'hora_entrega_preferida') !~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$' then
        raise exception 'La hora preferida de entrega no es válida.';
    end if;

    v_hora_preferida := nullif(trim(p_datos ->> 'hora_entrega_preferida'), '')::time;

    v_lat := nullif(p_datos -> 'direccion' ->> 'lat', '')::double precision;
    v_lng := nullif(p_datos -> 'direccion' ->> 'lng', '')::double precision;

    if v_lat is null or v_lng is null or (v_lat = 0 and v_lng = 0) then
        raise exception 'La dirección de entrega no tiene ubicación.';
    end if;

    /* Envío por km: misma fórmula que la tienda. */
    v_km := 6371 * 2 * asin(sqrt(
        power(sin(radians((v_lat - v_origen_lat) / 2)), 2)
        + cos(radians(v_origen_lat)) * cos(radians(v_lat))
          * power(sin(radians((v_lng - v_origen_lng) / 2)), 2)
    ));

    v_envio := greatest(v_minimo, floor((v_km * v_precio_km) / v_redondeo) * v_redondeo);

    insert into public.pedidos_web (
        id_cliente,
        estado_pedido,
        estado_pago,
        metodo_pago_web,
        direccion_entrega,
        referencia_entrega,
        latitud_entrega,
        longitud_entrega,
        nombre_recibe,
        telefono_contacto,
        hora_entrega_preferida,
        nota_cliente
    ) values (
        v_cliente.id_cliente,
        'solicitado',
        'pendiente',
        v_metodo,
        nullif(trim(p_datos -> 'direccion' ->> 'direccion'), ''),
        nullif(trim(p_datos -> 'direccion' ->> 'referencia'), ''),
        v_lat,
        v_lng,
        nullif(trim(p_datos -> 'direccion' ->> 'nombre'), ''),
        nullif(trim(p_datos -> 'direccion' ->> 'telefono'), ''),
        v_hora_preferida,
        nullif(trim(p_datos ->> 'nota'), '')
    )
    returning * into v_pedido;

    for v_item in select * from jsonb_array_elements(p_datos -> 'items')
    loop
        v_cantidad := greatest(coalesce((v_item ->> 'cantidad')::int, 0), 0);

        if v_cantidad <= 0 then
            raise exception 'Cantidad inválida en el pedido.';
        end if;

        select vt.id_variacion_talla,
               vt.id_variacion,
               vt.stock,
               vt.precio_venta,
               p.id_producto,
               p.nombre_producto,
               p.precio_venta as precio_producto,
               coalesce(i.porcentaje_impuesto, 0) as impuesto,
               coalesce(nullif(pv.color, ''), 'Único') as color,
               coalesce(t.talla, 'Única') as talla,
               coalesce(cat.nombre_categoria, '') as categoria
          into v_vt
          from public.variacion_tallas vt
          join public.producto_variaciones pv on pv.id_variacion = vt.id_variacion
          join public.productos p on p.id_producto = pv.id_producto
          left join public.impuestos i on i.id_impuesto = p.id_impuesto
          left join public.tallas t on t.id_talla = vt.id_talla
          left join public.categoria cat on cat.id_categoria = p.id_categoria
         where vt.id_variacion_talla = (v_item ->> 'id_variacion_talla')::int
           and p.estado_producto = true
           and pv.estado_variacion = true;

        if v_vt.id_variacion_talla is null then
            raise exception 'Uno de los productos ya no está disponible.';
        end if;

        if coalesce(v_vt.stock, 0) < v_cantidad then
            raise exception 'No hay stock suficiente de %.', v_vt.nombre_producto;
        end if;

        v_base := coalesce(v_vt.precio_venta, v_vt.precio_producto);
        v_precio := round((v_base * (1 + v_vt.impuesto / 100))::numeric, 2);
        v_impuesto_linea := round(((v_precio - v_base) * v_cantidad)::numeric, 2);

        v_subtotal := v_subtotal + (v_precio * v_cantidad);
        v_impuesto := v_impuesto + v_impuesto_linea;

        /* El 10% de bienvenida solo aplica a la categoría Zapatos. */
        if lower(trim(v_vt.categoria)) = 'zapatos' then
            v_base_bienvenida := v_base_bienvenida + (v_precio * v_cantidad);
        end if;

        insert into public.detalle_pedidos_web (
            id_pedido,
            id_producto,
            id_variacion,
            id_variacion_talla,
            nombre_producto,
            color_producto,
            talla_producto,
            cantidad_pedido,
            precio_unitario_pedido,
            subtotal_pedido,
            porcentaje_impuesto_pedido,
            monto_impuesto_pedido
        ) values (
            v_pedido.id_pedido,
            v_vt.id_producto,
            v_vt.id_variacion,
            v_vt.id_variacion_talla,
            v_vt.nombre_producto,
            v_vt.color,
            v_vt.talla,
            v_cantidad,
            v_precio,
            v_precio * v_cantidad,
            v_vt.impuesto,
            v_impuesto_linea
        );
    end loop;

    /* ── Descuento elegido: uno solo, nunca se acumulan ── */
    v_modo := lower(coalesce(nullif(trim(p_datos ->> 'descuento_modo'), ''), 'auto'));

    /* Compatibilidad: pedidos antiguos sin campo siguen usando el descuento de la cuenta. */
    if v_modo = 'auto' then
        if nullif(v_cliente.descuento_tipo_cliente, '') in ('porcentaje', 'monto')
           and coalesce(v_cliente.descuento_valor_cliente, 0) > 0 then
            v_modo := 'cliente';
        else
            v_modo := 'bienvenida';
        end if;
    end if;

    if v_modo not in ('ninguno', 'bienvenida', 'cliente') and v_modo not like 'promocion:%' then
        v_modo := 'ninguno';
    end if;

    /* Cupón (si viene): tiene prioridad sobre el descuento elegido. */
    v_cupon_codigo := nullif(upper(trim(p_datos ->> 'cupon_codigo')), '');

    if v_cupon_codigo is not null then
        select c.* into v_cupon
        from public.cupones c
        join public.cupones_clientes cc on cc.id_cupon = c.id_cupon
        where cc.id_cliente = v_cliente.id_cliente
          and cc.usado_cupon = false
          and upper(c.codigo_cupon) = v_cupon_codigo
          and c.estado_cupon = true
          and (c.fecha_fin_cupon is null or c.fecha_fin_cupon >= now())
        limit 1;

        if v_cupon.id_cupon is null then
            raise exception 'El cupón no es válido o ya fue usado.';
        end if;
    end if;

    if v_cupon.id_cupon is not null then
        select coalesce(sum(d.subtotal_pedido), 0)
          into v_base_cupon
          from public.detalle_pedidos_web d
          join public.productos p on p.id_producto = d.id_producto
          left join public.categoria c on c.id_categoria = p.id_categoria
         where d.id_pedido = v_pedido.id_pedido
           and (v_cupon.categoria_cupon is null
                or lower(trim(coalesce(c.nombre_categoria, ''))) = lower(trim(v_cupon.categoria_cupon)));

        if v_base_cupon > 0 then
            if v_cupon.tipo_descuento_cupon = 'porcentaje' then
                v_descuento := round((v_base_cupon * coalesce(v_cupon.valor_descuento_cupon, 0) / 100)::numeric, 2);
            elsif v_cupon.tipo_descuento_cupon = 'monto' then
                v_descuento := least(v_base_cupon, coalesce(v_cupon.valor_descuento_cupon, 0));
            end if;

            v_descuento := least(v_descuento, v_base_cupon);
        end if;
    elsif v_modo = 'cliente' then
        v_descuento_tipo := nullif(v_cliente.descuento_tipo_cliente, '');
        v_descuento_valor := coalesce(v_cliente.descuento_valor_cliente, 0);

        if v_descuento_tipo = 'porcentaje' and v_descuento_valor > 0 then
            v_descuento := least(v_subtotal, round((v_subtotal * v_descuento_valor / 100)::numeric, 2));
        elsif v_descuento_tipo = 'monto' and v_descuento_valor > 0 then
            v_descuento := least(v_subtotal, v_descuento_valor);
        end if;
    elsif v_modo = 'bienvenida' then
        select u.raw_user_meta_data into v_meta
        from auth.users u
        where u.id = auth.uid();

        if lower(coalesce(v_meta ->> 'descuento_primera_compra', '')) in ('true', 't', '1')
           and lower(coalesce(v_meta ->> 'descuento_primera_compra_usado', '')) not in ('true', 't', '1')
           and (
               nullif(v_meta ->> 'descuento_primera_compra_expira', '') is null
               or (v_meta ->> 'descuento_primera_compra_expira')::timestamptz >= now()
           )
           and v_base_bienvenida > 0 then
            v_descuento := least(v_base_bienvenida, round((v_base_bienvenida * 10 / 100)::numeric, 2));
            v_uso_bienvenida := true;
        end if;
    elsif v_modo like 'promocion:%' then
        v_promo_id := substring(v_modo from '[0-9]+$')::int;

        select pr.* into v_promo
        from public.promociones pr
        where pr.id_promocion = v_promo_id
          and pr.estado_promocion = true
          and pr.fecha_inicio_promocion <= current_date
          and (pr.fecha_fin_promocion is null or pr.fecha_fin_promocion >= current_date);

        if v_promo.id_promocion is not null then
            select coalesce(sum(d.subtotal_pedido), 0),
                   coalesce(sum(d.cantidad_pedido), 0)
              into v_base_promo, v_unidades_promo
              from public.detalle_pedidos_web d
             where d.id_pedido = v_pedido.id_pedido
               and d.id_producto = v_promo.id_producto;

            if v_base_promo > 0 then
                if v_promo.tipo_descuento_promocion = 'porcentaje' then
                    v_descuento := round((v_base_promo * coalesce(v_promo.valor_descuento_promocion, 0) / 100)::numeric, 2);
                elsif v_promo.tipo_descuento_promocion = 'monto' then
                    v_descuento := least(v_base_promo, coalesce(v_promo.valor_descuento_promocion, 0));
                elsif v_promo.tipo_descuento_promocion = 'precio' and v_unidades_promo > 0 then
                    v_descuento := greatest(0,
                        v_base_promo - (coalesce(v_promo.valor_descuento_promocion, 0) * v_unidades_promo)
                    );
                end if;

                v_descuento := least(v_descuento, v_base_promo);
            end if;

            /* La bienvenida nunca se cancela: aplica al resto de zapatos. */
            select u.raw_user_meta_data into v_meta
            from auth.users u
            where u.id = auth.uid();

            if lower(coalesce(v_meta ->> 'descuento_primera_compra', '')) in ('true', 't', '1')
               and lower(coalesce(v_meta ->> 'descuento_primera_compra_usado', '')) not in ('true', 't', '1') then
                select coalesce(sum(d.subtotal_pedido), 0)
                  into v_base_resto
                  from public.detalle_pedidos_web d
                  join public.productos p on p.id_producto = d.id_producto
                  left join public.categoria c on c.id_categoria = p.id_categoria
                 where d.id_pedido = v_pedido.id_pedido
                   and d.id_producto <> v_promo.id_producto
                   and lower(trim(coalesce(c.nombre_categoria, ''))) = 'zapatos';

                if v_base_resto > 0 then
                    v_descuento := v_descuento
                        + least(v_base_resto, round((v_base_resto * 10 / 100)::numeric, 2));
                    v_uso_bienvenida := true;
                end if;
            end if;
        end if;
    end if;

    v_total := greatest(0, v_subtotal - v_descuento + v_envio);

    update public.pedidos_web
       set subtotal_pedido = v_subtotal,
           descuento_pedido = v_descuento,
           impuesto_pedido = v_impuesto,
           costo_envio_pedido = v_envio,
           distancia_km = round(v_km::numeric, 2),
           total_pedido = v_total,
           uso_descuento_bienvenida = v_uso_bienvenida,
           cupon_pedido = v_cupon.codigo_cupon
     where id_pedido = v_pedido.id_pedido
    returning * into v_pedido;

    /* El cupón se consume: un uso por cliente. */
    if v_cupon.id_cupon is not null then
        update public.cupones_clientes
           set usado_cupon = true,
               fecha_uso_cupon = now()
         where id_cupon = v_cupon.id_cupon
           and id_cliente = v_cliente.id_cliente;

        update public.cupones
           set usos_realizados = coalesce(usos_realizados, 0) + 1
         where id_cupon = v_cupon.id_cupon;
    end if;

    if v_uso_bienvenida then
        update auth.users
           set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
               || jsonb_build_object(
                      'descuento_primera_compra', false,
                      'descuento_primera_compra_usado', true
                  )
         where id = auth.uid();
    end if;

    insert into public.pedido_web_estados (
        id_pedido,
        estado_anterior,
        estado_nuevo,
        estado_pago_anterior,
        estado_pago_nuevo,
        origen,
        nota
    ) values (
        v_pedido.id_pedido,
        null,
        'solicitado',
        null,
        'pendiente',
        'web',
        'Pedido creado desde la tienda.'
    );

    return jsonb_build_object(
        'success', true,
        'mensaje', 'Pedido recibido. Te confirmaremos cuando llegue el pago.',
        'pedido', jsonb_build_object(
            'id_pedido', v_pedido.id_pedido,
            'numero_pedido', v_pedido.numero_pedido,
            'estado_pedido', v_pedido.estado_pedido,
            'estado_pago', v_pedido.estado_pago,
            'subtotal_pedido', v_pedido.subtotal_pedido,
            'descuento_pedido', v_pedido.descuento_pedido,
            'costo_envio_pedido', v_pedido.costo_envio_pedido,
            'total_pedido', v_pedido.total_pedido
        )
    );
end;
$$;

    -- 7.b) Aplicar descuento de bienvenida (solo si no se ha usado)
create or replace function public.web_aplicar_descuento_primera_compra()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_meta jsonb;
begin
    if auth.uid() is null then
        raise exception 'Inicia sesión para continuar.';
    end if;

    select u.raw_user_meta_data into v_meta
    from auth.users u
    where u.id = auth.uid();

    if lower(coalesce(v_meta ->> 'descuento_primera_compra_usado', '')) in ('true', 't', '1') then
        raise exception 'Ya usaste tu descuento de bienvenida.';
    end if;

    /* Vale una semana desde que se activa. */
    update auth.users
       set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
           || jsonb_build_object(
                  'descuento_primera_compra', true,
                  'descuento_primera_compra_expira', to_jsonb(now() + interval '7 days')
              )
     where id = auth.uid();

    return jsonb_build_object(
        'success', true,
        'mensaje', 'Descuento de bienvenida aplicado: 10% en zapatos por 7 días.'
    );
end;
$$;

revoke all on function public.web_aplicar_descuento_primera_compra() from public, anon;
grant execute on function public.web_aplicar_descuento_primera_compra() to authenticated;

revoke all on function public.web_crear_pedido(jsonb) from public, anon;
grant execute on function public.web_crear_pedido(jsonb) to authenticated;
