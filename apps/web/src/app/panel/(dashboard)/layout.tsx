import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Building2, Clock, ListChecks, CalendarCheck, PawPrint, ShieldCheck, type LucideIcon } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { UserRole } from '@petapp/shared';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/panel', label: 'Resumen', icon: LayoutDashboard, roles: ['establecimiento', 'admin', 'propietario'] },
  { href: '/panel/perfil', label: 'Perfil del negocio', icon: Building2, roles: ['establecimiento'] },
  { href: '/panel/horarios', label: 'Horarios', icon: Clock, roles: ['establecimiento'] },
  { href: '/panel/servicios', label: 'Servicios', icon: ListChecks, roles: ['establecimiento'] },
  { href: '/panel/reservas', label: 'Reservas', icon: CalendarCheck, roles: ['establecimiento'] },
  { href: '/panel/adopciones', label: 'Publicaciones de adopción', icon: PawPrint, roles: ['establecimiento'] },
  { href: '/panel/admin/aliados', label: 'Verificar aliados', icon: ShieldCheck, roles: ['admin'] },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    redirect('/panel/login');
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect('/panel/login');
  }

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.profile.role));

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:px-6">
      <aside className="hidden w-56 shrink-0 sm:block">
        <p className="mb-4 px-2 text-sm font-medium text-muted-foreground">Hola, {user.profile.full_name.split(' ')[0]}</p>
        <nav className="space-y-1">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
