'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteClinicalPatient } from '@/app/panel/(dashboard)/pacientes/[id]/actions';

/**
 * A diferencia del resto de botones de borrar de este panel (ver `servicios/page.tsx`, que borran
 * sin confirmar — una fila de servicio es de bajo riesgo), borrar un paciente se lleva también
 * TODA su historia clínica (cascade en 0016_clinical_records.sql). Por eso este sí pide
 * confirmación antes de dejar que el formulario se envíe.
 */
export function DeletePatientButton({ patientId, patientName }: { patientId: string; patientName: string }) {
  return (
    <form
      action={deleteClinicalPatient}
      onSubmit={(e) => {
        if (!window.confirm(`¿Eliminar a ${patientName} y toda su historia clínica? Esta acción no se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={patientId} />
      <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-destructive hover:bg-destructive/10">
        <Trash2 className="size-4" /> Eliminar paciente
      </Button>
    </form>
  );
}
