'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DAY_LABELS, type EstablishmentHours } from '@petapp/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { updateHours, type DayInput } from '@/app/panel/(dashboard)/horarios/actions';

function buildInitialDays(hours: EstablishmentHours[]): DayInput[] {
  return Array.from({ length: 7 }, (_, day_of_week) => {
    const existing = hours.find((h) => h.day_of_week === day_of_week);
    return {
      day_of_week,
      open_time: existing?.open_time?.slice(0, 5) ?? '08:00',
      close_time: existing?.close_time?.slice(0, 5) ?? '18:00',
      closed: existing?.closed ?? false,
    };
  });
}

export function HoursForm({ hours, is24h: initialIs24h }: { hours: EstablishmentHours[]; is24h: boolean }) {
  const router = useRouter();
  const [days, setDays] = useState<DayInput[]>(buildInitialDays(hours));
  const [is24h, setIs24h] = useState(initialIs24h);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const updateDay = (index: number, patch: Partial<DayInput>) => {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    const result = await updateHours(days, is24h);
    setStatus(result.ok ? 'saved' : 'error');
    if (result.ok) router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Checkbox id="is_24_7" checked={is24h} onCheckedChange={(v) => setIs24h(Boolean(v))} />
        <Label htmlFor="is_24_7" className="cursor-pointer text-sm font-medium">
          Atendemos las 24 horas, todos los días
        </Label>
      </div>
      {is24h ? (
        <p className="text-sm text-muted-foreground">
          Con esto activado no hace falta definir horarios por día — el directorio ya te muestra como
          &quot;Abierto 24/7&quot;.
        </p>
      ) : (
        days.map((day, index) => (
        <div key={day.day_of_week} className="flex flex-wrap items-center gap-3 border-b border-border pb-3 last:border-0">
          <span className="w-24 shrink-0 text-sm font-medium text-foreground">{DAY_LABELS[day.day_of_week]}</span>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`closed-${day.day_of_week}`}
              checked={day.closed}
              onCheckedChange={(v) => updateDay(index, { closed: Boolean(v) })}
            />
            <Label htmlFor={`closed-${day.day_of_week}`} className="cursor-pointer text-sm">
              Cerrado
            </Label>
          </div>
          {!day.closed && (
            <div className="flex items-center gap-2 text-sm">
              <input
                type="time"
                value={day.open_time ?? ''}
                onChange={(e) => updateDay(index, { open_time: e.target.value })}
                className="rounded-sm border border-input bg-card px-2 py-1"
              />
              <span className="text-muted-foreground">a</span>
              <input
                type="time"
                value={day.close_time ?? ''}
                onChange={(e) => updateDay(index, { close_time: e.target.value })}
                className="rounded-sm border border-input bg-card px-2 py-1"
              />
            </div>
          )}
        </div>
        ))
      )}
      {status === 'error' && <p className="text-sm text-destructive">No se pudo guardar. Intenta de nuevo.</p>}
      {status === 'saved' && <p className="text-sm text-success">Horarios actualizados.</p>}
      <Button type="submit" disabled={status === 'saving'}>
        {status === 'saving' ? 'Guardando…' : 'Guardar horarios'}
      </Button>
    </form>
  );
}
