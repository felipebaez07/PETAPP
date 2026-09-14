'use client';

import { useState } from 'react';
import { CheckCircle2, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createVetVisitNote } from '@/app/cuidador/mascotas/[id]/prediagnostico/actions';

/**
 * Cierra el círculo del pre-diagnóstico (pedido explícito del usuario): después de la cita real,
 * el cuidador cuenta acá qué le dijo/hizo el veterinario. Esto no reemplaza ninguna otra parte
 * del resumen — es la única pieza que la IA no puede saber por sí sola, porque pasa fuera de la
 * app. Queda guardada para que la próxima conversación de pre-diagnóstico de esta misma mascota
 * arranque con ese contexto en vez de empezar de cero.
 */
export function VetVisitNoteForm({ petId, conversationId }: { petId: string; conversationId: string }) {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!note.trim()) {
      setStatus('error');
      setErrorMessage('Contanos aunque sea brevemente qué te dijo el veterinario.');
      return;
    }
    setStatus('saving');
    setErrorMessage(null);
    const result = await createVetVisitNote(petId, note.trim(), conversationId);
    if (!result.ok) {
      setStatus('error');
      setErrorMessage(result.error ?? 'Algo salió mal, intenta de nuevo.');
      return;
    }
    setStatus('sent');
  };

  if (status === 'sent') {
    return (
      <div className="flex items-start gap-2.5 rounded-md border border-success/30 bg-success/5 p-3 text-sm text-success">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>Guardado — la próxima consulta de pre-diagnóstico de esta mascota ya va a tener esto en cuenta.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Stethoscope className="size-4 text-secondary" aria-hidden />
        <p className="font-heading text-sm font-semibold text-foreground">¿Ya fuiste al veterinario?</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Contanos qué te dijo o qué le hizo — lo vamos a tener en cuenta la próxima vez que uses el asistente
        con esta mascota.
      </p>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ej. Le diagnosticaron una alergia alimentaria, le recetaron una dieta especial por 3 semanas…"
        rows={3}
        maxLength={2000}
      />
      {status === 'error' && errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      <Button size="sm" onClick={() => void onSubmit()} disabled={status === 'saving'}>
        {status === 'saving' ? 'Guardando…' : 'Guardar'}
      </Button>
    </div>
  );
}
