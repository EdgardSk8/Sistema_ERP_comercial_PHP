-- ============================================================
-- Trabajadores / repartidores · Tienda web
-- Ejecuta este archivo en el SQL Editor de Supabase después de
-- la migración del ERP que crea la tabla public.trabajadores.
-- ============================================================

-- 1) Tabla (idempotente: la migración del ERP ya la crea)
create table if not exists public.trabajadores (
    id_trabajador serial primary key,
    id_cliente integer not null unique references public.clientes (id_cliente) on delete cascade,
    auth_id uuid,
    estado_trabajador varchar(20) not null default 'pendiente',

    nombre_trabajador varchar(150) not null,
    cedula_trabajador varchar(20) not null,
    telefono_trabajador varchar(20) not null,
    correo_trabajador varchar(150),
    direccion_trabajador text,
    fecha_nacimiento date,

    licencia_numero varchar(40) not null,
    licencia_vencimiento date not null,
    circulacion_numero varchar(40) not null,
    circulacion_vencimiento date not null,
    seguro_aseguradora varchar(100),
    seguro_numero varchar(40),
    seguro_vencimiento date,

    vehiculo_marca varchar(60) not null,
    vehiculo_modelo varchar(60),
    vehiculo_anio smallint,
    vehiculo_placa varchar(20) not null,
    vehiculo_color varchar(40),
    color_usuario varchar(20) not null default '#22c55e',

    foto_perfil text not null,
    foto_vehiculo text not null,
    foto_licencia text,
    foto_circulacion text,
    foto_seguro text,

    porcentaje_comision numeric(5,2) not null default 20,
    disponible boolean not null default false,

    motivo_rechazo text,
    nota_erp text,

    fecha_solicitud timestamptz not null default now(),
    fecha_revision timestamptz,
    fecha_actualizacion timestamptz
);

alter table public.clientes
    add column if not exists rol_cliente varchar(20) not null default 'cliente';

-- 2) Acceso: el cliente solo ve su propia solicitud.
alter table public.trabajadores enable row level security;

grant select on public.trabajadores to authenticated;
grant usage, select on sequence public.trabajadores_id_trabajador_seq to authenticated;

drop policy if exists web_trabajadores_select on public.trabajadores;
create policy web_trabajadores_select on public.trabajadores
    for select to authenticated
    using (
        exists (
            select 1
            from public.clientes c
            where c.id_cliente = trabajadores.id_cliente
              and c.auth_id = auth.uid()
        )
    );

-- 3) Devolver la solicitud del cliente autenticado (null si no tiene).
create or replace function public.web_mi_trabajador()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select to_jsonb(t)
    from public.trabajadores t
    join public.clientes c on c.id_cliente = t.id_cliente
    where c.auth_id = auth.uid()
    limit 1
$$;

