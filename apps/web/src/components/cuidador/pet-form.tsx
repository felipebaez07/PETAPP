'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'motion/react';
import { petSchema, type PetFormValues, SPECIES_LABELS } from '@petapp/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { SPRING_SHEET } from '@/lib/motion';
import { createPet } from '@/app/cuidador/mascotas/actions';

const SPECIES = Object.entries(SPECIES_LABELS) as [PetFormValues['species'], string][];

export function PetForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PetFormValues>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: '',
      species: 'perro',
      breed: '',
      sex: 'desconocido',
      birth_date: '',
      sterilized: false,
      vaccinated: false,
      notes: '',
    },
  });
  const sterilized = useWatch({ control, name: 'sterilized' });
  const vaccinated = useWatch({ control, name: 'vaccinated' });

  const onSubmit = async (values: PetFormValues) => {
    setErrorMessage(null);
    const result = await createPet(values);
    if (!result.ok) {
      setErrorMessage(result.error ?? 'No se pudo guardar la mascota.');
      return;
    }
    router.refresh();
    onDone?.();
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SHEET}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" {...register('name')} placeholder="Ej. Luna" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="species">Especie</Label>
          <select
            id="species"
            {...register('species')}
            className="flex h-11 w-full rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SPECIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="breed">Raza (opcional)</Label>
          <Input id="breed" {...register('breed')} placeholder="Ej. Criollo, Labrador…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="birth_date">Fecha de nacimiento (opcional)</Label>
          <Input id="birth_date" type="date" {...register('birth_date')} />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Checkbox
            id="sterilized"
            checked={sterilized}
            onCheckedChange={(v) => setValue('sterilized', Boolean(v))}
          />
          <Label htmlFor="sterilized" className="cursor-pointer">
            Esterilizado/a
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="vaccinated"
            checked={vaccinated}
            onCheckedChange={(v) => setValue('vaccinated', Boolean(v))}
          />
          <Label htmlFor="vaccinated" className="cursor-pointer">
            Esquema de vacunación al día
          </Label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea id="notes" {...register('notes')} placeholder="Alergias, condiciones, temperamento…" rows={2} />
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-destructive"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando…' : 'Guardar mascota'}
      </Button>
    </motion.form>
  );
}
