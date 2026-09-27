import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import { z } from "zod";

const specSchema = z.object({
  serviceId: z.string().cuid().optional(),
  subServiceId: z.string().cuid().optional(),
  name: z.string().trim().min(1).max(100),
  type: z.enum(["TEXT", "NUMBER", "BOOLEAN", "SELECT", "MULTI_SELECT", "CURRENCY", "MEASUREMENT"]),
  unit: z.string().trim().max(30).optional().or(z.literal("")),
  options: z.array(z.string()).optional(),
  isRequired: z.coerce.boolean().default(false),
  isFilterable: z.coerce.boolean().default(false),
  displayOrder: z.coerce.number().int().default(0),
});

// Fetch every specification applicable to a sub-service (its own + its parent service's).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subServiceId = searchParams.get("subServiceId");
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

  const key = toSlug(parsed.data.name);
  const spec = await prisma.specification.create({ data: { ...parsed.data, key } });
  return NextResponse.json(spec, { status: 201 });
}
