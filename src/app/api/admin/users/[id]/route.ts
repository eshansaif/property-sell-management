import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { can, canManageRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { generatePassword } from "@/lib/password-policy";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "STAFF"]).optional(),
  isActive: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "user:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const body = parsed.data;

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const actorRole = session.user.role;
  if (!canManageRole(actorRole, target.role)) {
    return NextResponse.json({ error: "You don't have permission to change this account." }, { status: 403 });
  }
  if (body.role && !canManageRole(actorRole, body.role)) {
    return NextResponse.json({ error: "You don't have permission to assign that role." }, { status: 403 });
  }

  const isSelf = target.id === session.user.id;
  if (isSelf && ((body.role && body.role !== target.role) || body.isActive === false)) {
    return NextResponse.json({ error: "You can't change your own role or deactivate yourself." }, { status: 400 });
  }

  // Never leave the platform without an active Super Admin.
  const losesSuper = target.role === "SUPER_ADMIN" && ((body.role && body.role !== "SUPER_ADMIN") || body.isActive === false);
  if (losesSuper) {
    const others = await prisma.user.count({ where: { role: "SUPER_ADMIN", isActive: true, id: { not: target.id } } });
    if (others === 0) return NextResponse.json({ error: "At least one active Super Admin must remain." }, { status: 400 });
  }

  const data: { name?: string; role?: "SUPER_ADMIN" | "ADMIN" | "STAFF"; isActive?: boolean; passwordHash?: string } = {};
  if (body.name) data.name = body.name;
  if (body.role) data.role = body.role;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  let tempPassword: string | undefined;
  if (body.resetPassword) {
    tempPassword = generatePassword();
    data.passwordHash = await bcrypt.hash(tempPassword, 12);
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: body.resetPassword ? "RESET_PASSWORD" : "UPDATE",
      entity: "User",
      entityId: user.id,
      previous: JSON.stringify({ role: target.role, isActive: target.isActive }),
      next: JSON.stringify({ role: user.role, isActive: user.isActive }),
    },
  });
  return NextResponse.json({ user, tempPassword });
}
