import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/directorio/verified-badge';
import { CATEGORY_LABELS } from '@petapp/shared';

export default async function DashboardHomePage() {
  const user = await getCurrentUser();
  if (!user) return null; // el layout ya redirige; esto solo satisface a TypeScript

  if (user.profile.role === 'admin') {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Panel de administración</h1>
        <p className="mt-2 text-muted-foreground">Gestiona la verificación de aliados del piloto.</p>
        <Button asChild className="mt-4">
          <Link href="/panel/admin/aliados">Ir a verificación de aliados</Link>
        </Button>
      </div>
    );
  }

  if (user.profile.role === 'propietario') {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Tu cuenta</h1>
        <p className="mt-2 text-muted-foreground">
          La gestión de mascotas, reservas y adopciones está disponible en la app móvil de PetApp. Este panel web es
          para establecimientos aliados.
        </p>
      </div>
    );
  }

  if (!user.establishment) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Aún no tienes un establecimiento vinculado</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Si ya enviaste tu solicitud desde &quot;Únete al piloto&quot;, nuestro equipo vinculará tu cuenta pronto. Si
          no la has enviado, hazlo para empezar el onboarding.
        </p>
        <Button asChild className="mt-4">
          <Link href="/unete">Enviar solicitud de alianza</Link>
        </Button>
      </div>
    );
  }

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
            equipo del piloto. Aparecerás en el directorio público una vez verificado.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
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
            <CardTitle>Reservas</CardTitle>
            <CardDescription>Solicitudes recibidas por WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/panel/reservas">Ver reservas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
