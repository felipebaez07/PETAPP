'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { addStaff } from '@/app/panel/(dashboard)/personal/actions';

type Role = 'veterinario' | 'auxiliar';

export function AddStaffForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('veterinario');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    setError(null);
    const result = await addStaff(email, role);
    if (result.ok) {
      setEmail('');
      setStatus('idle');
      router.refresh();
    } else {
      setStatus('error');
      setError(result.error ?? 'No se pudo agregar.');
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <div className="min-w-48 flex-1 space-y-1.5">
        <Label htmlFor="staff-email">Correo de la cuenta ya registrada en PeTech</Label>
        <Input
          id="staff-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="veterinario@ejemplo.com"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="staff-role">Rol</Label>
        <select
          id="staff-role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="flex h-11 rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="veterinario">Veterinario/a</option>
          <option value="auxiliar">Auxiliar</option>
        </select>
      </div>
      <Button type="submit" disabled={status === 'saving'}>
        {status === 'saving' ? 'Agregando…' : 'Agregar'}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </form>
  );
}
