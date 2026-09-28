import { refreshPublicSite } from "@/lib/revalidate";
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
  const q = searchParams.get("q") || undefined;
  const paginate = searchParams.get("page") !== null;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = 20;

  const where: any = {};
  if (serviceId) where.serviceId = serviceId;
  if (q) where.name = { contains: q, mode: "insensitive" };

  if (!paginate) {
    // Unpaginated call (dropdowns in admin forms) — full list for the given service.
    const subServices = await prisma.subService.findMany({
      where,
      orderBy: { displayOrder: "asc" },
      include: { service: { select: { name: true, slug: true } }, _count: { select: { listings: true } } },
    });
    return NextResponse.json(subServices);
  }

  const [items, total] = await Promise.all([
    prisma.subService.findMany({
      where,
      orderBy: { displayOrder: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { service: { select: { name: true, slug: true } }, _count: { select: { listings: true } } },
    }),
    prisma.subService.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
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

  refreshPublicSite();

  return NextResponse.json(sub, { status: 201 });
}
