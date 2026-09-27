import slugify from "slugify";
import { prisma } from "@/lib/prisma";

export function toSlug(input: string): string {
  return slugify(input, { lower: true, strict: true, trim: true });
}

/** Generate a unique slug for a given Prisma model, appending -2, -3, etc. on collision. */
export async function uniqueSlug(
  model: "service" | "subService" | "listing",
  base: string,
  ignoreId?: string
): Promise<string> {
  const baseSlug = toSlug(base) || "item";
  let candidate = baseSlug;
  let n = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await (prisma[model] as any).findFirst({
      where: { slug: candidate, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
      select: { id: true },
    });
    if (!existing) return candidate;
    n += 1;
    candidate = `${baseSlug}-${n}`;
  }
}
