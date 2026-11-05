-- ============================================================
-- Pedidos web · estados del pedido y del pago
-- Ejecutar DESPUÉS de supabase/website.sql y de `php artisan migrate`.
--
-- Estados del pedido:
--   solicitado → aceptado / rechazado
--   aceptado   → preparando
--   preparando → enviado / listo_retiro
--   enviado / listo_retiro → entregado
--   entregado  → devuelto
--   solicitado / aceptado → cancelado
--
-- Estados del pago (independientes del pedido):
--   pendiente → en_revision → pagado
--   parcial · reembolsado
-- ============================================================

-- 1) Numeración legible con el mismo formato de facturación: VTA-20261103-00001
create sequence if not exists public.pedidos_web_numero_seq start with 1;

create or replace function public.web_numero_pedido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.numero_pedido is null then
        new.numero_pedido := 'VTA-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.pedidos_web_numero_seq')::text, 5, '0');
    end if;

    return new;
end;
$$;

drop trigger if exists web_numero_pedido on public.pedidos_web;
create trigger web_numero_pedido
before insert on public.pedidos_web
for each row execute function public.web_numero_pedido();

-- 2) Fechas automáticas según el estado
create or replace function public.web_pedido_fechas()
returns trigger
language plpgsql
as $$
begin
    new.fecha_actualizacion_pedido := now();

    if new.estado_pedido is distinct from old.estado_pedido then
        if new.estado_pedido = 'aceptado' then
            new.fecha_aceptado := coalesce(new.fecha_aceptado, now());
        elsif new.estado_pedido = 'entregado' then
            new.fecha_entregado := coalesce(new.fecha_entregado, now());
        elsif new.estado_pedido in ('cancelado', 'rechazado') then
            new.fecha_cancelado := coalesce(new.fecha_cancelado, now());
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists web_pedido_fechas on public.pedidos_web;
create trigger web_pedido_fechas
before update on public.pedidos_web
for each row execute function public.web_pedido_fechas();

-- 3) RLS · cada cliente solo ve sus propios pedidos
alter table public.pedidos_web enable row level security;
alter table public.detalle_pedidos_web enable row level security;
alter table public.pedido_web_estados enable row level security;

grant select on public.pedidos_web, public.detalle_pedidos_web, public.pedido_web_estados
    to authenticated;

drop policy if exists web_pedidos_select on public.pedidos_web;
create policy web_pedidos_select on public.pedidos_web
    for select to authenticated
    using (exists (
        select 1 from public.clientes c
        where c.id_cliente = pedidos_web.id_cliente and c.auth_id = auth.uid()
    ));

drop policy if exists web_detalle_pedidos_select on public.detalle_pedidos_web;
create policy web_detalle_pedidos_select on public.detalle_pedidos_web
    for select to authenticated
    using (exists (
        select 1
        from public.pedidos_web p
        join public.clientes c on c.id_cliente = p.id_cliente
        where p.id_pedido = detalle_pedidos_web.id_pedido and c.auth_id = auth.uid()
    ));

drop policy if exists web_pedido_estados_select on public.pedido_web_estados;
create policy web_pedido_estados_select on public.pedido_web_estados
    for select to authenticated
    using (exists (
        select 1
        from public.pedidos_web p
        join public.clientes c on c.id_cliente = p.id_cliente
        where p.id_pedido = pedido_web_estados.id_pedido and c.auth_id = auth.uid()
    ));

