import { PET_DOCUMENT_TYPE_LABELS, type PetDocument } from '@petapp/shared';
import { ExternalLink, FileText, Syringe, Trash2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { openExternalUrl } from '@/lib/linking';

const DOCUMENT_ICON = {
  carnet_vacunacion: Syringe,
  historia_clinica: FileText,
  otro: FileText,
} as const;

interface PetDocumentRowProps {
  document: PetDocument;
  onDelete?: (document: PetDocument) => void;
}

/** Tarjeta de documento/soporte de la mascota. Tocar abre el enlace (URL por ahora, sin subida de archivo). */
export function PetDocumentRow({ document, onDelete }: PetDocumentRowProps) {
  const Icon = DOCUMENT_ICON[document.document_type];

  return (
    <Pressable
      onPress={() => openExternalUrl(document.document_url, 'No se pudo abrir este documento.')}
      accessibilityRole="button"
      accessibilityLabel={`Abrir documento ${document.title}`}
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
      className="flex-row items-center gap-3 rounded-xl bg-card p-4 shadow-sm"
    >
      <View className="h-11 w-11 items-center justify-center rounded-md bg-backgroundAlt">
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

      <ExternalLink size={16} color="#64748B" />

      {onDelete ? (
        <Pressable
          onPress={() => onDelete(document)}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar documento ${document.title}`}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-sm"
        >
          <Trash2 size={17} color="#DC2626" />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
