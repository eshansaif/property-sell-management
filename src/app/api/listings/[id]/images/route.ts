import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  urls: z.array(z.string().trim().url()).max(20),
});

// Replace-all strategy: simplest reliable sync for an admin-managed gallery.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "listing:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid image URLs" }, { status: 400 });

  await prisma.listingImage.deleteMany({ where: { listingId: params.id } });
  await prisma.listingImage.createMany({
    data: parsed.data.urls.map((url, i) => ({
      listingId: params.id,
      url,
      isCover: i === 0,
      sortOrder: i,
    })),
  });

  const images = await prisma.listingImage.findMany({ where: { listingId: params.id }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json(images);
}
