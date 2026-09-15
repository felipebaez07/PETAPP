import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AlertTriangle, PawPrint, Pencil, Stethoscope } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RevealItem } from '@/components/motion/reveal-item';
import { DeletePatientButton } from '@/components/panel/delete-patient-button';
import { SPECIES_LABELS, type ClinicalPatient, type ClinicalRecord, type PetSex } from '@petapp/shared';
import { addClinicalRecord } from './actions';

interface ClinicalPatientDetailRow extends ClinicalPatient {
  pet: { name: string; owner: { full_name: string; phone: string | null } | null } | null;
}

// Ver el mismo comentario en components/panel/clinical-patient-form.tsx: no hay un
// `constants.ts` compartido para el sexo, se mantiene local acá.
const SEX_LABELS: Record<PetSex, string> = {
  macho: 'Macho',
  hembra: 'Hembra',
  desconocido: 'Desconocido',
};

function computeAge(birthDate: string | null, estimatedAgeYears: number | null): string | null {
  if (birthDate) {
    const birth = new Date(`${birthDate}T00:00:00`);
    if (!Number.isNaN(birth.getTime())) {
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      const months = now.getMonth() - birth.getMonth();
      if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) years -= 1;
      if (years < 1) {
        const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
        return `${Math.max(totalMonths, 0)} meses`;
      }
      return `${years} años`;
    }
  }
  if (estimatedAgeYears != null) return `~${estimatedAgeYears} años (estimada)`;
  return null;
}

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

// SOAP: solo se listan acá los campos que realmente se muestran en el timeline si vienen
// llenos — los nulos/vacíos se saltan fila por fila, no se renderiza una fila vacía.
const SOAP_FIELDS: { key: keyof ClinicalRecord; label: string; format?: (value: unknown) => string }[] = [
  { key: 'subjective', label: 'Subjetivo' },
  { key: 'weight_kg', label: 'Peso', format: (v) => `${v} kg` },
  { key: 'temperature_c', label: 'Temperatura', format: (v) => `${v} °C` },
  { key: 'heart_rate_bpm', label: 'Frecuencia cardíaca', format: (v) => `${v} lpm` },
  { key: 'respiratory_rate_bpm', label: 'Frecuencia respiratoria', format: (v) => `${v} rpm` },
  { key: 'body_condition_score', label: 'Condición corporal', format: (v) => `${v}/9` },
  { key: 'physical_exam_notes', label: 'Examen físico' },
  { key: 'diagnosis', label: 'Diagnóstico' },
  { key: 'treatment_plan', label: 'Plan de tratamiento' },
  { key: 'medications', label: 'Medicamentos' },
  { key: 'vaccines_applied', label: 'Vacunas aplicadas' },
  { key: 'follow_up_date', label: 'Próximo control', format: (v) => formatDate(String(v)) },
];

