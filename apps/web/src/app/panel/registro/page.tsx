import Link from 'next/link';
import { AuthForm } from '@/components/panel/auth-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function RegistroPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Únete como establecimiento aliado o como propietario de mascota.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="registro" />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href="/panel/login" className="font-medium text-primary hover:underline">
              Ingresa
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
