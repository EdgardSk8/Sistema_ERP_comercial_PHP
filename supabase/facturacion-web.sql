-- ============================================================================
-- Tienda · Facturación de mostrador desde el panel (celular)
--
-- Crea ventas reales en la misma base del ERP:
--   · correlativo VTA-YYYYMMDD-#####
--   · detalle_ventas con IVA incluido en el precio de catálogo
--   · consumo de lotes FIFO, stock y movimientos_inventario
--   · cobro en caja (efectivo con caja abierta) o en la cuenta
--
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de supabase/admin-web.sql.
-- Es idempotente: se puede volver a ejecutar sin duplicar nada.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Datos para facturar: empresa, cliente genérico, métodos de pago y caja
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_factura_datos(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_cliente jsonb;
    v_metodos jsonb;
    v_empresa jsonb := '{}'::jsonb;
    v_caja integer;
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    select jsonb_build_object(
               'id_cliente', c.id_cliente,
               'nombre_cliente', c.nombre_cliente
           )
      into v_cliente
      from public.clientes c
     where c.estado_cliente
     order by case
                  when c.nombre_cliente ilike 'cliente generico%' then 0
                  when c.nombre_cliente ilike 'consumidor final%' then 1
                  when c.id_cliente = 1 then 2
                  else 3
              end,
              c.id_cliente
     limit 1;

    select coalesce(jsonb_agg(jsonb_build_object(
               'id_metodo_pago', m.id_metodo_pago,
               'nombre', m.nombre_metodo_pago,
               'es_efectivo', m.id_metodo_pago = 1,
               'cuentas', coalesce((
                   select jsonb_agg(jsonb_build_object(
                              'id_cuenta', c.id_cuenta,
                              'nombre_cuenta', c.nombre_cuenta
                          ) order by c.nombre_cuenta)
                     from public.metodo_pago_cuenta mpc
                     join public.cuentas c on c.id_cuenta = mpc.id_cuenta
                    where mpc.id_metodo_pago = m.id_metodo_pago
                      and mpc.estado
                      and c.estado
               ), '[]'::jsonb)
           ) order by (m.id_metodo_pago = 1) desc, m.nombre_metodo_pago), '[]'::jsonb)
      into v_metodos
      from public.metodos_pago m
     where m.estado_metodo_pago
       and (
           m.id_metodo_pago = 1
           or exists (
               select 1
                 from public.metodo_pago_cuenta mpc
                 join public.cuentas c on c.id_cuenta = mpc.id_cuenta
                where mpc.id_metodo_pago = m.id_metodo_pago
                  and mpc.estado
                  and c.estado
           )
       );

    select c.id_caja into v_caja
      from public.cajas c
     where c.estado_caja
       and c.id_usuario = v_admin
     order by c.id_caja desc
     limit 1;

    begin
        select jsonb_build_object(
                   'nombre_empresa', cr.nombre_empresa,
                   'ruc_empresa', cr.ruc_empresa,
                   'direccion_empresa', cr.direccion_empresa,
                   'telefono_empresa', cr.telefono_empresa
               )
          into v_empresa
          from public.credenciales cr
         order by cr.id
         limit 1;
    exception
        when undefined_table then
            v_empresa := '{}'::jsonb;
    end;

    return jsonb_build_object(
        'success', true,
        'sesion', true,
        'empresa', coalesce(v_empresa, '{}'::jsonb),
        'cliente', v_cliente,
        'metodos', v_metodos,
        'caja_abierta', v_caja is not null
    );
end;
$$;

revoke all on function public.web_admin_factura_datos(text) from public;
grant execute on function public.web_admin_factura_datos(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2) Productos para facturar (con IVA y variantes)
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_factura_productos(
    p_token text,
    p_buscar text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_buscar text := nullif(btrim(coalesce(p_buscar, '')), '');
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    return jsonb_build_object(
        'success', true,
        'sesion', true,
        'productos', coalesce((
            select jsonb_agg(jsonb_build_object(
                       'id_producto', x.id_producto,
                       'nombre', x.nombre,
                       'precio', x.precio,
                       'precio_final', round(x.precio * (1 + x.iva / 100), 2),
                       'iva', x.iva,
                       'stock', x.stock,
                       'imagen', x.imagen,
                       'variantes', x.variantes
                   ) order by x.nombre)
              from (
                  select p.id_producto,
                         p.nombre_producto as nombre,
                         p.precio_venta as precio,
                         coalesce(i.porcentaje_impuesto, 0) as iva,
                         p.stock_actual as stock,
                         p.imagen_producto as imagen,
                         coalesce((
                             select jsonb_agg(jsonb_build_object(
                                        'id_variacion_talla', vt.id_variacion_talla,
                                        'etiqueta', btrim(concat_ws(' · ', pv.color, t.talla)),
                                        'precio', coalesce(vt.precio_venta, p.precio_venta),
                                        'precio_final', round(
                                            coalesce(vt.precio_venta, p.precio_venta)
                                            * (1 + coalesce(i.porcentaje_impuesto, 0) / 100),
                                            2
                                        ),
                                        'stock', vt.stock,
                                        'sku', vt.sku
                                    ) order by pv.color, t.talla)
                               from public.producto_variaciones pv
                               join public.variacion_tallas vt on vt.id_variacion = pv.id_variacion
                               join public.tallas t on t.id_talla = vt.id_talla
                              where pv.id_producto = p.id_producto
                                and pv.estado_variacion
                         ), '[]'::jsonb) as variantes
                    from public.productos p
                    join public.impuestos i on i.id_impuesto = p.id_impuesto
                   where p.estado_producto
                     and (v_buscar is null or p.nombre_producto ilike '%' || v_buscar || '%')
                   order by p.nombre_producto
                   limit 24
              ) x
        ), '[]'::jsonb)
    );
end;
$$;

revoke all on function public.web_admin_factura_productos(text, text) from public;
grant execute on function public.web_admin_factura_productos(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3) Clientes para el buscador de la factura
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_factura_clientes(
    p_token text,
    p_buscar text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_buscar text := nullif(btrim(coalesce(p_buscar, '')), '');
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    return jsonb_build_object(
        'success', true,
        'sesion', true,
        'clientes', coalesce((
            select jsonb_agg(jsonb_build_object(
                       'id_cliente', c.id_cliente,
                       'nombre', c.nombre_cliente,
                       'telefono', c.telefono_cliente
                   ) order by c.nombre_cliente)
              from (
                  select id_cliente, nombre_cliente, telefono_cliente
                    from public.clientes
                   where estado_cliente
                     and (
                         v_buscar is null
                         or nombre_cliente ilike '%' || v_buscar || '%'
                         or coalesce(telefono_cliente, '') ilike '%' || v_buscar || '%'
                     )
                   order by nombre_cliente
                   limit 30
              ) c
        ), '[]'::jsonb)
    );
end;
$$;

revoke all on function public.web_admin_factura_clientes(text, text) from public;
grant execute on function public.web_admin_factura_clientes(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4) Factura en JSON (para imprimir y reimprimir con el mismo formato)
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_factura_json(
    p_id_venta integer,
    p_aviso text default null
)
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
    select jsonb_build_object(
               'id_venta', v.id_venta,
               'numero_factura', v.numero_factura,
               'fecha', v.fecha_venta,
               'cliente', coalesce(c.nombre_cliente, 'Consumidor final'),
               'usuario', coalesce(u.nombre_usuario, ''),
               'metodo', coalesce(m.nombre_metodo_pago, ''),
               'id_metodo_pago', v.id_metodo_pago,
               'subtotal', v.subtotal_venta,
               'impuesto', v.impuesto_venta,
               'descuento', v.descuento_venta,
               'total', v.total_venta,
               'recibido', coalesce(v.monto_recibido, v.total_venta),
               'vuelto', coalesce(v.vuelto, 0),
               'moneda', v.moneda,
               'anulada', not v.estado_venta,
               'aviso', p_aviso,
               'items', coalesce((
                   select jsonb_agg(jsonb_build_object(
                              'nombre', p.nombre_producto
                                  || case
                                         when nullif(btrim(coalesce(d.descripcion_variacion, '')), '') is not null
                                             then ' · ' || d.descripcion_variacion
                                         else ''
                                     end,
                              'cantidad', d.cantidad_venta,
                              'precio', d.precio_unitario_venta,
                              'subtotal', d.subtotal_detalle_venta,
                              'impuesto', d.monto_impuesto,
                              'total', round(d.subtotal_detalle_venta + d.monto_impuesto, 2)
                          ) order by d.id_detalle_venta)
                     from public.detalle_ventas d
                     join public.productos p on p.id_producto = d.id_producto
                    where d.id_venta = v.id_venta
               ), '[]'::jsonb)
           )
      from public.ventas v
      left join public.clientes c on c.id_cliente = v.id_cliente
      left join public.usuarios u on u.id_usuario = v.id_usuario
      left join public.metodos_pago m on m.id_metodo_pago = v.id_metodo_pago
     where v.id_venta = p_id_venta;
$$;

revoke all on function public.web_admin_factura_json(integer, text) from public;
revoke all on function public.web_admin_factura_json(integer, text) from anon;
revoke all on function public.web_admin_factura_json(integer, text) from authenticated;

-- ----------------------------------------------------------------------------
-- 5) Crear la factura (venta de contado)
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_factura_crear(
    p_token text,
    p_id_cliente integer,
    p_id_metodo_pago integer,
    p_id_cuenta integer,
    p_items jsonb,
    p_descuento numeric default 0,
    p_recibido numeric default null,
    p_referencia text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_lineas integer;
    v_item record;
    v_producto public.productos%rowtype;
    v_vt public.variacion_tallas%rowtype;
    v_lote public.lotes_inventario%rowtype;
    v_caja public.cajas%rowtype;
    v_id_vt integer;
    v_cantidad integer;
    v_iva numeric;
    v_factor numeric;
    v_precio_final numeric;
    v_impuesto_unitario numeric;
    v_precio_sin_impuesto numeric;
    v_subtotal numeric;
    v_impuesto numeric;
    v_subtotal_general numeric := 0;
    v_impuesto_general numeric := 0;
    v_descuento numeric := round(coalesce(p_descuento, 0), 2);
    v_total numeric;
    v_recibido numeric;
    v_vuelto numeric := 0;
    v_es_efectivo boolean;
    v_id_caja integer;
    v_id_cuenta integer;
    v_saldo_cuenta numeric;
    v_nombre_metodo text;
    v_cliente text;
    v_id_venta integer;
    v_numero text;
    v_concepto text;
    v_aviso text;
    v_restante integer;
    v_tomar integer;
    v_costo_total numeric;
    v_costo_respaldo numeric;
    v_costo_unitario numeric;
    v_consumos jsonb;
    v_stock_resultante integer;
    v_color text;
    v_talla text;
    v_descripcion text;
    v_sku text;
    v_referencia text := left(nullif(btrim(coalesce(p_referencia, '')), ''), 120);
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
        return jsonb_build_object('success', false, 'mensaje', 'Agrega al menos un producto a la factura.');
    end if;

    select count(*)
      into v_lineas
      from jsonb_to_recordset(p_items) as x(id_producto integer, cantidad integer);

    if v_lineas > 60 then
        return jsonb_build_object('success', false, 'mensaje', 'La factura admite hasta 60 líneas.');
    end if;

    if v_descuento < 0 then
        return jsonb_build_object('success', false, 'mensaje', 'El descuento no puede ser negativo.');
    end if;

    select m.nombre_metodo_pago, (m.id_metodo_pago = 1)
      into v_nombre_metodo, v_es_efectivo
      from public.metodos_pago m
     where m.id_metodo_pago = p_id_metodo_pago
       and m.estado_metodo_pago;

    if not found then
        return jsonb_build_object('success', false, 'mensaje', 'Selecciona un método de pago activo.');
    end if;

    select c.nombre_cliente
      into v_cliente
      from public.clientes c
     where c.id_cliente = p_id_cliente;

    if v_es_efectivo then
        select c.* into v_caja
          from public.cajas c
         where c.estado_caja
           and c.id_usuario = v_admin
         order by c.id_caja desc
         limit 1
         for update;

        if found then
            v_id_caja := v_caja.id_caja;
        else
            if p_id_cuenta is not null then
                select c.id_cuenta into v_id_cuenta
                  from public.cuentas c
                 where c.id_cuenta = p_id_cuenta
                   and c.estado;
            end if;

            if v_id_cuenta is null then
                select c.id_cuenta into v_id_cuenta
                  from public.cuentas c
                 where c.estado
                 order by c.id_cuenta
                 limit 1;
            end if;

            if v_id_cuenta is not null then
                v_aviso := 'No hay caja abierta: el cobro en efectivo se registró en la cuenta.';
            end if;
        end if;
    else
        if p_id_cuenta is not null then
            select c.id_cuenta into v_id_cuenta
              from public.cuentas c
             where c.id_cuenta = p_id_cuenta
               and c.estado;
        end if;

        if v_id_cuenta is null then
            select c.id_cuenta into v_id_cuenta
              from public.metodo_pago_cuenta mpc
              join public.cuentas c on c.id_cuenta = mpc.id_cuenta
             where mpc.id_metodo_pago = p_id_metodo_pago
               and mpc.estado
               and c.estado
             order by c.id_cuenta
             limit 1;
        end if;

        if v_id_cuenta is null then
            select c.id_cuenta into v_id_cuenta
              from public.cuentas c
             where c.estado
             order by c.id_cuenta
             limit 1;
        end if;
    end if;

    if v_id_caja is null and v_id_cuenta is null then
        return jsonb_build_object('success', false, 'mensaje', 'No hay caja abierta ni una cuenta activa para registrar el cobro.');
    end if;

    begin
        -- El ERP genera el número con max(id_venta) + 1; este bloqueo evita choques.
        lock table public.ventas in exclusive mode;

        v_id_venta := nextval('public.ventas_id_venta_seq');
        v_numero := 'VTA-' || to_char(now(), 'YYYYMMDD') || '-'
            || lpad(v_id_venta::text, 5, '0');

        insert into public.ventas (
            id_venta, numero_factura, fecha_venta, id_cliente, id_usuario,
            id_caja, id_cuenta, subtotal_venta, impuesto_venta, descuento_venta,
            total_venta, estado_venta, id_metodo_pago, monto_recibido, vuelto, moneda
        ) values (
            v_id_venta, v_numero, now(), p_id_cliente, v_admin,
            v_id_caja, v_id_cuenta, 0, 0, v_descuento,
            0, true, p_id_metodo_pago, 0, 0, 'NIO'
        );

        for v_item in
            select x.id_producto, x.id_variacion_talla, x.cantidad
              from jsonb_to_recordset(p_items)
                   as x(id_producto integer, id_variacion_talla integer, cantidad integer)
        loop
            v_cantidad := v_item.cantidad;

            if v_cantidad is null or v_cantidad < 1 then
                raise exception 'Cada producto debe tener una cantidad de al menos 1.';
            end if;

            select * into v_producto
              from public.productos
             where id_producto = v_item.id_producto
             for update;

            if not found then
                raise exception 'Un producto de la factura ya no existe.';
            end if;

            v_iva := 0;

            select coalesce(i.porcentaje_impuesto, 0)
              into v_iva
              from public.impuestos i
             where i.id_impuesto = v_producto.id_impuesto;

            v_iva := coalesce(v_iva, 0);

            v_id_vt := null;
            v_descripcion := null;
            v_sku := null;

            if v_item.id_variacion_talla is not null then
                select vt.* into v_vt
                  from public.variacion_tallas vt
                  join public.producto_variaciones pv on pv.id_variacion = vt.id_variacion
                 where vt.id_variacion_talla = v_item.id_variacion_talla
                   and pv.id_producto = v_producto.id_producto
                   and pv.estado_variacion
                 for update of vt;

                if not found then
                    raise exception 'La variante de "%" ya no está disponible.', v_producto.nombre_producto;
                end if;

                v_id_vt := v_vt.id_variacion_talla;

                select pv.color into v_color
                  from public.producto_variaciones pv
                 where pv.id_variacion = v_vt.id_variacion;

                select t.talla into v_talla
                  from public.tallas t
                 where t.id_talla = v_vt.id_talla;

                v_descripcion := nullif(
                    btrim(concat_ws(' · ', nullif(v_color, ''), nullif(v_talla, ''))),
                    ''
                );
                v_sku := v_vt.sku;
            end if;

            -- El precio de catálogo se guarda sin IVA; el cliente paga el precio final.
            v_factor := 1 + (v_iva / 100);
            v_precio_final := round(
                (
                    case
                        when v_id_vt is not null then coalesce(v_vt.precio_venta, v_producto.precio_venta)
                        else v_producto.precio_venta
                    end
                ) * v_factor,
                2
            );

            v_impuesto_unitario := case
                when v_factor > 0 then round(v_precio_final * (v_iva / 100) / v_factor, 2)
                else 0
            end;
            v_precio_sin_impuesto := round(v_precio_final - v_impuesto_unitario, 2);

            v_subtotal := round(v_precio_sin_impuesto * v_cantidad, 2);
            v_impuesto := round(v_impuesto_unitario * v_cantidad, 2);

            v_subtotal_general := v_subtotal_general + v_subtotal;
            v_impuesto_general := v_impuesto_general + v_impuesto;

            -- Costo histórico FIFO: consume primero los lotes más antiguos.
            v_costo_respaldo := coalesce(
                case when v_id_vt is not null then v_vt.precio_compra end,
                v_producto.precio_compra,
                0
            );
            v_costo_total := 0;
            v_restante := v_cantidad;
            v_consumos := '[]'::jsonb;

            loop
                exit when v_restante <= 0;

                select l.* into v_lote
                  from public.lotes_inventario l
                 where l.id_producto = v_producto.id_producto
                   and (
                       (v_id_vt is null and l.id_variacion_talla is null)
                       or (v_id_vt is not null and l.id_variacion_talla = v_id_vt)
                   )
                   and l.cantidad_disponible > 0
                 order by l.fecha_ingreso, l.id_lote
                 limit 1
                 for update;

                exit when not found;

                v_tomar := least(v_restante, v_lote.cantidad_disponible);
                exit when v_tomar <= 0;

                v_costo_total := v_costo_total + round(v_lote.costo_unitario, 2) * v_tomar;
                v_restante := v_restante - v_tomar;

                update public.lotes_inventario
                   set cantidad_disponible = cantidad_disponible - v_tomar
                 where id_lote = v_lote.id_lote;

                v_consumos := v_consumos || jsonb_build_array(jsonb_build_object(
                    'id_lote', v_lote.id_lote,
                    'cantidad', v_tomar,
                    'costo_unitario', round(v_lote.costo_unitario, 2)
                ));
            end loop;

            if v_restante > 0 then
                v_costo_respaldo := round(v_costo_respaldo, 2);
                v_costo_total := v_costo_total + v_costo_respaldo * v_restante;
                v_consumos := v_consumos || jsonb_build_array(jsonb_build_object(
                    'id_lote', null,
                    'cantidad', v_restante,
                    'costo_unitario', v_costo_respaldo
                ));
            end if;

            v_costo_unitario := case
                when v_cantidad > 0 then round(v_costo_total / v_cantidad, 6)
                else 0
            end;

            if v_id_vt is not null then
                if v_vt.stock < v_cantidad then
                    raise exception 'La talla "%" de "%" ya no tiene existencias.',
                        coalesce(v_talla, 'seleccionada'), v_producto.nombre_producto;
                end if;

                update public.variacion_tallas
                   set stock = stock - v_cantidad
                 where id_variacion_talla = v_id_vt
                   and stock >= v_cantidad;

                if not found then
                    raise exception 'La talla "%" de "%" ya no tiene existencias.',
                        coalesce(v_talla, 'seleccionada'), v_producto.nombre_producto;
                end if;

                update public.productos
                   set stock_actual = stock_actual - v_cantidad
                 where id_producto = v_producto.id_producto
                 returning stock_actual into v_stock_resultante;
            else
                update public.productos
                   set stock_actual = stock_actual - v_cantidad
                 where id_producto = v_producto.id_producto
                   and stock_actual >= v_cantidad
                 returning stock_actual into v_stock_resultante;

                if not found then
                    raise exception 'El producto "%" ya no tiene existencias.', v_producto.nombre_producto;
                end if;
            end if;

            insert into public.detalle_ventas (
                id_venta, id_producto, id_variacion_talla, descripcion_variacion,
                sku_variacion, cantidad_venta, precio_unitario_venta,
                costo_unitario_venta, consumos_lotes, subtotal_detalle_venta,
                porcentaje_impuesto, monto_impuesto
            ) values (
                v_id_venta, v_producto.id_producto, v_id_vt, v_descripcion,
                v_sku, v_cantidad, v_precio_sin_impuesto,
                v_costo_unitario, v_consumos, v_subtotal,
                v_iva, v_impuesto
            );

            insert into public.movimientos_inventario (
                id_producto, id_variacion_talla, tipo_movimiento, cantidad_movimiento,
                stock_resultante, motivo_movimiento, id_referencia, tipo_referencia,
                precio_unitario, fecha_movimiento, id_usuario
            ) values (
                v_producto.id_producto, v_id_vt, 'SALIDA', v_cantidad,
                v_stock_resultante,
                left('Venta mostrador ' || v_numero, 150),
                v_id_venta, 'VENTA', v_precio_sin_impuesto, now(), v_admin
            );
        end loop;

        if v_descuento > round(v_subtotal_general + v_impuesto_general, 2) + 0.001 then
            raise exception 'El descuento no puede ser mayor que el total de la factura.';
        end if;

        v_total := round(greatest(v_subtotal_general + v_impuesto_general - v_descuento, 0), 2);

        if v_es_efectivo then
            v_recibido := round(coalesce(p_recibido, v_total), 2);

            if v_recibido + 0.001 < v_total then
                raise exception 'El efectivo recibido no cubre el total (C$ %).',
                    to_char(v_total, 'FM999999990.00');
            end if;

            v_vuelto := round(v_recibido - v_total, 2);
        else
            v_recibido := v_total;
            v_vuelto := 0;
        end if;

        update public.ventas
           set subtotal_venta = v_subtotal_general,
               impuesto_venta = v_impuesto_general,
               total_venta = v_total,
               monto_recibido = v_recibido,
               vuelto = v_vuelto
         where id_venta = v_id_venta;

        v_concepto := left(
            'Venta mostrador · ' || v_nombre_metodo || ' · Factura ' || v_numero
            || ' · ' || coalesce(v_cliente, 'Consumidor final')
            || case when v_referencia is not null then ' · Ref. ' || v_referencia else '' end,
            150
        );

        if v_id_caja is not null then
            insert into public.movimientos_caja (
                id_caja, tipo_movimiento_caja, concepto_movimiento_caja,
                monto_movimiento_caja, fecha_movimiento_caja, id_usuario, id_referencia
            ) values (
                v_id_caja, 'INGRESO', v_concepto,
                v_total, now(), v_admin, v_id_venta
            );
        else
            update public.cuentas
               set saldo_actual = saldo_actual + v_total
             where id_cuenta = v_id_cuenta
               and estado
             returning saldo_actual into v_saldo_cuenta;

            if not found then
                raise exception 'La cuenta seleccionada ya no está activa.';
            end if;

            insert into public.movimientos_cuentas (
                id_cuenta, tipo_movimiento, monto, descripcion, fecha, id_usuario
            ) values (
                v_id_cuenta, 'INGRESO', v_total, v_concepto, now(), v_admin
            );
        end if;

        return jsonb_build_object(
            'success', true,
            'sesion', true,
            'mensaje', 'Factura ' || v_numero || ' registrada.',
            'factura', public.web_admin_factura_json(v_id_venta, v_aviso)
        );
    exception
        when sqlstate 'P0001' then
            return jsonb_build_object('success', false, 'mensaje', SQLERRM);
    end;
end;
$$;

revoke all on function public.web_admin_factura_crear(text, integer, integer, integer, jsonb, numeric, numeric, text) from public;
grant execute on function public.web_admin_factura_crear(text, integer, integer, integer, jsonb, numeric, numeric, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6) Facturas del día (para reimprimir)
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_facturas_dia(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    return jsonb_build_object(
        'success', true,
        'sesion', true,
        'cantidad', coalesce((
            select count(*)
              from public.ventas v
             where v.fecha_venta >= current_date
               and v.fecha_venta < current_date + 1
               and v.estado_venta
        ), 0),
        'total_dia', coalesce((
            select sum(v.total_venta)
              from public.ventas v
             where v.fecha_venta >= current_date
               and v.fecha_venta < current_date + 1
               and v.estado_venta
        ), 0),
        'facturas', coalesce((
            select jsonb_agg(jsonb_build_object(
                       'id_venta', x.id_venta,
                       'numero_factura', x.numero_factura,
                       'hora', to_char(x.fecha_venta, 'HH24:MI'),
                       'cliente', x.cliente,
                       'total', x.total_venta,
                       'metodo', x.metodo,
                       'anulada', not x.estado_venta
                   ) order by x.fecha_venta desc)
              from (
                  select v.id_venta, v.numero_factura, v.fecha_venta, v.total_venta,
                         v.estado_venta,
                         coalesce(c.nombre_cliente, 'Consumidor final') as cliente,
                         coalesce(m.nombre_metodo_pago, '') as metodo
                    from public.ventas v
                    left join public.clientes c on c.id_cliente = v.id_cliente
                    left join public.metodos_pago m on m.id_metodo_pago = v.id_metodo_pago
                   where v.fecha_venta >= current_date
                     and v.fecha_venta < current_date + 1
                   order by v.fecha_venta desc
                   limit 40
              ) x
        ), '[]'::jsonb)
    );
end;
$$;

revoke all on function public.web_admin_facturas_dia(text) from public;
grant execute on function public.web_admin_facturas_dia(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7) Detalle de una factura para reimprimir
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_factura_detalle(
    p_token text,
    p_id_venta integer
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    if not exists (select 1 from public.ventas v where v.id_venta = p_id_venta) then
        return jsonb_build_object('success', false, 'mensaje', 'Factura no encontrada.');
    end if;

    return jsonb_build_object(
        'success', true,
        'sesion', true,
        'factura', public.web_admin_factura_json(p_id_venta, null)
    );
end;
$$;

revoke all on function public.web_admin_factura_detalle(text, integer) from public;
grant execute on function public.web_admin_factura_detalle(text, integer) to anon, authenticated;
