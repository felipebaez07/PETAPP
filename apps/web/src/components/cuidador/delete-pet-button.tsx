'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deletePet } from '@/app/cuidador/mascotas/actions';

/** Borrar una mascota es irreversible y se lleva su calendario preventivo, documentos y
 * conversaciones de pre-diagnóstico (cascade) — pide confirmación antes de enviar. */
export function DeletePetButton({ petId, petName }: { petId: string; petName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (!window.confirm(`¿Eliminar a ${petName}? Se borra su calendario, documentos e historial. Esta acción no se puede deshacer.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await deletePet(petId);
    if (result.ok) {
      router.push('/cuidador/mascotas');
      router.refresh();
    } else {
      setBusy(false);
      setError(result.error ?? 'No se pudo eliminar.');
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={onClick}
        className="gap-1.5 text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="size-4" /> Eliminar
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
