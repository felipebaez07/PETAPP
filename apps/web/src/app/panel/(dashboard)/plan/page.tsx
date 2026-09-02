import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlanForm } from '@/components/panel/plan-form';
import { PROVIDER_PLAN_STATUS_LABELS, type ProviderPlan } from '@petapp/shared';

const STATUS_BADGE_VARIANT: Record<ProviderPlan['status'], 'default' | 'success' | 'outline' | 'destructive'> = {
  prueba: 'outline',
  activa: 'success',
  pausada: 'default',
  cancelada: 'destructive',
};

export default async function PlanPage() {
  const user = await getCurrentUser();
  if (!user?.establishment) redirect('/panel');

  const supabase = await createSupabaseServerClient();
  const { data: plan } = await supabase
    .from('provider_plans')
    .select('*')
    .eq('establishment_id', user.establishment.id)
    .maybeSingle();

  const currentPlan = (plan as ProviderPlan | null) ?? null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Tu plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          PETAPP es gratis para cuidadores. Los prestadores eligen un plan de suscripción — durante el piloto, la
          activación de pago se coordina manualmente con el equipo.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Estado actual</CardTitle>
            <CardDescription>
              {currentPlan ? 'Este es el estado real de tu suscripción.' : 'Todavía no has elegido un plan.'}
            </CardDescription>
          </div>
          <Badge variant={currentPlan ? STATUS_BADGE_VARIANT[currentPlan.status] : 'outline'}>
            {currentPlan ? PROVIDER_PLAN_STATUS_LABELS[currentPlan.status] : 'Sin plan'}
          </Badge>
        </CardHeader>
        <CardContent>
          <PlanForm plan={currentPlan} />
        </CardContent>
      </Card>
    </div>
  );
}
