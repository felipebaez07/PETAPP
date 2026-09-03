import { SERVICE_REQUEST_STATUS_LABELS, type ServiceRequestStatus } from '@petapp/shared';
import { useRouter } from 'expo-router';
import { CalendarCheck, CalendarClock, PawPrint } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { getCurrentUser } from '@/lib/auth';
import { formatAgendaDateHeader, formatAgendaTime, localDateKey } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { useTabBarBottomInset } from '@/lib/tabBar';

interface ServiceRequestRow {
  id: string;
  status: ServiceRequestStatus;
  preferred_datetime: string | null;
  notes: string | null;
  created_at: string;
  pet_owner: { full_name: string; phone: string | null } | null;
  pet: { name: string } | null;
  service: { name: string } | null;
}

const STATUS_TONE: Record<ServiceRequestStatus, BadgeTone> = {
  pendiente: 'muted',
  confirmada: 'success',
  completada: 'success',
  cancelada: 'destructive',
  no_asistio: 'destructive',
};

/** (antes `app/negocio-solicitudes.tsx`) Ahora es la tab "Agenda" del prestador: ver spec.md sección 6. */
export default function AgendaScreen() {
  const router = useRouter();
  const [establishmentId, setEstablishmentId] = useState<string | null | undefined>(undefined);
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [requests, setRequests] = useState<ServiceRequestRow[]>([]);
  const tabBarBottomInset = useTabBarBottomInset();

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setIsBusinessAccount(user?.profile.role === 'establecimiento');
        setEstablishmentId(user?.establishment?.id ?? null);
        if (user?.establishment) loadRequests(user.establishment.id);
      })
      .catch(() => {
        Alert.alert('No se pudo cargar tu cuenta', 'Intenta de nuevo en unos segundos.');
        setEstablishmentId(null);
      });
  }, []);

  async function loadRequests(id: string) {
    const { data, error } = await supabase
      .from('service_requests')
      .select(
        'id, status, preferred_datetime, notes, created_at, pet_owner:profiles(full_name,phone), pet:pets(name), service:services(name)'
      )
      .eq('establishment_id', id)
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('No se pudo cargar tus solicitudes', error.message);
      return;
    }
    setRequests((data ?? []) as unknown as ServiceRequestRow[]);
  }

  async function updateStatus(id: string, status: ServiceRequestStatus) {
    if (!establishmentId) return;
    const { error } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', id)
      .eq('establishment_id', establishmentId);
    if (error) {
      Alert.alert('No se pudo actualizar', error.message);
      return;
    }
    await loadRequests(establishmentId);
  }

  // Agenda: solo solicitudes ya confirmadas y con fecha/hora acordada, agrupadas por día
  // y ordenadas de la más próxima a la más lejana — es lo que pidió el prestador: "qué día
  // viene tal cuidador con tal mascota", no la lista plana de todas las solicitudes.
  const agendaGroups = useMemo(() => {
    const confirmed = requests
      .filter((r) => r.status === 'confirmada' && r.preferred_datetime)
      .sort((a, b) => a.preferred_datetime!.localeCompare(b.preferred_datetime!));

    const groups: { dateKey: string; items: ServiceRequestRow[] }[] = [];
    for (const request of confirmed) {
      const dateKey = localDateKey(request.preferred_datetime!);
      const existing = groups.find((g) => g.dateKey === dateKey);
      if (existing) existing.items.push(request);
      else groups.push({ dateKey, items: [request] });
    }
    return groups;
  }, [requests]);

  if (establishmentId === undefined) {
    return <LoadingState label="Cargando tu agenda..." />;
  }

  if (establishmentId === null) {
    if (!isBusinessAccount) {
      return (
        <EmptyState
          icon={CalendarCheck}
          title="Solo para cuentas de negocio"
          description="Inicia sesión con una cuenta de establecimiento aliado para ver tu agenda."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      );
    }
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Todavía no has creado tu negocio"
        description="Tu cuenta ya está lista como prestador — crea el perfil de tu negocio para empezar a recibir solicitudes."
        actionLabel="Crear mi negocio"
        onAction={() => router.push('/negocio-crear')}
      />
    );
  }

  let rowIndex = 0;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: tabBarBottomInset }}>
      <ScreenHeader title="Agenda" subtitle="Qué cuidador viene, con qué mascota y cuándo" />

      <View className="gap-5 px-5 pt-5">
        <View className="gap-3">
          <Text className="font-heading text-lg text-foreground">Próximas citas confirmadas</Text>
          {agendaGroups.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Sin citas confirmadas todavía"
              description="Cuando confirmes una solicitud con fecha y hora, aparecerá aquí agrupada por día."
            />
          ) : (
            <View className="gap-4">
              {agendaGroups.map((group) => (
                <View key={group.dateKey} className="gap-2">
                  <Text className="font-bodySemibold text-sm uppercase tracking-wide text-secondary">
                    {formatAgendaDateHeader(group.dateKey)}
                  </Text>
                  <View className="gap-2.5">
                    {group.items.map((item) => {
                      const index = rowIndex++;
                      return (
                        <Animated.View
                          key={item.id}
                          entering={
                            index < 8
                              ? FadeInDown.duration(240).delay(index * 35).springify().damping(26).stiffness(220)
                              : undefined
                          }
                        >
                          <Card className="flex-row items-center gap-3 p-4">
                            <View
                              className="h-11 w-11 items-center justify-center rounded-md bg-backgroundAlt"
                              accessible={false}
                            >
                              <PawPrint size={20} color="#0369A1" />
                            </View>
                            <View className="flex-1 gap-0.5">
                              <Text className="font-bodySemibold text-base text-foreground">
                                {formatAgendaTime(item.preferred_datetime!)}
                              </Text>
                              <Text className="font-body text-sm text-mutedForeground">
                                {item.pet_owner?.full_name ?? 'Cuidador'}
                                {item.pet?.name ? ` · ${item.pet.name}` : ''}
                              </Text>
                              <Text className="font-body text-xs text-mutedForeground">
                                {item.service?.name ?? 'Servicio general'}
                              </Text>
                            </View>
                          </Card>
                        </Animated.View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="gap-3">
          <Text className="font-heading text-lg text-foreground">Todas las solicitudes</Text>
          <Text className="font-body text-sm text-mutedForeground">
            En esta fase, la coordinación final ocurre por WhatsApp. Esta lista es tu registro completo de
            solicitudes de cita para medir volumen y tasa de respuesta.
          </Text>

          {requests.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="Aún no has recibido solicitudes de cita." />
          ) : (
            <View className="gap-3">
              {requests.map((request) => (
                <Card key={request.id} className="p-4 gap-3">
                  <View className="flex-row items-start justify-between gap-2">
                    <Text className="font-heading text-base text-foreground">
                      {request.pet_owner?.full_name ?? 'Usuario'}
                    </Text>
                    <Badge label={SERVICE_REQUEST_STATUS_LABELS[request.status]} tone={STATUS_TONE[request.status]} />
                  </View>

                  <Text className="font-body text-sm text-mutedForeground">
                    {request.pet?.name ? `Mascota: ${request.pet.name} · ` : ''}
                    {request.service?.name ?? 'Servicio general'}
                  </Text>

                  {request.pet_owner?.phone ? (
                    <Text className="font-body text-sm text-mutedForeground">Tel: {request.pet_owner.phone}</Text>
                  ) : null}
                  {request.notes ? (
                    <Text className="font-body text-sm text-mutedForeground">Nota: {request.notes}</Text>
                  ) : null}

                  <View className="flex-row flex-wrap gap-2">
                    {(Object.entries(SERVICE_REQUEST_STATUS_LABELS) as [ServiceRequestStatus, string][]).map(
                      ([value, label]) => (
                        <Chip
                          key={value}
                          label={label}
                          selected={request.status === value}
                          onPress={() => updateStatus(request.id, value)}
                        />
                      )
                    )}
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
