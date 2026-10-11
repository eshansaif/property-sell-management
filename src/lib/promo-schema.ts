import { z } from "zod";

const safeLink = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\//i.test(v) || /^\/(?!\/)/.test(v), "Link must start with http://, https:// or /");

export const promoBase = z.object({
  label: z.string().trim().max(120).optional().or(z.literal("")),
  badge: z.string().trim().max(24).optional().or(z.literal("")),
  listingId: z.string().trim().optional().or(z.literal("")),
  customUrl: safeLink.optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

export const promoCreateSchema = promoBase.refine(
  (v) => !!v.listingId || (!!v.customUrl && !!v.label),
  { message: "Pick a listing, or enter both a label and a custom link" }
);

export const promoUpdateSchema = promoBase.partial();
