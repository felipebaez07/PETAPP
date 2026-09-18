'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { setConsent } from '@/app/cuidador/privacidad/actions';
import type { ConsentType } from '@petapp/shared';

export function ConsentToggle({
  consentType,
  label,
  description,
  initialGranted,
}: {
  consentType: ConsentType;
  label: string;
  description: string;
  initialGranted: boolean;
}) {
  const router = useRouter();
  const [granted, setGranted] = useState(initialGranted);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: boolean) {
    setSaving(true);
    setError(null);
    setGranted(next); // optimista — se revierte abajo si la acción falla
    const result = await setConsent(consentType, next);
    setSaving(false);
    if (!result.ok) {
      setGranted(!next);
      setError(result.error ?? 'No se pudo guardar.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-4">
      <Checkbox
        id={consentType}
        checked={granted}
        disabled={saving}
        onCheckedChange={(v) => onChange(Boolean(v))}
        className="mt-0.5"
      />
      <div className="space-y-1">
        <Label htmlFor={consentType} className="cursor-pointer font-medium text-foreground">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
