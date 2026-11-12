-- ============================================================================
-- Tienda Supabase - Panel administrador movil
-- Ejecutar en el SQL Editor de Supabase (o con el script de despliegue).
--
-- Login: usuario y contrasena del ERP (tabla usuarios, bcrypt).
-- Sesiones: token aleatorio; en la base solo se guarda su hash SHA-256.
-- Todas las RPC administrativas validan el token y caducan a las 12 horas.
-- Incluye el cobro en linea (Lafise / billetera movil): registra el pago,
-- factura la venta, descuenta inventario y guarda el historial.
-- Tambien permite aceptar/facturar (efectivo puede quedar pendiente de pago),
-- cerrar el delivery por periodo (productos, delivery, comision y ganancia)
-- y abonar cuentas por cobrar (parcial o total) desde caja o una cuenta activa.
-- La verificacion usa bcrypt ($2y$/$2a$) con pgcrypto. Si el ERP cambia a
-- Argon2, hay que reemplazar la comprobacion de web_admin_login.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1) Sesiones e intentos
-- ----------------------------------------------------------------------------

create table if not exists public.admin_web_sesiones (
    id_sesion bigserial primary key,
    id_usuario integer not null references public.usuarios (id_usuario) on delete cascade,
    token_hash text not null unique,
    creado timestamptz not null default now(),
    expira timestamptz not null
);

create index if not exists idx_admin_web_sesiones_expira
    on public.admin_web_sesiones (expira);

create table if not exists public.admin_web_intentos (
    usuario text primary key,
    intentos integer not null default 0,
    ultimo_intento timestamptz not null default now(),
    bloqueado_hasta timestamptz
);

alter table public.admin_web_sesiones enable row level security;
alter table public.admin_web_intentos enable row level security;

revoke all on table public.admin_web_sesiones from public, anon, authenticated;
revoke all on table public.admin_web_intentos from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 1.1) Historial de cobros en linea hechos desde el panel
-- ----------------------------------------------------------------------------

create table if not exists public.pedidos_web_pagos (
    id_pago_pedido bigserial primary key,
    id_pedido integer not null references public.pedidos_web (id_pedido) on delete cascade,
    id_venta integer references public.ventas (id_venta) on delete set null,
    id_usuario integer not null references public.usuarios (id_usuario),
    monto numeric(12, 2) not null check (monto > 0),
    metodo character varying(30) not null,
    referencia character varying(120),
    fecha timestamp without time zone not null default now()
);

do $$
begin
    if exists (
        select 1
          from information_schema.columns
         where table_schema = 'public'
           and table_name = 'pedidos_web_pagos'
           and column_name = 'fecha'
           and data_type = 'timestamp with time zone'
    ) then
        alter table public.pedidos_web_pagos
            alter column fecha type timestamp without time zone
            using fecha at time zone 'UTC';
    end if;
end $$;

create index if not exists idx_pedidos_web_pagos_pedido
    on public.pedidos_web_pagos (id_pedido, fecha);

alter table public.pedidos_web_pagos enable row level security;

revoke all on table public.pedidos_web_pagos from public, anon, authenticated;
revoke all on sequence public.pedidos_web_pagos_id_pago_pedido_seq from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 1.2) Cierres de delivery (arqueo por periodo)
-- ----------------------------------------------------------------------------

create table if not exists public.repartidor_cierres (
    id_cierre bigserial primary key,
    id_trabajador integer not null references public.trabajadores (id_trabajador) on delete restrict,
    fecha_desde date not null,
    fecha_hasta date not null,
    total_pedidos integer not null default 0,
    total_efectivo numeric(12, 2) not null default 0,
    total_billetera numeric(12, 2) not null default 0,
    total_lafise numeric(12, 2) not null default 0,
    total_otros numeric(12, 2) not null default 0,
    total_productos numeric(12, 2) not null default 0,
    total_delivery numeric(12, 2) not null default 0,
    porcentaje_comision numeric(5, 2) not null default 0,
    comision_empresa numeric(12, 2) not null default 0,
    ganancia_delivery numeric(12, 2) not null default 0,
    total_empresa numeric(12, 2) not null default 0,
    monto_entregado numeric(12, 2) not null default 0,
    diferencia numeric(12, 2) not null default 0,
    nota varchar(255),
    id_usuario integer references public.usuarios (id_usuario) on delete set null,
    fecha_cierre timestamptz not null default now()
);

create table if not exists public.repartidor_cierre_pedidos (
    id_cierre bigint not null references public.repartidor_cierres (id_cierre) on delete cascade,
    id_pedido integer not null unique references public.pedidos_web (id_pedido) on delete restrict,
    metodo_pago varchar(20) not null,
    total_producto numeric(12, 2) not null default 0,
    costo_envio numeric(12, 2) not null default 0,
    total_pedido numeric(12, 2) not null default 0,
    primary key (id_cierre, id_pedido)
);

create index if not exists idx_repartidor_cierres_trabajador
    on public.repartidor_cierres (id_trabajador, fecha_cierre desc);

alter table public.repartidor_cierres enable row level security;
alter table public.repartidor_cierre_pedidos enable row level security;

revoke all on table public.repartidor_cierres from public, anon, authenticated;
revoke all on table public.repartidor_cierre_pedidos from public, anon, authenticated;
revoke all on sequence public.repartidor_cierres_id_cierre_seq from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2) Validacion de sesion (uso interno de las demas funciones)
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_sesion(p_token text)
returns integer
language sql
stable
security definer
set search_path = public, extensions
as $$
    select s.id_usuario
    from public.admin_web_sesiones s
    where s.token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
      and s.expira > now()
    limit 1;
$$;

revoke all on function public.web_admin_sesion(text) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3) Login / logout
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_login(p_usuario text, p_clave text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_usuario text := lower(btrim(coalesce(p_usuario, '')));
    v_id integer;
    v_nombre text;
    v_rol text;
    v_hash text;
    v_hash_crypt text;
    v_token text;
    v_intentos integer;
    v_bloqueado timestamptz;
begin
    if v_usuario = '' or coalesce(p_clave, '') = '' then
        return jsonb_build_object('success', false, 'mensaje', 'Ingresa tu usuario y contraseña.');
    end if;

    select i.intentos, i.bloqueado_hasta
      into v_intentos, v_bloqueado
    from public.admin_web_intentos i
    where i.usuario = v_usuario;

    if v_bloqueado is not null and v_bloqueado > now() then
        return jsonb_build_object(
            'success', false,
            'mensaje', 'Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.'
        );
    end if;

    select u.id_usuario, u.nombre_usuario, u.password_hash_usuario, r.nombre_rol
      into v_id, v_nombre, v_hash, v_rol
    from public.usuarios u
    join public.roles r on r.id_rol = u.id_rol_usuario
    where lower(u.nombre_usuario) = v_usuario
      and u.estado_usuario = true
      and r.nombre_rol = 'Administrador'
    limit 1;

    if v_id is not null and v_hash is not null then
        v_hash_crypt := replace(v_hash, '$2y$', '$2a$');
    end if;

    if v_id is null
       or v_hash is null
       or crypt(p_clave, v_hash_crypt) is distinct from v_hash_crypt then

        insert into public.admin_web_intentos as i (usuario, intentos, ultimo_intento, bloqueado_hasta)
        values (v_usuario, 1, now(), null)
        on conflict (usuario) do update
        set intentos = case
                when i.ultimo_intento < now() - interval '15 minutes' then 1
                else i.intentos + 1
            end,
            ultimo_intento = now(),
            bloqueado_hasta = case
                when (case
                        when i.ultimo_intento < now() - interval '15 minutes' then 1
                        else i.intentos + 1
                      end) >= 5
                    then now() + interval '15 minutes'
                else null
            end;

        return jsonb_build_object(
            'success', false,
            'mensaje', 'Usuario o contraseña incorrectos.'
        );
    end if;

    delete from public.admin_web_intentos where usuario = v_usuario;
    delete from public.admin_web_sesiones
    where id_usuario = v_id
       or expira < now();

    v_token := encode(gen_random_bytes(32), 'hex');

    insert into public.admin_web_sesiones (id_usuario, token_hash, expira)
    values (v_id, encode(digest(v_token, 'sha256'), 'hex'), now() + interval '12 hours');

    return jsonb_build_object(
        'success', true,
        'token', v_token,
        'usuario', v_nombre,
        'rol', v_rol,
        'expira_horas', 12
    );
end;
$$;

revoke all on function public.web_admin_login(text, text) from public;
grant execute on function public.web_admin_login(text, text) to anon, authenticated;

create or replace function public.web_admin_logout(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
    delete from public.admin_web_sesiones
    where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

    return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.web_admin_logout(text) from public;
grant execute on function public.web_admin_logout(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4) Resumen del panel
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_resumen(p_token text)
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
        'resumen', jsonb_build_object(
            'pedidos_solicitados', (
                select count(*) from public.pedidos_web where estado_pedido = 'solicitado'
            ),
            'pedidos_pagos_pendientes', (
                select count(*) from public.pedidos_web
                where estado_pago in ('pendiente', 'en_revision', 'parcial')
            ),
            'trabajadores_pendientes', (
                select count(*) from public.trabajadores where estado_trabajador = 'pendiente'
            ),
            'promociones_activas', (
                select count(*) from public.promociones
                where estado_promocion = true
                  and fecha_inicio_promocion <= current_date
                  and (fecha_fin_promocion is null or fecha_fin_promocion >= current_date)
            ),
            'cupones_activos', (
                select count(*) from public.cupones
                where estado_cupon = true
                  and (fecha_fin_cupon is null or fecha_fin_cupon >= now())
            ),
            'por_cobrar_saldo', (
                select coalesce(sum(p.total_plan - p.pagado), 0)
                from (
                    select pp.id_plan_pago,
                        (select coalesce(sum(cu.monto_cuota), 0)
                         from public.cuotas_venta cu
                         where cu.id_plan_pago = pp.id_plan_pago) as total_plan,
                        (select coalesce(sum(a.monto_aplicado), 0)
                         from public.aplicaciones_pago_cuota a
                         join public.cuotas_venta cu on cu.id_cuota = a.id_cuota
                         where cu.id_plan_pago = pp.id_plan_pago) as pagado
                    from public.planes_pago pp
                    join public.ventas v on v.id_venta = pp.id_venta and v.estado_venta = true
                ) p
                where p.total_plan - p.pagado > 0
            ),
            'por_cobrar_vencidas', (
                select count(*)
                from public.cuotas_venta cu
                join public.planes_pago pp on pp.id_plan_pago = cu.id_plan_pago
                join public.ventas v on v.id_venta = pp.id_venta and v.estado_venta = true
                where cu.fecha_vencimiento < current_date
                  and cu.monto_cuota > (
                      select coalesce(sum(a.monto_aplicado), 0)
                      from public.aplicaciones_pago_cuota a
                      where a.id_cuota = cu.id_cuota
                  )
            )
        )
    );
end;
$$;

revoke all on function public.web_admin_resumen(text) from public;
grant execute on function public.web_admin_resumen(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5) Pedidos web (logistica segura)
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_pedidos(
    p_token text,
    p_estado text default null,
    p_pago text default null,
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
        'pedidos', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id_pedido', p.id_pedido,
                'numero', p.numero_pedido,
                'fecha', p.fecha_pedido,
                'estado', p.estado_pedido,
                'pago', p.estado_pago,
                'metodo_pago', p.metodo_pago_web,
                'metodo_entrega', p.metodo_entrega_web,
                'total', p.total_pedido,
                'cliente', c.nombre_cliente,
                'telefono', coalesce(nullif(p.telefono_contacto, ''), c.telefono_cliente),
                'recibe', p.nombre_recibe,
                'direccion', p.direccion_entrega,
                'referencia', p.referencia_entrega,
                'hora_preferida', p.hora_entrega_preferida,
                'nota_cliente', p.nota_cliente,
                'id_venta', p.id_venta,
                'facturado', p.id_venta is not null,
                'factura', (
                    select v.numero_factura from public.ventas v where v.id_venta = p.id_venta
                ),
                'puede_cobrar', (
                    p.id_venta is null
                    and p.metodo_pago_web in ('lafise', 'billetera_movil')
                    and p.estado_pedido in ('solicitado', 'aceptado')
                    and p.estado_pago in ('pendiente', 'en_revision')
                ),
                'puede_aceptar', (
                    p.id_venta is null
                    and p.estado_pedido in ('solicitado', 'aceptado')
                    and p.estado_pago in ('pendiente', 'en_revision', 'pagado')
                    and (
                        p.metodo_pago_web = 'efectivo'
                        or p.estado_pago = 'pagado'
                    )
                ),
                'puede_pagar', (
                    p.id_venta is not null
                    and p.estado_pago in ('pendiente', 'en_revision')
                    and not exists (
                        select 1 from public.pedidos_web_pagos x where x.id_pedido = p.id_pedido
                    )
                ),
                'puede_cancelar', (
                    p.id_venta is null
                    and p.estado_pedido in ('solicitado', 'aceptado')
                    and p.estado_pago in ('pendiente', 'en_revision')
                ),
                'repartidor', t.nombre_trabajador,
                'items_total', (
                    select count(*) from public.detalle_pedidos_web d where d.id_pedido = p.id_pedido
                ),
                'items_resumen', (
                    select string_agg(x.nombre_producto, ', ')
                    from (
                        select d.nombre_producto
                        from public.detalle_pedidos_web d
                        where d.id_pedido = p.id_pedido
                        order by d.id_detalle_pedido
                        limit 3
                    ) x
                )
            ) order by p.fecha_pedido desc)
            from public.pedidos_web p
            join public.clientes c on c.id_cliente = p.id_cliente
            left join public.trabajadores t on t.id_trabajador = p.id_trabajador
            where (p_estado is null or p_estado = '' or p_estado = 'todos' or p.estado_pedido = p_estado)
              and (p_pago is null or p_pago = '' or p_pago = 'todos' or p.estado_pago = p_pago)
              and (
                  v_buscar is null
                  or p.numero_pedido ilike '%' || v_buscar || '%'
                  or c.nombre_cliente ilike '%' || v_buscar || '%'
                  or coalesce(p.telefono_contacto, '') ilike '%' || v_buscar || '%'
                  or coalesce(c.telefono_cliente, '') ilike '%' || v_buscar || '%'
              )
            limit 80
        ), '[]'::jsonb),
        'resumen', (
            select jsonb_build_object(
                'total', count(*),
                'solicitados', count(*) filter (where estado_pedido = 'solicitado'),
                'aceptados', count(*) filter (where estado_pedido = 'aceptado'),
                'en_camino', count(*) filter (where estado_pedido in ('enviado', 'listo_retiro')),
                'entregados', count(*) filter (where estado_pedido = 'entregado'),
                'pagos_pendientes', count(*) filter (where estado_pago in ('pendiente', 'en_revision', 'parcial'))
            )
            from public.pedidos_web
        )
    );
