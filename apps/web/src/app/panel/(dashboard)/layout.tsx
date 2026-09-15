import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Clock,
  ListChecks,
  CalendarCheck,
  ShieldCheck,
  Inbox,
  CreditCard,
  PawPrint,
  Stethoscope,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { UserRole } from '@petapp/shared';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  requiresEstablishment?: boolean;
  /** Además de tener un establishment, exige ser el dueño — no basta con ser personal
   * (`establishment_staff`, 0018_establishment_staff.sql). Para configuración del negocio, no
   * para las pantallas operativas del día a día. */
  requiresOwner?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/panel', label: 'Resumen', icon: LayoutDashboard, roles: ['establecimiento', 'admin', 'propietario'] },
  {
    href: '/panel/perfil',
    label: 'Perfil del negocio',
    icon: Building2,
    roles: ['establecimiento'],
    requiresEstablishment: true,
    requiresOwner: true,
  },
  {
    href: '/panel/horarios',
    label: 'Horarios',
    icon: Clock,
    roles: ['establecimiento'],
    requiresEstablishment: true,
    requiresOwner: true,
  },
  {
    href: '/panel/servicios',
    label: 'Servicios',
    icon: ListChecks,
    roles: ['establecimiento'],
    requiresEstablishment: true,
    requiresOwner: true,
  },
  { href: '/panel/solicitudes', label: 'Solicitudes de cita', icon: CalendarCheck, roles: ['establecimiento'], requiresEstablishment: true },
  { href: '/panel/pacientes', label: 'Pacientes', icon: Stethoscope, roles: ['establecimiento'], requiresEstablishment: true },
  {
    href: '/panel/personal',
    label: 'Personal',
    icon: Users,
    roles: ['establecimiento'],
    requiresEstablishment: true,
    requiresOwner: true,
  },
  {
    href: '/panel/plan',
    label: 'Tu plan',
    icon: CreditCard,
    roles: ['establecimiento'],
    requiresEstablishment: true,
    requiresOwner: true,
  },
  // Perfil "mixto": un negocio puede además llevar sus propias mascotas (pedido 2026-09-02) —
  // /cuidador/mascotas ya lo permite para role='establecimiento', esto solo lo hace visible.
  { href: '/cuidador/mascotas', label: 'Mis mascotas', icon: PawPrint, roles: ['establecimiento'] },
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

  // Los ítems `requiresEstablishment` se habilitan por tener un establishment (dueño o personal
  // activo, ver `getCurrentUser`), no por el `role` de la cuenta — el personal contratado puede
  // seguir teniendo `role: 'propietario'` en su perfil.
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.requiresEstablishment) {
      if (!user.establishment) return false;
      if (item.requiresOwner && !user.isEstablishmentOwner) return false;
      return true;
    }
    return item.roles.includes(user.profile.role);
  });

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:px-6 print:max-w-none print:p-0">
      <aside className="hidden w-56 shrink-0 sm:block print:hidden">
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