export default async function PacienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.establishment) redirect('/panel');

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('clinical_patients')
    .select('*, pet:pets(name, owner:profiles(full_name,phone))')
    .eq('id', id)
    .eq('establishment_id', user.establishment.id)
    .maybeSingle();

  if (!data) notFound();
  const patient = data as unknown as ClinicalPatientDetailRow;

  const { data: recordsData } = await supabase
    .from('clinical_records')
    .select('*')
    .eq('clinical_patient_id', patient.id)
    .order('visit_date', { ascending: false })
    .order('created_at', { ascending: false });
  const records = (recordsData ?? []) as ClinicalRecord[];

  const latestWeightRecord = records.find((r) => r.weight_kg != null);
  const age = computeAge(patient.birth_date, patient.estimated_age_years);
  const hasAlert = Boolean(patient.allergies || patient.chronic_conditions);

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted">
            <PawPrint className="size-7 text-secondary" aria-hidden />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{patient.name}</h1>
            <p className="text-sm text-muted-foreground">
              {SPECIES_LABELS[patient.species]}
              {patient.breed ? ` · ${patient.breed}` : ''}
              {` · ${SEX_LABELS[patient.sex]}`}
              {age ? ` · ${age}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/panel/pacientes/${patient.id}/editar`}>
              <Pencil className="size-4" /> Editar
            </Link>
          </Button>
          <DeletePatientButton patientId={patient.id} patientName={patient.name} />
        </div>
      </div>

      {hasAlert && (
        <Card className="mb-6 border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
            <div className="space-y-1 text-sm">
              {patient.allergies && (
                <p>
                  <span className="font-semibold text-destructive">Alergias: </span>
                  <span className="text-foreground/90">{patient.allergies}</span>
                </p>
              )}
              {patient.chronic_conditions && (
                <p>
                  <span className="font-semibold text-destructive">Condiciones crónicas: </span>
                  <span className="text-foreground/90">{patient.chronic_conditions}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ficha del paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-foreground/90 sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Dueño/a: </span>
            {patient.pet?.owner?.full_name ?? patient.owner_full_name ?? 'Sin registrar'}
          </p>
          {(patient.pet?.owner?.phone ?? patient.owner_phone) && (
            <p>
              <span className="text-muted-foreground">Teléfono: </span>
              {patient.pet?.owner?.phone ?? patient.owner_phone}
            </p>
          )}
          {!patient.pet_id && patient.owner_document && (
            <p>
              <span className="text-muted-foreground">Documento: </span>
              {patient.owner_document}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Peso más reciente: </span>
            {latestWeightRecord
              ? `${latestWeightRecord.weight_kg} kg (consulta del ${formatDate(latestWeightRecord.visit_date)})`
              : 'Sin consultas registradas'}
          </p>
          {patient.color && (
            <p>
              <span className="text-muted-foreground">Color: </span>
              {patient.color}
            </p>
          )}
          {patient.origin_place && (
            <p>
              <span className="text-muted-foreground">Procedencia: </span>
              {patient.origin_place}
            </p>
          )}
          {patient.microchip_number && (
            <p>
              <span className="text-muted-foreground">Microchip: </span>
              {patient.microchip_number}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Esterilizado/a: </span>
            {patient.sterilized ? 'Sí' : 'No'}
          </p>
          {patient.notes && (
            <p className="sm:col-span-2">
              <span className="text-muted-foreground">Notas: </span>
              {patient.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Agregar consulta</CardTitle>
          <CardDescription>Formato SOAP — solo el motivo es obligatorio.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addClinicalRecord} className="space-y-4">
            <input type="hidden" name="clinical_patient_id" value={patient.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="reason">Motivo de la consulta</Label>
                <Input id="reason" name="reason" required placeholder="Ej. Control de rutina" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="visit_date">Fecha</Label>
                <Input id="visit_date" name="visit_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subjective">Subjetivo (lo que cuenta el dueño)</Label>
              <Textarea id="subjective" name="subjective" rows={2} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="weight_kg">Peso (kg)</Label>
                <Input id="weight_kg" name="weight_kg" type="number" min="0" max="500" step="0.01" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="temperature_c">Temperatura (°C)</Label>
                <Input id="temperature_c" name="temperature_c" type="number" min="20" max="45" step="0.1" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="heart_rate_bpm">Frec. cardíaca (lpm)</Label>
                <Input id="heart_rate_bpm" name="heart_rate_bpm" type="number" min="0" max="400" step="1" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="respiratory_rate_bpm">Frec. respiratoria (rpm)</Label>
                <Input id="respiratory_rate_bpm" name="respiratory_rate_bpm" type="number" min="0" max="200" step="1" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="body_condition_score">Condición corporal (1-9)</Label>
                <Input id="body_condition_score" name="body_condition_score" type="number" min="1" max="9" step="1" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="follow_up_date">Próximo control (opcional)</Label>
                <Input id="follow_up_date" name="follow_up_date" type="date" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="physical_exam_notes">Examen físico</Label>
              <Textarea id="physical_exam_notes" name="physical_exam_notes" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="diagnosis">Diagnóstico</Label>
              <Textarea id="diagnosis" name="diagnosis" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="treatment_plan">Plan de tratamiento</Label>
              <Textarea id="treatment_plan" name="treatment_plan" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="medications">Medicamentos</Label>
              <Textarea id="medications" name="medications" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vaccines_applied">Vacunas aplicadas</Label>
              <Textarea id="vaccines_applied" name="vaccines_applied" rows={2} />
            </div>

            <Button type="submit">Guardar consulta</Button>
          </form>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Historial de consultas</h2>
      {records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <Stethoscope className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Todavía no hay consultas registradas para este paciente.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((record, index) => (
            <RevealItem key={record.id} index={index}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{record.reason}</CardTitle>
                  <CardDescription>{formatDate(record.visit_date)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-foreground/90">
                  {SOAP_FIELDS.filter(({ key }) => record[key] != null && record[key] !== '').map(({ key, label, format }) => {
                    const value = record[key] as unknown;
                    return (
                      <p key={String(key)}>
                        <span className="text-muted-foreground">{label}: </span>
                        {format ? format(value) : String(value)}
                      </p>
                    );
                  })}
                </CardContent>
              </Card>
            </RevealItem>
          ))}
        </div>
      )}
    </div>
  );
}
