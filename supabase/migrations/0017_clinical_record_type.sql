-- PETAPP — Agrega "tipo de consulta" a clinical_records (0016_clinical_records.sql), inspirado en
-- el análisis competitivo de OkVet (spec.md, sección de módulos de establecimiento, 2026-09-15):
-- sin esto, cada consulta era un bloque de texto libre indistinguible de las demás — no se podía
-- filtrar el historial ni, más adelante, alimentar automáticamente el calendario preventivo del
-- cuidador (`preventive_events`) desde una vacunación real registrada acá.
--
-- Mismo patrón ya usado para `preventive_event_type` (0005_pivot_preventivo.sql): un enum nativo
-- de Postgres, no texto + check — más barato de validar y ya es la convención del proyecto.
--
-- Puramente aditiva: columna nueva con default constante sobre una tabla que hoy no tiene tráfico
-- real (el módulo se lanzó ayer). `ADD COLUMN ... DEFAULT` constante no reescribe la tabla
-- (Postgres 11+) y no bloquea nada, sin importar cuántas filas tenga.

create type public.clinical_record_type as enum (
  'consulta_general',
  'control',
  'vacunacion',
  'desparasitacion',
  'cirugia',
  'otro'
);

alter table public.clinical_records
  add column record_type public.clinical_record_type not null default 'consulta_general';
