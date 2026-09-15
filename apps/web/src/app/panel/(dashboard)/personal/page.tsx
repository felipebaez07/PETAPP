import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AddStaffForm } from '@/components/panel/add-staff-form';
import { StaffRow } from '@/components/panel/staff-row';

interface StaffRowData {
  id: string;
  role: 'veterinario' | 'auxiliar';
  status: 'activo' | 'inactivo';
  profile: { full_name: string } | null;
}

export default async function PersonalPage() {
  const user = await getCurrentUser();
  if (!user?.establishment || !user.isEstablishmentOwner) redirect('/panel');

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('establishment_staff')
    .select('id, role, status, profile:profiles(full_name)')
    .eq('establishment_id', user.establishment.id)
    .order('created_at');

  const staff = (data ?? []) as unknown as StaffRowData[];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Personal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Da acceso al panel a tus veterinarios/as y auxiliares — ven pacientes, consultas y la agenda de citas, pero
          no la configuración del negocio (perfil, horarios, servicios, plan).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar a tu equipo</CardTitle>
          <CardDescription>La persona ya debe tener una cuenta en PeTech — no hay invitación por correo todavía.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddStaffForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tu equipo ({staff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no has agregado a nadie de tu equipo.</p>
          ) : (
            <ul className="divide-y divide-border">
              {staff.map((row) => (
                <StaffRow
                  key={row.id}
                  staffId={row.id}
                  fullName={row.profile?.full_name ?? 'Sin nombre'}
                  role={row.role}
                  status={row.status}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