-- 4) Crear o reenviar la solicitud del cliente autenticado.
--    El porcentaje de comisión NO lo define el cliente: lo asigna el ERP.
create or replace function public.web_solicitar_trabajador(p_datos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_cliente public.clientes%rowtype;
    v_existente public.trabajadores%rowtype;
    v_trabajador public.trabajadores%rowtype;
    v_estado_nuevo text;
    v_fecha_licencia date;
    v_fecha_circulacion date;
    v_fecha_seguro date;
    v_fecha_nacimiento date;
    v_anio smallint;
begin
    select * into v_cliente
    from public.clientes
    where auth_id = auth.uid()
    limit 1;

    if v_cliente.id_cliente is null then
        raise exception 'Inicia sesión para enviar tu solicitud.';
    end if;

    if coalesce(trim(p_datos->>'nombre_trabajador'), '') = ''
       or coalesce(trim(p_datos->>'cedula_trabajador'), '') = ''
       or coalesce(trim(p_datos->>'telefono_trabajador'), '') = '' then
        raise exception 'Completa tu nombre, cédula y teléfono.';
    end if;

    if coalesce(trim(p_datos->>'licencia_numero'), '') = ''
       or nullif(p_datos->>'licencia_vencimiento', '') is null
       or coalesce(trim(p_datos->>'circulacion_numero'), '') = ''
       or nullif(p_datos->>'circulacion_vencimiento', '') is null then
        raise exception 'Completa los datos de licencia y circulación.';
    end if;

    if coalesce(trim(p_datos->>'vehiculo_marca'), '') = ''
       or coalesce(trim(p_datos->>'vehiculo_placa'), '') = '' then
        raise exception 'Completa la marca y la placa del vehículo.';
    end if;

    if coalesce(trim(p_datos->>'foto_perfil'), '') = ''
       or coalesce(trim(p_datos->>'foto_vehiculo'), '') = '' then
        raise exception 'Sube tu foto y la foto de tu vehículo.';
    end if;

    v_fecha_licencia := (p_datos->>'licencia_vencimiento')::date;
    v_fecha_circulacion := (p_datos->>'circulacion_vencimiento')::date;
    v_fecha_seguro := nullif(p_datos->>'seguro_vencimiento', '')::date;
    v_fecha_nacimiento := nullif(p_datos->>'fecha_nacimiento', '')::date;
    v_anio := nullif(p_datos->>'vehiculo_anio', '')::smallint;

    select * into v_existente
    from public.trabajadores
    where id_cliente = v_cliente.id_cliente
    for update;

    if v_existente.id_trabajador is not null then
        if v_existente.estado_trabajador = 'suspendido' then
            raise exception 'Tu cuenta está suspendida. Contacta a la tienda para actualizar tus datos.';
        end if;

        /* Si ya está aprobado, puede actualizar sus datos sin perder la aprobación. */
        v_estado_nuevo := case
            when v_existente.estado_trabajador = 'aprobado' then 'aprobado'
            else 'pendiente'
        end;

        update public.trabajadores set
            auth_id = auth.uid(),
            estado_trabajador = v_estado_nuevo,
            nombre_trabajador = trim(p_datos->>'nombre_trabajador'),
            cedula_trabajador = trim(p_datos->>'cedula_trabajador'),
            telefono_trabajador = trim(p_datos->>'telefono_trabajador'),
            correo_trabajador = nullif(trim(coalesce(p_datos->>'correo_trabajador', '')), ''),
            direccion_trabajador = nullif(trim(coalesce(p_datos->>'direccion_trabajador', '')), ''),
            fecha_nacimiento = v_fecha_nacimiento,
            licencia_numero = trim(p_datos->>'licencia_numero'),
            licencia_vencimiento = v_fecha_licencia,
            circulacion_numero = trim(p_datos->>'circulacion_numero'),
            circulacion_vencimiento = v_fecha_circulacion,
            seguro_aseguradora = nullif(trim(coalesce(p_datos->>'seguro_aseguradora', '')), ''),
            seguro_numero = nullif(trim(coalesce(p_datos->>'seguro_numero', '')), ''),
            seguro_vencimiento = v_fecha_seguro,
            vehiculo_marca = trim(p_datos->>'vehiculo_marca'),
            vehiculo_modelo = nullif(trim(coalesce(p_datos->>'vehiculo_modelo', '')), ''),
            vehiculo_anio = v_anio,
            vehiculo_placa = upper(trim(p_datos->>'vehiculo_placa')),
            vehiculo_color = nullif(trim(coalesce(p_datos->>'vehiculo_color', '')), ''),
            color_usuario = coalesce(nullif(trim(p_datos->>'color_usuario'), ''), '#22c55e'),
            foto_perfil = trim(p_datos->>'foto_perfil'),
            foto_vehiculo = trim(p_datos->>'foto_vehiculo'),
            foto_licencia = nullif(trim(coalesce(p_datos->>'foto_licencia', '')), ''),
            foto_circulacion = nullif(trim(coalesce(p_datos->>'foto_circulacion', '')), ''),
            foto_seguro = nullif(trim(coalesce(p_datos->>'foto_seguro', '')), ''),
            motivo_rechazo = case when v_estado_nuevo = 'pendiente' then null else v_existente.motivo_rechazo end,
            fecha_solicitud = case when v_existente.estado_trabajador = 'rechazado' then now() else v_existente.fecha_solicitud end,
            fecha_revision = case when v_estado_nuevo = 'pendiente' then null else v_existente.fecha_revision end,
            fecha_actualizacion = now()
        where id_trabajador = v_existente.id_trabajador
        returning * into v_trabajador;
    else
        insert into public.trabajadores (
            id_cliente, auth_id, estado_trabajador,
            nombre_trabajador, cedula_trabajador, telefono_trabajador, correo_trabajador,
            direccion_trabajador, fecha_nacimiento,
            licencia_numero, licencia_vencimiento, circulacion_numero, circulacion_vencimiento,
            seguro_aseguradora, seguro_numero, seguro_vencimiento,
            vehiculo_marca, vehiculo_modelo, vehiculo_anio, vehiculo_placa, vehiculo_color, color_usuario,
            foto_perfil, foto_vehiculo, foto_licencia, foto_circulacion, foto_seguro,
            porcentaje_comision, disponible
        ) values (
            v_cliente.id_cliente, auth.uid(), 'pendiente',
            trim(p_datos->>'nombre_trabajador'), trim(p_datos->>'cedula_trabajador'),
            trim(p_datos->>'telefono_trabajador'),
            nullif(trim(coalesce(p_datos->>'correo_trabajador', '')), ''),
            nullif(trim(coalesce(p_datos->>'direccion_trabajador', '')), ''),
            v_fecha_nacimiento,
            trim(p_datos->>'licencia_numero'), v_fecha_licencia,
            trim(p_datos->>'circulacion_numero'), v_fecha_circulacion,
            nullif(trim(coalesce(p_datos->>'seguro_aseguradora', '')), ''),
            nullif(trim(coalesce(p_datos->>'seguro_numero', '')), ''),
            v_fecha_seguro,
            trim(p_datos->>'vehiculo_marca'),
            nullif(trim(coalesce(p_datos->>'vehiculo_modelo', '')), ''),
            v_anio,
            upper(trim(p_datos->>'vehiculo_placa')),
            nullif(trim(coalesce(p_datos->>'vehiculo_color', '')), ''),
            coalesce(nullif(trim(p_datos->>'color_usuario'), ''), '#22c55e'),
            trim(p_datos->>'foto_perfil'), trim(p_datos->>'foto_vehiculo'),
            nullif(trim(coalesce(p_datos->>'foto_licencia', '')), ''),
            nullif(trim(coalesce(p_datos->>'foto_circulacion', '')), ''),
            nullif(trim(coalesce(p_datos->>'foto_seguro', '')), ''),
            20, false
        )
        returning * into v_trabajador;
    end if;

    return to_jsonb(v_trabajador);
end;
$$;

-- 5) El trabajador aprobado puede marcarse disponible / no disponible.
create or replace function public.web_actualizar_disponibilidad(p_disponible boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_trabajador public.trabajadores%rowtype;
begin
    update public.trabajadores t
       set disponible = coalesce(p_disponible, false),
           fecha_actualizacion = now()
     where t.id_cliente = (
         select c.id_cliente from public.clientes c where c.auth_id = auth.uid() limit 1
     )
       and t.estado_trabajador = 'aprobado'
    returning * into v_trabajador;

    if v_trabajador.id_trabajador is null then
        raise exception 'No tienes una solicitud aprobada.';
    end if;

    return to_jsonb(v_trabajador);
end;
$$;

-- 6) Fotos en Supabase Storage (bucket público para que el cliente vea al repartidor).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'trabajadores',
    'trabajadores',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- 6.1) El rol "trabajador" solo lo asigna el ERP, nunca el propio cliente
