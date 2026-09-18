-- PETAPP — Campos que le faltaban a `pets`/`services` para que el motor de recurrencias pueda
-- razonar sobre ellos (funcionalidad "Recordatorios automáticos de servicios recurrentes",
-- reglas 1 y 2): el cuidador puede opcionalmente indicar el tamaño/tipo de pelaje de su mascota, y
-- el prestador puede etiquetar cuál de sus servicios (hoy `services.name` es texto libre, ej.
-- "Baño premium", "Corte estilo caniche") corresponde a qué categoría de servicio recurrente —
-- sin esto no hay forma programática de saber que "Baño premium" ES un baño.
--
-- Puramente aditiva: tres `ADD COLUMN` nullable, ninguno reescribe la tabla ni bloquea.

create type public.pet_size as enum ('pequeno', 'mediano', 'grande');

alter table public.pets
  add column size public.pet_size,
  add column coat_type text;

alter table public.services
  add column service_type public.preventive_event_type;

create index services_service_type_idx on public.services(service_type);
