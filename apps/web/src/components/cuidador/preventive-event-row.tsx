'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Clock, Trash2, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PREVENTIVE_EVENT_TYPE_LABELS, todayLocalDateString, type PreventiveEvent } from '@petapp/shared';
import { SPRING_GESTURE } from '@/lib/motion';
import { togglePreventiveEventCompleted, deletePreventiveEvent } from '@/app/cuidador/mascotas/[id]/actions';

type EventState = 'proximo' | 'vencido' | 'completado';

function eventState(event: PreventiveEvent): EventState {
  if (event.completed_at) return 'completado';
  return event.due_date < todayLocalDateString() ? 'vencido' : 'proximo';
}

export function PreventiveEventRow({ event, petId }: { event: PreventiveEvent; petId: string }) {
  const [isPending, startTransition] = useTransition();
  const [completed, setCompleted] = useState(Boolean(event.completed_at));
  const [removed, setRemoved] = useState(false);
  const state = completed ? 'completado' : eventState(event);

  const onToggle = () => {
    const next = !completed;
    setCompleted(next); // optimista: el check dispara antes de que vuelva el servidor
    startTransition(async () => {
      const result = await togglePreventiveEventCompleted(event.id, petId, next);
      if (!result.ok) setCompleted(!next);
    });
  };

  const onDelete = () => {
    setRemoved(true);
    startTransition(async () => {
      await deletePreventiveEvent(event.id, petId);
    });
  };

  if (removed) return null;

  return (
    <motion.div
      layout
      className="flex items-start gap-3 border-b border-border py-3 last:border-0"
      initial={false}
      animate={{ opacity: isPending ? 0.6 : 1 }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={completed ? 'Marcar como pendiente' : 'Marcar como completado'}
        className="mt-0.5 shrink-0 cursor-pointer text-muted-foreground transition-colors duration-150 hover:text-success"
      >
        <AnimatePresence mode="wait" initial={false}>
          {completed ? (
            <motion.span
              key="done"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={SPRING_GESTURE}
              className="block text-success"
            >
              <CheckCircle2 className="size-5" />
            </motion.span>
          ) : (
            <motion.span
              key="pending"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={SPRING_GESTURE}
              className="block"
            >
              <Circle className="size-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn('font-medium text-foreground', completed && 'text-muted-foreground line-through')}>
            {event.title}
          </p>
          <Badge variant="outline">{PREVENTIVE_EVENT_TYPE_LABELS[event.type]}</Badge>
          <StateBadge state={state} />
        </div>
        <p className="text-sm text-muted-foreground">
          {state === 'completado' ? 'Completado el' : 'Fecha programada'}:{' '}
          {new Date(`${(event.completed_at ?? event.due_date).slice(0, 10)}T00:00:00`).toLocaleDateString('es-CO')}
        </p>
        {event.notes && <p className="mt-0.5 text-sm text-muted-foreground">{event.notes}</p>}
      </div>

      <Button variant="ghost" size="icon" aria-label={`Eliminar ${event.title}`} onClick={onDelete}>
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </motion.div>
  );
}

function StateBadge({ state }: { state: EventState }) {
  if (state === 'completado') return null; // el check + tachado ya lo comunican, evitar redundancia visual
  if (state === 'vencido') {
    return (
      <Badge variant="destructive">
        <TriangleAlert className="size-3.5" /> Vencido
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Clock className="size-3.5" /> Próximo
    </Badge>
  );
}
