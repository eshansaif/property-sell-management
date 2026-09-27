import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { subServiceSchema } from "@/lib/validations";
import { uniqueSlug } from "@/lib/slug";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId") || undefined;

  const subServices = await prisma.subService.findMany({
    where: serviceId ? { serviceId } : undefined,
    orderBy: { displayOrder: "asc" },
    include: { service: { select: { name: true, slug: true } }, _count: { select: { listings: true } } },
  });
  return NextResponse.json(subServices);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "subservice:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = subServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const slug = await uniqueSlug("subService", parsed.data.name);
  const sub = await prisma.subService.create({ data: { ...parsed.data, slug } });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "CREATE", entity: "SubService", entityId: sub.id, next: JSON.stringify(sub) },
  });

  return NextResponse.json(sub, { status: 201 });
}
