import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type PublicTestimonial = {
  id: string;
  authorName: string;
  authorRole: string | null;
  authorPhoto: string | null;
  content: string;
  rating: number | null;
};

export const getActiveTestimonials = unstable_cache(
  async (): Promise<PublicTestimonial[]> =>
    prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      take: 12,
      select: { id: true, authorName: true, authorRole: true, authorPhoto: true, content: true, rating: true },
    }),
  ["active-testimonials"],
  { revalidate: 300, tags: ["testimonials"] }
);

export async function getActiveTestimonialsSafe(): Promise<PublicTestimonial[]> {
  try { return await getActiveTestimonials(); } catch { return []; }
}
