import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type SiteSettings = {
  siteName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  whatsapp: string;
  address: string;
  facebookUrl: string;
  instagramUrl: string;
};

export const SETTING_KEYS: (keyof SiteSettings)[] = [
  "siteName", "tagline", "contactEmail", "contactPhone", "whatsapp", "address", "facebookUrl", "instagramUrl",
];

export function defaultSettings(): SiteSettings {
  return {
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Everest Listings",
    tagline: "A trusted place to discover properties and services, and reach the right people quickly.",
    contactEmail: "",
    contactPhone: "",
    whatsapp: "",
    address: "",
    facebookUrl: "",
    instagramUrl: "",
  };
}

/** Uncached read (used by the admin settings screen so it always shows the truth). */
export async function readSiteSettings(): Promise<SiteSettings> {
  const defaults = defaultSettings();
  try {
    const rows = await prisma.systemSetting.findMany({ where: { key: { in: SETTING_KEYS as string[] } } });
    const merged: Record<string, string> = { ...defaults };
    for (const r of rows) if (r.value !== "") merged[r.key] = r.value;
    return merged as unknown as SiteSettings;
  } catch {
    return defaults;
  }
}

/** Cached read for the public site (refreshed instantly when an admin saves settings). */
export const getSiteSettings = unstable_cache(readSiteSettings, ["site-settings"], {
  revalidate: 300,
  tags: ["site-settings"],
});
