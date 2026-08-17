import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { HoursForm } from '@/components/panel/hours-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { EstablishmentHours } from '@petapp/shared';

export default async function HorariosPage() {
  const user = await getCurrentUser();
  if (!user?.establishment) redirect('/panel');

  const supabase = await createSupabaseServerClient();
  const { data: hours } = await supabase
    .from('establishment_hours')
    .select('*')
    .eq('establishment_id', user.establishment.id);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-heading text-2xl font-bold text-foreground">Horarios de atención</h1>
      <Card>
        <CardHeader>
          <CardTitle>Disponibilidad semanal</CardTitle>
          <CardDescription>Se usa para el filtro &quot;Abierto ahora&quot; del directorio público.</CardDescription>
        </CardHeader>
        <CardContent>
          <HoursForm hours={(hours ?? []) as EstablishmentHours[]} />
        </CardContent>
      </Card>
    </div>
  );
}
