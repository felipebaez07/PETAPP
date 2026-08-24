import {
  PRODUCT_CATEGORY_LABELS,
  type ForumPostWithEstablishment,
  type ProductCategory,
  type ProductWithEstablishment,
} from '@petapp/shared';
import { Search, SearchX } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';

import { ForumPostCard } from '@/components/ForumPostCard';
import { ProductCard } from '@/components/ProductCard';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { fetchForumPosts, fetchProducts } from '@/lib/data';

const PRODUCT_CATEGORY_FILTERS: Array<{ value: ProductCategory | 'todas'; label: string }> = [
  { value: 'todas', label: 'Todas' },
  { value: 'alimento', label: PRODUCT_CATEGORY_LABELS.alimento },
  { value: 'accesorios', label: PRODUCT_CATEGORY_LABELS.accesorios },
  { value: 'higiene', label: PRODUCT_CATEGORY_LABELS.higiene },
  { value: 'salud', label: PRODUCT_CATEGORY_LABELS.salud },
  { value: 'otro', label: PRODUCT_CATEGORY_LABELS.otro },
];

type Section = 'tienda' | 'foro';

export default function ComunidadScreen() {
  const [section, setSection] = useState<Section>('tienda');

  const [products, setProducts] = useState<ProductWithEstablishment[] | null>(null);
  const [productsError, setProductsError] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productCategory, setProductCategory] = useState<ProductCategory | 'todas'>('todas');

  const [posts, setPosts] = useState<ForumPostWithEstablishment[] | null>(null);
  const [postsError, setPostsError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch(() => {
        if (active) setProductsError(true);
      });
    fetchForumPosts()
      .then((data) => {
        if (active) setPosts(data);
      })
      .catch(() => {
        if (active) setPostsError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const q = productQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (productCategory !== 'todas' && product.category !== productCategory) return false;
      if (q) {
        const haystack = `${product.name} ${product.description ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [products, productCategory, productQuery]);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Comunidad" subtitle="Tienda y foro de los aliados de PetApp" />

      <View className="flex-row gap-2 px-5 pt-4">
        <Chip label="Tienda" selected={section === 'tienda'} onPress={() => setSection('tienda')} />
        <Chip label="Foro" selected={section === 'foro'} onPress={() => setSection('foro')} />
      </View>

      {section === 'tienda' ? (
        <>
          <View className="gap-3 px-5 pt-4">
            <View className="min-h-11 flex-row items-center gap-2 rounded-sm border border-border bg-card px-3">
              <Search size={18} color="#64748B" />
              <TextInput
                value={productQuery}
                onChangeText={setProductQuery}
                placeholder="Buscar producto"
                placeholderTextColor="#64748B"
                className="min-h-11 flex-1 font-body text-base text-foreground"
              />
            </View>
            <FlatList
              horizontal
              data={PRODUCT_CATEGORY_FILTERS}
              keyExtractor={(item) => item.value}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <Chip
                  label={item.label}
                  selected={productCategory === item.value}
                  onPress={() => setProductCategory(item.value)}
                />
              )}
            />
          </View>

          {products === null ? (
            productsError ? (
              <EmptyState icon={SearchX} title="No se pudo cargar la tienda" description="Intenta de nuevo en unos segundos." />
            ) : (
              <LoadingState label="Cargando productos..." />
            )
          ) : filteredProducts.length === 0 ? (
            <EmptyState icon={SearchX} title="No encontramos productos" description="Prueba con otro nombre o categoría." />
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ProductCard product={item} />}
              contentContainerStyle={{ padding: 20, paddingTop: 16 }}
            />
          )}
        </>
      ) : posts === null ? (
        postsError ? (
          <EmptyState icon={SearchX} title="No se pudo cargar el foro" description="Intenta de nuevo en unos segundos." />
        ) : (
          <LoadingState label="Cargando el foro..." />
        )
      ) : posts.length === 0 ? (
        <EmptyState icon={SearchX} title="Todavía no hay publicaciones" description="Los aliados irán compartiendo novedades aquí." />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ForumPostCard post={item} />}
          contentContainerStyle={{ padding: 20, paddingTop: 16 }}
        />
      )}
    </View>
  );
}
