import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/directorio/verified-badge';
import { CreateEstablishmentForm } from '@/components/panel/create-establishment-form';
import { CATEGORY_LABELS } from '@petapp/shared';

export default async function DashboardHomePage() {
  const user = await getCurrentUser();
  if (!user) return null; // el layout ya redirige; esto solo satisface a TypeScript

  if (user.profile.role === 'admin') {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Panel de administración</h1>
        <p className="mt-2 text-muted-foreground">Gestiona las solicitudes de alianza y la verificación de aliados del piloto.</p>
        <div className="mt-4 flex gap-3">
          <Button asChild>
            <Link href="/panel/admin/solicitudes">Ver solicitudes</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/panel/admin/aliados">Verificar aliados</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (user.profile.role === 'propietario') {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Tu cuenta</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Este panel web es para prestadores aliados. Gestiona el perfil de tus mascotas, su calendario preventivo y
          sus documentos desde tu espacio de cuidador.
        </p>
        <Button asChild className="mt-4">
          <Link href="/cuidador/mascotas">Ir a mis mascotas</Link>
        </Button>
      </div>
    );
  }

  if (!user.establishment) {
    return (
      <div className="max-w-lg">
        <h1 className="font-heading text-2xl font-bold text-foreground">Crea el perfil de tu negocio</h1>
        <p className="mt-2 text-muted-foreground">
          Tu cuenta ya está lista como prestador — solo falta este último paso. Tu negocio queda visible en el
          directorio marcado como &quot;Pendiente de verificación&quot; hasta que el equipo del piloto confirme tus
          datos.
        </p>
        <Card className="mt-6">
          <CardContent className="pt-6">
            <CreateEstablishmentForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { count: pendingCount } = await supabase
    .from('service_requests')
    .select('id', { count: 'exact', head: true })
    .eq('establishment_id', user.establishment.id)
    .eq('status', 'pendiente');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{user.establishment.name}</h1>
          <p className="text-sm text-muted-foreground">{CATEGORY_LABELS[user.establishment.category]}</p>
        </div>
        <VerifiedBadge status={user.establishment.verification_status} />
      </div>

      {user.establishment.verification_status !== 'verificado' && (
        <Card className="mb-6 border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Tu perfil está{' '}
            {user.establishment.verification_status === 'pendiente' ? 'pendiente de revisión' : 'en revisión'} por el
            equipo del piloto. Ya apareces en el directorio público con la etiqueta &quot;pendiente de
            verificación&quot; — cuando el equipo confirme tus datos, pasarás a &quot;Verificado&quot;.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de cita pendientes</CardTitle>
            <CardDescription>Cuidadores esperando tu respuesta.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="font-heading text-3xl font-bold text-foreground">{pendingCount ?? 0}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/panel/solicitudes">Ver solicitudes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start gap-2 space-y-0">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <CardTitle className="text-base">Próximos vencimientos de tus pacientes</CardTitle>
              <CardDescription>
                Todavía no disponible: el calendario preventivo es privado del cuidador. Está en el backlog una
                vista compartida cuando exista una cita confirmada contigo (ver spec.md sección 9).
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Perfil del negocio</CardTitle>
            <CardDescription>Nombre, descripción, dirección y contacto.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/panel/perfil">Editar</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Horarios</CardTitle>
            <CardDescription>Define tu disponibilidad semanal o 24/7.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/panel/horarios">Editar</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tu plan</CardTitle>
            <CardDescription>Básico o Pro, estado de la suscripción.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/panel/plan">Ver plan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
