'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BellOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  GROOMING_SERVICE_TYPES,
  PREVENTIVE_EVENT_TYPE_LABELS,
  type PetServiceMute,
  type PetServiceRecurrence,
  type PreventiveEventType,
} from '@petapp/shared';
import {
  muteEstablishment,
  mutePetService,
  unmuteEstablishment,
  unmutePetService,
  upsertPetServiceRecurrence,
} from '@/app/cuidador/mascotas/[id]/actions';

type GroomingType = (typeof GROOMING_SERVICE_TYPES)[number];

interface VisitedEstablishment {
  id: string;
  name: string;
}

/**
 * "Servicios recurrentes" — extensión del calendario preventivo para los 5 tipos de
 * estética/cuidado (0025_recurring_services.sql). Solo muestra `GROOMING_SERVICE_TYPES`: las
 * vacunas/control/desparasitación/otro ya viven arriba, en "Calendario preventivo" — duplicarlas
 * acá confundiría cuál sección es la fuente de verdad.
 */
export function PetServiceRecurrencesSection({
  petId,
  recurrences,
  mutes,
  visitedEstablishments,
}: {
  petId: string;
  recurrences: PetServiceRecurrence[];
  mutes: PetServiceMute[];
  visitedEstablishments: VisitedEstablishment[];
}) {
  const serviceMutes = mutes.filter((m) => m.scope === 'service');
  const establishmentMutes = mutes.filter((m) => m.scope === 'establishment');
  const mutedEstablishmentIds = new Set(establishmentMutes.map((m) => m.establishment_id));
  const availableEstablishments = visitedEstablishments.filter((e) => !mutedEstablishmentIds.has(e.id));

  return (
    <div className="space-y-4">
      <ul>
        {GROOMING_SERVICE_TYPES.map((type) => {
          const recurrence = recurrences.find((r) => r.service_type === type);
          const mute = serviceMutes.find((m) => m.service_type === type);
          return (
            <li key={type} className="border-b border-border py-3 last:border-0">
              <ServiceRecurrenceRow petId={petId} type={type} recurrence={recurrence} mute={mute} />
            </li>
          );
        })}
      </ul>

      <div className="rounded-lg border border-dashed border-border p-4">
        <p className="font-heading text-sm font-semibold text-foreground">Establecimientos silenciados</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Silencia TODOS los recordatorios de una clínica puntual, sin tocar los demás.
        </p>

        {establishmentMutes.length > 0 && (
          <ul className="mt-3 space-y-2">
            {establishmentMutes.map((mute) => (
              <EstablishmentMuteRow
                key={mute.id}
                petId={petId}
                mute={mute}
                name={visitedEstablishments.find((e) => e.id === mute.establishment_id)?.name ?? 'Establecimiento'}
              />
            ))}
          </ul>
        )}

        {availableEstablishments.length > 0 && (
          <MuteEstablishmentForm petId={petId} establishments={availableEstablishments} />
        )}

        {establishmentMutes.length === 0 && availableEstablishments.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Todavía no tienes citas confirmadas o completadas con ningún establecimiento.
          </p>
        )}
      </div>
    </div>
  );
}

function ServiceRecurrenceRow({
  petId,
  type,
  recurrence,
  mute,
}: {
  petId: string;
  type: GroomingType;
  recurrence: PetServiceRecurrence | undefined;
  mute: PetServiceMute | undefined;
}) {
  const router = useRouter();
  const [intervalWeeks, setIntervalWeeks] = useState(recurrence?.interval_weeks?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [muting, setMuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    const trimmed = intervalWeeks.trim();
    const result = await upsertPetServiceRecurrence(petId, {
      pet_id: petId,
      service_type: type as PreventiveEventType,
      interval_weeks: trimmed ? Number(trimmed) : undefined,
      active: true,
    });
    setSaving(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error ?? 'No se pudo guardar la frecuencia.');
    }
  };

  const onMute = async () => {
    setMuting(true);
    setError(null);
    const result = await mutePetService(petId, type as PreventiveEventType);
    setMuting(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error ?? 'No se pudo silenciar este servicio.');
    }
  };

  const onUnmute = async () => {
    if (!mute) return;
    setMuting(true);
    setError(null);
    const result = await unmutePetService(mute.id, petId);
    setMuting(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error ?? 'No se pudo reactivar este servicio.');
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="min-w-32 font-medium text-foreground">{PREVENTIVE_EVENT_TYPE_LABELS[type]}</p>

      {mute ? (
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <BellOff className="size-3.5" /> Silenciado
          </Badge>
          <Button type="button" variant="ghost" size="sm" disabled={muting} onClick={onUnmute}>
            {muting ? 'Reactivando…' : 'Reactivar'}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor={`interval-${type}`} className="sr-only">
            Cada cuántas semanas
          </Label>
          <Input
            id={`interval-${type}`}
            type="number"
            min={1}
            max={104}
            placeholder="Semanas"
            value={intervalWeeks}
            onChange={(e) => setIntervalWeeks(e.target.value)}
            className="w-24"
          />
          <Button type="button" size="sm" variant="outline" disabled={saving} onClick={onSave}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : 'Guardar'}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={muting} onClick={onMute} className="text-muted-foreground">
            Silenciar este servicio
          </Button>
        </div>
      )}

      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}

function EstablishmentMuteRow({ petId, mute, name }: { petId: string; mute: PetServiceMute; name: string }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUnmute = async () => {
    setRemoving(true);
    setError(null);
    const result = await unmuteEstablishment(mute.id, petId);
    setRemoving(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error ?? 'No se pudo quitar el silencio.');
    }
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-2">
        <BellOff className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-foreground">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" disabled={removing} onClick={onUnmute}>
          {removing ? 'Quitando…' : 'Quitar silencio'}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </li>
  );
}

function MuteEstablishmentForm({ petId, establishments }: { petId: string; establishments: VisitedEstablishment[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(establishments[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const result = await muteEstablishment(petId, selected);
    setSaving(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error ?? 'No se pudo silenciar este establecimiento.');
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="flex h-9 rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {establishments.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      <Button type="button" variant="outline" size="sm" disabled={saving} onClick={onSubmit}>
        {saving ? 'Silenciando…' : 'Silenciar establecimiento'}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}
