import Link from 'next/link';
import { MessageCircle, Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PRODUCT_CATEGORY_LABELS, buildProductInquiryWhatsAppLink, type ProductWithEstablishment } from '@petapp/shared';

export function ProductCard({ product }: { product: ProductWithEstablishment }) {
  const whatsappLink =
    product.establishment?.whatsapp_number
      ? buildProductInquiryWhatsAppLink({
          whatsappNumber: product.establishment.whatsapp_number,
          establishmentName: product.establishment.name,
          productName: product.name,
        })
      : null;

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <Badge variant="secondary" className="w-fit">
          {PRODUCT_CATEGORY_LABELS[product.category]}
        </Badge>
        <h3 className="font-heading text-base font-semibold leading-snug text-foreground">{product.name}</h3>
        {product.description && <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>}
        {product.price_reference && <p className="text-sm font-medium text-foreground">{product.price_reference}</p>}

        {product.establishment && (
          <Link
            href={`/establecimientos/${product.establishment.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Store className="size-3.5" />
            {product.establishment.name}
          </Link>
        )}

        <div className="mt-auto pt-2">
          {whatsappLink ? (
            <Button asChild variant="secondary" size="sm" className="w-full">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> Preguntar por WhatsApp
              </a>
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">Este aliado aún no tiene WhatsApp publicado.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
