import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { refreshPublicSite } from "@/lib/revalidate";
import { promoCreateSchema } from "@/lib/promo-schema";

// Admin-only. ?listings=1&q= → listing picker; otherwise paginated promo list.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "promo:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();

  if (sp.get("listings") === "1") {
    const listings = await prisma.listing.findMany({
      where: { status: "PUBLISHED", ...(q ? { title: { contains: q, mode: "insensitive" } } : {}) },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { id: true, title: true, service: { select: { name: true } }, subService: { select: { name: true } } },
    });
    return NextResponse.json(listings);
  }

  const active = sp.get("active");
  const page = Math.max(1, Number(sp.get("page") || 1));
  const pageSize = 20;
  const where = {
    ...(q ? { OR: [{ label: { contains: q, mode: "insensitive" as const } }, { listing: { title: { contains: q, mode: "insensitive" as const } } }] } : {}),
    ...(active === "true" ? { isActive: true } : active === "false" ? { isActive: false } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.promoItem.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { listing: { select: { title: true, status: true } } },
    }),
    prisma.promoItem.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "promo:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = promoCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const d = parsed.data;

  if (d.listingId) {
    const l = await prisma.listing.findUnique({ where: { id: d.listingId }, select: { id: true } });
    if (!l) return NextResponse.json({ error: "Selected listing was not found" }, { status: 400 });
  }
  const item = await prisma.promoItem.create({
    data: {
      label: d.label || null,
      badge: d.badge || null,
      listingId: d.listingId || null,
      customUrl: d.listingId ? null : d.customUrl || null,
      displayOrder: d.displayOrder,
      isActive: d.isActive,
    },
  });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "CREATE", entity: "PromoItem", entityId: item.id, next: JSON.stringify(item) } });
  refreshPublicSite();
  return NextResponse.json(item, { status: 201 });
}
