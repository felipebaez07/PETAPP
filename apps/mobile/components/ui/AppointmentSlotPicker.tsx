import { appointmentSlotHours, formatAppointmentSlotLabel } from '@petapp/shared';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Platform, Pressable, Text, View } from 'react-native';

interface AppointmentSlotPickerProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  helperText?: string;
}

/**
 * Reemplaza el picker de fecha+hora libre (reloj completo) por día + franjas de una hora —
 * mismo pedido que la variante web (`appointment-slot-picker.tsx`): nada de elegir cualquier
 * minuto, solo bloques como "1:00 p. m. – 2:00 p. m.". Sigue guardando un ISO completo en el
 * mismo campo de siempre (`preferred_datetime`), así que no cambia nada del lado de Supabase.
 * A diferencia de `DatePickerField` (que sigue usándose para fechas de vacunas/controles, sin
 * hora), este componente es propio del flujo de solicitud de cita.
 */
export function AppointmentSlotPicker<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  helperText,
}: AppointmentSlotPickerProps<TFieldValues>) {
  const { field } = useController({ control, name });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [day, setDay] = useState<Date | null>(null);
  const [hour, setHour] = useState<number | null>(null);

  // Si el formulario se resetea desde afuera (ej. tras enviar la solicitud), el valor vuelve a
  // estar vacío — hay que limpiar la selección local de día/hora para que no quede desincronizada.
  useEffect(() => {
    if (!field.value) {
      setDay(null);
      setHour(null);
    }
  }, [field.value]);

  function applyDate(date?: Date) {
    if (!date) return;
    setDay(date);
    setHour(null);
    field.onChange('');
  }

  function handleIosChange(event: DateTimePickerEvent, date?: Date) {
    if (event.type === 'dismissed') return;
    applyDate(date);
  }

  function handleAndroidChange(event: DateTimePickerEvent, date?: Date) {
    setPickerOpen(false);
    if (event.type === 'dismissed') return;
    applyDate(date);
  }

  function pickHour(h: number) {
    if (!day) return;
    setHour(h);
    const combined = new Date(day);
    combined.setHours(h, 0, 0, 0);
    field.onChange(combined.toISOString());
  }

  const dayLabel = day
    ? day.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <View className="gap-1.5">
      <Text className="font-bodySemibold text-sm text-foreground">{label}</Text>
      <Pressable
        onPress={() => setPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
        className="min-h-11 flex-row items-center gap-2 rounded-sm border border-border bg-card px-3"
      >
        <CalendarDays size={18} color="#64748B" />
        <Text className={`flex-1 py-3 font-body text-base ${dayLabel ? 'text-foreground' : 'text-mutedForeground'}`}>
          {dayLabel ?? 'Elegir un día'}
        </Text>
      </Pressable>

      {Platform.OS === 'ios' && pickerOpen ? (
        <View className="rounded-xl bg-card shadow-sm">
          <DateTimePicker
            value={day ?? new Date()}
            mode="date"
            display="inline"
            minimumDate={new Date()}
            onChange={handleIosChange}
          />
          <Pressable
            onPress={() => setPickerOpen(false)}
            accessibilityRole="button"
            style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            className="items-center border-t border-border py-3"
          >
            <Text className="font-bodySemibold text-sm text-primary">Listo</Text>
          </Pressable>
        </View>
      ) : null}
      {Platform.OS === 'android' && pickerOpen ? (
        <DateTimePicker
          value={day ?? new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleAndroidChange}
        />
      ) : null}

      {day ? (
        <View className="flex-row flex-wrap gap-2">
          {appointmentSlotHours().map((h) => (
            <Pressable
              key={h}
              onPress={() => pickHour(h)}
              className={`rounded-sm border px-3 py-2 ${hour === h ? 'border-primary bg-primary' : 'border-border bg-card'}`}
            >
              <Text className={`font-bodyMedium text-xs ${hour === h ? 'text-white' : 'text-foreground'}`}>
                {formatAppointmentSlotLabel(h)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {helperText ? <Text className="font-body text-xs text-mutedForeground">{helperText}</Text> : null}
    </View>
  );
}
