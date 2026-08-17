import {
  CATEGORY_LABELS,
  isOpenNow,
  PILOT_CITY,
  type EstablishmentCategory,
  type EstablishmentWithDetails,
} from '@petapp/shared';
import { Clock, Search, SearchX, Zap } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';

import { EstablishmentCard } from '@/components/EstablishmentCard';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { fetchEstablishments } from '@/lib/data';

const CATEGORY_FILTERS: Array<{ value: EstablishmentCategory | 'todas'; label: string }> = [
  { value: 'todas', label: 'Todas' },
  { value: 'veterinaria', label: CATEGORY_LABELS.veterinaria },
  { value: 'comercio', label: CATEGORY_LABELS.comercio },
  { value: 'profesional', label: CATEGORY_LABELS.profesional },
  { value: 'fundacion', label: CATEGORY_LABELS.fundacion },
];

export default function DirectoryScreen() {
  const [establishments, setEstablishments] = useState<EstablishmentWithDetails[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<EstablishmentCategory | 'todas'>('todas');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [is24hOnly, setIs24hOnly] = useState(false);

  useEffect(() => {
    let active = true;
    fetchEstablishments()
      .then((data) => {
        if (active) setEstablishments(data);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!establishments) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return establishments.filter((establishment) => {
      if (category !== 'todas' && establishment.category !== category) return false;
      if (is24hOnly && !establishment.is_24_7) return false;
      if (openNowOnly && !isOpenNow(establishment.hours, establishment.is_24_7)) return false;
      if (normalizedQuery) {
        const haystack = `${establishment.name} ${establishment.address ?? ''} ${
          CATEGORY_LABELS[establishment.category]
        }`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });
  }, [establishments, category, openNowOnly, is24hOnly, query]);

  const hasActiveFilters = category !== 'todas' || openNowOnly || is24hOnly || query.trim().length > 0;

  function clearFilters() {
    setQuery('');
    setCategory('todas');
    setOpenNowOnly(false);
    setIs24hOnly(false);
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Directorio" subtitle={`Establecimientos verificados en ${PILOT_CITY}`} />

      <View className="gap-3 px-5 pt-4">
        <View className="min-h-11 flex-row items-center gap-2 rounded-sm border border-border bg-card px-3">
          <Search size={18} color="#64748B" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nombre, dirección o categoría"
            placeholderTextColor="#64748B"
            className="min-h-11 flex-1 font-body text-base text-foreground"
          />
        </View>

        <FlatList
          horizontal
          data={CATEGORY_FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Chip
              label={item.label}
              selected={category === item.value}
              onPress={() => setCategory(item.value)}
            />
          )}
        />

        <View className="flex-row gap-2">
          <Chip
            label="Abierto ahora"
            selected={openNowOnly}
            onPress={() => setOpenNowOnly((v) => !v)}
            icon={Clock}
          />
          <Chip label="24/7" selected={is24hOnly} onPress={() => setIs24hOnly((v) => !v)} icon={Zap} />
        </View>
      </View>

      {establishments === null ? (
        loadError ? (
          <EmptyState
            icon={SearchX}
            title="No se pudo cargar el directorio"
            description="Intenta de nuevo en unos segundos."
          />
        ) : (
          <LoadingState label="Cargando directorio..." />
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No encontramos establecimientos"
          description="Prueba con otro nombre o quita algunos filtros."
          actionLabel={hasActiveFilters ? 'Limpiar filtros' : undefined}
          onAction={hasActiveFilters ? clearFilters : undefined}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EstablishmentCard establishment={item} />}
          contentContainerStyle={{ padding: 20, paddingTop: 16 }}
        />
      )}
    </View>
  );
}
