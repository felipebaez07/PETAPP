import { petSchema, type PetFormValues } from '@petapp/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ChipSelectField } from '@/components/ui/ChipSelectField';
import { FormTextField } from '@/components/ui/FormTextField';
import { SwitchField } from '@/components/ui/SwitchField';
import { usePets } from '@/contexts/PetsContext';

const SPECIES_OPTIONS = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'otro', label: 'Otro' },
] as const;

const SEX_OPTIONS = [
  { value: 'macho', label: 'Macho' },
  { value: 'hembra', label: 'Hembra' },
  { value: 'desconocido', label: 'No sé' },
] as const;

export default function NewPetScreen() {
  const router = useRouter();
  const { addPet } = usePets();
  const [saving, setSaving] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PetFormValues>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: '',
      species: 'perro',
      breed: '',
      sex: 'desconocido',
      birth_date: '',
      sterilized: false,
      vaccinated: false,
      notes: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    const pet = await addPet(values);
    setSaving(false);
    if (!pet) {
      Alert.alert('No se pudo guardar', 'Intenta de nuevo en unos segundos.');
      return;
    }
    router.back();
  });

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 20 }}>
      <Text className="font-body text-sm text-mutedForeground">
        Completa la ficha básica de tu mascota. Podrás editarla más adelante.
      </Text>

      <FormTextField
        control={control}
        name="name"
        label="Nombre"
        placeholder="Ej. Max"
        autoCapitalize="words"
      />

      <ChipSelectField control={control} name="species" label="Especie" options={SPECIES_OPTIONS} />

      <FormTextField
        control={control}
        name="breed"
        label="Raza (opcional)"
        placeholder="Ej. Criollo, Labrador..."
        autoCapitalize="words"
      />

      <ChipSelectField control={control} name="sex" label="Sexo" options={SEX_OPTIONS} />

      <FormTextField
        control={control}
        name="birth_date"
        label="Fecha de nacimiento (opcional)"
        placeholder="AAAA-MM-DD"
        helperText="Si no la sabes con exactitud, puedes dejarla en blanco."
      />

      <View className="gap-2">
        <Controller
          control={control}
          name="sterilized"
          render={({ field: { value, onChange } }) => (
            <SwitchField label="Esterilizado/a" value={value} onValueChange={onChange} />
          )}
        />
        <Controller
          control={control}
          name="vaccinated"
          render={({ field: { value, onChange } }) => (
            <SwitchField label="Vacunado/a" value={value} onValueChange={onChange} />
          )}
        />
      </View>

      <View className="gap-3">
        <Button label="Guardar mascota" onPress={() => onSubmit()} loading={isSubmitting || saving} />
        <Button label="Cancelar" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}
