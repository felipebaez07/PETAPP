import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface FormTextFieldProps<TFieldValues extends FieldValues> extends Omit<TextInputProps, 'style'> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  helperText?: string;
  icon?: LucideIcon;
}

/** Input de texto controlado por react-hook-form, con estado de foco/error propios. */
export function FormTextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  helperText,
  icon: Icon,
  ...inputProps
}: FormTextFieldProps<TFieldValues>) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View className="gap-1.5">
          <Text className="font-bodySemibold text-sm text-foreground">{label}</Text>
          <View
            className={`flex-row items-center gap-2 rounded-sm border bg-card px-3 ${
              error ? 'border-destructive' : isFocused ? 'border-primary' : 'border-border'
            }`}
          >
            {Icon ? <Icon size={18} color="#64748B" /> : null}
            <TextInput
              {...inputProps}
              value={typeof value === 'string' ? value : value != null ? String(value) : ''}
              onChangeText={onChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                onBlur();
              }}
              placeholderTextColor="#64748B"
              className="min-h-11 flex-1 font-body text-base text-foreground"
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
