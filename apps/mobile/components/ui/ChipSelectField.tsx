import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Text, View } from 'react-native';

import { Chip } from './Chip';

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipSelectFieldProps<TFieldValues extends FieldValues, T extends string> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  options: ReadonlyArray<ChipOption<T>>;
}

/** Selector de una sola opción (enum) usando chips, controlado por react-hook-form. */
export function ChipSelectField<TFieldValues extends FieldValues, T extends string>({
  control,
  name,
  label,
  options,
}: ChipSelectFieldProps<TFieldValues, T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <View className="gap-1.5">
          <Text className="font-bodySemibold text-sm text-foreground">{label}</Text>
          <View className="flex-row flex-wrap gap-2">
            {options.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={value === option.value}
                onPress={() => onChange(option.value)}
              />
            ))}
          </View>
        </View>
      )}
    />
  );
}
