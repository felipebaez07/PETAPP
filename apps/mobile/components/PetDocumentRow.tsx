import { PET_DOCUMENT_TYPE_LABELS, type PetDocument } from '@petapp/shared';
import { ExternalLink, FileText, Syringe, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { getSignedPetDocumentUrl } from '@/lib/data';
import { openExternalUrl } from '@/lib/linking';

const DOCUMENT_ICON = {
  carnet_vacunacion: Syringe,
  historia_clinica: FileText,
  otro: FileText,
} as const;

interface PetDocumentRowProps {
  document: PetDocument;
  /** Necesario para pedir la URL firmada de un documento en el bucket privado — ver
   * `getSignedPetDocumentUrl`, que filtra por `pet_id` además del `id` del documento. */
  petId: string;
  onDelete?: (document: PetDocument) => void;
}

/**
 * Tarjeta de documento/soporte de la mascota. Tocar abre el documento: si tiene
 * `document_url` (enlace externo pegado a mano), lo abre directo; si tiene `storage_path`
 * (archivo subido al bucket privado `pet-documents`), pide una URL firmada de 60s bajo
 * demanda justo al tocar la fila — nunca se precalcula al renderizar la lista completa.
 */
export function PetDocumentRow({ document, petId, onDelete }: PetDocumentRowProps) {
  const Icon = DOCUMENT_ICON[document.document_type];
  const [opening, setOpening] = useState(false);

  async function handlePress() {
    if (document.document_url) {
      await openExternalUrl(document.document_url, 'No se pudo abrir este documento.');
      return;
    }
    if (!document.storage_path) return;

    setOpening(true);
    const { url, error } = await getSignedPetDocumentUrl(document.id, petId);
    setOpening(false);
    if (!url) {
      Alert.alert('No se pudo abrir', error ?? 'Intenta de nuevo en unos segundos.');
      return;
    }
    await openExternalUrl(url, 'No se pudo abrir este documento.');
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={opening}
      accessibilityRole="button"
      accessibilityLabel={`Abrir documento ${document.title}`}
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
      className="flex-row items-center gap-3 rounded-xl bg-card p-4 shadow-sm"
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-md bg-backgroundAlt"
        accessible={false}
      >
        <Icon size={20} color="#0369A1" />
      </View>

      <View className="flex-1 gap-0.5">
        <Text className="font-bodySemibold text-base text-foreground" numberOfLines={1}>
          {document.title}
        </Text>
        <Text className="font-body text-sm text-mutedForeground">
          {PET_DOCUMENT_TYPE_LABELS[document.document_type]}
        </Text>
      </View>

      {opening ? <ActivityIndicator size="small" color="#64748B" /> : <ExternalLink size={16} color="#64748B" />}

      {onDelete ? (
        <Pressable
          onPress={() => onDelete(document)}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar documento ${document.title}`}
          hitSlop={8}
          style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
          className="h-9 w-9 items-center justify-center rounded-sm"
        >
          <Trash2 size={17} color="#DC2626" />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
