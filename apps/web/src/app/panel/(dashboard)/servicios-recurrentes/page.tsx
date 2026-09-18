import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Sparkles } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  GROOMING_SERVICE_TYPES,
  PREVENTIVE_EVENT_TYPE_LABELS,
  PET_SIZE_LABELS,
  type EstablishmentServiceInterval,
  type PreventiveEventType,
} from '@petapp/shared';
import { createServiceInterval, deleteServiceInterval } from './actions';

const GROOMING_TYPE_OPTIONS = GROOMING_SERVICE_TYPES.map(
  (value) => [value, PREVENTIVE_EVENT_TYPE_LABELS[value as PreventiveEventType]] as const
);

export default async function ServiciosRecurrentesPage() {
  const user = await getCurrentUser();
  if (!user?.establishment || !user.isEstablishmentOwner) redirect('/panel');

  if (!user.isPro) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Servicios recurrentes</h1>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              Esta función es exclusiva del plan Pro
            </CardTitle>
            <CardDescription>
              Con el plan Pro puedes configurar, una sola vez, el intervalo sugerido (en semanas) para cada servicio
              de estética — baño, spa, corte de pelo, corte de uñas, limpieza dental — opcionalmente diferenciado por
              tamaño o tipo de pelaje. Es solo una sugerencia: el cuidador la ve al definir su propio recordatorio,
              nunca se le impone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/panel/plan">Ver planes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: intervals } = await supabase
    .from('establishment_service_intervals')
    .select('*')
    .eq('establishment_id', user.establishment.id)
    .order('created_at');

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Servicios recurrentes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configura el intervalo sugerido para cada servicio de estética. Es solo una sugerencia para el cuidador —
          nunca se impone, ni genera recordatorios por sí sola.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar sugerencia de intervalo</CardTitle>
          <CardDescription>
            Puedes agregar más de una para el mismo servicio si quieres diferenciar por tamaño o pelaje.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createServiceInterval} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="service_type">Servicio</Label>
                <select
                  id="service_type"
                  name="service_type"
                  required
                  className="flex h-11 w-full rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {GROOMING_TYPE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="interval_weeks">Intervalo sugerido (semanas)</Label>
                <Input id="interval_weeks" name="interval_weeks" type="number" min="1" max="104" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pet_size">Tamaño de mascota (opcional)</Label>
                <select
                  id="pet_size"
                  name="pet_size"
                  defaultValue=""
                  className="flex h-11 w-full rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Cualquier tamaño</option>
                  {Object.entries(PET_SIZE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coat_type">Tipo de pelaje (opcional)</Label>
                <Input id="coat_type" name="coat_type" placeholder="Ej. Pelo largo" />
              </div>
            </div>
            <Button type="submit">Agregar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tus sugerencias ({intervals?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!intervals || intervals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no has configurado ninguna sugerencia de intervalo.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(intervals as EstablishmentServiceInterval[]).map((interval) => (
                <li key={interval.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {PREVENTIVE_EVENT_TYPE_LABELS[interval.service_type]} — cada {interval.interval_weeks}{' '}
                      {interval.interval_weeks === 1 ? 'semana' : 'semanas'}
                    </p>
                    {(interval.pet_size || interval.coat_type) && (
                      <p className="text-sm text-muted-foreground">
                        {interval.pet_size ? PET_SIZE_LABELS[interval.pet_size] : null}
                        {interval.pet_size && interval.coat_type ? ' · ' : null}
                        {interval.coat_type ?? null}
                      </p>
                    )}
                  </div>
                  <form action={deleteServiceInterval}>
                    <input type="hidden" name="id" value={interval.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar sugerencia de ${PREVENTIVE_EVENT_TYPE_LABELS[interval.service_type]}`}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
