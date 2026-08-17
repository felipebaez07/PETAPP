import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RESERVATION_STATUS_LABELS, type ReservationStatus } from '@petapp/shared';
import { updateReservationStatus } from './actions';

interface ReservationRow {
  id: string;
  status: ReservationStatus;
  preferred_datetime: string | null;
  notes: string | null;
  created_at: string;
  pet_owner: { full_name: string; phone: string | null } | null;
  pet: { name: string } | null;
  service: { name: string } | null;
}

const STATUS_BADGE_VARIANT: Record<ReservationStatus, 'default' | 'success' | 'destructive' | 'outline'> = {
  pendiente: 'outline',
  confirmada: 'success',
  completada: 'success',
  cancelada: 'destructive',
  no_asistio: 'destructive',
};

export default async function ReservasPage() {
  const user = await getCurrentUser();
  if (!user?.establishment) redirect('/panel');

  const supabase = await createSupabaseServerClient();
  const { data: reservations } = await supabase
    .from('reservations')
    .select('id, status, preferred_datetime, notes, created_at, pet_owner:profiles(full_name,phone), pet:pets(name), service:services(name)')
    .eq('establishment_id', user.establishment.id)
    .order('created_at', { ascending: false });

  const rows = (reservations ?? []) as unknown as ReservationRow[];

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">Reservas</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        En esta fase, la coordinación real ocurre por WhatsApp. Esta lista es tu registro de solicitudes para medir
        volumen y tasa de conversión.
      </p>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Aún no has recibido solicitudes de reserva.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-base">{r.pet_owner?.full_name ?? 'Usuario'}</CardTitle>
                  <CardDescription>
                    {r.pet?.name && `Mascota: ${r.pet.name} · `}
                    {r.service?.name ?? 'Servicio general'}
                  </CardDescription>
                </div>
                <Badge variant={STATUS_BADGE_VARIANT[r.status]}>{RESERVATION_STATUS_LABELS[r.status]}</Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  {r.pet_owner?.phone && <p>Tel: {r.pet_owner.phone}</p>}
                  {r.notes && <p>Nota: {r.notes}</p>}
                </div>
                <form action={updateReservationStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <select
                    name="status"
                    defaultValue={r.status}
                    className="h-9 rounded-sm border border-input bg-card px-2 text-sm"
                  >
                    {Object.entries(RESERVATION_STATUS_LABELS).map(([value, label]) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
