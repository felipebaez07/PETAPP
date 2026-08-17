import {
  ADOPTION_STATUS_LABELS,
  adoptionInterestSchema,
  buildAdoptionInterestWhatsAppLink,
  SPECIES_LABELS,
  type AdoptionInterestFormValues,
  type AdoptionPostWithPhotos,
} from '@petapp/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Cat, CheckCircle2, Dog, MapPin, MessageCircle, PawPrint, SearchX, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormTextField } from '@/components/ui/FormTextField';
import { LoadingState } from '@/components/ui/LoadingState';
import { fetchAdoptionPostById } from '@/lib/data';
import { openExternalUrl } from '@/lib/linking';

const SPECIES_ICON = { perro: Dog, gato: Cat, otro: PawPrint } as const;

const STATUS_TONE: Record<AdoptionPostWithPhotos['status'], BadgeTone> = {
  disponible: 'accent', // único uso permitido del ámbar: contenido de adopción
  en_proceso: 'secondary',
  adoptado: 'muted',
  retirado: 'muted',
};

export default function AdoptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<AdoptionPostWithPhotos | null | undefined>(undefined);
  const [submitted, setSubmitted] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetchAdoptionPostById(id).then((data) => {
      if (active) setPost(data);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AdoptionInterestFormValues>({
    resolver: zodResolver(adoptionInterestSchema),
    defaultValues: { full_name: '', phone: '', email: '', message: '' },
  });

  if (post === undefined) {
    return <LoadingState label="Cargando publicación..." />;
  }

  if (post === null) {
    return (
      <>
        <Stack.Screen options={{ title: 'No encontrado' }} />
        <EmptyState
          icon={SearchX}
          title="Publicación no encontrada"
          description="Puede que ya no esté disponible."
        />
      </>
    );
  }

  const SpeciesIcon = SPECIES_ICON[post.species];
  const establishment = post.establishment;

  const onSubmit = handleSubmit((values) => {
    // Fase 1: no hay backend conectado todavía. En producción esto debe
    // crear un registro en la tabla `adoption_interests`
    // (ver supabase/migrations/0001_init.sql) en vez de solo estado local.
    setSubmitted({ full_name: values.full_name });
  });

  const handleOpenWhatsApp = () => {
    if (!establishment?.whatsapp_number || !submitted) return;
    const url = buildAdoptionInterestWhatsAppLink({
      whatsappNumber: establishment.whatsapp_number,
      animalName: post.animal_name,
      adopterName: submitted.full_name,
    });
    openExternalUrl(url, 'No se pudo abrir WhatsApp. Verifica que esté instalado.');
  };

  return (
    <>
      <Stack.Screen options={{ title: post.animal_name }} />
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 20 }}>
        <View className="items-center gap-3 rounded-md border border-border bg-card p-6">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-backgroundAlt">
            <SpeciesIcon size={40} color="#0F766E" />
          </View>
          <Text className="font-headingBold text-2xl text-foreground">{post.animal_name}</Text>
          <Badge label={ADOPTION_STATUS_LABELS[post.status]} tone={STATUS_TONE[post.status]} />
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Badge label={SPECIES_LABELS[post.species]} tone="muted" />
          {post.estimated_age ? <Badge label={post.estimated_age} tone="muted" /> : null}
          <Badge
            label={post.sterilized ? 'Esterilizado' : 'No esterilizado'}
            tone={post.sterilized ? 'success' : 'muted'}
            icon={post.sterilized ? CheckCircle2 : XCircle}
          />
          <Badge
            label={post.vaccinated ? 'Vacunado' : 'Sin vacunas registradas'}
            tone={post.vaccinated ? 'success' : 'muted'}
            icon={post.vaccinated ? CheckCircle2 : XCircle}
          />
        </View>

        {post.location_text ? (
          <View className="flex-row items-center gap-2">
            <MapPin size={16} color="#64748B" />
            <Text className="font-body text-sm text-mutedForeground">{post.location_text}</Text>
          </View>
        ) : null}

        {post.personality_notes ? (
          <View className="gap-2">
            <Text className="font-heading text-lg text-foreground">Personalidad</Text>
            <Text className="font-body text-base leading-6 text-foreground">
              {post.personality_notes}
            </Text>
          </View>
        ) : null}

        {post.health_notes ? (
          <View className="gap-2">
            <Text className="font-heading text-lg text-foreground">Salud</Text>
            <Text className="font-body text-base leading-6 text-foreground">{post.health_notes}</Text>
          </View>
        ) : null}

        {establishment ? (
          <Pressable
            onPress={() => router.push(`/establecimiento/${establishment.id}`)}
            className="rounded-md border border-border bg-card p-3"
          >
            <Text className="font-body text-sm text-mutedForeground">Publicado por</Text>
            <Text className="font-bodySemibold text-base text-secondary">{establishment.name}</Text>
          </Pressable>
        ) : null}

        <View className="gap-3 rounded-md border border-border bg-card p-4">
          {submitted ? (
            <View className="items-center gap-3 py-2">
              <CheckCircle2 size={40} color="#059669" />
              <Text className="text-center font-heading text-lg text-foreground">
                ¡Gracias, {submitted.full_name}!
              </Text>
              <Text className="text-center font-body text-sm text-mutedForeground">
                Registramos tu interés en adoptar a {post.animal_name}. La fundación se pondrá en
                contacto contigo.
              </Text>
              {establishment?.whatsapp_number ? (
                <Button
                  label="Abrir WhatsApp"
                  variant="accent"
                  icon={MessageCircle}
                  onPress={handleOpenWhatsApp}
                />
              ) : null}
            </View>
          ) : (
            <>
              <Text className="font-heading text-lg text-foreground">Estoy interesado/a</Text>
              <FormTextField
                control={control}
                name="full_name"
                label="Nombre completo"
                placeholder="Tu nombre"
                autoCapitalize="words"
              />
              <FormTextField
                control={control}
                name="phone"
                label="Teléfono de contacto"
                placeholder="Ej. 3001234567"
                keyboardType="phone-pad"
              />
              <FormTextField
                control={control}
                name="email"
                label="Correo (opcional)"
                placeholder="tucorreo@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FormTextField
                control={control}
                name="message"
                label="Mensaje (opcional)"
                placeholder="Cuéntanos por qué quieres adoptar"
                multiline
              />
              <Button
                label="Enviar interés"
                variant="accent"
                onPress={() => onSubmit()}
                loading={isSubmitting}
              />
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}
