import { PREVENTIVE_EVENT_TYPE_LABELS, type PreventiveEvent } from '@petapp/shared';
import { AlertTriangle, CalendarClock, CheckCircle2, Circle, Trash2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

export type PreventiveEventVisualStatus = 'proximo' | 'vencido' | 'completado';

function getStatus(event: PreventiveEvent): PreventiveEventVisualStatus {
  if (event.completed_at) return 'completado';
  const today = new Date().toISOString().slice(0, 10);
  return event.due_date < today ? 'vencido' : 'proximo';
}

const STATUS_STYLES: Record<
  PreventiveEventVisualStatus,
  { label: string; dot: string; text: string }
> = {
  proximo: { label: 'Próximo', dot: 'bg-secondary', text: 'text-secondaryForeground' },
  vencido: { label: 'Vencido', dot: 'bg-destructive', text: 'text-destructive' },
  completado: { label: 'Completado', dot: 'bg-success', text: 'text-success' },
};

interface PreventiveEventRowProps {
  event: PreventiveEvent;
  onToggleComplete: (event: PreventiveEvent) => void;
  onDelete?: (event: PreventiveEvent) => void;
  showPetName?: string;
}

/** Fila del calendario preventivo: tocar el círculo marca/desmarca como completado. */
export function PreventiveEventRow({ event, onToggleComplete, onDelete, showPetName }: PreventiveEventRowProps) {
  const status = getStatus(event);
  const styles = STATUS_STYLES[status];
  const isCompleted = status === 'completado';

  return (
    <View
      className="flex-row items-start gap-3 rounded-xl bg-card p-4 shadow-sm"
      accessibilityRole="none"
    >
      <Pressable
        onPress={() => onToggleComplete(event)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isCompleted }}
        accessibilityLabel={isCompleted ? `Marcar ${event.title} como pendiente` : `Marcar ${event.title} como completado`}
        hitSlop={8}
        style={({ pressed }) => (pressed ? { transform: [{ scale: 0.9 }], opacity: 0.85 } : undefined)}
        className="h-11 w-11 items-center justify-center"
      >
        {isCompleted ? (
          <Animated.View entering={ZoomIn.springify().damping(18).stiffness(180)}>
            <CheckCircle2 size={26} color="#059669" />
          </Animated.View>
        ) : (
          <Circle size={26} color="#94A3B8" />
        )}
      </Pressable>

      <View className="flex-1 gap-1.5">
        <View className="flex-row items-center gap-2">
          {status === 'vencido' ? <AlertTriangle size={14} color="#DC2626" /> : null}
          <View className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
          <Text className={`font-bodySemibold text-xs uppercase tracking-wide ${styles.text}`}>{styles.label}</Text>
        </View>

        <Text
          className={`font-heading text-base ${isCompleted ? 'text-mutedForeground line-through' : 'text-foreground'}`}
        >
          {event.title}
        </Text>

        <View className="flex-row items-center gap-1.5">
          <CalendarClock size={13} color="#64748B" />
          <Text className="font-body text-sm text-mutedForeground">
            {PREVENTIVE_EVENT_TYPE_LABELS[event.type]} · {formatDate(event.due_date)}
            {showPetName ? ` · ${showPetName}` : ''}
          </Text>
        </View>

        {event.notes ? <Text className="font-body text-sm text-mutedForeground">{event.notes}</Text> : null}
      </View>

      {onDelete ? (
        <Pressable
          onPress={() => onDelete(event)}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar recordatorio ${event.title}`}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-sm"
        >
          <Trash2 size={17} color="#DC2626" />
        </Pressable>
      ) : null}
    </View>
  );
}

function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}
