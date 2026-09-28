import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { can, canManageRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { passwordSchema } from "@/lib/validations";

const createSchema = z.object({
  name: z.string().trim().min(2, "Please enter a name").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email").max(200),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "STAFF"]),
  password: passwordSchema,
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "user:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const page = Math.max(1, Number(searchParams.get("page") || 1) || 1);
  const pageSize = 20;
  const where = q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] } : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "user:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const data = parsed.data;

  if (!canManageRole(session.user.role, data.role)) {
    return NextResponse.json({ error: "You don't have permission to create that role." }, { status: 403 });
  }
  if (await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } })) {
    return NextResponse.json({ error: "A team member with this email already exists." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, role: data.role, passwordHash: await bcrypt.hash(data.password, 12) },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "CREATE", entity: "User", entityId: user.id, next: JSON.stringify({ email: user.email, role: user.role }) },
  });
  return NextResponse.json(user, { status: 201 });
}
