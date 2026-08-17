import { isOpenNow, type EstablishmentHours } from '@petapp/shared';
import { cn } from '@/lib/utils';

export function OpenStatus({ hours, is24h }: { hours: EstablishmentHours[]; is24h: boolean }) {
  const open = isOpenNow(hours, is24h);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
      <span
        className={cn('inline-block size-2 rounded-full', open ? 'bg-success' : 'bg-muted-foreground')}
        aria-hidden
      />
      <span className={open ? 'text-success' : 'text-muted-foreground'}>
        {is24h ? 'Abierto 24/7' : open ? 'Abierto ahora' : 'Cerrado ahora'}
      </span>
    </span>
  );
}