--      (la política web_clientes_update permite editar el perfil propio).
create or replace function public.web_proteger_rol_cliente()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if new.rol_cliente is distinct from old.rol_cliente
       and auth.uid() is not null then
        raise exception 'No puedes cambiar el rol de tu cuenta.';
    end if;

    return new;
end;
$$;

drop trigger if exists web_proteger_rol_cliente on public.clientes;
create trigger web_proteger_rol_cliente
before update on public.clientes
for each row execute function public.web_proteger_rol_cliente();

drop policy if exists "trabajadores_subir" on storage.objects;
create policy "trabajadores_subir" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'trabajadores'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage inserta con "returning": sin política de lectura la subida falla
-- con "new row violates row-level security policy".
drop policy if exists "trabajadores_leer" on storage.objects;
create policy "trabajadores_leer" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'trabajadores');

drop policy if exists "trabajadores_actualizar" on storage.objects;
create policy "trabajadores_actualizar" on storage.objects
    for update to authenticated
    using (
        bucket_id = 'trabajadores'
        and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
        bucket_id = 'trabajadores'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "trabajadores_borrar" on storage.objects;
create policy "trabajadores_borrar" on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'trabajadores'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

/* ============================================================
   Pedidos asignados a trabajadores (delivery)
   ============================================================ */

alter table public.pedidos_web
    add column if not exists id_trabajador integer,
    add column if not exists fecha_aceptado_trabajador timestamp without time zone;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'pedidos_web_id_trabajador_foreign'
    ) then
        alter table public.pedidos_web
            add constraint pedidos_web_id_trabajador_foreign
            foreign key (id_trabajador)
            references public.trabajadores(id_trabajador)
            on delete set null;
    end if;