end;
$$;

revoke all on function public.web_admin_pedidos(text, text, text, text) from public;
grant execute on function public.web_admin_pedidos(text, text, text, text) to anon, authenticated;

create or replace function public.web_admin_pedido(p_token text, p_id integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_pedido public.pedidos_web%rowtype;
    v_cliente record;
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    select * into v_pedido from public.pedidos_web where id_pedido = p_id;

    if not found then
        return jsonb_build_object('success', false, 'mensaje', 'Pedido no encontrado.');
    end if;

    select c.nombre_cliente, c.correo_cliente, c.telefono_cliente
      into v_cliente
    from public.clientes c
    where c.id_cliente = v_pedido.id_cliente;

    return jsonb_build_object(
        'success', true,
        'sesion', true,
        'pedido', jsonb_build_object(
            'id_pedido', v_pedido.id_pedido,
            'numero', v_pedido.numero_pedido,
            'fecha', v_pedido.fecha_pedido,
            'estado', v_pedido.estado_pedido,
            'pago', v_pedido.estado_pago,
            'metodo_pago', v_pedido.metodo_pago_web,
            'metodo_entrega', v_pedido.metodo_entrega_web,
            'subtotal', v_pedido.subtotal_pedido,
            'descuento', v_pedido.descuento_pedido,
            'impuesto', v_pedido.impuesto_pedido,
            'envio', v_pedido.costo_envio_pedido,
            'total', v_pedido.total_pedido,
            'cliente', v_cliente.nombre_cliente,
            'correo', v_cliente.correo_cliente,
            'telefono', coalesce(nullif(v_pedido.telefono_contacto, ''), v_cliente.telefono_cliente),
            'recibe', v_pedido.nombre_recibe,
            'direccion', v_pedido.direccion_entrega,
            'referencia', v_pedido.referencia_entrega,
            'latitud', v_pedido.latitud_entrega,
            'longitud', v_pedido.longitud_entrega,
            'distancia_km', v_pedido.distancia_km,
            'hora_preferida', v_pedido.hora_entrega_preferida,
            'nota_cliente', v_pedido.nota_cliente,
            'nota_negocio', v_pedido.nota_negocio,
            'id_venta', v_pedido.id_venta,
            'facturado', v_pedido.id_venta is not null,
            'factura', (
                select v.numero_factura from public.ventas v where v.id_venta = v_pedido.id_venta
            ),
            'puede_cobrar', (
                v_pedido.id_venta is null
                and v_pedido.metodo_pago_web in ('lafise', 'billetera_movil')
                and v_pedido.estado_pedido in ('solicitado', 'aceptado')
                and v_pedido.estado_pago in ('pendiente', 'en_revision')
            ),
            'puede_aceptar', (
                v_pedido.id_venta is null
                and v_pedido.estado_pedido in ('solicitado', 'aceptado')
                and v_pedido.estado_pago in ('pendiente', 'en_revision', 'pagado')
                and (
                    v_pedido.metodo_pago_web = 'efectivo'
                    or v_pedido.estado_pago = 'pagado'
                )
            ),
            'puede_pagar', (
                v_pedido.id_venta is not null
                and v_pedido.estado_pago in ('pendiente', 'en_revision')
                and not exists (
                    select 1 from public.pedidos_web_pagos x where x.id_pedido = p_id
                )
            ),
            'puede_cancelar', (
                v_pedido.id_venta is null
                and v_pedido.estado_pedido in ('solicitado', 'aceptado')
                and v_pedido.estado_pago in ('pendiente', 'en_revision')
            ),
            'pagado', case
                when v_pedido.estado_pago = 'pagado' then v_pedido.total_pedido
                else coalesce((
                    select sum(pg.monto) from public.pedidos_web_pagos pg where pg.id_pedido = p_id
                ), 0)
            end,
            'saldo', case
                when v_pedido.estado_pago = 'pagado' then 0
                else greatest(v_pedido.total_pedido - coalesce((
                    select sum(pg.monto) from public.pedidos_web_pagos pg where pg.id_pedido = p_id
                ), 0), 0)
            end,
            'repartidor', (
                select t.nombre_trabajador
                from public.trabajadores t
                where t.id_trabajador = v_pedido.id_trabajador
            ),
            'transiciones', case
                when v_pedido.id_venta is null
                     and v_pedido.estado_pedido = 'solicitado'
                     and v_pedido.estado_pago in ('pendiente', 'en_revision')
                    then '["rechazado", "cancelado"]'::jsonb
                when v_pedido.id_venta is null
                     and v_pedido.estado_pedido = 'aceptado'
                     and v_pedido.estado_pago in ('pendiente', 'en_revision')
                    then '["cancelado"]'::jsonb
                when v_pedido.id_venta is not null
                     and v_pedido.estado_pedido = 'aceptado'
                     and v_pedido.estado_pago = 'pagado'
                    then '["enviado"]'::jsonb
                when v_pedido.id_venta is not null
                     and v_pedido.estado_pedido = 'enviado'
                     and v_pedido.estado_pago = 'pagado'
                    then '["entregado"]'::jsonb
                when v_pedido.id_venta is not null
                     and v_pedido.estado_pedido = 'listo_retiro'
                     and v_pedido.estado_pago = 'pagado'
                    then '["entregado"]'::jsonb
                else '[]'::jsonb
            end
        ),
        'items', coalesce((
            select jsonb_agg(jsonb_build_object(
                'nombre', d.nombre_producto,
                'color', d.color_producto,
                'talla', d.talla_producto,
                'cantidad', d.cantidad_pedido,
                'precio', d.precio_unitario_pedido,
                'subtotal', d.subtotal_pedido
            ) order by d.id_detalle_pedido)
            from public.detalle_pedidos_web d
            where d.id_pedido = p_id
        ), '[]'::jsonb),
        'historial', coalesce((
            select jsonb_agg(jsonb_build_object(
                'estado_anterior', h.estado_anterior,
                'estado_nuevo', h.estado_nuevo,
                'pago_anterior', h.estado_pago_anterior,
                'pago_nuevo', h.estado_pago_nuevo,
                'origen', h.origen,
                'nota', h.nota,
                'fecha', h.fecha_cambio,
                'usuario', u.nombre_usuario
            ) order by h.fecha_cambio)
            from public.pedido_web_estados h
            left join public.usuarios u on u.id_usuario = h.id_usuario
            where h.id_pedido = p_id
        ), '[]'::jsonb),
        'pagos', coalesce(
            (
                select jsonb_agg(jsonb_build_object(
                    'fecha', pg.fecha,
                    'monto', pg.monto,
                    'metodo', case pg.metodo
                        when 'efectivo' then 'Efectivo'
                        when 'lafise' then 'Lafise'
                        when 'billetera_movil' then 'Billetera móvil'
                        else pg.metodo
                    end,
                    'referencia', pg.referencia,
                    'usuario', u.nombre_usuario,
                    'origen', 'panel'
                ) order by pg.fecha)
                from public.pedidos_web_pagos pg
                left join public.usuarios u on u.id_usuario = pg.id_usuario
                where pg.id_pedido = p_id
            ),
            (
                select jsonb_build_array(jsonb_build_object(
                    'fecha', v.fecha_venta,
                    'monto', v.total_venta,
                    'metodo', 'Pago registrado en el ERP',
                    'referencia', v.numero_factura,
                    'usuario', null,
                    'origen', 'erp'
                ))
                from public.ventas v
                where v.id_venta = v_pedido.id_venta
                  and v_pedido.id_venta is not null
                  and v_pedido.estado_pago = 'pagado'
                  and not exists (
                      select 1 from public.pedidos_web_pagos x where x.id_pedido = p_id
                  )
            ),
            '[]'::jsonb
        )
    );
end;
$$;

revoke all on function public.web_admin_pedido(text, integer) from public;
grant execute on function public.web_admin_pedido(text, integer) to anon, authenticated;

create or replace function public.web_admin_pedido_estado(
    p_token text,
    p_id integer,
    p_estado text,
    p_nota text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_pedido public.pedidos_web%rowtype;
    v_nuevo text := nullif(btrim(coalesce(p_estado, '')), '');
    v_permitidos text[];
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    select * into v_pedido from public.pedidos_web where id_pedido = p_id for update;

    if not found then
        return jsonb_build_object('success', false, 'mensaje', 'Pedido no encontrado.');
    end if;

    if v_nuevo is null or v_nuevo = v_pedido.estado_pedido then
        return jsonb_build_object('success', false, 'mensaje', 'Selecciona un estado diferente.');
    end if;

    -- Los pedidos sin facturar solo se pueden rechazar/cancelar si no hay dinero pagado.
    if v_pedido.id_venta is null then
        if v_pedido.estado_pedido = 'solicitado'
           and v_pedido.estado_pago in ('pendiente', 'en_revision') then
            v_permitidos := array['rechazado', 'cancelado'];
        elsif v_pedido.estado_pedido = 'aceptado'
           and v_pedido.estado_pago in ('pendiente', 'en_revision') then
            v_permitidos := array['cancelado'];
        else
            v_permitidos := array[]::text[];
        end if;
    else
        v_permitidos := case
            when v_pedido.estado_pedido = 'aceptado' and v_pedido.estado_pago = 'pagado'
                then array['enviado']
            when v_pedido.estado_pedido in ('enviado', 'listo_retiro') and v_pedido.estado_pago = 'pagado'
                then array['entregado']
            else array[]::text[]
        end;
    end if;

    if not (v_nuevo = any(v_permitidos)) then
        if v_pedido.id_venta is null then
            return jsonb_build_object(
                'success', false,
                'mensaje', 'Este pedido debe facturarse o rechazarse desde el ERP (aún no tiene venta registrada).'
            );
        end if;

        return jsonb_build_object(
            'success', false,
            'mensaje', 'No se puede cambiar de "' || v_pedido.estado_pedido || '" a "' || v_nuevo || '" desde el panel.'
        );
    end if;

    update public.pedidos_web
    set estado_pedido = v_nuevo,
        fecha_actualizacion_pedido = now(),
        fecha_cancelado = case when v_nuevo in ('cancelado', 'rechazado') then now() else fecha_cancelado end,
        fecha_entregado = case when v_nuevo = 'entregado' then now() else fecha_entregado end,
        nota_negocio = coalesce(nullif(btrim(coalesce(p_nota, '')), ''), nota_negocio)
    where id_pedido = p_id;

    insert into public.pedido_web_estados (
        id_pedido, estado_anterior, estado_nuevo,
        estado_pago_anterior, estado_pago_nuevo,
        origen, id_usuario, nota
    ) values (
        p_id, v_pedido.estado_pedido, v_nuevo,
        v_pedido.estado_pago, v_pedido.estado_pago,
        'web_admin', v_admin, nullif(btrim(coalesce(p_nota, '')), '')
    );

    return jsonb_build_object(
        'success', true,
        'mensaje', 'Pedido actualizado a ' || v_nuevo || '.',
        'estado', v_nuevo
    );
end;
$$;

revoke all on function public.web_admin_pedido_estado(text, integer, text, text) from public;
grant execute on function public.web_admin_pedido_estado(text, integer, text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5.1) Cobrar un pedido en linea y facturarlo
-- ----------------------------------------------------------------------------

-- La version anterior (4 argumentos) se reemplaza por la firma con p_solo_facturar.
drop function if exists public.web_admin_pedido_pagar(text, integer, numeric, text);

create or replace function public.web_admin_pedido_pagar(
    p_token text,
    p_id integer,
    p_monto numeric,
    p_referencia text default null,
    p_solo_facturar boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_pedido public.pedidos_web%rowtype;
    v_total_cent bigint;
    v_monto_cent bigint;
    v_id_cuenta integer;
    v_id_caja integer;
    v_caja public.cajas%rowtype;
    v_es_efectivo boolean;
    v_saldo_cuenta numeric;
    v_id_venta integer;
    v_numero text;
    v_concepto text;
    v_item record;
    v_producto public.productos%rowtype;
    v_vt public.variacion_tallas%rowtype;
    v_id_vt integer;
    v_lote public.lotes_inventario%rowtype;
    v_cantidad integer;
    v_restante integer;
    v_tomar integer;
    v_costo_total numeric;
    v_costo_respaldo numeric;
    v_costo_unitario numeric;
    v_precio_sin_impuesto numeric;
    v_impuesto_unitario numeric;
    v_subtotal numeric;
    v_impuesto numeric;
    v_subtotal_general numeric := 0;
    v_impuesto_general numeric := 0;
    v_subtotal_con_envio numeric;
    v_total_general numeric;
    v_stock_resultante integer;
    v_consumos jsonb;
    v_color text;
    v_talla text;
    v_descripcion text;
    v_sku text;
    v_referencia text := left(nullif(btrim(coalesce(p_referencia, '')), ''), 120);
    v_cliente text;
    v_metodo_etiqueta text;
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    select * into v_pedido
      from public.pedidos_web
     where id_pedido = p_id
     for update;

    if not found then
        return jsonb_build_object('success', false, 'mensaje', 'Pedido no encontrado.');
    end if;

    if v_pedido.id_venta is not null then
        if p_solo_facturar then
            return jsonb_build_object('success', false, 'mensaje', 'Este pedido ya fue facturado.');
        end if;

        return public.web_admin_pedido_registrar_pago(p_token, p_id, p_monto, p_referencia);
    end if;

    if v_pedido.metodo_pago_web not in ('efectivo', 'lafise', 'billetera_movil') then
        return jsonb_build_object('success', false, 'mensaje', 'Solo se pueden facturar pedidos en efectivo, Lafise o billetera móvil.');
    end if;

    if v_pedido.estado_pedido not in ('solicitado', 'aceptado') then
        return jsonb_build_object('success', false, 'mensaje', 'El pedido no está en un estado que permita cobrarlo.');
    end if;

    if v_pedido.estado_pago not in ('pendiente', 'en_revision', 'pagado') then
        return jsonb_build_object('success', false, 'mensaje', 'El pedido no tiene un estado de pago válido para facturar.');
    end if;

    if p_solo_facturar
       and v_pedido.metodo_pago_web <> 'efectivo'
       and v_pedido.estado_pago <> 'pagado' then
        return jsonb_build_object('success', false, 'mensaje', 'Confirma el pago antes de aceptar este pedido.');
    end if;

    v_total_cent := round(v_pedido.total_pedido * 100)::bigint;
    v_monto_cent := round(coalesce(p_monto, 0) * 100)::bigint;

    if v_total_cent <= 0 then
        return jsonb_build_object('success', false, 'mensaje', 'El pedido no tiene un total válido.');
    end if;

    if v_monto_cent <= 0 then
        return jsonb_build_object('success', false, 'mensaje', 'Ingresa un monto mayor que cero.');
    end if;

    if abs(coalesce(p_monto, 0) * 100 - v_monto_cent) > 0.000001 then
        return jsonb_build_object('success', false, 'mensaje', 'Usa como máximo dos decimales en el monto.');
    end if;

    if v_monto_cent < v_total_cent then
        return jsonb_build_object(
            'success', false,
            'mensaje', 'El monto no cubre el total. Faltan C$ '
                || to_char((v_total_cent - v_monto_cent) / 100.0, 'FM999999990.00') || '.'
        );
    end if;

    if v_monto_cent > v_total_cent then
        return jsonb_build_object(
            'success', false,
            'mensaje', 'El monto no puede superar el total. Sobran C$ '
                || to_char((v_monto_cent - v_total_cent) / 100.0, 'FM999999990.00') || '.'
        );
    end if;

    if not exists (
        select 1 from public.detalle_pedidos_web d where d.id_pedido = p_id
    ) then
        return jsonb_build_object('success', false, 'mensaje', 'El pedido no tiene productos para facturar.');
    end if;

    v_es_efectivo := v_pedido.metodo_pago_web = 'efectivo';

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
            select c.id_cuenta into v_id_cuenta
              from public.cuentas c
             where c.estado
             order by c.id_cuenta
             limit 1;
        end if;
    else
        if v_pedido.metodo_pago_web = 'billetera_movil' then
            select c.id_cuenta into v_id_cuenta
              from public.cuentas c
             where c.estado
               and (
                   c.nombre_cuenta ilike '%billetera%'
                   or c.nombre_cuenta ilike '%móvil%'
                   or c.nombre_cuenta ilike '%movil%'
               )
             order by c.id_cuenta
             limit 1;
        else
            select c.id_cuenta into v_id_cuenta
              from public.cuentas c
             where c.estado and c.nombre_cuenta ilike '%lafise%'
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

    if v_id_cuenta is null and v_id_caja is null then
        return jsonb_build_object('success', false, 'mensaje', 'No hay una cuenta activa ni una caja abierta para registrar el pago.');
    end if;

    v_metodo_etiqueta := case
        when v_pedido.metodo_pago_web = 'lafise' then 'Lafise'
        when v_pedido.metodo_pago_web = 'billetera_movil' then 'Billetera móvil'
        else 'Efectivo'
    end;

    v_cliente := coalesce(
        (select c.nombre_cliente from public.clientes c where c.id_cliente = v_pedido.id_cliente),
        v_pedido.nombre_recibe,
        'Cliente'
    );

    begin
        -- El ERP genera el numero con max(id_venta) + 1; este bloqueo evita choques.
        lock table public.ventas in exclusive mode;

        v_id_venta := nextval('public.ventas_id_venta_seq');
        v_numero := 'VTA-' || to_char(now(), 'YYYYMMDD') || '-'
            || lpad(v_id_venta::text, 5, '0');

        insert into public.ventas (
            id_venta, numero_factura, fecha_venta, id_cliente, id_usuario,
            id_caja, id_cuenta, subtotal_venta, impuesto_venta, descuento_venta,
            total_venta, estado_venta, id_metodo_pago, monto_recibido, vuelto, moneda
        ) values (
            v_id_venta, v_numero, now(), v_pedido.id_cliente, v_admin,
            v_id_caja, v_id_cuenta, 0, 0, v_pedido.descuento_pedido,
            0, true, case when v_es_efectivo then 1 else 2 end,
            case when p_solo_facturar then 0 else v_pedido.total_pedido end,
            0, 'NIO'
        );

        for v_item in
            select d.*
              from public.detalle_pedidos_web d
             where d.id_pedido = p_id
             order by d.id_detalle_pedido
        loop
            v_cantidad := v_item.cantidad_pedido;

            if v_cantidad is null or v_cantidad < 1 then
                raise exception 'La cantidad de un producto del pedido no es válida.';
            end if;

            if v_item.id_producto is null then
                raise exception 'El producto "%" ya no existe.', v_item.nombre_producto;
            end if;

            select * into v_producto
              from public.productos
             where id_producto = v_item.id_producto
             for update;

            if not found then
                raise exception 'El producto "%" ya no existe.', v_item.nombre_producto;
            end if;

            v_id_vt := null;
            v_descripcion := null;
            v_sku := null;
            v_color := null;
            v_talla := null;

            if v_item.id_variacion_talla is not null then
                select vt.* into v_vt
                  from public.variacion_tallas vt
                  join public.producto_variaciones pv on pv.id_variacion = vt.id_variacion
                 where vt.id_variacion_talla = v_item.id_variacion_talla
                   and pv.id_producto = v_producto.id_producto
                 for update of vt;

                if not found then
                    raise exception 'La variante del producto "%" ya no existe.', v_item.nombre_producto;
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

            v_impuesto_unitario := round(coalesce(v_item.monto_impuesto_pedido, 0) / v_cantidad, 2);
            v_precio_sin_impuesto := round(v_item.precio_unitario_pedido - v_impuesto_unitario, 2);
            v_subtotal := round(v_precio_sin_impuesto * v_cantidad, 2);
            v_impuesto := round(v_impuesto_unitario * v_cantidad, 2);

            v_subtotal_general := v_subtotal_general + v_subtotal;
            v_impuesto_general := v_impuesto_general + v_impuesto;

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

                if v_tomar <= 0 then
                    exit;
                end if;

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
                coalesce(v_item.porcentaje_impuesto_pedido, 0), v_impuesto
            );

            insert into public.movimientos_inventario (
                id_producto, id_variacion_talla, tipo_movimiento, cantidad_movimiento,
                stock_resultante, motivo_movimiento, id_referencia, tipo_referencia,
                precio_unitario, fecha_movimiento, id_usuario
            ) values (
                v_producto.id_producto, v_id_vt, 'SALIDA', v_cantidad,
                v_stock_resultante,
                'Venta pedido web ' || coalesce(v_pedido.numero_pedido, ''),
                v_id_venta, 'VENTA', v_precio_sin_impuesto, now(), v_admin
            );
        end loop;

        v_subtotal_con_envio := round(
            v_subtotal_general + v_pedido.costo_envio_pedido,
            2
        );
        v_total_general := round(greatest(
            v_subtotal_con_envio + v_impuesto_general - v_pedido.descuento_pedido,
            0
        ), 2);

        if abs(v_total_general - v_pedido.total_pedido) > 0.01 then
            v_total_general := v_pedido.total_pedido;
            v_subtotal_con_envio := round(
                v_total_general + v_pedido.descuento_pedido - v_impuesto_general,
                2
            );
        end if;

        update public.ventas
           set subtotal_venta = v_subtotal_con_envio,
               impuesto_venta = v_impuesto_general,
               total_venta = v_total_general,
               monto_recibido = case when p_solo_facturar then 0 else v_total_general end,
               vuelto = 0
         where id_venta = v_id_venta;

        if not p_solo_facturar then
            v_concepto := left(
                'Ingreso pedido web ' || coalesce(v_pedido.numero_pedido, '')
                || ' · ' || v_metodo_etiqueta || ' · Factura ' || v_numero
                || ' · ' || coalesce(v_cliente, ''),
                255
            );

            if v_es_efectivo and v_id_caja is not null then
                insert into public.movimientos_caja (
                    id_caja, tipo_movimiento_caja, concepto_movimiento_caja,
                    monto_movimiento_caja, fecha_movimiento_caja, id_usuario, id_referencia
                ) values (
                    v_id_caja, 'INGRESO', v_concepto,
                    v_total_general, now(), v_admin, v_id_venta
                );
            else
                update public.cuentas
                   set saldo_actual = saldo_actual + v_total_general
                 where id_cuenta = v_id_cuenta
                   and estado
                 returning saldo_actual into v_saldo_cuenta;

                if not found then
                    raise exception 'La cuenta seleccionada ya no está activa.';
                end if;

                insert into public.movimientos_cuentas (
                    id_cuenta, tipo_movimiento, monto, descripcion, fecha, id_usuario
                ) values (
                    v_id_cuenta, 'INGRESO', v_total_general, v_concepto, now(), v_admin
                );
            end if;

            insert into public.pedidos_web_pagos (
                id_pedido, id_venta, id_usuario, monto, metodo, referencia
            ) values (
                p_id, v_id_venta, v_admin, v_total_general,
                v_pedido.metodo_pago_web, v_referencia
            );
        end if;

        update public.pedidos_web
           set id_venta = v_id_venta,
               estado_pedido = 'aceptado',
               estado_pago = case when p_solo_facturar then v_pedido.estado_pago else 'pagado' end
         where id_pedido = p_id;

        insert into public.pedido_web_estados (
            id_pedido, estado_anterior, estado_nuevo,
            estado_pago_anterior, estado_pago_nuevo,
            origen, id_usuario, nota
        ) values (
            p_id, v_pedido.estado_pedido, 'aceptado',
            v_pedido.estado_pago,
            case when p_solo_facturar then v_pedido.estado_pago else 'pagado' end,
            'web_admin', v_admin,
            case
                when p_solo_facturar then
                    'Pedido aceptado y facturado · Pago pendiente · Factura ' || v_numero
                else
                    'Pago ' || v_metodo_etiqueta || ' registrado · Factura ' || v_numero
                        || case when v_referencia is not null then ' · Ref. ' || v_referencia else '' end
            end
        );

        return jsonb_build_object(
            'success', true,
            'mensaje', case
                when p_solo_facturar then
                    'Pedido aceptado y facturado (' || v_numero || '). El pago queda pendiente.'
                else
                    'Pago registrado y pedido facturado (' || v_numero || ').'
            end,
            'id_venta', v_id_venta,
            'numero_factura', v_numero,
            'total', v_total_general,
            'metodo', v_metodo_etiqueta,
            'referencia', v_referencia,
            'pago_pendiente', p_solo_facturar
        );
    exception
        when sqlstate 'P0001' then
            return jsonb_build_object('success', false, 'mensaje', SQLERRM);
    end;
end;
$$;

revoke all on function public.web_admin_pedido_pagar(text, integer, numeric, text, boolean) from public;
grant execute on function public.web_admin_pedido_pagar(text, integer, numeric, text, boolean) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5.2) Registrar el pago de un pedido ya facturado
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_pedido_registrar_pago(
    p_token text,
    p_id integer,
    p_monto numeric,
    p_referencia text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_pedido public.pedidos_web%rowtype;
    v_venta public.ventas%rowtype;
    v_total_cent bigint;
    v_monto_cent bigint;
    v_es_efectivo boolean;
    v_id_cuenta integer;
    v_id_caja integer;
    v_caja public.cajas%rowtype;
    v_concepto text;
    v_referencia text := left(nullif(btrim(coalesce(p_referencia, '')), ''), 120);
    v_cliente text;
    v_metodo_etiqueta text;
    v_saldo_cuenta numeric;
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    select * into v_pedido
      from public.pedidos_web
     where id_pedido = p_id
     for update;

    if not found then
        return jsonb_build_object('success', false, 'mensaje', 'Pedido no encontrado.');
    end if;

    if v_pedido.id_venta is null then
        return jsonb_build_object('success', false, 'mensaje', 'El pedido todavía no tiene factura.');
    end if;

    if v_pedido.estado_pago not in ('pendiente', 'en_revision') then
        return jsonb_build_object('success', false, 'mensaje', 'El pedido no tiene un pago pendiente por registrar.');
    end if;

    if exists (select 1 from public.pedidos_web_pagos where id_pedido = p_id) then
        return jsonb_build_object('success', false, 'mensaje', 'Este pedido ya tiene un pago registrado.');
    end if;

    select * into v_venta from public.ventas where id_venta = v_pedido.id_venta;

    if not found then
        return jsonb_build_object('success', false, 'mensaje', 'No se encontró la factura del pedido.');
    end if;

    v_total_cent := round(v_venta.total_venta * 100)::bigint;
    v_monto_cent := round(coalesce(p_monto, 0) * 100)::bigint;

    if v_total_cent <= 0 then
        return jsonb_build_object('success', false, 'mensaje', 'La factura no tiene un total válido.');
    end if;

    if v_monto_cent <= 0 then
        return jsonb_build_object('success', false, 'mensaje', 'Ingresa un monto mayor que cero.');
    end if;

    if abs(coalesce(p_monto, 0) * 100 - v_monto_cent) > 0.000001 then
        return jsonb_build_object('success', false, 'mensaje', 'Usa como máximo dos decimales en el monto.');
    end if;

    if v_monto_cent < v_total_cent then
        return jsonb_build_object(
            'success', false,
            'mensaje', 'El monto no cubre el total. Faltan C$ '
                || to_char((v_total_cent - v_monto_cent) / 100.0, 'FM999999990.00') || '.'
        );
    end if;

    if v_monto_cent > v_total_cent then
        return jsonb_build_object(
            'success', false,
            'mensaje', 'El monto no puede superar el total. Sobran C$ '
                || to_char((v_monto_cent - v_total_cent) / 100.0, 'FM999999990.00') || '.'
        );
    end if;

    v_es_efectivo := v_pedido.metodo_pago_web = 'efectivo';
    v_metodo_etiqueta := case
        when v_pedido.metodo_pago_web = 'lafise' then 'Lafise'
        when v_pedido.metodo_pago_web = 'billetera_movil' then 'Billetera móvil'
        else 'Efectivo'
    end;

    if v_es_efectivo then
        if v_venta.id_caja is not null then
            select c.* into v_caja
              from public.cajas c
             where c.id_caja = v_venta.id_caja
               and c.estado_caja
             for update;

            if found then
                v_id_caja := v_caja.id_caja;
            end if;
        end if;

        if v_id_caja is null and v_venta.id_cuenta is not null then
            select c.id_cuenta into v_id_cuenta
              from public.cuentas c
             where c.id_cuenta = v_venta.id_cuenta
               and c.estado
             for update;
        end if;

        if v_id_caja is null and v_id_cuenta is null then
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
                select c.id_cuenta into v_id_cuenta
                  from public.cuentas c
                 where c.estado
                 order by c.id_cuenta
                 limit 1;
            end if;
        end if;
    else
        if v_venta.id_cuenta is not null then
            select c.id_cuenta into v_id_cuenta
              from public.cuentas c
             where c.id_cuenta = v_venta.id_cuenta
               and c.estado
             for update;
        end if;

        if v_id_cuenta is null then
            if v_pedido.metodo_pago_web = 'billetera_movil' then
                select c.id_cuenta into v_id_cuenta
                  from public.cuentas c
                 where c.estado
                   and (
                       c.nombre_cuenta ilike '%billetera%'
                       or c.nombre_cuenta ilike '%móvil%'
                       or c.nombre_cuenta ilike '%movil%'
                   )
                 order by c.id_cuenta
                 limit 1;
            else
                select c.id_cuenta into v_id_cuenta
                  from public.cuentas c
                 where c.estado and c.nombre_cuenta ilike '%lafise%'
                 order by c.id_cuenta
                 limit 1;
            end if;
        end if;

        if v_id_cuenta is null then
            select c.id_cuenta into v_id_cuenta
              from public.cuentas c
             where c.estado
             order by c.id_cuenta
             limit 1;
        end if;
    end if;

    if v_id_cuenta is null and v_id_caja is null then
        return jsonb_build_object('success', false, 'mensaje', 'No hay una cuenta activa ni una caja abierta para registrar el pago.');
    end if;

    v_cliente := coalesce(
        (select c.nombre_cliente from public.clientes c where c.id_cliente = v_pedido.id_cliente),
        v_pedido.nombre_recibe,
        'Cliente'
    );

    v_concepto := left(
        'Ingreso pedido web ' || coalesce(v_pedido.numero_pedido, '')
        || ' · ' || v_metodo_etiqueta || ' · Factura ' || v_venta.numero_factura
        || ' · ' || coalesce(v_cliente, ''),
        255
    );

    if v_es_efectivo and v_id_caja is not null then
        insert into public.movimientos_caja (
            id_caja, tipo_movimiento_caja, concepto_movimiento_caja,
            monto_movimiento_caja, fecha_movimiento_caja, id_usuario, id_referencia
        ) values (
            v_id_caja, 'INGRESO', v_concepto,
            v_total_cent / 100.0, now(), v_admin, v_venta.id_venta
        );
    else
        update public.cuentas
           set saldo_actual = saldo_actual + (v_total_cent / 100.0)
         where id_cuenta = v_id_cuenta
           and estado
         returning saldo_actual into v_saldo_cuenta;

        if not found then
            return jsonb_build_object('success', false, 'mensaje', 'La cuenta seleccionada ya no está activa.');
        end if;

        insert into public.movimientos_cuentas (
            id_cuenta, tipo_movimiento, monto, descripcion, fecha, id_usuario
        ) values (
            v_id_cuenta, 'INGRESO', v_total_cent / 100.0, v_concepto, now(), v_admin
        );
    end if;

    insert into public.pedidos_web_pagos (
        id_pedido, id_venta, id_usuario, monto, metodo, referencia
    ) values (
        p_id, v_pedido.id_venta, v_admin, v_total_cent / 100.0,
        v_pedido.metodo_pago_web, v_referencia
    );

    update public.pedidos_web
       set estado_pago = 'pagado'
     where id_pedido = p_id;

    update public.ventas
       set monto_recibido = v_total_cent / 100.0,
           vuelto = 0
     where id_venta = v_pedido.id_venta;

    insert into public.pedido_web_estados (
        id_pedido, estado_anterior, estado_nuevo,
        estado_pago_anterior, estado_pago_nuevo,
        origen, id_usuario, nota
    ) values (
        p_id, v_pedido.estado_pedido, v_pedido.estado_pedido,
        v_pedido.estado_pago, 'pagado',
        'web_admin', v_admin,
        'Pago ' || v_metodo_etiqueta || ' registrado · Factura ' || v_venta.numero_factura
            || case when v_referencia is not null then ' · Ref. ' || v_referencia else '' end
    );

    return jsonb_build_object(
        'success', true,
        'mensaje', 'Pago registrado. El pedido quedó marcado como pagado.',
        'id_venta', v_pedido.id_venta,
        'numero_factura', v_venta.numero_factura,
        'total', v_total_cent / 100.0,
        'metodo', v_metodo_etiqueta,
        'referencia', v_referencia
    );
end;
$$;

revoke all on function public.web_admin_pedido_registrar_pago(text, integer, numeric, text) from public;
grant execute on function public.web_admin_pedido_registrar_pago(text, integer, numeric, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5.3) Aceptar y facturar un pedido (el pago puede quedar pendiente)
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_pedido_aceptar(
    p_token text,
    p_id integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_pedido public.pedidos_web%rowtype;
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    select * into v_pedido
      from public.pedidos_web
     where id_pedido = p_id
     for update;

    if not found then
        return jsonb_build_object('success', false, 'mensaje', 'Pedido no encontrado.');
    end if;

    if v_pedido.id_venta is not null then
        return jsonb_build_object('success', false, 'mensaje', 'Este pedido ya fue facturado.');
    end if;

    if v_pedido.metodo_pago_web not in ('efectivo', 'lafise', 'billetera_movil') then
        return jsonb_build_object('success', false, 'mensaje', 'Solo se pueden aceptar pedidos en efectivo, Lafise o billetera móvil.');
    end if;

    if v_pedido.estado_pedido not in ('solicitado', 'aceptado') then
        return jsonb_build_object('success', false, 'mensaje', 'El pedido no está en un estado que permita aceptarlo.');
    end if;

    if v_pedido.estado_pago not in ('pendiente', 'en_revision', 'pagado') then
        return jsonb_build_object('success', false, 'mensaje', 'El pedido no tiene un estado de pago válido para aceptarlo.');
    end if;

    if v_pedido.metodo_pago_web <> 'efectivo' and v_pedido.estado_pago <> 'pagado' then
        return jsonb_build_object('success', false, 'mensaje', 'Confirma el pago antes de aceptar este pedido. Usa Cobrar.');
    end if;

    return public.web_admin_pedido_pagar(
        p_token,
        p_id,
        v_pedido.total_pedido,
        null,
        (v_pedido.estado_pago <> 'pagado')
    );
end;
$$;

revoke all on function public.web_admin_pedido_aceptar(text, integer) from public;
grant execute on function public.web_admin_pedido_aceptar(text, integer) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6) Promociones
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_promociones(p_token text)
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
        'promociones', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id_promocion', pr.id_promocion,
                'id_producto', pr.id_producto,
                'producto', p.nombre_producto,
                'imagen', pr.imagen_promocion,
                'tipo', pr.tipo_descuento_promocion,
                'valor', pr.valor_descuento_promocion,
                'precio_venta', p.precio_venta,
                'precio_oferta', case
                    when pr.tipo_descuento_promocion = 'porcentaje'
                        then round(p.precio_venta * (1 - coalesce(pr.valor_descuento_promocion, 0) / 100), 2)
                    when pr.tipo_descuento_promocion = 'monto'
                        then greatest(round(p.precio_venta - coalesce(pr.valor_descuento_promocion, 0), 2), 0)
                    when pr.tipo_descuento_promocion = 'precio'
                        then pr.valor_descuento_promocion
                    else p.precio_venta
                end,
                'fecha_inicio', pr.fecha_inicio_promocion,
                'fecha_fin', pr.fecha_fin_promocion,
                'estado', pr.estado_promocion,
                'activa', pr.estado_promocion
                    and pr.fecha_inicio_promocion <= current_date
                    and (pr.fecha_fin_promocion is null or pr.fecha_fin_promocion >= current_date)
            ) order by pr.fecha_inicio_promocion desc, pr.id_promocion desc)
            from public.promociones pr
            join public.productos p on p.id_producto = pr.id_producto
        ), '[]'::jsonb)
    );
