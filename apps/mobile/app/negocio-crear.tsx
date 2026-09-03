import {
  CATEGORY_LABELS,
  createEstablishmentSchema,
  slugify,
  type CreateEstablishmentValues,
} from '@petapp/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Building2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ChipSelectField } from '@/components/ui/ChipSelectField';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormTextField } from '@/components/ui/FormTextField';
import { LoadingState } from '@/components/ui/LoadingState';
import { getCurrentUser, type CurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Solo veterinaria/profesional: el directorio y el pivot de producto ya excluyeron
// comercio/fundación (spec.md sección 2) — mismo criterio que el formulario equivalente en
// apps/web (`create-establishment-form.tsx`).
const CATEGORY_OPTIONS = [
  { value: 'veterinaria' as const, label: CATEGORY_LABELS.veterinaria },
  { value: 'profesional' as const, label: CATEGORY_LABELS.profesional },
];

/**
 * Autoservicio para una cuenta `establecimiento` recién registrada que todavía no tiene ningún
 * negocio vinculado (spec.md sección 2026-09-02) — antes la única vía era el formulario público
 * "Únete al piloto" + conversión manual de un admin, pensado para gente sin cuenta todavía. Mismo
 * fix que `createOwnEstablishment` en apps/web, adaptado a cliente directo (mobile no tiene
 * Server Actions): el negocio arranca en `verification_status='pendiente'` (default de la
 * columna) — sigue pasando por la validación del superadmin, esto solo evita que un registro
 * correcto quede sin nada que gestionar.
 */
export default function NegocioCrearScreen() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        Alert.alert('No se pudo cargar tu cuenta', 'Intenta de nuevo en unos segundos.');
        setUser(null);
      });
  }, []);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CreateEstablishmentValues>({
    resolver: zodResolver(createEstablishmentSchema),
    defaultValues: { name: '', category: 'veterinaria', address: '', phone: '', whatsapp_number: '' },
  });

  async function onSubmit(values: CreateEstablishmentValues) {
    if (!user) return;
    setErrorMessage(null);

    // El slug debe ser único (`establishments.slug` tiene `unique`) — si el nombre elegido ya
    // generó un slug existente, se le agrega un sufijo corto en vez de fallar con un error crudo
    // de constraint que el usuario no entendería. Mismo patrón que `createOwnEstablishment` (web).
    const baseSlug = slugify(values.name);
    let slug = baseSlug;
    const { data: existing } = await supabase.from('establishments').select('slug').eq('slug', slug).maybeSingle();
    if (existing) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const { error } = await supabase.from('establishments').insert({
      owner_id: user.profile.id,
      name: values.name,
      slug,
      category: values.category,
      city: 'Ibagué',
      address: values.address || null,
      phone: values.phone || null,
      whatsapp_number: values.whatsapp_number || null,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    Alert.alert(
      'Negocio creado',
      'Tu negocio ya aparece en el directorio como "Pendiente de verificación" hasta que el equipo del piloto confirme tus datos.'
    );
    router.replace('/(tabs)');
  }

  if (user === undefined) {
    return <LoadingState label="Cargando tu cuenta..." />;
  }

  if (!user || user.profile.role !== 'establecimiento') {
    return (
      <EmptyState
        icon={Building2}
        title="Solo para cuentas de negocio"
        description="Inicia sesión con una cuenta de establecimiento aliado para crear un negocio."
        actionLabel="Volver"
        onAction={() => router.back()}
      />
    );
  }

  if (user.establishment) {
    return (
      <EmptyState
        icon={Building2}
        title="Ya tienes un negocio creado"
        description="Tu cuenta ya tiene un negocio vinculado."
        actionLabel="Ver mi negocio"
        onAction={() => router.replace('/negocio-perfil')}
      />
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 24 }}>
      <View className="gap-1">
        <Text className="font-heading text-lg text-foreground">Crea el perfil de tu negocio</Text>
        <Text className="font-body text-sm text-mutedForeground">
          Tu cuenta ya está lista como prestador — solo falta este último paso. Tu negocio queda visible en el
          directorio marcado como &quot;Pendiente de verificación&quot; hasta que el equipo del piloto confirme
          tus datos.
        </Text>
      </View>

      <View className="gap-4">
        <FormTextField control={control} name="name" label="Nombre del negocio" placeholder="Ej. Veterinaria San José" />
        <ChipSelectField control={control} name="category" label="Categoría" options={CATEGORY_OPTIONS} />
        <FormTextField
          control={control}
          name="address"
          label="Dirección en Ibagué (opcional)"
          placeholder="Calle / carrera, barrio"
        />
        <FormTextField control={control} name="phone" label="Teléfono (opcional)" placeholder="6011234567" keyboardType="phone-pad" />
        <FormTextField
          control={control}
          name="whatsapp_number"
          label="WhatsApp (opcional)"
          placeholder="573001234567"
          helperText="Código de país sin +"
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
      </View>

      {errorMessage ? <Text className="font-body text-sm text-destructive">{errorMessage}</Text> : null}

      <Button label="Crear mi negocio" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
    </ScrollView>
  );
}
