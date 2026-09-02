import { PawPrint } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AddPetPanel } from '@/components/cuidador/add-pet-panel';
import { PetCard } from '@/components/cuidador/pet-card';
import { RevealItem } from '@/components/motion/reveal-item';
import type { Pet } from '@petapp/shared';

interface PetRow extends Pet {
  preventive_events: { id: string; completed_at: string | null }[];
}

export default async function MascotasPage() {
  const user = await getCurrentUser();
  if (!user) return null; // el layout ya redirige

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('pets')
    .select('*, preventive_events(id, completed_at)')
    .eq('owner_id', user.profile.id)
    .order('name');

  const pets = (data ?? []) as unknown as PetRow[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Tus mascotas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perfil, calendario preventivo y documentos de cada una, en un solo lugar.
        </p>
      </div>

      <AddPetPanel ownerId={user.profile.id} />

      {pets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <PawPrint className="size-10 text-secondary" aria-hidden />
          <p className="font-heading text-lg font-semibold text-foreground">Todavía no tienes mascotas aquí</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Agrega tu primera mascota para empezar su calendario preventivo — vacunas, controles y desparasitación,
            con recordatorios y documentos guardados en un espacio seguro.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pets.map((pet, index) => (
            <RevealItem key={pet.id} index={index}>
              <PetCard pet={pet} pendingCount={pet.preventive_events.filter((e) => !e.completed_at).length} />
            </RevealItem>
          ))}
        </div>
      )}
    </div>
  );
}
