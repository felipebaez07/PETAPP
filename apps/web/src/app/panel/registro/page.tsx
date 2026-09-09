import Link from 'next/link';
import { AuthForm } from '@/components/panel/auth-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { UserRole } from '@petapp/shared';

// `?rol=establecimiento` preselecciona esa opción del formulario — hasta ahora ningún CTA del
// sitio enlazaba acá con ese parámetro (el de "Soy prestador" del home va a /unete, un funnel
// distinto), pero queda listo para cualquier enlace futuro que sí quiera mandar directo acá con
// el rol correcto ya elegido, en vez de que la persona tenga que tocar el radio a mano.
function toUserRole(value: string | string[] | undefined): UserRole | undefined {
  return value === 'establecimiento' ? 'establecimiento' : undefined;
}

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string }>;
}) {
  const { rol } = await searchParams;
  const initialRole = toUserRole(rol);

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Únete como cuidador/a de mascota o como prestador veterinario aliado.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="registro" initialRole={initialRole} />
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
