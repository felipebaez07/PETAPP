import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PawPrint, CalendarClock } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * Espacio del cuidador (nuevo en el pivot — antes solo podía "reservar" desde el
 * directorio, sin gestión de mascota en la web). Requiere sesión; disponible para
 * `propietario` y también para `establecimiento` — un negocio puede además tener sus
 * propias mascotas (perfil "mixto", pedido explícito 2026-09-02), ya que `pets.owner_id`
 * no depende del rol. `admin` queda fuera: administra el piloto, no lleva mascotas propias.
 */
export default async function CuidadorLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    redirect('/panel/login');
  }

  const user = await getCurrentUser();
  if (!user) redirect('/panel/login');
  if (user.profile.role === 'admin') redirect('/panel');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap gap-5">
        <Link
          href="/cuidador/mascotas"
          className="inline-flex items-center gap-2 font-heading text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <PawPrint className="size-4" />
          Tus mascotas
        </Link>
        <Link
          href="/cuidador/citas"
          className="inline-flex items-center gap-2 font-heading text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <CalendarClock className="size-4" />
          Tus citas
        </Link>
      </div>
      {children}
    </div>
  );
}
