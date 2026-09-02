import { establishmentProfileSchema, type EstablishmentProfileFormValues } from '@petapp/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Building2, Image as ImageIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormTextField } from '@/components/ui/FormTextField';
import { LoadingState } from '@/components/ui/LoadingState';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { SwitchField } from '@/components/ui/SwitchField';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Establishment } from '@petapp/shared';

export default function NegocioPerfilScreen() {
  const router = useRouter();
  const [establishment, setEstablishment] = useState<Establishment | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((user) => setEstablishment(user?.establishment ?? null))
      .catch(() => setEstablishment(null));
  }, []);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<EstablishmentProfileFormValues>({
    resolver: zodResolver(establishmentProfileSchema),
    defaultValues: {
      name: establishment?.name ?? '',
      description: establishment?.description ?? '',
      address: establishment?.address ?? '',
      phone: establishment?.phone ?? '',
      whatsapp_number: establishment?.whatsapp_number ?? '',
      is_24_7: establishment?.is_24_7 ?? false,
      logo_url: establishment?.logo_url ?? '',
      cover_image_url: establishment?.cover_image_url ?? '',
    },
    values: establishment
      ? {
          name: establishment.name,
          description: establishment.description ?? '',
          address: establishment.address ?? '',
          phone: establishment.phone ?? '',
          whatsapp_number: establishment.whatsapp_number ?? '',
          is_24_7: establishment.is_24_7,
          logo_url: establishment.logo_url ?? '',
          cover_image_url: establishment.cover_image_url ?? '',
        }
      : undefined,
  });

  const logoUrl = watch('logo_url');
  const coverImageUrl = watch('cover_image_url');

  async function onSubmit(values: EstablishmentProfileFormValues) {
    if (!establishment) return;
    setSaved(false);
    const { error } = await supabase
      .from('establishments')
      .update({
        name: values.name,
        description: values.description || null,
        address: values.address || null,
        phone: values.phone || null,
        whatsapp_number: values.whatsapp_number || null,
        is_24_7: values.is_24_7,
        logo_url: values.logo_url || null,
        cover_image_url: values.cover_image_url || null,
      })
      .eq('id', establishment.id);

    if (error) {
      Alert.alert('No se pudo guardar', error.message);
      return;
    }
    setSaved(true);
  }

  if (establishment === undefined) {
    return <LoadingState label="Cargando perfil del negocio..." />;
  }

  if (establishment === null) {
    return (
      <EmptyState
        icon={Building2}
        title="Solo para cuentas de negocio"
        description="Inicia sesión con una cuenta de establecimiento aliado para editar tu perfil."
        actionLabel="Volver"
        onAction={() => router.back()}
      />
    );
  }

  const is24h = watch('is_24_7');

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 24 }}>
      <View className="gap-1">
        <Text className="font-heading text-lg text-foreground">Información pública</Text>
        <Text className="font-body text-sm text-mutedForeground">
          Esta información aparece en tu ficha del directorio.
        </Text>
      </View>

      <View className="gap-4">
        <FormTextField control={control} name="name" label="Nombre del negocio" placeholder="Ej. Veterinaria San Roque" />
        <FormTextField
          control={control}
          name="description"
          label="Descripción (opcional)"
          placeholder="Breve descripción de tu negocio"
          multiline
        />
        <FormTextField control={control} name="address" label="Dirección (opcional)" placeholder="Ej. Calle 10 # 5-20" />
        <FormTextField control={control} name="phone" label="Teléfono (opcional)" placeholder="Ej. 6011234567" keyboardType="phone-pad" />
        <FormTextField
          control={control}
          name="whatsapp_number"
          label="WhatsApp (opcional)"
          placeholder="573001234567"
          helperText="Código de país sin +"
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
        <SwitchField
          label="Atendemos las 24 horas, todos los días"
          value={is24h}
          onValueChange={(value) => setValue('is_24_7', value, { shouldDirty: true })}
        />
      </View>

      <View className="gap-1">
        <Text className="font-heading text-lg text-foreground">Personaliza tu marca</Text>
        <Text className="font-body text-sm text-mutedForeground">
          Tu logo se ve en el directorio y en tu ficha pública. Por ahora se guarda como enlace — la subida de
          archivos llega más adelante.
        </Text>
      </View>

      <View className="gap-4">
        <View className="flex-row items-end gap-3">
          <RemoteImage uri={logoUrl} size={56} icon={Building2} />
          <View className="flex-1">
            <FormTextField
              control={control}
              name="logo_url"
              label="Logo (URL)"
              placeholder="https://..."
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>

        <View className="flex-row items-end gap-3">
          <RemoteImage uri={coverImageUrl} size={56} icon={ImageIcon} />
          <View className="flex-1">
            <FormTextField
              control={control}
              name="cover_image_url"
              label="Foto de portada (URL)"
              placeholder="https://..."
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>
      </View>

      {saved ? <Text className="font-body text-sm text-success">Cambios guardados.</Text> : null}

      <Button label="Guardar cambios" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
    </ScrollView>
  );
}
