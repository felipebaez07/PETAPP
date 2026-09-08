'use client';

import { useState } from 'react';
import { CalendarCheck, CalendarPlus, CircleCheck, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  PREVENTIVE_EVENT_TYPE_LABELS,
  type AiRoadmapItem,
  type AiRoadmapItemStatus,
  type PreventiveEventType,
} from '@petapp/shared';
import { createPreventiveEvent } from '@/app/cuidador/mascotas/[id]/actions';
import { saveRoadmapDecision } from '@/app/cuidador/mascotas/[id]/prediagnostico/actions';

type Decision = AiRoadmapItemStatus;

interface RoadmapRowState {
  item: AiRoadmapItem;
  decision: Decision;
  editing: boolean;
  title: string;
  type: PreventiveEventType;
  due_date: string;
  notes: string;
  saving: boolean;
  error: string | null;
}

function toRowState(item: AiRoadmapItem): RoadmapRowState {
  return {
    item,
    decision: item.status ?? 'pending',
    editing: false,
    title: item.title,
    type: item.type,
    due_date: item.due_date,
    notes: item.notes ?? '',
    saving: false,
    error: null,
  };
}

const TYPES = Object.entries(PREVENTIVE_EVENT_TYPE_LABELS) as [PreventiveEventType, string][];

/**
 * Lo que el modelo sugiere son próximos pasos (agendar consulta, control de seguimiento), nunca
 * un tratamiento — el cuidador decide qué hacer con cada uno: aceptarlo tal cual (crea un
 * `preventive_event` real, mismo calendario que ya existe), modificarlo antes de aceptar, o
 * dejarlo solo como algo a tener en cuenta (no escribe nada en la base de datos).
 */
export function PrediagnosticoRoadmap({
  petId,
  conversationId,
  items,
}: {
  petId: string;
  conversationId: string;
  items: AiRoadmapItem[];
}) {
  const [rows, setRows] = useState<RoadmapRowState[]>(() => items.map(toRowState));

  const update = (index: number, patch: Partial<RoadmapRowState>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  // Guarda el array completo (con el status ya actualizado) de vuelta en ai_conversations.roadmap
  // — sin esto la decisión era efímera: "aceptar" sí agendaba, pero al volver a esta pantalla la
  // tarjeta volvía a aparecer como pendiente, con riesgo de agendar el mismo recordatorio dos veces.
  const persist = (nextRows: RoadmapRowState[]) => {
    void saveRoadmapDecision(
      conversationId,
      nextRows.map((r) => ({ ...r.item, status: r.decision }))
    );
  };

  const accept = async (index: number) => {
    const row = rows[index];
    if (!row.title.trim() || !row.due_date) {
      update(index, { error: 'Completa el título y la fecha.' });
      return;
    }
    update(index, { saving: true, error: null });
    const result = await createPreventiveEvent({
      pet_id: petId,
      type: row.type,
      title: row.title.trim(),
      due_date: row.due_date,
      notes: row.notes.trim() || '',
    });
    if (!result.ok) {
      update(index, { saving: false, error: result.error ?? 'No se pudo agendar.' });
      return;
    }
    setRows((prev) => {
      const next = prev.map((r, i) =>
        i === index
          ? {
              ...r,
              saving: false,
              editing: false,
              decision: 'accepted' as const,
              item: {
                title: row.title.trim(),
                type: row.type,
                due_date: row.due_date,
                notes: row.notes.trim() || null,
                status: 'accepted' as const,
              },
            }
          : r
      );
      persist(next);
      return next;
    });
  };

  const dismiss = (index: number) => {
    setRows((prev) => {
      const next = prev.map((r, i) =>
        i === index ? { ...r, decision: 'dismissed' as const, item: { ...r.item, status: 'dismissed' as const } } : r
      );
      persist(next);
      return next;
    });
  };

  const undo = (index: number) => {
    setRows((prev) => {
      const next = prev.map((r, i) =>
        i === index ? { ...r, decision: 'pending' as const, item: { ...r.item, status: 'pending' as const } } : r
      );
      persist(next);
      return next;
    });
  };

  if (rows.length === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <p className="font-heading text-sm font-semibold text-foreground">Ruta sugerida de seguimiento</p>
        <p className="text-xs text-muted-foreground">
          Ideas de próximos pasos según lo que contaste — vos decidís si las agendás, las ajustás o solo las
          tenés en cuenta.
        </p>
      </div>
      <ul className="space-y-2.5">
        {rows.map((row, index) => (
          <li key={index} className="rounded-lg border border-border bg-card p-3.5">
            {row.decision === 'accepted' ? (
              <div className="flex items-center gap-2 text-sm text-success">
                <CircleCheck className="size-4 shrink-0" aria-hidden />
                <span>
                  Agendado: <strong className="font-medium">{row.title}</strong> ·{' '}
                  {new Date(`${row.due_date}T00:00:00`).toLocaleDateString('es-CO')}
                </span>
              </div>
            ) : row.decision === 'dismissed' ? (
              <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  Solo la tuviste en cuenta: <span className="italic">{row.title}</span>
                </span>
                <Button size="sm" variant="ghost" onClick={() => undo(index)}>
                  Deshacer
                </Button>
              </div>
            ) : row.editing ? (
              <div className="space-y-2.5">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor={`roadmap-title-${index}`}>Título</Label>
                    <Input
                      id={`roadmap-title-${index}`}
                      value={row.title}
                      onChange={(e) => update(index, { title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`roadmap-date-${index}`}>Fecha</Label>
                    <Input
                      id={`roadmap-date-${index}`}
                      type="date"
                      value={row.due_date}
                      onChange={(e) => update(index, { due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`roadmap-type-${index}`}>Tipo</Label>
                  <select
                    id={`roadmap-type-${index}`}
                    value={row.type}
                    onChange={(e) => update(index, { type: e.target.value as PreventiveEventType })}
                    className="flex h-11 w-full rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {TYPES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`roadmap-notes-${index}`}>Notas (opcional)</Label>
                  <Textarea
                    id={`roadmap-notes-${index}`}
                    value={row.notes}
                    onChange={(e) => update(index, { notes: e.target.value })}
                    rows={2}
                  />
                </div>
                {row.error && <p className="text-sm text-destructive">{row.error}</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void accept(index)} disabled={row.saving} className="gap-1.5">
                    <CalendarCheck className="size-4" /> {row.saving ? 'Guardando…' : 'Guardar y agendar'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => update(index, { editing: false, error: null })}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{row.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {PREVENTIVE_EVENT_TYPE_LABELS[row.type]} ·{' '}
                    {new Date(`${row.due_date}T00:00:00`).toLocaleDateString('es-CO')}
                  </p>
                  {row.item.notes && <p className="mt-1 text-xs text-muted-foreground">{row.item.notes}</p>}
                </div>
                {row.error && <p className="text-sm text-destructive">{row.error}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void accept(index)} disabled={row.saving} className="gap-1.5">
                    <CalendarPlus className="size-4" /> {row.saving ? 'Agendando…' : 'Aceptar y agendar'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => update(index, { editing: true })} className="gap-1.5">
                    <Pencil className="size-4" /> Modificar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => dismiss(index)} className="gap-1.5">
                    <X className="size-4" /> Solo tenerla en cuenta
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
