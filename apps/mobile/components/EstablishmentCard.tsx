import { CATEGORY_LABELS, isOpenNow, type EstablishmentWithDetails } from '@petapp/shared';
import { useRouter } from 'expo-router';
import { Building2, ChevronRight, MapPin, ShieldCheck } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { RemoteImage } from './ui/RemoteImage';
import { StatusDot } from './ui/StatusDot';

export function EstablishmentCard({ establishment }: { establishment: EstablishmentWithDetails }) {
  const router = useRouter();
  const open = isOpenNow(establishment.hours, establishment.is_24_7);
  const verified = establishment.verification_status === 'verificado';

  return (
    <Pressable
      onPress={() => router.push(`/establecimiento/${establishment.id}`)}
      accessibilityRole="button"
      className="mb-3 rounded-xl bg-card p-4 shadow-sm"
      style={({ pressed }) => (pressed ? { transform: [{ scale: 0.98 }] } : undefined)}
    >
      <View className="flex-row items-start gap-3">
        <RemoteImage uri={establishment.logo_url} size={48} icon={Building2} />
        <View className="flex-1 gap-1.5">
          <Text className="font-bodySemibold text-xs uppercase tracking-wide text-secondary">
            {CATEGORY_LABELS[establishment.category]}
          </Text>

          <Text className="font-heading text-base text-foreground" numberOfLines={1}>
            {establishment.name}
          </Text>

          <View className="flex-row items-center gap-3">
            <StatusDot open={open} openLabel={establishment.is_24_7 ? 'Abierto 24/7' : 'Abierto ahora'} />
            {verified ? (
              <View className="flex-row items-center gap-1">
                <ShieldCheck size={14} color="#059669" />
                <Text className="font-bodyMedium text-xs text-success">Verificado</Text>
              </View>
            ) : null}
          </View>

          {establishment.address ? (
            <View className="flex-row items-center gap-1">
              <MapPin size={14} color="#64748B" />
              <Text className="flex-1 font-body text-sm text-mutedForeground" numberOfLines={1}>
                {establishment.address}, {establishment.city}
              </Text>
            </View>
          ) : null}
        </View>

        <ChevronRight size={20} color="#64748B" />
      </View>
    </Pressable>
  );
}
