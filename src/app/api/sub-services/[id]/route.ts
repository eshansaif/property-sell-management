import { refreshPublicSite } from "@/lib/revalidate";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { subServiceSchema } from "@/lib/validations";
import { uniqueSlug } from "@/lib/slug";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "subservice:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.subService.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = subServiceSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const data: any = { ...parsed.data };
  if (parsed.data.name && parsed.data.name !== existing.name) {
    data.slug = await uniqueSlug("subService", parsed.data.name, existing.id);
  }

  const updated = await prisma.subService.update({ where: { id: params.id }, data });
  refreshPublicSite();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "subservice:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listingCount = await prisma.listing.count({ where: { subServiceId: params.id } });
  if (listingCount > 0) {
    const archived = await prisma.subService.update({ where: { id: params.id }, data: { status: "ARCHIVED" } });
    refreshPublicSite();
    return NextResponse.json({ archived: true, subService: archived });
  }

  await prisma.subService.delete({ where: { id: params.id } });
  refreshPublicSite();
  return NextResponse.json({ ok: true });
}
