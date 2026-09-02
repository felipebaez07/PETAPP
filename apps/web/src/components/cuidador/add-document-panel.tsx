'use client';

import { useState, type ChangeEvent } from 'react';
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
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { validateDocumentFile, fileExtension } from '@/lib/uploads';
import { cn } from '@/lib/utils';

const TYPES = Object.entries(PET_DOCUMENT_TYPE_LABELS) as [PetDocumentFormValues['document_type'], string][];

type Mode = 'file' | 'link';

const DEFAULT_VALUES: PetDocumentFormValues = {
  pet_id: '',
  title: '',
  document_url: '',
  document_type: 'carnet_vacunacion',
};

export function AddDocumentPanel({ petId, ownerId }: { petId: string; ownerId: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PetDocumentFormValues>({
    resolver: zodResolver(petDocumentSchema),
    defaultValues: { ...DEFAULT_VALUES, pet_id: petId },
  });

  const resetAll = () => {
    reset({ ...DEFAULT_VALUES, pet_id: petId });
    setFile(null);
    setFileError(null);
    setMode('file');
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    const validationError = validateDocumentFile(selected);
    if (validationError) {
      setFileError(validationError);
      setFile(null);
      e.target.value = '';
      return;
    }
    setFile(selected);
  };

  const onSubmit = async (values: PetDocumentFormValues) => {
    if (mode === 'file') {
      if (!file) {
        setFileError('Selecciona un archivo.');
        return;
      }
      setBusy(true);
      // Bucket privado (0007_pet_media_storage.sql): la subida usa el cliente con la sesión
      // del cuidador (nunca service role) — la policy de Storage exige que el primer segmento
      // de la ruta sea su propio auth.uid().
      const supabase = createSupabaseBrowserClient();
      const ext = fileExtension(file, 'pdf');
      const path = `${ownerId}/${petId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('pet-documents')
        .upload(path, file, { contentType: file.type });
      if (uploadError) {
        setBusy(false);
        setFileError('No se pudo subir el archivo. Intenta de nuevo.');
        return;
      }
      const result = await createPetDocument({ ...values, document_url: undefined, storage_path: path });
      setBusy(false);
      if (result.ok) {
        resetAll();
        setOpen(false);
        router.refresh();
      } else {
        setError('root', { message: result.error ?? 'No se pudo guardar el documento.' });
      }
      return;
    }

    // Modo enlace: como ya funcionaba, se guarda `document_url` pegado a mano.
    if (!values.document_url) {
      setError('document_url', { message: 'Pega un enlace.' });
      return;
    }
    setBusy(true);
    const result = await createPetDocument({ ...values, storage_path: undefined });
    setBusy(false);
    if (result.ok) {
      resetAll();
      setOpen(false);
      router.refresh();
    } else {
      setError('root', { message: result.error ?? 'No se pudo guardar el documento.' });
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Cerrar"
                  onClick={() => {
                    setOpen(false);
                    resetAll();
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <input type="hidden" {...register('pet_id')} />

              <div className="inline-flex rounded-sm border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setMode('file')}
                  className={cn(
                    'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                    mode === 'file' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground'
                  )}
                >
                  Subir un archivo
                </button>
                <button
                  type="button"
                  onClick={() => setMode('link')}
                  className={cn(
                    'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                    mode === 'link' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground'
                  )}
                >
                  Pegar un enlace
                </button>
              </div>

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

              {mode === 'file' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="document_file">Archivo (imagen o PDF, máx. 10MB)</Label>
                  <input
                    id="document_file"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={onFileChange}
                    className="block text-sm text-muted-foreground file:mr-3 file:rounded-sm file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
                  />
                  {fileError && <p className="text-sm text-destructive">{fileError}</p>}
                  <p className="text-xs text-muted-foreground">
                    Se guarda en un espacio privado — solo tú puedes generar un enlace para verlo.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="document_url">Enlace del documento</Label>
                  <Input id="document_url" {...register('document_url')} placeholder="https://…" />
                  {errors.document_url && <p className="text-sm text-destructive">{errors.document_url.message}</p>}
                  <p className="text-xs text-muted-foreground">
                    Útil si el documento ya vive en otro sitio (ej. Google Drive).
                  </p>
                </div>
              )}

              {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

              <Button type="submit" size="sm" disabled={isSubmitting || busy}>
                {isSubmitting || busy ? 'Guardando…' : 'Agregar'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