end;
$$;

revoke all on function public.web_admin_promociones(text) from public;
grant execute on function public.web_admin_promociones(text) to anon, authenticated;

create or replace function public.web_admin_productos(p_token text, p_buscar text default null)
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
                'id_producto', p.id_producto,
                'nombre', p.nombre_producto,
                'precio_venta', p.precio_venta,
                'stock', p.stock_actual,
                'imagen', p.imagen_producto
            ) order by p.nombre_producto)
            from (
                select id_producto, nombre_producto, precio_venta, stock_actual, imagen_producto
                from public.productos
                where estado_producto = true
                  and (v_buscar is null or nombre_producto ilike '%' || v_buscar || '%')
                order by nombre_producto
                limit 30
            ) p
        ), '[]'::jsonb)
    );
end;
$$;

revoke all on function public.web_admin_productos(text, text) from public;
grant execute on function public.web_admin_productos(text, text) to anon, authenticated;

create or replace function public.web_admin_promocion_guardar(
    p_token text,
    p_id integer,
    p_id_producto integer,
    p_tipo text,
    p_valor numeric,
    p_inicio date,
    p_fin date,
    p_imagen text,
    p_estado boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_producto public.productos%rowtype;
    v_tipo text := nullif(btrim(coalesce(p_tipo, '')), '');
    v_imagen text;
    v_id integer;
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    if p_id_producto is null then
        return jsonb_build_object('success', false, 'mensaje', 'Selecciona un producto.');
    end if;

    select * into v_producto
    from public.productos
    where id_producto = p_id_producto and estado_producto = true;

    if not found then
        return jsonb_build_object('success', false, 'mensaje', 'El producto no existe o está inactivo.');
    end if;

    if p_inicio is null then
        return jsonb_build_object('success', false, 'mensaje', 'Indica la fecha de inicio.');
    end if;

    if p_fin is not null and p_fin < p_inicio then
        return jsonb_build_object('success', false, 'mensaje', 'La fecha final no puede ser anterior al inicio.');
    end if;

    if v_tipo is not null and v_tipo not in ('porcentaje', 'monto', 'precio') then
        return jsonb_build_object('success', false, 'mensaje', 'Tipo de descuento no válido.');
    end if;

    if v_tipo is not null and coalesce(p_valor, -1) < 0 then
        return jsonb_build_object('success', false, 'mensaje', 'El valor del descuento no es válido.');
    end if;

    if v_tipo = 'porcentaje' and coalesce(p_valor, 0) > 100 then
        return jsonb_build_object('success', false, 'mensaje', 'El porcentaje no puede superar 100.');
    end if;

    -- Al crear, la imagen sale del producto; al editar se conserva la existente.
    -- p_imagen se ignora a propósito para que el panel no permita cambiarla ni
    -- ingresar fotos.
    if v_producto.imagen_producto is not null then
        v_imagen := case
            when v_producto.imagen_producto like 'http%' or v_producto.imagen_producto like '/%'
                then v_producto.imagen_producto
            else '/imagenes/productos/' || v_producto.imagen_producto
        end;
    end if;

    if p_id is null then
        insert into public.promociones (
            id_producto, imagen_promocion,
            tipo_descuento_promocion, valor_descuento_promocion,
            fecha_inicio_promocion, fecha_fin_promocion,
            estado_promocion, fecha_creacion_promocion
        ) values (
            p_id_producto, v_imagen,
            v_tipo, case when v_tipo is null then null else round(coalesce(p_valor, 0), 6) end,
            p_inicio, p_fin,
            coalesce(p_estado, true), now()
        )
        returning id_promocion into v_id;
    else
        -- No se actualiza imagen_promocion: la imagen existente se conserva y
        -- el panel no puede cambiarla ni reemplazarla.
        update public.promociones
        set id_producto = p_id_producto,
            tipo_descuento_promocion = v_tipo,
            valor_descuento_promocion = case when v_tipo is null then null else round(coalesce(p_valor, 0), 6) end,
            fecha_inicio_promocion = p_inicio,
            fecha_fin_promocion = p_fin,
            estado_promocion = coalesce(p_estado, estado_promocion),
            fecha_actualizacion_promocion = now()
        where id_promocion = p_id
        returning id_promocion into v_id;

        if v_id is null then
            return jsonb_build_object('success', false, 'mensaje', 'Promoción no encontrada.');
        end if;
    end if;

    return jsonb_build_object('success', true, 'mensaje', 'Promoción guardada.', 'id_promocion', v_id);
end;
$$;

revoke all on function public.web_admin_promocion_guardar(text, integer, integer, text, numeric, date, date, text, boolean) from public;
grant execute on function public.web_admin_promocion_guardar(text, integer, integer, text, numeric, date, date, text, boolean) to anon, authenticated;

create or replace function public.web_admin_promocion_estado(p_token text, p_id integer, p_estado boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_estado boolean;
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    update public.promociones
    set estado_promocion = coalesce(p_estado, not estado_promocion),
        fecha_actualizacion_promocion = now()
    where id_promocion = p_id
    returning estado_promocion into v_estado;

    if not found then
        return jsonb_build_object('success', false, 'mensaje', 'Promoción no encontrada.');
    end if;

    return jsonb_build_object('success', true, 'estado', v_estado);
end;
$$;

revoke all on function public.web_admin_promocion_estado(text, integer, boolean) from public;
grant execute on function public.web_admin_promocion_estado(text, integer, boolean) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7) Cupones
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_cupones(p_token text)
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
        'cupones', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id_cupon', c.id_cupon,
                'codigo', c.codigo_cupon,
                'nombre', c.nombre_cupon,
                'descripcion', c.descripcion_cupon,
                'tipo', c.tipo_descuento_cupon,
                'valor', c.valor_descuento_cupon,
                'categoria', c.categoria_cupon,
                'tope', c.tope_descuento_cupon,
                'usos_maximos', c.usos_maximos,
                'usos_realizados', c.usos_realizados,
                'fecha_inicio', c.fecha_inicio_cupon,
                'fecha_fin', c.fecha_fin_cupon,
                'estado', c.estado_cupon,
                'activo', c.estado_cupon
                    and (c.fecha_fin_cupon is null or c.fecha_fin_cupon >= now()),
                'asignados', (
                    select count(*) from public.cupones_clientes cc where cc.id_cupon = c.id_cupon
                ),
                'usados', (
                    select count(*) from public.cupones_clientes cc
                    where cc.id_cupon = c.id_cupon and cc.usado_cupon = true
                )
            ) order by c.fecha_creacion_cupon desc, c.id_cupon desc)
            from public.cupones c
        ), '[]'::jsonb)
    );
