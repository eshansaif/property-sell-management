import { prisma } from "@/lib/prisma";

/**
 * Server-side validation of submitted specification values for a listing.
 *  - every submitted spec id must be applicable to the listing's sub-service
 *  - select / boolean / multi-select values must be valid for the definition
 *  - when publishing, every required spec must have a value
 * Returns an error message, or null when valid.
 */
export async function validateListingSpecs(
  subServiceId: string,
  specs: Record<string, string> | undefined,
  requireAll: boolean
): Promise<string | null> {
  const sub = await prisma.subService.findUnique({ where: { id: subServiceId }, select: { serviceId: true } });
  if (!sub) return "Selected sub-service does not exist.";

  const applicable = await prisma.specification.findMany({
    where: { OR: [{ subServiceId }, { serviceId: sub.serviceId, subServiceId: null }] },
  });
  const byId = new Map(applicable.map((s) => [s.id, s]));

  const submitted = Object.entries(specs ?? {}).filter(([, v]) => v !== undefined && String(v).trim() !== "");

  for (const [id, raw] of submitted) {
    const def = byId.get(id);
    if (!def) return "One of the specifications doesn't belong to this category.";
    const value = String(raw);

    if (def.type === "SELECT" && !def.options.includes(value)) return `Invalid value for “${def.name}”.`;
    if (def.type === "BOOLEAN" && value !== "true" && value !== "false") return `Invalid value for “${def.name}”.`;
    if (def.type === "MULTI_SELECT") {
      const picked = value.split("|").filter(Boolean);
      if (picked.some((p) => !def.options.includes(p))) return `Invalid value for “${def.name}”.`;
    }
    if (["NUMBER", "MEASUREMENT", "CURRENCY"].includes(def.type) && !Number.isFinite(Number(value))) {
      return `“${def.name}” must be a number.`;
    }
    if (value.length > 500) return `“${def.name}” is too long.`;
  }

  if (requireAll) {
    const provided = new Set(submitted.map(([id]) => id));
    const missing = applicable.filter((s) => s.isRequired && !provided.has(s.id));
    if (missing.length > 0) return `Missing required specification: ${missing.map((m) => m.name).join(", ")}.`;
  }

  return null;
}
