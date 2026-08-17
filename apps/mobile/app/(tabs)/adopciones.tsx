import type { AdoptionPostWithPhotos } from '@petapp/shared';
import { SearchX } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';

import { AdoptionCard } from '@/components/AdoptionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { fetchAdoptionPosts } from '@/lib/data';

export default function AdoptionsScreen() {
  const [posts, setPosts] = useState<AdoptionPostWithPhotos[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchAdoptionPosts().then((data) => {
      if (active) setPosts(data);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Adopciones" subtitle="Encuentra un nuevo miembro para tu familia" />

      {posts === null ? (
        <LoadingState label="Cargando publicaciones..." />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No hay publicaciones de adopción"
          description="Vuelve pronto: las fundaciones publican nuevos casos con frecuencia."
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AdoptionCard post={item} />}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </View>
  );
}