end;
$$;

revoke all on function public.web_admin_cupones(text) from public;
grant execute on function public.web_admin_cupones(text) to anon, authenticated;

create or replace function public.web_admin_cupon_guardar(
    p_token text,
    p_id integer,
    p_codigo text,
    p_nombre text,
    p_tipo text,
    p_valor numeric,
    p_categoria text,
    p_tope numeric,
    p_usos integer,
    p_inicio timestamp,
    p_fin timestamp,
    p_estado boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_codigo text := upper(btrim(coalesce(p_codigo, '')));
    v_nombre text := btrim(coalesce(p_nombre, ''));
    v_tipo text := lower(btrim(coalesce(p_tipo, 'porcentaje')));
    v_id integer;
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    if length(v_codigo) < 3 or length(v_codigo) > 40 then
        return jsonb_build_object('success', false, 'mensaje', 'El código debe tener entre 3 y 40 caracteres.');
    end if;

    if v_nombre = '' then
        return jsonb_build_object('success', false, 'mensaje', 'Escribe el nombre del cupón.');
    end if;

    if v_tipo not in ('porcentaje', 'monto') then
        return jsonb_build_object('success', false, 'mensaje', 'Tipo de cupón no válido.');
    end if;

    if coalesce(p_valor, 0) <= 0 then
        return jsonb_build_object('success', false, 'mensaje', 'El valor del cupón debe ser mayor que cero.');
    end if;

    if v_tipo = 'porcentaje' and p_valor > 100 then
        return jsonb_build_object('success', false, 'mensaje', 'El porcentaje no puede superar 100.');
    end if;

    if p_fin is not null and p_inicio is not null and p_fin < p_inicio then
        return jsonb_build_object('success', false, 'mensaje', 'La fecha final no puede ser anterior al inicio.');
    end if;

    if p_id is null then
        begin
            insert into public.cupones (
                codigo_cupon, nombre_cupon, descripcion_cupon,
                tipo_descuento_cupon, valor_descuento_cupon,
                categoria_cupon, tope_descuento_cupon,
                usos_maximos, fecha_inicio_cupon, fecha_fin_cupon,
                estado_cupon, fecha_creacion_cupon
            ) values (
                v_codigo, v_nombre, null,
                v_tipo, round(p_valor, 2),
                nullif(btrim(coalesce(p_categoria, '')), ''),
                case when p_tope is null or p_tope <= 0 then null else round(p_tope, 2) end,
                greatest(coalesce(p_usos, 1), 1),
                coalesce(p_inicio, now()), p_fin,
                coalesce(p_estado, true), now()
            )
            returning id_cupon into v_id;
        exception when unique_violation then
            return jsonb_build_object('success', false, 'mensaje', 'Ya existe un cupón con ese código.');
        end;
    else
        begin
            update public.cupones
            set codigo_cupon = v_codigo,
                nombre_cupon = v_nombre,
                tipo_descuento_cupon = v_tipo,
                valor_descuento_cupon = round(p_valor, 2),
                categoria_cupon = nullif(btrim(coalesce(p_categoria, '')), ''),
                tope_descuento_cupon = case when p_tope is null or p_tope <= 0 then null else round(p_tope, 2) end,
                usos_maximos = greatest(coalesce(p_usos, 1), 1),
                fecha_inicio_cupon = coalesce(p_inicio, fecha_inicio_cupon),
                fecha_fin_cupon = p_fin,
                estado_cupon = coalesce(p_estado, estado_cupon)
            where id_cupon = p_id
            returning id_cupon into v_id;
        exception when unique_violation then
            return jsonb_build_object('success', false, 'mensaje', 'Ya existe un cupón con ese código.');
        end;

        if v_id is null then
            return jsonb_build_object('success', false, 'mensaje', 'Cupón no encontrado.');
        end if;
    end if;

    return jsonb_build_object('success', true, 'mensaje', 'Cupón guardado.', 'id_cupon', v_id);
end;
$$;

revoke all on function public.web_admin_cupon_guardar(text, integer, text, text, text, numeric, text, numeric, integer, timestamp, timestamp, boolean) from public;
grant execute on function public.web_admin_cupon_guardar(text, integer, text, text, text, numeric, text, numeric, integer, timestamp, timestamp, boolean) to anon, authenticated;

create or replace function public.web_admin_cupon_estado(p_token text, p_id integer, p_estado boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_estado boolean;
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    update public.cupones
    set estado_cupon = coalesce(p_estado, not estado_cupon)
    where id_cupon = p_id
    returning estado_cupon into v_estado;

    if not found then
        return jsonb_build_object('success', false, 'mensaje', 'Cupón no encontrado.');
    end if;

    return jsonb_build_object('success', true, 'estado', v_estado);
end;
$$;

revoke all on function public.web_admin_cupon_estado(text, integer, boolean) from public;
grant execute on function public.web_admin_cupon_estado(text, integer, boolean) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 8) Trabajadores / repartidores
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_trabajadores(
    p_token text,
    p_estado text default null,
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
        'trabajadores', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id_trabajador', t.id_trabajador,
                'nombre', t.nombre_trabajador,
                'cedula', t.cedula_trabajador,
                'telefono', t.telefono_trabajador,
                'correo', coalesce(t.correo_trabajador, c.correo_cliente),
                'estado', t.estado_trabajador,
                'disponible', t.disponible,
                'comision', t.porcentaje_comision,
                'vehiculo', trim(coalesce(t.vehiculo_marca, '') || ' ' || coalesce(t.vehiculo_modelo, '')),
                'placa', t.vehiculo_placa,
                'foto', t.foto_perfil,
                'fecha_solicitud', t.fecha_solicitud,
                'fecha_revision', t.fecha_revision,
                'motivo_rechazo', t.motivo_rechazo,
                'nota_erp', t.nota_erp,
                'cliente', c.nombre_cliente,
                'rol_cliente', c.rol_cliente
            ) order by
                case t.estado_trabajador when 'pendiente' then 0 else 1 end,
                t.fecha_solicitud desc)
            from public.trabajadores t
            join public.clientes c on c.id_cliente = t.id_cliente
            where (p_estado is null or p_estado = '' or p_estado = 'todos' or t.estado_trabajador = p_estado)
              and (
                  v_buscar is null
                  or t.nombre_trabajador ilike '%' || v_buscar || '%'
                  or t.cedula_trabajador ilike '%' || v_buscar || '%'
                  or t.telefono_trabajador ilike '%' || v_buscar || '%'
                  or t.vehiculo_placa ilike '%' || v_buscar || '%'
                  or c.nombre_cliente ilike '%' || v_buscar || '%'
              )
            limit 80
        ), '[]'::jsonb),
        'resumen', (
            select jsonb_build_object(
                'total', count(*),
                'pendientes', count(*) filter (where estado_trabajador = 'pendiente'),
                'aprobados', count(*) filter (where estado_trabajador = 'aprobado'),
                'rechazados', count(*) filter (where estado_trabajador = 'rechazado'),
                'suspendidos', count(*) filter (where estado_trabajador = 'suspendido')
            )
            from public.trabajadores
        )
    );
