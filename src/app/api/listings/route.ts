import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { listingSchema } from "@/lib/validations";
import { uniqueSlug } from "@/lib/slug";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const status = searchParams.get("status") || undefined;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = 20;

  const where: any = {};
  if (status) where.status = status;
  if (q) where.title = { contains: q, mode: "insensitive" };

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { service: { select: { name: true } }, subService: { select: { name: true } }, images: { where: { isCover: true }, take: 1 } },
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "listing:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = listingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { specs, ...rest } = parsed.data;

  const slug = await uniqueSlug("listing", rest.title);

  const listing = await prisma.listing.create({
    data: {
      ...rest,
      slug,
      ownerId: session.user.id,
      publishedAt: rest.status === "PUBLISHED" ? new Date() : null,
      specs: specs
        ? {
            create: Object.entries(specs)
              .filter(([, v]) => v !== undefined && v !== "")
              .map(([specificationId, value]) => ({ specificationId, value: String(value) })),
          }
        : undefined,
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "CREATE", entity: "Listing", entityId: listing.id, next: JSON.stringify(listing) },
  });

  return NextResponse.json(listing, { status: 201 });
}
