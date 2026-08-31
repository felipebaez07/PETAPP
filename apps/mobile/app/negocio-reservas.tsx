import { RESERVATION_STATUS_LABELS, type ReservationStatus } from '@petapp/shared';
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

interface ReservationRow {
  id: string;
  status: ReservationStatus;
  preferred_datetime: string | null;
  notes: string | null;
  created_at: string;
  pet_owner: { full_name: string; phone: string | null } | null;
  pet: { name: string } | null;
  service: { name: string } | null;
}

const STATUS_TONE: Record<ReservationStatus, BadgeTone> = {
  pendiente: 'muted',
  confirmada: 'success',
  completada: 'success',
  cancelada: 'destructive',
  no_asistio: 'destructive',
};

export default function NegocioReservasScreen() {
  const router = useRouter();
  const [establishmentId, setEstablishmentId] = useState<string | null | undefined>(undefined);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setEstablishmentId(user?.establishment?.id ?? null);
        if (user?.establishment) loadReservations(user.establishment.id);
      })
      .catch(() => setEstablishmentId(null));
  }, []);

  async function loadReservations(id: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select(
        'id, status, preferred_datetime, notes, created_at, pet_owner:profiles(full_name,phone), pet:pets(name), service:services(name)'
      )
      .eq('establishment_id', id)
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('No se pudo cargar tus reservas', error.message);
      return;
    }
    setReservations((data ?? []) as unknown as ReservationRow[]);
  }

  async function updateStatus(id: string, status: ReservationStatus) {
    if (!establishmentId) return;
    const { error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .eq('establishment_id', establishmentId);
    if (error) {
      Alert.alert('No se pudo actualizar', error.message);
      return;
    }
    await loadReservations(establishmentId);
  }

  if (establishmentId === undefined) {
    return <LoadingState label="Cargando tus reservas..." />;
  }

  if (establishmentId === null) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Solo para cuentas de negocio"
        description="Inicia sesión con una cuenta de establecimiento aliado para ver tus solicitudes de reserva."
        actionLabel="Volver"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 24 }}>
      <Text className="font-body text-sm text-mutedForeground">
        En esta fase, la coordinación real ocurre por WhatsApp. Esta lista es tu registro de solicitudes para medir
        volumen y tasa de conversión.
      </Text>

      {reservations.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="Aún no has recibido solicitudes de reserva." />
      ) : (
        <View className="gap-3">
          {reservations.map((reservation) => (
            <Card key={reservation.id} className="p-4 gap-3">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="font-heading text-base text-foreground">
                  {reservation.pet_owner?.full_name ?? 'Usuario'}
                </Text>
                <Badge
                  label={RESERVATION_STATUS_LABELS[reservation.status]}
                  tone={STATUS_TONE[reservation.status]}
                />
              </View>

              <Text className="font-body text-sm text-mutedForeground">
                {reservation.pet?.name ? `Mascota: ${reservation.pet.name} · ` : ''}
                {reservation.service?.name ?? 'Servicio general'}
              </Text>

              {reservation.pet_owner?.phone ? (
                <Text className="font-body text-sm text-mutedForeground">Tel: {reservation.pet_owner.phone}</Text>
              ) : null}
              {reservation.notes ? (
                <Text className="font-body text-sm text-mutedForeground">Nota: {reservation.notes}</Text>
              ) : null}

              <View className="flex-row flex-wrap gap-2">
                {(Object.entries(RESERVATION_STATUS_LABELS) as [ReservationStatus, string][]).map(
                  ([value, label]) => (
                    <Chip
                      key={value}
                      label={label}
                      selected={reservation.status === value}
                      onPress={() => updateStatus(reservation.id, value)}
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
