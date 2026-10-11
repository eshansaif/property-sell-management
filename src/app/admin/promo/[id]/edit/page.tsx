import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PromoForm } from "@/components/admin/PromoForm";

export default async function EditPromoPage({ params }: { params: { id: string } }) {
  const p = await prisma.promoItem.findUnique({ where: { id: params.id }, include: { listing: { select: { title: true } } } });
  if (!p) return notFound();
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text-primary">Edit promo</h1>
      <PromoForm
        id={p.id}
        initial={{ label: p.label ?? "", badge: p.badge ?? "", listingId: p.listingId ?? "", listingTitle: p.listing?.title ?? "", customUrl: p.customUrl ?? "", displayOrder: p.displayOrder, isActive: p.isActive }}
      />
    </div>
  );
}
