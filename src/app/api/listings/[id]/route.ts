import { refreshPublicSite } from "@/lib/revalidate";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { listingSchema } from "@/lib/validations";
import { uniqueSlug } from "@/lib/slug";
import { validateListingSpecs } from "@/lib/spec-validation";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { images: true, specs: { include: { specification: true } }, customSpecs: { orderBy: { sortOrder: "asc" } } },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(listing);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "listing:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = listingSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { specs, customSpecs, ...rest } = parsed.data;
  const data: any = { ...rest };

  if (rest.title && rest.title !== existing.title) {
    data.slug = await uniqueSlug("listing", rest.title, existing.id);
  }
  if (rest.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
    data.publishedAt = new Date();
  }

  if (specs) {
    const finalStatus = rest.status ?? existing.status;
    const specError = await validateListingSpecs(rest.subServiceId ?? existing.subServiceId, specs, finalStatus === "PUBLISHED");
    if (specError) return NextResponse.json({ error: specError }, { status: 400 });
    await prisma.listingSpecificationValue.deleteMany({ where: { listingId: params.id } });
    data.specs = {
      create: Object.entries(specs)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([specificationId, value]) => ({ specificationId, value: String(value) })),
    };
  }

  if (customSpecs) {
    await prisma.listingCustomSpec.deleteMany({ where: { listingId: params.id } });
    data.customSpecs = {
      create: customSpecs.map((c, i) => ({ group: c.group ?? "", label: c.label, value: c.value, sortOrder: i })),
    };
  }

  const updated = await prisma.listing.update({ where: { id: params.id }, data });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entity: "Listing",
      entityId: updated.id,
      previous: JSON.stringify(existing),
      next: JSON.stringify(updated),
    },
  });

  refreshPublicSite();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "listing:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Soft delete to preserve historical inquiries tied to this listing.
  const archived = await prisma.listing.update({
    where: { id: params.id },
    data: { status: "ARCHIVED", deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "DELETE", entity: "Listing", entityId: params.id },
  });

  refreshPublicSite();

  return NextResponse.json(archived);
}
