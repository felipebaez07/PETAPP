import {
  DEMO_PET_DOCUMENTS,
  DEMO_PREVENTIVE_EVENTS,
  petDocumentSchema,
  preventiveEventSchema,
  SPECIES_LABELS,
  type PetDocument,
  type PreventiveEvent,
} from '@petapp/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Cat, CheckCircle2, ClipboardPlus, Dog, FilePlus2, PawPrint, XCircle } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { ChipSelectField } from '@/components/ui/ChipSelectField';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormTextField } from '@/components/ui/FormTextField';
import { PetDocumentRow } from '@/components/PetDocumentRow';
import { PreventiveEventRow } from '@/components/PreventiveEventRow';
import { usePets } from '@/contexts/PetsContext';
import { fetchPetDocumentsByPet, fetchPreventiveEventsByPet } from '@/lib/data';
import { formatPetAge, SEX_LABELS } from '@/lib/labels';
import { supabase } from '@/lib/supabase';

const SPECIES_ICON = { perro: Dog, gato: Cat, otro: PawPrint } as const;

const EVENT_TYPE_OPTIONS = [
  { value: 'vacuna', label: 'Vacuna' },
  { value: 'control', label: 'Control' },
  { value: 'desparasitacion', label: 'Desparasitación' },
  { value: 'otro', label: 'Otro' },
] as const;

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'carnet_vacunacion', label: 'Carné de vacunación' },
  { value: 'historia_clinica', label: 'Historia clínica' },
  { value: 'otro', label: 'Otro' },
] as const;

// `pet_id` se omite de los esquemas de formulario: el schema compartido lo valida
// como uuid, pero las mascotas de demo usan ids locales ("demo-pet-1") — el id real
// se inyecta a mano al guardar (ver handleAddEvent/handleAddDocument), nunca lo llena
// el usuario ni pasa por esta validación.
const eventFieldsSchema = preventiveEventSchema.omit({ pet_id: true });
type EventFormValues = z.infer<typeof eventFieldsSchema>;

const documentFieldsSchema = petDocumentSchema.omit({ pet_id: true });
type DocumentFormValues = z.infer<typeof documentFieldsSchema>;

const EMPTY_EVENT: EventFormValues = {
  type: 'vacuna',
  title: '',
  due_date: '',
  notes: '',
};

const EMPTY_DOCUMENT: DocumentFormValues = {
  title: '',
  document_url: '',
  document_type: 'carnet_vacunacion',
};

function sortByDueDate(events: PreventiveEvent[]): PreventiveEvent[] {
  return [...events].sort((a, b) => a.due_date.localeCompare(b.due_date));
}

