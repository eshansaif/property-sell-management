import { z } from "zod";

export const testimonialSchema = z.object({
  authorName: z.string().trim().min(1, "Name is required").max(100),
  authorRole: z.string().trim().max(100).optional().or(z.literal("")),
  authorPhoto: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().trim().min(10, "Testimonial must be at least 10 characters").max(1000),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

