import { SERVICE_REQUEST_STATUS_LABELS, type ServiceRequestStatus } from '@petapp/shared';
import { useRouter } from 'expo-router';
import { CalendarCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

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

export default function NegocioSolicitudesScreen() {
  const router = useRouter();
  const [establishmentId, setEstablishmentId] = useState<string | null | undefined>(undefined);
  const [requests, setRequests] = useState<ServiceRequestRow[]>([]);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setEstablishmentId(user?.establishment?.id ?? null);
        if (user?.establishment) loadRequests(user.establishment.id);
      })
      .catch(() => setEstablishmentId(null));
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

  if (establishmentId === undefined) {
    return <LoadingState label="Cargando tus solicitudes..." />;
  }

  if (establishmentId === null) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Solo para cuentas de negocio"
        description="Inicia sesión con una cuenta de establecimiento aliado para ver tus solicitudes de cita."
        actionLabel="Volver"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 24 }}>
      <Text className="font-body text-sm text-mutedForeground">
        En esta fase, la coordinación final ocurre por WhatsApp. Esta lista es tu registro de solicitudes de cita
        para medir volumen y tasa de respuesta.
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
    </ScrollView>
  );
}
