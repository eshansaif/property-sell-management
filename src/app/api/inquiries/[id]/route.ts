import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { inquiryStatusUpdateSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "inquiry:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: params.id },
    include: {
      listing: { select: { title: true, slug: true } },
      assignee: { select: { id: true, name: true } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      activities: { orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } },
    },
  });

  if (!inquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(inquiry);
}

const patchSchema = z.union([
  inquiryStatusUpdateSchema,
  z.object({ assigneeId: z.string().cuid().nullable() }),
  z.object({ note: z.string().trim().min(1).max(2000) }),
]);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "inquiry:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const userId = session.user.id;

  if ("status" in parsed.data) {
    const inquiry = await prisma.inquiry.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status,
        activities: { create: { type: "STATUS_CHANGED", detail: parsed.data.status, actorId: userId } },
      },
    });
    return NextResponse.json(inquiry);
  }

  if ("assigneeId" in parsed.data) {
    const assigneeUser = parsed.data.assigneeId
      ? await prisma.user.findUnique({ where: { id: parsed.data.assigneeId }, select: { name: true, isActive: true } })
      : null;
    if (parsed.data.assigneeId && (!assigneeUser || !assigneeUser.isActive)) {
      return NextResponse.json({ error: "That team member is not available." }, { status: 400 });
    }
    const inquiry = await prisma.inquiry.update({
      where: { id: params.id },
      data: {
        assigneeId: parsed.data.assigneeId,
        activities: { create: { type: "ASSIGNED", detail: assigneeUser ? `Assigned to ${assigneeUser.name}` : "Unassigned", actorId: userId } },
      },
    });
    return NextResponse.json(inquiry);
  }

  if ("note" in parsed.data) {
    const note = await prisma.inquiryNote.create({
      data: { inquiryId: params.id, content: parsed.data.note, authorId: userId },
    });
    await prisma.inquiryActivity.create({
      data: { inquiryId: params.id, type: "NOTE_ADDED", detail: parsed.data.note.slice(0, 120), actorId: userId },
    });
    return NextResponse.json(note);
  }

  return NextResponse.json({ error: "Invalid input" }, { status: 400 });
}
