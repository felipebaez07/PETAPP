-- PETAPP — Cierra un hueco de seguridad encontrado en revisión de código (2026-09-02):
-- la policy de inserción de `service_requests` (heredada de `reservations_pet_owner_insert`,
-- 0001_init.sql, sin cambios cuando la tabla se renombró en 0005) solo exige
-- `pet_owner_id = auth.uid()` — nunca valida que `pet_id` pertenezca a ese mismo usuario.
--
-- Esto importa especialmente porque `apps/mobile` inserta en `service_requests` directo desde
-- el cliente (sin servidor intermedio que valide) — la única defensa real ahí es esta policy.
-- Sin este fix, un cuidador autenticado podía mandar el `pet_id` de la mascota de otra persona
-- (adivinado o filtrado) y el prestador vería el nombre de esa mascota ajena en su panel de
-- solicitudes/agenda. `apps/web` ya recibió además un chequeo de aplicación en
-- `app/directorio/[slug]/actions.ts` como defensa adicional, pero eso no protege a mobile.
--
-- DROP POLICY + CREATE POLICY como sentencias separadas (no hay `CREATE OR REPLACE POLICY` en
-- Postgres): entre una y otra, cualquier INSERT concurrente a `service_requests` queda
-- bloqueado por completo (sin policy aplicable = denegado) en vez de expuesto — es decir, el
-- hueco momentáneo es "fail-closed", no "fail-open". Aceptable para un piloto de bajo tráfico.

drop policy "reservations_pet_owner_insert" on public.service_requests;

create policy "reservations_pet_owner_insert" on public.service_requests
  for insert with check (
    pet_owner_id = auth.uid()
    and (
      pet_id is null
      or exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid())
    )
  );