end;
$$;

revoke all on function public.web_admin_trabajadores(text, text, text) from public;
grant execute on function public.web_admin_trabajadores(text, text, text) to anon, authenticated;

create or replace function public.web_admin_trabajador_actualizar(
    p_token text,
    p_id integer,
    p_estado text,
    p_comision numeric default null,
    p_nota text default null,
    p_motivo text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_trabajador public.trabajadores%rowtype;
    v_estado text := lower(btrim(coalesce(p_estado, '')));
    v_motivo text := nullif(btrim(coalesce(p_motivo, '')), '');
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    if v_estado not in ('pendiente', 'aprobado', 'rechazado', 'suspendido') then
        return jsonb_build_object('success', false, 'mensaje', 'Estado de trabajador no válido.');
    end if;

    select * into v_trabajador
    from public.trabajadores
    where id_trabajador = p_id
    for update;

    if not found then
        return jsonb_build_object('success', false, 'mensaje', 'Solicitud no encontrada.');
    end if;

    if v_estado = 'rechazado' and v_motivo is null then
        return jsonb_build_object('success', false, 'mensaje', 'Escribe el motivo del rechazo.');
    end if;

    if p_comision is not null and (p_comision < 0 or p_comision > 100) then
        return jsonb_build_object('success', false, 'mensaje', 'La comisión debe estar entre 0 y 100.');
    end if;

    update public.trabajadores
    set estado_trabajador = v_estado,
        porcentaje_comision = case when p_comision is null then porcentaje_comision else round(p_comision, 2) end,
        nota_erp = case when p_nota is null then nota_erp else nullif(btrim(p_nota), '') end,
        motivo_rechazo = case when v_estado = 'rechazado' then v_motivo else null end,
        disponible = case when v_estado = 'aprobado' then disponible else false end,
        fecha_revision = case when v_trabajador.estado_trabajador is distinct from v_estado then now() else fecha_revision end,
        fecha_actualizacion = now()
    where id_trabajador = p_id;

    -- Permite cambiar el rol desde el panel aunque el navegador tenga una sesión
    -- de cliente abierta (el trigger web_proteger_rol_cliente respeta esta marca).
    perform set_config('app.admin_web', 'on', true);

    update public.clientes
    set rol_cliente = case when v_estado = 'aprobado' then 'trabajador' else 'cliente' end
    where id_cliente = v_trabajador.id_cliente;

    return jsonb_build_object(
        'success', true,
        'mensaje', 'Trabajador actualizado.',
        'estado', v_estado
    );
end;
$$;

revoke all on function public.web_admin_trabajador_actualizar(text, integer, text, numeric, text, text) from public;
grant execute on function public.web_admin_trabajador_actualizar(text, integer, text, numeric, text, text) to anon, authenticated;

-- El trigger original bloquea cambios de rol cuando auth.uid() existe.
-- Se conserva la regla para clientes, pero se permite al panel admin.
create or replace function public.web_proteger_rol_cliente()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if new.rol_cliente is distinct from old.rol_cliente
       and auth.uid() is not null
       and coalesce(current_setting('app.admin_web', true), '') <> 'on' then
        raise exception 'No puedes cambiar el rol de tu cuenta.';
    end if;

    return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 8.1) Cierre de delivery
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_cierre_delivery(
    p_token text,
    p_desde date default current_date,
    p_hasta date default current_date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_desde date := coalesce(p_desde, current_date);
    v_hasta date := coalesce(p_hasta, current_date);
    v_repartidores jsonb := '[]'::jsonb;
    v_reg record;
    v_comision numeric(12, 2);
    v_ganancia numeric(12, 2);
    v_total_empresa numeric(12, 2);
    v_t_pedidos integer := 0;
    v_t_productos numeric(12, 2) := 0;
    v_t_efectivo numeric(12, 2) := 0;
    v_t_billetera numeric(12, 2) := 0;
    v_t_lafise numeric(12, 2) := 0;
    v_t_otros numeric(12, 2) := 0;
    v_t_delivery numeric(12, 2) := 0;
    v_t_comision numeric(12, 2) := 0;
    v_t_ganancia numeric(12, 2) := 0;
    v_t_total_empresa numeric(12, 2) := 0;
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    if v_hasta < v_desde then
        return jsonb_build_object('success', false, 'mensaje', 'La fecha final no puede ser anterior a la inicial.');
    end if;

    for v_reg in
        with entregados as (
            select
                p.id_pedido,
                p.id_trabajador,
                p.numero_pedido,
                coalesce(p.metodo_pago_web, 'efectivo') as metodo_pago,
                p.nombre_recibe,
                p.fecha_entregado,
                p.costo_envio_pedido,
                p.total_pedido,
                round(greatest(p.total_pedido - p.costo_envio_pedido, 0), 2) as total_producto,
                exists (
                    select 1
                    from public.repartidor_cierre_pedidos cp
                    where cp.id_pedido = p.id_pedido
                ) as cerrado
            from public.pedidos_web p
            where p.estado_pedido = 'entregado'
              and p.estado_pago <> 'reembolsado'
              and coalesce(p.fecha_entregado, p.fecha_actualizacion_pedido)::date between v_desde and v_hasta
        )
        select
            t.id_trabajador,
            t.nombre_trabajador,
            t.telefono_trabajador,
            coalesce(t.porcentaje_comision, 0) as porcentaje_comision,
            (count(q.id_pedido) filter (where not q.cerrado))::integer as pedidos,
            (count(q.id_pedido) filter (where q.cerrado))::integer as cerrados,
            coalesce(sum(q.total_producto) filter (where not q.cerrado), 0) as total_productos,
            coalesce(sum(q.total_producto) filter (where not q.cerrado and q.metodo_pago = 'efectivo'), 0) as total_efectivo,
            coalesce(sum(q.total_producto) filter (where not q.cerrado and q.metodo_pago = 'billetera_movil'), 0) as total_billetera,
            coalesce(sum(q.total_producto) filter (where not q.cerrado and q.metodo_pago = 'lafise'), 0) as total_lafise,
            coalesce(sum(q.total_producto) filter (where not q.cerrado and q.metodo_pago not in ('efectivo', 'billetera_movil', 'lafise')), 0) as total_otros,
            coalesce(sum(q.costo_envio_pedido) filter (where not q.cerrado), 0) as total_delivery,
            coalesce(
                jsonb_agg(
                    jsonb_build_object(
                        'id_pedido', q.id_pedido,
                        'numero', q.numero_pedido,
                        'fecha', q.fecha_entregado,
                        'metodo', q.metodo_pago,
                        'cliente', q.nombre_recibe,
                        'productos', q.total_producto,
                        'delivery', q.costo_envio_pedido,
                        'total', q.total_pedido
                    )
                    order by q.fecha_entregado, q.id_pedido
                ) filter (where not q.cerrado),
                '[]'::jsonb
            ) as detalle
        from public.trabajadores t
        join entregados q on q.id_trabajador = t.id_trabajador
        group by t.id_trabajador, t.nombre_trabajador, t.telefono_trabajador, t.porcentaje_comision
        order by t.nombre_trabajador
    loop
        v_comision := round(v_reg.total_delivery * v_reg.porcentaje_comision / 100, 2);
        v_ganancia := round(v_reg.total_delivery - v_comision, 2);
        v_total_empresa := round(v_reg.total_productos + v_comision, 2);

        v_repartidores := v_repartidores || jsonb_build_array(jsonb_build_object(
            'id_trabajador', v_reg.id_trabajador,
            'nombre', v_reg.nombre_trabajador,
            'telefono', v_reg.telefono_trabajador,
            'comision', v_reg.porcentaje_comision,
            'pedidos', v_reg.pedidos,
            'cerrados', v_reg.cerrados,
            'efectivo', v_reg.total_efectivo,
            'billetera', v_reg.total_billetera,
            'lafise', v_reg.total_lafise,
            'otros', v_reg.total_otros,
            'productos', v_reg.total_productos,
            'delivery', v_reg.total_delivery,
            'comision_empresa', v_comision,
            'ganancia_delivery', v_ganancia,
            'total_empresa', v_total_empresa,
            'detalle', v_reg.detalle
        ));

        v_t_pedidos := v_t_pedidos + v_reg.pedidos;
        v_t_productos := v_t_productos + v_reg.total_productos;
        v_t_efectivo := v_t_efectivo + v_reg.total_efectivo;
        v_t_billetera := v_t_billetera + v_reg.total_billetera;
        v_t_lafise := v_t_lafise + v_reg.total_lafise;
        v_t_otros := v_t_otros + v_reg.total_otros;
        v_t_delivery := v_t_delivery + v_reg.total_delivery;
        v_t_comision := v_t_comision + v_comision;
        v_t_ganancia := v_t_ganancia + v_ganancia;
        v_t_total_empresa := v_t_total_empresa + v_total_empresa;
    end loop;

    return jsonb_build_object(
        'success', true,
        'desde', v_desde,
        'hasta', v_hasta,
        'repartidores', v_repartidores,
        'totales', jsonb_build_object(
            'pedidos', v_t_pedidos,
            'productos', v_t_productos,
            'efectivo', v_t_efectivo,
            'billetera', v_t_billetera,
            'lafise', v_t_lafise,
            'otros', v_t_otros,
            'delivery', v_t_delivery,
            'comision_empresa', v_t_comision,
            'ganancia_delivery', v_t_ganancia,
            'total_empresa', v_t_total_empresa
        )
    );
end;
$$;

revoke all on function public.web_admin_cierre_delivery(text, date, date) from public;
grant execute on function public.web_admin_cierre_delivery(text, date, date) to anon, authenticated;

create or replace function public.web_admin_cierre_delivery_guardar(
    p_token text,
    p_id_trabajador integer,
    p_desde date default current_date,
    p_hasta date default current_date,
    p_monto_entregado numeric default null,
    p_nota text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_desde date := coalesce(p_desde, current_date);
    v_hasta date := coalesce(p_hasta, current_date);
    v_trabajador public.trabajadores%rowtype;
    v_pedido record;
    v_pedidos integer := 0;
    v_productos numeric(12, 2) := 0;
    v_efectivo numeric(12, 2) := 0;
    v_billetera numeric(12, 2) := 0;
    v_lafise numeric(12, 2) := 0;
    v_otros numeric(12, 2) := 0;
    v_delivery numeric(12, 2) := 0;
    v_porcentaje numeric(5, 2);
    v_comision numeric(12, 2);
    v_ganancia numeric(12, 2);
    v_total_empresa numeric(12, 2);
    v_monto_entregado numeric(12, 2);
    v_diferencia numeric(12, 2);
    v_id_cierre bigint;
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    if p_id_trabajador is null then
        return jsonb_build_object('success', false, 'mensaje', 'Selecciona un repartidor.');
    end if;

    if v_hasta < v_desde then
        return jsonb_build_object('success', false, 'mensaje', 'La fecha final no puede ser anterior a la inicial.');
    end if;

    select * into v_trabajador
    from public.trabajadores
    where id_trabajador = p_id_trabajador
    for update;

    if v_trabajador.id_trabajador is null then
        return jsonb_build_object('success', false, 'mensaje', 'Repartidor no encontrado.');
    end if;

    for v_pedido in
        select
            p.id_pedido,
            coalesce(p.metodo_pago_web, 'efectivo') as metodo_pago,
            p.costo_envio_pedido,
            p.total_pedido,
            round(greatest(p.total_pedido - p.costo_envio_pedido, 0), 2) as total_producto
        from public.pedidos_web p
        where p.id_trabajador = p_id_trabajador
          and p.estado_pedido = 'entregado'
          and p.estado_pago <> 'reembolsado'
          and coalesce(p.fecha_entregado, p.fecha_actualizacion_pedido)::date between v_desde and v_hasta
          and not exists (
              select 1
              from public.repartidor_cierre_pedidos cp
              where cp.id_pedido = p.id_pedido
          )
        for update
    loop
        v_pedidos := v_pedidos + 1;
        v_productos := v_productos + v_pedido.total_producto;
        v_delivery := v_delivery + v_pedido.costo_envio_pedido;

        v_efectivo := v_efectivo + case when v_pedido.metodo_pago = 'efectivo' then v_pedido.total_producto else 0 end;
        v_billetera := v_billetera + case when v_pedido.metodo_pago = 'billetera_movil' then v_pedido.total_producto else 0 end;
        v_lafise := v_lafise + case when v_pedido.metodo_pago = 'lafise' then v_pedido.total_producto else 0 end;
        v_otros := v_otros + case
            when v_pedido.metodo_pago not in ('efectivo', 'billetera_movil', 'lafise') then v_pedido.total_producto
            else 0
        end;
    end loop;

    if v_pedidos = 0 then
        return jsonb_build_object('success', false, 'mensaje', 'No hay pedidos entregados pendientes de cierre en ese periodo.');
    end if;

    v_productos := round(v_productos, 2);
    v_delivery := round(v_delivery, 2);
    v_porcentaje := round(coalesce(v_trabajador.porcentaje_comision, 0), 2);
    v_comision := round(v_delivery * v_porcentaje / 100, 2);
    v_ganancia := round(v_delivery - v_comision, 2);
    v_total_empresa := round(v_productos + v_comision, 2);
    v_monto_entregado := round(coalesce(p_monto_entregado, v_total_empresa), 2);

    if v_monto_entregado < 0 then
        return jsonb_build_object('success', false, 'mensaje', 'El monto entregado no puede ser negativo.');
    end if;

    if abs(coalesce(p_monto_entregado, v_total_empresa) * 100 - v_monto_entregado * 100) > 0.000001 then
        return jsonb_build_object('success', false, 'mensaje', 'Usa como máximo dos decimales en el monto entregado.');
    end if;

    v_diferencia := round(v_monto_entregado - v_total_empresa, 2);

    insert into public.repartidor_cierres (
        id_trabajador, fecha_desde, fecha_hasta, total_pedidos,
        total_efectivo, total_billetera, total_lafise, total_otros,
        total_productos, total_delivery, porcentaje_comision,
        comision_empresa, ganancia_delivery, total_empresa,
        monto_entregado, diferencia, nota, id_usuario
    ) values (
        p_id_trabajador, v_desde, v_hasta, v_pedidos,
        round(v_efectivo, 2), round(v_billetera, 2), round(v_lafise, 2), round(v_otros, 2),
        v_productos, v_delivery, v_porcentaje,
        v_comision, v_ganancia, v_total_empresa,
        v_monto_entregado, v_diferencia, left(nullif(btrim(coalesce(p_nota, '')), ''), 255), v_admin
    )
    returning id_cierre into v_id_cierre;

    insert into public.repartidor_cierre_pedidos (
        id_cierre, id_pedido, metodo_pago,
        total_producto, costo_envio, total_pedido
    )
    select
        v_id_cierre,
        p.id_pedido,
        coalesce(p.metodo_pago_web, 'efectivo'),
        round(greatest(p.total_pedido - p.costo_envio_pedido, 0), 2),
        p.costo_envio_pedido,
        p.total_pedido
    from public.pedidos_web p
    where p.id_trabajador = p_id_trabajador
      and p.estado_pedido = 'entregado'
      and p.estado_pago <> 'reembolsado'
      and coalesce(p.fecha_entregado, p.fecha_actualizacion_pedido)::date between v_desde and v_hasta
      and not exists (
          select 1
          from public.repartidor_cierre_pedidos cp
          where cp.id_pedido = p.id_pedido
      )
    order by p.fecha_entregado, p.id_pedido;

    update public.pedidos_web p
    set estado_pago = 'pagado',
        fecha_actualizacion_pedido = now()
    where p.id_pedido in (
        select cp.id_pedido
        from public.repartidor_cierre_pedidos cp
        where cp.id_cierre = v_id_cierre
    )
      and p.estado_pago <> 'reembolsado';

    return jsonb_build_object(
        'success', true,
        'mensaje', 'Cierre de delivery registrado.',
        'id_cierre', v_id_cierre,
        'pedidos', v_pedidos,
        'productos', v_productos,
        'efectivo', round(v_efectivo, 2),
        'billetera', round(v_billetera, 2),
        'lafise', round(v_lafise, 2),
        'otros', round(v_otros, 2),
        'delivery', v_delivery,
        'comision_empresa', v_comision,
        'ganancia_delivery', v_ganancia,
        'total_empresa', v_total_empresa,
        'monto_entregado', v_monto_entregado,
        'diferencia', v_diferencia
    );
end;
$$;

revoke all on function public.web_admin_cierre_delivery_guardar(text, integer, date, date, numeric, text) from public;
grant execute on function public.web_admin_cierre_delivery_guardar(text, integer, date, date, numeric, text) to anon, authenticated;

create or replace function public.web_admin_cierres_delivery(
    p_token text,
    p_limite integer default 12
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_limite integer := greatest(1, least(coalesce(p_limite, 12), 50));
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    return jsonb_build_object(
        'success', true,
        'cierres', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id_cierre', c.id_cierre,
                'repartidor', t.nombre_trabajador,
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
            ) order by c.fecha_cierre desc)
            from (
                select *
                from public.repartidor_cierres
                order by fecha_cierre desc
                limit v_limite
            ) c
            join public.trabajadores t on t.id_trabajador = c.id_trabajador
        ), '[]'::jsonb)
    );
