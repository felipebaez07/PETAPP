import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CalendarHeart, FileStack, PawPrint, Pencil, ShieldCheck, Sparkles, Stethoscope, Syringe } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RemoteImage } from '@/components/ui/remote-image';
import { RevealItem } from '@/components/motion/reveal-item';
import { AddPreventiveEventPanel } from '@/components/cuidador/add-preventive-event-panel';
import { PreventiveEventRow } from '@/components/cuidador/preventive-event-row';
import { AddDocumentPanel } from '@/components/cuidador/add-document-panel';
import { DocumentRow } from '@/components/cuidador/document-row';
import { ClinicalDocumentItem } from '@/components/cuidador/clinical-document-item';
import { DeletePetButton } from '@/components/cuidador/delete-pet-button';
import {
  CLINICAL_DOCUMENT_TYPE_LABELS,
  SPECIES_LABELS,
  type AiConversation,
  type ClinicalDocument,
  type PetWithDetails,
  type VetVisitNote,
} from '@petapp/shared';

const DOCUMENT_TYPE_OPTIONS = Object.entries(CLINICAL_DOCUMENT_TYPE_LABELS) as [
  ClinicalDocument['document_type'],
  string,
][];

export default async function PetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { id } = await params;
  const { tipo } = await searchParams;
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

  // Cierra el círculo del pre-diagnóstico (idea explícita del usuario): un timeline único que
  // mezcla los resúmenes de pre-diagnósticos completados con lo que el cuidador fue contando que
  // dijo/hizo el veterinario en cada cita real — el mismo historial combinado que el backend de
  // IA (route.ts) ya usa como contexto en la próxima consulta, ahora visible acá.
  const [{ data: vetVisitNotesData }, { data: pastConversationsData }] = await Promise.all([
    supabase.from('vet_visit_notes').select('*').eq('pet_id', pet.id).order('created_at', { ascending: false }),
    supabase
      .from('ai_conversations')
      .select('id, summary, created_at')
      .eq('pet_id', pet.id)
      .eq('status', 'completada')
      .not('summary', 'is', null)
      .order('created_at', { ascending: false }),
  ]);
  const vetVisitNotes = (vetVisitNotesData as VetVisitNote[] | null) ?? [];
  const pastConversations = (pastConversationsData as Pick<AiConversation, 'id' | 'summary' | 'created_at'>[] | null) ?? [];

  // Documentos para firma (0019_clinical_documents.sql) redactados por el establecimiento —
  // llegan por `clinical_patients.pet_id`, no hay una FK directa de `clinical_documents` a `pets`.
  // `!inner` en el embed obliga a PostgREST a filtrar las filas de `clinical_documents` por
  // `clinical_patient.pet_id` (sin `!inner` solo filtraría el contenido embebido, devolviendo TODOS
  // los documentos de TODOS los pacientes) — mismo patrón ya usado en
  // panel/pacientes/nuevo/actions.ts para buscar por dueño.
  const { data: clinicalDocumentsData } = await supabase
    .from('clinical_documents')
    .select('*, clinical_patient:clinical_patients!inner(pet_id)')
    .eq('clinical_patient.pet_id', pet.id)
    .is('archived_by_owner_at', null)
    .order('created_at', { ascending: false });
  const clinicalDocuments = (clinicalDocumentsData as unknown as ClinicalDocument[] | null) ?? [];
  const activeDocumentType =
    tipo && Object.prototype.hasOwnProperty.call(CLINICAL_DOCUMENT_TYPE_LABELS, tipo)
      ? (tipo as ClinicalDocument['document_type'])
      : null;
  const filteredClinicalDocuments = activeDocumentType
    ? clinicalDocuments.filter((doc) => doc.document_type === activeDocumentType)
    : clinicalDocuments;

  interface TimelineEntry {
    key: string;
    date: string;
    kind: 'resumen' | 'veterinario';
    text: string;
  }
  const timeline: TimelineEntry[] = [
    ...pastConversations.map((c) => ({ key: `c-${c.id}`, date: c.created_at, kind: 'resumen' as const, text: c.summary! })),
    ...vetVisitNotes.map((n) => ({ key: `n-${n.id}`, date: n.created_at, kind: 'veterinario' as const, text: n.note })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <RemoteImage
            src={pet.photo_url}
            size={64}
            icon={<PawPrint className="size-8 text-secondary" aria-hidden />}
            alt={pet.name}
          />
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{pet.name}</h1>
            <p className="text-sm text-muted-foreground">
              {SPECIES_LABELS[pet.species]}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
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
        </div>
        <div className="flex items-start gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/cuidador/mascotas/${pet.id}/editar`}>
              <Pencil className="size-4" /> Editar
            </Link>
          </Button>
          <DeletePetButton petId={pet.id} petName={pet.name} />
        </div>
      </div>

      {pet.notes && (
        <Card className="mb-6">
          <CardContent className="p-4 text-sm text-foreground/90">{pet.notes}</CardContent>
        </Card>
      )}

      <Card className="mb-6 border-secondary/30 bg-secondary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary/15">
              <Sparkles className="size-5 text-secondary" aria-hidden />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">Pre-diagnóstico con IA</p>
              <p className="text-sm text-muted-foreground">
                Cuéntale a nuestro asistente qué le pasa a {pet.name} y arma un resumen para tu veterinario.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/cuidador/mascotas/${pet.id}/prediagnostico`}>Empezar</Link>
          </Button>
        </CardContent>
      </Card>

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

      {timeline.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Historial de seguimiento</CardTitle>
            <CardDescription>
              Pre-diagnósticos con IA y lo que fuiste contando después de cada cita real — el asistente ya
              tiene esto en cuenta en las próximas consultas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 divide-y divide-border">
              {timeline.map((entry, index) => (
                <RevealItem key={entry.key} index={index} as="li">
                  <div className="flex items-start gap-2.5 pt-3 first:pt-0">
                    {entry.kind === 'veterinario' ? (
                      <Stethoscope className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
                    ) : (
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {' · '}
                        {entry.kind === 'veterinario' ? 'Lo que dijo el veterinario' : 'Resumen del asistente de IA'}
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-foreground/90">{entry.text}</p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
          <CardDescription>Carné de vacunación, historia clínica y otros soportes.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddDocumentPanel petId={pet.id} ownerId={user.profile.id} />
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

      {clinicalDocuments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Documentos para firma</CardTitle>
            <CardDescription>
              Consentimientos, remisiones, órdenes y fórmulas de {pet.name} — firmar acá es solo escribir tu
              nombre y aceptar, no reemplaza una firma electrónica con validez legal plena.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clinicalDocuments.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                <Link href={`/cuidador/mascotas/${pet.id}`}>
                  <Badge variant={!activeDocumentType ? 'secondary' : 'outline'} className="cursor-pointer">
                    Todos ({clinicalDocuments.length})
                  </Badge>
                </Link>
                {DOCUMENT_TYPE_OPTIONS.map(([value, label]) => {
                  const count = clinicalDocuments.filter((doc) => doc.document_type === value).length;
                  if (count === 0) return null;
                  return (
                    <Link key={value} href={`/cuidador/mascotas/${pet.id}?tipo=${value}`}>
                      <Badge variant={activeDocumentType === value ? 'secondary' : 'outline'} className="cursor-pointer">
                        {label} ({count})
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
            {filteredClinicalDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay documentos de este tipo.</p>
            ) : (
              <ul>
                {filteredClinicalDocuments.map((document, index) => (
                  <RevealItem key={document.id} index={index} as="li">
                    <ClinicalDocumentItem doc={document} defaultSignerName={user.profile.full_name} />
                  </RevealItem>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
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
