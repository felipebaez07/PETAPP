import {
  providerPlanSchema,
  PROVIDER_PLAN_CODE_LABELS,
  PROVIDER_PLAN_STATUS_LABELS,
  type ProviderPlan,
  type ProviderPlanFormValues,
} from '@petapp/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { BadgeCheck, Clock3, CreditCard, Info } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChipSelectField } from '@/components/ui/ChipSelectField';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormTextField } from '@/components/ui/FormTextField';
import { LoadingState } from '@/components/ui/LoadingState';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const PLAN_CODE_OPTIONS = [
  { value: 'basico', label: PROVIDER_PLAN_CODE_LABELS.basico },
  { value: 'pro', label: PROVIDER_PLAN_CODE_LABELS.pro },
] as const;

const STATUS_TONE: Record<ProviderPlan['status'], BadgeTone> = {
  prueba: 'muted',
  activa: 'success',
  // Nunca 'accent' (ámbar): el sistema de diseño lo reserva para adopción/impacto social.
  pausada: 'muted',
  cancelada: 'destructive',
};

export default function NegocioPlanScreen() {
  const router = useRouter();
  const [establishmentId, setEstablishmentId] = useState<string | null | undefined>(undefined);
  const [plan, setPlan] = useState<ProviderPlan | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setEstablishmentId(user?.establishment?.id ?? null);
        if (user?.establishment) loadPlan(user.establishment.id);
        else setPlan(null);
      })
      .catch(() => {
        setEstablishmentId(null);
        setPlan(null);
      });
  }, []);

  async function loadPlan(id: string) {
    const { data, error } = await supabase.from('provider_plans').select('*').eq('establishment_id', id).maybeSingle();
    if (error) {
      Alert.alert('No se pudo cargar tu plan', error.message);
      setPlan(null);
      return;
    }
    setPlan((data as ProviderPlan | null) ?? null);
  }

  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<ProviderPlanFormValues>({
    resolver: zodResolver(providerPlanSchema),
    values: { plan_code: plan?.plan_code ?? 'basico', notes: plan?.notes ?? '' },
  });

  async function onSubmit(values: ProviderPlanFormValues) {
    if (!establishmentId) return;
    setSaved(false);

    if (!plan) {
      const { data, error } = await supabase
        .from('provider_plans')
        .insert({ establishment_id: establishmentId, plan_code: values.plan_code, notes: values.notes || null })
        .select()
        .single();
      if (error) {
        Alert.alert('No se pudo crear tu plan', error.message);
        return;
      }
      setPlan(data as ProviderPlan);
      setSaved(true);
      return;
    }

    // El dueño solo puede tocar plan_code/notes — status/activated_* están protegidos
    // por el trigger prevent_provider_plan_self_activation, no se envían desde aquí.
    const { data, error } = await supabase
      .from('provider_plans')
      .update({ plan_code: values.plan_code, notes: values.notes || null })
      .eq('id', plan.id)
      .select()
      .single();
    if (error) {
      Alert.alert('No se pudo guardar', error.message);
      return;
    }
    setPlan(data as ProviderPlan);
    setSaved(true);
    reset({ plan_code: (data as ProviderPlan).plan_code, notes: (data as ProviderPlan).notes ?? '' });
  }

  if (establishmentId === undefined || plan === undefined) {
    return <LoadingState label="Cargando tu plan..." />;
  }

  if (establishmentId === null) {
    return (
      <EmptyState
        icon={CreditCard}
        title="Solo para cuentas de negocio"
        description="Inicia sesión con una cuenta de establecimiento aliado para gestionar tu plan."
        actionLabel="Volver"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 24 }}>
      <View className="gap-1">
        <Text className="font-heading text-lg text-foreground">Tu plan en PETAPP</Text>
        <Text className="font-body text-sm text-mutedForeground">
          En el piloto, la activación de pago la confirma el equipo de PETAPP — aquí eliges el plan y dejas tu
          intención, y te contactamos para coordinar el pago.
        </Text>
      </View>

      {plan ? (
        <Card className="gap-3 p-4">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="font-heading text-base text-foreground">
              Plan {PROVIDER_PLAN_CODE_LABELS[plan.plan_code]}
            </Text>
            <Badge
              label={PROVIDER_PLAN_STATUS_LABELS[plan.status]}
              tone={STATUS_TONE[plan.status]}
              icon={plan.status === 'activa' ? BadgeCheck : Clock3}
            />
          </View>
          {plan.status === 'prueba' ? (
            <View className="flex-row items-start gap-2 rounded-sm bg-backgroundAlt p-3">
              <Info size={16} color="#059669" />
              <Text className="flex-1 font-body text-sm text-foreground">
                Tu plan está en prueba. Escríbenos o deja una nota abajo para coordinar el pago y activarlo.
              </Text>
            </View>
          ) : null}
        </Card>
      ) : (
        <View className="flex-row items-start gap-2 rounded-sm bg-backgroundAlt p-3">
          <Info size={16} color="#059669" />
          <Text className="flex-1 font-body text-sm text-foreground">
            Todavía no has elegido un plan. Elige uno abajo para empezar en modo de prueba.
          </Text>
        </View>
      )}

      <View className="gap-4">
        <ChipSelectField control={control} name="plan_code" label="Plan" options={PLAN_CODE_OPTIONS} />
        <FormTextField
          control={control}
          name="notes"
          label="Nota para el equipo de PETAPP (opcional)"
          placeholder="Ej. quiero pagar el plan Pro, contáctenme por WhatsApp"
          multiline
        />
      </View>

      {saved ? <Text className="font-body text-sm text-success">Guardado. Te contactaremos pronto.</Text> : null}

      <Button
        label={plan ? 'Guardar cambios' : 'Elegir este plan'}
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
      />
    </ScrollView>
  );
}