end;
$$;

revoke all on function public.web_admin_cierres_delivery(text, integer) from public;
grant execute on function public.web_admin_cierres_delivery(text, integer) to anon, authenticated;

create or replace function public.web_admin_cierres_trabajador(
    p_token text,
    p_id_trabajador integer,
    p_limite integer default 50
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_limite integer := greatest(1, least(coalesce(p_limite, 50), 50));
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    return jsonb_build_object(
        'success', true,
        'cierres', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id_cierre', c.id_cierre,
                'id_trabajador', c.id_trabajador,
                'repartidor', t.nombre_trabajador,
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
            ) order by c.fecha_cierre desc)
            from (
                select *
                from public.repartidor_cierres
                where id_trabajador = p_id_trabajador
                order by fecha_cierre desc
                limit v_limite
            ) c
            join public.trabajadores t on t.id_trabajador = c.id_trabajador
        ), '[]'::jsonb)
    );
end;
$$;

revoke all on function public.web_admin_cierres_trabajador(text, integer, integer) from public;
grant execute on function public.web_admin_cierres_trabajador(text, integer, integer) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 9) Cuentas por cobrar (consulta)
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_cuentas(
    p_token text,
    p_estado text default null,
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
        'cuentas', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id_venta', x.id_venta,
                'factura', x.numero_factura,
                'fecha_venta', x.fecha_venta,
                'cliente', x.nombre_cliente,
                'telefono', x.telefono_cliente,
                'total', x.total_venta,
                'total_plan', x.total_plan,
                'pagado', x.pagado,
                'saldo', x.saldo,
                'estado', x.estado,
                'proximo_vencimiento', x.proximo_vencimiento,
                'cuotas_vencidas', x.cuotas_vencidas,
                'productos', (
                    select string_agg(y.nombre, ', ')
                    from (
                        select coalesce(p.nombre_producto, d.descripcion_variacion, 'Producto') as nombre
                        from public.detalle_ventas d
                        left join public.productos p on p.id_producto = d.id_producto
                        where d.id_venta = x.id_venta
                        order by d.id_detalle_venta
                        limit 3
                    ) y
                )
            ) order by
                case when x.saldo <= 0 then 2 when x.cuotas_vencidas > 0 then 0 else 1 end,
                x.proximo_vencimiento nulls last)
            from (
                select pp.id_venta, v.numero_factura, v.fecha_venta, v.total_venta,
                       c.nombre_cliente, c.telefono_cliente,
                       (select coalesce(sum(cu.monto_cuota), 0)
                        from public.cuotas_venta cu
                        where cu.id_plan_pago = pp.id_plan_pago) as total_plan,
                       (select coalesce(sum(a.monto_aplicado), 0)
                        from public.aplicaciones_pago_cuota a
                        join public.cuotas_venta cu on cu.id_cuota = a.id_cuota
                        where cu.id_plan_pago = pp.id_plan_pago) as pagado,
                       (select min(cu.fecha_vencimiento)
                        from public.cuotas_venta cu
                        where cu.id_plan_pago = pp.id_plan_pago
                          and cu.monto_cuota > (
                              select coalesce(sum(a2.monto_aplicado), 0)
                              from public.aplicaciones_pago_cuota a2
                              where a2.id_cuota = cu.id_cuota
                          )) as proximo_vencimiento,
                       (select count(*)
                        from public.cuotas_venta cu
                        where cu.id_plan_pago = pp.id_plan_pago
                          and cu.fecha_vencimiento < current_date
                          and cu.monto_cuota > (
                              select coalesce(sum(a3.monto_aplicado), 0)
                              from public.aplicaciones_pago_cuota a3
                              where a3.id_cuota = cu.id_cuota
                          )) as cuotas_vencidas
                from public.planes_pago pp
                join public.ventas v on v.id_venta = pp.id_venta and v.estado_venta = true
                join public.clientes c on c.id_cliente = v.id_cliente
            ) base
            cross join lateral (
                select base.id_venta, base.numero_factura, base.fecha_venta,
                       base.nombre_cliente, base.telefono_cliente, base.total_venta,
                       base.total_plan, base.pagado,
                       greatest(base.total_plan - base.pagado, 0) as saldo,
                       base.proximo_vencimiento, base.cuotas_vencidas,
                       case
                           when base.total_plan - base.pagado <= 0 then 'pagada'
                           when base.cuotas_vencidas > 0 then 'atrasada'
                           when base.pagado > 0 then 'parcial'
                           else 'pendiente'
                       end as estado
            ) x
            where (p_estado is null or p_estado = '' or p_estado = 'todas' or x.estado = p_estado)
              and (
                  v_buscar is null
                  or x.nombre_cliente ilike '%' || v_buscar || '%'
                  or x.numero_factura ilike '%' || v_buscar || '%'
                  or coalesce(x.telefono_cliente, '') ilike '%' || v_buscar || '%'
              )
        ), '[]'::jsonb),
        'resumen', (
            select jsonb_build_object(
                'saldo_total', coalesce(sum(greatest(b.total_plan - b.pagado, 0)), 0),
                'cuentas_abiertas', count(*) filter (where b.total_plan - b.pagado > 0),
                'cuentas_vencidas', count(*) filter (where b.cuotas_vencidas > 0 and b.total_plan - b.pagado > 0)
            )
            from (
                select pp.id_plan_pago,
                       (select coalesce(sum(cu.monto_cuota), 0)
                        from public.cuotas_venta cu
                        where cu.id_plan_pago = pp.id_plan_pago) as total_plan,
                       (select coalesce(sum(a.monto_aplicado), 0)
                        from public.aplicaciones_pago_cuota a
                        join public.cuotas_venta cu on cu.id_cuota = a.id_cuota
                        where cu.id_plan_pago = pp.id_plan_pago) as pagado,
                       (select count(*)
                        from public.cuotas_venta cu
                        where cu.id_plan_pago = pp.id_plan_pago
                          and cu.fecha_vencimiento < current_date
                          and cu.monto_cuota > (
                              select coalesce(sum(a3.monto_aplicado), 0)
                              from public.aplicaciones_pago_cuota a3
                              where a3.id_cuota = cu.id_cuota
                          )) as cuotas_vencidas
                from public.planes_pago pp
                join public.ventas v on v.id_venta = pp.id_venta and v.estado_venta = true
            ) b
        )
    );
