-- PETAPP — Deja que el dueño de la mascota quite un documento (consentimiento/remisión/orden/
-- fórmula, 0019_clinical_documents.sql) de SU PROPIA vista — pedido explícito del usuario: "ya la
-- imprimí y no necesito verla". Deliberadamente NO es un DELETE real: `clinical_documents` es
-- compartida entre el establecimiento y el dueño de la mascota — si el dueño pudiera borrar la
-- fila, el establecimiento perdería su propio registro clínico oficial. En vez de eso, se agrega
-- una marca de "archivado para el dueño" que solo oculta el documento del lado del cuidador; el
-- establecimiento lo sigue viendo siempre en su panel.
--
-- Puramente aditiva: `ADD COLUMN` nullable sin default (no reescribe la tabla, no bloquea) + una
-- policy nueva que se suma a las que ya existían, ninguna se toca.

alter table public.clinical_documents
  add column archived_by_owner_at timestamptz;

-- Reusa la misma función de visibilidad ya escrita en 0019 (clinical_document_visible_to_pet_owner)
-- para no duplicar el chequeo de "esto es de mi mascota". A diferencia de
-- `clinical_documents_pet_owner_sign` (que solo deja tocar la fila mientras no tenga firma), archivar
-- debe poder hacerse en cualquier momento — de hecho el caso típico es archivar DESPUÉS de firmado
-- e impreso.
create policy "clinical_documents_pet_owner_archive" on public.clinical_documents
  for update using (
    public.clinical_document_visible_to_pet_owner(clinical_patient_id, auth.uid())
  )
  with check (
    public.clinical_document_visible_to_pet_owner(clinical_patient_id, auth.uid())
  );
