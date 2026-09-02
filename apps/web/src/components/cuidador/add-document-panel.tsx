'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { petDocumentSchema, type PetDocumentFormValues, PET_DOCUMENT_TYPE_LABELS } from '@petapp/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SPRING_SHEET } from '@/lib/motion';
import { createPetDocument } from '@/app/cuidador/mascotas/[id]/actions';

const TYPES = Object.entries(PET_DOCUMENT_TYPE_LABELS) as [PetDocumentFormValues['document_type'], string][];

export function AddDocumentPanel({ petId }: { petId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PetDocumentFormValues>({
    resolver: zodResolver(petDocumentSchema),
    defaultValues: { pet_id: petId, title: '', document_url: '', document_type: 'carnet_vacunacion' },
  });

  const onSubmit = async (values: PetDocumentFormValues) => {
    const result = await createPetDocument(values);
    if (result.ok) {
      reset({ pet_id: petId, title: '', document_url: '', document_type: 'carnet_vacunacion' });
      setOpen(false);
      router.refresh();
    }
  };

  return (
    <div className="mb-4">
      {!open && (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Agregar documento
        </Button>
      )}
      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={SPRING_SHEET}
            className="overflow-hidden"
          >
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="font-heading text-sm font-semibold text-foreground">Nuevo documento</p>
                <Button type="button" variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setOpen(false)}>
                  <X className="size-4" />
                </Button>
              </div>
              <input type="hidden" {...register('pet_id')} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Nombre</Label>
                  <Input id="title" {...register('title')} placeholder="Ej. Carné de vacunación 2026" />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="document_type">Tipo</Label>
                  <select
                    id="document_type"
                    {...register('document_type')}
                    className="flex h-11 w-full rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {TYPES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="document_url">Enlace del documento</Label>
                <Input id="document_url" {...register('document_url')} placeholder="https://…" />
                {errors.document_url && <p className="text-sm text-destructive">{errors.document_url.message}</p>}
                {/* Fase piloto: se guarda un enlace (Drive, foto subida a otro servicio, etc.), no hay
                    subida de archivos real todavía — ver spec.md sección 5 / backlog. */}
                <p className="text-xs text-muted-foreground">
                  Por ahora se guarda como un enlace (por ejemplo, una foto subida a Google Drive). La subida
                  directa de archivos está en el backlog.
                </p>
              </div>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando…' : 'Agregar'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
