import {
  ADOPTION_STATUS_LABELS,
  adoptionPostSchema,
  SPECIES_LABELS,
  type AdoptionPost,
  type AdoptionPostFormValues,
} from '@petapp/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Cat, Dog, Heart, PawPrint } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ChipSelectField } from '@/components/ui/ChipSelectField';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormTextField } from '@/components/ui/FormTextField';
import { LoadingState } from '@/components/ui/LoadingState';
import { SwitchField } from '@/components/ui/SwitchField';
import { getCurrentUser, type CurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const SPECIES_ICON = { perro: Dog, gato: Cat, otro: PawPrint } as const;

const STATUS_TONE: Record<AdoptionPost['status'], BadgeTone> = {
  disponible: 'accent', // único uso permitido del ámbar: contenido de adopción
  en_proceso: 'secondary',
  adoptado: 'muted',
  retirado: 'muted',
};

const STATUS_OPTIONS = Object.entries(ADOPTION_STATUS_LABELS) as Array<
  [AdoptionPost['status'], string]
>;

const SPECIES_OPTIONS = [
  { value: 'perro', label: SPECIES_LABELS.perro },
  { value: 'gato', label: SPECIES_LABELS.gato },
  { value: 'otro', label: SPECIES_LABELS.otro },
] as const;

const SEX_OPTIONS = [
  { value: 'macho', label: 'Macho' },
  { value: 'hembra', label: 'Hembra' },
  { value: 'desconocido', label: 'Desconocido' },
] as const;

const EMPTY_VALUES: AdoptionPostFormValues = {
  animal_name: '',
  species: 'perro',
  estimated_age: '',
  sex: 'desconocido',
  sterilized: false,
  vaccinated: false,
  health_notes: '',
  personality_notes: '',
  location_text: '',
};

function AdoptionPostFormFields({
  onSubmit,
}: {
  onSubmit: (values: AdoptionPostFormValues) => Promise<void>;
}) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AdoptionPostFormValues>({
    resolver: zodResolver(adoptionPostSchema),
    defaultValues: EMPTY_VALUES,
  });

  return (
    <View className="gap-4">
      <FormTextField
        control={control}
        name="animal_name"
        label="Nombre del animal"
        placeholder="Ej. Luna"
        autoCapitalize="words"
      />
      <ChipSelectField control={control} name="species" label="Especie" options={SPECIES_OPTIONS} />
      <FormTextField
        control={control}
        name="estimated_age"
        label="Edad aproximada (opcional)"
        placeholder="Ej. Cachorro (3 meses)"
      />
      <ChipSelectField control={control} name="sex" label="Sexo" options={SEX_OPTIONS} />
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
      <FormTextField
        control={control}
        name="health_notes"
        label="Notas de salud (opcional)"
        placeholder="Ej. Alergias, tratamientos en curso"
        multiline
      />
      <FormTextField
        control={control}
        name="personality_notes"
        label="Personalidad (opcional)"
        placeholder="Ej. Juguetón, tranquilo con niños"
        multiline
      />
      <FormTextField
        control={control}
        name="location_text"
        label="Ubicación (opcional)"
        placeholder="Ej. Ibagué, zona norte"
      />
      <Button label="Publicar" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
    </View>
  );
}

export default function NegocioAdopcionesScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null | undefined>(undefined);
  const [posts, setPosts] = useState<AdoptionPost[]>([]);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setCurrentUser(user);
        if (user?.establishment) loadPosts(user.establishment.id);
      })
      .catch(() => setCurrentUser(null));
  }, []);

  async function loadPosts(establishmentId: string) {
    const { data, error } = await supabase
      .from('adoption_posts')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('No se pudieron cargar tus publicaciones', error.message);
      return;
    }
    setPosts((data as AdoptionPost[]) ?? []);
  }

  async function handleAdd(values: AdoptionPostFormValues) {
    if (!currentUser?.establishment) return;
    const { error } = await supabase.from('adoption_posts').insert({
      establishment_id: currentUser.establishment.id,
      posted_by: currentUser.profile.id,
      animal_name: values.animal_name,
      species: values.species,
      estimated_age: values.estimated_age || null,
      sex: values.sex,
      sterilized: values.sterilized,
      vaccinated: values.vaccinated,
      health_notes: values.health_notes || null,
      personality_notes: values.personality_notes || null,
      location_text: values.location_text || null,
    });
    if (error) {
      Alert.alert('No se pudo publicar', error.message);
      return;
    }
    await loadPosts(currentUser.establishment.id);
  }

  async function updateStatus(id: string, status: AdoptionPost['status']) {
    if (!currentUser?.establishment) return;
    const { error } = await supabase
      .from('adoption_posts')
      .update({ status })
      .eq('id', id)
      .eq('establishment_id', currentUser.establishment.id);
    if (error) {
      Alert.alert('No se pudo actualizar el estado', error.message);
      return;
    }
    await loadPosts(currentUser.establishment.id);
  }

  if (currentUser === undefined) {
    return <LoadingState label="Cargando tus publicaciones..." />;
  }

  if (!currentUser?.establishment) {
    return (
      <EmptyState
        icon={Heart}
        title="Solo para cuentas de negocio"
        description="Inicia sesión con una cuenta de establecimiento aliado para publicar animales en adopción."
        actionLabel="Volver"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 24 }}>
      <Text className="font-body text-sm text-mutedForeground">
        Publica animales en adopción para que las personas interesadas te contacten. Toda la
        información ayuda a una adopción responsable e informada.
      </Text>

      <View className="gap-3">
        <Text className="font-heading text-lg text-foreground">Publicar animal en adopción</Text>
        <AdoptionPostFormFields onSubmit={handleAdd} />
      </View>

      <View className="gap-3">
        <Text className="font-heading text-lg text-foreground">
          Tus publicaciones ({posts.length})
        </Text>
        {posts.length === 0 ? (
          <Text className="font-body text-sm text-mutedForeground">
            Aún no has publicado animales en adopción.
          </Text>
        ) : (
          posts.map((post) => {
            const SpeciesIcon = SPECIES_ICON[post.species];
            return (
              <Card key={post.id} className="gap-3 p-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-backgroundAlt">
                    <SpeciesIcon size={22} color="#059669" />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="font-heading text-base text-foreground" numberOfLines={1}>
                      {post.animal_name}
                    </Text>
                    <Text className="font-body text-sm text-mutedForeground">
                      {SPECIES_LABELS[post.species]}
                      {post.estimated_age ? ` · ${post.estimated_age}` : ''}
                    </Text>
                  </View>
                  <Badge label={ADOPTION_STATUS_LABELS[post.status]} tone={STATUS_TONE[post.status]} />
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {STATUS_OPTIONS.map(([value, label]) => (
                    <Chip
                      key={value}
                      label={label}
                      selected={post.status === value}
                      onPress={() => updateStatus(post.id, value)}
                    />
                  ))}
                </View>
              </Card>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
