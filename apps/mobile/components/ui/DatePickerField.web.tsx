import { CalendarDays } from 'lucide-react-native';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Text, View } from 'react-native';

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

/** "AAAA-MM-DDTHH:mm" en hora LOCAL a partir de un ISO — es lo que espera `<input type="datetime-local">`. */
function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Variante web de `DatePickerField`: `@react-native-community/datetimepicker` no tiene
 * soporte completo en react-native-web, así que aquí se usa el `<input type="date">` /
 * `<input type="datetime-local">` nativo del navegador (Metro/Expo resuelve este archivo
 * `.web.tsx` en vez del `.tsx` nativo cuando se hace `expo export --platform web`, sin
 * necesidad de un `Platform.select` en el sitio de uso). El mismo shape de props que la
 * variante nativa.
 *
 * `datetime-local` trabaja en hora LOCAL sin offset — por eso `toLocalInputValue` arma el
 * string a mano con los getters locales del `Date` en vez de `toISOString()` (que da UTC y
 * correría fecha/hora). Al escribir de vuelta, `new Date("AAAA-MM-DDTHH:mm")` sin `Z` el
 * navegador lo interpreta como hora local, así que `.toISOString()` ahí sí es correcto para
 * guardar el instante real en `timestamptz`.
 */
export function DatePickerField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  helperText,
  mode = 'date',
}: DatePickerFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => {
        const stringValue = typeof value === 'string' ? value : '';
        const inputValue = mode === 'date' ? stringValue : stringValue ? toLocalInputValue(stringValue) : '';

        function handleChange(event: { target: { value: string } }) {
          const raw = event.target.value;
          if (!raw) {
            onChange('');
            return;
          }
          onChange(mode === 'date' ? raw : new Date(raw).toISOString());
        }

        return (
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
                type={mode === 'date' ? 'date' : 'datetime-local'}
                value={inputValue}
                onChange={handleChange}
                onBlur={onBlur}
                step={mode === 'datetime' ? 1800 : undefined}
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
        );
      }}
    />
  );
}
