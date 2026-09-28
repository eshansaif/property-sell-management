import { refreshPublicSite } from "@/lib/revalidate";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  type: z.enum(["TEXT", "NUMBER", "BOOLEAN", "SELECT", "MULTI_SELECT", "CURRENCY", "MEASUREMENT"]).optional(),
  unit: z.string().trim().max(30).optional().or(z.literal("")),
  options: z.array(z.string().trim().min(1).max(80).refine((v) => !v.includes("|"), "Options cannot contain the | character")).max(50).optional(),
  isRequired: z.coerce.boolean().optional(),
  isFilterable: z.coerce.boolean().optional(),
  displayOrder: z.coerce.number().int().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "listing:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const spec = await prisma.specification.findUnique({ where: { id: params.id } });
  if (!spec) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(spec);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "listing:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.specification.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const data: any = { ...parsed.data };
  if (parsed.data.name && parsed.data.name !== existing.name) {
    data.key = toSlug(parsed.data.name);
  }

  const updated = await prisma.specification.update({ where: { id: params.id }, data });
  refreshPublicSite();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "listing:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.specification.findUnique({
    where: { id: params.id },
    include: { _count: { select: { values: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Deleting a specification definition cascades to ListingSpecificationValue
  // (schema: onDelete: Cascade) — warn the caller via response if it's in use,
  // but proceed, matching how the rest of the admin treats hard deletes of
  // definitions vs. content (services/listings archive; definitions can be
  // removed outright since they're structural, not lead data).
  await prisma.specification.delete({ where: { id: params.id } });

  refreshPublicSite();

  return NextResponse.json({ ok: true, hadValues: existing._count.values > 0 });
}
