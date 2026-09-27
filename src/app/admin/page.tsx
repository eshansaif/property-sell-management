import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  const [totalServices, totalListings, activeListings, newInquiries, pendingInquiries, convertedInquiries] =
    await Promise.all([
      prisma.service.count(),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: "PUBLISHED" } }),
      prisma.inquiry.count({ where: { status: "NEW" } }),
      prisma.inquiry.count({ where: { status: { in: ["NEW", "CONTACTED", "IN_PROGRESS", "FOLLOW_UP"] } } }),
      prisma.inquiry.count({ where: { status: "CONVERTED" } }),
    ]);

  const cards = [
    { label: "Total services", value: totalServices },
    { label: "Total listings", value: totalListings },
    { label: "Active listings", value: activeListings },
    { label: "New inquiries", value: newInquiries },
    { label: "Pending inquiries", value: pendingInquiries },
    { label: "Converted", value: convertedInquiries },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-text-primary">Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}</h1>
      <p className="mt-1 text-sm text-text-secondary">Here's what's happening across the platform.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-xs text-text-secondary">{c.label}</p>
            <p className="mt-1 font-display text-3xl text-text-primary">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
