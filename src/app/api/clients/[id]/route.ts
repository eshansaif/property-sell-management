import { refreshPublicSite } from "@/lib/revalidate";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

const websiteUrl = z.string().trim().max(300).refine((v) => v === "" || /^https?:\/\//i.test(v), "Website link must start with http:// or https://");

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  logoUrl: z.string().trim().min(1).optional(),
  websiteUrl: websiteUrl.optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "client:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.client.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.client.update({ where: { id: params.id }, data: parsed.data });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id, action: "UPDATE", entity: "Client", entityId: updated.id,
      previous: JSON.stringify(existing), next: JSON.stringify(updated),
    },
  });

  refreshPublicSite();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "client:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.client.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.client.delete({ where: { id: params.id } });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "DELETE", entity: "Client", entityId: params.id, previous: JSON.stringify(existing) },
  });

  refreshPublicSite();
  return NextResponse.json({ ok: true });
}
