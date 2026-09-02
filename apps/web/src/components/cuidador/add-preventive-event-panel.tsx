'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { preventiveEventSchema, type PreventiveEventFormValues, PREVENTIVE_EVENT_TYPE_LABELS } from '@petapp/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SPRING_SHEET } from '@/lib/motion';
import { createPreventiveEvent } from '@/app/cuidador/mascotas/[id]/actions';

const TYPES = Object.entries(PREVENTIVE_EVENT_TYPE_LABELS) as [PreventiveEventFormValues['type'], string][];

export function AddPreventiveEventPanel({ petId }: { petId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PreventiveEventFormValues>({
    resolver: zodResolver(preventiveEventSchema),
    defaultValues: { pet_id: petId, type: 'vacuna', title: '', due_date: '', notes: '' },
  });

  const onSubmit = async (values: PreventiveEventFormValues) => {
    const result = await createPreventiveEvent(values);
    if (result.ok) {
      reset({ pet_id: petId, type: 'vacuna', title: '', due_date: '', notes: '' });
      setOpen(false);
      router.refresh();
    }
  };

  return (
    <div className="mb-4">
      {!open && (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Agregar al calendario
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
                <p className="font-heading text-sm font-semibold text-foreground">Nuevo evento preventivo</p>
                <Button type="button" variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setOpen(false)}>
                  <X className="size-4" />
                </Button>
              </div>
              <input type="hidden" {...register('pet_id')} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="type">Tipo</Label>
                  <select
                    id="type"
                    {...register('type')}
                    className="flex h-11 w-full rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {TYPES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="due_date">Fecha</Label>
                  <Input id="due_date" type="date" {...register('due_date')} />
                  {errors.due_date && <p className="text-sm text-destructive">{errors.due_date.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Título</Label>
                <Input id="title" {...register('title')} placeholder="Ej. Refuerzo antirrábico" />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea id="notes" {...register('notes')} rows={2} />
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
