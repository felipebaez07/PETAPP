import Link from 'next/link';
import { Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FORUM_CATEGORY_LABELS, type ForumPostWithEstablishment } from '@petapp/shared';

export function ForumPostCard({ post }: { post: ForumPostWithEstablishment }) {
  const date = new Date(post.created_at).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{FORUM_CATEGORY_LABELS[post.category]}</Badge>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        <h3 className="font-heading text-base font-semibold leading-snug text-foreground">{post.title}</h3>
        <p className="flex-1 text-sm text-muted-foreground line-clamp-4">{post.body}</p>
        {post.establishment && (
          <Link
            href={`/establecimientos/${post.establishment.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Store className="size-3.5" />
            {post.establishment.name}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
