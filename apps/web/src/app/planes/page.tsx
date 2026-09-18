import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FadeInSection } from '@/components/motion/fade-in-section';
import {
  PROVIDER_PLAN_CODE_LABELS,
  PROVIDER_PLAN_MARKETING_NAMES,
  PROVIDER_PLAN_MONTHLY_PRICE_COP,
  PROVIDER_PLAN_FEATURES,
  type ProviderPlanCode,
} from '@petapp/shared';

const PLAN_ORDER: ProviderPlanCode[] = ['basico', 'pro'];

function formatCop(amount: number): string {
  return new Intl.NumberFormat('es-CO').format(amount);
}

export default function PlanesPage() {
  return (
    <div>
      <FadeInSection className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Planes para tu negocio</span>
        <h1 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Un plan para cada etapa de tu veterinaria o negocio de mascotas
        </h1>
        <p className="mt-4 text-muted-foreground">
          Gratis para cuidadores, siempre. Los establecimientos eligen el plan que mejor se ajusta a su operación —
          durante el piloto, la activación se coordina directamente con el equipo, sin pasarela de pago automática.
        </p>
      </FadeInSection>

      <FadeInSection className="bg-background-alt pb-16">
        <div className="mx-auto grid max-w-4xl gap-6 px-4 sm:grid-cols-2 sm:px-6">
          {PLAN_ORDER.map((code) => {
            const isPro = code === 'pro';
            return (
              <Card key={code} className={isPro ? 'border-primary shadow-md' : undefined}>
                <CardContent className="flex h-full flex-col p-6">
                  {isPro && (
                    <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <Sparkles className="size-3.5" /> Recomendado si ya tienes servicios recurrentes
                    </span>
                  )}
                  <p className="font-heading text-lg font-semibold text-foreground">
                    Plan {PROVIDER_PLAN_CODE_LABELS[code]} · {PROVIDER_PLAN_MARKETING_NAMES[code]}
                  </p>
                  <p className="mt-2">
                    <span className="font-heading text-3xl font-bold text-foreground">
                      ${formatCop(PROVIDER_PLAN_MONTHLY_PRICE_COP[code])}
                    </span>
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </p>
                  {isPro && (
                    <p className="mt-1 text-sm text-muted-foreground">Todo lo de {PROVIDER_PLAN_MARKETING_NAMES.basico}, más:</p>
                  )}
                  <ul className="mt-4 flex-1 space-y-2.5">
                    {PROVIDER_PLAN_FEATURES[code].map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground/90">
                        <Check className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={isPro ? 'primary' : 'outline'} className="mt-6">
                    <Link href="/unete">Únete al piloto</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </FadeInSection>
    </div>
  );
}
