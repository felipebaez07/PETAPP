'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { convertApplicationToEstablishment } from '@/app/panel/(dashboard)/admin/solicitudes/actions';

export function ConvertApplicationButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onClick = async () => {
    setStatus('saving');
    setErrorMessage(null);
    const formData = new FormData();
    formData.set('id', applicationId);
    const result = await convertApplicationToEstablishment(formData);
    if (result.ok) {
      router.refresh();
    } else {
      setErrorMessage(result.error ?? 'No se pudo convertir la solicitud.');
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" size="sm" disabled={status === 'saving'} onClick={onClick}>
        {status === 'saving' ? 'Creando…' : 'Crear como establecimiento'}
      </Button>
      {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
    </div>
  );
}
