import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ProfileForm } from '@/components/panel/profile-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user?.establishment) redirect('/panel');

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-heading text-2xl font-bold text-foreground">Perfil del negocio</h1>
      <Card>
        <CardHeader>
          <CardTitle>Información pública</CardTitle>
          <CardDescription>Esta información aparece en tu ficha del directorio.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm establishment={user.establishment} />
        </CardContent>
      </Card>
    </div>
  );
}
