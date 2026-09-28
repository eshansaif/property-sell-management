import { z } from "zod";
import { validatePassword } from "@/lib/password-policy";

// Server-side validation. The frontend also validates for UX,
// but every one of these schemas is re-run on the API route —
// frontend validation is never trusted alone.

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(120),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number"),
  email: z.string().trim().email("Please enter a valid email").optional().or(z.literal("")),
  message: z.string().trim().min(5, "Please add a short message").max(2000),
  preferredContact: z.enum(["PHONE", "EMAIL", "WHATSAPP"]).optional(),
  serviceId: z.string().cuid().optional().or(z.literal("")),
  subServiceId: z.string().cuid().optional().or(z.literal("")),
  listingId: z.string().cuid().optional().or(z.literal("")),
  sourcePage: z.string().max(300).optional(),
  // honeypot field — must stay empty; real users never see or fill it
  company: z.string().max(0, "Spam detected").optional().or(z.literal("")),
  consent: z.literal(true, { errorMap: () => ({ message: "Please accept to continue" }) }),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  shortDesc: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(10000).optional().or(z.literal("")),
  icon: z.string().trim().max(200).optional().or(z.literal("")),
  coverImage: z.string().trim().max(1000).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  displayOrder: z.coerce.number().int().default(0),
  isFeatured: z.coerce.boolean().default(false),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(300).optional().or(z.literal("")),
});

export const subServiceSchema = serviceSchema.extend({
  serviceId: z.string().cuid(),
});

export const customSpecInputSchema = z.object({
  group: z.string().trim().max(60).optional().default(""),
  label: z.string().trim().min(1, "Every specification row needs a label").max(80),
  value: z.string().trim().min(1, "Every specification row needs a value").max(500),
});

export const passwordSchema = z.string().superRefine((v, ctx) => {
  const err = validatePassword(v);
  if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
});

export const listingSchema = z.object({
  serviceId: z.string().cuid(),
  subServiceId: z.string().cuid(),
  title: z.string().trim().min(3).max(200),
  shortDesc: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(20000).optional().or(z.literal("")),
  priceLabel: z.string().trim().max(100).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  isFeatured: z.coerce.boolean().default(false),
  specs: z.record(z.string()).optional(),
  customSpecs: z.array(customSpecInputSchema).max(100).optional(),
});

export const inquiryStatusUpdateSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "IN_PROGRESS", "FOLLOW_UP", "CONVERTED", "CLOSED", "REJECTED"]),
});
