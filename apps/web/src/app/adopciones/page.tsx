import { getAdoptionPosts } from '@/lib/data';
import { AdoptionCard } from '@/components/adopciones/adoption-card';

export default async function AdoptionsPage() {
  const posts = await getAdoptionPosts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-foreground">Adopciones responsables</h1>
        <p className="mt-3 text-muted-foreground">
          Animales publicados por fundaciones y rescatistas aliados en Ibagué. Cada perfil incluye estado de salud y
          personalidad para una adopción informada.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-10 text-center">
          <p className="font-heading text-lg font-semibold text-foreground">Aún no hay publicaciones</p>
          <p className="mt-1 text-sm text-muted-foreground">Vuelve pronto o contáctanos si representas una fundación.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((post) => (
            <AdoptionCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
