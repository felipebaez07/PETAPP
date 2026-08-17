'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { adoptionInterestSchema, type AdoptionInterestFormValues, buildAdoptionInterestWhatsAppLink } from '@petapp/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { submitAdoptionInterest } from '@/app/adopciones/[id]/actions';

export function AdoptionInterestForm({
  adoptionPostId,
  animalName,
  whatsappNumber,
}: {
  adoptionPostId: string;
  animalName: string;
  whatsappNumber: string | null;
}) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdoptionInterestFormValues>({
    resolver: zodResolver(adoptionInterestSchema),
    defaultValues: { full_name: '', phone: '', email: '', message: '' },
  });

  const onSubmit = async (values: AdoptionInterestFormValues) => {
    setStatus('submitting');
    setErrorMessage(null);
    const result = await submitAdoptionInterest(adoptionPostId, values);
    if (result.ok) {
      setSubmittedName(values.full_name);
      setIsDemo(Boolean(result.demo));
      setStatus('success');
    } else {
      setErrorMessage(result.error ?? 'No pudimos enviar tu solicitud. Intenta de nuevo.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    const whatsappLink = whatsappNumber
      ? buildAdoptionInterestWhatsAppLink({ whatsappNumber, animalName, adopterName: submittedName })
      : null;
    return (
      <div className="rounded-md border border-success/30 bg-success/5 p-5 text-center">
        <CheckCircle2 className="mx-auto mb-2 size-8 text-success" />
        <p className="font-heading font-semibold text-foreground">¡Solicitud enviada!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          El aliado que publicó a {animalName} revisará tu información. Para acelerar el contacto, escríbele
          directamente:
        </p>
        {isDemo && (
          <p className="mt-2 text-xs text-muted-foreground">
            (Entorno de demostración: esta solicitud aún no se guarda en una base de datos real.)
          </p>
        )}
        {whatsappLink && (
          <Button asChild variant="secondary" className="mt-4">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Escribir por WhatsApp
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Nombre completo</Label>
        <Input id="full_name" {...register('full_name')} placeholder="Tu nombre" />
        {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Teléfono de contacto</Label>
        <Input id="phone" {...register('phone')} placeholder="300 123 4567" />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo (opcional)</Label>
        <Input id="email" type="email" {...register('email')} placeholder="tucorreo@ejemplo.com" />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Cuéntanos por qué quieres adoptar a {animalName} (opcional)</Label>
        <Textarea id="message" {...register('message')} placeholder="Espacio en casa, experiencia con mascotas, etc." />
      </div>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      <Button type="submit" disabled={status === 'submitting'} className="w-full">
        {status === 'submitting' ? 'Enviando…' : 'Enviar solicitud de adopción'}
      </Button>
    </form>
  );
}
