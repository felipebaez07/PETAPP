import Link from 'next/link';
import { PawPrint } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ADOPTION_STATUS_LABELS, SPECIES_LABELS, type AdoptionPostWithPhotos } from '@petapp/shared';

export function AdoptionCard({ post }: { post: AdoptionPostWithPhotos }) {
  return (
    <Link href={`/adopciones/${post.id}`} className="block group">
      <Card className="h-full overflow-hidden group-hover:shadow-md group-hover:-translate-y-0.5">
        <div className="flex h-36 items-center justify-center bg-background-alt text-secondary">
          <PawPrint className="size-12" strokeWidth={1.5} />
        </div>
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-base font-semibold text-foreground">{post.animal_name}</h3>
            <Badge variant="accent">{ADOPTION_STATUS_LABELS[post.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {SPECIES_LABELS[post.species]} · {post.estimated_age ?? 'Edad no especificada'}
          </p>
          {post.establishment && (
            <p className="text-xs text-muted-foreground">Publicado por {post.establishment.name}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
