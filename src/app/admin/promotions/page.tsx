import { getPromotions, type PromotionType } from '@/lib/admin-operations';
import { PromotionsManager } from './promotions-manager';

export default async function AdminPromotionsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const params = await searchParams;
  const selectedType = (params.type ?? undefined) as PromotionType | undefined;
  const promotions = await getPromotions(selectedType);

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Promotions Operations</h2>
      <p className="text-sm text-muted-foreground">Manage free membership offers, discount codes, service purchase promotions, and annual plan promotion controls.</p>
      <PromotionsManager initial={promotions} selectedType={selectedType} />
    </div>
  );
}
