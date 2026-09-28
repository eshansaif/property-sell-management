import { refreshPublicSite } from "@/lib/revalidate";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import { z } from "zod";

const specSchema = z
  .object({
    serviceId: z.string().cuid().optional().or(z.literal("")),
    subServiceId: z.string().cuid().optional().or(z.literal("")),
    name: z.string().trim().min(1).max(100),
    type: z.enum(["TEXT", "NUMBER", "BOOLEAN", "SELECT", "MULTI_SELECT", "CURRENCY", "MEASUREMENT"]),
    unit: z.string().trim().max(30).optional().or(z.literal("")),
    options: z.array(z.string().trim().min(1).max(80).refine((v) => !v.includes("|"), "Options cannot contain the | character")).max(50).optional(),
    isRequired: z.coerce.boolean().default(false),
    isFilterable: z.coerce.boolean().default(false),
    displayOrder: z.coerce.number().int().default(0),
  })
  .refine((d) => !!d.serviceId || !!d.subServiceId, {
    message: "Attach this specification to a service or a sub-service.",
    path: ["serviceId"],
  });

// Two modes:
//  1. `?subServiceId=X` (no `admin` flag)  → resolve every spec APPLICABLE to that
//     sub-service (its own + its parent service's category-wide ones). Used by the
//     listing create/edit form to render the right dynamic fields.
//  2. `?admin=1`                            → flat, paginated, searchable/filterable
//     list of spec DEFINITIONS for the admin management screen (exact scope match,
//     no inheritance resolution — an admin manages each definition individually).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subServiceId = searchParams.get("subServiceId");
  const isAdmin = searchParams.get("admin") === "1";

  if (isAdmin) {
    const session = await getServerSession(authOptions);
    if (!session || !can(session.user.role, "listing:read")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = searchParams.get("q") || undefined;
    const serviceIdFilter = searchParams.get("serviceId") || undefined;
    const subServiceIdFilter = searchParams.get("subServiceId") || undefined;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = 20;

    const where: any = {};
    if (q) where.name = { contains: q, mode: "insensitive" };
    if (subServiceIdFilter) where.subServiceId = subServiceIdFilter;
    else if (serviceIdFilter) where.serviceId = serviceIdFilter;

    const [items, total] = await Promise.all([
      prisma.specification.findMany({
        where,
        orderBy: [{ serviceId: "asc" }, { subServiceId: "asc" }, { displayOrder: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          service: { select: { name: true } },
          subService: { select: { name: true, service: { select: { name: true } } } },
          _count: { select: { values: true } },
        },
      }),
      prisma.specification.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  }

  if (!subServiceId) return NextResponse.json({ error: "subServiceId is required" }, { status: 400 });

  const sub = await prisma.subService.findUnique({ where: { id: subServiceId } });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const specs = await prisma.specification.findMany({
    where: { OR: [{ subServiceId }, { serviceId: sub.serviceId, subServiceId: null }] },
    orderBy: { displayOrder: "asc" },
  });

  return NextResponse.json(specs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "listing:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = specSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { serviceId, subServiceId, ...rest } = parsed.data;
  const key = toSlug(parsed.data.name);

  // A spec belongs to exactly one scope: a specific sub-service, OR a whole
  // service (applies to every sub-service under it that doesn't override it).
  const spec = await prisma.specification.create({
    data: {
      ...rest,
      key,
      serviceId: subServiceId ? null : serviceId || null,
      subServiceId: subServiceId || null,
    },
  });
  refreshPublicSite();
  return NextResponse.json(spec, { status: 201 });
}
