'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import type { Establishment } from '@petapp/shared';
import { updateEstablishmentProfile } from '@/app/panel/(dashboard)/perfil/actions';

export function ProfileForm({ establishment }: { establishment: Establishment }) {
  const router = useRouter();
  const [is24h, setIs24h] = useState(establishment.is_24_7);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('saving');
    const formData = new FormData(e.currentTarget);
    const result = await updateEstablishmentProfile(formData);
    if (result.ok) {
      setStatus('saved');
      router.refresh();
    } else {
      setErrorMessage(result.error ?? 'No se pudo guardar.');
      setStatus('error');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre del negocio</Label>
        <Input id="name" name="name" defaultValue={establishment.name} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" defaultValue={establishment.description ?? ''} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" defaultValue={establishment.address ?? ''} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" defaultValue={establishment.phone ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp_number">WhatsApp (con código de país, sin +)</Label>
          <Input id="whatsapp_number" name="whatsapp_number" defaultValue={establishment.whatsapp_number ?? ''} placeholder="573001234567" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="is_24_7" name="is_24_7" checked={is24h} onCheckedChange={(v) => setIs24h(Boolean(v))} />
        <Label htmlFor="is_24_7" className="cursor-pointer">
          Atendemos las 24 horas, todos los días
        </Label>
      </div>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      {status === 'saved' && <p className="text-sm text-success">Cambios guardados.</p>}
      <Button type="submit" disabled={status === 'saving'}>
        {status === 'saving' ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  );
}