end;
$$;

revoke all on function public.web_admin_cuentas(text, text, text) from public;
grant execute on function public.web_admin_cuentas(text, text, text) to anon, authenticated;

create or replace function public.web_admin_cuenta_detalle(p_token text, p_id_venta integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_venta public.ventas%rowtype;
    v_saldo numeric := 0;
    v_puede_pagar boolean := false;
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    select * into v_venta from public.ventas where id_venta = p_id_venta;

    if not found then
        return jsonb_build_object('success', false, 'mensaje', 'Cuenta no encontrada.');
    end if;

    select coalesce(sum(greatest(
               cu.monto_cuota - coalesce((
                   select sum(a.monto_aplicado)
                   from public.aplicaciones_pago_cuota a
                   where a.id_cuota = cu.id_cuota
               ), 0),
               0
           )), 0)
      into v_saldo
      from public.cuotas_venta cu
      join public.planes_pago pp on pp.id_plan_pago = cu.id_plan_pago
     where pp.id_venta = p_id_venta;

    v_puede_pagar := v_venta.estado_venta
        and v_saldo > 0
        and (
            exists (
                select 1 from public.cajas c
                where c.estado_caja and c.id_usuario = v_admin
            )
            or exists (
                select 1 from public.cuentas c
                where c.estado
            )
        );

    return jsonb_build_object(
        'success', true,
        'sesion', true,
        'cuenta', jsonb_build_object(
            'id_venta', v_venta.id_venta,
            'factura', v_venta.numero_factura,
            'fecha_venta', v_venta.fecha_venta,
            'total', v_venta.total_venta,
            'saldo', v_saldo,
            'puede_pagar', v_puede_pagar,
            'caja', (
                select jsonb_build_object(
                    'id_caja', c.id_caja,
                    'monto_inicial', c.monto_inicial
                )
                from public.cajas c
                where c.estado_caja and c.id_usuario = v_admin
                order by c.id_caja desc
                limit 1
            ),
            'cuentas', coalesce((
                select jsonb_agg(jsonb_build_object(
                    'id_cuenta', c.id_cuenta,
                    'nombre', c.nombre_cuenta,
                    'saldo', c.saldo_actual
                ) order by c.nombre_cuenta)
                from public.cuentas c
                where c.estado
            ), '[]'::jsonb),
            'cliente', (
                select c.nombre_cliente from public.clientes c where c.id_cliente = v_venta.id_cliente
            ),
            'telefono', (
                select c.telefono_cliente from public.clientes c where c.id_cliente = v_venta.id_cliente
            ),
            'cuotas', coalesce((
                select jsonb_agg(jsonb_build_object(
                    'id_cuota', cu.id_cuota,
                    'numero', cu.numero_cuota,
                    'fecha_vencimiento', cu.fecha_vencimiento,
                    'monto', cu.monto_cuota,
                    'pagado', coalesce((select sum(a.monto_aplicado) from public.aplicaciones_pago_cuota a where a.id_cuota = cu.id_cuota), 0),
                    'saldo', greatest(cu.monto_cuota - coalesce((select sum(a.monto_aplicado) from public.aplicaciones_pago_cuota a where a.id_cuota = cu.id_cuota), 0), 0),
                    'estado', case
                        when cu.monto_cuota - coalesce((select sum(a.monto_aplicado) from public.aplicaciones_pago_cuota a where a.id_cuota = cu.id_cuota), 0) <= 0 then 'pagada'
                        when cu.fecha_vencimiento < current_date then 'atrasada'
                        when coalesce((select sum(a.monto_aplicado) from public.aplicaciones_pago_cuota a where a.id_cuota = cu.id_cuota), 0) > 0 then 'parcial'
                        else 'pendiente'
                    end
                ) order by cu.fecha_vencimiento, cu.numero_cuota)
                from public.cuotas_venta cu
                join public.planes_pago pp on pp.id_plan_pago = cu.id_plan_pago
                where pp.id_venta = p_id_venta
            ), '[]'::jsonb),
            'pagos', coalesce((
                select jsonb_agg(jsonb_build_object(
                    'id_pago', pv.id_pago_venta,
                    'fecha', pv.fecha_pago,
                    'monto', pv.monto_pago,
                    'metodo', case
                        when pv.id_metodo_pago = 1 then 'Efectivo'
                        when pv.id_cuenta is not null then (
                            select c.nombre_cuenta from public.cuentas c where c.id_cuenta = pv.id_cuenta
                        )
                        else (
                            select m.nombre_metodo_pago from public.metodos_pago m where m.id_metodo_pago = pv.id_metodo_pago
                        )
                    end,
                    'referencia', pv.referencia_pago
                ) order by pv.fecha_pago)
                from public.pagos_venta pv
                where pv.id_venta = p_id_venta
            ), '[]'::jsonb)
        )
    );
end;
$$;

revoke all on function public.web_admin_cuenta_detalle(text, integer) from public;
grant execute on function public.web_admin_cuenta_detalle(text, integer) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 9.1) Registrar un abono manual en una cuenta por cobrar
-- ----------------------------------------------------------------------------

