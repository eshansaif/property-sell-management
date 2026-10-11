import { refreshPublicSite } from "@/lib/revalidate";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

const urlRequired = z.string().trim().min(1, "Logo is required");
const websiteUrl = z.string().trim().max(300).refine((v) => v === "" || /^https?:\/\//i.test(v), "Website link must start with http:// or https://");

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  logoUrl: urlRequired,
  websiteUrl: websiteUrl.optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

// Admin listing (all clients, including inactive) when authenticated;
// otherwise the public, active-only list used by the homepage marquee.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const isAdminRequest = new URL(req.url).searchParams.get("admin") === "1";

  if (isAdminRequest) {
    if (!session || !can(session.user.role, "client:read")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const sp = new URL(req.url).searchParams;
    const q = sp.get("q")?.trim();
    const active = sp.get("active");
    const page = Math.max(1, Number(sp.get("page") || 1));
    const pageSize = 20;
    const where = {
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      ...(active === "true" ? { isActive: true } : active === "false" ? { isActive: false } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.client.findMany({ where, orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
      prisma.client.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }

  const items = await prisma.client.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    select: { id: true, name: true, logoUrl: true, websiteUrl: true },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "client:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = clientSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const client = await prisma.client.create({ data: parsed.data });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "CREATE", entity: "Client", entityId: client.id, next: JSON.stringify(client) },
  });

  refreshPublicSite();
  return NextResponse.json(client, { status: 201 });
}
