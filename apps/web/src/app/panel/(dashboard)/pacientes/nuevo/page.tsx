import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ClinicalPatientForm } from '@/components/panel/clinical-patient-form';

export default async function NuevoPacientePage() {
  const user = await getCurrentUser();
  if (!user?.establishment) redirect('/panel');

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-heading text-2xl font-bold text-foreground">Nuevo paciente</h1>
      <Card>
        <CardHeader>
          <CardTitle>Ficha del paciente</CardTitle>
          <CardDescription>
            Vincula una mascota ya registrada en la plataforma, o crea la ficha de un paciente sin cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClinicalPatientForm />
        </CardContent>
      </Card>
    </div>
  );
}
