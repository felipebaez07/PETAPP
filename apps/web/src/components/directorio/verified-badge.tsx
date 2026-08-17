import { BadgeCheck, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { VerificationStatus } from '@petapp/shared';
import { VERIFICATION_LABELS } from '@petapp/shared';

export function VerifiedBadge({ status }: { status: VerificationStatus }) {
  if (status === 'verificado') {
    return (
      <Badge variant="success">
        <BadgeCheck className="size-3.5" />
        {VERIFICATION_LABELS[status]}
      </Badge>
    );
  }
  if (status === 'pendiente' || status === 'en_revision') {
    return (
      <Badge variant="outline">
        <Clock className="size-3.5" />
        {VERIFICATION_LABELS[status]}
      </Badge>
    );
  }
  return null;
}
