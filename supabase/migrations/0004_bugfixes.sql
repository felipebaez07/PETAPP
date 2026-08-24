-- Correcciones de la auditoría de bugs (agosto 2026):
--
-- 1) Un establecimiento no podía leer el perfil ni la mascota del propietario
--    que le hizo una reserva (RLS de profiles/pets no contemplaba ese caso),
--    así que el panel de Reservas mostraba "Usuario" sin teléfono ni mascota.
-- 2) adoption_interests solo aceptaba inserts de usuarios autenticados, pero
--    el formulario público de "interesado en adoptar" no exige login —
--    cualquier visitante anónimo que lo llenara recibía un error de la base
--    de datos en vez de la confirmación. Se abre a inserts públicos, igual
--    que partner_applications, pero sin permitir que alguien autenticado
--    se haga pasar por otro usuario en interested_user_id.

create policy "profiles_read_via_reservation" on public.profiles
  for select using (
    exists (
      select 1 from public.reservations r
      join public.establishments e on e.id = r.establishment_id
      where r.pet_owner_id = profiles.id and e.owner_id = auth.uid()
    )
  );

create policy "pets_read_via_reservation" on public.pets
  for select using (
    exists (
      select 1 from public.reservations r
      join public.establishments e on e.id = r.establishment_id
      where r.pet_id = pets.id and e.owner_id = auth.uid()
    )
  );

drop policy if exists "adoption_interests_insert_anyone_authenticated" on public.adoption_interests;

create policy "adoption_interests_public_insert" on public.adoption_interests
  for insert with check (interested_user_id is null or interested_user_id = auth.uid());
