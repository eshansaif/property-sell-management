import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validations";
import { uniqueSlug } from "@/lib/slug";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const service = await prisma.service.findUnique({
    where: { id: params.id },
    include: { subServices: true, specs: true },
  });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(service);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "service:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.service.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = serviceSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const data: any = { ...parsed.data };
  if (parsed.data.name && parsed.data.name !== existing.name) {
    data.slug = await uniqueSlug("service", parsed.data.name, existing.id);
  }

  const updated = await prisma.service.update({ where: { id: params.id }, data });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entity: "Service",
      entityId: updated.id,
      previous: JSON.stringify(existing),
      next: JSON.stringify(updated),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "service:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.service.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft-guard: archive instead of hard delete if it has listings, to avoid orphaning data.
  const listingCount = await prisma.listing.count({ where: { serviceId: params.id } });
  if (listingCount > 0) {
    const archived = await prisma.service.update({ where: { id: params.id }, data: { status: "ARCHIVED" } });
    return NextResponse.json({ archived: true, service: archived });
  }

  await prisma.service.delete({ where: { id: params.id } });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "DELETE", entity: "Service", entityId: params.id, previous: JSON.stringify(existing) },
  });

  return NextResponse.json({ ok: true });
}
