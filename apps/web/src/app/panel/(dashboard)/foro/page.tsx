import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ForumPostForm } from '@/components/panel/forum-post-form';
import { ForumPostRow } from '@/components/panel/forum-post-row';
import type { ForumPost } from '@petapp/shared';

export default async function ForoPage() {
  const user = await getCurrentUser();
  if (!user?.establishment) redirect('/panel');

  const supabase = await createSupabaseServerClient();
  const { data: posts } = await supabase
    .from('forum_posts')
    .select('*')
    .eq('establishment_id', user.establishment.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Foro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Publica promociones, anuncios, noticias o lugares para que los propietarios de mascotas los vean
          en el foro público. Se publica al instante — puedes editar o borrar cuando quieras.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva publicación</CardTitle>
        </CardHeader>
        <CardContent>
          <ForumPostForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tus publicaciones ({posts?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!posts || posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no has publicado nada en el foro.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(posts as ForumPost[]).map((post) => (
                <ForumPostRow key={post.id} post={post} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
