-- PETAPP — Falta que se detectó al construir el motor de generación (Paso 4, spec formal de
-- "recordatorios automáticos de servicios recurrentes"): la regla 3 exige que el recordatorio se
-- genere "a nombre de la clínica que atendió por última vez ese servicio" — sin una columna que lo
-- diga, no hay forma de saber a qué establecimiento apunta el botón de "agendar cita" del
-- recordatorio (regla 4), ni de aplicar el silencio por establecimiento (`pet_service_mutes`,
-- 0025_recurring_services.sql) al generar uno nuevo.
--
-- No hace falta un booleano aparte para "esto lo generó el sistema, no una persona": que esta
-- columna NO sea null ya es esa señal (los eventos creados a mano por el cuidador, o por la ruta
-- de seguimiento de la IA, siempre la dejan en null y en cambio sí llenan `created_by`).
--
-- Puramente aditiva: `ADD COLUMN` nullable sin default, no reescribe la tabla ni bloquea.

alter table public.preventive_events
  add column generated_by_establishment_id uuid references public.establishments(id) on delete set null;

create index preventive_events_generated_by_establishment_id_idx
  on public.preventive_events(generated_by_establishment_id);
