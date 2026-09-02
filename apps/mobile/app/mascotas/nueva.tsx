import { petSchema, type PetFormValues } from '@petapp/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { PawPrint } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ChipSelectField } from '@/components/ui/ChipSelectField';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { FormTextField } from '@/components/ui/FormTextField';
import { SwitchField } from '@/components/ui/SwitchField';
import { usePets } from '@/contexts/PetsContext';
import { supabase } from '@/lib/supabase';
import {
  fileExtensionFromName,
  pickImageFromLibrary,
  uploadFileToBucket,
  validatePhotoAsset,
  type PickedFile,
} from '@/lib/uploads';

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
  const { addPet, isDemo } = usePets();
  const [saving, setSaving] = useState(false);
  const [photoAsset, setPhotoAsset] = useState<PickedFile | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
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

  async function handlePickPhoto() {
    setPhotoError(null);
    const asset = await pickImageFromLibrary();
    if (!asset) return;
    const validationError = validatePhotoAsset(asset);
    if (validationError) {
      setPhotoError(validationError);
      return;
    }
    setPhotoAsset(asset);
  }

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    const pet = await addPet(values);
    if (!pet) {
      setSaving(false);
      Alert.alert('No se pudo guardar', 'Intenta de nuevo en unos segundos.');
      return;
    }

    // Recién ahora se conoce el `pet_id` real que exige la convención de ruta
    // `<auth.uid()>/<pet_id>/<archivo>` de las policies de Storage
    // (0007_pet_media_storage.sql). En modo demo (sin propietario real, `isDemo`) no hay una
    // fila real en `pets` ni un `auth.uid()` válido para esa ruta, así que la foto no se sube
    // — la mascota queda creada igual, solo sin foto.
    if (photoAsset && !isDemo) {
      const ext = fileExtensionFromName(photoAsset.name, 'jpg');
      const path = `${pet.owner_id}/${pet.id}/photo.${ext}`;
      const { error: uploadError } = await uploadFileToBucket('pet-photos', path, photoAsset);
      if (!uploadError) {
        const { data } = supabase.storage.from('pet-photos').getPublicUrl(path);
        await supabase.from('pets').update({ photo_url: data.publicUrl }).eq('id', pet.id);
      } else {
        setSaving(false);
        Alert.alert('La mascota se guardó, pero la foto no se pudo subir', 'Puedes intentarlo de nuevo luego desde su ficha.');
        router.back();
        return;
      }
    }

    setSaving(false);
    router.back();
  });

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 20 }}>
      <Text className="font-body text-sm text-mutedForeground">
        Completa la ficha básica de tu mascota. Podrás editarla más adelante.
      </Text>

      <View className="items-center gap-2">
        <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-backgroundAlt">
          {photoAsset ? (
            <Image source={{ uri: photoAsset.uri }} style={{ width: 96, height: 96 }} resizeMode="cover" />
          ) : (
            <PawPrint size={40} color="#0369A1" />
          )}
        </View>
        <Button
          label={photoAsset ? 'Cambiar foto' : 'Elegir foto (opcional)'}
          variant="outline"
          size="md"
          fullWidth={false}
          onPress={handlePickPhoto}
        />
        {photoError ? <Text className="font-body text-xs text-destructive">{photoError}</Text> : null}
      </View>

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

      <DatePickerField
        control={control}
        name="birth_date"
        label="Fecha de nacimiento (opcional)"
        placeholder="Selecciona una fecha"
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
