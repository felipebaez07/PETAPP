import {
  PREVENTIVE_EVENT_TYPE_LABELS,
  preventiveEventSchema,
  type AiRoadmapItem,
  type PreventiveEventType,
} from '@petapp/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarCheck, CircleCheck, Pencil, X } from 'lucide-react-native';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Pressable, Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { ChipSelectField } from '@/components/ui/ChipSelectField';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { FormTextField } from '@/components/ui/FormTextField';
import { supabase } from '@/lib/supabase';

const eventFieldsSchema = preventiveEventSchema.omit({ pet_id: true });
type EventFormValues = z.infer<typeof eventFieldsSchema>;

const TYPE_OPTIONS = Object.entries(PREVENTIVE_EVENT_TYPE_LABELS).map(([value, label]) => ({
  value: value as PreventiveEventType,
  label,
}));

function formatDatePretty(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

type Decision = 'pending' | 'accepted' | 'dismissed';

function RoadmapRow({ petId, item }: { petId: string; item: AiRoadmapItem }) {
  const [decision, setDecision] = useState<Decision>('pending');
  const [editing, setEditing] = useState(false);
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFieldsSchema),
    defaultValues: { type: item.type, title: item.title, due_date: item.due_date, notes: item.notes ?? '' },
  });

  async function handleAccept(values: EventFormValues) {
    const { error } = await supabase.from('preventive_events').insert({
      pet_id: petId,
      type: values.type,
      title: values.title,
      due_date: values.due_date,
      notes: values.notes || null,
    });
    if (error) {
      Alert.alert('No se pudo agendar', error.message);
      return;
    }
    setDecision('accepted');
    setEditing(false);
  }

  if (decision === 'accepted') {
    const values = form.getValues();
    return (
      <View className="flex-row items-center gap-2 rounded-xl bg-card p-3.5 shadow-sm">
        <CircleCheck size={16} color="#059669" />
        <Text className="flex-1 font-body text-sm text-success">Agendado: {values.title}</Text>
      </View>
    );
  }

  if (decision === 'dismissed') {
    return (
      <View className="flex-row items-center justify-between gap-2 rounded-xl bg-card p-3.5 shadow-sm">
        <Text className="flex-1 font-body text-sm text-mutedForeground">
          Solo la tuviste en cuenta: {item.title}
        </Text>
        <Pressable onPress={() => setDecision('pending')} hitSlop={8}>
          <Text className="font-bodySemibold text-sm text-primary">Deshacer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="gap-2.5 rounded-xl bg-card p-3.5 shadow-sm">
      {editing ? (
        <>
          <FormTextField control={form.control} name="title" label="Título" />
          <DatePickerField control={form.control} name="due_date" label="Fecha" />
          <ChipSelectField control={form.control} name="type" label="Tipo" options={TYPE_OPTIONS} />
          <FormTextField control={form.control} name="notes" label="Notas (opcional)" multiline />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                label="Guardar y agendar"
                icon={CalendarCheck}
                onPress={form.handleSubmit(handleAccept)}
                loading={form.formState.isSubmitting}
              />
            </View>
            <View className="flex-1">
              <Button label="Cancelar" variant="ghost" onPress={() => setEditing(false)} />
            </View>
          </View>
        </>
      ) : (
        <>
          <View>
            <Text className="font-bodySemibold text-sm text-foreground">{item.title}</Text>
            <Text className="font-body text-xs text-mutedForeground">
              {PREVENTIVE_EVENT_TYPE_LABELS[item.type]} · {formatDatePretty(item.due_date)}
            </Text>
            {item.notes ? <Text className="font-body text-xs text-mutedForeground">{item.notes}</Text> : null}
          </View>
          <View className="flex-row flex-wrap gap-2">
            <Button
              label="Aceptar y agendar"
              onPress={form.handleSubmit(handleAccept)}
              loading={form.formState.isSubmitting}
              fullWidth={false}
            />
            <Button label="Modificar" variant="outline" icon={Pencil} onPress={() => setEditing(true)} fullWidth={false} />
            <Button
              label="Solo tenerla en cuenta"
              variant="ghost"
              icon={X}
              onPress={() => setDecision('dismissed')}
              fullWidth={false}
            />
          </View>
        </>
      )}
    </View>
  );
}

export function PrediagnosticoRoadmap({ petId, items }: { petId: string; items: AiRoadmapItem[] }) {
  if (items.length === 0) return null;
  return (
    <View className="gap-3">
      <View>
        <Text className="font-heading text-base text-foreground">Ruta sugerida de seguimiento</Text>
        <Text className="font-body text-xs text-mutedForeground">
          Ideas de próximos pasos según lo que contaste — vos decidís si las agendás, las ajustás o solo las
          tenés en cuenta.
        </Text>
      </View>
      <View className="gap-2.5">
        {items.map((item, index) => (
          <RoadmapRow key={index} petId={petId} item={item} />
        ))}
      </View>
    </View>
  );
}
