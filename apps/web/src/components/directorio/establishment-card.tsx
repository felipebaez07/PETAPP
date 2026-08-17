import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from './verified-badge';
import { OpenStatus } from './open-status';
import { CATEGORY_LABELS, type EstablishmentWithDetails } from '@petapp/shared';

export function EstablishmentCard({ establishment }: { establishment: EstablishmentWithDetails }) {
  return (
    <Link href={`/establecimientos/${establishment.slug}`} className="block group">
      <Card className="h-full group-hover:shadow-md group-hover:-translate-y-0.5">
        <CardContent className="p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Badge variant="secondary">{CATEGORY_LABELS[establishment.category]}</Badge>
            </div>
            <VerifiedBadge status={establishment.verification_status} />
          </div>
          <h3 className="font-heading text-base font-semibold leading-snug text-foreground">
            {establishment.name}
          </h3>
          {establishment.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{establishment.description}</p>
          )}
          <div className="flex items-center justify-between pt-1 text-sm">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <MapPin className="size-3.5" />
              {establishment.address ?? establishment.city}
            </span>
            <OpenStatus hours={establishment.hours} is24h={establishment.is_24_7} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
