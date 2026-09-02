import { serviceSchema, type Service, type ServiceFormValues } from '@petapp/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Trash2, Wrench } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormTextField } from '@/components/ui/FormTextField';
import { LoadingState } from '@/components/ui/LoadingState';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const EMPTY_VALUES: ServiceFormValues = {
  name: '',
  description: '',
  price_reference: '',
};

function ServiceFormFields({
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  defaultValues: ServiceFormValues;
  onSubmit: (values: ServiceFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ServiceFormValues>({ resolver: zodResolver(serviceSchema), defaultValues });

  async function handleFormSubmit(values: ServiceFormValues) {
    await onSubmit(values);
    reset(EMPTY_VALUES);
  }

  return (
    <View className="gap-4">
      <FormTextField control={control} name="name" label="Nombre del servicio" placeholder="Ej. Consulta general" />
      <FormTextField control={control} name="description" label="Descripción (opcional)" placeholder="Breve detalle" />
      <FormTextField control={control} name="price_reference" label="Precio de referencia (opcional)" placeholder="desde $50.000" />
      <Button label={submitLabel} onPress={handleSubmit(handleFormSubmit)} loading={isSubmitting} />
    </View>
  );
}

export default function NegocioServiciosScreen() {
  const router = useRouter();
  const [establishmentId, setEstablishmentId] = useState<string | null | undefined>(undefined);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setEstablishmentId(user?.establishment?.id ?? null);
        if (user?.establishment) loadServices(user.establishment.id);
      })
      .catch(() => {
        Alert.alert('No se pudo cargar tu cuenta', 'Intenta de nuevo en unos segundos.');
        setEstablishmentId(null);
      });
  }, []);

  async function loadServices(id: string) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('establishment_id', id)
      .order('created_at');
    if (error) {
      Alert.alert('No se pudieron cargar los servicios', error.message);
      return;
    }
    setServices((data as Service[]) ?? []);
  }

  async function handleAdd(values: ServiceFormValues) {
    if (!establishmentId) return;
    const { error } = await supabase.from('services').insert({
      establishment_id: establishmentId,
      name: values.name,
      description: values.description || null,
      price_reference: values.price_reference || null,
    });
    if (error) {
      Alert.alert('No se pudo agregar', error.message);
      return;
    }
    await loadServices(establishmentId);
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('Eliminar servicio', `¿Eliminar "${name}" de tus servicios?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!establishmentId) return;
          const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id)
            .eq('establishment_id', establishmentId);
          if (error) {
            Alert.alert('No se pudo eliminar', error.message);
            return;
          }
          await loadServices(establishmentId);
        },
      },
    ]);
  }

  if (establishmentId === undefined) {
    return <LoadingState label="Cargando servicios..." />;
  }

  if (establishmentId === null) {
    return (
      <EmptyState
        icon={Wrench}
        title="Solo para cuentas de negocio"
        description="Inicia sesión con una cuenta de establecimiento aliado para gestionar tus servicios."
        actionLabel="Volver"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 24 }}>
      <Text className="font-body text-sm text-mutedForeground">
        Se muestran en tu ficha del directorio, en el orden en que los agregues.
      </Text>

      <View className="gap-3">
        <Text className="font-heading text-lg text-foreground">Agregar servicio</Text>
        <ServiceFormFields defaultValues={EMPTY_VALUES} submitLabel="Agregar servicio" onSubmit={handleAdd} />
      </View>

      <View className="gap-3">
        <Text className="font-heading text-lg text-foreground">Tus servicios ({services.length})</Text>
        {services.length === 0 ? (
          <View className="rounded-xl bg-card p-4 shadow-sm">
            <Text className="font-body text-sm text-mutedForeground">Aún no has agregado servicios.</Text>
          </View>
        ) : (
          <View className="overflow-hidden rounded-xl bg-card shadow-sm">
            {services.map((service, index) => (
              <View
                key={service.id}
                className={[
                  'flex-row items-start justify-between gap-3 px-4 py-3',
                  index < services.length - 1 ? 'border-b border-border' : '',
                ].join(' ')}
              >
                <View className="flex-1 gap-1">
                  <Text className="font-bodySemibold text-base text-foreground">{service.name}</Text>
                  {service.description ? (
                    <Text className="font-body text-sm text-mutedForeground">{service.description}</Text>
                  ) : null}
                  {service.price_reference ? (
                    <Text className="font-bodySemibold text-sm text-secondary">{service.price_reference}</Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => handleDelete(service.id, service.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar ${service.name}`}
                  hitSlop={8}
                  style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
                  className="h-9 w-9 items-center justify-center rounded-sm"
                >
                  <Trash2 size={18} color="#DC2626" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
