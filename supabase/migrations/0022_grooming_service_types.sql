-- PETAPP — Extiende preventive_event_type con los servicios de estética/cuidado recurrentes
-- (baño, spa, corte de pelo, corte de uñas, limpieza dental) — pedido formal del usuario,
-- funcionalidad "Recordatorios automáticos de servicios recurrentes". El calendario preventivo
-- (0005_pivot_preventivo.sql) ya cubre vacunas/control/desparasitación con este mismo enum — los
-- servicios de estética entran por el mismo lugar en vez de un tipo/tabla paralela, tal como pidió
-- el usuario explícitamente.
--
-- `ALTER TYPE ... ADD VALUE` va SOLO en esta migración, sin nada más: Postgres no deja usar un
-- valor de enum recién agregado dentro de la misma transacción en la que se agregó (las
-- migraciones de Supabase corren cada archivo como una transacción propia) — cualquier tabla o
-- columna que use estos valores nuevos necesita estar en un archivo posterior.

alter type public.preventive_event_type add value if not exists 'bano';
alter type public.preventive_event_type add value if not exists 'spa';
alter type public.preventive_event_type add value if not exists 'corte_pelo';
alter type public.preventive_event_type add value if not exists 'corte_unas';
alter type public.preventive_event_type add value if not exists 'limpieza_dental';
