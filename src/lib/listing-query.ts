import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decodeMulti } from "@/lib/spec-values";

export type FilterableSpec = {
  id: string;
  name: string;
  unit: string | null;
  type: string;
  values: string[]; // distinct values in use across published listings of the category
};

/** Filterable spec definitions for a category + the distinct values actually in use (so filters are never empty/irrelevant). */
export async function getFilterableSpecs(serviceId: string, subServiceId: string) {
  const defs = await prisma.specification.findMany({
    where: { isFilterable: true, OR: [{ subServiceId }, { serviceId, subServiceId: null }] },
    orderBy: { displayOrder: "asc" },
  });
  const typeById = new Map<string, string>(defs.map((d) => [d.id, d.type as string]));

  const all = await Promise.all(
    defs.map(async (spec): Promise<FilterableSpec> => {
      const distinct = await prisma.listingSpecificationValue.findMany({
        where: { specificationId: spec.id, listing: { subServiceId, status: "PUBLISHED" } },
        select: { value: true },
        distinct: ["value"],
      });
      const raw = distinct.map((d) => d.value);
      const values =
        spec.type === "MULTI_SELECT"
          ? Array.from(new Set(raw.flatMap((v) => decodeMulti(v)))).sort()
          : raw.sort((a, b) =>
              spec.type === "TEXT" || spec.type === "SELECT" || spec.type === "BOOLEAN" ? a.localeCompare(b) : Number(a) - Number(b)
            );
      return { id: spec.id, name: spec.name, unit: spec.unit, type: spec.type, values };
    })
  );

  return { specs: all.filter((s) => s.values.length > 0), typeById };
}

export function buildPublicListingWhere(opts: {
  q?: string;
  serviceId?: string;
  subServiceId?: string;
  params: Record<string, string | undefined>;
  typeById?: Map<string, string>;
}): Prisma.ListingWhereInput {
  const and: Prisma.ListingWhereInput[] = [];
  const where: Prisma.ListingWhereInput = { status: "PUBLISHED" };
  if (opts.serviceId) where.serviceId = opts.serviceId;
  if (opts.subServiceId) where.subServiceId = opts.subServiceId;

  const q = opts.q?.trim().slice(0, 100);
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { shortDesc: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { service: { name: { contains: q, mode: "insensitive" } } },
        { subService: { name: { contains: q, mode: "insensitive" } } },
        { customSpecs: { some: { value: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }

  for (const [key, value] of Object.entries(opts.params)) {
    if (!key.startsWith("spec_") || !value) continue;
    const id = key.slice(5);
    const type = opts.typeById?.get(id);
    if (!type) continue; // ignore unknown / non-filterable ids
    and.push({
      specs: { some: { specificationId: id, value: type === "MULTI_SELECT" ? { contains: `|${value}|` } : value } },
    });
  }

  if (and.length) where.AND = and;
  return where;
}

export function sortToOrderBy(sort?: string): Prisma.ListingOrderByWithRelationInput[] {
  switch (sort) {
    case "newest": return [{ publishedAt: "desc" }];
    case "oldest": return [{ publishedAt: "asc" }];
    case "az": return [{ title: "asc" }];
    default: return [{ isFeatured: "desc" }, { publishedAt: "desc" }];
  }
}
