import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validations";
import { uniqueSlug } from "@/lib/slug";

export async function GET() {
  const services = await prisma.service.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { listings: true, subServices: true } } },
  });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "service:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const slug = await uniqueSlug("service", parsed.data.name);
  const service = await prisma.service.create({ data: { ...parsed.data, slug } });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "CREATE", entity: "Service", entityId: service.id, next: JSON.stringify(service) },
  });

  return NextResponse.json(service, { status: 201 });
}
