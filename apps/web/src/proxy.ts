import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '@/lib/supabase/config';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Refresca la sesión si el token expiró; necesario para que los
  // Server Components de /panel siempre vean el estado de auth actualizado.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Antes solo corría en /panel/:path*, pero el estado de sesión también se
  // lee en páginas públicas (Navbar en el layout raíz). Si el token expira
  // mientras el usuario navega fuera de /panel, ese refresh ocurre dentro de
  // un Server Component (que no puede persistir cookies) en vez de aquí —
  // el próximo refresh token ya está "usado" y Supabase invalida la sesión.
  // Coincide con el matcher amplio que recomienda la guía oficial de
  // @supabase/ssr para Next.js.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
