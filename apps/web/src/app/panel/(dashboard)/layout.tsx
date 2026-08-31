import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Building2, Clock, ListChecks, CalendarCheck, PawPrint, ShieldCheck, Store, Megaphone, Inbox, type LucideIcon } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { UserRole } from '@petapp/shared';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  requiresEstablishment?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/panel', label: 'Resumen', icon: LayoutDashboard, roles: ['establecimiento', 'admin', 'propietario'] },
  { href: '/panel/perfil', label: 'Perfil del negocio', icon: Building2, roles: ['establecimiento'], requiresEstablishment: true },
  { href: '/panel/horarios', label: 'Horarios', icon: Clock, roles: ['establecimiento'], requiresEstablishment: true },
  { href: '/panel/servicios', label: 'Servicios', icon: ListChecks, roles: ['establecimiento'], requiresEstablishment: true },
  { href: '/panel/tienda', label: 'Tienda', icon: Store, roles: ['establecimiento'], requiresEstablishment: true },
  { href: '/panel/foro', label: 'Foro', icon: Megaphone, roles: ['establecimiento'], requiresEstablishment: true },
  { href: '/panel/reservas', label: 'Reservas', icon: CalendarCheck, roles: ['establecimiento'], requiresEstablishment: true },
  { href: '/panel/adopciones', label: 'Publicaciones de adopción', icon: PawPrint, roles: ['establecimiento'], requiresEstablishment: true },
  { href: '/panel/admin/solicitudes', label: 'Solicitudes de alianza', icon: Inbox, roles: ['admin'] },
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

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.roles.includes(user.profile.role) && (!item.requiresEstablishment || user.establishment)
  );

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:px-6">
      <aside className="hidden w-56 shrink-0 sm:block">
        <p className="mb-4 px-2 text-sm font-medium text-muted-foreground">Hola, {user.profile.full_name.split(' ')[0]}</p>
        <nav className="divide-y divide-border overflow-hidden rounded-xl bg-card shadow-sm">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
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
