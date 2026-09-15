-- PETAPP — Recordatorios automáticos (módulo "Comunicación y servicios" de OkVet, spec.md sección
-- 25). Columna para que el cron de recordatorios (apps/web/src/app/api/cron/recordatorios) sepa
-- qué `preventive_events` ya avisó y no vuelva a mandar el mismo recordatorio todos los días hasta
-- la fecha de vencimiento. `ADD COLUMN` nullable sin default — no reescribe la tabla, no bloquea,
-- sin importar cuántas filas tenga.

alter table public.preventive_events
  add column reminder_sent_at timestamptz;
