'use client';

import { useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Service, Pet } from '@petapp/shared';
import { SPRING_DEFAULT, REDUCED_MOTION_TRANSITION } from '@/lib/motion';
import { createServiceRequest } from '@/app/directorio/[slug]/actions';

export function ServiceRequestForm({
  establishmentId,
  services,
  pets,
}: {
  establishmentId: string;
  services: Service[];
  pets: Pet[];
}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const enterTransition = reduceMotion ? REDUCED_MOTION_TRANSITION : SPRING_DEFAULT;

  if (status === 'sent') {
    return (
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={enterTransition}
        className="flex items-start gap-2.5 rounded-md border border-success/30 bg-success/5 p-3 text-sm text-success"
      >
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Solicitud enviada. El prestador la verá en su panel — para coordinar más rápido, también puedes
          escribirle por WhatsApp.
        </p>
      </motion.div>
    );
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);
    const result = await createServiceRequest(formData);
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
      {pets.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="pet_id">Mascota (opcional)</Label>
          <select
            id="pet_id"
            name="pet_id"
            className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="">Sin especificar</option>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {services.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="service_id">Servicio (opcional)</Label>
          <select
            id="service_id"
            name="service_id"
            className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground"
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
      <AnimatePresence>
        {errorMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={REDUCED_MOTION_TRANSITION}
            className="text-sm text-destructive"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>
      <Button type="submit" variant="secondary" disabled={status === 'saving'} className="w-full">
        {status === 'saving' ? 'Enviando…' : 'Solicitar cita'}
      </Button>
    </form>
  );
}
