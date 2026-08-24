'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FORUM_CATEGORY_LABELS, type ForumPost } from '@petapp/shared';
import { deleteForumPost } from '@/app/panel/(dashboard)/foro/actions';
import { ForumPostForm } from './forum-post-form';

export function ForumPostRow({ post }: { post: ForumPost }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="py-4">
        <ForumPostForm post={post} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div>
        <Badge variant="secondary" className="mb-1">
          {FORUM_CATEGORY_LABELS[post.category]}
        </Badge>
        <p className="font-medium text-foreground">{post.title}</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{post.body}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label={`Editar ${post.title}`} onClick={() => setEditing(true)}>
          <Pencil className="size-4" />
        </Button>
        <form action={deleteForumPost}>
          <input type="hidden" name="id" value={post.id} />
          <Button type="submit" variant="ghost" size="icon" aria-label={`Eliminar ${post.title}`}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </form>
      </div>
    </li>
  );
}
