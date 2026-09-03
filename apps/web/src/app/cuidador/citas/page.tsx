import Link from 'next/link';
import { CalendarClock, PawPrint } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RevealItem } from '@/components/motion/reveal-item';
import { SERVICE_REQUEST_STATUS_LABELS, type ServiceRequestStatus } from '@petapp/shared';

interface RequestRow {
  id: string;
  status: ServiceRequestStatus;
  preferred_datetime: string | null;
  notes: string | null;
  created_at: string;
  establishment: { name: string; slug: string } | null;
  pet: { name: string } | null;
  service: { name: string } | null;
}

const STATUS_VARIANT: Record<ServiceRequestStatus, 'outline' | 'secondary' | 'success' | 'destructive'> = {
  pendiente: 'outline',
  confirmada: 'success',
  completada: 'secondary',
  cancelada: 'destructive',
  no_asistio: 'destructive',
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
}

export default async function CitasPage() {
  const user = await getCurrentUser();
  if (!user) return null; // el layout ya redirige

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('service_requests')
    .select(
      '*, establishment:establishments(name,slug), pet:pets(name), service:services(name)'
    )
    .eq('pet_owner_id', user.profile.id)
    .order('created_at', { ascending: false });

  const requests = (data ?? []) as unknown as RequestRow[];

  // "Recordatorio de asistencia" simple, sin infraestructura nueva (pedido 2026-09-02): en vez de
  // un push/email, se destaca la próxima cita confirmada con fecha cada vez que el cuidador entra
  // aquí — el mismo criterio que ya usa el widget de "próximos vencimientos" del calendario
  // preventivo. Push/email quedan en backlog (spec.md sección 9) si se decide meter esa infraestructura.
  const now = new Date();
  const upcoming = requests
    .filter((r) => r.status === 'confirmada' && r.preferred_datetime && new Date(r.preferred_datetime) >= now)
    .sort((a, b) => a.preferred_datetime!.localeCompare(b.preferred_datetime!));
  const nextAppointment = upcoming[0];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Tus citas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro de todas las solicitudes de cita que has enviado a prestadores verificados.
        </p>
      </div>

      {nextAppointment && (
        <Card className="mb-6 border-success/30 bg-success/5">
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarClock className="size-6 shrink-0 text-success" aria-hidden />
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">Tu próxima cita confirmada</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(nextAppointment.preferred_datetime!)} · {nextAppointment.establishment?.name}
                {nextAppointment.pet?.name ? ` · ${nextAppointment.pet.name}` : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {requests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <PawPrint className="size-10 text-secondary" aria-hidden />
          <p className="font-heading text-lg font-semibold text-foreground">Todavía no has solicitado ninguna cita</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Busca un prestador verificado en el{' '}
            <Link href="/directorio" className="font-medium text-primary hover:underline">
              directorio
            </Link>{' '}
            y solicita una cita desde su ficha.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request, index) => (
            <RevealItem key={request.id} index={index}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-heading text-base font-semibold text-foreground">
                      {request.establishment?.name ?? 'Prestador'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.pet?.name ? `${request.pet.name} · ` : ''}
                      {request.service?.name ?? 'Servicio general'}
                    </p>
                    {request.preferred_datetime && (
                      <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(request.preferred_datetime)}</p>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANT[request.status]}>{SERVICE_REQUEST_STATUS_LABELS[request.status]}</Badge>
                </CardContent>
              </Card>
            </RevealItem>
          ))}
        </div>
      )}
    </div>
  );
}
