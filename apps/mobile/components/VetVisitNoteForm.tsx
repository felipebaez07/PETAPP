import { vetVisitNoteSchema } from '@petapp/shared';
import { CircleCheck, Stethoscope } from 'lucide-react-native';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

/**
 * Cierra el círculo del pre-diagnóstico (pedido explícito del usuario): después de la cita real,
 * el cuidador cuenta acá qué le dijo/hizo el veterinario. Queda guardado para que la próxima
 * conversación de pre-diagnóstico de esta misma mascota arranque con ese contexto — mismo
 * componente/criterio que la versión web.
 */
export function VetVisitNoteForm({ petId, ownerId, conversationId }: { petId: string; ownerId: string; conversationId: string }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const parsed = vetVisitNoteSchema.safeParse({ pet_id: petId, ai_conversation_id: conversationId, note });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos.');
      return;
    }
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from('vet_visit_notes').insert({
      pet_id: parsed.data.pet_id,
      owner_id: ownerId,
      ai_conversation_id: parsed.data.ai_conversation_id ?? null,
      note: parsed.data.note,
    });
    setSaving(false);
    if (insertError) {
      setError('No se pudo guardar. Intenta de nuevo.');
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <View className="flex-row items-start gap-2 rounded-xl border border-success/30 bg-success/5 p-3">
        <CircleCheck size={16} color="#059669" />
        <Text className="flex-1 font-body text-sm text-success">
          Guardado — la próxima consulta de esta mascota ya va a tener esto en cuenta.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-2.5 rounded-xl bg-card p-4 shadow-sm">
      <View className="flex-row items-center gap-2">
        <Stethoscope size={16} color="#059669" />
        <Text className="font-heading text-base text-foreground">¿Ya fuiste al veterinario?</Text>
      </View>
      <Text className="font-body text-xs text-mutedForeground">
        Contanos qué te dijo o qué le hizo — lo vamos a tener en cuenta la próxima vez que uses el asistente
        con esta mascota.
      </Text>
      <View className="min-h-11 rounded-sm border border-border bg-background px-3 py-2">
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Ej. Le diagnosticaron una alergia alimentaria, le recetaron una dieta especial…"
          placeholderTextColor="#64748B"
          multiline
          maxLength={2000}
          className="font-body text-base text-foreground"
        />
      </View>
      {error ? <Text className="font-body text-sm text-destructive">{error}</Text> : null}
      <Button label="Guardar" onPress={handleSubmit} loading={saving} />
    </View>
  );
}
