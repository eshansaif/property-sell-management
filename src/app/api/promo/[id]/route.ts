import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { refreshPublicSite } from "@/lib/revalidate";
import { promoUpdateSchema, promoCreateSchema } from "@/lib/promo-schema";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "promo:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.promoItem.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = promoUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const d = parsed.data;

  // Validate the merged result so a partial update can't leave an item with no destination.
  const merged = {
    label: d.label !== undefined ? d.label : existing.label ?? "",
    badge: d.badge !== undefined ? d.badge : existing.badge ?? "",
    listingId: d.listingId !== undefined ? d.listingId : existing.listingId ?? "",
    customUrl: d.customUrl !== undefined ? d.customUrl : existing.customUrl ?? "",
    displayOrder: d.displayOrder ?? existing.displayOrder,
    isActive: d.isActive ?? existing.isActive,
  };
  const check = promoCreateSchema.safeParse(merged);
  if (!check.success) return NextResponse.json({ error: check.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const m = check.data;

  if (m.listingId) {
    const l = await prisma.listing.findUnique({ where: { id: m.listingId }, select: { id: true } });
    if (!l) return NextResponse.json({ error: "Selected listing was not found" }, { status: 400 });
  }
  const updated = await prisma.promoItem.update({
    where: { id: params.id },
    data: {
      label: m.label || null,
      badge: m.badge || null,
      listingId: m.listingId || null,
      customUrl: m.listingId ? null : m.customUrl || null,
      displayOrder: m.displayOrder,
      isActive: m.isActive,
    },
  });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "UPDATE", entity: "PromoItem", entityId: updated.id, previous: JSON.stringify(existing), next: JSON.stringify(updated) } });
  refreshPublicSite();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "promo:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.promoItem.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.promoItem.delete({ where: { id: params.id } });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "DELETE", entity: "PromoItem", entityId: params.id, previous: JSON.stringify(existing) } });
  refreshPublicSite();
  return NextResponse.json({ ok: true });
}
