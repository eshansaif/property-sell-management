import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { testimonialSchema } from "@/lib/testimonial-schema";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { refreshPublicSite } from "@/lib/revalidate";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  if (sp.get("admin") === "1") {
    const session = await getServerSession(authOptions);
    if (!session || !can(session.user.role, "testimonial:read")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const q = sp.get("q")?.trim();
    const active = sp.get("active");
    const page = Math.max(1, Number(sp.get("page") || 1));
    const pageSize = 20;
    const where = {
      ...(q ? { OR: [{ authorName: { contains: q, mode: "insensitive" as const } }, { content: { contains: q, mode: "insensitive" as const } }] } : {}),
      ...(active === "true" ? { isActive: true } : active === "false" ? { isActive: false } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.testimonial.findMany({ where, orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
      prisma.testimonial.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }
  const items = await prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    take: 12,
    select: { id: true, authorName: true, authorRole: true, authorPhoto: true, content: true, rating: true },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "testimonial:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = testimonialSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const d = parsed.data;
  const item = await prisma.testimonial.create({
    data: { ...d, authorRole: d.authorRole || null, authorPhoto: d.authorPhoto || null, rating: d.rating ?? null },
  });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "CREATE", entity: "Testimonial", entityId: item.id, next: JSON.stringify(item) } });
  refreshPublicSite();
  return NextResponse.json(item, { status: 201 });
}
