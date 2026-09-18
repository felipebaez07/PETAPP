'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteClinicalDocument } from '@/app/panel/(dashboard)/pacientes/[id]/actions';

/**
 * Borrar un documento es menos grave que borrar un paciente (no se lleva historia clínica encima),
 * pero sigue siendo irreversible — confirma igual que `DeletePatientButton`, solo con un mensaje
 * más corto.
 */
export function DeleteDocumentButton({
  documentId,
  clinicalPatientId,
  documentTitle,
}: {
  documentId: string;
  clinicalPatientId: string;
  documentTitle: string;
}) {
  return (
    <form
      action={deleteClinicalDocument}
      onSubmit={(e) => {
        if (!window.confirm(`¿Eliminar el documento "${documentTitle}"? Esta acción no se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={documentId} />
      <input type="hidden" name="clinical_patient_id" value={clinicalPatientId} />
      <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-destructive hover:bg-destructive/10">
        <Trash2 className="size-4" /> Eliminar
      </Button>
    </form>
  );
}
