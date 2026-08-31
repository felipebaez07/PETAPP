import { PRODUCT_CATEGORY_LABELS, buildProductInquiryWhatsAppLink, type ProductWithEstablishment } from '@petapp/shared';
import { MessageCircle, Store } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { openExternalUrl } from '@/lib/linking';
import { Button } from './ui/Button';

export function ProductCard({ product }: { product: ProductWithEstablishment }) {
  const whatsappLink = product.establishment?.whatsapp_number
    ? buildProductInquiryWhatsAppLink({
        whatsappNumber: product.establishment.whatsapp_number,
        establishmentName: product.establishment.name,
        productName: product.name,
      })
    : null;

  return (
    <View className="mb-3 gap-2 rounded-xl bg-card p-4 shadow-sm">
      <Text className="font-bodySemibold text-xs uppercase tracking-wide text-secondary">
        {PRODUCT_CATEGORY_LABELS[product.category]}
      </Text>
      <Text className="font-heading text-base text-foreground" numberOfLines={2}>
        {product.name}
      </Text>
      {product.description ? (
        <Text className="font-body text-sm text-mutedForeground" numberOfLines={2}>
          {product.description}
        </Text>
      ) : null}
      {product.price_reference ? (
        <Text className="font-bodySemibold text-sm text-foreground">{product.price_reference}</Text>
      ) : null}
      {product.establishment ? (
        <View className="flex-row items-center gap-1.5">
          <Store size={14} color="#64748B" />
          <Text className="font-body text-sm text-mutedForeground" numberOfLines={1}>
            {product.establishment.name}
          </Text>
        </View>
      ) : null}
      {whatsappLink ? (
        <Button
          label="Preguntar por WhatsApp"
          variant="secondary"
          icon={MessageCircle}
          onPress={() => openExternalUrl(whatsappLink, 'No se pudo abrir WhatsApp. Verifica que esté instalado.')}
        />
      ) : null}
    </View>
  );
}
