import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type PublicClient = { id: string; name: string; logoUrl: string; websiteUrl: string | null };

export const getActiveClients = unstable_cache(
  async (): Promise<PublicClient[]> => {
    return prisma.client.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      take: 30,
      select: { id: true, name: true, logoUrl: true, websiteUrl: true },
    });
  },
  ["active-clients"],
  { revalidate: 300, tags: ["clients"] }
);

export async function getActiveClientsSafe(): Promise<PublicClient[]> {
  try {
    return await getActiveClients();
  } catch {
    return [];
  }
}
