import { redirect } from 'next/navigation';
import { CalendarClock } from 'lucide-react';
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

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">Solicitudes de cita</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        En esta fase, la coordinación real ocurre por WhatsApp. Esta lista es tu registro de solicitudes para medir
        volumen y tasa de respuesta.
      </p>

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
                    {r.pet_owner?.phone && <p>Tel: {r.pet_owner.phone}</p>}
                    {r.notes && <p>Nota: {r.notes}</p>}
                  </div>
                  <form action={updateServiceRequestStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <select
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
