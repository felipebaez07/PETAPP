import {
  buildWhatsAppLink,
  buildGoogleMapsLink,
  CATEGORY_LABELS,
  DAY_LABELS,
  formatPhoneForDisplay,
  isOpenNow,
  type EstablishmentWithDetails,
} from '@petapp/shared';
import { Stack, useLocalSearchParams } from 'expo-router';
import { CalendarPlus, Info, MapPin, MessageCircle, Phone, SearchX, ShieldCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { StatusDot } from '@/components/ui/StatusDot';
import { usePets } from '@/contexts/PetsContext';
import { getCurrentUser, type CurrentUser } from '@/lib/auth';
import { fetchEstablishmentById } from '@/lib/data';
import { openExternalUrl } from '@/lib/linking';
import { supabase } from '@/lib/supabase';

export default function EstablishmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [establishment, setEstablishment] = useState<EstablishmentWithDetails | null | undefined>(
    undefined
  );
  const [loadError, setLoadError] = useState(false);
  const [viewer, setViewer] = useState<CurrentUser | null | undefined>(undefined);
  const { pets } = usePets();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [reservationNotes, setReservationNotes] = useState('');
  const [reservationSubmitting, setReservationSubmitting] = useState(false);
  const [reservationSent, setReservationSent] = useState(false);

  useEffect(() => {
    let active = true;
    fetchEstablishmentById(id)
      .then((data) => {
        if (active) setEstablishment(data);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((current) => {
        if (active) setViewer(current);
      })
      .catch(() => {
        if (active) setViewer(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loadError) {
    return (
      <>
        <Stack.Screen options={{ title: 'Error' }} />
        <EmptyState
          icon={SearchX}
          title="No se pudo cargar el establecimiento"
          description="Intenta de nuevo en unos segundos."
        />
      </>
    );
  }

  if (establishment === undefined) {
    return <LoadingState label="Cargando establecimiento..." />;
  }

  if (establishment === null) {
    return (
      <>
        <Stack.Screen options={{ title: 'No encontrado' }} />
        <EmptyState
          icon={SearchX}
          title="Establecimiento no encontrado"
          description="Puede que ya no esté disponible en el directorio."
        />
      </>
    );
  }

  const open = isOpenNow(establishment.hours, establishment.is_24_7);
  const verified = establishment.verification_status === 'verificado';
  const hoursByDay = new Map(establishment.hours.map((h) => [h.day_of_week, h]));
  const today = new Date().getDay();

  function handleWhatsApp() {
    if (!establishment || !establishment.whatsapp_number) return;
    const url = buildWhatsAppLink({
      whatsappNumber: establishment.whatsapp_number,
      establishmentName: establishment.name,
    });
    openExternalUrl(url, 'No se pudo abrir WhatsApp. Verifica que esté instalado.');
  }

  function handleCall() {
    if (!establishment || !establishment.phone) return;
    openExternalUrl(`tel:${establishment.phone}`, 'No se pudo iniciar la llamada.');
  }

  function handleOpenMaps() {
    if (!establishment) return;
    openExternalUrl(buildGoogleMapsLink(establishment), 'No se pudo abrir Google Maps.');
  }

  async function handleCreateReservation() {
    if (!establishment || !viewer) return;
    setReservationSubmitting(true);
    const { error } = await supabase.from('reservations').insert({
      pet_owner_id: viewer.profile.id,
      establishment_id: establishment.id,
      service_id: selectedServiceId || null,
      pet_id: selectedPetId || null,
      notes: reservationNotes.trim() || null,
    });
    setReservationSubmitting(false);
    if (error) {
      Alert.alert('No se pudo enviar la solicitud', error.message);
      return;
    }
    setReservationSent(true);
  }

  return (
    <>
      <Stack.Screen options={{ title: establishment.name }} />
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 20 }}>
        <View className="gap-2">
          <Text className="font-bodySemibold text-xs uppercase tracking-wide text-secondary">
            {CATEGORY_LABELS[establishment.category]}
          </Text>
          <Text className="font-headingBold text-2xl text-foreground">{establishment.name}</Text>
          <View className="flex-row items-center gap-3">
            <StatusDot
              open={open}
              openLabel={establishment.is_24_7 ? 'Abierto 24/7' : 'Abierto ahora'}
            />
            {verified ? <Badge label="Verificado" tone="success" icon={ShieldCheck} /> : null}
          </View>
        </View>

        {establishment.description ? (
          <Text className="font-body text-base leading-6 text-foreground">
            {establishment.description}
          </Text>
        ) : null}

        <View className="gap-3">
          <Text className="font-heading text-lg text-foreground">Horario</Text>
          {establishment.is_24_7 ? (
            <View className="flex-row items-center gap-2 rounded-md border border-border bg-card p-3">
              <Info size={16} color="#059669" />
              <Text className="font-bodyMedium text-sm text-foreground">
                Abierto las 24 horas, todos los días.
              </Text>
            </View>
          ) : (
            <View className="overflow-hidden rounded-md border border-border bg-card">
              {DAY_LABELS.map((label, dayIndex) => {
                const day = hoursByDay.get(dayIndex);
                const isToday = dayIndex === today;
                return (
                  <View
                    key={label}
                    className={[
                      'flex-row items-center justify-between px-4 py-2.5',
                      dayIndex < DAY_LABELS.length - 1 ? 'border-b border-border' : '',
                      isToday ? 'bg-backgroundAlt' : '',
                    ].join(' ')}
                  >
                    <Text
                      className={`font-bodyMedium text-sm ${isToday ? 'text-secondary' : 'text-foreground'}`}
                    >
                      {label}
                    </Text>
                    <Text className="font-body text-sm text-mutedForeground">
                      {day && !day.closed && day.open_time && day.close_time
                        ? `${day.open_time.slice(0, 5)} – ${day.close_time.slice(0, 5)}`
                        : 'Cerrado'}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View className="gap-3">
          <Text className="font-heading text-lg text-foreground">Servicios</Text>
          {establishment.services.length === 0 ? (
            <View className="flex-row items-center gap-2 rounded-md border border-border bg-card p-3">
              <Info size={16} color="#64748B" />
              <Text className="flex-1 font-body text-sm text-mutedForeground">
                Este establecimiento no tiene servicios con tarifa publicados. Contáctalo por
                WhatsApp para más información.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {establishment.services.map((service) => (
                <View key={service.id} className="rounded-md border border-border bg-card p-3">
                  <View className="flex-row items-start justify-between gap-2">
                    <Text className="flex-1 font-bodySemibold text-base text-foreground">
                      {service.name}
                    </Text>
                    {service.price_reference ? (
                      <Text className="font-bodySemibold text-sm text-secondary">
                        {service.price_reference}
                      </Text>
                    ) : null}
                  </View>
                  {service.description ? (
                    <Text className="mt-1 font-body text-sm text-mutedForeground">
                      {service.description}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="gap-3">
          <Text className="font-heading text-lg text-foreground">Ubicación</Text>
          {establishment.address ? (
            <View className="flex-row items-start gap-2">
              <MapPin size={18} color="#059669" />
              <Text className="flex-1 font-body text-base text-foreground">
                {establishment.address}, {establishment.city}
              </Text>
            </View>
          ) : null}
          <Button
            label="Ver en Google Maps"
            variant="outline"
            icon={MapPin}
            onPress={handleOpenMaps}
          />
        </View>

        {viewer?.profile.role === 'propietario' ? (
          <View className="gap-3 rounded-md border border-border bg-card p-4">
            <Text className="font-heading text-lg text-foreground">Solicitar reserva</Text>
            {reservationSent ? (
              <Text className="font-body text-sm text-success">
                Solicitud enviada. El aliado la verá en su panel de reservas.
              </Text>
            ) : (
              <>
                {establishment.services.length > 0 ? (
                  <View className="gap-2">
                    <Text className="font-bodySemibold text-sm text-foreground">Servicio (opcional)</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {establishment.services.map((service) => (
                        <Chip
                          key={service.id}
                          label={service.name}
                          selected={selectedServiceId === service.id}
                          onPress={() =>
                            setSelectedServiceId((prev) => (prev === service.id ? null : service.id))
                          }
                        />
                      ))}
                    </View>
                  </View>
                ) : null}
                {pets.length > 0 ? (
                  <View className="gap-2">
                    <Text className="font-bodySemibold text-sm text-foreground">Mascota (opcional)</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {pets.map((pet) => (
                        <Chip
                          key={pet.id}
                          label={pet.name}
                          selected={selectedPetId === pet.id}
                          onPress={() => setSelectedPetId((prev) => (prev === pet.id ? null : pet.id))}
                        />
                      ))}
                    </View>
                  </View>
                ) : null}
                <View className="gap-1.5">
                  <Text className="font-bodySemibold text-sm text-foreground">Notas (opcional)</Text>
                  <View className="min-h-11 rounded-sm border border-border bg-card px-3 py-2">
                    <TextInput
                      value={reservationNotes}
                      onChangeText={setReservationNotes}
                      placeholder="Ej. horario preferido, motivo de la visita"
                      placeholderTextColor="#64748B"
                      multiline
                      className="font-body text-base text-foreground"
                    />
                  </View>
                </View>
                <Button
                  label="Solicitar reserva"
                  variant="outline"
                  icon={CalendarPlus}
                  onPress={handleCreateReservation}
                  loading={reservationSubmitting}
                />
              </>
            )}
          </View>
        ) : null}

        <View className="gap-3">
          {establishment.whatsapp_number ? (
            <Button
              label="Reservar por WhatsApp"
              variant="secondary"
              size="lg"
              icon={MessageCircle}
              onPress={handleWhatsApp}
            />
          ) : null}
          {establishment.phone ? (
            <Button
              label={`Llamar · ${formatPhoneForDisplay(establishment.phone)}`}
              variant="outline"
              size="lg"
              icon={Phone}
              onPress={handleCall}
            />
          ) : null}
          {!establishment.whatsapp_number && !establishment.phone ? (
            <View className="flex-row items-center gap-2 rounded-md border border-border bg-card p-3">
              <Info size={16} color="#64748B" />
              <Text className="flex-1 font-body text-sm text-mutedForeground">
                Este establecimiento aún no tiene datos de contacto disponibles.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
