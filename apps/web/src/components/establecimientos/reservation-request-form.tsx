'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Service } from '@petapp/shared';
import { createReservation } from '@/app/establecimientos/[slug]/actions';

export function ReservationRequestForm({
  establishmentId,
  services,
}: {
  establishmentId: string;
  services: Service[];
}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (status === 'sent') {
    return (
      <p className="rounded-md border border-success/30 bg-success/5 p-3 text-sm text-success">
        Solicitud enviada. El aliado la verá en su panel de reservas — para coordinar más rápido, también
        puedes escribirle por WhatsApp.
      </p>
    );
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);
    const result = await createReservation(formData);
    if (result.ok) {
      setStatus('sent');
    } else {
      setErrorMessage(result.error ?? 'No se pudo enviar la solicitud.');
      setStatus('error');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="establishment_id" value={establishmentId} />
      {services.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="service_id">Servicio (opcional)</Label>
          <select
            id="service_id"
            name="service_id"
            className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="">Sin especificar</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea id="notes" name="notes" placeholder="Ej. horario preferido, motivo de la visita" rows={2} />
      </div>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      <Button type="submit" variant="outline" disabled={status === 'saving'} className="w-full">
        {status === 'saving' ? 'Enviando…' : 'Solicitar reserva'}
      </Button>
    </form>
  );
}
