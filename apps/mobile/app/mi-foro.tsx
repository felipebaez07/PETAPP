import { forumPostSchema, FORUM_CATEGORY_LABELS, type ForumPost, type ForumPostFormValues } from '@petapp/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Megaphone, Pencil, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ChipSelectField } from '@/components/ui/ChipSelectField';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormTextField } from '@/components/ui/FormTextField';
import { LoadingState } from '@/components/ui/LoadingState';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const CATEGORY_OPTIONS = [
  { value: 'promocion', label: FORUM_CATEGORY_LABELS.promocion },
  { value: 'anuncio', label: FORUM_CATEGORY_LABELS.anuncio },
  { value: 'noticia', label: FORUM_CATEGORY_LABELS.noticia },
  { value: 'lugar', label: FORUM_CATEGORY_LABELS.lugar },
] as const;

const EMPTY_VALUES: ForumPostFormValues = { title: '', body: '', category: 'anuncio', image_url: '' };

function ForumPostFormFields({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaultValues: ForumPostFormValues;
  onSubmit: (values: ForumPostFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForumPostFormValues>({ resolver: zodResolver(forumPostSchema), defaultValues });

  return (
    <View className="gap-4">
      <FormTextField control={control} name="title" label="Título" placeholder="Ej. 20% de descuento esta semana" />
      <ChipSelectField control={control} name="category" label="Categoría" options={CATEGORY_OPTIONS} />
      <FormTextField control={control} name="body" label="Contenido" placeholder="Escribe la publicación" multiline numberOfLines={4} />
      <FormTextField control={control} name="image_url" label="URL de imagen (opcional)" placeholder="https://..." autoCapitalize="none" />
      <View className="flex-row gap-2">
        <Button label={submitLabel} onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth={!onCancel} />
        {onCancel ? <Button label="Cancelar" variant="ghost" onPress={onCancel} fullWidth={false} /> : null}
      </View>
    </View>
  );
}

export default function MiForoScreen() {
  const router = useRouter();
  const [establishmentId, setEstablishmentId] = useState<string | null | undefined>(undefined);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setEstablishmentId(user?.establishment?.id ?? null);
        if (user?.establishment) loadPosts(user.establishment.id);
      })
      .catch(() => setEstablishmentId(null));
  }, []);

  async function loadPosts(id: string) {
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('establishment_id', id)
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('No se pudo cargar tu foro', error.message);
      return;
    }
    setPosts((data as ForumPost[]) ?? []);
  }

  async function handleAdd(values: ForumPostFormValues) {
    if (!establishmentId) return;
    const { error } = await supabase.from('forum_posts').insert({
      establishment_id: establishmentId,
      title: values.title,
      body: values.body,
      category: values.category,
      image_url: values.image_url || null,
    });
    if (error) {
      Alert.alert('No se pudo publicar', error.message);
      return;
    }
    await loadPosts(establishmentId);
  }

  async function handleUpdate(id: string, values: ForumPostFormValues) {
    if (!establishmentId) return;
    const { error } = await supabase
      .from('forum_posts')
      .update({
        title: values.title,
        body: values.body,
        category: values.category,
        image_url: values.image_url || null,
      })
      .eq('id', id)
      .eq('establishment_id', establishmentId);
    if (error) {
      Alert.alert('No se pudo guardar', error.message);
      return;
    }
    setEditingId(null);
    await loadPosts(establishmentId);
  }

  function handleDelete(id: string, title: string) {
    Alert.alert('Eliminar publicación', `¿Eliminar "${title}" del foro?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!establishmentId) return;
          const { error } = await supabase
            .from('forum_posts')
            .delete()
            .eq('id', id)
            .eq('establishment_id', establishmentId);
          if (error) {
            Alert.alert('No se pudo eliminar', error.message);
            return;
          }
          await loadPosts(establishmentId);
        },
      },
    ]);
  }

  if (establishmentId === undefined) {
    return <LoadingState label="Cargando tu foro..." />;
  }

  if (establishmentId === null) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Solo para cuentas de negocio"
        description="Inicia sesión con una cuenta de establecimiento aliado para publicar en el foro."
        actionLabel="Volver"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 24 }}>
      <Text className="font-body text-sm text-mutedForeground">
        Publica promociones, anuncios, noticias o lugares — se ven al instante en el Foro público.
      </Text>

      <View className="gap-3">
        <Text className="font-heading text-lg text-foreground">Nueva publicación</Text>
        <ForumPostFormFields defaultValues={EMPTY_VALUES} submitLabel="Publicar" onSubmit={handleAdd} />
      </View>

      <View className="gap-3">
        <Text className="font-heading text-lg text-foreground">Tus publicaciones ({posts.length})</Text>
        {posts.length === 0 ? (
          <Text className="font-body text-sm text-mutedForeground">Aún no has publicado nada en el foro.</Text>
        ) : (
          posts.map((post) =>
            editingId === post.id ? (
              <View key={post.id} className="rounded-xl bg-card p-4 shadow-sm">
                <ForumPostFormFields
                  defaultValues={{
                    title: post.title,
                    body: post.body,
                    category: post.category,
                    image_url: post.image_url ?? '',
                  }}
                  submitLabel="Guardar cambios"
                  onCancel={() => setEditingId(null)}
                  onSubmit={(values) => handleUpdate(post.id, values)}
                />
              </View>
            ) : (
              <View
                key={post.id}
                className="flex-row items-start justify-between gap-3 rounded-xl bg-card p-4 shadow-sm"
              >
                <View className="flex-1 gap-1">
                  <Text className="font-bodySemibold text-xs uppercase tracking-wide text-secondary">
                    {FORUM_CATEGORY_LABELS[post.category]}
                  </Text>
                  <Text className="font-heading text-base text-foreground">{post.title}</Text>
                  <Text className="font-body text-sm text-mutedForeground" numberOfLines={2}>
                    {post.body}
                  </Text>
                </View>
                <View className="gap-1">
                  <Button label="Editar" variant="ghost" fullWidth={false} icon={Pencil} onPress={() => setEditingId(post.id)} />
                  <Button
                    label="Eliminar"
                    variant="ghost"
                    fullWidth={false}
                    icon={Trash2}
                    onPress={() => handleDelete(post.id, post.title)}
                  />
                </View>
              </View>
            )
          )
        )}
      </View>
    </ScrollView>
  );
}
