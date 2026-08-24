import { DAY_LABELS, type EstablishmentHours } from '@petapp/shared';
import { cn } from '@/lib/utils';

export function HoursTable({ hours, is24h }: { hours: EstablishmentHours[]; is24h: boolean }) {
  if (is24h) {
    return <p className="text-sm font-medium text-success">Abierto todos los días, las 24 horas.</p>;
  }

  if (hours.length === 0) {
    return <p className="text-sm text-muted-foreground">Este aliado todavía no ha publicado su horario.</p>;
  }

  const today = new Date().getDay();
  const sorted = [...hours].sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <ul className="divide-y divide-border">
      {sorted.map((h) => (
        <li
          key={h.id}
          className={cn(
            'flex items-center justify-between py-2 text-sm',
            h.day_of_week === today && 'font-semibold text-foreground'
          )}
        >
          <span>{DAY_LABELS[h.day_of_week]}</span>
          <span className="text-muted-foreground">
            {h.closed || !h.open_time || !h.close_time ? 'Cerrado' : `${h.open_time.slice(0, 5)} – ${h.close_time.slice(0, 5)}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
