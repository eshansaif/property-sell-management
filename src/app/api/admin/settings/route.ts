import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { readSiteSettings, SETTING_KEYS } from "@/lib/site-settings";
import { refreshPublicSite } from "@/lib/revalidate";

const url = z.string().trim().max(300).refine((v) => v === "" || /^https?:\/\//i.test(v), "Links must start with http:// or https://");

const schema = z.object({
  siteName: z.string().trim().min(2, "Site name is required").max(60),
  tagline: z.string().trim().max(200),
  contactEmail: z.string().trim().max(200).refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid contact email"),
  contactPhone: z.string().trim().max(30),
  whatsapp: z.string().trim().max(30),
  address: z.string().trim().max(300),
  facebookUrl: url,
  instagramUrl: url,
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "settings:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await readSiteSettings());
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "settings:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  await prisma.$transaction(
    SETTING_KEYS.map((key) =>
      prisma.systemSetting.upsert({ where: { key }, update: { value: parsed.data[key] }, create: { key, value: parsed.data[key] } })
    )
  );
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "UPDATE", entity: "SiteSettings", entityId: "site" } });
  refreshPublicSite();
  return NextResponse.json(await readSiteSettings());
}
