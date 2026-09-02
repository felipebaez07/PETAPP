import { notFound } from 'next/navigation';
import { CalendarHeart, FileStack, ShieldCheck, Syringe } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RevealItem } from '@/components/motion/reveal-item';
import { AddPreventiveEventPanel } from '@/components/cuidador/add-preventive-event-panel';
import { PreventiveEventRow } from '@/components/cuidador/preventive-event-row';
import { AddDocumentPanel } from '@/components/cuidador/add-document-panel';
import { DocumentRow } from '@/components/cuidador/document-row';
import { SPECIES_LABELS, type PetWithDetails } from '@petapp/shared';

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null; // el layout ya redirige

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('pets')
    .select('*, preventive_events(*), documents:pet_documents(*)')
    .eq('id', id)
    .eq('owner_id', user.profile.id)
    .maybeSingle();

  if (!data) notFound();
  const pet = data as unknown as PetWithDetails;

  const sortedEvents = [...pet.preventive_events].sort((a, b) => {
    if (Boolean(a.completed_at) !== Boolean(b.completed_at)) return a.completed_at ? 1 : -1;
    return a.due_date.localeCompare(b.due_date);
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{pet.name}</h1>
          <p className="text-sm text-muted-foreground">
            {SPECIES_LABELS[pet.species]}
            {pet.breed ? ` · ${pet.breed}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pet.vaccinated && (
            <Badge variant="success">
              <Syringe className="size-3.5" /> Vacunas al día
            </Badge>
          )}
          {pet.sterilized && (
            <Badge variant="outline">
              <ShieldCheck className="size-3.5" /> Esterilizado/a
            </Badge>
          )}
        </div>
      </div>

      {pet.notes && (
        <Card className="mb-6">
          <CardContent className="p-4 text-sm text-foreground/90">{pet.notes}</CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Calendario preventivo</CardTitle>
          <CardDescription>Vacunas, controles y desparasitación de {pet.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddPreventiveEventPanel petId={pet.id} />
          {sortedEvents.length === 0 ? (
            <EmptyState
              icon={<CalendarHeart className="size-8 text-secondary" aria-hidden />}
              title="Todavía no hay nada programado"
              description="Agrega la próxima vacuna o control para que no se te pase la fecha."
            />
          ) : (
            <ul>
              {sortedEvents.map((event, index) => (
                <RevealItem key={event.id} index={index} as="li">
                  <PreventiveEventRow event={event} petId={pet.id} />
                </RevealItem>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
          <CardDescription>Carné de vacunación, historia clínica y otros soportes.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddDocumentPanel petId={pet.id} />
          {pet.documents.length === 0 ? (
            <EmptyState
              icon={<FileStack className="size-8 text-secondary" aria-hidden />}
              title="Sin documentos guardados"
              description="Guarda el enlace de su carné de vacunación o historia clínica para tenerlo a mano."
            />
          ) : (
            <ul>
              {pet.documents.map((document, index) => (
                <RevealItem key={document.id} index={index} as="li">
                  <DocumentRow document={document} petId={pet.id} />
                </RevealItem>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card/50 py-8 text-center">
      {icon}
      <p className="font-medium text-foreground">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
