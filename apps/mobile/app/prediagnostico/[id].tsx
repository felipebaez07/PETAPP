import type { AiRoadmapItem } from '@petapp/shared';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Bot, ImagePlus, PawPrint, Send, Share2, User, X } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrediagnosticoRoadmap } from '@/components/PrediagnosticoRoadmap';
import { usePets } from '@/contexts/PetsContext';
import { supabase } from '@/lib/supabase';
import {
  fileExtensionFromName,
  generateFileId,
  pickImageFromLibrary,
  uploadFileToBucket,
  validatePhotoAsset,
  type PickedFile,
} from '@/lib/uploads';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL;

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  /** Vista previa local de una foto adjunta a este turno — solo dura la sesión. */
  imagePreviewUri?: string;
}

export default function PrediagnosticoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { pets, isDemo } = usePets();
  const pet = useMemo(() => pets.find((p) => p.id === id), [pets, id]);

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [photo, setPhoto] = useState<PickedFile | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<AiRoadmapItem[] | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  if (!pet) {
    return (
      <>
        <Stack.Screen options={{ title: 'Pre-diagnóstico' }} />
        <EmptyState
          icon={PawPrint}
          title="Mascota no encontrada"
          description="Puede que ya no esté en tu lista."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      </>
    );
  }

  if (isDemo) {
    return (
      <>
        <Stack.Screen options={{ title: 'Pre-diagnóstico' }} />
        <EmptyState
          icon={Bot}
          title="Inicia sesión"
          description="El asistente de pre-diagnóstico necesita una cuenta real para guardar la conversación."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      </>
    );
  }

  const pickPhoto = async () => {
    setPhotoError(null);
    const asset = await pickImageFromLibrary();
    if (!asset) return;
    const validationError = validatePhotoAsset(asset);
    if (validationError) {
      setPhotoError(validationError);
      return;
    }
    setPhoto(asset);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoError(null);
  };

  const send = async () => {
    const message = draft.trim();
    const pendingPhoto = photo;
    if ((!message && !pendingPhoto) || sending || summary) return;
    setSending(true);

    // Si hay foto, se sube ANTES de armar el turno — si la subida falla, no queremos un mensaje
    // "fantasma" en el chat sin foto real detrás. Mismo bucket/patrón que la versión web
    // (0011_ai_chat_images.sql): el primer segmento de la ruta tiene que ser el dueño de la
    // mascota (pet.owner_id, que acá siempre es el propio usuario logueado).
    let imagePath: string | undefined;
    if (pendingPhoto) {
      const ext = fileExtensionFromName(pendingPhoto.name, 'jpg');
      const path = `${pet.owner_id}/${generateFileId()}.${ext}`;
      const { error: uploadError } = await uploadFileToBucket('ai-chat-images', path, pendingPhoto);
      if (uploadError) {
        Alert.alert('No se pudo subir la foto', 'Intenta de nuevo.');
        setSending(false);
        return;
      }
      imagePath = path;
    }

    setTurns((prev) => [...prev, { role: 'user', content: message, imagePreviewUri: pendingPhoto?.uri }]);
    setDraft('');
    setPhoto(null);

    try {
      if (!WEB_URL) throw new Error('missing-web-url');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('missing-session');

      const res = await fetch(`${WEB_URL}/api/ai/prediagnostico`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ petId: pet.id, conversationId: conversationId ?? undefined, message, imagePath }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('No se pudo enviar', data.error ?? 'Intenta de nuevo.');
        return;
      }
      setConversationId(data.conversationId);
      if (data.done) {
        setSummary(data.summary);
        setRoadmap(data.roadmap ?? null);
      } else {
        setTurns((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch {
      Alert.alert('No se pudo conectar', 'Revisa tu conexión e intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const startNew = () => {
    setTurns([]);
    setConversationId(null);
    setSummary(null);
    setRoadmap(null);
    removePhoto();
  };

  const shareSummary = () => {
    if (!summary) return;
    Share.share({
      message: `Pre-diagnóstico para ${pet.name}\nGenerado por el asistente de IA de Almanimapp — no es un diagnóstico real.\n\n${summary}`,
    });
  };

  if (summary) {
    return (
      <>
        <Stack.Screen options={{ title: 'Pre-diagnóstico' }} />
        <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View className="gap-3 rounded-xl border border-secondary bg-card p-4 shadow-sm">
            <Text className="font-bodySemibold text-sm text-foreground">
              Este resumen no es un diagnóstico — es una guía para tu consulta veterinaria.
            </Text>
            <Text className="font-body text-sm text-foreground">{summary}</Text>
          </View>
          <Button label="Compartir resumen" icon={Share2} onPress={shareSummary} />
          <Button label="Empezar una nueva consulta" variant="outline" onPress={startNew} />
          {roadmap && roadmap.length > 0 && conversationId ? (
            <PrediagnosticoRoadmap petId={pet.id} conversationId={conversationId} items={roadmap} />
          ) : null}
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Pre-diagnóstico' }} />
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView ref={scrollRef} className="flex-1" contentContainerStyle={{ padding: 20, gap: 12 }}>
          {turns.length === 0 ? (
            <Text className="font-body text-sm text-mutedForeground">
              Empieza contando qué notaste en {pet.name}: qué síntoma, desde cuándo, y cualquier otro detalle que
              te parezca importante. También podés adjuntar una foto.
            </Text>
          ) : null}
          {turns.map((turn, index) => (
            <Animated.View
              key={index}
              entering={FadeInUp.duration(220).springify().damping(26).stiffness(220)}
              className={`flex-row gap-2 ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {turn.role === 'assistant' ? (
                <View className="h-7 w-7 items-center justify-center rounded-full bg-secondary/20">
                  <Bot size={16} color="#059669" />
                </View>
              ) : null}
              <View
                className={`max-w-[80%] gap-2 rounded-xl px-3 py-2 ${
                  turn.role === 'user' ? 'bg-primary' : 'bg-muted'
                }`}
              >
                {turn.imagePreviewUri ? (
                  <Image
                    source={{ uri: turn.imagePreviewUri }}
                    style={{ width: 160, height: 160, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                ) : null}
                {turn.content ? (
                  <Text className={`font-body text-sm ${turn.role === 'user' ? 'text-white' : 'text-foreground'}`}>
                    {turn.content}
                  </Text>
                ) : null}
              </View>
              {turn.role === 'user' ? (
                <View className="h-7 w-7 items-center justify-center rounded-full bg-primary/20">
                  <User size={16} color="#0369A1" />
                </View>
              ) : null}
            </Animated.View>
          ))}
          {sending ? <Text className="font-body text-sm text-mutedForeground">El asistente está escribiendo…</Text> : null}
        </ScrollView>

        {photo ? (
          <View className="flex-row items-center gap-2 border-t border-border bg-card px-3 pt-3">
            <Image source={{ uri: photo.uri }} style={{ width: 44, height: 44, borderRadius: 6 }} />
            <Text className="flex-1 font-body text-xs text-mutedForeground" numberOfLines={1}>
              {photo.name ?? 'Foto seleccionada'}
            </Text>
            <Pressable
              onPress={removePhoto}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Quitar foto"
              style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
            >
              <X size={18} color="#64748B" />
            </Pressable>
          </View>
        ) : null}
        {photoError ? (
          <Text className="border-t border-border bg-card px-3 pt-2 font-body text-xs text-destructive">
            {photoError}
          </Text>
        ) : null}

        <View className="flex-row items-end gap-2 border-t border-border bg-card p-3">
          <Pressable
            onPress={pickPhoto}
            disabled={sending}
            accessibilityRole="button"
            accessibilityLabel="Adjuntar foto"
            style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            className="h-11 w-11 items-center justify-center rounded-md border border-border bg-background"
          >
            <ImagePlus size={18} color="#64748B" />
          </Pressable>
          <TextInput
            className="min-h-11 flex-1 rounded-sm border border-border bg-background px-3 py-2 font-body text-base text-foreground"
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe acá…"
            placeholderTextColor="#94A3B8"
            multiline
            editable={!sending}
          />
          <Pressable
            onPress={send}
            disabled={sending || (!draft.trim() && !photo)}
            accessibilityRole="button"
            accessibilityLabel="Enviar"
            style={({ pressed }) => (pressed ? { transform: [{ scale: 0.92 }] } : undefined)}
            className={`h-11 w-11 items-center justify-center rounded-md bg-primary ${
              sending || (!draft.trim() && !photo) ? 'opacity-50' : ''
            }`}
          >
            {sending ? <ActivityIndicator color="#FFFFFF" /> : <Send size={18} color="#FFFFFF" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
