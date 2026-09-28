import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type NavService = {
  id: string;
  name: string;
  slug: string;
  subServices: { id: string; name: string; slug: string }[];
};

/** Published services with their published sub-services — powers the mega menu, footer and filters. */
export const getNavTree = unstable_cache(
  async (): Promise<NavService[]> => {
    return prisma.service.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      take: 50,
      select: {
        id: true,
        name: true,
        slug: true,
        subServices: {
          where: { status: "PUBLISHED" },
          orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
          take: 100,
          select: { id: true, name: true, slug: true },
        },
      },
    });
  },
  ["nav-tree"],
  { revalidate: 120, tags: ["nav-tree"] }
);

export async function getNavTreeSafe(): Promise<NavService[]> {
  try {
    return await getNavTree();
  } catch {
    return [];
  }
}
