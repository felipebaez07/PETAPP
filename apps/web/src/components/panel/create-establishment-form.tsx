'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEstablishmentSchema, type CreateEstablishmentValues, CATEGORY_LABELS } from '@petapp/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createOwnEstablishment } from '@/app/panel/(dashboard)/actions';

// Solo veterinaria/profesional: el directorio y el pivot de producto ya excluyeron
// comercio/fundación (spec.md sección 2) — mismo criterio que `partner-application-form.tsx`.
const CATEGORY_OPTIONS: { value: CreateEstablishmentValues['category']; label: string }[] = [
  { value: 'veterinaria', label: CATEGORY_LABELS.veterinaria },
  { value: 'profesional', label: CATEGORY_LABELS.profesional },
];

export function CreateEstablishmentForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateEstablishmentValues>({
    resolver: zodResolver(createEstablishmentSchema),
    defaultValues: { name: '', category: 'veterinaria', address: '', phone: '', whatsapp_number: '' },
  });

  const onSubmit = async (values: CreateEstablishmentValues) => {
    setErrorMessage(null);
    const result = await createOwnEstablishment(values);
    if (!result.ok) {
      setErrorMessage(result.error ?? 'No se pudo crear tu negocio.');
      return;
    }
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre del negocio</Label>
        <Input id="name" {...register('name')} placeholder="Ej. Veterinaria San José" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Categoría</Label>
        <div className="space-y-2">
          {CATEGORY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-sm border border-border p-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-muted"
            >
              <input type="radio" value={option.value} className="accent-primary" {...register('category')} />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Dirección en Ibagué (opcional)</Label>
        <Input id="address" {...register('address')} placeholder="Calle / carrera, barrio" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono (opcional)</Label>
          <Input id="phone" {...register('phone')} placeholder="6011234567" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp_number">WhatsApp (opcional)</Label>
          <Input id="whatsapp_number" {...register('whatsapp_number')} placeholder="573001234567" />
        </div>
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creando…' : 'Crear mi negocio'}
      </Button>
    </form>
  );
}