-- 4) Crear pedido desde la tienda
--    Precio, stock y envío se recalculan en el servidor.
--    El pedido queda: solicitado + pago pendiente.
--    OJO: la versión vigente de esta función (descuentos, cupones, bienvenida
--    y radio máximo de delivery de 20 km con encomienda) está en
--    supabase/descuentos-tienda.sql. Este bloque quedó como referencia
--    histórica; no lo reapliques sin traer esos cambios.
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
               coalesce(t.talla, 'Única') as talla
          into v_vt
          from public.variacion_tallas vt
          join public.producto_variaciones pv on pv.id_variacion = vt.id_variacion
          join public.productos p on p.id_producto = pv.id_producto
          left join public.impuestos i on i.id_impuesto = p.id_impuesto
          left join public.tallas t on t.id_talla = vt.id_talla
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

    /* Descuento del cliente (o 10% de primera compra). */
    v_descuento_tipo := nullif(v_cliente.descuento_tipo_cliente, '');
    v_descuento_valor := coalesce(v_cliente.descuento_valor_cliente, 0);

    if v_descuento_tipo is null
       or v_descuento_tipo not in ('porcentaje', 'monto')
       or v_descuento_valor <= 0 then
        select u.raw_user_meta_data into v_meta
        from auth.users u
        where u.id = auth.uid();

        if lower(coalesce(v_meta ->> 'descuento_primera_compra', '')) in ('true', 't', '1') then
            v_descuento_tipo := 'porcentaje';
            v_descuento_valor := 10;
            v_uso_bienvenida := true;
        end if;
    end if;

    if v_descuento_tipo = 'porcentaje' and v_descuento_valor > 0 then
        v_descuento := least(v_subtotal, round((v_subtotal * v_descuento_valor / 100)::numeric, 2));
    elsif v_descuento_tipo = 'monto' and v_descuento_valor > 0 then
        v_descuento := least(v_subtotal, v_descuento_valor);
    end if;

    v_total := greatest(0, v_subtotal - v_descuento + v_envio);

    update public.pedidos_web
       set subtotal_pedido = v_subtotal,
           descuento_pedido = v_descuento,
           impuesto_pedido = v_impuesto,
           costo_envio_pedido = v_envio,
           distancia_km = round(v_km::numeric, 2),
           total_pedido = v_total,
           uso_descuento_bienvenida = v_uso_bienvenida
     where id_pedido = v_pedido.id_pedido
    returning * into v_pedido;

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

-- 5) Listado de pedidos del cliente
create or replace function public.web_pedidos()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
select coalesce(jsonb_agg(jsonb_build_object(
    'id_pedido', p.id_pedido,
    'numero_pedido', p.numero_pedido,
    'fecha_pedido', p.fecha_pedido,
    'estado_pedido', p.estado_pedido,
    'estado_pago', p.estado_pago,
    'metodo_pago_web', p.metodo_pago_web,
    'metodo_entrega_web', p.metodo_entrega_web,
    'distancia_km', p.distancia_km,
    'subtotal_pedido', p.subtotal_pedido,
    'descuento_pedido', p.descuento_pedido,
    'costo_envio_pedido', p.costo_envio_pedido,
    'total_pedido', p.total_pedido,
    'fecha_entrega_estimada', p.fecha_entrega_estimada,
    'fecha_aceptado', p.fecha_aceptado,
    'fecha_entregado', p.fecha_entregado,
    'fecha_cancelado', p.fecha_cancelado,
    'fecha_enviado', (
        select min(h.fecha_cambio)
        from public.pedido_web_estados h
        where h.id_pedido = p.id_pedido
          and h.estado_nuevo in ('enviado', 'listo_retiro')
    ),
    'hora_entrega_preferida', p.hora_entrega_preferida,
    'nota_negocio', p.nota_negocio,
    'puede_cancelar', p.estado_pedido = 'solicitado' and p.estado_pago <> 'pagado',
    'items', coalesce((
        select jsonb_agg(jsonb_build_object(
            'producto', d.nombre_producto,
            'color', d.color_producto,
            'talla', d.talla_producto,
            'cantidad', d.cantidad_pedido,
            'precio', d.precio_unitario_pedido,
            'subtotal', d.subtotal_pedido
        ) order by d.id_detalle_pedido)
        from public.detalle_pedidos_web d
        where d.id_pedido = p.id_pedido
    ), '[]'::jsonb)
) order by p.fecha_pedido desc), '[]'::jsonb)
from public.pedidos_web p
join public.clientes c on c.id_cliente = p.id_cliente
where c.auth_id = auth.uid();
$$;

