import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PrediagnosticoChat } from '@/components/cuidador/prediagnostico-chat';
import type { AiConversation, Pet } from '@petapp/shared';

export default async function PrediagnosticoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null; // el layout ya redirige

  const supabase = await createSupabaseServerClient();
  const { data: pet } = await supabase
    .from('pets')
    .select('id, name, owner_id')
    .eq('id', id)
    .eq('owner_id', user.profile.id)
    .maybeSingle();
  if (!pet) notFound();

  // Si ya hay una conversación completada reciente, la mostramos directamente en vez de que el
  // cuidador la vuelva a hacer — no retomamos una conversación activa sin terminar (más simple
  // que reconstruir el historial de mensajes acá; el cuidador puede simplemente empezar de nuevo).
  const { data: lastConversation } = await supabase
    .from('ai_conversations')
    .select('id, status, summary, roadmap')
    .eq('pet_id', pet.id)
    .eq('status', 'completada')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/cuidador/mascotas/${pet.id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Volver a {(pet as Pick<Pet, 'id' | 'name'>).name}
      </Link>
      <h1 className="mb-1 font-heading text-2xl font-bold text-foreground">Pre-diagnóstico con IA</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Contale al asistente qué le está pasando a {pet.name}. Al final vas a tener un resumen para llevar a tu
        veterinario — esto no reemplaza una consulta profesional.
      </p>
      <PrediagnosticoChat
        petId={pet.id}
        petName={pet.name}
        initialConversation={lastConversation as AiConversation | null}
      />
    </div>
  );
}
