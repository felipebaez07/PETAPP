'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  PROVIDER_PLAN_CODE_LABELS,
  PROVIDER_PLAN_MARKETING_NAMES,
  type ProviderPlan,
  type ProviderPlanCode,
} from '@petapp/shared';
import { updateProviderPlan } from '@/app/panel/(dashboard)/plan/actions';

// Mismo texto y precios que la página pública /planes (packages/shared/src/constants.ts,
// PROVIDER_PLAN_FEATURES) — acá va un resumen de una línea nada más, para el radio-card compacto.
const PLAN_DESCRIPTIONS: Record<ProviderPlanCode, string> = {
  basico: 'Perfil verificado en el directorio, bandeja de solicitudes y calendario preventivo de tus pacientes.',
  pro: 'Todo lo de Camada, más recordatorios automáticos de servicios recurrentes, campañas y métricas de desempeño.',
};

export function PlanForm({ plan }: { plan: ProviderPlan | null }) {
  const router = useRouter();
  const [planCode, setPlanCode] = useState<ProviderPlanCode>(plan?.plan_code ?? 'basico');
  const [notes, setNotes] = useState(plan?.notes ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateProviderPlan(formData);
    if (result.ok) {
      setStatus('saved');
      router.refresh();
    } else {
      setErrorMessage(result.error ?? 'No se pudo guardar.');
      setStatus('error');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(PROVIDER_PLAN_CODE_LABELS) as ProviderPlanCode[]).map((code) => (
          <label
            key={code}
            className={cn(
              'cursor-pointer rounded-lg border p-4 transition-colors duration-200',
              planCode === code ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
            )}
          >
            <input
              type="radio"
              name="plan_code"
              value={code}
              checked={planCode === code}
              onChange={() => setPlanCode(code)}
              className="sr-only"
            />
            <p className="font-heading font-semibold text-foreground">
              {PROVIDER_PLAN_CODE_LABELS[code]} · {PROVIDER_PLAN_MARKETING_NAMES[code]}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{PLAN_DESCRIPTIONS[code]}</p>
          </label>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Nota de intención de pago (opcional)</Label>
        <Textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej. Quiero pasar a Pro, mi negocio ya tiene 2 años y facturación estable."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          En este piloto no hay pasarela de pago: dejar esta nota le indica al equipo que quieres activar el plan.
          Solo un administrador puede confirmar la activación una vez coordine el pago contigo.
        </p>
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      {status === 'saved' && <p className="text-sm text-success">Preferencia de plan guardada.</p>}
      <Button type="submit" disabled={status === 'saving'}>
        {status === 'saving' ? 'Guardando…' : 'Guardar preferencia de plan'}
      </Button>
    </form>
  );
}
