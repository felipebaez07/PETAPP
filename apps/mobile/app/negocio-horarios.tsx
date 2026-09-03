import { DAY_LABELS, type EstablishmentHours } from '@petapp/shared';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Establishment } from '@petapp/shared';

interface DayState {
  day_of_week: number;
  open_time: string;
  close_time: string;
  closed: boolean;
}

function buildInitialDays(hours: EstablishmentHours[]): DayState[] {
  return Array.from({ length: 7 }, (_, day_of_week) => {
    const existing = hours.find((h) => h.day_of_week === day_of_week);
    return {
      day_of_week,
      open_time: existing?.open_time?.slice(0, 5) ?? '08:00',
      close_time: existing?.close_time?.slice(0, 5) ?? '18:00',
      closed: existing?.closed ?? false,
    };
  });
}

export default function NegocioHorariosScreen() {
  const router = useRouter();
  const [establishment, setEstablishment] = useState<Establishment | null | undefined>(undefined);
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [days, setDays] = useState<DayState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(async (user) => {
        setIsBusinessAccount(user?.profile.role === 'establecimiento');
        setEstablishment(user?.establishment ?? null);
        if (user?.establishment) {
          const { data, error } = await supabase
            .from('establishment_hours')
            .select('*')
            .eq('establishment_id', user.establishment.id);
          if (error) {
            Alert.alert('No se pudo cargar tus horarios', error.message);
            setDays(buildInitialDays([]));
            return;
          }
          setDays(buildInitialDays((data as EstablishmentHours[]) ?? []));
        }
      })
      .catch(() => {
        Alert.alert('No se pudo cargar tu cuenta', 'Intenta de nuevo en unos segundos.');
        setEstablishment(null);
      });
  }, []);

  function updateDay(index: number, patch: Partial<DayState>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
    setSaved(false);
  }

  async function handleSubmit() {
    if (!establishment) return;
    setSubmitting(true);
    const rows = days.map((d) => ({
      establishment_id: establishment.id,
      day_of_week: d.day_of_week,
      open_time: d.closed ? null : d.open_time,
      close_time: d.closed ? null : d.close_time,
      closed: d.closed,
    }));
    const { error } = await supabase
      .from('establishment_hours')
      .upsert(rows, { onConflict: 'establishment_id,day_of_week' });
    setSubmitting(false);
    if (error) {
      Alert.alert('No se pudo guardar', error.message);
      return;
    }
    setSaved(true);
  }

  if (establishment === undefined) {
    return <LoadingState label="Cargando tu cuenta..." />;
  }

  if (establishment === null) {
    if (!isBusinessAccount) {
      return (
        <EmptyState
          icon={Clock}
          title="Solo para cuentas de negocio"
          description="Inicia sesión con una cuenta de establecimiento aliado para editar tus horarios."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      );
    }
    return (
      <EmptyState
        icon={Clock}
        title="Todavía no has creado tu negocio"
        description="Tu cuenta ya está lista como prestador — crea el perfil de tu negocio antes de definir tus horarios."
        actionLabel="Crear mi negocio"
        onAction={() => router.push('/negocio-crear')}
      />
    );
  }

  if (days.length === 0) {
    return <LoadingState label="Cargando horarios..." />;
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 24 }}>
      <View className="gap-1">
        <Text className="font-heading text-lg text-foreground">Disponibilidad semanal</Text>
        <Text className="font-body text-sm text-mutedForeground">
          Se usa para el filtro &quot;Abierto ahora&quot; del directorio público.
        </Text>
      </View>

      <View className="overflow-hidden rounded-xl bg-card shadow-sm">
        {days.map((day, index) => (
          <View
            key={day.day_of_week}
            className={[
              'gap-3 px-4 py-3',
              index < days.length - 1 ? 'border-b border-border' : '',
            ].join(' ')}
          >
            <View className="flex-row items-center justify-between gap-3">
              <Text className="font-bodySemibold text-sm text-foreground">
                {DAY_LABELS[day.day_of_week]}
              </Text>
              <Pressable
                onPress={() => updateDay(index, { closed: !day.closed })}
                accessibilityRole="switch"
                accessibilityState={{ checked: day.closed }}
                className="flex-row items-center gap-2"
              >
                <Text className="font-body text-sm text-mutedForeground">Cerrado</Text>
                <Switch
                  value={day.closed}
                  onValueChange={(value) => updateDay(index, { closed: value })}
                  trackColor={{ false: '#D6E4EA', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </Pressable>
            </View>
            {!day.closed ? (
              <View className="flex-row items-center gap-2">
                <View className="min-h-11 flex-1 justify-center rounded-sm border border-border bg-card px-3">
                  <TextInput
                    value={day.open_time}
                    onChangeText={(value) => updateDay(index, { open_time: value })}
                    placeholder="08:00"
                    placeholderTextColor="#64748B"
                    autoCapitalize="none"
                    className="font-body text-base text-foreground"
                  />
                </View>
                <Text className="font-body text-sm text-mutedForeground">a</Text>
                <View className="min-h-11 flex-1 justify-center rounded-sm border border-border bg-card px-3">
                  <TextInput
                    value={day.close_time}
                    onChangeText={(value) => updateDay(index, { close_time: value })}
                    placeholder="18:00"
                    placeholderTextColor="#64748B"
                    autoCapitalize="none"
                    className="font-body text-base text-foreground"
                  />
                </View>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {saved ? <Text className="font-body text-sm text-success">Horarios actualizados.</Text> : null}

      <Button label="Guardar horarios" onPress={handleSubmit} loading={submitting} />
    </ScrollView>
  );
}