end;
$$;

create index if not exists idx_pedidos_web_trabajador
    on public.pedidos_web(id_trabajador);

create or replace function public.web_trabajador_pedido_json(
    p public.pedidos_web,
    c public.clientes
)
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
    'metodo_entrega_web', p.metodo_entrega_web,
    'distancia_km', p.distancia_km,
    'costo_envio_pedido', p.costo_envio_pedido,
    'total_pedido', p.total_pedido,
    'direccion_entrega', p.direccion_entrega,
    'referencia_entrega', p.referencia_entrega,
    'latitud_entrega', p.latitud_entrega,
    'longitud_entrega', p.longitud_entrega,
    'nombre_recibe', coalesce(p.nombre_recibe, c.nombre_cliente),
    'telefono_contacto', coalesce(p.telefono_contacto, c.telefono_cliente),
    'nota_cliente', p.nota_cliente,
    'hora_entrega_preferida', p.hora_entrega_preferida,
    'fecha_entrega_estimada', p.fecha_entrega_estimada,
    'fecha_aceptado_trabajador', p.fecha_aceptado_trabajador,
    'fecha_enviado', (
        select min(h.fecha_cambio)
        from public.pedido_web_estados h
        where h.id_pedido = p.id_pedido
          and h.estado_nuevo = 'enviado'
    ),
    'fecha_entregado', p.fecha_entregado,
    'cliente', jsonb_build_object(
        'nombre', c.nombre_cliente,
        'telefono', c.telefono_cliente,
        'correo', c.correo_cliente
    ),
    'items', coalesce((
        select jsonb_agg(jsonb_build_object(
            'producto', d.nombre_producto,
            'color', d.color_producto,
            'talla', d.talla_producto,
            'cantidad', d.cantidad_pedido,
            'subtotal', d.subtotal_pedido
        ) order by d.id_detalle_pedido)
        from public.detalle_pedidos_web d
        where d.id_pedido = p.id_pedido
    ), '[]'::jsonb)
);
$$;

create or replace function public.web_trabajador_pedidos()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_trabajador public.trabajadores%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Inicia sesión para continuar.';
    end if;

    select t.* into v_trabajador
    from public.trabajadores t
    join public.clientes c on c.id_cliente = t.id_cliente
    where c.auth_id = auth.uid()
    limit 1;

    if v_trabajador.id_trabajador is null then
        raise exception 'No tienes una cuenta de trabajador.';
    end if;

    if v_trabajador.estado_trabajador <> 'aprobado' then
        raise exception 'Tu cuenta de trabajador todavía no está aprobada.';
    end if;

    return jsonb_build_object(
        'disponible', coalesce(v_trabajador.disponible, false),
        'disponibles', coalesce((
            select jsonb_agg(public.web_trabajador_pedido_json(p, c) order by p.fecha_pedido)
            from public.pedidos_web p
            join public.clientes c on c.id_cliente = p.id_cliente
            where p.metodo_entrega_web = 'delivery'
              and p.id_trabajador is null
              and p.estado_pedido in ('aceptado', 'preparando')
        ), '[]'::jsonb),
        'asignados', coalesce((
            select jsonb_agg(public.web_trabajador_pedido_json(p, c) order by p.fecha_pedido desc)
            from (
                select p.*
                from public.pedidos_web p
                where p.id_trabajador = v_trabajador.id_trabajador
                order by p.fecha_pedido desc
                limit 50
            ) p
            join public.clientes c on c.id_cliente = p.id_cliente
        ), '[]'::jsonb)
    );
end;
$$;


