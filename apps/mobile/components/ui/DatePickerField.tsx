import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Platform, Pressable, Text, View } from 'react-native';

type PickerMode = 'date' | 'datetime';

interface DatePickerFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  helperText?: string;
  /** 'date' (por defecto) guarda "AAAA-MM-DD"; 'datetime' guarda un ISO completo (para `timestamptz`). */
  mode?: PickerMode;
}

/** Convierte "AAAA-MM-DD" (modo date) o un ISO completo (modo datetime) al `Date` del picker. */
function toDate(value: string | undefined, mode: PickerMode): Date {
  if (value) {
    const parsed = new Date(mode === 'date' ? `${value}T00:00:00` : value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

/** Serializa a "AAAA-MM-DD" en hora local (evita el corrimiento de un día que da `toISOString`). */
function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Combina la fecha de un `Date` con la hora de otro (para el paso date→time en Android). */
function combineDateAndTime(datePart: Date, timePart: Date): Date {
  const combined = new Date(datePart);
  combined.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return combined;
}

function formatDisplay(value: string, mode: PickerMode): string {
  const date = new Date(mode === 'date' ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return '';
  if (mode === 'date') {
    const label = date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const label = date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
  return `${label.charAt(0).toUpperCase() + label.slice(1)} · ${time}`;
}

/**
 * Selector de fecha (u hora) real (nativo) controlado por react-hook-form — mismo shape de
 * props que `FormTextField`/`ChipSelectField`. En Android se cierra solo al elegir; en iOS el
 * picker queda inline con un botón "Listo" (el modo `display="default"`/`inline` de iOS no es
 * un modal flotante, hay que darle una forma explícita de cerrarlo). En modo `datetime`, Android
 * no soporta un solo control combinado — se encadenan dos pasos (fecha, luego hora); iOS sí
 * soporta `mode="datetime"` en un único control inline.
 * Ver `DatePickerField.web.tsx` para la variante de navegador (`<input type="date"|"datetime-local">`).
 */
export function DatePickerField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Selecciona una fecha',
  helperText,
  mode = 'date',
}: DatePickerFieldProps<TFieldValues>) {
  const [androidStage, setAndroidStage] = useState<'idle' | 'date' | 'time'>('idle');
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [pendingDatePart, setPendingDatePart] = useState<Date | null>(null);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const stringValue = typeof value === 'string' ? value : '';

        function openPicker() {
          // En Android, tanto 'date' como 'datetime' arrancan por el paso de fecha
          // (en modo datetime, elegir la hora es un segundo paso encadenado, ver abajo).
          if (Platform.OS === 'ios') {
            setIosPickerOpen(true);
          } else {
            setAndroidStage('date');
          }
        }

        function handleIosChange(event: DateTimePickerEvent, selectedDate?: Date) {
          if (event.type === 'dismissed' || !selectedDate) return;
          onChange(mode === 'date' ? toIsoDate(selectedDate) : selectedDate.toISOString());
        }

        function handleAndroidDatePicked(event: DateTimePickerEvent, selectedDate?: Date) {
          setAndroidStage('idle');
          if (event.type === 'dismissed' || !selectedDate) return;
          if (mode === 'date') {
            onChange(toIsoDate(selectedDate));
            return;
          }
          // Modo datetime en Android: la fecha ya se eligió, ahora se pide la hora.
          setPendingDatePart(selectedDate);
          setAndroidStage('time');
        }

        function handleAndroidTimePicked(event: DateTimePickerEvent, selectedTime?: Date) {
          setAndroidStage('idle');
          if (event.type === 'dismissed' || !selectedTime || !pendingDatePart) return;
          onChange(combineDateAndTime(pendingDatePart, selectedTime).toISOString());
          setPendingDatePart(null);
        }

        return (
          <View className="gap-1.5">
            <Text className="font-bodySemibold text-sm text-foreground">{label}</Text>
            <Pressable
              onPress={openPicker}
              accessibilityRole="button"
              accessibilityLabel={label}
              className={`min-h-11 flex-row items-center gap-2 rounded-sm border bg-card px-3 ${
                error ? 'border-destructive' : 'border-border'
              }`}
            >
              <CalendarDays size={18} color="#64748B" />
              <Text
                className={`flex-1 py-3 font-body text-base ${stringValue ? 'text-foreground' : 'text-mutedForeground'}`}
              >
                {stringValue ? formatDisplay(stringValue, mode) : placeholder}
              </Text>
            </Pressable>
            {error ? (
              <Text className="font-body text-xs text-destructive">{error.message}</Text>
            ) : helperText ? (
              <Text className="font-body text-xs text-mutedForeground">{helperText}</Text>
            ) : null}

            {Platform.OS === 'ios' && iosPickerOpen ? (
              <View className="rounded-xl bg-card shadow-sm">
                <DateTimePicker
                  value={toDate(stringValue, mode)}
                  mode={mode}
                  display="inline"
                  onChange={handleIosChange}
                />
                <Pressable
                  onPress={() => setIosPickerOpen(false)}
                  accessibilityRole="button"
                  className="items-center border-t border-border py-3"
                >
                  <Text className="font-bodySemibold text-sm text-primary">Listo</Text>
                </Pressable>
              </View>
            ) : null}

            {Platform.OS === 'android' && androidStage === 'date' ? (
              <DateTimePicker
                value={toDate(stringValue, mode)}
                mode="date"
                display="default"
                onChange={handleAndroidDatePicked}
              />
            ) : null}
            {Platform.OS === 'android' && androidStage === 'time' ? (
              <DateTimePicker
                value={pendingDatePart ?? new Date()}
                mode="time"
                display="default"
                onChange={handleAndroidTimePicked}
              />
            ) : null}
          </View>
        );
      }}
    />
  );
}
