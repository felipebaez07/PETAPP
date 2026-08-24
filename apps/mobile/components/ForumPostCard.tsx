import { FORUM_CATEGORY_LABELS, type ForumPostWithEstablishment } from '@petapp/shared';
import { Store } from 'lucide-react-native';
import { Text, View } from 'react-native';

export function ForumPostCard({ post }: { post: ForumPostWithEstablishment }) {
  const date = new Date(post.created_at).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <View className="mb-3 gap-2 rounded-md border border-border bg-card p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-bodySemibold text-xs uppercase tracking-wide text-secondary">
          {FORUM_CATEGORY_LABELS[post.category]}
        </Text>
        <Text className="font-body text-xs text-mutedForeground">{date}</Text>
      </View>
      <Text className="font-heading text-base text-foreground">{post.title}</Text>
      <Text className="font-body text-sm text-mutedForeground" numberOfLines={4}>
        {post.body}
      </Text>
      {post.establishment ? (
        <View className="flex-row items-center gap-1.5">
          <Store size={14} color="#64748B" />
          <Text className="font-body text-sm text-mutedForeground" numberOfLines={1}>
            {post.establishment.name}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