create or replace function public.web_admin_cuenta_pagar(
    p_token text,
    p_id_venta integer,
    p_monto numeric,
    p_id_cuenta integer default null,
    p_referencia text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_admin integer := public.web_admin_sesion(p_token);
    v_venta public.ventas%rowtype;
    v_cuota record;
    v_total_cent bigint := 0;
    v_monto_cent bigint;
    v_saldo_cuota_cent bigint;
    v_aplicado_cent bigint;
    v_restante bigint;
    v_aplicar bigint;
    v_id_pago integer;
    v_id_caja integer;
    v_id_cuenta integer;
    v_id_metodo_pago integer;
    v_metodo_etiqueta text;
    v_concepto text;
    v_referencia text := left(nullif(btrim(coalesce(p_referencia, '')), ''), 120);
    v_cliente text;
    v_saldo_cuenta numeric;
    v_saldo_restante numeric;
begin
    if v_admin is null then
        return jsonb_build_object('success', false, 'sesion', false, 'mensaje', 'Sesión expirada. Inicia sesión de nuevo.');
    end if;

    select * into v_venta
      from public.ventas
     where id_venta = p_id_venta
     for update;

    if not found then
        return jsonb_build_object('success', false, 'mensaje', 'Cuenta no encontrada.');
    end if;

    if not v_venta.estado_venta then
        return jsonb_build_object('success', false, 'mensaje', 'La venta está anulada.');
    end if;

    if not exists (
        select 1 from public.planes_pago pp where pp.id_venta = p_id_venta
    ) then
        return jsonb_build_object('success', false, 'mensaje', 'La venta no tiene un plan de pagos.');
    end if;

    for v_cuota in
        select cu.*
          from public.cuotas_venta cu
          join public.planes_pago pp on pp.id_plan_pago = cu.id_plan_pago
         where pp.id_venta = p_id_venta
         order by cu.fecha_vencimiento, cu.numero_cuota
         for update of cu
    loop
        v_aplicado_cent := round(coalesce((
            select sum(a.monto_aplicado)
            from public.aplicaciones_pago_cuota a
            where a.id_cuota = v_cuota.id_cuota
        ), 0) * 100)::bigint;

        v_saldo_cuota_cent := greatest(
            round(v_cuota.monto_cuota * 100)::bigint - v_aplicado_cent,
            0
        );

        v_total_cent := v_total_cent + v_saldo_cuota_cent;
    end loop;

    if v_total_cent <= 0 then
        return jsonb_build_object('success', false, 'mensaje', 'La cuenta ya está pagada.');
    end if;

    v_monto_cent := round(coalesce(p_monto, 0) * 100)::bigint;

    if v_monto_cent <= 0 then
        return jsonb_build_object('success', false, 'mensaje', 'Ingresa un monto mayor que cero.');
    end if;

    if abs(coalesce(p_monto, 0) * 100 - v_monto_cent) > 0.000001 then
        return jsonb_build_object('success', false, 'mensaje', 'Usa como máximo dos decimales en el monto.');
    end if;

    if v_monto_cent > v_total_cent then
        return jsonb_build_object(
            'success', false,
            'mensaje', 'El abono no puede superar el saldo pendiente. Sobran C$ '
                || to_char((v_monto_cent - v_total_cent) / 100.0, 'FM999999990.00') || '.'
        );
    end if;

    if p_id_cuenta is null then
        select c.id_caja into v_id_caja
          from public.cajas c
         where c.estado_caja
           and c.id_usuario = v_admin
         order by c.id_caja desc
         limit 1
         for update;

        if v_id_caja is null then
            return jsonb_build_object('success', false, 'mensaje', 'No tienes una caja abierta. Elige una cuenta o abre tu caja desde el ERP.');
        end if;

        v_id_metodo_pago := 1;
        v_metodo_etiqueta := 'Efectivo';
    else
        select c.id_cuenta into v_id_cuenta
          from public.cuentas c
         where c.id_cuenta = p_id_cuenta
           and c.estado
         for update;

        if v_id_cuenta is null then
            return jsonb_build_object('success', false, 'mensaje', 'La cuenta seleccionada no está activa.');
        end if;

        select c.nombre_cuenta into v_metodo_etiqueta
          from public.cuentas c
         where c.id_cuenta = v_id_cuenta;

        v_id_metodo_pago := 2;
    end if;

    v_cliente := coalesce(
        (select c.nombre_cliente from public.clientes c where c.id_cliente = v_venta.id_cliente),
        'Cliente'
    );

    v_concepto := left(
        'Abono venta ' || v_venta.numero_factura
        || ' · ' || v_metodo_etiqueta
        || ' · ' || v_cliente,
        255
    );

    begin
        insert into public.pagos_venta (
            id_venta, id_metodo_pago, id_caja, id_cuenta,
            id_usuario, monto_pago, fecha_pago, referencia_pago
        ) values (
            p_id_venta, v_id_metodo_pago, v_id_caja, v_id_cuenta,
            v_admin, v_monto_cent / 100.0, now(), v_referencia
        )
        returning id_pago_venta into v_id_pago;

        v_restante := v_monto_cent;

        for v_cuota in
            select cu.*
              from public.cuotas_venta cu
              join public.planes_pago pp on pp.id_plan_pago = cu.id_plan_pago
             where pp.id_venta = p_id_venta
             order by cu.fecha_vencimiento, cu.numero_cuota
        loop
            exit when v_restante <= 0;

            v_aplicado_cent := round(coalesce((
                select sum(a.monto_aplicado)
                from public.aplicaciones_pago_cuota a
                where a.id_cuota = v_cuota.id_cuota
            ), 0) * 100)::bigint;

            v_saldo_cuota_cent := greatest(
                round(v_cuota.monto_cuota * 100)::bigint - v_aplicado_cent,
                0
            );

            continue when v_saldo_cuota_cent <= 0;

            v_aplicar := least(v_restante, v_saldo_cuota_cent);

            insert into public.aplicaciones_pago_cuota (
                id_pago_venta, id_cuota, monto_aplicado
            ) values (
                v_id_pago, v_cuota.id_cuota, v_aplicar / 100.0
            );

            v_restante := v_restante - v_aplicar;
        end loop;

        if v_restante > 0 then
            raise exception 'No se pudo aplicar todo el abono a las cuotas.';
        end if;

        if v_id_metodo_pago = 1 then
            insert into public.movimientos_caja (
                id_caja, tipo_movimiento_caja, concepto_movimiento_caja,
                monto_movimiento_caja, fecha_movimiento_caja, id_usuario,
                id_referencia, id_pago_venta
            ) values (
                v_id_caja, 'INGRESO', v_concepto,
                v_monto_cent / 100.0, now(), v_admin,
                p_id_venta, v_id_pago
            );
        else
            update public.cuentas
               set saldo_actual = saldo_actual + (v_monto_cent / 100.0)
             where id_cuenta = v_id_cuenta
               and estado
             returning saldo_actual into v_saldo_cuenta;

            if not found then
                raise exception 'La cuenta seleccionada ya no está activa.';
            end if;

            insert into public.movimientos_cuentas (
                id_cuenta, tipo_movimiento, monto, descripcion, fecha, id_usuario, id_pago_venta
            ) values (
                v_id_cuenta, 'INGRESO', v_monto_cent / 100.0, v_concepto, now(), v_admin, v_id_pago
            );
        end if;

        v_saldo_restante := (v_total_cent - v_monto_cent) / 100.0;

        return jsonb_build_object(
            'success', true,
            'mensaje', case
                when v_saldo_restante <= 0 then
                    'Cuenta pagada. Abono de C$ '
                    || to_char(v_monto_cent / 100.0, 'FM999999990.00') || ' registrado.'
                else
                    'Abono registrado. Saldo pendiente: C$ '
                    || to_char(v_saldo_restante, 'FM999999990.00') || '.'
            end,
            'monto', v_monto_cent / 100.0,
            'saldo', v_saldo_restante,
            'metodo', v_metodo_etiqueta,
            'id_pago', v_id_pago
        );
    exception
        when sqlstate 'P0001' then
            return jsonb_build_object('success', false, 'mensaje', SQLERRM);
    end;
end;
$$;

revoke all on function public.web_admin_cuenta_pagar(text, integer, numeric, integer, text) from public;
grant execute on function public.web_admin_cuenta_pagar(text, integer, numeric, integer, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 10) Recargar el esquema de PostgREST
-- ----------------------------------------------------------------------------

notify pgrst, 'reload schema';
