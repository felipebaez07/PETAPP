import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Platform, Pressable, Text, View } from 'react-native';

interface DatePickerFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  helperText?: string;
}

/** Convierte "AAAA-MM-DD" (o vacío) al `Date` que espera el picker nativo. */
function toDate(value: string | undefined): Date {
  if (value) {
    const parsed = new Date(`${value}T00:00:00`);
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

function formatDisplay(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const label = date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Selector de fecha real (nativo) controlado por react-hook-form — mismo shape de props
 * que `FormTextField`/`ChipSelectField`. En Android se cierra solo al elegir un día; en
 * iOS el picker queda inline con un botón "Listo" (el modo `display="default"` de iOS no
 * es un modal flotante, hay que darle una forma explícita de cerrarlo).
 * Ver `DatePickerField.web.tsx` para la variante de navegador (`<input type="date">`).
 */
export function DatePickerField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Selecciona una fecha',
  helperText,
}: DatePickerFieldProps<TFieldValues>) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const stringValue = typeof value === 'string' ? value : '';

        function handleChange(event: DateTimePickerEvent, selectedDate?: Date) {
          if (Platform.OS === 'android') {
            setShowPicker(false);
          }
          if (event.type === 'dismissed') return;
          if (selectedDate) onChange(toIsoDate(selectedDate));
        }

        return (
          <View className="gap-1.5">
            <Text className="font-bodySemibold text-sm text-foreground">{label}</Text>
            <Pressable
              onPress={() => setShowPicker(true)}
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
                {stringValue ? formatDisplay(stringValue) : placeholder}
              </Text>
            </Pressable>
            {error ? (
              <Text className="font-body text-xs text-destructive">{error.message}</Text>
            ) : helperText ? (
              <Text className="font-body text-xs text-mutedForeground">{helperText}</Text>
            ) : null}

            {showPicker ? (
              <View className={Platform.OS === 'ios' ? 'rounded-xl bg-card shadow-sm' : undefined}>
                <DateTimePicker
                  value={toDate(stringValue)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={handleChange}
                />
                {Platform.OS === 'ios' ? (
                  <Pressable
                    onPress={() => setShowPicker(false)}
                    accessibilityRole="button"
                    className="items-center border-t border-border py-3"
                  >
                    <Text className="font-bodySemibold text-sm text-primary">Listo</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      }}
    />
  );
}
