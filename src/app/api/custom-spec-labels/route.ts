import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

// Most-used free-form spec labels, so editors get consistent wording via autocomplete / quick-add chips.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "listing:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await prisma.listingCustomSpec.groupBy({
    by: ["label"],
    _count: { label: true },
    orderBy: { _count: { label: "desc" } },
    take: 100,
  });
  return NextResponse.json(rows.map((r) => r.label));
}
