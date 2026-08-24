import { getForumPosts } from '@/lib/data';
import { ForumFilterBar } from '@/components/foro/forum-filter-bar';
import { ForumPostCard } from '@/components/foro/forum-post-card';
import { APP_NAME, PILOT_CITY, type ForumPostCategory } from '@petapp/shared';

export default async function ForoPublicPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const params = await searchParams;
  const posts = await getForumPosts({ category: params.categoria as ForumPostCategory | undefined });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Foro</h1>
        <p className="mt-3 text-muted-foreground">
          Promociones, anuncios, noticias y lugares que comparten los aliados de {APP_NAME} en {PILOT_CITY}.
        </p>
      </div>

      <ForumFilterBar />

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {posts.length} {posts.length === 1 ? 'publicación' : 'publicaciones'}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-border p-10 text-center">
          <p className="font-heading text-lg font-semibold text-foreground">Todavía no hay publicaciones</p>
          <p className="mt-1 text-sm text-muted-foreground">Los aliados irán compartiendo novedades aquí.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <ForumPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
