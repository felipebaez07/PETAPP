'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FORUM_CATEGORY_LABELS, type ForumPost, type ForumPostCategory } from '@petapp/shared';
import { addForumPost, updateForumPost } from '@/app/panel/(dashboard)/foro/actions';

const CATEGORY_OPTIONS = Object.entries(FORUM_CATEGORY_LABELS) as [ForumPostCategory, string][];

export function ForumPostForm({ post, onDone }: { post?: ForumPost; onDone?: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = post ? await updateForumPost(post.id, formData) : await addForumPost(formData);
    if (result.ok) {
      setStatus('idle');
      router.refresh();
      if (post) {
        onDone?.();
      } else {
        form.reset();
      }
    } else {
      setErrorMessage(result.error ?? 'No se pudo publicar.');
      setStatus('error');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" defaultValue={post?.title} placeholder="Ej. 20% de descuento esta semana" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category">Categoría</Label>
        <select
          id="category"
          name="category"
          defaultValue={post?.category ?? 'anuncio'}
          className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          {CATEGORY_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="body">Contenido</Label>
        <Textarea id="body" name="body" defaultValue={post?.body} rows={4} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="image_url">URL de imagen (opcional)</Label>
        <Input id="image_url" name="image_url" type="url" defaultValue={post?.image_url ?? ''} placeholder="https://..." />
      </div>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Publicando…' : post ? 'Guardar cambios' : 'Publicar'}
        </Button>
        {post && onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
