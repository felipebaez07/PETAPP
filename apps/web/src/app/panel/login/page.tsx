import Link from 'next/link';
import { AuthForm } from '@/components/panel/auth-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Ingresar</CardTitle>
          <CardDescription>Panel para establecimientos aliados y propietarios.</CardDescription>
        </CardHeader>
        <CardContent>
          {error === 'oauth' && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              No se pudo completar el ingreso con Google. Intenta de nuevo.
            </p>
          )}
          <AuthForm mode="login" />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Aún no tienes cuenta?{' '}
            <Link href="/panel/registro" className="font-medium text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
