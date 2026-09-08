import type { AiRoadmapItem } from '@petapp/shared';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Bot, PawPrint, Send, Share2, User } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrediagnosticoRoadmap } from '@/components/PrediagnosticoRoadmap';
import { usePets } from '@/contexts/PetsContext';
import { supabase } from '@/lib/supabase';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL;

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export default function PrediagnosticoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { pets, isDemo } = usePets();
  const pet = useMemo(() => pets.find((p) => p.id === id), [pets, id]);

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState('');
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

  const send = async () => {
    const message = draft.trim();
    if (!message || sending || summary) return;
    setSending(true);
    setTurns((prev) => [...prev, { role: 'user', content: message }]);
    setDraft('');

    try {
      if (!WEB_URL) throw new Error('missing-web-url');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('missing-session');

      const res = await fetch(`${WEB_URL}/api/ai/prediagnostico`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ petId: pet.id, conversationId: conversationId ?? undefined, message }),
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
  };

  const shareSummary = () => {
    if (!summary) return;
    Share.share({
      message: `Pre-diagnóstico para ${pet.name}\nGenerado por el asistente de IA de PETAPP — no es un diagnóstico real.\n\n${summary}`,
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
              te parezca importante.
            </Text>
          ) : null}
          {turns.map((turn, index) => (
            <View
              key={index}
              className={`flex-row gap-2 ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {turn.role === 'assistant' ? (
                <View className="h-7 w-7 items-center justify-center rounded-full bg-secondary/20">
                  <Bot size={16} color="#059669" />
                </View>
              ) : null}
              <View
                className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  turn.role === 'user' ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Text className={`font-body text-sm ${turn.role === 'user' ? 'text-white' : 'text-foreground'}`}>
                  {turn.content}
                </Text>
              </View>
              {turn.role === 'user' ? (
                <View className="h-7 w-7 items-center justify-center rounded-full bg-primary/20">
                  <User size={16} color="#0369A1" />
                </View>
              ) : null}
            </View>
          ))}
          {sending ? <Text className="font-body text-sm text-mutedForeground">El asistente está escribiendo…</Text> : null}
        </ScrollView>

        <View className="flex-row items-end gap-2 border-t border-border bg-card p-3">
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
            disabled={sending || !draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Enviar"
            className={`h-11 w-11 items-center justify-center rounded-md bg-primary ${
              sending || !draft.trim() ? 'opacity-50' : ''
            }`}
          >
            {sending ? <ActivityIndicator color="#FFFFFF" /> : <Send size={18} color="#FFFFFF" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
