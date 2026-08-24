import {
  productSchema,
  PRODUCT_CATEGORY_LABELS,
  type Product,
  type ProductFormValues,
} from '@petapp/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Pencil, Store, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ChipSelectField } from '@/components/ui/ChipSelectField';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormTextField } from '@/components/ui/FormTextField';
import { LoadingState } from '@/components/ui/LoadingState';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const CATEGORY_OPTIONS = [
  { value: 'alimento', label: PRODUCT_CATEGORY_LABELS.alimento },
  { value: 'accesorios', label: PRODUCT_CATEGORY_LABELS.accesorios },
  { value: 'higiene', label: PRODUCT_CATEGORY_LABELS.higiene },
  { value: 'salud', label: PRODUCT_CATEGORY_LABELS.salud },
  { value: 'otro', label: PRODUCT_CATEGORY_LABELS.otro },
] as const;

const EMPTY_VALUES: ProductFormValues = {
  name: '',
  description: '',
  category: 'otro',
  price_reference: '',
  image_url: '',
};

function ProductFormFields({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaultValues: ProductFormValues;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ProductFormValues>({ resolver: zodResolver(productSchema), defaultValues });

  return (
    <View className="gap-4">
      <FormTextField control={control} name="name" label="Nombre del producto" placeholder="Ej. Concentrado premium x 15kg" />
      <FormTextField control={control} name="description" label="Descripción (opcional)" placeholder="Breve detalle" />
      <ChipSelectField control={control} name="category" label="Categoría" options={CATEGORY_OPTIONS} />
      <FormTextField control={control} name="price_reference" label="Precio de referencia (opcional)" placeholder="desde $30.000" />
      <FormTextField control={control} name="image_url" label="URL de imagen (opcional)" placeholder="https://..." autoCapitalize="none" />
      <View className="flex-row gap-2">
        <Button label={submitLabel} onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth={!onCancel} />
        {onCancel ? <Button label="Cancelar" variant="ghost" onPress={onCancel} fullWidth={false} /> : null}
      </View>
    </View>
  );
}

export default function MiTiendaScreen() {
  const router = useRouter();
  const [establishmentId, setEstablishmentId] = useState<string | null | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setEstablishmentId(user?.establishment?.id ?? null);
        if (user?.establishment) loadProducts(user.establishment.id);
      })
      .catch(() => setEstablishmentId(null));
  }, []);

  async function loadProducts(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('establishment_id', id)
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('No se pudo cargar tu tienda', error.message);
      return;
    }
    setProducts((data as Product[]) ?? []);
  }

  async function handleAdd(values: ProductFormValues) {
    if (!establishmentId) return;
    const { error } = await supabase.from('products').insert({
      establishment_id: establishmentId,
      name: values.name,
      description: values.description || null,
      category: values.category,
      price_reference: values.price_reference || null,
      image_url: values.image_url || null,
    });
    if (error) {
      Alert.alert('No se pudo agregar', error.message);
      return;
    }
    await loadProducts(establishmentId);
  }

  async function handleUpdate(id: string, values: ProductFormValues) {
    if (!establishmentId) return;
    const { error } = await supabase
      .from('products')
      .update({
        name: values.name,
        description: values.description || null,
        category: values.category,
        price_reference: values.price_reference || null,
        image_url: values.image_url || null,
      })
      .eq('id', id)
      .eq('establishment_id', establishmentId);
    if (error) {
      Alert.alert('No se pudo guardar', error.message);
      return;
    }
    setEditingId(null);
    await loadProducts(establishmentId);
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('Eliminar producto', `¿Eliminar "${name}" de tu tienda?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!establishmentId) return;
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .eq('establishment_id', establishmentId);
          if (error) {
            Alert.alert('No se pudo eliminar', error.message);
            return;
          }
          await loadProducts(establishmentId);
        },
      },
    ]);
  }

  if (establishmentId === undefined) {
    return <LoadingState label="Cargando tu tienda..." />;
  }

  if (establishmentId === null) {
    return (
      <EmptyState
        icon={Store}
        title="Solo para cuentas de negocio"
        description="Inicia sesión con una cuenta de establecimiento aliado para gestionar tu tienda."
        actionLabel="Volver"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 24 }}>
      <Text className="font-body text-sm text-mutedForeground">
        Publica productos para que los propietarios de mascotas los vean en la Tienda y te pregunten
        por WhatsApp. Es un catálogo — todavía no hay cobro en línea.
      </Text>

      <View className="gap-3">
        <Text className="font-heading text-lg text-foreground">Agregar producto</Text>
        <ProductFormFields
          defaultValues={EMPTY_VALUES}
          submitLabel="Agregar producto"
          onSubmit={handleAdd}
        />
      </View>

      <View className="gap-3">
        <Text className="font-heading text-lg text-foreground">Tus productos ({products.length})</Text>
        {products.length === 0 ? (
          <Text className="font-body text-sm text-mutedForeground">Aún no has agregado productos.</Text>
        ) : (
          products.map((product) =>
            editingId === product.id ? (
              <View key={product.id} className="rounded-md border border-border bg-card p-4">
                <ProductFormFields
                  defaultValues={{
                    name: product.name,
                    description: product.description ?? '',
                    category: product.category,
                    price_reference: product.price_reference ?? '',
                    image_url: product.image_url ?? '',
                  }}
                  submitLabel="Guardar cambios"
                  onCancel={() => setEditingId(null)}
                  onSubmit={(values) => handleUpdate(product.id, values)}
                />
              </View>
            ) : (
              <View
                key={product.id}
                className="flex-row items-start justify-between gap-3 rounded-md border border-border bg-card p-4"
              >
                <View className="flex-1 gap-1">
                  <Text className="font-bodySemibold text-xs uppercase tracking-wide text-secondary">
                    {PRODUCT_CATEGORY_LABELS[product.category]}
                  </Text>
                  <Text className="font-heading text-base text-foreground">{product.name}</Text>
                  {product.price_reference ? (
                    <Text className="font-body text-sm text-mutedForeground">{product.price_reference}</Text>
                  ) : null}
                </View>
                <View className="gap-1">
                  <Button
                    label="Editar"
                    variant="ghost"
                    fullWidth={false}
                    icon={Pencil}
                    onPress={() => setEditingId(product.id)}
                  />
                  <Button
                    label="Eliminar"
                    variant="ghost"
                    fullWidth={false}
                    icon={Trash2}
                    onPress={() => handleDelete(product.id, product.name)}
                  />
                </View>
              </View>
            )
          )
        )}
      </View>
    </ScrollView>
  );
}
