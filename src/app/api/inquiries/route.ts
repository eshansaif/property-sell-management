import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inquirySchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";

// Public endpoint — no auth required to submit an inquiry.
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const { ok } = rateLimit(`inquiry:${ip}`, 5, 60_000);
    if (!ok) {
      return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = inquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const data = parsed.data;

    // Honeypot: if filled, silently "succeed" without creating a record.
    if (data.company) {
      return NextResponse.json({ ok: true });
    }

    // If a listing is referenced, resolve its service/sub-service server-side
    // rather than trusting client-supplied IDs blindly.
    let serviceId = data.serviceId || undefined;
    let subServiceId = data.subServiceId || undefined;
    let listingId = data.listingId || undefined;

    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { id: true, serviceId: true, subServiceId: true, status: true },
      });
      if (!listing || listing.status !== "PUBLISHED") {
        return NextResponse.json({ error: "This listing is no longer available." }, { status: 400 });
      }
      serviceId = listing.serviceId;
      subServiceId = listing.subServiceId;
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        message: data.message,
        preferredContact: data.preferredContact,
        serviceId,
        subServiceId,
        listingId,
        sourcePage: data.sourcePage,
        ipAddress: ip !== "unknown" ? ip : null,
        userAgent: req.headers.get("user-agent"),
        referrer: req.headers.get("referer"),
        activities: { create: { type: "CREATED", detail: "Inquiry submitted" } },
      },
    });

    return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 });
  } catch (err) {
    console.error("inquiry POST error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// Admin listing of inquiries (used by dashboard client components / SSR).
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "inquiry:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = 20;

  const [items, total] = await Promise.all([
    prisma.inquiry.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { listing: { select: { title: true } }, assignee: { select: { name: true } } },
    }),
    prisma.inquiry.count({ where: status ? { status: status as any } : undefined }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}
