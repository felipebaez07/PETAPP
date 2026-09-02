import { CalendarDays } from 'lucide-react-native';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Text, View } from 'react-native';

interface DatePickerFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  helperText?: string;
}

/**
 * Variante web de `DatePickerField`: `@react-native-community/datetimepicker` no tiene
 * soporte completo en react-native-web, así que aquí se usa el `<input type="date">`
 * nativo del navegador (Metro/Expo resuelve este archivo `.web.tsx` en vez del `.tsx`
 * nativo cuando se hace `expo export --platform web`, sin necesidad de un `Platform.select`
 * en el sitio de uso). El mismo shape de props que la variante nativa.
 */
export function DatePickerField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  helperText,
}: DatePickerFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View className="gap-1.5">
          <Text className="font-bodySemibold text-sm text-foreground">{label}</Text>
          <View
            className={`min-h-11 flex-row items-center gap-2 rounded-sm border bg-card px-3 ${
              error ? 'border-destructive' : 'border-border'
            }`}
          >
            <CalendarDays size={18} color="#64748B" />
            {/* Elemento HTML nativo — react-native-web renderiza este archivo con react-dom,
                así que un <input> intrínseco es válido tanto en tiempo de ejecución como para
                los tipos de @types/react (JSX.IntrinsicElements incluye 'input' sin depender
                de la lib "dom" del tsconfig). */}
            <input
              type="date"
              value={typeof value === 'string' ? value : ''}
              onChange={(event: { target: { value: string } }) => onChange(event.target.value)}
              onBlur={onBlur}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: 16,
                color: '#0C2233',
                padding: '10px 0',
                minWidth: 0,
              }}
            />
          </View>
          {error ? (
            <Text className="font-body text-xs text-destructive">{error.message}</Text>
          ) : helperText ? (
            <Text className="font-body text-xs text-mutedForeground">{helperText}</Text>
          ) : null}
        </View>
      )}
    />
  );
}
