'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserX, UserCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { updateStaffStatus, removeStaff } from '@/app/panel/(dashboard)/personal/actions';

const ROLE_LABELS: Record<'veterinario' | 'auxiliar', string> = {
  veterinario: 'Veterinario/a',
  auxiliar: 'Auxiliar',
};

export function StaffRow({
  staffId,
  fullName,
  role,
  status,
}: {
  staffId: string;
  fullName: string;
  role: 'veterinario' | 'auxiliar';
  status: 'activo' | 'inactivo';
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleStatus() {
    setBusy(true);
    await updateStaffStatus(staffId, status === 'activo' ? 'inactivo' : 'activo');
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`¿Quitar a ${fullName} de tu equipo? Deja de tener acceso al panel de inmediato.`)) return;
    setBusy(true);
    await removeStaff(staffId);
    setBusy(false);
    router.refresh();
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="font-medium text-foreground">{fullName}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <Badge variant="outline">{ROLE_LABELS[role]}</Badge>
          {status === 'inactivo' && <Badge variant="destructive">Inactivo</Badge>}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Button type="button" variant="ghost" size="icon" disabled={busy} onClick={toggleStatus} aria-label={status === 'activo' ? 'Desactivar' : 'Activar'}>
          {status === 'activo' ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
        </Button>
        <Button type="button" variant="ghost" size="icon" disabled={busy} onClick={remove} aria-label={`Quitar a ${fullName}`}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </li>
  );
}
