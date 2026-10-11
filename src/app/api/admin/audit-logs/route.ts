import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "audit:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp = new URL(req.url).searchParams;
  const entity = sp.get("entity") || undefined;
  const action = sp.get("action") || undefined;
  const q = sp.get("q")?.trim() || undefined;
  const page = Math.max(1, Number(sp.get("page") || 1));
  const pageSize = 25;

  const where = {
    ...(entity ? { entity } : {}),
    ...(action ? { action } : {}),
    ...(q ? { entityId: { contains: q, mode: "insensitive" as const } } : {}),
  };
  const [items, total, entities] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ distinct: ["entity"], select: { entity: true }, orderBy: { entity: "asc" } }),
  ]);
  return NextResponse.json({ items, total, page, pageSize, entities: entities.map((e) => e.entity) });
}
