import { notFound } from 'next/navigation';
import { PawPrint, MapPin, Syringe, Scissors } from 'lucide-react';
import { getAdoptionPostById } from '@/lib/data';
import { AdoptionInterestForm } from '@/components/adopciones/adoption-interest-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ADOPTION_STATUS_LABELS, SPECIES_LABELS } from '@petapp/shared';

export default async function AdoptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getAdoptionPostById(id);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 sm:grid-cols-5">
        <div className="sm:col-span-2">
          <div className="flex h-64 items-center justify-center rounded-md bg-background-alt text-secondary">
            <PawPrint className="size-20" strokeWidth={1.5} />
          </div>
        </div>

        <div className="sm:col-span-3">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="accent">{ADOPTION_STATUS_LABELS[post.status]}</Badge>
            <Badge variant="secondary">{SPECIES_LABELS[post.species]}</Badge>
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">{post.animal_name}</h1>
          <p className="mt-1 text-muted-foreground">{post.estimated_age ?? 'Edad no especificada'}</p>
          {post.location_text && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" /> {post.location_text}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {post.sterilized && (
              <Badge variant="outline">
                <Scissors className="size-3.5" /> Esterilizado/a
              </Badge>
            )}
            {post.vaccinated && (
              <Badge variant="outline">
                <Syringe className="size-3.5" /> Vacunado/a
              </Badge>
            )}
          </div>

          {post.establishment && (
            <p className="mt-4 text-sm text-muted-foreground">Publicado por {post.establishment.name}</p>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {(post.health_notes || post.personality_notes) && (
          <Card>
            <CardHeader>
              <CardTitle>Sobre {post.animal_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {post.health_notes && (
                <div>
                  <p className="font-medium text-foreground">Salud</p>
                  <p className="text-muted-foreground">{post.health_notes}</p>
                </div>
              )}
              {post.personality_notes && (
                <div>
                  <p className="font-medium text-foreground">Personalidad</p>
                  <p className="text-muted-foreground">{post.personality_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Formulario de interesado/a</CardTitle>
          </CardHeader>
          <CardContent>
            <AdoptionInterestForm
              adoptionPostId={post.id}
              animalName={post.animal_name}
              whatsappNumber={post.establishment?.whatsapp_number ?? null}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