create or replace function public.web_trabajador_aceptar_pedido(p_id integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_trabajador public.trabajadores%rowtype;
    v_pedido public.pedidos_web%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Inicia sesión para continuar.';
    end if;

    select t.* into v_trabajador
    from public.trabajadores t
    join public.clientes c on c.id_cliente = t.id_cliente
    where c.auth_id = auth.uid()
    limit 1;

    if v_trabajador.id_trabajador is null or v_trabajador.estado_trabajador <> 'aprobado' then
        raise exception 'Tu cuenta de trabajador no está aprobada.';
    end if;

    if not coalesce(v_trabajador.disponible, false) then
        raise exception 'Activa tu disponibilidad para aceptar pedidos.';
    end if;

    select p.* into v_pedido
    from public.pedidos_web p
    where p.id_pedido = p_id
    for update;

    if v_pedido.id_pedido is null then
        raise exception 'El pedido no existe.';
    end if;

    if v_pedido.id_trabajador = v_trabajador.id_trabajador then
        return jsonb_build_object('success', true, 'id_pedido', p_id, 'mensaje', 'Ya tienes este pedido.');
    end if;

    if v_pedido.id_trabajador is not null then
        raise exception 'Otro repartidor ya tomó este pedido.';
    end if;

    if v_pedido.metodo_entrega_web is distinct from 'delivery' then
        raise exception 'Este pedido no es de delivery.';
    end if;

    if v_pedido.estado_pedido not in ('aceptado', 'preparando') then
        raise exception 'Este pedido ya no está disponible para reparto.';
    end if;

    update public.pedidos_web
    set id_trabajador = v_trabajador.id_trabajador,
        fecha_aceptado_trabajador = now()
    where id_pedido = p_id;

    insert into public.pedido_web_estados (
        id_pedido,
        estado_anterior,
        estado_nuevo,
        estado_pago_anterior,
        estado_pago_nuevo,
        origen,
        nota
    ) values (
        p_id,
        v_pedido.estado_pedido,
        v_pedido.estado_pedido,
        v_pedido.estado_pago,
        v_pedido.estado_pago,
        'trabajador',
        'Pedido tomado por ' || v_trabajador.nombre_trabajador
    );

    return jsonb_build_object('success', true, 'id_pedido', p_id);
end;
$$;

create or replace function public.web_trabajador_estado_pedido(p_id integer, p_estado text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_trabajador public.trabajadores%rowtype;
    v_pedido public.pedidos_web%rowtype;
    v_pago public.pedidos_web.estado_pago%type;
begin
    if auth.uid() is null then
        raise exception 'Inicia sesión para continuar.';
    end if;

    select t.* into v_trabajador
    from public.trabajadores t
    join public.clientes c on c.id_cliente = t.id_cliente
    where c.auth_id = auth.uid()
    limit 1;

    if v_trabajador.id_trabajador is null or v_trabajador.estado_trabajador <> 'aprobado' then
        raise exception 'Tu cuenta de trabajador no está aprobada.';
    end if;

    if p_estado is null or p_estado not in ('enviado', 'entregado', 'devuelto') then
        raise exception 'Estado no válido para el repartidor.';
    end if;

    select p.* into v_pedido
    from public.pedidos_web p
    where p.id_pedido = p_id
    for update;

    if v_pedido.id_pedido is null or v_pedido.id_trabajador is distinct from v_trabajador.id_trabajador then
        raise exception 'Este pedido no está asignado a tu cuenta.';
    end if;

    /* Devuelto: el cliente canceló al recibir; el producto regresa a la tienda. */
    if p_estado = 'devuelto' then
        if v_pedido.estado_pedido = 'devuelto' then
            return jsonb_build_object('success', true, 'id_pedido', p_id, 'estado_pedido', 'devuelto');
        end if;

        if v_pedido.estado_pedido <> 'enviado' then
            raise exception 'Solo puedes devolver un pedido que salió contigo.';
        end if;

        update public.pedidos_web
        set estado_pedido = 'devuelto'
        where id_pedido = p_id;

        insert into public.pedido_web_estados (
            id_pedido,
            estado_anterior,
            estado_nuevo,
            estado_pago_anterior,
            estado_pago_nuevo,
            origen,
            nota
        ) values (
            p_id,
            v_pedido.estado_pedido,
            'devuelto',
            v_pedido.estado_pago,
            v_pedido.estado_pago,
            'trabajador',
            'El repartidor ' || v_trabajador.nombre_trabajador || ' marcó el pedido como devuelto: el cliente no lo recibió.'
        );

        return jsonb_build_object('success', true, 'id_pedido', p_id, 'estado_pedido', 'devuelto');
    end if;

    /* Entregado: solo desde «En camino». Si es efectivo, se cobra al entregar. */
    if p_estado = 'entregado' then
        if v_pedido.estado_pedido = 'entregado' then
            return jsonb_build_object('success', true, 'id_pedido', p_id, 'estado_pedido', 'entregado');
        end if;

        if v_pedido.estado_pedido <> 'enviado' then
            raise exception 'Primero marca el pedido en camino para poder entregarlo.';
        end if;

        v_pago := case
            when v_pedido.metodo_pago_web = 'efectivo' and v_pedido.estado_pago <> 'reembolsado' then 'pagado'
            else v_pedido.estado_pago
        end;

        update public.pedidos_web
        set estado_pedido = 'entregado',
            estado_pago = v_pago
        where id_pedido = p_id;

        insert into public.pedido_web_estados (
            id_pedido,
            estado_anterior,
            estado_nuevo,
            estado_pago_anterior,
            estado_pago_nuevo,
            origen,
            nota
        ) values (
            p_id,
            v_pedido.estado_pedido,
            'entregado',
            v_pedido.estado_pago,
            v_pago,
            'trabajador',
            'El repartidor ' || v_trabajador.nombre_trabajador || ' confirmó la entrega.'
        );

        return jsonb_build_object('success', true, 'id_pedido', p_id, 'estado_pedido', 'entregado', 'estado_pago', v_pago);
    end if;

    if v_pedido.estado_pedido = 'enviado' then
        return jsonb_build_object('success', true, 'id_pedido', p_id, 'estado_pedido', 'enviado');
    end if;

    if v_pedido.estado_pedido not in ('aceptado', 'preparando') then
        raise exception 'El pedido no se puede marcar en camino en su estado actual.';
    end if;

    update public.pedidos_web
    set estado_pedido = 'enviado'
    where id_pedido = p_id;

    insert into public.pedido_web_estados (
        id_pedido,
        estado_anterior,
        estado_nuevo,
        estado_pago_anterior,
        estado_pago_nuevo,
        origen,
        nota
    ) values (
        p_id,
        v_pedido.estado_pedido,
        'enviado',
        v_pedido.estado_pago,
        v_pedido.estado_pago,
        'trabajador',
        'El repartidor ' || v_trabajador.nombre_trabajador || ' salió con el pedido.'
    );

    return jsonb_build_object('success', true, 'id_pedido', p_id, 'estado_pedido', 'enviado');
end;
$$;

/* El cliente ve los datos públicos de su repartidor en "Mis pedidos". */
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
    'trabajador', case
        when p.id_trabajador is null then null
        else (
            select jsonb_build_object(
                'nombre', t.nombre_trabajador,
                'foto', t.foto_perfil,
                'telefono', t.telefono_trabajador,
                'color_usuario', t.color_usuario,
                'vehiculo_marca', t.vehiculo_marca,
                'vehiculo_modelo', t.vehiculo_modelo,
                'vehiculo_placa', t.vehiculo_placa,
                'vehiculo_color', t.vehiculo_color
            )
            from public.trabajadores t
            where t.id_trabajador = p.id_trabajador
        )
    end,
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
    'metodo_entrega_web', p.metodo_entrega_web,
    'distancia_km', p.distancia_km,
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
    'trabajador', case
        when p.id_trabajador is null then null
        else (
            select jsonb_build_object(
                'nombre', t.nombre_trabajador,
                'foto', t.foto_perfil,
                'telefono', t.telefono_trabajador,
                'color_usuario', t.color_usuario,
                'vehiculo_marca', t.vehiculo_marca,
                'vehiculo_modelo', t.vehiculo_modelo,
                'vehiculo_placa', t.vehiculo_placa,
                'vehiculo_color', t.vehiculo_color
            )
            from public.trabajadores t
            where t.id_trabajador = p.id_trabajador
        )
    end,
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

/* La función auxiliar solo la usa la RPC de pedidos; no se expone a los clientes. */
revoke all on function public.web_trabajador_pedido_json(public.pedidos_web, public.clientes) from public;
revoke all on function public.web_trabajador_pedido_json(public.pedidos_web, public.clientes) from anon;
revoke all on function public.web_trabajador_pedido_json(public.pedidos_web, public.clientes) from authenticated;