/** Historial: eventos ya completados, más recientes primero (por fecha de completado). */
function sortByCompletedDesc(events: PreventiveEvent[]): PreventiveEvent[] {
  return [...events].sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''));
}

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { pets, isDemo } = usePets();
  const pet = useMemo(() => pets.find((p) => p.id === id), [pets, id]);

  const [events, setEvents] = useState<PreventiveEvent[]>([]);
  const [documents, setDocuments] = useState<PetDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // El cuidador pidió distinguir claramente lo pendiente (próximo/vencido, ver
  // PreventiveEventRow) del historial de lo ya hecho, en vez de una sola lista mezclada.
  const pendingEvents = useMemo(() => sortByDueDate(events.filter((e) => !e.completed_at)), [events]);
  const historyEvents = useMemo(() => sortByCompletedDesc(events.filter((e) => e.completed_at)), [events]);

  useEffect(() => {
    let active = true;
    if (!pet) {
      setLoading(false);
      return;
    }
    if (isDemo) {
      // `isDemo` (sin propietario real, ver PetsContext) puede darse incluso con
      // Supabase configurado — estas mascotas de ejemplo no tienen fila real en
      // `pets`, así que nunca se consulta el backend con su id.
      setEvents(sortByDueDate(DEMO_PREVENTIVE_EVENTS.filter((e) => e.pet_id === pet.id)));
      setDocuments(DEMO_PET_DOCUMENTS.filter((d) => d.pet_id === pet.id));
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([fetchPreventiveEventsByPet(pet.id), fetchPetDocumentsByPet(pet.id)])
      .then(([ev, docs]) => {
        if (!active) return;
        setEvents(sortByDueDate(ev));
        setDocuments(docs);
      })
      .catch(() => {
        // Sin este catch, un error de red dejaba las listas vacías y mostraba los empty
        // states ("Sin documentos todavía") como si de verdad no hubiera nada guardado.
        if (active) Alert.alert('No se pudo cargar la ficha', 'Intenta de nuevo en unos segundos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pet, isDemo]);

  const eventForm = useForm<EventFormValues>({
    resolver: zodResolver(eventFieldsSchema),
    defaultValues: EMPTY_EVENT,
  });
  const documentForm = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFieldsSchema),
    defaultValues: EMPTY_DOCUMENT,
  });

  if (!pet) {
    return (
      <>
        <Stack.Screen options={{ title: 'Mascota' }} />
        <EmptyState
          icon={PawPrint}
          title="Mascota no encontrada"
          description="Puede que ya no esté en tu lista."
          actionLabel="Volver a mis mascotas"
          onAction={() => router.back()}
        />
      </>
    );
  }

  const SpeciesIcon = SPECIES_ICON[pet.species];

  async function handleAddEvent(values: EventFormValues) {
    if (isDemo) {
      const now = new Date().toISOString();
      const newEvent: PreventiveEvent = {
        id: `local-event-${Date.now()}`,
        pet_id: pet!.id,
        type: values.type,
        title: values.title,
        due_date: values.due_date,
        completed_at: null,
        reminder_sent_at: null,
        notes: values.notes || null,
        created_by: null,
        created_at: now,
        updated_at: now,
      };
      setEvents((prev) => sortByDueDate([...prev, newEvent]));
      eventForm.reset(EMPTY_EVENT);
      return;
    }
    const { data, error } = await supabase
      .from('preventive_events')
      .insert({ pet_id: pet!.id, type: values.type, title: values.title, due_date: values.due_date, notes: values.notes || null })
      .select()
      .single();
    if (error) {
      Alert.alert('No se pudo agregar el recordatorio', error.message);
      return;
    }
    setEvents((prev) => sortByDueDate([...prev, data as PreventiveEvent]));
    eventForm.reset(EMPTY_EVENT);
  }

  async function handleToggleEvent(event: PreventiveEvent) {
    const nextCompletedAt = event.completed_at ? null : new Date().toISOString();

    if (isDemo) {
      setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, completed_at: nextCompletedAt } : e)));
      return;
    }
    const { data, error } = await supabase
      .from('preventive_events')
      .update({ completed_at: nextCompletedAt })
      .eq('id', event.id)
      .select()
      .single();
    if (error) {
      Alert.alert('No se pudo actualizar', error.message);
      return;
    }
    setEvents((prev) => prev.map((e) => (e.id === event.id ? (data as PreventiveEvent) : e)));
  }

  function handleDeleteEvent(event: PreventiveEvent) {
    Alert.alert('Eliminar recordatorio', `¿Eliminar "${event.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!isDemo) {
            const { error } = await supabase.from('preventive_events').delete().eq('id', event.id);
            if (error) {
              Alert.alert('No se pudo eliminar', error.message);
              return;
            }
          }
          setEvents((prev) => prev.filter((e) => e.id !== event.id));
        },
      },
    ]);
  }

  async function handleAddDocument(values: DocumentFormValues) {
    if (isDemo) {
      const newDocument: PetDocument = {
        id: `local-document-${Date.now()}`,
        pet_id: pet!.id,
        title: values.title,
        document_url: values.document_url || null,
        storage_path: values.storage_path ?? null,
        document_type: values.document_type,
        uploaded_by: null,
        created_at: new Date().toISOString(),
      };
      setDocuments((prev) => [newDocument, ...prev]);
      documentForm.reset(EMPTY_DOCUMENT);
      return;
    }
    const { data, error } = await supabase
      .from('pet_documents')
      .insert({
        pet_id: pet!.id,
        title: values.title,
        document_url: values.document_url,
        document_type: values.document_type,
      })
      .select()
      .single();
    if (error) {
      Alert.alert('No se pudo agregar el documento', error.message);
      return;
    }
    setDocuments((prev) => [data as PetDocument, ...prev]);
    documentForm.reset(EMPTY_DOCUMENT);
  }

  function handleDeleteDocument(doc: PetDocument) {
    Alert.alert('Eliminar documento', `¿Eliminar "${doc.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!isDemo) {
            const { error } = await supabase.from('pet_documents').delete().eq('id', doc.id);
            if (error) {
              Alert.alert('No se pudo eliminar', error.message);
              return;
            }
          }
          setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: pet.name }} />
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 28 }}>
        <View className="flex-row items-center gap-3 rounded-xl bg-card p-4 shadow-sm">
          <View
            className="h-14 w-14 items-center justify-center rounded-md bg-backgroundAlt"
            accessible={false}
          >
            <SpeciesIcon size={28} color="#059669" />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-headingBold text-xl tracking-tight text-foreground">{pet.name}</Text>
            <Text className="font-body text-sm text-mutedForeground">
              {SPECIES_LABELS[pet.species]}
              {pet.breed ? ` · ${pet.breed}` : ''} · {SEX_LABELS[pet.sex]}
            </Text>
            <Text className="font-body text-sm text-mutedForeground">{formatPetAge(pet.birth_date)}</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          <View className="flex-row items-center gap-1 rounded-sm bg-muted px-2 py-1">
            {pet.sterilized ? <CheckCircle2 size={14} color="#059669" /> : <XCircle size={14} color="#64748B" />}
            <Text className={`font-bodyMedium text-xs ${pet.sterilized ? 'text-success' : 'text-mutedForeground'}`}>
              {pet.sterilized ? 'Esterilizado' : 'No esterilizado'}
            </Text>
          </View>
          <View className="flex-row items-center gap-1 rounded-sm bg-muted px-2 py-1">
            {pet.vaccinated ? <CheckCircle2 size={14} color="#059669" /> : <XCircle size={14} color="#64748B" />}
            <Text className={`font-bodyMedium text-xs ${pet.vaccinated ? 'text-success' : 'text-mutedForeground'}`}>
              {pet.vaccinated ? 'Vacunado' : 'Sin vacunas registradas'}
            </Text>
          </View>
        </View>

        {pet.notes ? (
          <View className="gap-1">
            <Text className="font-heading text-base text-foreground">Notas</Text>
            <Text className="font-body text-sm text-mutedForeground">{pet.notes}</Text>
          </View>
        ) : null}

        {/* Calendario preventivo */}
        <View className="gap-3">
          <Text className="font-heading text-lg text-foreground">Calendario preventivo</Text>

          <View className="gap-3 rounded-xl bg-card p-4 shadow-sm">
            <FormTextField
              control={eventForm.control}
              name="title"
              label="Título"
              placeholder="Ej. Refuerzo antirrábico"
            />
            <ChipSelectField control={eventForm.control} name="type" label="Tipo" options={EVENT_TYPE_OPTIONS} />
            <DatePickerField control={eventForm.control} name="due_date" label="Fecha" />
            <FormTextField
              control={eventForm.control}
              name="notes"
              label="Notas (opcional)"
              placeholder="Ej. aplicar en Veterinaria Central"
              multiline
            />
            <Button
              label="Agregar al calendario"
              variant="outline"
              icon={ClipboardPlus}
              onPress={eventForm.handleSubmit(handleAddEvent)}
              loading={eventForm.formState.isSubmitting}
            />
          </View>

          {loading ? null : events.length === 0 ? (
            <EmptyState
              icon={ClipboardPlus}
              title="Todavía no tienes recordatorios"
              description="Agrega la próxima vacuna, control o desparasitación de tu mascota."
            />
          ) : (
            <>
              {/* Pendientes: próximo/vencido, ordenado por fecha más cercana primero. */}
              <View className="gap-2.5">
                <View className="flex-row items-center justify-between">
                  <Text className="font-bodySemibold text-sm uppercase tracking-wide text-mutedForeground">
                    Pendientes
                  </Text>
                  <Text className="font-body text-xs text-mutedForeground">
                    {pendingEvents.length}
                  </Text>
                </View>
                {pendingEvents.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="Sin pendientes"
                    description="No hay vacunas, controles ni desparasitaciones por hacer."
                  />
                ) : (
                  <View className="gap-2.5">
                    {pendingEvents.map((event, index) => (
                      <Animated.View
                        key={event.id}
                        entering={
                          index < 8
                            ? FadeInDown.duration(240).delay(index * 35).springify().damping(26).stiffness(220)
                            : undefined
                        }
                      >
                        <PreventiveEventRow
                          event={event}
                          onToggleComplete={handleToggleEvent}
                          onDelete={handleDeleteEvent}
                        />
                      </Animated.View>
                    ))}
                  </View>
                )}
              </View>

              {/* Historial: qué haceres ya se hicieron por esta mascota, más recientes primero. */}
              <View className="gap-2.5">
                <View className="flex-row items-center justify-between">
                  <Text className="font-bodySemibold text-sm uppercase tracking-wide text-mutedForeground">
                    Historial
                  </Text>
                  <Text className="font-body text-xs text-mutedForeground">
                    {historyEvents.length}
                  </Text>
                </View>
                {historyEvents.length === 0 ? (
                  <Text className="font-body text-sm text-mutedForeground">
                    Todavía no has marcado nada como completado.
                  </Text>
                ) : (
                  <View className="gap-2.5">
                    {historyEvents.map((event, index) => (
                      <Animated.View
                        key={event.id}
                        entering={
                          index < 8
                            ? FadeInDown.duration(240).delay(index * 35).springify().damping(26).stiffness(220)
                            : undefined
                        }
                      >
                        <PreventiveEventRow
                          event={event}
                          onToggleComplete={handleToggleEvent}
                          onDelete={handleDeleteEvent}
                        />
                      </Animated.View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {/* Documentos */}
        <View className="gap-3">
          <Text className="font-heading text-lg text-foreground">Documentos</Text>

          <View className="gap-3 rounded-xl bg-card p-4 shadow-sm">
            <FormTextField
              control={documentForm.control}
              name="title"
              label="Nombre del documento"
              placeholder="Ej. Carné de vacunación"
            />
            <ChipSelectField
              control={documentForm.control}
              name="document_type"
              label="Tipo"
              options={DOCUMENT_TYPE_OPTIONS}
            />
            <FormTextField
              control={documentForm.control}
              name="document_url"
              label="Enlace del documento"
              placeholder="https://..."
              helperText="Por ahora se guarda como enlace — la subida de archivos llega más adelante."
              autoCapitalize="none"
              keyboardType="url"
            />
            <Button
              label="Agregar documento"
              variant="outline"
              icon={FilePlus2}
              onPress={documentForm.handleSubmit(handleAddDocument)}
              loading={documentForm.formState.isSubmitting}
            />
          </View>

          {loading ? null : documents.length === 0 ? (
            <EmptyState
              icon={FilePlus2}
              title="Sin documentos todavía"
              description="Guarda aquí el carné de vacunación o la historia clínica de tu mascota."
            />
          ) : (
            <View className="gap-2.5">
              {documents.map((doc, index) => (
                <Animated.View
                  key={doc.id}
                  entering={
                    index < 8
                      ? FadeInDown.duration(240).delay(index * 35).springify().damping(26).stiffness(220)
                      : undefined
                  }
                >
                  <PetDocumentRow document={doc} onDelete={handleDeleteDocument} />
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
