import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PlusCircle, Search, Stethoscope } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RevealItem } from '@/components/motion/reveal-item';
import { SPECIES_LABELS, type ClinicalPatient } from '@petapp/shared';

interface ClinicalPatientRow extends ClinicalPatient {
  pet: { name: string; owner: { full_name: string } | null } | null;
}

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user?.establishment) redirect('/panel');

  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  const supabase = await createSupabaseServerClient();
  let request = supabase
    .from('clinical_patients')
    .select('*, pet:pets(name, owner:profiles(full_name))')
    .eq('establishment_id', user.establishment.id)
    .order('updated_at', { ascending: false });

  // Nota: este filtro solo busca en el nombre del paciente y en owner_full_name (dueño de un
  // paciente walk-in, sin cuenta) — no alcanza el nombre del dueño real cuando el paciente está
  // vinculado a una mascota registrada, porque ese nombre vive en `profiles` a través de un join
  // y `.or()` no puede filtrar sobre una columna de otra tabla en la misma llamada. Limitación
  // aceptada para no complicar esto con una segunda consulta o una vista — ver la descripción de
  // esta tarea.
  if (query) {
    request = request.or(`name.ilike.%${query}%,owner_full_name.ilike.%${query}%`);
  }

  const { data } = await request;
  const patients = (data ?? []) as unknown as ClinicalPatientRow[];

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Historia clínica de los pacientes de tu establecimiento.</p>
        </div>
        <Button asChild>
          <Link href="/panel/pacientes/nuevo">
            <PlusCircle className="size-4" /> Nuevo paciente
          </Link>
        </Button>
      </div>

      <form method="get" className="relative mb-6">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por nombre del paciente o del dueño…"
          className="pl-9"
          aria-label="Buscar pacientes"
        />
      </form>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Stethoscope className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium text-foreground">
              {query ? 'Sin resultados para esa búsqueda.' : 'Aún no has registrado pacientes.'}
            </p>
            {!query && (
              <p className="max-w-sm text-sm text-muted-foreground">
                Crea la ficha de tu primer paciente para empezar a llevar su historia clínica.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {patients.map((patient, index) => {
            const ownerName = patient.pet?.owner?.full_name ?? patient.owner_full_name ?? 'Sin dueño registrado';
            return (
              <RevealItem key={patient.id} index={index}>
                <Link href={`/panel/pacientes/${patient.id}`}>
                  <Card>
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-heading text-sm font-semibold text-foreground">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {SPECIES_LABELS[patient.species]}
                          {patient.breed ? ` · ${patient.breed}` : ''}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{ownerName}</p>
                    </CardContent>
                  </Card>
                </Link>
              </RevealItem>
            );
          })}
        </div>
      )}
    </div>
  );
}
