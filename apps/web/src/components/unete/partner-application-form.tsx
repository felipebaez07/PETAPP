'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { partnerApplicationSchema, type PartnerApplicationValues, CATEGORY_LABELS } from '@petapp/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { submitPartnerApplication } from '@/app/unete/actions';

// No se deriva de todo `CATEGORY_LABELS` (4 categorías) a propósito: el schema de este
// formulario (`partnerApplicationSchema`) se acotó a solo veterinaria/profesional tras el
// pivot de producto (spec.md sección 2) — comercio/fundación ya no son categorías que este
// formulario pueda enviar, y mostrarlas como opción seleccionable rompía el submit sin avisar.
const PARTNER_CATEGORIES: [PartnerApplicationValues['category'], string][] = [
  ['veterinaria', CATEGORY_LABELS.veterinaria],
  ['profesional', CATEGORY_LABELS.profesional],
];

export function PartnerApplicationForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PartnerApplicationValues>({
    resolver: zodResolver(partnerApplicationSchema),
    defaultValues: { business_name: '', category: 'veterinaria', contact_name: '', phone: '', email: '', address: '', message: '' },
  });

  const onSubmit = async (values: PartnerApplicationValues) => {
    setStatus('submitting');
    setErrorMessage(null);
    const result = await submitPartnerApplication(values);
    if (result.ok) {
      setIsDemo(Boolean(result.demo));
      setStatus('success');
    } else {
      setErrorMessage(result.error ?? 'No pudimos enviar tu solicitud. Intenta de nuevo.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-md border border-success/30 bg-success/5 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-2 size-8 text-success" />
        <p className="font-heading font-semibold text-foreground">¡Gracias por tu interés!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Nuestro equipo revisará tu solicitud y te contactará para el onboarding gratuito del piloto.
        </p>
        {isDemo && (
          <p className="mt-2 text-xs text-muted-foreground">
            (Entorno de demostración: esta solicitud aún no se guarda en una base de datos real.)
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="business_name">Nombre del negocio o fundación</Label>
          <Input id="business_name" {...register('business_name')} placeholder="Ej. Veterinaria San José" />
          {errors.business_name && <p className="text-sm text-destructive">{errors.business_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Categoría</Label>
          <select
            id="category"
            {...register('category')}
            className="flex h-11 w-full rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {PARTNER_CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact_name">Nombre de contacto</Label>
          <Input id="contact_name" {...register('contact_name')} placeholder="Tu nombre" />
          {errors.contact_name && <p className="text-sm text-destructive">{errors.contact_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono / WhatsApp</Label>
          <Input id="phone" {...register('phone')} placeholder="300 123 4567" />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo (opcional)</Label>
          <Input id="email" type="email" {...register('email')} placeholder="tucorreo@ejemplo.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Dirección en Ibagué (opcional)</Label>
          <Input id="address" {...register('address')} placeholder="Calle / carrera, barrio" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Cuéntanos brevemente sobre tu negocio (opcional)</Label>
        <Textarea id="message" {...register('message')} placeholder="Años de operación, servicios que ofreces, horarios…" />
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      <Button type="submit" disabled={status === 'submitting'} className="w-full sm:w-auto">
        {status === 'submitting' ? 'Enviando…' : 'Enviar solicitud'}
      </Button>
    </form>
  );
}
