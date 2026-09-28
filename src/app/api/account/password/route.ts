import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { passwordSchema } from "@/lib/validations";

const schema = z.object({ currentPassword: z.string().min(1, "Enter your current password"), newPassword: passwordSchema });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(`pwchange:${session.user.id}`, 5, 15 * 60_000).ok) {
    return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "Choose a new password that is different from the current one." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  await prisma.auditLog.create({ data: { userId: user.id, action: "CHANGE_PASSWORD", entity: "User", entityId: user.id } });
  return NextResponse.json({ ok: true });
}
