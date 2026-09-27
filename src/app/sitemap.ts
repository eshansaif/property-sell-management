import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const [services, subServices, listings] = await Promise.all([
    prisma.service.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    prisma.subService.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true, service: { select: { slug: true } } } }),
    prisma.listing.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true, service: { select: { slug: true } }, subService: { select: { slug: true } } } }),
  ]);

  return [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/services`, lastModified: new Date() },
    ...services.map((s) => ({ url: `${siteUrl}/services/${s.slug}`, lastModified: s.updatedAt })),
    ...subServices.map((s) => ({ url: `${siteUrl}/services/${s.service.slug}/${s.slug}`, lastModified: s.updatedAt })),
    ...listings.map((l) => ({ url: `${siteUrl}/services/${l.service.slug}/${l.subService.slug}/${l.slug}`, lastModified: l.updatedAt })),
  ];
}
