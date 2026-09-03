import { redirect } from 'next/navigation';
import { CalendarClock, PawPrint } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RevealItem } from '@/components/motion/reveal-item';
import { SERVICE_REQUEST_STATUS_LABELS, type ServiceRequestStatus } from '@petapp/shared';
import { updateServiceRequestStatus } from './actions';

interface ServiceRequestRow {
  id: string;
  status: ServiceRequestStatus;
  preferred_datetime: string | null;
  notes: string | null;
  created_at: string;
  pet_owner: { full_name: string; phone: string | null } | null;
  pet: { name: string } | null;
  service: { name: string } | null;
}

const STATUS_BADGE_VARIANT: Record<ServiceRequestStatus, 'default' | 'success' | 'destructive' | 'outline'> = {
  pendiente: 'outline',
  confirmada: 'success',
  completada: 'success',
  cancelada: 'destructive',
  no_asistio: 'destructive',
};

/** "AAAA-MM-DD" en hora LOCAL — no `iso.slice(0, 10)` (esa da la fecha en UTC, que en Colombia
 * -UTC-5- corre al día siguiente cualquier cita entre las 7pm y medianoche local). Mismo helper
 * que ya existe como `localDateKey` en `apps/mobile/lib/labels.ts`, reimplementado aquí porque
 * web no comparte ese archivo (es específico de Expo Router, no de `packages/shared`). */
function localDateKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateHeader(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  const label = date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
}

export default async function SolicitudesPage() {
  const user = await getCurrentUser();
  if (!user?.establishment) redirect('/panel');

  const supabase = await createSupabaseServerClient();
  const { data: requests } = await supabase
    .from('service_requests')
    .select(
      'id, status, preferred_datetime, notes, created_at, pet_owner:profiles(full_name,phone), pet:pets(name), service:services(name)'
    )
    .eq('establishment_id', user.establishment.id)
    .order('created_at', { ascending: false });

  const rows = (requests ?? []) as unknown as ServiceRequestRow[];

  // Agenda: solo solicitudes ya confirmadas y con fecha/hora acordada, agrupadas por día — lo
  // que pidió el prestador ("qué día viene tal cuidador con tal mascota"), no la lista plana de
  // abajo. Mismo criterio que ya tiene apps/mobile/app/(tabs)/agenda.tsx.
  const confirmedWithDate = rows
    .filter((r) => r.status === 'confirmada' && r.preferred_datetime)
    .sort((a, b) => a.preferred_datetime!.localeCompare(b.preferred_datetime!));
  const agendaGroups: { dateKey: string; items: ServiceRequestRow[] }[] = [];
  for (const request of confirmedWithDate) {
    const dateKey = localDateKey(request.preferred_datetime!);
    const existing = agendaGroups.find((g) => g.dateKey === dateKey);
    if (existing) existing.items.push(request);
    else agendaGroups.push({ dateKey, items: [request] });
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">Solicitudes de cita</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        En esta fase, la coordinación real ocurre por WhatsApp. Esta lista es tu registro de solicitudes para medir
        volumen y tasa de respuesta.
      </p>

      <div className="mb-8">
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Agenda — próximas citas confirmadas</h2>
        {agendaGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <CalendarClock className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Cuando confirmes una solicitud con fecha y hora, aparecerá aquí agrupada por día.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {agendaGroups.map((group) => (
              <div key={group.dateKey}>
                <p className="mb-2 font-heading text-xs font-semibold uppercase tracking-wide text-secondary">
                  {formatDateHeader(group.dateKey)}
                </p>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="flex items-center gap-3 p-3">
                        <PawPrint className="size-5 shrink-0 text-secondary" aria-hidden />
                        <div>
                          <p className="font-heading text-sm font-semibold text-foreground">
                            {formatTime(item.preferred_datetime!)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.pet_owner?.full_name ?? 'Cuidador'}
                            {item.pet?.name ? ` · ${item.pet.name}` : ''}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Todas las solicitudes</h2>
      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <CalendarClock className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium text-foreground">Aún no has recibido solicitudes de cita.</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              En cuanto un cuidador te encuentre en el directorio y solicite una cita, aparecerá aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r, index) => (
            <RevealItem key={r.id} index={index}>
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                  <div>
                    <CardTitle className="text-base">{r.pet_owner?.full_name ?? 'Usuario'}</CardTitle>
                    <CardDescription>
                      {r.pet?.name && `Mascota: ${r.pet.name} · `}
                      {r.service?.name ?? 'Servicio general'}
                    </CardDescription>
                  </div>
                  <Badge variant={STATUS_BADGE_VARIANT[r.status]}>{SERVICE_REQUEST_STATUS_LABELS[r.status]}</Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap items-end justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {r.preferred_datetime && (
                      <p>
                        Fecha preferida: {formatDateHeader(localDateKey(r.preferred_datetime))} ·{' '}
                        {formatTime(r.preferred_datetime)}
                      </p>
                    )}
                    {r.pet_owner?.phone && <p>Tel: {r.pet_owner.phone}</p>}
                    {r.notes && <p>Nota: {r.notes}</p>}
                  </div>
                  <form action={updateServiceRequestStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <select
                      key={r.status}
                      name="status"
                      defaultValue={r.status}
                      className="h-9 rounded-sm border border-input bg-card px-2 text-sm"
                    >
                      {Object.entries(SERVICE_REQUEST_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="outline">
                      Actualizar
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </RevealItem>
          ))}
        </div>
      )}
    </div>
  );
}
