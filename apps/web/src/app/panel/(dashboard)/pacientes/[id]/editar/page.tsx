import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { SPECIES_LABELS, type ClinicalPatient, type PetSex, type PetSpecies } from '@petapp/shared';
import { updateClinicalPatient } from '../actions';

const SPECIES_OPTIONS = Object.entries(SPECIES_LABELS) as [PetSpecies, string][];

// Ver el mismo comentario en components/panel/clinical-patient-form.tsx: no hay un
// `constants.ts` compartido para el sexo, se mantiene local acá.
const SEX_LABELS: Record<PetSex, string> = {
  macho: 'Macho',
  hembra: 'Hembra',
  desconocido: 'Desconocido',
};
const SEX_OPTIONS = Object.entries(SEX_LABELS) as [PetSex, string][];

export default async function EditarPacientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.establishment) redirect('/panel');

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('clinical_patients')
    .select('*')
    .eq('id', id)
    .eq('establishment_id', user.establishment.id)
    .maybeSingle();

  if (!data) notFound();
  const patient = data as ClinicalPatient;

  return (
    <div className="max-w-2xl">
      <Link
        href={`/panel/pacientes/${patient.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a la ficha
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Editar {patient.name}</CardTitle>
          <CardDescription>Corrige cualquier dato que haya quedado mal la primera vez.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateClinicalPatient} className="space-y-4">
            <input type="hidden" name="id" value={patient.id} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre del paciente</Label>
                <Input id="name" name="name" defaultValue={patient.name} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="species">Especie</Label>
                <select
                  id="species"
                  name="species"
                  defaultValue={patient.species}
                  className="flex h-11 w-full rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {SPECIES_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="breed">Raza (opcional)</Label>
              <Input id="breed" name="breed" defaultValue={patient.breed ?? ''} />
            </div>

            {!patient.pet_id && (
              <div className="space-y-3 rounded-md border border-border p-3">
                <p className="text-sm font-medium text-foreground">Datos del dueño (sin cuenta en la plataforma)</p>
                <div className="space-y-1.5">
                  <Label htmlFor="owner_full_name">Nombre completo</Label>
                  <Input id="owner_full_name" name="owner_full_name" defaultValue={patient.owner_full_name ?? ''} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="owner_phone">Teléfono (opcional)</Label>
                    <Input id="owner_phone" name="owner_phone" defaultValue={patient.owner_phone ?? ''} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="owner_document">Documento (opcional)</Label>
                    <Input id="owner_document" name="owner_document" defaultValue={patient.owner_document ?? ''} />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground">Ficha clínica</p>

              <div className="space-y-1.5">
                <Label htmlFor="sex">Sexo</Label>
                <select
                  id="sex"
                  name="sex"
                  defaultValue={patient.sex}
                  className="flex h-11 w-full max-w-xs rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {SEX_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-1.5 text-sm text-muted-foreground">
                  Indica la fecha de nacimiento si la sabes, o una edad aproximada si no — no hace falta llenar ambas.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="birth_date">Fecha de nacimiento (opcional)</Label>
                    <Input id="birth_date" name="birth_date" type="date" defaultValue={patient.birth_date ?? ''} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="estimated_age_years">Edad aproximada en años (opcional)</Label>
                    <Input
                      id="estimated_age_years"
                      name="estimated_age_years"
                      type="number"
                      min="0"
                      max="60"
                      step="0.5"
                      defaultValue={patient.estimated_age_years ?? ''}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="color">Color (opcional)</Label>
                  <Input id="color" name="color" defaultValue={patient.color ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="origin_place">Lugar de procedencia (opcional)</Label>
                  <Input id="origin_place" name="origin_place" defaultValue={patient.origin_place ?? ''} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="microchip_number">Número de microchip (opcional)</Label>
                <Input id="microchip_number" name="microchip_number" defaultValue={patient.microchip_number ?? ''} />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="sterilized" name="sterilized" defaultChecked={patient.sterilized} />
                <Label htmlFor="sterilized" className="cursor-pointer">
                  Esterilizado/a
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="allergies">Alergias (opcional)</Label>
                <Textarea id="allergies" name="allergies" rows={2} defaultValue={patient.allergies ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="chronic_conditions">Condiciones crónicas (opcional)</Label>
                <Textarea
                  id="chronic_conditions"
                  name="chronic_conditions"
                  rows={2}
                  defaultValue={patient.chronic_conditions ?? ''}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea id="notes" name="notes" rows={2} defaultValue={patient.notes ?? ''} />
              </div>
            </div>

            <Button type="submit">Guardar cambios</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
