/* ╔══════════════════════════════════════════════════════════════════╗
   ║  Atributo «Tipo»: correcciones y segundos tipos                   ║
   ║  Supabase → SQL Editor → New query → pega TODO → Run              ║
   ║                                                                   ║
   ║  Reglas aplicadas:                                                ║
   ║   · Un producto lleva un segundo «Tipo» solo si el modelo lo      ║
   ║     justifica (el resto se deja con uno).                         ║
   ║   · No se borra ningún valor del catálogo; «Zapatos» queda        ║
   ║     disponible aunque ningún producto lo use.                     ║
   ╚══════════════════════════════════════════════════════════════════╝ */

begin;

-- 1) Reactivar «Zapatilla».
--    Está desactivado (estado_valor = false) y es el tipo de 10 productos:
--    el formulario del ERP solo ofrece valores activos, así que al editar
--    cualquiera de esos productos el tipo se perdía.
update atributo_valores
set estado_valor = true
where id_atributo = 2
  and valor_atributo = 'Zapatilla';

-- 2) «Tacón»: valor nuevo para los dos tacones que hoy figuran como «Sandalia».
insert into atributo_valores (id_atributo, valor_atributo, orden_valor, estado_valor)
select 2, 'Tacón', 5, true
where not exists (
    select 1 from atributo_valores
    where id_atributo = 2 and valor_atributo = 'Tacón'
);

-- 3) Zapatillas que quedaron como «Zapatos»: Next Line (1) y Nike Air Force 1 Low (20).
update producto_atributos
set id_valor = (
    select id_valor from atributo_valores
    where id_atributo = 2 and valor_atributo = 'Zapatilla'
)
where id_atributo = 2
  and id_producto in (1, 20)
  and id_valor = (
      select id_valor from atributo_valores
      where id_atributo = 2 and valor_atributo = 'Zapatos'
  );

-- 4) Tacones que quedaron como «Sandalia»: D'Orsay (43) y D'Orsay con pulsera (45).
update producto_atributos
set id_valor = (
    select id_valor from atributo_valores
    where id_atributo = 2 and valor_atributo = 'Tacón'
)
where id_atributo = 2
  and id_producto in (43, 45)
  and id_valor = (
      select id_valor from atributo_valores
      where id_atributo = 2 and valor_atributo = 'Sandalia'
  );

-- 5) Segundo tipo, solo donde el modelo lo justifica:
--    Nike SB Dunk Low Panda (3) y Vans Sk8-Hi MTE (9) son zapatillas de skate.
insert into producto_atributos (id_producto, id_atributo, id_valor)
select p.id_producto, 2, v.id_valor
from productos p
join atributo_valores v
    on v.id_atributo = 2
   and v.valor_atributo = 'Skate'
where p.id_producto in (3, 9)
  and not exists (
      select 1 from producto_atributos pa
      where pa.id_producto = p.id_producto
        and pa.id_atributo = 2
        and pa.id_valor = v.id_valor
  );

commit;

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  Volver atrás (ejecutar solo si hay que revertir)                 ║
   ╚══════════════════════════════════════════════════════════════════╝

delete from producto_atributos
where id_atributo = 2
  and id_producto in (3, 9)
  and id_valor = (
      select id_valor from atributo_valores
      where id_atributo = 2 and valor_atributo = 'Skate'
  );

update producto_atributos
set id_valor = (
    select id_valor from atributo_valores
    where id_atributo = 2 and valor_atributo = 'Sandalia'
)
where id_atributo = 2 and id_producto in (43, 45);

update producto_atributos
set id_valor = (
    select id_valor from atributo_valores
    where id_atributo = 2 and valor_atributo = 'Zapatos'
)
where id_atributo = 2 and id_producto in (1, 20);

delete from atributo_valores
where id_atributo = 2 and valor_atributo = 'Tacón';

update atributo_valores
set estado_valor = false
where id_atributo = 2 and valor_atributo = 'Zapatilla';

*/
