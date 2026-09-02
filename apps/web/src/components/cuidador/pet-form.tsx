'use client';

import { useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'motion/react';
import { PawPrint } from 'lucide-react';
import { petSchema, type PetFormValues, SPECIES_LABELS } from '@petapp/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { SPRING_SHEET } from '@/lib/motion';
import { createPet } from '@/app/cuidador/mascotas/actions';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { validatePhotoFile, fileExtension } from '@/lib/uploads';

const SPECIES = Object.entries(SPECIES_LABELS) as [PetFormValues['species'], string][];

export function PetForm({ onDone, ownerId }: { onDone?: () => void; ownerId: string }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

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

  const onPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoError(null);
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    const validationError = validatePhotoFile(file);
    if (validationError) {
      setPhotoError(validationError);
      setPhotoFile(null);
      setPhotoPreview(null);
      e.target.value = '';
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: PetFormValues) => {
    setErrorMessage(null);
    const result = await createPet(values);
    if (!result.ok || !result.id) {
      setErrorMessage(result.error ?? 'No se pudo guardar la mascota.');
      return;
    }

    let photoUploadFailed = false;
    if (photoFile) {
      // La fila en `pets` ya existe (paso anterior) — recién ahora se conoce el `pet_id` real
      // que exige la convención de ruta `<auth.uid()>/<pet_id>/<archivo>` de las policies de
      // Storage (0007_pet_media_storage.sql). Si la subida falla, la mascota queda creada sin
      // foto de todas formas: no vale la pena bloquear el flujo completo por esto.
      const supabase = createSupabaseBrowserClient();
      const ext = fileExtension(photoFile, 'jpg');
      const path = `${ownerId}/${result.id}/photo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(path, photoFile, { upsert: true, contentType: photoFile.type });
      if (!uploadError) {
        const { data } = supabase.storage.from('pet-photos').getPublicUrl(path);
        await supabase.from('pets').update({ photo_url: data.publicUrl }).eq('id', result.id);
      } else {
        photoUploadFailed = true;
        setErrorMessage('La mascota se guardó, pero la foto no se pudo subir. Puedes intentarlo de nuevo luego.');
      }
    }

    router.refresh();
    if (!photoUploadFailed) onDone?.();
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SHEET}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa local (object URL), no un dominio remoto
            <img src={photoPreview} alt="Vista previa de la foto" className="h-full w-full object-cover" />
          ) : (
            <PawPrint className="size-8 text-secondary" aria-hidden />
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="photo">Foto (opcional)</Label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={onPhotoChange}
            className="block text-sm text-muted-foreground file:mr-3 file:rounded-sm file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
          />
          {photoError && <p className="text-sm text-destructive">{photoError}</p>}
        </div>
      </div>

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