-- 6) Detalle de un pedido (con historial de estados)
create or replace function public.web_pedido(p_id integer)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
select jsonb_build_object(
    'id_pedido', p.id_pedido,
    'numero_pedido', p.numero_pedido,
    'fecha_pedido', p.fecha_pedido,
    'estado_pedido', p.estado_pedido,
    'estado_pago', p.estado_pago,
    'metodo_pago_web', p.metodo_pago_web,
    'subtotal_pedido', p.subtotal_pedido,
    'descuento_pedido', p.descuento_pedido,
    'costo_envio_pedido', p.costo_envio_pedido,
    'total_pedido', p.total_pedido,
    'direccion_entrega', p.direccion_entrega,
    'referencia_entrega', p.referencia_entrega,
    'fecha_entrega_estimada', p.fecha_entrega_estimada,
    'fecha_aceptado', p.fecha_aceptado,
    'fecha_entregado', p.fecha_entregado,
    'hora_entrega_preferida', p.hora_entrega_preferida,
    'nota_negocio', p.nota_negocio,
    'items', coalesce((
        select jsonb_agg(jsonb_build_object(
            'producto', d.nombre_producto,
            'color', d.color_producto,
            'talla', d.talla_producto,
            'cantidad', d.cantidad_pedido,
            'precio', d.precio_unitario_pedido,
            'subtotal', d.subtotal_pedido
        ) order by d.id_detalle_pedido)
        from public.detalle_pedidos_web d
        where d.id_pedido = p.id_pedido
    ), '[]'::jsonb),
    'historial', coalesce((
        select jsonb_agg(jsonb_build_object(
            'estado_anterior', h.estado_anterior,
            'estado_nuevo', h.estado_nuevo,
            'estado_pago_anterior', h.estado_pago_anterior,
            'estado_pago_nuevo', h.estado_pago_nuevo,
            'origen', h.origen,
            'nota', h.nota,
            'fecha_cambio', h.fecha_cambio
        ) order by h.fecha_cambio)
        from public.pedido_web_estados h
        where h.id_pedido = p.id_pedido
    ), '[]'::jsonb)
)
from public.pedidos_web p
join public.clientes c on c.id_cliente = p.id_cliente
where p.id_pedido = p_id and c.auth_id = auth.uid();
$$;

-- 7) El cliente cancela solo mientras esté "solicitado"
create or replace function public.web_cancelar_pedido(p_id integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_pedido public.pedidos_web%rowtype;
    v_auth_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Inicia sesión para continuar.';
    end if;

    select p.* into v_pedido
    from public.pedidos_web p
    join public.clientes c on c.id_cliente = p.id_cliente
    where p.id_pedido = p_id and c.auth_id = auth.uid();

    if v_pedido.id_pedido is null then
        raise exception 'Pedido no encontrado.';
    end if;

    if v_pedido.estado_pedido <> 'solicitado' then
        raise exception 'Este pedido ya no se puede cancelar.';
    end if;

    if v_pedido.estado_pago = 'pagado' then
        raise exception 'Tu pago ya fue confirmado. Contacta a la tienda para cancelar.';
    end if;

    update public.pedidos_web
       set estado_pedido = 'cancelado'
     where id_pedido = p_id
    returning * into v_pedido;

    if coalesce(v_pedido.uso_descuento_bienvenida, false) then
        select c.auth_id into v_auth_id
        from public.clientes c
        where c.id_cliente = v_pedido.id_cliente;

        if v_auth_id is not null then
            update auth.users
               set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
                   || jsonb_build_object(
                          'descuento_primera_compra', true,
                          'descuento_primera_compra_usado', false
                      )
             where id = v_auth_id;
        end if;
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
        'solicitado',
        'cancelado',
        v_pedido.estado_pago,
        v_pedido.estado_pago,
        'web',
        'Cancelado por el cliente.'
    );

    return jsonb_build_object('success', true, 'mensaje', 'Pedido cancelado.');
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

    update auth.users
       set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
           || jsonb_build_object('descuento_primera_compra', true)
     where id = auth.uid();

    return jsonb_build_object(
        'success', true,
        'mensaje', 'Descuento de bienvenida aplicado: 10% en cualquier producto.'
    );
end;
$$;

-- 8) Permisos
revoke all on function public.web_crear_pedido(jsonb) from public, anon;
revoke all on function public.web_pedidos() from public, anon;
revoke all on function public.web_pedido(integer) from public, anon;
revoke all on function public.web_cancelar_pedido(integer) from public, anon;
revoke all on function public.web_aplicar_descuento_primera_compra() from public, anon;

grant execute on function public.web_crear_pedido(jsonb) to authenticated;
grant execute on function public.web_pedidos() to authenticated;
grant execute on function public.web_pedido(integer) to authenticated;
grant execute on function public.web_cancelar_pedido(integer) to authenticated;
