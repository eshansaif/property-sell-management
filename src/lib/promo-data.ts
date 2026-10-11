import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type PublicPromoItem = { id: string; label: string; badge: string | null; href: string };

export const getActivePromoItems = unstable_cache(
  async (): Promise<PublicPromoItem[]> => {
    const rows = await prisma.promoItem.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      take: 20,
      include: {
        listing: { select: { title: true, slug: true, status: true, service: { select: { slug: true } }, subService: { select: { slug: true } } } },
      },
    });
    const out: PublicPromoItem[] = [];
    for (const r of rows) {
      if (r.listing) {
        if (r.listing.status !== "PUBLISHED") continue;
        out.push({
          id: r.id,
          label: r.label || r.listing.title,
          badge: r.badge,
          href: `/services/${r.listing.service.slug}/${r.listing.subService.slug}/${r.listing.slug}`,
        });
      } else if (r.customUrl && r.label) {
        out.push({ id: r.id, label: r.label, badge: r.badge, href: r.customUrl });
      }
    }
    return out;
  },
  ["active-promo-items"],
  { revalidate: 300, tags: ["promo"] }
);

export async function getActivePromoItemsSafe(): Promise<PublicPromoItem[]> {
  try { return await getActivePromoItems(); } catch { return []; }
}
