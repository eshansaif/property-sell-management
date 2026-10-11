import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { refreshPublicSite } from "@/lib/revalidate";
import { testimonialSchema } from "@/lib/testimonial-schema";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "testimonial:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.testimonial.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = testimonialSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const d = parsed.data;
  const updated = await prisma.testimonial.update({
    where: { id: params.id },
    data: {
      ...d,
      ...(d.authorRole !== undefined ? { authorRole: d.authorRole || null } : {}),
      ...(d.authorPhoto !== undefined ? { authorPhoto: d.authorPhoto || null } : {}),
      ...(d.rating !== undefined ? { rating: d.rating ?? null } : {}),
    },
  });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "UPDATE", entity: "Testimonial", entityId: updated.id, previous: JSON.stringify(existing), next: JSON.stringify(updated) } });
  refreshPublicSite();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "testimonial:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.testimonial.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.testimonial.delete({ where: { id: params.id } });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: "DELETE", entity: "Testimonial", entityId: params.id, previous: JSON.stringify(existing) } });
  refreshPublicSite();
  return NextResponse.json({ ok: true });
}
